// ============================================================
// tools/verification/VerifyLegacyKnowledgeSemanticComparison.ts
// P56A
// LEGACY ↔ KNOWLEDGE SEMANTIC TOPOLOGY VERIFICATION
//
// Executes the real deterministic topology paths:
//
//     SYSTEM CANON
//          ↓
//     Legacy Corpus
//          ↓
//     Legacy Investigation Graph
//
// and:
//
//     SYSTEM CANON
//          ↓
//     Knowledge Adapter
//          ↓
//          K
//          ↓
//     Knowledge Topology G0
//          ↓
//     Manifold Adapter
//
// Physical IDs differ between these architectures.
//
// This verification therefore uses the migration-aware
// semantic comparator to determine which topology is:
//
// • semantically shared
// • legacy-only
// • knowledge-only
//
// Expected architectural decomposition:
//
// SHARED
//   EVENT nodes
//   infrastructure ENTITY/FACILITY nodes
//   OBSERVED_AT edges
//
// KNOWLEDGE-ONLY
//   LOCATION nodes
//   LOCATED_AT edges
//
// LEGACY-ONLY
//   computed SIMILARITY edges
//
// No React.
// No application runtime mutation.
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
  compareInvestigationGraphsSemantically,
} from "../../src/knowledge/topology/KnowledgeTopologySemanticComparator";

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
// LEGACY SYSTEM CANON CORPUS
// ============================================================
//
// Reconstruct only the System Canon portion of the legacy
// Corpus.
//
// SCU is deliberately excluded.
//
// This guarantees both graph paths begin with exactly the
// same canonical source-event population.
//
// ============================================================

function buildLegacySystemCanonCorpus():
CorpusEvent[] {

  const corpus:
    CorpusEvent[] =
    CANONICAL_EVENTS.map(
      event => {

        const deterministicTimestamp =
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

              imported_at:
                deterministicTimestamp,

            },
          ],

          similarity_resolutions:
            [],

          created_at:
            deterministicTimestamp,

          updated_at:
            deterministicTimestamp,

        };

      },
    );

  // ----------------------------------------------------------
  // LEGACY COMPUTATIONAL RESOLUTION
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
// NEUTRAL COMPARISON WORKSPACE
// ============================================================
//
// Legacy graph construction requires Workspace.
//
// We intentionally:
//
// • import every System Canon event
// • add no artifacts
// • focus the first canonical event
//
// This minimizes workspace-specific topology.
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
      "verification:p56a-semantic",

    name:
      "P56A Semantic Topology Comparison",

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

function printNodeList(
  title: string,
  nodes: {
    id: string;
    label: string;
    type: string;
  }[],
): void {

  console.log("");
  console.log(title);

  if (
    nodes.length === 0
  ) {

    console.log(
      "  (none)",
    );

    return;

  }

  for (
    const node of nodes
  ) {

    console.log(
      `  ${node.id}`,
    );

    console.log(
      `    ${node.type} / ${node.label}`,
    );

  }

}

// ============================================================
// SHARED NODE REPORT
// ============================================================

function printSharedNodes(
  shared:
    ReturnType<
      typeof compareInvestigationGraphsSemantically
    >["sharedNodes"],
): void {

  console.log("");
  console.log(
    "SEMANTICALLY SHARED NODES",
  );

  if (
    shared.length === 0
  ) {

    console.log(
      "  (none)",
    );

    return;

  }

  for (
    const match of shared
  ) {

    console.log(
      `  ${match.semanticId}`,
    );

    console.log(
      `    legacy:    ${match.legacyId}`,
    );

    console.log(
      `    knowledge: ${match.knowledgeId}`,
    );

    console.log(
      `    equivalent: type=${match.typeEquivalent} label=${match.labelEquivalent}`,
    );

  }

}

// ============================================================
// SHARED EDGE REPORT
// ============================================================

function printSharedEdges(
  shared:
    ReturnType<
      typeof compareInvestigationGraphsSemantically
    >["sharedEdges"],
): void {

  console.log("");
  console.log(
    "SEMANTICALLY SHARED EDGES",
  );

  if (
    shared.length === 0
  ) {

    console.log(
      "  (none)",
    );

    return;

  }

  for (
    const match of shared
  ) {

    console.log(
      `  ${match.semanticId}`,
    );

    console.log(
      `    legacy:    ${match.legacyId}`,
    );

    console.log(
      `    knowledge: ${match.knowledgeId}`,
    );

    console.log(
      `    relationship: legacy=${match.legacy.relationship} knowledge=${match.knowledge.relationship}`,
    );

    console.log(
      `    weight:       legacy=${match.legacy.weight} knowledge=${match.knowledge.weight}`,
    );

    console.log(
      `    equivalent:   relationship=${match.relationshipEquivalent} weight=${match.weightEquivalent}`,
    );

  }

}

