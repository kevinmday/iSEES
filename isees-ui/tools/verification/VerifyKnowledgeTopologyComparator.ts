// ============================================================
// tools/verification/VerifyKnowledgeTopologyComparator.ts
// P56A
// KNOWLEDGE TOPOLOGY COMPARATOR VERIFICATION
//
// Verifies the deterministic migration comparator used to
// compare:
//
//     Legacy InvestigationGraph
//              ⇅
//     Knowledge-derived InvestigationGraph
//
// Required invariants:
//
// • identical graphs compare equivalent
// • node additions are detected
// • node removals are detected
// • node semantic differences are detected
// • edge additions are detected
// • edge removals are detected
// • edge semantic differences are detected
// • input permutation does not change comparison semantics
// • comparison does not mutate either graph
//
// No React.
// No runtime.
// No Corpus.
// No persistence.
// No networking.
// No AI.
//
// ============================================================

import type {
  GraphEdge,
  GraphNode,
  InvestigationGraph,
} from "../../src/manifold/graphTypes";

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
// HELPERS
// ============================================================

function serialize(
  value: unknown,
): string {

  return JSON.stringify(
    value,
  );

}

function createStatistics(
  nodes: GraphNode[],
  edges: GraphEdge[],
) {

  return {

    nodeCount:
      nodes.length,

    edgeCount:
      edges.length,

    eventCount:
      nodes.filter(
        node =>
          node.type === "EVENT",
      ).length,

    facilityCount:
      nodes.filter(
        node =>
          node.type === "FACILITY",
      ).length,

    artifactCount:
      nodes.filter(
        node =>
          node.type === "ARTIFACT",
      ).length,

    personCount:
      nodes.filter(
        node =>
          node.type === "PERSON",
      ).length,

    organizationCount:
      nodes.filter(
        node =>
          node.type === "ORGANIZATION",
      ).length,

    locationCount:
      nodes.filter(
        node =>
          node.type === "LOCATION",
      ).length,

    narrativeCount:
      nodes.filter(
        node =>
          node.type === "NARRATIVE",
      ).length,

    hypothesisCount:
      nodes.filter(
        node =>
          node.type === "HYPOTHESIS",
      ).length,

  };

}

function createGraph(
  nodes: GraphNode[],
  edges: GraphEdge[],
): InvestigationGraph {

  return {

    nodes,

    edges,

    statistics:
      createStatistics(
        nodes,
        edges,
      ),

  };

}

// ============================================================
// FIXTURES
// ============================================================

const EVENT_A: GraphNode = {

  id:
    "event:a",

  label:
    "Event A",

  type:
    "EVENT",

  iconType:
    "UAP",

};

const EVENT_B: GraphNode = {

  id:
    "event:b",

  label:
    "Event B",

  type:
    "EVENT",

  iconType:
    "UAP",

};

const FACILITY_A: GraphNode = {

  id:
    "facility:a",

  label:
    "Facility A",

  type:
    "FACILITY",

  iconType:
    "BUILDING",

};

const EDGE_AB: GraphEdge = {

  id:
    "event:a::event:b",

  source:
    "event:a",

  target:
    "event:b",

  relationship:
    "SIMILARITY",

  weight:
    0.75,

  rationale: [
    "verification",
  ],

};

const EDGE_AF: GraphEdge = {

  id:
    "event:a::facility:a",

  source:
    "event:a",

  target:
    "facility:a",

  relationship:
    "OBSERVED_AT",

  weight:
    1,

  rationale: [
    "verification",
  ],

};

// ============================================================
// TEST 1
// IDENTICAL GRAPHS
// ============================================================

function verifyIdenticalGraphs(): void {

  const left =
    createGraph(
      [
        EVENT_A,
        EVENT_B,
      ],
      [
        EDGE_AB,
      ],
    );

  const right =
    createGraph(
      [
        EVENT_A,
        EVENT_B,
      ],
      [
        EDGE_AB,
      ],
    );

  const comparison =
    compareInvestigationGraphs(
      left,
      right,
    );

  assert(
    comparison.summary.equivalent,
    "Identical graphs must compare equivalent.",
  );

  assert(
    comparison.summary.sharedNodeCount === 2,
    "Identical graphs must contain two shared nodes.",
  );

  assert(
    comparison.summary.sharedEdgeCount === 1,
    "Identical graphs must contain one shared edge.",
  );

}

// ============================================================
// TEST 2
// KNOWLEDGE-ONLY NODE
// ============================================================

