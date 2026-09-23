/* eslint-disable react-refresh/only-export-components */
import { createContext, useContext, useMemo, useState, type FormEvent, type ReactNode } from "react";
import { useOperatorIdentity } from "../../identity/runtime/OperatorIdentityRuntimeContext";
import { useAccountInvestigationLibrary } from "../../account/AccountInvestigationLibraryContext";
import { InvestigationLibraryStatus } from "../../investigation/frontDoor/FrontDoorProjectionTypes";
import { useWorkspaceRuntime } from "../runtime/WorkspaceRuntimeContext";
import { WorkspaceMode } from "../runtime/WorkspaceRuntimeTypes";
import GuestCaseIntake from "./GuestCaseIntake";
import OverviewInspector from "./overview/OverviewInspector";
import { OVERVIEW_REPOSITORIES, projectHydratedOverviewEvents } from "./overview/OverviewEndStateModel";
import { useOverviewSelection } from "./overview/OverviewSelectionContext";
import "./LibraryWorkspace.css";

interface LibraryNavigationValue { readonly intakeOpen: boolean; readonly enter: (intake?: boolean) => void; readonly closeIntake: () => void; }
const LibraryNavigationContext = createContext<LibraryNavigationValue | undefined>(undefined);

export function LibraryNavigationProvider({ children }: { readonly children: ReactNode }) {
  const runtime = useWorkspaceRuntime();
  const [intakeOpen, setIntakeOpen] = useState(false);
  const value = useMemo(() => Object.freeze({ intakeOpen, enter(intake = false) { setIntakeOpen(intake); runtime.setActiveMode(WorkspaceMode.LIBRARY); }, closeIntake() { setIntakeOpen(false); } }), [intakeOpen, runtime]);
  return <LibraryNavigationContext.Provider value={value}>{children}</LibraryNavigationContext.Provider>;
}

export function useLibraryNavigation(): LibraryNavigationValue {
  const value = useContext(LibraryNavigationContext);
  if (value === undefined) throw new Error("useLibraryNavigation must be used inside LibraryNavigationProvider");
  return value;
}

const CANON_EVENTS = projectHydratedOverviewEvents();