// ============================================================
// EDGE LIST REPORT
// ============================================================

function printEdgeList(
  title: string,
  edges:
    ReturnType<
      typeof compareInvestigationGraphsSemantically
    >["legacyOnlyEdges"],
): void {

  console.log("");
  console.log(title);

  if (
    edges.length === 0
  ) {

    console.log(
      "  (none)",
    );

    return;

  }

  for (
    const edge of edges
  ) {

    console.log(
      `  ${edge.id}`,
    );

    console.log(
      `    ${edge.source}`,
    );

    console.log(
      `      ↓ ${edge.relationship}`,
    );

    console.log(
      `    ${edge.target}`,
    );

    console.log(
      `    weight: ${edge.weight}`,
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
    "P56A LEGACY ↔ KNOWLEDGE SEMANTIC COMPARISON",
  );

  console.log(
    "==============================================",
  );

  // ==========================================================
  // LEGACY GRAPH
  // ==========================================================

  const legacyCorpus =
    buildLegacySystemCanonCorpus();

  const workspace =
    buildComparisonWorkspace();

  const legacyGraph =
    buildLegacyInvestigationGraph(
      legacyCorpus,
      workspace,
    );

  // ==========================================================
  // KNOWLEDGE POPULATION
  // ==========================================================

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

  // ==========================================================
  // SEMANTIC COMPARISON
  // ==========================================================

  const comparison =
    compareInvestigationGraphsSemantically(
      legacyGraph,
      knowledgeGraph,
    );

  // ==========================================================
  // SOURCE INVARIANTS
  // ==========================================================

  assert(
    legacyCorpus.length ===
      CANONICAL_EVENTS.length,
    "Legacy source population must equal System Canon population.",
  );

  assert(
    knowledgeObjects.length > 0,
    "System Canon Knowledge ingress must produce Knowledge Objects.",
  );

  assert(
    knowledgeGraph.nodes.length ===
      knowledgeTopology.nodes.length,
    "Knowledge adapter must preserve node population.",
  );

  assert(
    knowledgeGraph.edges.length ===
      knowledgeTopology.edges.length,
    "Knowledge adapter must preserve edge population.",
  );

  // ==========================================================
  // EXPECTED MIGRATION INVARIANTS
  // ==========================================================
  //
  // Current System Canon fixture:
  //
  //     3 EVENT
  //    10 infrastructure ENTITY/FACILITY
  //     3 LOCATION
  //
  // Shared semantic topology:
  //
  //    13 nodes
  //    10 OBSERVED_AT edges
  //
  // Legacy-only computed topology:
  //
  //     3 SIMILARITY edges
  //
  // Knowledge-only explicit topology:
  //
  //     3 LOCATION nodes
  //     3 LOCATED_AT edges
  //
  // These assertions intentionally describe the current
  // migration boundary. If System Canon changes later, this
  // verification should be updated deliberately.
  //
  // ==========================================================
  // PRE-ASSERT SEMANTIC DIAGNOSTICS
  // ==========================================================
  //
  // Print the actual semantic comparison before enforcing the
  // expected migration invariants.
  //
  // This allows comparator/mapping failures to expose their
  // evidence instead of terminating before diagnostics.
  //
  // ==========================================================

  console.log("");
  console.log(
    "PRE-ASSERT SEMANTIC DIAGNOSTICS",
  );

  console.log(
    JSON.stringify(
      comparison.summary,
      null,
      2,
    ),
  );

  console.log("");
  console.log(
    "SHARED SEMANTIC NODES",
  );

  if (
    comparison.sharedNodes.length === 0
  ) {

    console.log(
      "  (none)",
    );

  }

  for (
    const match of comparison.sharedNodes
  ) {

    console.log(
      `  ${match.semanticId}`,
    );

    console.log(
      `    legacy:    ${match.legacyId}`,
    );

    console.log(
      `    knowledge: ${match.knowledgeId}`,
    );

  }

  console.log("");
  console.log(
    "LEGACY-ONLY NODES",
  );

  if (
    comparison.legacyOnlyNodes.length === 0
  ) {

    console.log(
      "  (none)",
    );

  }

  for (
    const node of comparison.legacyOnlyNodes
  ) {

    console.log(
      `  ${node.type} :: ${node.id} :: ${node.label}`,
    );

  }

  console.log("");
  console.log(
    "KNOWLEDGE-ONLY NODES",
  );

  if (
    comparison.knowledgeOnlyNodes.length === 0
  ) {

    console.log(
      "  (none)",
    );

  }

  for (
    const node of comparison.knowledgeOnlyNodes
  ) {

    console.log(
      `  ${node.type} :: ${node.id} :: ${node.label}`,
    );

  }

  // ==========================================================
  // EXPECTED MIGRATION INVARIANTS
  // ==========================================================

  assert(
    comparison.summary
      .sharedSemanticNodeCount === 13,
    "Expected 13 semantically shared nodes.",
  );

  assert(
    comparison.summary
      .legacyOnlyNodeCount === 0,
    "Expected zero legacy-only nodes.",
  );

  assert(
    comparison.summary
      .knowledgeOnlyNodeCount === 3,
    "Expected three Knowledge-only LOCATION nodes.",
  );

  assert(
    comparison.summary
      .nodeSemanticDifferenceCount === 0,
    "Expected no semantic differences among shared nodes.",
  );

  assert(
    comparison.summary
      .sharedSemanticEdgeCount === 10,
    "Expected ten shared OBSERVED_AT edges.",
  );

  assert(
    comparison.summary
      .legacyOnlyEdgeCount === 3,
    "Expected three legacy-only SIMILARITY edges.",
  );

  assert(
    comparison.summary
      .knowledgeOnlyEdgeCount === 3,
    "Expected three Knowledge-only LOCATED_AT edges.",
  );

  // ==========================================================
  // PRE-ASSERT SHARED EDGE DIAGNOSTICS
  // ==========================================================
  //
  // Structural semantic matching has already established:
  //
  //   • 13 shared semantic nodes
  //   • 10 shared semantic edges
  //   • 3 legacy-only SIMILARITY edges
  //   • 3 Knowledge-only LOCATED_AT edges
  //
  // Print the ten matched edges before asserting full edge
  // semantic equivalence.
  //
  // This exposes relationship and weight differences without
  // weakening or bypassing the invariant.
  //
  // ==========================================================

  printSharedEdges(
    comparison.sharedEdges,
  );

  assert(
    comparison.summary
      .edgeSemanticDifferenceCount === 0,
    "Expected no semantic differences among shared edges.",
  );

  // ==========================================================
  // RELATIONSHIP CLASSIFICATION
  // ==========================================================

  assert(
    comparison.legacyOnlyEdges.every(
      edge =>
        edge.relationship ===
        "SIMILARITY",
    ),
    "All legacy-only edges must be computed SIMILARITY relationships.",
  );

  assert(
    comparison.knowledgeOnlyEdges.every(
      edge =>
        edge.relationship ===
        "LOCATED_AT",
    ),
    "All Knowledge-only edges must be explicit LOCATED_AT relationships.",
  );

  assert(
    comparison.sharedEdges.every(
      match =>
        match.legacy.relationship ===
          "OBSERVED_AT" &&
        match.knowledge.relationship ===
          "OBSERVED_AT",
    ),
    "All shared semantic edges must be OBSERVED_AT relationships.",
  );

  assert(
    comparison.knowledgeOnlyNodes.every(
      node =>
        node.type ===
        "LOCATION",
    ),
    "All Knowledge-only nodes must be LOCATION nodes.",
  );

  // ==========================================================
  // SUMMARY
  // ==========================================================

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
    "SEMANTIC COMPARISON SUMMARY",
  );

  console.log(
    JSON.stringify(
      comparison.summary,
      null,
      2,
    ),
  );

  // ==========================================================
  // DETAIL REPORT
  // ==========================================================

  printSharedNodes(
    comparison.sharedNodes,
  );

  printNodeList(
    "LEGACY-ONLY NODES",
    comparison.legacyOnlyNodes,
  );

  printNodeList(
    "KNOWLEDGE-ONLY NODES",
    comparison.knowledgeOnlyNodes,
  );

  printSharedEdges(
    comparison.sharedEdges,
  );

  printEdgeList(
    "LEGACY-ONLY EDGES",
    comparison.legacyOnlyEdges,
  );

  printEdgeList(
    "KNOWLEDGE-ONLY EDGES",
    comparison.knowledgeOnlyEdges,
  );

  // ==========================================================
  // ARCHITECTURAL RESULT
  // ==========================================================

  console.log("");
  console.log(
    "==============================================",
  );

  console.log(
    "PASS  semantic identity migration",
  );

  console.log(
    "PASS  shared source topology",
  );

  console.log(
    "PASS  Knowledge LOCATION expansion",
  );

  console.log(
    "PASS  legacy SIMILARITY isolation",
  );

  console.log(
    "==============================================",
  );

  console.log("");

  console.log(
    "Canonical decomposition:",
  );

  console.log("");

  console.log(
    "G0(K)",
  );

  console.log(
    "  = explicit Knowledge topology",
  );

  console.log("");

  console.log(
    "Gcomputed",
  );

  console.log(
    "  = derived computational topology",
  );

  console.log(
    "  = legacy SIMILARITY today",
  );

  console.log(
    "  = future Discovery / RDC responsibility",
  );

  console.log("");

  console.log(
    "Gmanifold",
  );

  console.log(
    "  = projection(G0 + Gcomputed + workspace state)",
  );

  console.log("");

  console.log(
    "All semantic migration invariants passed.",
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