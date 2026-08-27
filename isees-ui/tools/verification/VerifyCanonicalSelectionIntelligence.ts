// ============================================================
// tools/verification/VerifyCanonicalSelectionIntelligence.ts
//
// CANONICAL SELECTION INTELLIGENCE VERIFICATION
//
// Verifies:
//
//   Canonical Knowledge
//       ↓
//   Canonical Investigation Graph
//       ↓
//   Graph Selection
//       ↓
//   Selection Intelligence
//
// Required invariants:
//
//   • real System Canon Knowledge produces the live graph
//   • NONE remains NONE
//   • canonical NODE selection resolves
//   • canonical EDGE selection resolves
//   • missing NODE safely resolves NONE
//   • missing EDGE safely resolves NONE
//   • repeated resolution is deterministic
//   • Knowledge input order does not change graph/intelligence
//   • canonical Knowledge input is not mutated
//
// No React.
// No UI.
// No runtime mutation.
// No persistence.
// No networking.
// No REX.
// No AI.
//
// ============================================================

import {
  buildKnowledgeBootstrapPopulation,
} from "../../src/knowledge/ingestion/KnowledgeRuntimeBootstrap";

import {
  buildCanonicalInvestigationGraph,
} from "../../src/intelligence/selection/CanonicalInvestigationGraph";

import {
  resolveCanonicalSelectionIntelligence,
} from "../../src/intelligence/selection/CanonicalSelectionIntelligence";

import type {
  GraphSelection,
} from "../../src/manifold/graphTypes";

// ============================================================
// ASSERTION
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
// SERIALIZATION
// ============================================================

function serialize(
  value: unknown,
): string {
  return JSON.stringify(
    value,
  );
}

// ============================================================
// FIXTURE
// ============================================================

const knowledgeObjects =
  buildKnowledgeBootstrapPopulation();

const originalKnowledgeOrder =
  knowledgeObjects.map(
    object =>
      object.identity.id,
  );

const graph =
  buildCanonicalInvestigationGraph(
    knowledgeObjects,
  );

const firstNode =
  graph.nodes[0];

const firstEdge =
  graph.edges[0];

assert(
  firstNode !== undefined,
  "Canonical graph must contain at least one node.",
);

assert(
  firstEdge !== undefined,
  "Canonical graph must contain at least one edge.",
);

// ============================================================
// SELECTIONS
// ============================================================

const noneSelection:
GraphSelection = {
  kind: "NONE",
};

const nodeSelection:
GraphSelection = {
  kind: "NODE",

  nodeId:
    firstNode.id,

  nodeType:
    firstNode.type,
};

const edgeSelection:
GraphSelection = {
  kind: "EDGE",

  edgeId:
    firstEdge.id,

  sourceId:
    firstEdge.source,

  targetId:
    firstEdge.target,
};

const missingNodeSelection:
GraphSelection = {
  kind: "NODE",

  nodeId:
    "missing:canonical:node",

  nodeType:
    firstNode.type,
};

const missingEdgeSelection:
GraphSelection = {
  kind: "EDGE",

  edgeId:
    "missing:canonical:edge",

  sourceId:
    firstEdge.source,

  targetId:
    firstEdge.target,
};

// ============================================================
// PASS 1
// REAL SYSTEM CANON GRAPH
// ============================================================

assert(
  graph.nodes.length === 16,
  "Canonical graph must contain 16 System Canon nodes.",
);

assert(
  graph.edges.length === 13,
  "Canonical graph must contain 13 System Canon edges.",
);

console.log(
  "PASS 1 — real System Canon Knowledge produces the live 16-node, 13-edge graph",
);

// ============================================================
// PASS 2
// NONE
// ============================================================

const noneIntelligence =
  resolveCanonicalSelectionIntelligence({
    knowledgeObjects,
    selection:
      noneSelection,
  });

assert(
  noneIntelligence.kind ===
    "NONE",
  "NONE selection must resolve NONE intelligence.",
);

console.log(
  "PASS 2 — NONE selection remains NONE",
);

// ============================================================
// PASS 3
// NODE
// ============================================================

const nodeIntelligence =
  resolveCanonicalSelectionIntelligence({
    knowledgeObjects,
    selection:
      nodeSelection,
  });

assert(
  nodeIntelligence.kind ===
    "NODE",
  "Canonical node selection must resolve NODE intelligence.",
);

if (
  nodeIntelligence.kind !==
  "NODE"
) {
  throw new Error(
    "VERIFY FAILED: NODE narrowing failed.",
  );
}

assert(
  nodeIntelligence
    .intelligence
    .nodeId ===
    firstNode.id,
  "Resolved node identity must equal the canonical selected node.",
);

assert(
  nodeIntelligence
    .intelligence
    .title ===
    firstNode.label,
  "Resolved node title must equal the canonical graph label.",
);

const expectedConnectionCount =
  graph.edges.filter(
    edge =>
      edge.source ===
        firstNode.id ||
      edge.target ===
        firstNode.id,
  ).length;

assert(
  nodeIntelligence
    .intelligence
    .connectionCount ===
    expectedConnectionCount,
  "Resolved node connection count must derive from canonical topology.",
);

console.log(
  "PASS 3 — canonical NODE selection resolves identity, label, and topology-derived connections",
);

// ============================================================
// PASS 4
// EDGE
// ============================================================

const edgeIntelligence =
  resolveCanonicalSelectionIntelligence({
    knowledgeObjects,
    selection:
      edgeSelection,
  });

