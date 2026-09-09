import { useEffect, useRef, useState, useSyncExternalStore, type FormEvent, type MutableRefObject, type ReactNode } from "react";
import { createAccountContinuityApi } from "../investigation/continuity/AccountContinuityApi";
import { AccountWorkspaceContinuityCoordinator } from "../investigation/continuity/AccountWorkspaceContinuityCoordinator";
import { createLastActiveInvestigationStore } from "../investigation/continuity/LastActiveInvestigationStore";
import type { AccountSessionProjection } from "../investigation/continuity/OwnedInvestigationContinuity";
import { workspaceRuntime } from "../workspace/runtime/WorkspaceRuntime";
import { researchBridgeRuntime } from "../research/ResearchBridgeRuntime";
import { authorDocumentRuntime } from "../author/runtime/AuthorDocumentRuntime";
import { operatorIdentityRuntime } from "../identity/runtime/OperatorIdentityRuntime";
import { useOperatorIdentity } from "../identity/runtime/OperatorIdentityRuntimeContext";
import { guestWorkspaceSessionLifecycle } from "../workspace/persistence/GuestWorkspaceSessionLifecycle";
import { clearGuestWorkspaceSession, restoreGuestWorkspaceSession } from "../workspace/persistence/GuestWorkspaceSessionPersistence";
import { guestIdentityFromValidatedSnapshot } from "../workspace/persistence/GuestWorkspaceRestorationPolicy";
import {
  AccountFrontDoorError, createOwnedInvestigation, listOwnedInvestigations,
  readCsrfCookie, submitAccount, type OwnedInvestigationSummary,
} from "./AccountFrontDoorApi";
import { captureGuestAdoptionCandidate, GuestPreservationCoordinator, submitGuestAdoption } from "./GuestInvestigationAdoption";
import "./AccountFrontDoor.css";

type Phase = "restoring" | "anonymous" | "loading-library" | "ready" | "working";

function errorMessage(error: unknown): string {
  return error instanceof AccountFrontDoorError ? error.message : "The request could not be completed. Please try again.";
}

export interface AccountNavigationGuard {
  confirmDiscard(): boolean;
}