function verifyKnowledgeOnlyNode(): void {

  const legacy =
    createGraph(
      [
        EVENT_A,
      ],
      [],
    );

  const knowledge =
    createGraph(
      [
        EVENT_A,
        EVENT_B,
      ],
      [],
    );

  const comparison =
    compareInvestigationGraphs(
      legacy,
      knowledge,
    );

  assert(
    !comparison.summary.equivalent,
    "Graph with knowledge-only node must not compare equivalent.",
  );

  assert(
    comparison.summary.knowledgeOnlyNodeCount === 1,
    "Knowledge-only node must be detected.",
  );

  assert(
    comparison.knowledgeOnlyNodes[0]?.id ===
      "event:b",
    "Correct knowledge-only node must be reported.",
  );

}

// ============================================================
// TEST 3
// LEGACY-ONLY NODE
// ============================================================

function verifyLegacyOnlyNode(): void {

  const legacy =
    createGraph(
      [
        EVENT_A,
        EVENT_B,
      ],
      [],
    );

  const knowledge =
    createGraph(
      [
        EVENT_A,
      ],
      [],
    );

  const comparison =
    compareInvestigationGraphs(
      legacy,
      knowledge,
    );

  assert(
    comparison.summary.legacyOnlyNodeCount === 1,
    "Legacy-only node must be detected.",
  );

  assert(
    comparison.legacyOnlyNodes[0]?.id ===
      "event:b",
    "Correct legacy-only node must be reported.",
  );

}

// ============================================================
// TEST 4
// NODE SEMANTIC DIFFERENCE
// ============================================================

function verifyNodeSemanticDifference(): void {

  const legacy =
    createGraph(
      [
        EVENT_A,
      ],
      [],
    );

  const changed: GraphNode = {

    ...EVENT_A,

    label:
      "Changed Event A",

  };

  const knowledge =
    createGraph(
      [
        changed,
      ],
      [],
    );

  const comparison =
    compareInvestigationGraphs(
      legacy,
      knowledge,
    );

  assert(
    comparison.summary
      .nodeSemanticDifferenceCount === 1,
    "Node semantic difference must be detected.",
  );

  assert(
    comparison.nodeDifferences[0]
      ?.labelMismatch === true,
    "Node label mismatch must be reported.",
  );

}

// ============================================================
// TEST 5
// KNOWLEDGE-ONLY EDGE
// ============================================================

function verifyKnowledgeOnlyEdge(): void {

  const nodes = [
    EVENT_A,
    EVENT_B,
  ];

  const legacy =
    createGraph(
      nodes,
      [],
    );

  const knowledge =
    createGraph(
      nodes,
      [
        EDGE_AB,
      ],
    );

  const comparison =
    compareInvestigationGraphs(
      legacy,
      knowledge,
    );

  assert(
    comparison.summary.knowledgeOnlyEdgeCount === 1,
    "Knowledge-only edge must be detected.",
  );

}

// ============================================================
// TEST 6
// LEGACY-ONLY EDGE
// ============================================================

function verifyLegacyOnlyEdge(): void {

  const nodes = [
    EVENT_A,
    EVENT_B,
  ];

  const legacy =
    createGraph(
      nodes,
      [
        EDGE_AB,
      ],
    );

  const knowledge =
    createGraph(
      nodes,
      [],
    );

  const comparison =
    compareInvestigationGraphs(
      legacy,
      knowledge,
    );

  assert(
    comparison.summary.legacyOnlyEdgeCount === 1,
    "Legacy-only edge must be detected.",
  );

}

// ============================================================
// TEST 7
// EDGE SEMANTIC DIFFERENCE
// ============================================================

function verifyEdgeSemanticDifference(): void {

  const nodes = [
    EVENT_A,
    EVENT_B,
  ];

  const legacy =
    createGraph(
      nodes,
      [
        EDGE_AB,
      ],
    );

  const changed: GraphEdge = {

    ...EDGE_AB,

    relationship:
      "ASSOCIATED_WITH",

    weight:
      0.25,

  };

  const knowledge =
    createGraph(
      nodes,
      [
        changed,
      ],
    );

  const comparison =
    compareInvestigationGraphs(
      legacy,
      knowledge,
    );

  assert(
    comparison.summary
      .edgeSemanticDifferenceCount === 1,
    "Edge semantic difference must be detected.",
  );

  assert(
    comparison.edgeDifferences[0]
      ?.relationshipMismatch === true,
    "Relationship mismatch must be reported.",
  );

  assert(
    comparison.edgeDifferences[0]
      ?.weightMismatch === true,
    "Weight mismatch must be reported.",
  );

}

