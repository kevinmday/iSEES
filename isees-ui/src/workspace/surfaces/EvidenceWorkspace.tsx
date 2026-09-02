import { useEffect, useMemo, useState } from "react";
import { projectInvestigationEvidence, resolveEvidenceInspection } from "../../evidence/projection/EvidenceWorkspaceProjection";
import type { EvidenceInspectionSelection, EvidenceOptionalValue } from "../../evidence/projection/EvidenceWorkspaceProjectionTypes";
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

  useEffect(() => {
    setSelection(undefined);
  }, [projection?.investigation.id]);

  const inspected = resolveEvidenceInspection(projection, selection);

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
          <h1>{projection.investigation.name}</h1>
          <p>Investigation <code>{projection.investigation.id}</code></p>
        </div>
        <div className="evidence-status" aria-label="Evidence projection status">
          Canonical workspace artifacts
        </div>
      </header>

      {projection.records.length === 0 ? (
        <section className="evidence-empty" aria-live="polite">
          <h2>No evidence records available in this investigation projection</h2>
          <p>This does not establish that zero evidence exists.</p>
        </section>
      ) : (
        <div className="evidence-chamber">
          <section className="evidence-inventory" aria-label="Evidence inventory">
            <div className="evidence-section-heading">
              <h2>Artifact inventory</h2>
              <span>Records available</span>
            </div>
            <ul>
              {projection.records.map((record) => (
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
            </ul>
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
      )}
    </main>
  );
}