export function AccountFrontDoor({ children, navigationGuard }: { children: ReactNode; navigationGuard?: MutableRefObject<AccountNavigationGuard | null> }) {
  const identityState = useOperatorIdentity();
  const [anonymousMode, setAnonymousMode] = useState<"create" | "signin">("signin");
  const [phase, setPhase] = useState<Phase>("restoring");
  const [principal, setPrincipal] = useState<AccountSessionProjection | null>(null);
  const [items, setItems] = useState<readonly OwnedInvestigationSummary[]>([]);
  const [activeInvestigationId, setActiveInvestigationId] = useState<string | null>(null);
  const [error, setError] = useState("");
  const mounted = useRef(true);
  const generation = useRef(0);
  const commandPending = useRef(false);
  const requestController = useRef<AbortController | undefined>(undefined);
  const preservation = useRef(new GuestPreservationCoordinator());
  const [, renderPreservation] = useState(0);
  const preservationHeading = useRef<HTMLHeadingElement>(null);
  const [coordinator] = useState(() => new AccountWorkspaceContinuityCoordinator(
    createAccountContinuityApi(), workspaceRuntime, createLastActiveInvestigationStore(),
    [researchBridgeRuntime, authorDocumentRuntime],
  ));

  function beginRequest(): { readonly ticket: number; readonly signal: AbortSignal } {
    requestController.current?.abort();
    const controller = new AbortController();
    requestController.current = controller;
    return { ticket: ++generation.current, signal: controller.signal };
  }
  function isCurrent(ticket: number): boolean { return mounted.current && ticket === generation.current; }
  function showAnonymous(status = ""): void {
    operatorIdentityRuntime.clearIdentity();
    setPrincipal(null); setItems([]); setActiveInvestigationId(null);
    setPhase("anonymous"); setError(status);
  }
  function handleFailure(cause: unknown, ticket: number, fallbackPhase: Phase): void {
    if (!isCurrent(ticket)) return;
    if (coordinator.getState().principal === null || (cause instanceof AccountFrontDoorError && cause.code === "SESSION")) {
      coordinator.beginNewPrincipalEpoch();
      showAnonymous("Your session has ended. Please sign in again.");
      return;
    }
    setPhase(fallbackPhase); setError(errorMessage(cause));
  }

  async function loadLibrary(ticket: number, signal: AbortSignal, restore: boolean): Promise<void> {
    setPhase("loading-library"); setError("");
    try {
      const owned = await listOwnedInvestigations(signal);
      if (!isCurrent(ticket)) return;
      setItems(owned);
      if (restore) {
        try {
          const receipt = await coordinator.restoreLastActiveInvestigation();
          if (!isCurrent(ticket)) return;
          setActiveInvestigationId(receipt?.investigationId ?? null);
          if (!receipt && coordinator.getState().code === "ACTIVATION_INVALID") setError("Your saved investigation could not be restored safely. Your library is still available.");
        } catch {
          if (!isCurrent(ticket)) return;
          if (coordinator.getState().principal === null) {
            showAnonymous("Your session has ended. Please sign in again.");
            return;
          }
          setError("Your last investigation could not be restored. Your library is still available.");
        }
      }
      if (isCurrent(ticket)) setPhase("ready");
    } catch (cause) { handleFailure(cause, ticket, "ready"); }
  }

  useEffect(() => {
    mounted.current = true;
    if (identityState.status !== "READY") {
      return () => {
        mounted.current = false; generation.current += 1; requestController.current?.abort();
        coordinator.cancelPendingRequests();
      };
    }
    if (identityState.identity?.kind === "GUEST") {
      setPhase("ready"); setError("");
      return () => {
        mounted.current = false; generation.current += 1; requestController.current?.abort();
        coordinator.cancelPendingRequests();
      };
    }
    const { ticket, signal } = beginRequest();
    void (async () => {
      const restored = await coordinator.restoreSession();
      if (!isCurrent(ticket)) return;
      if (!restored) {
        if (operatorIdentityRuntime.getState().identity?.kind === "GUEST") {
          setPhase("ready"); setError("");
        } else showAnonymous();
        return;
      }
      operatorIdentityRuntime.establishAuthenticatedAccount(restored.researcherId);
      setPrincipal(restored);
      await loadLibrary(ticket, signal, true);
    })();
    return () => {
      mounted.current = false; generation.current += 1; requestController.current?.abort();
      coordinator.cancelPendingRequests();
    };
  }, [coordinator, identityState.status, identityState.identity?.kind]);

  function continueAsGuest(): void {
    const { ticket } = beginRequest();
    coordinator.cancelPendingRequests();
    if (!isCurrent(ticket)) return;
    const persistedWorkspace = restoreGuestWorkspaceSession();
    if (persistedWorkspace.status === "INVALID") {
      guestWorkspaceSessionLifecycle.noteRejectedSnapshotBeforeGuestStart();
    }
    const recoveredIdentity = guestIdentityFromValidatedSnapshot(persistedWorkspace);
    operatorIdentityRuntime.continueAsGuest(recoveredIdentity);
    setPrincipal(null); setItems([]); setActiveInvestigationId(null);
    setPhase("ready"); setError("");
  }

  function enterAccountDoorFromGuest(mode: "create" | "signin"): void {
    const { ticket } = beginRequest();
    try {
      const snapshot = workspaceRuntime.getState().session.investigation ? guestWorkspaceSessionLifecycle.captureNow() : null;
      preservation.current.capture(snapshot ? captureGuestAdoptionCandidate(snapshot) : null);
    } catch {
      setError("This guest investigation contains work that cannot be preserved safely yet.");
      return;
    }
    guestWorkspaceSessionLifecycle.stop(); // freeze the validated snapshot; storage and runtimes remain intact
    operatorIdentityRuntime.clearIdentity();
    coordinator.cancelPendingRequests();
    if (isCurrent(ticket)) {
      setAnonymousMode(mode);
      setPrincipal(null); setItems([]); setActiveInvestigationId(null); setPhase("anonymous"); setError("");
      renderPreservation(value => value + 1);
    }
  }

  async function authenticate(mode: "create" | "signin", email: string, password: string) {
    if (commandPending.current) return;
    commandPending.current = true;
    const { ticket, signal } = beginRequest();
    setPhase("working"); setError(""); setActiveInvestigationId(null);
    if (!preservation.current.candidate) coordinator.beginNewPrincipalEpoch();
    else preservation.current.authenticating();
    try {
      await submitAccount(mode, email, password, signal);
      const restored = await coordinator.restoreSession();
      if (!isCurrent(ticket)) return;
      if (!restored) {
        showAnonymous("Your account was accepted, but its secure session could not be restored. Please sign in again.");
        return;
      }
      operatorIdentityRuntime.establishAuthenticatedAccount(restored.researcherId);
      setPrincipal(restored);
      if (preservation.current.candidate) {
        preservation.current.authenticated(); setPhase("ready"); renderPreservation(value => value + 1);
      } else await loadLibrary(ticket, signal, true);
    } catch (cause) {
      if (isCurrent(ticket)) showAnonymous(errorMessage(cause));
    } finally { commandPending.current = false; }
  }

  function cancelAuthentication(): void {
    const candidate = preservation.current.candidate;
    preservation.current.cancel();
    requestController.current?.abort(); coordinator.cancelPendingRequests();
    if (candidate) {
      operatorIdentityRuntime.continueAsGuest({ ...candidate.snapshot.ownership });
      guestWorkspaceSessionLifecycle.start();
      setPrincipal(null); setPhase("ready"); setError(""); renderPreservation(value => value + 1);
    } else continueAsGuest();
  }

  async function finishWithoutPreserving(): Promise<void> {
    preservation.current.discard(); renderPreservation(value => value + 1);
    guestWorkspaceSessionLifecycle.stop(); clearGuestWorkspaceSession();
    workspaceRuntime.deactivate(); researchBridgeRuntime.clearAccountState(); authorDocumentRuntime.clearAccountState();
    const { ticket, signal } = beginRequest(); await loadLibrary(ticket, signal, true);
  }

  async function preserveGuestInvestigation(): Promise<void> {
    await preservation.current.preserve(async (candidate, signal) => {
      const receipt = await submitGuestAdoption(candidate.command, readCsrfCookie(), signal);
      const activation = receipt.activation as { investigationId?: unknown; operationalState?: unknown };
      if (activation.investigationId !== receipt.investigationId || !activation.operationalState) throw new Error("ADOPTION_INVALID");
      const original = candidate.snapshot.workspace.investigation!;
      const restored = await coordinator.openOwnedInvestigation(receipt.investigationId);
      if (restored.investigationId !== receipt.investigationId) throw new Error("ADOPTION_INVALID");
      setActiveInvestigationId(restored.investigationId);
      setItems(previous => Object.freeze([{ investigationId: receipt.investigationId, title: original.name, modifiedAt: new Date().toISOString() }, ...previous.filter(item => item.investigationId !== receipt.investigationId)]));
      guestWorkspaceSessionLifecycle.stop(); clearGuestWorkspaceSession();
    });
    renderPreservation(value => value + 1);
    if (preservation.current.phase === "OWNED_ACTIVE") { preservation.current.discard(); setPhase("ready"); }
  }

  useEffect(() => { if (preservation.current.phase === "AWAITING_DECISION" || preservation.current.phase === "RECOVERABLE_ERROR") preservationHeading.current?.focus(); });

  async function open(investigationId: string) {
    if (commandPending.current) return;
    if (navigationGuard?.current && !navigationGuard.current.confirmDiscard()) return;
    commandPending.current = true;
    const { ticket } = beginRequest(); setPhase("working"); setError("");
    try {
      const receipt = await coordinator.openOwnedInvestigation(investigationId);
      if (isCurrent(ticket)) { setActiveInvestigationId(receipt.investigationId); setPhase("ready"); }
    } catch (cause) { handleFailure(cause, ticket, "ready"); }
    finally { commandPending.current = false; }
  }

  async function create(title: string) {
    if (commandPending.current) return;
    if (navigationGuard?.current && !navigationGuard.current.confirmDiscard()) return;
    commandPending.current = true;
    const { ticket, signal } = beginRequest(); setPhase("working"); setError("");
    try {
      const created = await createOwnedInvestigation(title, crypto.randomUUID(), readCsrfCookie(), signal);
      if (!isCurrent(ticket)) return;
      setItems(previous => Object.freeze([created, ...previous.filter(item => item.investigationId !== created.investigationId)]));
      const receipt = await coordinator.openOwnedInvestigation(created.investigationId);
      if (!isCurrent(ticket)) return;
      setActiveInvestigationId(receipt.investigationId); setPhase("ready");
    } catch (cause) { handleFailure(cause, ticket, "ready"); }
    finally { commandPending.current = false; }
  }

  async function logout() {
    if (commandPending.current) return;
    if (navigationGuard?.current && !navigationGuard.current.confirmDiscard()) return;
    commandPending.current = true;
    const { ticket } = beginRequest(); setPhase("working"); setError("");
    try {
      await coordinator.logout(readCsrfCookie());
      if (isCurrent(ticket)) showAnonymous();
    } catch (cause) {
      coordinator.beginNewPrincipalEpoch();
      if (isCurrent(ticket)) showAnonymous(errorMessage(cause));
    } finally { commandPending.current = false; }
  }

  if (phase === "restoring") return <main className="account-door account-door--center" aria-busy="true"><p role="status">Restoring your researcher account…</p></main>;
  if ((preservation.current.phase === "AWAITING_DECISION" || preservation.current.phase === "PRESERVING" || preservation.current.phase === "RECOVERABLE_ERROR") && principal)
    return <PreservationDecision headingRef={preservationHeading} phase={preservation.current.phase} onPreserve={preserveGuestInvestigation} onDiscard={finishWithoutPreserving} />;
  if (identityState.identity?.kind === "GUEST") return <><GuestBar onAccountEntry={enterAccountDoorFromGuest} />{children}</>;
  if (!principal) return <AnonymousDoor key={anonymousMode} initialMode={anonymousMode} busy={phase === "working"} error={error} onSubmit={authenticate} onContinueAsGuest={preservation.current.candidate ? cancelAuthentication : continueAsGuest} />;
  return <div className="account-authenticated-shell"><AccountBar principal={principal} items={items} activeInvestigationId={activeInvestigationId} phase={phase} error={error} onCreate={create} onOpen={open} onLogout={logout} /><div className="account-authenticated-shell__workspace">{children}</div></div>;
}

