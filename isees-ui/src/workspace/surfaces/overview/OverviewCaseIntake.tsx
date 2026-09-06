import { InvestigationLibraryStatus } from "../../../investigation/frontDoor/FrontDoorProjectionTypes";
import { OVERVIEW_REPOSITORIES, projectHydratedOverviewEvents } from "./OverviewEndStateModel";
import { useOverviewSelection } from "./OverviewSelectionContext";
import "./OverviewPanels.css";

const CANON_EVENTS = projectHydratedOverviewEvents();

export default function OverviewCaseIntake() {
  const overview = useOverviewSelection();
  return <div className="overview-panel overview-case-intake">
    <p className="overview-panel__eyebrow">Case Intake / Investigation Library</p>
    <p className="overview-panel__intro">Browse public records and owned summaries. Selection is preview-only and never imports or opens a workspace.</p>

    <Section title="System Canon">
      {CANON_EVENTS.map(event => <button key={event.eventId} type="button" aria-pressed={overview.selection.kind === "CANON_EVENT" && overview.selection.eventId === event.eventId} onClick={() => overview.selectCanonEvent(event)}>
        <strong>{event.title}</strong><span>{event.eventId}</span>
      </button>)}
    </Section>

    <Section title="External Repositories">
      {OVERVIEW_REPOSITORIES.map(repository => <button key={repository.name} type="button" aria-pressed={overview.selection.kind === "EXTERNAL_REPOSITORY" && overview.selection.name === repository.name} onClick={() => overview.selectRepository(repository)}>
        <strong>{repository.name}</strong><span>{repository.state}</span>
      </button>)}
    </Section>

    {overview.accountAuthorityReady && <Section title="Owned Investigations">
      {overview.library.status === InvestigationLibraryStatus.READY
        ? overview.library.summaries.map(summary => <button key={summary.investigationId} type="button" aria-pressed={overview.selection.kind === "OWNED_INVESTIGATION" && overview.selection.investigationId === summary.investigationId} onClick={() => overview.selectOwnedInvestigation(summary)}>
          <strong>{summary.title}</strong><span>Preview owned summary</span>
        </button>)
        : <p className="overview-panel__status">Owned summaries remain hidden until account authority and the library are ready.</p>}
    </Section>}

    <p className="overview-panel__boundary">Import remains an explicit Case Library boundary. No open or import command is available from this preview.</p>
  </div>;
}

function Section({ title, children }: { readonly title: string; readonly children: React.ReactNode }) {
  return <section className="overview-panel__section"><h2>{title}</h2><div className="overview-panel__items">{children}</div></section>;
}
