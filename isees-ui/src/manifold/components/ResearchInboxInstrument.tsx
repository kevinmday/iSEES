// ============================================================
// src/manifold/components/ResearchInboxInstrument.tsx
// P57-UI-A5-I4C
// RESEARCH INBOX DOCK
//
// Mode-scoped, collapsed-by-default Research surface for
// collected manifold nodes and edges.
//
// Research Bridge ownership and Author insertion semantics are
// preserved. This component owns presentation only.
// ============================================================


import {
  useEffect,
  useRef,
  useState,
} from "react";

import {
  useResearchBridge,
  useResearchDesk,
  useResearchMutation,
} from "../../research/ResearchBridgeContext";

import "./ResearchInboxInstrument.css";

import {
  authorDocumentRuntime,
} from "../../author/runtime/AuthorDocumentRuntime";

import { useActiveInvestigation } from "../../workspace/runtime/WorkspaceRuntimeContext";
import { createAuthorReferenceFromResearchAnchor } from "../../studio/sources/ResearchAnchorAuthorInsertion";

import type {
  ResearchAnchor,
} from "../../research/researchBridgeTypes";

import {
  eventDisplayName,
} from "../../research/LayersExperimentReferencePresentation";

// ============================================================
// PRESENTATION CONTRACT
// ============================================================

interface ResearchInboxInstrumentProps {
  expanded: boolean;
  onExpandedChange: (
    expanded: boolean,
  ) => void;
}

const candidateDimensionOrder = [
  ["NARRATIVE", "Narrative"],
  ["OBSERVABILITY", "Observability"],
  ["INFRASTRUCTURE", "Infrastructure"],
  ["TOPOLOGY", "Topology"],
  ["GEOGRAPHY", "Geography"],
] as const;

function formatPercent(value: number): string {
  return `${(value * 100).toFixed(1)}%`;
}

export function collectionConfirmationFor(anchor: ResearchAnchor): string {
  if (anchor.kind !== "GRAPH" && anchor.kind !== "COMPARE_CANDIDATE" && anchor.kind !== "LAYERS_EXPERIMENT") {
    return "Added to Research Inbox";
  }
  if ("experiment" in anchor) {
    return "Experimental result added to Research Inbox.";
  }
  if (!("graph" in anchor)) {
    return "Pairwise correspondence added to Research Inbox.";
  }

  return anchor.graph.type === "NODE"
    ? "NODE added to Research Inbox."
    : "EDGE added to Research Inbox.";
}

// ============================================================
// COMPONENT
// ============================================================

