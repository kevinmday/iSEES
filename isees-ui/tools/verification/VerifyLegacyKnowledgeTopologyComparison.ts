// ============================================================
// tools/verification/VerifyLegacyKnowledgeTopologyComparison.ts
// P56A
// LEGACY ↔ KNOWLEDGE TOPOLOGY COMPARISON
//
// Executes the real deterministic topology paths:
//
//     SYSTEM CANON
//          ↓
//     Legacy Corpus
//          ↓
//     Legacy Manifold Graph
//
// and:
//
//     SYSTEM CANON
//          ↓
//     Knowledge Ingress
//          ↓
//          K
//          ↓
//     Knowledge Topology
//          ↓
//     Manifold Adapter
//
// The resulting graphs are compared using the verified
// KnowledgeTopologyComparator.
//
// Diagnostic only.
//
// No React.
// No mutation of application runtime.
// No persistence.
// No networking.
// No AI.
//
// ============================================================
import {
  CANONICAL_EVENTS,
} from "../../src/canonical/runtimeCorpus";

import type {
  CorpusEvent,
} from "../../src/corpus/corpusTypes";

import {
  resolveAgainstCorpus,
} from "../../src/corpus/resolution/resolutionEngine";

import type {
  Workspace,
} from "../../src/workspace/workspaceTypes";

import {
  buildInvestigationGraph as buildLegacyInvestigationGraph,
} from "../../src/manifold/graphBuilder";

import {
  adaptSystemCanonToKnowledge,
} from "../../src/knowledge/ingestion/SystemCanonKnowledgeAdapter";

import {
  buildKnowledgeTopology,
} from "../../src/knowledge/topology/KnowledgeTopologyBuilder";

import {
  adaptKnowledgeTopology,
} from "../../src/knowledge/topology/KnowledgeTopologyAdapter";

import {
  compareInvestigationGraphs,
} from "../../src/knowledge/topology/KnowledgeTopologyComparator";
// ============================================================
// ASSERT
// ============================================================

function assert(
  condition: boolean,
  message: string,
): void {

  if (!condition) {

    throw new Error(
      `VERIFY FAILED: ${message}`,
    );

  }

}

// ============================================================
// LEGACY CORPUS
// ============================================================
//
// Reconstruct the System Canon portion of the same Corpus
// pipeline used by the legacy application.
//
// We deliberately exclude SCU here.
//
// This comparison answers:
//
//     Given the SAME System Canon source population,
//     what topology does each architecture produce?
//
// That prevents source-population differences from being
// mistaken for graph-builder differences.
//
// ============================================================

function buildLegacySystemCanonCorpus():
CorpusEvent[] {

  const corpus:
    CorpusEvent[] =
    CANONICAL_EVENTS.map(
      event => {

        const timestamp =
          event.event_id;

        return {

          corpus_id:
            event.event_id,

          canonical_event:
            event,

          resolutions: [
            {

              source_id:
                event.event_id,

              source_type:
                "SYSTEM_CANON",

              confidence:
                1,

              // Deterministic placeholder.
              //
              // The legacy graph builder does not use this
              // timestamp for semantic topology.
              imported_at:
                timestamp,

            },
          ],

          similarity_resolutions:
            [],

          created_at:
            timestamp,

          updated_at:
            timestamp,

        };

      },
    );

  // ----------------------------------------------------------
  // LEGACY RESOLUTION PASS
  // ----------------------------------------------------------

  for (
    const event of corpus
  ) {

    event.similarity_resolutions =
      resolveAgainstCorpus(
        event.canonical_event,
        corpus.filter(
          candidate =>
            candidate.corpus_id !==
            event.corpus_id,
        ),
      );

  }

  return corpus;

}

// ============================================================
// LEGACY WORKSPACE
// ============================================================
//
// The legacy graph builder requires a Workspace because it
// mixes semantic topology with workspace state.
//
// For this comparison we provide the smallest neutral
// workspace:
//
// • all System Canon events imported
// • no workspace artifacts
// • first canonical event focused
//
// This isolates semantic topology as much as the legacy
// contract allows.
//
// ============================================================

