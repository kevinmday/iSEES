/* eslint-disable react-hooks/refs, react-hooks/set-state-in-effect */
import { useEffect, useRef, useState, useSyncExternalStore, type FormEvent, type KeyboardEvent, type MutableRefObject, type ReactNode } from "react";
import { createAccountContinuityApi } from "../investigation/continuity/AccountContinuityApi";
import { AccountWorkspaceContinuityCoordinator } from "../investigation/continuity/AccountWorkspaceContinuityCoordinator";
import { createLastActiveInvestigationStore } from "../investigation/continuity/LastActiveInvestigationStore";
import type { AccountSessionProjection } from "../investigation/continuity/OwnedInvestigationContinuity";
import { workspaceRuntime } from "../workspace/runtime/WorkspaceRuntime";
import { navigateAfterOwnedInvestigationOpen } from "./AccountFrontDoorNavigation";
import { researchBridgeRuntime } from "../research/ResearchBridgeRuntime";
import { authorDocumentRuntime } from "../author/runtime/AuthorDocumentRuntime";
import { operatorIdentityRuntime } from "../identity/runtime/OperatorIdentityRuntime";
import { useOperatorIdentity } from "../identity/runtime/OperatorIdentityRuntimeContext";
import { guestWorkspaceSessionLifecycle } from "../workspace/persistence/GuestWorkspaceSessionLifecycle";
import { clearGuestWorkspaceSession, restoreGuestWorkspaceSession } from "../workspace/persistence/GuestWorkspaceSessionPersistence";
import { guestIdentityFromValidatedSnapshot } from "../workspace/persistence/GuestWorkspaceRestorationPolicy";
import {
  AccountFrontDoorError, createOwnedInvestigation, listOwnedInvestigations,
  readCsrfCookie, requestPasswordRecovery, resetPassword, submitAccount, type OwnedInvestigationSummary,
} from "./AccountFrontDoorApi";
import { captureGuestAdoptionCandidate, GuestPreservationCoordinator, submitGuestAdoption } from "./GuestInvestigationAdoption";
import { captureResetCapability, RESET_PATH } from "./ResetCapability";
import IseesIntroductionGate from "../onboarding/components/IseesIntroductionGate";
import { hasAcknowledgedIseesIntroduction } from "../onboarding/runtime/OnboardingAcknowledgement";
import "./AccountFrontDoor.css";
import { AccountInvestigationLibraryProvider } from "./AccountInvestigationLibraryContext";
import OverviewPresentation from "../workspace/surfaces/overview/OverviewPresentation";
import "../workspace/surfaces/OverviewWorkspace.css";
import { acknowledgeUnifiedPublicOrientation } from "../onboarding/runtime/OnboardingAcknowledgement";
import { requestPublicOverviewIntake, requestPublicOverviewLibrary, requestPublicOverviewNimitzPreview } from "./PublicOverviewLaunchIntent";
import { WorkspaceMode } from "../workspace/runtime/WorkspaceRuntimeTypes";
import { OperationalTopBar } from "../layout/MainLayout";
import { GuidePresentationProvider, useGuidePresentation } from "../guide/presentation/GuidePresentationContext";
import GuidedOrientationDialog from "../guide/components/GuidedOrientationDialog";
import { WorkspaceModeBarPresentation } from "../components/workspace/WorkspaceModeBar";

type Phase = "restoring" | "anonymous" | "loading-library" | "ready" | "working";
const RESET_INVALID_MESSAGE = "This password reset link is invalid or has expired.";

const BOOT_RESET_ROUTE = window.location.pathname === RESET_PATH;
let bootResetCapability = captureResetCapability(window.location, () => {
  window.history.replaceState(null, "", window.location.pathname);
});

function errorMessage(error: unknown): string {
  return error instanceof AccountFrontDoorError ? error.message : "The request could not be completed. Please try again.";
}

export interface AccountNavigationGuard {
  confirmDiscard(): boolean;
}