// ============================================================
// TEST 8
// MULTIPLE DIFFERENCES
// ============================================================

function verifyMultipleDifferences(): void {

  const legacy =
    createGraph(
      [
        EVENT_A,
        EVENT_B,
      ],
      [
        EDGE_AB,
      ],
    );

  const knowledge =
    createGraph(
      [
        EVENT_A,
        FACILITY_A,
      ],
      [
        EDGE_AF,
      ],
    );

  const comparison =
    compareInvestigationGraphs(
      legacy,
      knowledge,
    );

  assert(
    comparison.summary.sharedNodeCount === 1,
    "One shared node must be detected.",
  );

  assert(
    comparison.summary.legacyOnlyNodeCount === 1,
    "One legacy-only node must be detected.",
  );

  assert(
    comparison.summary.knowledgeOnlyNodeCount === 1,
    "One knowledge-only node must be detected.",
  );

  assert(
    comparison.summary.legacyOnlyEdgeCount === 1,
    "One legacy-only edge must be detected.",
  );

  assert(
    comparison.summary.knowledgeOnlyEdgeCount === 1,
    "One knowledge-only edge must be detected.",
  );

}

// ============================================================
// TEST 9
// INPUT PERMUTATION
// ============================================================

function verifyInputPermutation(): void {

  const graphA =
    createGraph(
      [
        EVENT_A,
        EVENT_B,
        FACILITY_A,
      ],
      [
        EDGE_AB,
        EDGE_AF,
      ],
    );

  const graphB =
    createGraph(
      [
        FACILITY_A,
        EVENT_B,
        EVENT_A,
      ],
      [
        EDGE_AF,
        EDGE_AB,
      ],
    );

  const comparison =
    compareInvestigationGraphs(
      graphA,
      graphB,
    );

  assert(
    comparison.summary.equivalent,
    "Input permutation must not change graph equivalence.",
  );

  assert(
    comparison.summary.sharedNodeCount === 3,
    "Permutation must preserve shared node population.",
  );

  assert(
    comparison.summary.sharedEdgeCount === 2,
    "Permutation must preserve shared edge population.",
  );

}

// ============================================================
// TEST 10
// INPUT IMMUTABILITY
// ============================================================

function verifyInputImmutability(): void {

  const legacy =
    createGraph(
      [
        EVENT_B,
        EVENT_A,
      ],
      [
        EDGE_AB,
      ],
    );

  const knowledge =
    createGraph(
      [
        EVENT_A,
        EVENT_B,
      ],
      [
        EDGE_AB,
      ],
    );

  const legacyBefore =
    serialize(
      legacy,
    );

  const knowledgeBefore =
    serialize(
      knowledge,
    );

  compareInvestigationGraphs(
    legacy,
    knowledge,
  );

  assert(
    serialize(
      legacy,
    ) === legacyBefore,
    "Comparator must not mutate legacy graph.",
  );

  assert(
    serialize(
      knowledge,
    ) === knowledgeBefore,
    "Comparator must not mutate knowledge graph.",
  );

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
    "P56A KNOWLEDGE TOPOLOGY COMPARATOR VERIFICATION",
  );

  console.log(
    "==============================================",
  );

  console.log("");

  verifyIdenticalGraphs();

  console.log(
    "PASS  identical graphs",
  );

  verifyKnowledgeOnlyNode();

  console.log(
    "PASS  knowledge-only node",
  );

  verifyLegacyOnlyNode();

  console.log(
    "PASS  legacy-only node",
  );

  verifyNodeSemanticDifference();

  console.log(
    "PASS  node semantic difference",
  );

  verifyKnowledgeOnlyEdge();

  console.log(
    "PASS  knowledge-only edge",
  );

  verifyLegacyOnlyEdge();

  console.log(
    "PASS  legacy-only edge",
  );

  verifyEdgeSemanticDifference();

  console.log(
    "PASS  edge semantic difference",
  );

  verifyMultipleDifferences();

  console.log(
    "PASS  multiple differences",
  );

  verifyInputPermutation();

  console.log(
    "PASS  input permutation",
  );

  verifyInputImmutability();

  console.log(
    "PASS  input immutability",
  );

  console.log("");

  console.log(
    "All Knowledge Topology Comparator invariants passed.",
  );

  console.log("");

  console.log(
    "Comparator invariant:",
  );

  console.log(
    "same semantic graph -> equivalent regardless of input order",
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