function buildComparisonWorkspace():
Workspace {

  const firstEvent =
    CANONICAL_EVENTS[0];

  assert(
    firstEvent !== undefined,
    "System Canon must contain at least one event.",
  );

  return {

    id:
      "verification:p56a",

    name:
      "P56A Topology Comparison",

    imported_events:
      CANONICAL_EVENTS.map(
        event => ({
          event_id:
            event.event_id,
        }),
      ),

    focused_event_id:
      firstEvent.event_id,

    artifacts:
      [],

  } as Workspace;

}

// ============================================================
// REPORT HELPERS
// ============================================================

function printIds(
  title: string,
  values: {
    id: string;
  }[],
): void {

  console.log("");
  console.log(title);

  if (
    values.length === 0
  ) {

    console.log(
      "  (none)",
    );

    return;

  }

  for (
    const value of values
  ) {

    console.log(
      `  ${value.id}`,
    );

  }

}

function printNodeDifferences(
  differences:
    ReturnType<
      typeof compareInvestigationGraphs
    >["nodeDifferences"],
): void {

  console.log("");
  console.log(
    "NODE SEMANTIC DIFFERENCES",
  );

  if (
    differences.length === 0
  ) {

    console.log(
      "  (none)",
    );

    return;

  }

  for (
    const difference of differences
  ) {

    console.log(
      `  ${difference.id}`,
    );

    console.log(
      `    typeMismatch: ${difference.typeMismatch}`,
    );

    console.log(
      `    labelMismatch: ${difference.labelMismatch}`,
    );

    console.log(
      `    legacy: ${difference.legacy?.type} / ${difference.legacy?.label}`,
    );

    console.log(
      `    knowledge: ${difference.knowledge?.type} / ${difference.knowledge?.label}`,
    );

  }

}

function printEdgeDifferences(
  differences:
    ReturnType<
      typeof compareInvestigationGraphs
    >["edgeDifferences"],
): void {

  console.log("");
  console.log(
    "EDGE SEMANTIC DIFFERENCES",
  );

  if (
    differences.length === 0
  ) {

    console.log(
      "  (none)",
    );

    return;

  }

  for (
    const difference of differences
  ) {

    console.log(
      `  ${difference.id}`,
    );

    console.log(
      `    sourceMismatch: ${difference.sourceMismatch}`,
    );

    console.log(
      `    targetMismatch: ${difference.targetMismatch}`,
    );

    console.log(
      `    relationshipMismatch: ${difference.relationshipMismatch}`,
    );

    console.log(
      `    weightMismatch: ${difference.weightMismatch}`,
    );

    console.log(
      `    legacy: ${difference.legacy?.source} -> ${difference.legacy?.target} [${difference.legacy?.relationship}] weight=${difference.legacy?.weight}`,
    );

    console.log(
      `    knowledge: ${difference.knowledge?.source} -> ${difference.knowledge?.target} [${difference.knowledge?.relationship}] weight=${difference.knowledge?.weight}`,
    );

  }

}

// ============================================================
// RUN
// ============================================================

