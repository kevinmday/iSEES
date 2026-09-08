import { useEffect, useRef, useState, useSyncExternalStore, type FormEvent, type ReactNode } from "react";
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
import "./AccountFrontDoor.css";

type Phase = "restoring" | "anonymous" | "loading-library" | "ready" | "working";

function errorMessage(error: unknown): string {
  return error instanceof AccountFrontDoorError ? error.message : "The request could not be completed. Please try again.";
}

export function AccountFrontDoor({ children }: { children: ReactNode }) {
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
    // Guest-to-account migration is intentionally not part of A20-I5. Stop
    // capture, discard the temporary snapshot, and clear subordinate runtime
    // state before presenting an authenticated ownership path.
    const { ticket } = beginRequest();
    guestWorkspaceSessionLifecycle.stop();
    clearGuestWorkspaceSession();
    operatorIdentityRuntime.clearIdentity();
    coordinator.beginNewPrincipalEpoch();
    if (isCurrent(ticket)) {
      setAnonymousMode(mode);
      showAnonymous("Your guest work was temporary and was not transferred to an account.");
    }
  }

  async function authenticate(mode: "create" | "signin", email: string, password: string) {
    if (commandPending.current) return;
    commandPending.current = true;
    const { ticket, signal } = beginRequest();
    setPhase("working"); setError(""); setActiveInvestigationId(null); coordinator.beginNewPrincipalEpoch();
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
      await loadLibrary(ticket, signal, true);
    } catch (cause) {
      if (isCurrent(ticket)) showAnonymous(errorMessage(cause));
    } finally { commandPending.current = false; }
  }

  async function open(investigationId: string) {
    if (commandPending.current) return;
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
  if (identityState.identity?.kind === "GUEST") return <><GuestBar onAccountEntry={enterAccountDoorFromGuest} />{children}</>;
  if (!principal) return <AnonymousDoor key={anonymousMode} initialMode={anonymousMode} busy={phase === "working"} error={error} onSubmit={authenticate} onContinueAsGuest={continueAsGuest} />;
  return <><AccountBar principal={principal} items={items} activeInvestigationId={activeInvestigationId} phase={phase} error={error} onCreate={create} onOpen={open} onLogout={logout} />{children}</>;
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
