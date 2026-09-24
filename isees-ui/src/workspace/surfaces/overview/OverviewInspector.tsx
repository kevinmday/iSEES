import { useOverviewSelection, type OverviewSelection } from "./OverviewSelectionContext";
import { useOverviewCanonicalActivation } from "./OverviewCanonicalActivationContext";
import "./OverviewPanels.css";
import "./OverviewCanonicalActivation.css";

export default function OverviewInspector({ onOpenOwned, ownedBusy = false, emptyOwnedInvestigationId = null, previewLabel }: { readonly onOpenOwned?: (investigationId: string) => void; readonly ownedBusy?: boolean; readonly emptyOwnedInvestigationId?: string | null; readonly previewLabel?: string }) {
  const { selection } = useOverviewSelection();
  const activation = useOverviewCanonicalActivation();
  return <div className="overview-panel overview-inspector" aria-live="polite">{previewLabel && <p className="overview-panel__eyebrow">{previewLabel}</p>}{renderSelection(selection, activation, onOpenOwned, ownedBusy, emptyOwnedInvestigationId)}</div>;
}

function renderSelection(selection: OverviewSelection, activation: ReturnType<typeof useOverviewCanonicalActivation>, onOpenOwned?: (investigationId: string) => void, ownedBusy = false, emptyOwnedInvestigationId: string | null = null) {
  switch (selection.kind) {
    case "CANON_EVENT":
      return <><Eyebrow>Canon Event / Public Record</Eyebrow><h2>{selection.title}</h2><Details rows={[["Canonical ID", selection.eventId], ["Time / Place", `${selection.year} · ${selection.location}`], ["Classification", selection.classification]]} />
        {selection.vectors.length > 0 && <section><h3>Investigation vectors</h3><ul>{selection.vectors.map(vector => <li key={vector}>{vector}</li>)}</ul></section>}
        <Boundary>Preview only. Importing or opening requires a separate explicit action.</Boundary>
        {activation.canImport && <><p>Imports into <strong>{activation.destinationTitle}</strong>. The owned Investigation identity and attached .author artifact remain active.</p><button className="overview-inspector__activate" type="button" disabled={activation.importStatus === "STARTING" || activation.importStatus === "SUCCEEDED"} onClick={() => { void activation.importIntoActive(); }}>Import into Active Investigation</button>{activation.importMessage !== null && <p className={`overview-inspector__feedback overview-inspector__feedback--${activation.importStatus.toLowerCase()}`} role={activation.importStatus === "ERROR" ? "alert" : "status"}>{activation.importMessage}</p>}</>}
        {activation.canResume ? <><p>This event is the current session-local investigation.</p><button className="overview-inspector__activate" type="button" onClick={activation.resume}>Resume Current Investigation</button></> : activation.canActivate && <><p>Loads a local investigation workspace from this canonical event. It does not create a saved account investigation.</p><button className="overview-inspector__activate" type="button" disabled={activation.status === "STARTING"} aria-describedby="overview-canonical-activation-boundary" onClick={() => { void activation.activate(); }}>Open Event in Workspace</button><span id="overview-canonical-activation-boundary" className="overview-inspector__activation-boundary">Local workspace only. No account investigation is saved.</span></>}
        {activation.message !== null && <p className={`overview-inspector__feedback overview-inspector__feedback--${activation.status.toLowerCase()}`} role={activation.status === "ERROR" ? "alert" : "status"}>{activation.message}</p>}</>;
    case "EXTERNAL_REPOSITORY":
      return <><Eyebrow>Repository / Orientation</Eyebrow><h2>{selection.name}</h2><Details rows={[["Capability", selection.capability]]} /><p>{selection.note}</p><Boundary>{repositoryBoundary(selection.capability)}</Boundary></>;
    case "OWNED_INVESTIGATION":
      return <><Eyebrow>Owned Investigation / Authorized Summary</Eyebrow><h2>{selection.title}</h2><Details rows={[["Investigation ID", selection.investigationId]]} /><Boundary>Preview only. Resuming is a separate explicit action through the existing account continuity authority.</Boundary>{emptyOwnedInvestigationId === selection.investigationId ? <button type="button" disabled>Continue Setup</button> : <button className="overview-inspector__activate" type="button" disabled={ownedBusy || onOpenOwned === undefined} onClick={() => onOpenOwned?.(selection.investigationId)}>Resume Investigation</button>}</>;
    default:
      return <><Eyebrow>Library Inspector / Neutral</Eyebrow><h2>Select a Library record</h2><p>Choose a Canon event, external repository, guest investigation, or saved investigation to preview its available details.</p><Boundary>Browsing is non-mutating and begins with no selection.</Boundary></>;
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
