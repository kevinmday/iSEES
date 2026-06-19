// ============================================================
// src/investigation/components/ComparativeMatrix.tsx
// P24.3 COMPARATIVE MATRIX
// COMPATIBLE WITH P24.2 RESOLUTION ENGINE
// ============================================================

import { useMemo, useState } from "react";

import { useCorpus } from "../../corpus/context/CorpusContext";

import type {
  SimilarityResolution,
} from "../../corpus/resolution/resolutionTypes";

import {
  resolveEventPair,
} from "../../corpus/resolution/resolutionEngine";


// ============================================================
// TYPES
// ============================================================

type MatrixRow = {
  eventA: string;
  eventB: string;
  resolution: SimilarityResolution;
};


// ============================================================
// COMPONENT
// ============================================================

export default function ComparativeMatrix() {
  const { corpus } = useCorpus();

  const [selected, setSelected] =
    useState<MatrixRow | null>(null);

  const rows = useMemo(() => {
    const output: MatrixRow[] = [];

    for (let i = 0; i < corpus.length; i++) {
      for (
        let j = i + 1;
        j < corpus.length;
        j++
      ) {
        const eventA = corpus[i];
        const eventB = corpus[j];

        const resolution =
          resolveEventPair(
            eventA.canonical_event,
            eventB.canonical_event
          );

        output.push({
          eventA:
            eventA.canonical_event.event_name,
          eventB:
            eventB.canonical_event.event_name,
          resolution,
        });
      }
    }

    return output.sort(
      (a, b) =>
        b.resolution.confidence -
        a.resolution.confidence
    );
  }, [corpus]);

  if (corpus.length < 2) {
    return (
      <div style={panelStyle}>
        <h3>Comparative Matrix</h3>

        <p>
          Import at least two corpus events
          to generate comparison results.
        </p>
      </div>
    );
  }

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        gap: 12,
      }}
    >
      <h3>Comparative Matrix</h3>

      <table
        style={{
          width: "100%",
          borderCollapse: "collapse",
        }}
      >
        <thead>
          <tr>
            <th style={headerStyle}>
              Event A
            </th>

            <th style={headerStyle}>
              Event B
            </th>

            <th style={headerStyle}>
              Similarity
            </th>
          </tr>
        </thead>

        <tbody>
          {rows.map((row) => (
            <tr
              key={`${row.eventA}-${row.eventB}`}
              onClick={() =>
                setSelected(row)
              }
              style={{
                cursor: "pointer",
              }}
            >
              <td style={cellStyle}>
                {row.eventA}
              </td>

              <td style={cellStyle}>
                {row.eventB}
              </td>

              <td style={cellStyle}>
                {(
                  row.resolution
                    .confidence * 100
                ).toFixed(1)}
                %
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      {selected && (
        <ResolutionPanel
          row={selected}
        />
      )}
    </div>
  );
}


// ============================================================
// DETAIL PANEL
// ============================================================

function ResolutionPanel({
  row,
}: {
  row: MatrixRow;
}) {
  const r = row.resolution;

  return (
    <div style={panelStyle}>
      <h3>
        {row.eventA}
        {" ↔ "}
        {row.eventB}
      </h3>

      <p>
        Overall Similarity:{" "}
        <strong>
          {(r.confidence * 100).toFixed(1)}%
        </strong>
      </p>

      <table
        style={{
          width: "100%",
          borderCollapse: "collapse",
        }}
      >
        <thead>
          <tr>
            <th style={headerStyle}>
              Layer
            </th>

            <th style={headerStyle}>
              Score
            </th>
          </tr>
        </thead>

        <tbody>
          <MetricRow
            label="Narrative"
            value={
              r.narrative_similarity
            }
          />

          <MetricRow
            label="Observability"
            value={
              r.observability_similarity
            }
          />

          <MetricRow
            label="Infrastructure"
            value={
              r.infrastructure_similarity
            }
          />

          <MetricRow
            label="Topology"
            value={
              r.topology_similarity
            }
          />

          <MetricRow
            label="Geo"
            value={r.geo_similarity}
          />
        </tbody>
      </table>

      {r.rationale.length > 0 && (
        <>
          <h4>Rationale</h4>

          <ul>
            {r.rationale.map(
              (reason) => (
                <li key={reason}>
                  {reason}
                </li>
              )
            )}
          </ul>
        </>
      )}
    </div>
  );
}


// ============================================================
// METRIC ROW
// ============================================================

function MetricRow({
  label,
  value,
}: {
  label: string;
  value: number;
}) {
  return (
    <tr>
      <td style={cellStyle}>
        {label}
      </td>

      <td style={cellStyle}>
        {(value * 100).toFixed(1)}%
      </td>
    </tr>
  );
}


// ============================================================
// STYLES
// ============================================================

const panelStyle: React.CSSProperties = {
  padding: 16,
  border: "1px solid #333",
  borderRadius: 8,
  background: "#111",
};

const headerStyle: React.CSSProperties = {
  textAlign: "left",
  padding: "8px",
  borderBottom: "1px solid #333",
};

const cellStyle: React.CSSProperties = {
  padding: "8px",
  borderBottom: "1px solid #222",
};