import { useOverviewSelection, type OverviewSelection } from "./OverviewSelectionContext";
import "./OverviewPanels.css";

export default function OverviewInspector() {
  const { selection } = useOverviewSelection();
  return <div className="overview-panel overview-inspector" aria-live="polite">{renderSelection(selection)}</div>;
}

function renderSelection(selection: OverviewSelection) {
  switch (selection.kind) {
    case "CANON_EVENT":
      return <><Eyebrow>Canon Event / Public Record</Eyebrow><h2>{selection.title}</h2><Details rows={[["Canonical ID", selection.eventId], ["Time / Place", `${selection.year} · ${selection.location}`], ["Classification", selection.classification]]} />
        {selection.vectors.length > 0 && <section><h3>Investigation vectors</h3><ul>{selection.vectors.map(vector => <li key={vector}>{vector}</li>)}</ul></section>}
        <Boundary>Preview only. This does not create, replace, or alter the workspace.</Boundary></>;
    case "EXTERNAL_REPOSITORY":
      return <><Eyebrow>Repository / Orientation</Eyebrow><h2>{selection.name}</h2><Details rows={[["Capability", selection.capability]]} /><p>{selection.note}</p><Boundary>{repositoryBoundary(selection.capability)}</Boundary></>;
    case "OWNED_INVESTIGATION":
      return <><Eyebrow>Owned Investigation / Public Summary</Eyebrow><h2>{selection.title}</h2><Details rows={[["Investigation ID", selection.investigationId]]} /><Boundary>Preview only. Opening an investigation requires a separate authoritative activation path.</Boundary><button type="button" disabled>Open unavailable</button></>;
    default:
      return <><Eyebrow>Overview Inspector / Neutral</Eyebrow><h2>Select a front-door record</h2><p>Choose a Canon event, external repository, or owned investigation to inspect its public details here.</p><Boundary>Browsing is non-mutating and begins with no selection.</Boundary></>;
  }
}

function repositoryBoundary(capability: "REFERENCE" | "EXTERNAL READING" | "PLANNED") {
  if (capability === "REFERENCE") return "Reference orientation only; no partnership, endorsement, import support, federation, or live connection is implied.";
  if (capability === "EXTERNAL READING") return "Informational direction to reading outside iSEES; no content is imported and no live connection is implied.";
  return "Planned orientation only. Connectivity and import support are not operational.";
}

function Eyebrow({ children }: { readonly children: React.ReactNode }) { return <p className="overview-panel__eyebrow">{children}</p>; }
function Boundary({ children }: { readonly children: React.ReactNode }) { return <p className="overview-panel__boundary">{children}</p>; }
function Details({ rows }: { readonly rows: readonly (readonly [string, string])[] }) { return <dl>{rows.map(([label, value]) => <div key={label}><dt>{label}</dt><dd>{value}</dd></div>)}</dl>; }