export default function ResearchInboxInstrument({
  expanded,
  onExpandedChange,
}: ResearchInboxInstrumentProps) {

  const researchRuntime = useResearchBridge();
  useResearchDesk();
  const activeInvestigation = useActiveInvestigation();
  const researchDesk = researchRuntime.projectInvestigation({ investigationId: activeInvestigation?.id });

  const researchMutation =
    useResearchMutation();

  const initialMutation =
    useRef(researchMutation);

  const [confirmation, setConfirmation] =
    useState<string>();

  const [pulse, setPulse] =
    useState(false);

  useEffect(() => {
    if (
      researchMutation === initialMutation.current ||
      researchMutation?.kind !== "CREATE"
      || researchMutation.anchor.investigationId !== activeInvestigation?.id
    ) {
      initialMutation.current = researchMutation;
      return;
    }

    initialMutation.current = researchMutation;

    const message = collectionConfirmationFor(researchMutation.anchor);

    setConfirmation(message);
    setPulse(true);

    const timeout = window.setTimeout(() => {
      setConfirmation(undefined);
      setPulse(false);
    }, 2400);

    return () => window.clearTimeout(timeout);
  }, [activeInvestigation?.id, researchMutation]);

  function handleInsert(
    entry:
      typeof researchDesk.entries[number],
  ): void {

    if (entry.anchor.investigationId !== activeInvestigation?.id || entry.anchor.insertability.state !== "INSERTABLE") return;
    authorDocumentRuntime.insertNode(createAuthorReferenceFromResearchAnchor(entry.anchor, crypto.randomUUID()));

  }

  return (

    <>

    <div
      className={`research-inbox-confirmation${confirmation ? " research-inbox-confirmation--visible" : ""}`}
      role="status"
      aria-live="polite"
      aria-atomic="true"
    >
      {confirmation ?? ""}
    </div>

    <aside
      aria-label="Research Inbox"
      className={pulse ? "research-inbox-instrument research-inbox-instrument--pulse" : "research-inbox-instrument"}
      style={{
        position:
          "absolute",

        right:
          16,

        bottom:
          16,

        zIndex:
          1000,

        width:
          expanded
            ? 286
            : 196,

        maxHeight:
          expanded
            ? "calc(100% - 32px)"
            : 44,

        display:
          "flex",

        flexDirection:
          "column",

        overflow:
          "hidden",

        border:
          "1px solid rgba(148,163,184,0.22)",

        borderRadius:
          10,

        background:
          "rgba(7,13,24,0.96)",

        boxShadow:
          "0 16px 38px rgba(0,0,0,0.44)",

        transition:
          "width 140ms ease, max-height 140ms ease",
      }}
    >

      <button
        type="button"

        aria-expanded={
          expanded
        }

        onClick={
          () =>
            onExpandedChange(
              !expanded,
            )
        }

        title={
          expanded
            ? "Collapse Research Inbox"
            : "Expand Research Inbox"
        }

        style={{
          width:
            "100%",

          minHeight:
            44,

          padding:
            "0 14px",

          display:
            "flex",

          alignItems:
            "center",

          justifyContent:
            "space-between",

          gap:
            12,

          flexShrink:
            0,

          border:
            0,

          borderBottom:
            expanded
              ? "1px solid rgba(148,163,184,0.14)"
              : "1px solid transparent",

          background:
            "rgba(15,23,42,0.94)",

          color:
            "#f8fafc",

          cursor:
            "pointer",

          fontFamily:
            "inherit",

          textAlign:
            "left",
        }}
      >

        <span
          style={{
            fontSize:
              12,

            fontWeight:
              700,

            letterSpacing:
              "0.03em",
          }}
        >
          Research Inbox
        </span>

        <span
          style={{
            display:
              "flex",

            alignItems:
              "center",

            gap:
              9,

            color:
              "#94a3b8",

            fontSize:
              11,
          }}
        >

          <span
            style={{
              minWidth:
                20,

              padding:
                "2px 6px",

              border:
                "1px solid rgba(96,165,250,0.28)",

              borderRadius:
                999,

              background:
                "rgba(30,64,175,0.18)",

              color:
                "#93c5fd",

              textAlign:
                "center",
            }}
          >
            {
              researchDesk
                .entries
                .length
            }
          </span>

          <span
            aria-hidden="true"
          >
            {
              expanded
                ? "▾"
                : "▴"
            }
          </span>

        </span>

      </button>

      {expanded && (

        <>

          <div
            style={{
              minHeight:
                0,

              overflowY:
                "auto",

              padding:
                14,

              background:
                "rgba(2,6,23,0.78)",

              color:
                "#cbd5e1",

              fontSize:
                12,

              lineHeight:
                1.55,
            }}
          >

            {
              researchDesk
                .entries
                .length === 0
                ? (

                  <div>

                    <div
                      style={{
                        marginBottom:
                          7,

                        color:
                          "#e2e8f0",

                        fontWeight:
                          600,
                      }}
                    >
                      Nothing collected yet.
                    </div>

                    <div
                      style={{
                        color:
                          "#718096",
                      }}
                    >
                      Collect an inspectable item from
                      Manifold or Compare for research.
                    </div>

                  </div>

                )
                : (

                  researchDesk
                    .entries
                    .map(
                      entry => {
                        if ("graph" in entry.anchor) {
                          return (
                            <button
                              key={entry.anchor.anchorId}
                              type="button"
                              onClick={() => handleInsert(entry)}
                              title="Insert this reference into the active Author document."
                              aria-label={`Insert ${entry.anchor.graph.type} ${entry.anchor.graph.id} into the active Author document.`}
                              style={{ width: "100%", padding: "9px 0", display: "block", border: 0, borderBottom: "1px solid rgba(148,163,184,0.10)", background: "transparent", color: "inherit", cursor: "pointer", fontFamily: "inherit", textAlign: "left" }}
                            >
                              <div style={{ color: "#7dd3fc", fontSize: 10, fontWeight: 700, letterSpacing: "0.08em" }}>
                                {entry.anchor.graph.type}
                              </div>
                              <div style={{ marginTop: 3, overflowWrap: "anywhere", color: "#e2e8f0", fontSize: 11 }}>
                                {entry.anchor.graph.id}
                              </div>
                            </button>
                          );
                        }

                        if ("experiment" in entry.anchor) {
                          const experiment = entry.anchor.experiment;
                          const projection = experiment.projection;
                          return <button key={entry.anchor.anchorId} type="button" onClick={() => handleInsert(entry)} title="Insert a structured non-canonical experimental reference into Author." className="research-inbox-experiment">
                            <div>EXPERIMENT · {projection.delta.state}</div>
                            <strong>{eventDisplayName(experiment.caseAEventId)} ↔ {eventDisplayName(experiment.caseBEventId)}</strong>
                            <span>Experimental layers · {projection.provenance.experimentalLayerIds.join(" · ") || "NONE"}</span>
                            <span>Experimental score · {projection.experimental.relationship.availability === "AVAILABLE" ? formatPercent(projection.experimental.relationship.score) : "UNAVAILABLE"}</span>
                            <span>Baseline score · {projection.baseline.relationship.availability === "AVAILABLE" ? formatPercent(projection.baseline.relationship.score) : "UNAVAILABLE"}</span>
                            <em>NON-CANONICAL</em>
                            <span>Experimental result; no canonical relationship was created.</span>
                          </button>;
                        }

                        if (entry.anchor.kind !== "COMPARE_CANDIDATE") {
                          const anchor = entry.anchor;
                          return <button key={anchor.anchorId} type="button" disabled={anchor.insertability.state !== "INSERTABLE"} onClick={() => handleInsert(entry)} title={anchor.insertability.reason} style={{ width: "100%", padding: "9px 0", display: "block", border: 0, borderBottom: "1px solid rgba(148,163,184,0.10)", background: "transparent", color: "inherit", cursor: anchor.insertability.state === "INSERTABLE" ? "pointer" : "default", fontFamily: "inherit", textAlign: "left" }}><div style={{ color: "#7dd3fc", fontSize: 10, fontWeight: 700 }}>{anchor.sourceWorkspace} · {anchor.kind}</div><div style={{ color: "#e2e8f0", fontSize: 11 }}>{anchor.display.title}</div><div style={{ color: "#94a3b8", fontSize: 10 }}>{anchor.display.summary}</div><div style={{ color: anchor.insertability.state === "INSERTABLE" ? "#86efac" : "#fbbf24", fontSize: 10 }}>{anchor.insertability.state.replaceAll("_", " ")} · {anchor.insertability.reason}</div></button>;
                        }
                        const candidate = entry.anchor.candidate;
                        const availableCount = candidate.dimensions.filter(dimension => dimension.status === "AVAILABLE").length;
                        const unavailableCount = candidate.dimensions.length - availableCount;
                        const inspectionDescription = "Open this deterministic pairwise comparison. Research publication does not accept or create a relationship.";

                        return (
                          <details
                            key={entry.anchor.anchorId}
                            title={inspectionDescription}
                            style={{ padding: "9px 0", borderBottom: "1px solid rgba(148,163,184,0.10)" }}
                          >
                            <summary aria-label={inspectionDescription} style={{ cursor: "pointer", listStylePosition: "outside" }}>
                              <div style={{ display: "inline", color: "#7dd3fc", fontSize: 10, fontWeight: 700, letterSpacing: "0.08em" }}>
                                PAIRWISE CORRESPONDENCE
                              </div>
                              <div style={{ marginTop: 3, overflowWrap: "anywhere", color: "#e2e8f0", fontSize: 11 }}>
                                {candidate.focusedEventId} ↔ {candidate.comparisonEventId}
                              </div>
                              <div style={{ marginTop: 3, color: "#94a3b8", fontSize: 10 }}>
                                {formatPercent(candidate.aggregate.aggregateSimilarity)} aggregate · {candidate.aggregate.participatingDimensionCount}/{candidate.aggregate.totalDimensionCount} participating
                              </div>
                              <div style={{ marginTop: 2, color: "#fbbf24", fontSize: 10 }}>
                                CANDIDATE — inspection only
                              </div>
                            </summary>

                            <div style={{ marginTop: 9, paddingLeft: 12, display: "grid", gap: 7, fontSize: 10, overflowWrap: "anywhere" }}>
                              <div><strong>Focused EVENT</strong> {candidate.focusedEventId}<br />Knowledge Object {candidate.focusedEventKnowledgeObjectId}</div>
                              <div><strong>Comparison EVENT</strong> {candidate.comparisonEventId}<br />Knowledge Object {candidate.comparisonEventKnowledgeObjectId}</div>
                              <div><strong>Candidate ID</strong> {candidate.candidateId}</div>
                              <div><strong>Evaluation ID</strong> {candidate.evaluationId}</div>
                              <div><strong>Resolve execution</strong> {candidate.resolveExecutionId ?? "UNAVAILABLE"}</div>
                              <div><strong>Canonical lineage</strong><br />LEFT {candidate.leftKnowledgeObjectId}<br />RIGHT {candidate.rightKnowledgeObjectId}</div>
                              <div><strong>Aggregate availability</strong> AVAILABLE · {formatPercent(candidate.aggregate.aggregateSimilarity)}</div>
                              <div><strong>Evidence counts</strong> {candidate.aggregate.participatingDimensionCount} participating · {availableCount} available · {unavailableCount} unavailable · {candidate.aggregate.totalDimensionCount} total</div>

                              <div style={{ display: "grid", gap: 4 }}>
                                {candidateDimensionOrder.map(([dimensionId, label]) => {
                                  const dimension = candidate.dimensions.find(item => item.dimension === dimensionId);
                                  if (!dimension) return <div key={dimensionId}><strong>{label}</strong> — INVALID · canonical dimension absent</div>;
                                  if (dimension.source.availability === "AVAILABLE") {
                                    return <div key={dimensionId}><strong>{label}</strong> — AVAILABLE · {formatPercent(dimension.source.similarity)}</div>;
                                  }
                                  return <div key={dimensionId}><strong>{label}</strong> — UNAVAILABLE · {dimension.source.reason}</div>;
                                })}
                              </div>

                              <div><strong>Epistemic status</strong> {candidate.epistemicStatus}</div>
                              <div><strong>Source</strong> COMPARE pair inspection</div>
                              <div style={{ color: "#fbbf24" }}>Candidate comparison — not an accepted EDGE. No Author REFERENCE insertion.</div>
                            </div>
                          </details>
                        );
                      },
                    )

                )
            }

          </div>

          <div
            style={{
              padding:
                "8px 14px",

              flexShrink:
                0,

              borderTop:
                "1px solid rgba(148,163,184,0.14)",

              background:
                "rgba(15,23,42,0.94)",

              color:
                "#718096",

              fontSize:
                10,

              letterSpacing:
                "0.04em",
            }}
          >
            Graph and experimental references can be inserted into Author.
            Candidates remain research inspection entries.
          </div>

        </>

      )}

    </aside>

    </>

  );

}