export function AccountFrontDoor({ children, navigationGuard }: { children: ReactNode; navigationGuard?: MutableRefObject<AccountNavigationGuard | null> }) {
  const identityState = useOperatorIdentity();
  const [resetRoute, setResetRoute] = useState(BOOT_RESET_ROUTE);
  const [resetCapability, setResetCapability] = useState<string | null>(bootResetCapability);
  const [resetConfirmation, setResetConfirmation] = useState("");
  const [openRecovery, setOpenRecovery] = useState(false);
  const [anonymousMode, setAnonymousMode] = useState<"create" | "signin">("signin");
  const [accountEntryFromGuest, setAccountEntryFromGuest] = useState(false);
  const [publicGuestEntry, setPublicGuestEntry] = useState(false);
  const [publicLaunchPending, setPublicLaunchPending] = useState(false);
  const workspaceMode = useSyncExternalStore(callback => workspaceRuntime.subscribe(callback), () => workspaceRuntime.getActiveMode());
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
    setAccountEntryFromGuest(false); setPhase("anonymous"); setError(status);
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
    if (resetRoute) {
      bootResetCapability = null;
      return () => {
        mounted.current = false; generation.current += 1; requestController.current?.abort();
      };
    }
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
      if (hasAcknowledgedIseesIntroduction()) await loadLibrary(ticket, signal, true);
      else if (isCurrent(ticket)) setPhase("ready");
    })();
    return () => {
      mounted.current = false; generation.current += 1; requestController.current?.abort();
      coordinator.cancelPendingRequests();
    };
  }, [coordinator, identityState.status, identityState.identity?.kind, resetRoute]);

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

  function exploreNimitzAsGuest(): void {
    setPublicGuestEntry(true);
    setPublicLaunchPending(true);
    acknowledgeUnifiedPublicOrientation();
    requestPublicOverviewNimitzPreview();
    continueAsGuest();
  }

  function bringCaseAsGuest(): void {
    setPublicGuestEntry(true);
    setPublicLaunchPending(true);
    acknowledgeUnifiedPublicOrientation();
    requestPublicOverviewIntake();
    continueAsGuest();
  }

  function openLibraryAsGuest(): void {
    setPublicGuestEntry(true);
    setPublicLaunchPending(true);
    acknowledgeUnifiedPublicOrientation();
    requestPublicOverviewLibrary();
    continueAsGuest();
  }

  useEffect(() => {
    if (publicLaunchPending && workspaceMode !== WorkspaceMode.OVERVIEW) setPublicLaunchPending(false);
  }, [publicLaunchPending, workspaceMode]);

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
      setAccountEntryFromGuest(true);
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
      } else if (hasAcknowledgedIseesIntroduction()) await loadLibrary(ticket, signal, true);
      else if (isCurrent(ticket)) setPhase("ready");
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
    setAccountEntryFromGuest(false);
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
      if (isCurrent(ticket)) {
        setActiveInvestigationId(receipt.investigationId);
        navigateAfterOwnedInvestigationOpen(workspaceRuntime);
        setPhase("ready");
      }
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
      setActiveInvestigationId(receipt.investigationId);
      setPhase("ready");
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

  function enterAccountWorkspace(): void {
    const { ticket, signal } = beginRequest();
    void loadLibrary(ticket, signal, true);
  }

  function leaveReset(message = "", recover = false): void {
    requestController.current?.abort();
    setResetCapability(null);
    window.history.replaceState(null, "", "/");
    setResetRoute(false);
    setAnonymousMode("signin");
    setResetConfirmation(message);
    setOpenRecovery(recover);
    showAnonymous();
  }

  if (resetRoute) return <PasswordResetDoor capability={resetCapability} onCancel={() => leaveReset("", true)} onComplete={() => leaveReset("Your password has been reset. Sign in with your new password.")} />;
  if (phase === "restoring") return <main className="account-door account-door--center" aria-busy="true"><p role="status">Restoring your researcher account…</p></main>;
  if ((preservation.current.phase === "AWAITING_DECISION" || preservation.current.phase === "PRESERVING" || preservation.current.phase === "RECOVERABLE_ERROR") && principal)
    return <PreservationDecision headingRef={preservationHeading} phase={preservation.current.phase} onPreserve={preserveGuestInvestigation} onDiscard={finishWithoutPreserving} />;
  if (identityState.identity?.kind === "GUEST" && !(publicGuestEntry && !publicLaunchPending && workspaceMode === WorkspaceMode.OVERVIEW)) return <IseesIntroductionGate identityKind="GUEST"><AccountInvestigationLibraryProvider value={{ available: false, items: [], activeInvestigationId: null, busy: false, error: "", create: async () => undefined, open: async () => undefined }}><div className="guest-session-shell"><GuestBar onAccountEntry={enterAccountDoorFromGuest} /><div className="guest-session-shell__workspace">{children}</div></div></AccountInvestigationLibraryProvider></IseesIntroductionGate>;
  if (!principal) return <AnonymousDoor key={`${anonymousMode}-${openRecovery}`} initialMode={anonymousMode} initialRecovery={openRecovery} busy={phase === "working"} error={error} confirmation={resetConfirmation} onSubmit={authenticate} onExploreNimitz={exploreNimitzAsGuest} onOpenLibrary={openLibraryAsGuest} onBringCase={bringCaseAsGuest} onCancelGuestAuthentication={accountEntryFromGuest ? cancelAuthentication : undefined} />;
  const busy = phase === "working" || phase === "loading-library";
  return <IseesIntroductionGate identityKind="ACCOUNT" onEntered={enterAccountWorkspace}><AccountInvestigationLibraryProvider value={{ available: true, items, activeInvestigationId, busy, error, create, open }}><div className="account-authenticated-shell"><AccountBar principal={principal} busy={busy} onLogout={logout} /><div className="account-authenticated-shell__workspace">{children}</div></div></AccountInvestigationLibraryProvider></IseesIntroductionGate>;
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