export default function LibraryWorkspace() {
  const identity = useOperatorIdentity();
  const runtime = useWorkspaceRuntime();
  const overview = useOverviewSelection();
  const account = useAccountInvestigationLibrary();
  const navigation = useLibraryNavigation();
  const [query, setQuery] = useState("");
  const [authority, setAuthority] = useState<"ALL" | "CANON" | "REFERENCE">("ALL");
  const active = runtime.getActiveInvestigation();
  const normalized = query.trim().toLocaleLowerCase();
  const matches = (value: string) => normalized.length === 0 || value.toLocaleLowerCase().includes(normalized);
  const canon = authority !== "REFERENCE" ? CANON_EVENTS.filter(item => matches(`${item.title} ${item.eventId} ${item.location}`)) : [];
  const repositories = authority !== "CANON" ? OVERVIEW_REPOSITORIES.filter(item => matches(`${item.name} ${item.state} ${item.note}`)) : [];
  const isGuest = identity.identity?.kind !== "ACCOUNT";
  const emptyOwnedInvestigationId = active?.createdBy === "AUTHENTICATED_RESEARCHER" && active.revisions.length === 0 ? active.id : null;

  if (navigation.intakeOpen && isGuest) return <section className="library-workspace"><GuestCaseIntake onCancel={navigation.closeIntake} onCreated={navigation.closeIntake} /></section>;

  function create(event: FormEvent<HTMLFormElement>) {
    event.preventDefault(); const form = event.currentTarget; const title = String(new FormData(form).get("title") ?? "").trim();
    if (title) { void account.create(title); form.reset(); }
  }

  return <main className="library-workspace" aria-labelledby="library-workspace-title">
    <header className="library-workspace__hero"><div><p className="library-workspace__eyebrow">LIBRARY · GOVERNED INVESTIGATION SELECTION</p><h1 id="library-workspace-title">Investigation Library</h1><p>Browse and preview available research records, begin a candidate case, or explicitly resume existing work. Selection alone never activates a workspace.</p></div><p className="library-workspace__persistence">{isGuest ? "Guest work is local to this browser session and is not durably saved." : "Saved investigations use existing account ownership and authorization."}</p></header>

    <section className="library-workspace__actions" aria-labelledby="library-actions-title"><div><p className="library-workspace__eyebrow">Primary actions</p><h2 id="library-actions-title">Start or continue</h2></div>{isGuest ? <button className="library-workspace__primary" type="button" onClick={() => navigation.enter(true)}>Start or Bring a New Case</button> : <form onSubmit={create}><label htmlFor="library-new-title">New investigation title</label><div><input id="library-new-title" name="title" maxLength={200} disabled={account.busy} required /><button className="library-workspace__primary" disabled={account.busy}>Start New Investigation</button></div></form>}{active && active.revisions.length > 0 && <button type="button" onClick={() => runtime.setActiveMode(WorkspaceMode.MANIFOLD)}>Resume Current Investigation</button>}{emptyOwnedInvestigationId && <div className="library-workspace__setup" role="status"><strong>{active?.name}</strong><span>This saved investigation has no focused event or operational content.</span><button type="button" disabled>Continue Setup</button></div>}</section>

    <section className="library-workspace__search" aria-label="Search and filters"><label htmlFor="library-search">Search records</label><input id="library-search" type="search" value={query} onChange={event => setQuery(event.target.value)} placeholder="Search titles, identifiers, places, or repositories" /><div role="group" aria-label="Authority filter">{(["ALL", "CANON", "REFERENCE"] as const).map(value => <button key={value} type="button" aria-pressed={authority === value} onClick={() => setAuthority(value)}>{value === "ALL" ? "All records" : value === "CANON" ? "System Canon" : "External references"}</button>)}</div></section>

    <div className="library-workspace__working-grid"><div className="library-workspace__catalog">
      <section aria-labelledby="your-investigations-title"><h2 id="your-investigations-title">{isGuest ? "Current guest investigation" : "Your investigations"}</h2>{isGuest ? active ? <article className="library-workspace__current"><span>SESSION-LOCAL · NOT DURABLY SAVED</span><h3>{active.name}</h3><p>{active.description}</p>{active.revisions.length > 0 && <button type="button" onClick={() => runtime.setActiveMode(WorkspaceMode.MANIFOLD)}>Resume Investigation</button>}</article> : <p>No guest investigation is active. Start a case when you are ready.</p> : overview.library.status === InvestigationLibraryStatus.READY ? <div className="library-workspace__items">{overview.library.summaries.filter(item => matches(item.title)).map(item => <button key={item.investigationId} type="button" aria-pressed={overview.selection.kind === "OWNED_INVESTIGATION" && overview.selection.investigationId === item.investigationId} onClick={() => overview.selectOwnedInvestigation(item)}><span>SAVED INVESTIGATION</span><strong>{item.title}</strong><small>Preview investigation</small></button>)}</div> : <p role="status">Saved investigations remain hidden until account authority is ready.</p>}</section>
      <section aria-labelledby="system-canon-title"><h2 id="system-canon-title">System Canon</h2><p>Protected canonical records. Previewing does not import, mutate, or compute.</p><div className="library-workspace__items">{canon.map(item => <button key={item.eventId} type="button" aria-pressed={overview.selection.kind === "CANON_EVENT" && overview.selection.eventId === item.eventId} onClick={() => overview.selectCanonEvent(item)}><span>SYSTEM CANON · {item.eventId}</span><strong>{item.title}</strong><small>{item.year} · {item.location}</small></button>)}</div></section>
      <section aria-labelledby="external-repositories-title"><h2 id="external-repositories-title">External research records</h2><p>Orientation and reading references only; no partnership, federation, endorsement, or Canon authority is implied.</p><div className="library-workspace__items">{repositories.map(item => <button key={item.name} type="button" aria-pressed={overview.selection.kind === "EXTERNAL_REPOSITORY" && overview.selection.name === item.name} onClick={() => overview.selectRepository(item)}><span>{item.state}</span><strong>{item.name}</strong><small>{item.note}</small></button>)}</div></section>
    </div><aside className="library-workspace__inspector" aria-label="Record and investigation inspector"><OverviewInspector ownedBusy={account.busy} emptyOwnedInvestigationId={emptyOwnedInvestigationId} onOpenOwned={account.available ? id => { void account.open(id); } : undefined} />{account.error && <p role="alert">{account.error}</p>}</aside></div>

    <section className="library-workspace__featured" aria-labelledby="featured-events-title"><p className="library-workspace__eyebrow">Reserved collection</p><h2 id="featured-events-title">Featured events</h2><p>Governed graphical event presentations are planned for a later increment. No event data or evidentiary status is inferred here.</p></section><p className="library-workspace__boundary">LIBRARY does not run Resolve, compute relationships, mutate System Canon, or publish to the Research Inbox. Explicit opening enters MANIFOLD.</p>
  </main>;
}