function PreservationDecision({ headingRef, phase, onPreserve, onDiscard }: { headingRef: React.RefObject<HTMLHeadingElement | null>; phase: string; onPreserve(): Promise<void>; onDiscard(): Promise<void> }) {
  const pending = phase === "PRESERVING"; const failed = phase === "RECOVERABLE_ERROR";
  return <main className="account-door"><section className="account-door__card" role="dialog" aria-modal="true" aria-labelledby="preservation-title" aria-busy={pending}>
    <p className="account-door__brand">iSEES</p><h1 id="preservation-title" ref={headingRef} tabIndex={-1}>Preserve your guest investigation?</h1>
    <p>You created this investigation while using iSEES as a guest. Save it to your researcher account so it will be available when you return.</p>
    {failed && <p className="account-door__error" role="alert">We couldn’t preserve this investigation yet. Your temporary guest work is still available.</p>}
    {pending && <p role="status">Preserving investigation…</p>}
    <div className="account-door__decision"><button className="account-door__primary" type="button" disabled={pending} onClick={() => void onPreserve()}>{failed ? "Try again" : "Preserve investigation"}</button>
      <button type="button" disabled={pending} onClick={() => void onDiscard()}>Continue without preserving</button></div>
  </section></main>;
}

function AnonymousDoor({ initialMode, busy, error, onSubmit, onContinueAsGuest }: { initialMode: "create" | "signin"; busy: boolean; error: string; onSubmit(mode: "create" | "signin", email: string, password: string): Promise<void>; onContinueAsGuest(): void }) {
  const [mode, setMode] = useState<"create" | "signin">(initialMode);
  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault(); if (busy) return;
    const data = new FormData(event.currentTarget);
    void onSubmit(mode, String(data.get("email")), String(data.get("password")));
  }
  return <main className="account-door"><section className="account-door__card" aria-labelledby="account-title"><p className="account-door__brand">iSEES</p><h1 id="account-title">Your research begins here.</h1><p>Sign in for private, durable investigations, create an account, or use the complete workspace as a guest.</p><div className="account-door__tabs"><button type="button" disabled={busy} aria-pressed={mode === "signin"} onClick={() => setMode("signin")}>Sign in</button><button type="button" disabled={busy} aria-pressed={mode === "create"} onClick={() => setMode("create")}>Create account</button></div><form onSubmit={submit} aria-busy={busy}><label>Email<input name="email" type="email" autoComplete="email" disabled={busy} required /></label><label>Password<input name="password" type="password" autoComplete={mode === "create" ? "new-password" : "current-password"} minLength={12} disabled={busy} required /></label><button className="account-door__primary" disabled={busy}>{busy ? "Please wait…" : mode === "create" ? "Create account" : "Sign in"}</button></form><div className="account-door__guest"><button type="button" disabled={busy} onClick={onContinueAsGuest}>Continue as guest</button><p>Explore the complete iSEES workspace. Your work will not be saved after this guest session.</p></div><p className="account-door__error" role="alert" aria-live="polite">{error}</p></section></main>;
}