function run(): void {

  console.log("");
  console.log(
    "==============================================",
  );

  console.log(
    "P56A LEGACY ↔ KNOWLEDGE TOPOLOGY COMPARISON",
  );

  console.log(
    "==============================================",
  );

  // ----------------------------------------------------------
  // LEGACY
  // ----------------------------------------------------------

  const legacyCorpus =
    buildLegacySystemCanonCorpus();

  const workspace =
    buildComparisonWorkspace();

  const legacyGraph =
    buildLegacyInvestigationGraph(
      legacyCorpus,
      workspace,
    );

  // ----------------------------------------------------------
  // KNOWLEDGE
  // ----------------------------------------------------------

const knowledgeObjects =
  adaptSystemCanonToKnowledge(
    CANONICAL_EVENTS,
  );

  const knowledgeTopology =
    buildKnowledgeTopology(
      knowledgeObjects,
    );

  const knowledgeGraph =
    adaptKnowledgeTopology(
      knowledgeTopology,
      {
        centerNodeId:
          workspace.focused_event_id ??
          undefined,
      },
    );

  // ----------------------------------------------------------
  // COMPARE
  // ----------------------------------------------------------

  const comparison =
    compareInvestigationGraphs(
      legacyGraph,
      knowledgeGraph,
    );

  // ----------------------------------------------------------
  // BASIC INVARIANTS
  // ----------------------------------------------------------

  assert(
    legacyCorpus.length ===
      CANONICAL_EVENTS.length,
    "Legacy comparison corpus must equal System Canon source population.",
  );

  assert(
    knowledgeObjects.length > 0,
    "Knowledge ingress must produce Knowledge Objects.",
  );

  assert(
    knowledgeGraph.nodes.length ===
      knowledgeTopology.nodes.length,
    "Knowledge adapter must preserve topology node population.",
  );

  assert(
    knowledgeGraph.edges.length ===
      knowledgeTopology.edges.length,
    "Knowledge adapter must preserve topology edge population.",
  );

  // ----------------------------------------------------------
  // SUMMARY
  // ----------------------------------------------------------

  console.log("");
  console.log(
    "SOURCE POPULATION",
  );

  console.log(
    `System Canon events: ${CANONICAL_EVENTS.length}`,
  );

  console.log(
    `Legacy corpus events: ${legacyCorpus.length}`,
  );

  console.log(
    `Knowledge Objects: ${knowledgeObjects.length}`,
  );

  console.log("");
  console.log(
    "GRAPH POPULATION",
  );

  console.log(
    `Legacy nodes: ${legacyGraph.nodes.length}`,
  );

  console.log(
    `Legacy edges: ${legacyGraph.edges.length}`,
  );

  console.log(
    `Knowledge nodes: ${knowledgeGraph.nodes.length}`,
  );

  console.log(
    `Knowledge edges: ${knowledgeGraph.edges.length}`,
  );

  console.log("");
  console.log(
    "COMPARISON SUMMARY",
  );

  console.log(
    JSON.stringify(
      comparison.summary,
      null,
      2,
    ),
  );

  // ----------------------------------------------------------
  // NODE DETAILS
  // ----------------------------------------------------------

  printIds(
    "LEGACY-ONLY NODES",
    comparison.legacyOnlyNodes,
  );

  printIds(
    "KNOWLEDGE-ONLY NODES",
    comparison.knowledgeOnlyNodes,
  );

  printNodeDifferences(
    comparison.nodeDifferences,
  );

  // ----------------------------------------------------------
  // EDGE DETAILS
  // ----------------------------------------------------------

  printIds(
    "LEGACY-ONLY EDGES",
    comparison.legacyOnlyEdges,
  );

  printIds(
    "KNOWLEDGE-ONLY EDGES",
    comparison.knowledgeOnlyEdges,
  );

  printEdgeDifferences(
    comparison.edgeDifferences,
  );

  // ----------------------------------------------------------
  // FINAL
  // ----------------------------------------------------------

  console.log("");
  console.log(
    "==============================================",
  );

  console.log(
    comparison.summary.equivalent
      ? "RESULT: TOPOLOGIES ARE EQUIVALENT"
      : "RESULT: TOPOLOGIES DIFFER",
  );

  console.log(
    "==============================================",
  );

  console.log("");

  console.log(
    "Interpretation:",
  );

  console.log(
    "Differences are migration evidence, not test failures.",
  );

  console.log(
    "The report identifies topology currently manufactured",
  );

  console.log(
    "by the legacy Corpus graph path versus topology explicitly",
  );

  console.log(
    "represented by canonical Knowledge K.",
  );

  console.log("");

}

// ============================================================
// EXECUTE
// ============================================================

run();

// ============================================================
// END
// ============================================================