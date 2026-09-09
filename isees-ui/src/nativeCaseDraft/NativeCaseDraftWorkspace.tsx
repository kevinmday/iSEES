import { useCallback, useEffect, useRef, useState, type MutableRefObject } from "react";
import { useBlocker } from "react-router-dom";
import type { AccountNavigationGuard } from "../account/AccountFrontDoor";
import { useOperatorIdentity } from "../identity/runtime/OperatorIdentityRuntimeContext";
import { useActiveInvestigation } from "../workspace/runtime/WorkspaceRuntimeContext";
import { nativeCaseDraftApi } from "./NativeCaseDraftApi";
import { NativeCaseDraftEditor } from "./NativeCaseDraftEditor";
import { NativeCaseDraftClientError, type NativeCaseDraftProjection } from "./NativeCaseDraftTypes";
import type { NativeCaseDraftCoordinatorState } from "./NativeCaseDraftCoordinator";
import "./NativeCaseDraftWorkspace.css";

type View = { readonly kind: "list" } | { readonly kind: "new" } | { readonly kind: "existing"; readonly projection: NativeCaseDraftProjection };
type LoadState = "idle" | "loading" | "ready" | "error";

const discardMessage = "Discard your unsaved native case draft changes?";
const describeError = (cause: unknown, action: string) => cause instanceof NativeCaseDraftClientError
  ? `${action} (${cause.kind.toLowerCase().replaceAll("_", " ")}): ${cause.message}`
  : `${action}: the native case draft service could not be reached.`;