function AnonymousDoor({ initialMode, initialRecovery, busy, error, confirmation, onSubmit, onExploreNimitz, onOpenLibrary, onBringCase, onCancelGuestAuthentication }: { initialMode: "create" | "signin"; initialRecovery: boolean; busy: boolean; error: string; confirmation: string; onSubmit(mode: "create" | "signin", email: string, password: string): Promise<void>; onExploreNimitz(): void; onOpenLibrary(): void; onBringCase(): void; onCancelGuestAuthentication?: () => void }) {
  const [mode, setMode] = useState<"create" | "signin">(initialMode);
  const [surface, setSurface] = useState<"overview" | "account" | "recovery">(initialRecovery ? "recovery" : onCancelGuestAuthentication ? "account" : "overview");
  const [email, setEmail] = useState("");
  const heading = useRef<HTMLHeadingElement>(null);
  const modal = useRef<HTMLDivElement>(null);
  const invokingButton = useRef<HTMLButtonElement | null>(null);
  useEffect(() => { heading.current?.focus(); }, [surface, mode]);
  useEffect(() => { if (surface === "overview") invokingButton.current?.focus(); }, [surface]);
  function closeAuthentication(): void {
    if (busy) return;
    if (onCancelGuestAuthentication) onCancelGuestAuthentication(); else setSurface("overview");
  }
  function containModalFocus(event: KeyboardEvent<HTMLDivElement>): void {
    if (event.key === "Escape" && !busy) { event.preventDefault(); closeAuthentication(); return; }
    if (event.key !== "Tab") return;
    const controls = Array.from(modal.current?.querySelectorAll<HTMLElement>('button:not([disabled]), input:not([disabled]), [href], [tabindex]:not([tabindex="-1"])') ?? []);
    if (controls.length === 0) return;
    const first = controls[0]!; const last = controls[controls.length - 1]!;
    if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last.focus(); }
    else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first.focus(); }
  }
  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault(); if (busy) return;
    const data = new FormData(event.currentTarget);
    void onSubmit(mode, String(data.get("email")), String(data.get("password")));
  }
  const modalOpen = surface !== "overview";
  return <GuidePresentationProvider><div className="public-overview-shell">
    <div className="public-overview-shell__presentation" aria-hidden={modalOpen || undefined} inert={modalOpen || undefined}>
      <OperationalTopBar status="ACTIVE" mode="OVERVIEW" manifold="ONLINE" guideEntryPoint="orientation" guideRuntime={<PublicOverviewGuideHost onBeginFirstInvestigation={onExploreNimitz} />} />
      <div className="public-overview-shell__workspace"><PublicOverviewPresentation onExploreNimitz={onExploreNimitz} onBringCase={onBringCase} onOpenLibrary={onOpenLibrary} /></div>
      <div className="public-overview-shell__modebar" data-guide-id="shell.workspace-modes"><WorkspaceModeBarPresentation activeMode={WorkspaceMode.OVERVIEW} getModeAvailability={(candidate) => candidate === WorkspaceMode.OVERVIEW || candidate === WorkspaceMode.LIBRARY ? { available: true } : { available: false, reason: "Import or activate an investigation before entering this workspace mode." }} onNavigate={(candidate) => { if (candidate === WorkspaceMode.LIBRARY) onOpenLibrary(); }} /></div>
    </div>
    {modalOpen && <div className="account-door__modal-backdrop"><div ref={modal} className="account-door__modal" role="dialog" aria-modal="true" aria-labelledby={surface === "recovery" ? "recovery-title" : "account-title"} onKeyDown={containModalFocus}>
      {surface === "recovery" ? <RecoveryRequestDoor embedded initialEmail={email} onBack={(preservedEmail) => { setEmail(preservedEmail); setMode("signin"); setSurface("account"); }} /> : <section className="account-door__card"><button className="account-door__modal-close" type="button" disabled={busy} onClick={closeAuthentication} aria-label="Close authentication">×</button><p className="account-door__brand">iSEES</p><h1 id="account-title" ref={heading} tabIndex={-1}>{mode === "create" ? "Create your researcher account" : "Sign in to iSEES"}</h1>{confirmation && <p className="account-door__success" role="status">{confirmation}</p>}<form onSubmit={submit} aria-busy={busy}><label>Email<input name="email" type="email" autoComplete="email" value={email} onChange={event => setEmail(event.target.value)} disabled={busy} required /></label><label>Password<input name="password" type="password" autoComplete={mode === "create" ? "new-password" : "current-password"} minLength={12} disabled={busy} required /></label>{mode === "signin" && <button className="account-door__text-action" type="button" disabled={busy} onClick={() => setSurface("recovery")}>Forgot email or password?</button>}<button className="account-door__primary" disabled={busy}>{busy ? "Please wait…" : mode === "create" ? "Create account" : "Sign in"}</button></form><button className="account-door__secondary" type="button" disabled={busy} onClick={closeAuthentication}>{onCancelGuestAuthentication ? "Back to guest workspace" : "Back to public Overview"}</button><p className="account-door__error" role="alert" aria-live="polite">{error}</p></section>}
    </div></div>}
  </div></GuidePresentationProvider>;
}

