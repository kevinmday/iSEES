import { useEffect, useMemo, useState } from "react";
import { createEvidenceWorkspaceView, projectInvestigationEvidence, resolveEvidenceInspection } from "../../evidence/projection/EvidenceWorkspaceProjection";
import type { EvidenceInspectionSelection, EvidenceOptionalValue, EvidenceWorkspaceFilters } from "../../evidence/projection/EvidenceWorkspaceProjectionTypes";
import { useWorkspaceRuntime } from "../runtime/WorkspaceRuntimeContext";
import "./EvidenceWorkspace.css";

function presentOptional<T>(field: EvidenceOptionalValue<T>, format: (value: T) => string = String): string {
  return field.status === "KNOWN" ? format(field.value) : "UNKNOWN";
}

export default function EvidenceWorkspace() {
  const runtime = useWorkspaceRuntime();
  const investigation = runtime.getActiveInvestigation();
  const projection = useMemo(
    () => investigation === undefined ? undefined : projectInvestigationEvidence(investigation),
    [investigation],
  );
  const [selection, setSelection] = useState<EvidenceInspectionSelection>();
  const [filters, setFilters] = useState<EvidenceWorkspaceFilters>({});

  useEffect(() => {
    setSelection(undefined);
    setFilters({});
  }, [projection?.investigation.id]);

  const view = useMemo(
    () => projection === undefined ? undefined : createEvidenceWorkspaceView(projection, filters),
    [projection, filters],
  );
  const inspected = resolveEvidenceInspection(
    projection === undefined || view === undefined ? undefined : { ...projection, records: view.records },
    selection,
  );

  useEffect(() => {
    if (selection !== undefined && inspected === undefined) setSelection(undefined);
  }, [inspected, selection]);

  if (projection === undefined) {
    return (
      <main className="evidence-workspace evidence-workspace--empty">
        <p className="evidence-eyebrow">EVIDENCE · READ-ONLY</p>
        <h1>No active Investigation</h1>
        <p>Evidence becomes available only within an active Investigation.</p>
      </main>
    );
  }

  return (
    <main className="evidence-workspace">
      <header className="evidence-header">
        <div>
          <p className="evidence-eyebrow">EVIDENCE · READ-ONLY PROJECTION</p>
          <h1>Evidence Chamber</h1>
          <p><strong>{projection.investigation.name}</strong> · Investigation <code>{projection.investigation.id}</code></p>
        </div>
        <div className="evidence-status" aria-label="Evidence projection status">
          Investigation-scoped projection
        </div>
      </header>

      {projection.records.length === 0 ? (
        <section className="evidence-empty" aria-live="polite">
          <h2>No evidence records available in this investigation projection.</h2>
          <p>This does not establish that zero evidence exists.</p>
        </section>
      ) : (
        <>
          <section className="evidence-summary" aria-label="Evidence projection summary">
            <div><strong>{view!.totalCount}</strong><span>Projected records</span></div>
            <div><strong>{view!.visibleCount}</strong><span>Visible records</span></div>
            <div><strong>{view!.navigator.filter((entry) => entry.count > 0).length}</strong><span>Artifact types</span></div>
            <div><strong>{view!.availabilityCounts.UNAVAILABLE}</strong><span>Payload unavailable</span></div>
          </section>

          <div className="evidence-chamber">
          <nav className="evidence-navigator" aria-label="Evidence Navigator">
            <div className="evidence-section-heading">
              <h2>Evidence Navigator</h2>
              <span>{view!.totalCount} total</span>
            </div>
            <div className="evidence-filter-group" aria-label="Artifact type filters">
              {view!.navigator.map((entry) => (
                <button key={entry.artifactType} type="button"
                  aria-pressed={filters.artifactType === entry.artifactType}
                  onClick={() => setFilters((current) => ({ ...current, artifactType: current.artifactType === entry.artifactType ? undefined : entry.artifactType }))}>
                  <span>{entry.artifactType}</span><strong>{entry.count}</strong>
                </button>
              ))}
            </div>
            <div className="evidence-filter-group" aria-label="Payload availability filters">
              <button type="button" aria-pressed={filters.availability === "UNAVAILABLE"}
                onClick={() => setFilters((current) => ({ ...current, availability: current.availability === "UNAVAILABLE" ? undefined : "UNAVAILABLE" }))}>
                <span>UNAVAILABLE</span><strong>{view!.availabilityCounts.UNAVAILABLE}</strong>
              </button>
            </div>
            <button className="evidence-reset" type="button" disabled={filters.artifactType === undefined && filters.availability === undefined}
              onClick={() => setFilters({})}>Show all evidence</button>
          </nav>

          <section className="evidence-inventory" aria-label="Evidence Chamber register">
            <div className="evidence-section-heading">
              <h2>Evidence register</h2>
              <span aria-live="polite" aria-atomic="true">Showing {view!.visibleCount} of {view!.totalCount}</span>
            </div>
            {(filters.artifactType !== undefined || filters.availability !== undefined) && <p className="evidence-active-filter">
              Active filters: {filters.artifactType ?? "all types"} · {filters.availability ?? "all availability states"}
            </p>}
            {view!.visibleCount === 0 ? <div className="evidence-filtered-empty" role="status">
              <h3>No evidence records match the active filters.</h3>
              <p>The Investigation projection still contains {view!.totalCount} record{view!.totalCount === 1 ? "" : "s"}.</p>
              <button type="button" onClick={() => setFilters({})}>Reset filters</button>
            </div> : <ul>
              {view!.records.map((record) => (
                <li key={record.evidenceId}>
                  <button
                    type="button"
                    className={record.evidenceId === inspected?.evidenceId ? "is-selected" : undefined}
                    aria-pressed={record.evidenceId === inspected?.evidenceId}
                    onClick={() => setSelection({
                      investigationId: projection.investigation.id,
                      evidenceId: record.evidenceId,
                    })}
                  >
                    <strong>{record.title}</strong>
                    <span>{record.artifactType} · {record.provenance.repository}</span>
                    <code>{record.sourceArtifactId}</code>
                  </button>
                </li>
              ))}
            </ul>}
          </section>

          <aside className="evidence-inspector" aria-label="Evidence inspection">
            {inspected === undefined ? (
              <div className="evidence-inspection-prompt">
                <h2>Inspection</h2>
                <p>Select an artifact to inspect its available canonical metadata.</p>
              </div>
            ) : (
              <>
                <div className="evidence-section-heading">
                  <h2>{inspected.title}</h2>
                  <span>Local inspection only</span>
                </div>
                <dl>
                  <div><dt>Projected identity</dt><dd><code>{inspected.evidenceId}</code></dd></div>
                  <div><dt>Source artifact</dt><dd><code>{inspected.sourceArtifactId}</code></dd></div>
                  <div><dt>Investigation</dt><dd><code>{inspected.investigationId}</code></dd></div>
                  <div><dt>Type</dt><dd>{inspected.artifactType}</dd></div>
                  <div><dt>Repository</dt><dd>{inspected.provenance.repository}</dd></div>
                  <div><dt>Created</dt><dd>{inspected.provenance.createdAt}</dd></div>
                  <div><dt>Description</dt><dd>{presentOptional(inspected.description)}</dd></div>
                  <div><dt>Confidence</dt><dd>{presentOptional(inspected.confidence, String)}</dd></div>
                  <div><dt>DOI</dt><dd>{presentOptional(inspected.doi)}</dd></div>
                  <div><dt>URL</dt><dd>{presentOptional(inspected.url)}</dd></div>
                  <div><dt>Tags</dt><dd>{presentOptional(inspected.tags, (tags) => tags.join(", "))}</dd></div>
                  <div><dt>Source derivation identifiers</dt><dd>{presentOptional(inspected.sourceDerivationIdentifiers, (ids) => ids.join(", "))}</dd></div>
                  <div><dt>Payload</dt><dd>{inspected.payload.status} · {inspected.payload.reason}</dd></div>
                </dl>
              </>
            )}
          </aside>
          </div>
        </>
      )}
    </main>
  );
}