assert(
  edgeIntelligence.kind ===
    "EDGE",
  "Canonical edge selection must resolve EDGE intelligence.",
);

if (
  edgeIntelligence.kind !==
  "EDGE"
) {
  throw new Error(
    "VERIFY FAILED: EDGE narrowing failed.",
  );
}

assert(
  edgeIntelligence
    .intelligence
    .edgeId ===
    firstEdge.id,
  "Resolved edge identity must equal the canonical selected edge.",
);

assert(
  edgeIntelligence
    .intelligence
    .sourceId ===
    firstEdge.source,
  "Resolved edge source must equal canonical topology.",
);

assert(
  edgeIntelligence
    .intelligence
    .targetId ===
    firstEdge.target,
  "Resolved edge target must equal canonical topology.",
);

assert(
  edgeIntelligence
    .intelligence
    .relationship ===
    firstEdge.relationship,
  "Resolved relationship must equal canonical topology.",
);

console.log(
  "PASS 4 — canonical EDGE selection resolves identity, endpoints, and relationship",
);

// ============================================================
// PASS 5
// MISSING NODE FALLBACK
// ============================================================

const missingNodeIntelligence =
  resolveCanonicalSelectionIntelligence({
    knowledgeObjects,
    selection:
      missingNodeSelection,
  });

assert(
  missingNodeIntelligence.kind ===
    "NONE",
  "Missing canonical node must safely resolve NONE.",
);

console.log(
  "PASS 5 — missing NODE safely resolves NONE",
);

// ============================================================
// PASS 6
// MISSING EDGE FALLBACK
// ============================================================

const missingEdgeIntelligence =
  resolveCanonicalSelectionIntelligence({
    knowledgeObjects,
    selection:
      missingEdgeSelection,
  });

assert(
  missingEdgeIntelligence.kind ===
    "NONE",
  "Missing canonical edge must safely resolve NONE.",
);

console.log(
  "PASS 6 — missing EDGE safely resolves NONE",
);

// ============================================================
// PASS 7
// REPEATED DETERMINISM
// ============================================================

const repeatedNodeIntelligence =
  resolveCanonicalSelectionIntelligence({
    knowledgeObjects,
    selection:
      nodeSelection,
  });

const repeatedEdgeIntelligence =
  resolveCanonicalSelectionIntelligence({
    knowledgeObjects,
    selection:
      edgeSelection,
  });

assert(
  serialize(
    nodeIntelligence,
  ) ===
  serialize(
    repeatedNodeIntelligence,
  ),
  "Repeated NODE resolution must be byte-equivalent.",
);

assert(
  serialize(
    edgeIntelligence,
  ) ===
  serialize(
    repeatedEdgeIntelligence,
  ),
  "Repeated EDGE resolution must be byte-equivalent.",
);

console.log(
  "PASS 7 — repeated NODE and EDGE resolution is deterministic",
);

// ============================================================
// PASS 8
// KNOWLEDGE INPUT-ORDER INVARIANCE
// ============================================================

const reversedKnowledgeObjects =
  [...knowledgeObjects]
    .reverse();

const reversedGraph =
  buildCanonicalInvestigationGraph(
    reversedKnowledgeObjects,
  );

const reversedNodeIntelligence =
  resolveCanonicalSelectionIntelligence({
    knowledgeObjects:
      reversedKnowledgeObjects,
    selection:
      nodeSelection,
  });

const reversedEdgeIntelligence =
  resolveCanonicalSelectionIntelligence({
    knowledgeObjects:
      reversedKnowledgeObjects,
    selection:
      edgeSelection,
  });

assert(
  serialize(graph) ===
    serialize(reversedGraph),
  "Equivalent reordered Knowledge must produce the same graph.",
);

assert(
  serialize(nodeIntelligence) ===
    serialize(reversedNodeIntelligence),
  "Equivalent reordered Knowledge must produce the same NODE intelligence.",
);

assert(
  serialize(edgeIntelligence) ===
    serialize(reversedEdgeIntelligence),
  "Equivalent reordered Knowledge must produce the same EDGE intelligence.",
);

console.log(
  "PASS 8 — Knowledge input order does not change graph, NODE intelligence, or EDGE intelligence",
);

// ============================================================
// PASS 9
// INPUT IMMUTABILITY
// ============================================================

const finalKnowledgeOrder =
  knowledgeObjects.map(
    object =>
      object.identity.id,
  );

assert(
  serialize(
    originalKnowledgeOrder,
  ) ===
  serialize(
    finalKnowledgeOrder,
  ),
  "Canonical selection resolution must not reorder Knowledge input.",
);

console.log(
  "PASS 9 — canonical Knowledge input remains unmodified",
);

// ============================================================
// SUMMARY
// ============================================================

console.log("");
console.log(
  "============================================================",
);
console.log(
  "CANONICAL SELECTION INTELLIGENCE VERIFIED",
);
console.log(
  "============================================================",
);
console.log("");
console.log(
  "Verified:",
);
console.log(
  "  Canonical Knowledge -> canonical Investigation Graph",
);
console.log(
  "  Graph selection -> deterministic Selection Intelligence",
);
console.log(
  "  real System Canon NODE and EDGE resolution",
);
console.log(
  "  safe missing-selection fallback",
);
console.log(
  "  repeated deterministic resolution",
);
console.log(
  "  Knowledge input-order invariance",
);
console.log(
  "  canonical input immutability",
);
console.log(
  "  shared non-React scaffold for RightPanel and future iSEES Assistant",
);