export function NativeCaseDraftWorkspace({ navigationGuard }: { navigationGuard: MutableRefObject<AccountNavigationGuard | null> }) {
  const investigation = useActiveInvestigation();
  const identity = useOperatorIdentity();
  const authenticated = identity.status === "READY" && identity.identity?.kind === "ACCOUNT";
  const investigationId = authenticated ? investigation?.id ?? null : null;
  const [view, setView] = useState<View>({ kind: "list" });
  const [drafts, setDrafts] = useState<readonly NativeCaseDraftProjection[]>([]);
  const [listState, setListState] = useState<LoadState>("idle");
  const [openState, setOpenState] = useState<LoadState>("idle");
  const [error, setError] = useState("");
  const [dirty, setDirty] = useState(false);
  const [saved, setSaved] = useState(false);
  const generation = useRef(0);
  const controller = useRef<AbortController | null>(null);
  const failedCandidateId = useRef<string | null>(null);
  const activeInvestigation = useRef(investigationId);

  const confirmDiscard = useCallback(() => !dirty || window.confirm(discardMessage), [dirty]);
  const blocker = useBlocker(dirty);

  useEffect(() => {
    navigationGuard.current = dirty ? { confirmDiscard } : null;
    return () => { navigationGuard.current = null; };
  }, [confirmDiscard, dirty, navigationGuard]);

  useEffect(() => {
    if (blocker.state !== "blocked") return;
    if (window.confirm(discardMessage)) blocker.proceed();
    else blocker.reset();
  }, [blocker]);

  useEffect(() => {
    if (!dirty) return;
    const guardUnload = (event: BeforeUnloadEvent) => { event.preventDefault(); event.returnValue = ""; };
    window.addEventListener("beforeunload", guardUnload);
    return () => window.removeEventListener("beforeunload", guardUnload);
  }, [dirty]);

  const begin = () => {
    controller.current?.abort();
    const request = new AbortController();
    controller.current = request;
    return { ticket: ++generation.current, signal: request.signal };
  };
  const current = (ticket: number) => ticket === generation.current;

  const loadList = useCallback(async (id: string) => {
    const { ticket, signal } = begin();
    setListState("loading"); setError("");
    try {
      const result = await nativeCaseDraftApi.list(signal);
      if (!current(ticket)) return;
      setDrafts(Object.freeze(result.items.filter(item => item.investigationId === id)));
      setListState("ready");
    } catch (cause) {
      if (!current(ticket) || cause instanceof NativeCaseDraftClientError && cause.kind === "ABORTED") return;
      setError(describeError(cause, "Drafts could not be loaded")); setListState("error");
    }
  }, []);

  useEffect(() => {
    if (activeInvestigation.current !== investigationId) {
      activeInvestigation.current = investigationId;
      setView({ kind: "list" }); setDirty(false); setSaved(false); setDrafts([]);
    }
    if (investigationId) void loadList(investigationId);
    else { controller.current?.abort(); generation.current += 1; setListState("idle"); setDrafts([]); }
    return () => { controller.current?.abort(); generation.current += 1; };
  }, [investigationId, loadList]);

  async function openDraft(candidateId: string) {
    if (!confirmDiscard() || !investigationId) return;
    const { ticket, signal } = begin();
    failedCandidateId.current = candidateId;
    setOpenState("loading"); setError("");
    try {
      const projection = await nativeCaseDraftApi.get(candidateId, signal);
      if (!current(ticket)) return;
      if (projection.investigationId !== investigationId) {
        setError("Draft could not be opened: its investigation association does not match the active investigation.");
        setOpenState("error"); return;
      }
      setView({ kind: "existing", projection }); setDirty(false); setSaved(false); setOpenState("ready");
      failedCandidateId.current = null;
    } catch (cause) {
      if (!current(ticket) || cause instanceof NativeCaseDraftClientError && cause.kind === "ABORTED") return;
      setError(describeError(cause, "Draft could not be opened")); setOpenState("error");
    }
  }

  function returnToList() {
    if (!confirmDiscard()) return;
    setView({ kind: "list" }); setDirty(false); setOpenState("idle");
    if (investigationId) void loadList(investigationId);
  }

  if (!authenticated) return <main className="native-draft-workspace" aria-labelledby="native-draft-heading"><h1 id="native-draft-heading">Native case drafts</h1><p role="status">Sign in to a researcher account above to work with private native case drafts.</p></main>;
  if (!investigationId) return <main className="native-draft-workspace" aria-labelledby="native-draft-heading"><h1 id="native-draft-heading">Native case drafts</h1><p role="status">Select or create an owned investigation above to view its drafts.</p></main>;

  if (view.kind !== "list") return <main className="native-draft-workspace native-draft-workspace--editor">
    <nav aria-label="Native case draft navigation"><button type="button" onClick={returnToList}>Return to draft list</button></nav>
    {saved && <p className="native-draft-workspace__notice" role="status">Draft saved. Return to the list when you are ready.</p>}
    <NativeCaseDraftEditor
      api={nativeCaseDraftApi}
      {...(view.kind === "new" ? { investigationId } : { initialProjection: view.projection })}
      confirmDiscard={() => window.confirm(discardMessage)}
      onStateChange={(state: NativeCaseDraftCoordinatorState) => setDirty(state.dirty)}
      onSaved={() => setSaved(true)}
    />
  </main>;

  return <main className="native-draft-workspace" aria-labelledby="native-draft-heading">
    <header><p className="native-draft-workspace__eyebrow">Private research intake</p><h1 id="native-draft-heading">Native case drafts</h1><p>Drafts associated with the active investigation.</p></header>
    <button className="native-draft-workspace__primary" type="button" disabled={listState === "loading"} onClick={() => { setView({ kind: "new" }); setSaved(false); }}>Create structured-observation draft</button>
    {listState === "loading" && <p role="status" aria-live="polite">Loading native case drafts…</p>}
    {openState === "loading" && <p role="status" aria-live="polite">Opening native case draft…</p>}
    {(listState === "error" || openState === "error") && <section className="native-draft-workspace__error" role="alert"><h2>{openState === "error" ? "Draft could not be opened" : "Draft list unavailable"}</h2><p>{error}</p><button type="button" onClick={() => openState === "error" && failedCandidateId.current ? void openDraft(failedCandidateId.current) : void loadList(investigationId)}>Retry</button></section>}
    {listState === "ready" && drafts.length === 0 && <section aria-labelledby="empty-drafts"><h2 id="empty-drafts">No drafts yet</h2><p>Create the first structured observation for this investigation.</p></section>}
    {listState === "ready" && drafts.length > 0 && <section aria-labelledby="draft-list-heading"><h2 id="draft-list-heading">Investigation drafts</h2><ul className="native-draft-workspace__list">{drafts.map(draft => <li key={draft.candidateId}><div><strong>{draft.content.workingTitle.state === "SUPPLIED" ? String(draft.content.workingTitle.value) : "Untitled observation"}</strong><span>Revision {draft.revision} · Updated {new Date(draft.updatedAt).toLocaleString()}</span></div><button type="button" disabled={openState === "loading"} aria-label={`Open ${draft.content.workingTitle.state === "SUPPLIED" ? String(draft.content.workingTitle.value) : "untitled observation"}`} onClick={() => void openDraft(draft.candidateId)}>Open draft</button></li>)}</ul></section>}
  </main>;
}