function GuestBar({ onAccountEntry }: { onAccountEntry(mode: "create" | "signin"): void }) {
  const lifecycle = useSyncExternalStore(guestWorkspaceSessionLifecycle.subscribe.bind(guestWorkspaceSessionLifecycle), () => guestWorkspaceSessionLifecycle.getState());
  return <aside className="guest-session-bar" aria-label="Guest session status"><div className="guest-session-bar__message"><p><strong>iSEES Guest session</strong> — your work is not being saved. Create an account to preserve this investigation.</p>{lifecycle.recoveryNotice && <p className="guest-session-bar__recovery" role="alert">{lifecycle.recoveryNotice}</p>}</div><div><button type="button" onClick={() => onAccountEntry("signin")}>Sign in</button><button type="button" onClick={() => onAccountEntry("create")}>Create account</button></div></aside>;
}

function AccountBar({ principal, items, activeInvestigationId, phase, error, onCreate, onOpen, onLogout }: { principal: AccountSessionProjection; items: readonly OwnedInvestigationSummary[]; activeInvestigationId: string | null; phase: Phase; error: string; onCreate(title: string): Promise<void>; onOpen(id: string): Promise<void>; onLogout(): Promise<void> }) {
  const busy = phase === "working" || phase === "loading-library";
  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault(); if (busy) return;
    const form = event.currentTarget; const title = String(new FormData(form).get("title")).trim();
    if (title) { void onCreate(title); form.reset(); }
  }
  return <aside className="account-library" aria-label="Researcher account and investigation library"><header><div><span>Researcher account</span><strong>{principal.email}</strong></div><button type="button" disabled={busy} onClick={() => void onLogout()}>Sign out</button></header><details open={!activeInvestigationId}><summary>Your investigations ({items.length})</summary><form className="account-library__create" onSubmit={submit} aria-busy={busy}><label htmlFor="new-investigation-title">Investigation title</label><div><input id="new-investigation-title" name="title" maxLength={200} disabled={busy} required /><button className="account-door__primary" disabled={busy}>Create investigation</button></div></form>{phase === "loading-library" ? <p role="status">Loading your investigations…</p> : items.length === 0 ? <p>You have no investigations yet. Create one when you’re ready to begin.</p> : <ul>{items.map(item => <li key={item.investigationId}><span>{item.title}</span><button type="button" disabled={busy} onClick={() => void onOpen(item.investigationId)}>{activeInvestigationId === item.investigationId ? "Continue investigation" : "Open investigation"}</button></li>)}</ul>}<p className="account-door__error" role="alert" aria-live="polite">{error}</p></details></aside>;
}