function PublicOverviewPresentation({ onExploreNimitz, onBringCase, onOpenLibrary }: { onExploreNimitz(): void; onBringCase(): void; onOpenLibrary(): void }) {
  const guide = useGuidePresentation();
  return <OverviewPresentation primaryActionLabel="EXPLORE THE NIMITZ INVESTIGATION" secondaryActionLabel="BRING YOUR OWN CASE" primaryInvitation={["TRY iSEES AS A GUEST", "NO ACCOUNT REQUIRED"]} primarySupportingText={'Nothing is saved during your guest session.\nOpens a governed Library preview.'} onPrimaryAction={onExploreNimitz} onSecondaryAction={onBringCase} onLibraryAction={onOpenLibrary} onResearchChallengeAction={onExploreNimitz} onGuidedOrientation={invoker => guide.openOrientation(invoker)} onSystemBriefing={() => document.getElementById("overview-flow-title")?.scrollIntoView({ block: "start" })} />;
}

function PublicOverviewGuideHost({ onBeginFirstInvestigation }: { onBeginFirstInvestigation(): void }) {
  const guide = useGuidePresentation();
  if (!guide.isOrientationOpen) return null;
  return <GuidedOrientationDialog activeInvestigationId={undefined} workspaceContextKey="public-overview" onClose={guide.closeGuide} onBeginFirstInvestigation={onBeginFirstInvestigation} />;
}

function RecoveryRequestDoor({ initialEmail, onBack, embedded = false }: { initialEmail: string; onBack(email: string): void; embedded?: boolean }) {
  const [email, setEmail] = useState(initialEmail);
  const [pending, setPending] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const pendingRef = useRef(false);
  const controller = useRef<AbortController | undefined>(undefined);
  const heading = useRef<HTMLHeadingElement>(null);
  useEffect(() => { heading.current?.focus(); return () => { controller.current?.abort(); setEmail(""); }; }, []);
  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault(); if (pendingRef.current) return;
    pendingRef.current = true; setPending(true); setMessage(""); setError("");
    controller.current = new AbortController();
    try { const accepted = await requestPasswordRecovery(email, controller.current.signal); setMessage(accepted.message); }
    catch { if (!controller.current.signal.aborted) setError("Recovery instructions could not be requested. Please try again."); }
    finally { pendingRef.current = false; setPending(false); }
  }
  const content = <section className="account-door__card" aria-labelledby="recovery-title" aria-busy={pending}><p className="account-door__brand">iSEES</p><h1 id="recovery-title" ref={heading} tabIndex={-1}>Recover your iSEES account</h1><form onSubmit={submit}><label htmlFor="recovery-email">Email</label><input id="recovery-email" name="email" type="email" autoComplete="email" value={email} onChange={event => setEmail(event.target.value)} disabled={pending} required /><button className="account-door__primary" disabled={pending}>{pending ? "Sending recovery instructions…" : "Send recovery instructions"}</button></form>{pending && <p role="status">Sending recovery instructions…</p>}{message && <p className="account-door__success" role="status">{message}</p>}<p className="account-door__error" role="alert">{error}</p><button className="account-door__secondary" type="button" disabled={pending} onClick={() => onBack(email)}>Back to sign in</button><div className="account-door__guidance"><strong>Forgot your email?</strong><p>Your iSEES login is the email address used to create your researcher account. If you do not remember it, use the same verified contact channel used for your tester invitation.</p></div></section>;
  return embedded ? content : <main className="account-door">{content}</main>;
}

