// ============================================================
// src/investigationControl/ComputePanel.tsx
//
// P57-UI-A5-I3
// MANIFOLD NAVIGATOR COMPOSITION
//
// Presents shared deterministic configuration and Resolve
// lineage. It does not execute Resolve or own computational
// state.
// ============================================================

import type {
  ReactNode,
} from "react";

import ManifoldLayerSelector
  from "../components/ManifoldLayerSelector";

import ManifoldProjectionStatus, {
  ManifoldProjectionStatusValue,
  useManifoldProjectionStatus,
} from "../components/workspace/ManifoldProjectionStatus";

// ============================================================
// COMPONENT
// ============================================================

export default function ComputePanel() {
  const projection =
    useManifoldProjectionStatus();

  const executionLabel =
    projection.executionId
      ? `${projection.executionId.slice(0, 8)}...`
      : "None";

  return (
    <div className="investigation-library__compute">

      <Section title="RELATIONSHIP ANALYSIS">
        <div className="investigation-library__compute-copy">
          Configure the deterministic context used to construct
          the Investigation Manifold. Compute non-canonical relationship
          candidates for inspection.
        </div>
      </Section>

      <Section title="Relationship Analysis Status">
        <div className="investigation-library__projection-status">
          <ManifoldProjectionStatus />
        </div>

        <div className="investigation-library__compute-copy">
          {projection.title}
        </div>
      </Section>

      <ManifoldLayerSelector />

      <Section title="Next Action">
        <div
          className={[
            "investigation-library__projection-guidance",
            `investigation-library__projection-guidance--${projection.status.toLowerCase()}`,
          ].join(" ")}
        >
          {getProjectionGuidance(
            projection.status,
          )}
        </div>
      </Section>

      <Section title="Resolve Lineage">
        <dl className="investigation-library__lineage">
          <LineageRow
            label="Current selection"
            value={`${projection.selectedLayerCount} layers`}
          />

          <LineageRow
            label="Resolved execution"
            value={
              projection.resolvedLayerCount === undefined
                ? "None"
                : `${projection.resolvedLayerCount} layers`
            }
          />

          <LineageRow
            label="Execution"
            value={executionLabel}
          />

          <LineageRow
            label="History"
            value={`${projection.historyCount}`}
          />

          <LineageRow
            label="Candidates"
            value={`${projection.candidateCount}`}
          />
        </dl>
        <div className="investigation-library__compute-copy">
          Candidate evidence is evaluated independently across Narrative, Observability,
          Infrastructure, Topology, and Geography. It is not a manifold-layer count;
          Temporal and Topology are distinct domains.
        </div>
      </Section>

</div>
  );
}

// ============================================================
// STATUS GUIDANCE
// ============================================================

function getProjectionGuidance(
  status:
    ManifoldProjectionStatusValue,
): string {
  switch (status) {
    case ManifoldProjectionStatusValue.UNRESOLVED:
      return "Review the selected context, then compute relationships from the Computation instrument in the manifold.";

    case ManifoldProjectionStatusValue.RESOLVING:
      return "Resolve is constructing the deterministic manifold projection.";

    case ManifoldProjectionStatusValue.SYNCHRONIZED:
      return "The result matches the governing context. Inspecting a relationship candidate does not change the computation or accept the relationship.";

    case ManifoldProjectionStatusValue.STALE:
      return "The governing L, T, or S context differs from the current result. Recompute only after the governing context changes.";

    case ManifoldProjectionStatusValue.ERROR:
      return "The latest Resolve execution failed. Inspect the execution diagnostics before trying again.";
  }
}

// ============================================================
// SECTION
// ============================================================

function Section({
  title,
  children,
}: {
  title: string;
  children: ReactNode;
}) {
  return (
    <section className="investigation-library__compute-section">
      <div className="investigation-library__compute-title">
        {title}
      </div>

      {children}
    </section>
  );
}

// ============================================================
// LINEAGE ROW
// ============================================================

function LineageRow({
  label,
  value,
}: {
  label: string;
  value: string;
}) {
  return (
    <div className="investigation-library__lineage-row">
      <dt>{label}</dt>
      <dd>{value}</dd>
    </div>
  );
}
