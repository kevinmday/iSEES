import { InvestigationLibraryStatus, OverviewFrontDoorManifestation, type OverviewFrontDoorProjection } from "../../investigation/frontDoor/FrontDoorProjectionTypes";
import { CANON_PRESENTATION_VISUAL, OVERVIEW_REPOSITORIES, projectHydratedOverviewEvents, resolveOverviewCompositionKind, type OverviewCanonCard } from "./overview/OverviewEndStateModel";
import { useOverviewSelection } from "./overview/OverviewSelectionContext";
import "./GuestWelcomeOverview.css";

export interface GuestWelcomeOverviewProps { readonly projection: OverviewFrontDoorProjection | null; }
const CANON_EVENTS = projectHydratedOverviewEvents();

export default function GuestWelcomeOverview({ projection }: GuestWelcomeOverviewProps) {
  const overview = useOverviewSelection();
  const composition = resolveOverviewCompositionKind(projection);
  if (composition === "CLOSED") return <ClosedOverview />;
  if (projection === null || projection.status !== "VALID") return <ClosedOverview />;
  if (composition === "RETURNING_ACCOUNT") {
    return <AccountLibraryOverview title="Your investigations" message="Select an owned investigation to preview its public summary. Opening remains a separate explicit action." projection={projection} />;
  }
  if (composition === "ACCOUNT_UNRESOLVED") {
    return <AccountLibraryOverview title="Investigation library unavailable" message="Owned work remains hidden until account authority and the library projection resolve." projection={projection} />;
  }
  const isAccount = projection.manifestation === OverviewFrontDoorManifestation.NEW_ACCOUNT;
  return (
    <main className="guest-welcome">
      <section className="guest-welcome__hero" aria-labelledby="overview-gateway-title">
        <div className="guest-welcome__hero-copy">
          <p className="guest-welcome__eyebrow">{isAccount ? "New Account / Research Gateway" : "Guest Overview / Public Research Gateway"}</p>
          <h1 id="overview-gateway-title">Investigate the record, preserve the source.</h1>
          <p className="guest-welcome__lead">iSEES is an inspectable research workstation for exploring canonical events, tracing source-grounded claims, and explicitly opening a case as an investigation when you are ready.</p>
          <div className="guest-welcome__status-row" aria-label="Workspace status">
            <Status label="Investigation" value="No active investigation" />
            <Status label="Browsing" value="Read-only / non-mutating" />
            <Status label="Retention" value={isAccount ? "Account-owned after explicit import" : "Browser session only"} />
          </div>
        </div>
        <div className="guest-welcome__hero-signal" aria-hidden="true"><span>iSEES</span><b>PUBLIC<br />RESEARCH<br />GATEWAY</b></div>
      </section>

      <section className="guest-welcome__canon" aria-labelledby="system-canon-title">
        <header className="guest-welcome__section-heading">
          <div><p className="guest-welcome__eyebrow">System Canon / Hydrated Records</p><h2 id="system-canon-title">Begin with a canonical event</h2></div>
          <p>Selection updates this page only. Import remains a separate action in the Case Library.</p>
        </header>
        <div className="guest-welcome__cards" role="list" aria-label="Hydrated System Canon events">
          {CANON_EVENTS.map(event => <CanonCard key={event.eventId} event={event} selected={overview.selection.kind === "CANON_EVENT" && overview.selection.eventId === event.eventId} onSelect={overview.selectCanonEvent} />)}
        </div>
      </section>

      <section className="guest-welcome__repositories" aria-labelledby="repositories-title">
        <header className="guest-welcome__section-heading">
          <div><p className="guest-welcome__eyebrow">External Repositories / Orientation</p><h2 id="repositories-title">Follow the record beyond iSEES</h2></div>
          <p>These labels describe orientation only. They do not imply partnership, endorsement, federation, or import support.</p>
        </header>
        <div className="guest-welcome__repository-grid">
          {OVERVIEW_REPOSITORIES.map(repository => <button type="button" className="guest-welcome__repository" aria-pressed={overview.selection.kind === "EXTERNAL_REPOSITORY" && overview.selection.name === repository.name} onClick={() => overview.selectRepository(repository)} key={repository.name}>
            <span className={`guest-welcome__tag guest-welcome__tag--${repository.state.toLowerCase().replace(" ", "-")}`}>{repository.state}</span>
            <h3>{repository.name}</h3><p>{repository.note}</p><small>Preview repository orientation</small>
          </button>)}
        </div>
      </section>

      <section className="guest-welcome__next" aria-labelledby="available-actions-title">
        <div><p className="guest-welcome__eyebrow">Operational Boundary</p><h2 id="available-actions-title">Available actions</h2></div>
        <p><strong>Live:</strong> browse and focus hydrated Canon records without changing a workspace. Use the existing Case Library for any explicit import.</p>
        <button type="button" disabled>Create Empty Investigation <span>Planned</span></button>
      </section>
    </main>
  );
}

function CanonCard({ event, selected, onSelect }: { readonly event: OverviewCanonCard; readonly selected: boolean; readonly onSelect: (event: OverviewCanonCard) => void }) {
  return <button className="guest-welcome__case" type="button" role="listitem" aria-pressed={selected} onClick={() => onSelect(event)}>
    <PresentationVisual /><span className="guest-welcome__case-id">{event.eventId}</span><strong>{event.title}</strong><span>{event.year} · {event.location}</span><small>{selected ? "Selected for preview" : "Preview record"}</small>
  </button>;
}

function PresentationVisual() { return <span className="guest-welcome__visual" role="img" aria-label={CANON_PRESENTATION_VISUAL.label}><i /><i /><i /></span>; }

function Status({ label, value }: { readonly label: string; readonly value: string }) { return <div><span>{label}</span><strong>{value}</strong></div>; }

function AccountLibraryOverview({ title, message, projection }: { readonly title: string; readonly message: string; readonly projection: OverviewFrontDoorProjection & { readonly status: "VALID" } }) {
  const overview = useOverviewSelection();
  const unresolved = projection.library.status !== InvestigationLibraryStatus.READY;
  return <main className="guest-welcome guest-welcome--account"><section className="guest-welcome__hero">
    <p className="guest-welcome__eyebrow">Account Overview / Owned Workspace</p><h1>{title}</h1><p className="guest-welcome__lead">{message}</p>
    {unresolved ? <div className="guest-welcome__closed" role="status"><strong>Fail-closed library state</strong><span>Status: {projection.library.status}. No owned summaries are displayed.</span></div> :
      <div className="guest-welcome__owned-list">{projection.library.summaries.map(summary => <button type="button" aria-pressed={overview.selection.kind === "OWNED_INVESTIGATION" && overview.selection.investigationId === summary.investigationId} onClick={() => overview.selectOwnedInvestigation(summary)} key={summary.investigationId}><span>Owned investigation</span><h2>{summary.title}</h2><code>{summary.investigationId}</code><p>Preview summary; no workspace activation occurs.</p></button>)}</div>}
  </section></main>;
}

function ClosedOverview() { return <main className="guest-welcome"><section className="guest-welcome__hero"><p className="guest-welcome__eyebrow">Overview unavailable</p><h1>Authority is not settled</h1><div className="guest-welcome__closed" role="status"><strong>Fail closed</strong><span>Research gateway content and owned work remain hidden until the front-door projection is authoritative.</span></div></section></main>; }