function PasswordResetDoor({ capability, onCancel, onComplete }: { capability: string | null; onCancel(): void; onComplete(): void }) {
  const [token, setToken] = useState(capability);
  const [password, setPassword] = useState(""); const [confirmation, setConfirmation] = useState("");
  const [pending, setPending] = useState(false); const [error, setError] = useState(token ? "" : RESET_INVALID_MESSAGE);
  const pendingRef = useRef(false); const controller = useRef<AbortController | undefined>(undefined); const heading = useRef<HTMLHeadingElement>(null);
  useEffect(() => { heading.current?.focus(); return () => { controller.current?.abort(); }; }, []);
  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault(); if (pendingRef.current || !token) return;
    if (password !== confirmation) { setError("The passwords do not match."); return; }
    pendingRef.current = true; setPending(true); setError(""); controller.current = new AbortController();
    try {
      const result = await resetPassword(token, password, controller.current.signal);
      if (result.status === "INVALID") { setToken(null); setPassword(""); setConfirmation(""); setError(RESET_INVALID_MESSAGE); }
      else { setToken(null); setPassword(""); setConfirmation(""); onComplete(); }
    } catch { if (!controller.current.signal.aborted) setError("The password could not be reset. Please try again."); }
    finally { pendingRef.current = false; setPending(false); }
  }
  const invalid = !token;
  return <main className="account-door"><section className="account-door__card" aria-labelledby="reset-title" aria-busy={pending}><p className="account-door__brand">iSEES</p><h1 id="reset-title" ref={heading} tabIndex={-1}>Reset your iSEES password</h1>{invalid ? <><p className="account-door__error" role="alert">{RESET_INVALID_MESSAGE}</p><button className="account-door__primary" type="button" onClick={onCancel}>Request another recovery email</button></> : <form onSubmit={submit}><p className="account-door__requirement">Use at least 12 characters.</p><label htmlFor="new-password">New password</label><input id="new-password" type="password" autoComplete="new-password" minLength={12} maxLength={1024} value={password} onChange={event => setPassword(event.target.value)} disabled={pending} required /><label htmlFor="confirm-new-password">Confirm new password</label><input id="confirm-new-password" type="password" autoComplete="new-password" minLength={12} maxLength={1024} value={confirmation} onChange={event => setConfirmation(event.target.value)} disabled={pending} required aria-describedby={error === "The passwords do not match." ? "reset-error" : undefined} aria-invalid={error === "The passwords do not match."} /><button className="account-door__primary" disabled={pending}>{pending ? "Resetting password…" : "Reset password"}</button><p id="reset-error" className="account-door__error" role="alert">{error}</p>{pending && <p role="status">Resetting password…</p>}</form>}</section></main>;
}

function GuestBar({ onAccountEntry }: { onAccountEntry(mode: "create" | "signin"): void }) {
  const lifecycle = useSyncExternalStore(guestWorkspaceSessionLifecycle.subscribe.bind(guestWorkspaceSessionLifecycle), () => guestWorkspaceSessionLifecycle.getState());
  return <aside className="guest-session-bar" aria-label="Guest session status"><div className="guest-session-bar__message"><p><strong>iSEES Guest session</strong> — your work is not being saved. Create an account to preserve this investigation.</p>{lifecycle.recoveryNotice && <p className="guest-session-bar__recovery" role="alert">{lifecycle.recoveryNotice}</p>}</div><div><button type="button" onClick={() => onAccountEntry("signin")}>Sign in</button><button type="button" onClick={() => onAccountEntry("create")}>Create account</button></div></aside>;
}

function AccountBar({ principal, busy, onLogout }: { principal: AccountSessionProjection; busy: boolean; onLogout(): Promise<void> }) {
  return <aside className="account-library" aria-label="Researcher account"><header><div><span>Researcher account</span><strong>{principal.email}</strong></div><button type="button" disabled={busy} onClick={() => void onLogout()}>Sign out</button></header></aside>;
}
