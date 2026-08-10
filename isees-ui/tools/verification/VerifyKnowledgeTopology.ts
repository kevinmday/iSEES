// ============================================================
// tools/verification/VerifyKnowledgeTopology.ts
// P56A
// KNOWLEDGE TOPOLOGY DETERMINISM VERIFICATION
//
// Verifies deterministic construction of the base
// Investigation Topology:
//
//     K
//     ↓
//     B(K)
//     ↓
//     G₀
//
// Required invariants:
//
//   • identical K → identical G₀
//   • permutation(K) → identical G₀
//   • empty K → empty G₀
//   • single object → one node / zero edges
//   • explicit relationship → canonical edge
//   • duplicate object identity → deterministic dedupe
//   • duplicate relationship identity → deterministic dedupe
//   • dangling relationship → deterministic omission
//   • non-projectable object → deterministic omission
//   • canonical node ordering
//   • canonical edge ordering
//
// No React.
// No persistence.
// No networking.
// No AI.
//
// ============================================================

import type {
  KnowledgeObject,
} from "../../src/knowledge/model/KnowledgeObject";

import {
  KnowledgeObjectStatus,
  KnowledgeObjectType,
} from "../../src/knowledge/model/KnowledgeObjectTypes";

import {
  buildKnowledgeTopology,
} from "../../src/knowledge/topology/KnowledgeTopologyBuilder";

import {
  KnowledgeTopologyDiagnosticType,
} from "../../src/knowledge/topology/KnowledgeTopologyTypes";

// ============================================================
// ASSERTION
// ============================================================

function assert(
  condition: boolean,
  message: string,
): void {

  if (
    !condition
  ) {

    throw new Error(
      `VERIFY FAILED: ${message}`,
    );

  }

}

// ============================================================
// CANONICAL SERIALIZATION
// ============================================================
//
// JSON serialization is sufficient here because the topology
// builder guarantees canonical array ordering and creates
// object properties deterministically.
//
// ============================================================

function serialize(
  value: unknown,
): string {

  return JSON.stringify(
    value,
  );

}

// ============================================================
// TEST KNOWLEDGE OBJECT FACTORY
// ============================================================
//
// IMPORTANT:
//
// This verification factory deliberately does NOT use:
//
//   KnowledgeObjectFactory.create()
//
// because that production factory currently introduces:
//
//   • Date()
//   • crypto.randomUUID()
//
// Those runtime-owned values are valid outside deterministic
// topology construction, but would make this verification
// fixture itself nondeterministic.
//
// All fixture values below are therefore explicit.
//
// ============================================================

interface TestObjectOptions {

  id: string;

  title?: string;

  type?: KnowledgeObjectType;

  projectable?: boolean;

  confidence?: number;

  sourceType?: string;

  relationships?: Array<{

    id: string;

    type: string;

    targetId: string;

  }>;

}

function createTestObject(
  options: TestObjectOptions,
): KnowledgeObject {

  const timestamp =
    "2026-08-10T00:00:00.000Z";

  return {

    identity: {

      id:
        options.id,

      createdAt:
        timestamp,

    },

    metadata: {

      title:
        options.title ??
        options.id,

      version:
        "1.0.0",

    },

    lifecycle: {

      status:
        KnowledgeObjectStatus.OBSERVED,

      revision:
        1,

    },

    type:
      options.type ??
      KnowledgeObjectType.EVENT,

    status:
      KnowledgeObjectStatus.OBSERVED,

    confidence: {

      value:
        options.confidence ??
        1,

    },

    provenance: {

      sourceId:
        `source:${options.id}`,

      sourceType:
        options.sourceType ??
        "VERIFICATION",

      sourceRevision:
        1,

      observedAt:
        timestamp,

      createdAt:
        timestamp,

      updatedAt:
        timestamp,

    },

    revision: {

      revision:
        1,

      timestamp,

    },

    graph:
      [],

    relationships:
      options.relationships ??
      [],

    tags:
      [],

    capabilities: {

      projectable:
        options.projectable ??
        true,

      publishable:
        false,

      editable:
        true,

    },

    payload: {

      verification:
        true,

    },

  };

}

// ============================================================
// TEST 1
// EMPTY KNOWLEDGE POPULATION
// ============================================================

function verifyEmptyPopulation(): void {

  const topology =
    buildKnowledgeTopology(
      [],
    );

  assert(
    topology.nodes.length === 0,
    "Empty K must produce zero nodes.",
  );

  assert(
    topology.edges.length === 0,
    "Empty K must produce zero edges.",
  );

  assert(
    topology.diagnostics.length === 0,
    "Empty K must produce zero diagnostics.",
  );

  assert(
    topology.statistics.nodeCount === 0,
    "Empty topology nodeCount must be zero.",
  );

  assert(
    topology.statistics.edgeCount === 0,
    "Empty topology edgeCount must be zero.",
  );

}

// ============================================================
// TEST 2
// SINGLE KNOWLEDGE OBJECT
// ============================================================

function verifySingleObject(): void {

  const object =
    createTestObject({

      id:
        "knowledge:A",

      title:
        "Object A",

    });

  const topology =
    buildKnowledgeTopology(
      [
        object,
      ],
    );

  assert(
    topology.nodes.length === 1,
    "Single projectable object must produce one node.",
  );

  assert(
    topology.edges.length === 0,
    "Single object without relationships must produce zero edges.",
  );

  assert(
    topology.nodes[0]?.id ===
      "knowledge:A",
    "Topology node must preserve Knowledge Object identity.",
  );

  assert(
    topology.nodes[0]?.label ===
      "Object A",
    "Topology node must preserve Knowledge Object title.",
  );

}

// ============================================================
// TEST 3
// EXPLICIT RELATIONSHIP
// ============================================================

function verifyExplicitRelationship(): void {

  const objectA =
    createTestObject({

      id:
        "knowledge:A",

      relationships: [

        {

          id:
            "relationship:A:B",

          type:
            "ASSOCIATED_WITH",

          targetId:
            "knowledge:B",

        },

      ],

    });

  const objectB =
    createTestObject({

      id:
        "knowledge:B",

    });

  const topology =
    buildKnowledgeTopology(
      [
        objectA,
        objectB,
      ],
    );

  assert(
    topology.nodes.length === 2,
    "Explicit relationship test must produce two nodes.",
  );

  assert(
    topology.edges.length === 1,
    "Explicit relationship must produce one edge.",
  );

  const edge =
    topology.edges[0];

  assert(
    edge?.id ===
      "relationship:A:B",
    "Edge must preserve canonical relationship identity.",
  );

  assert(
    edge?.source ===
      "knowledge:A",
    "Edge source must be the owning Knowledge Object.",
  );

  assert(
    edge?.target ===
      "knowledge:B",
    "Edge target must preserve relationship targetId.",
  );

  assert(
    edge?.relationshipType ===
      "ASSOCIATED_WITH",
    "Edge must preserve canonical relationship type.",
  );

}

// ============================================================
// TEST 4
// REPEAT EXECUTION
// ============================================================

function verifyRepeatExecution(): void {

  const objectA =
    createTestObject({

      id:
        "knowledge:A",

      relationships: [

        {

          id:
            "relationship:A:B",

          type:
            "REFERENCES",

          targetId:
            "knowledge:B",

        },

      ],

    });

  const objectB =
    createTestObject({

      id:
        "knowledge:B",

    });

  const input = [
    objectA,
    objectB,
  ];

  const first =
    buildKnowledgeTopology(
      input,
    );

  const second =
    buildKnowledgeTopology(
      input,
    );

  assert(
    serialize(first) ===
      serialize(second),
    "Repeated execution over identical K must produce identical G₀.",
  );

}

// ============================================================
// TEST 5
// INPUT PERMUTATION
// ============================================================

function verifyInputPermutation(): void {

  const objectA =
    createTestObject({

      id:
        "knowledge:A",

      relationships: [

        {

          id:
            "relationship:A:C",

          type:
            "SUPPORTS",

          targetId:
            "knowledge:C",

        },

      ],

    });

  const objectB =
    createTestObject({

      id:
        "knowledge:B",

    });

  const objectC =
    createTestObject({

      id:
        "knowledge:C",

    });

  const first =
    buildKnowledgeTopology(
      [
        objectA,
        objectB,
        objectC,
      ],
    );

  const second =
    buildKnowledgeTopology(
      [
        objectC,
        objectA,
        objectB,
      ],
    );

  const third =
    buildKnowledgeTopology(
      [
        objectB,
        objectC,
        objectA,
      ],
    );

  assert(
    serialize(first) ===
      serialize(second),
    "Permutation of K must not change G₀.",
  );

  assert(
    serialize(first) ===
      serialize(third),
    "All tested permutations of K must produce identical G₀.",
  );

}

// ============================================================
// TEST 6
// CANONICAL NODE ORDER
// ============================================================

function verifyCanonicalNodeOrder(): void {

  const topology =
    buildKnowledgeTopology(
      [

        createTestObject({
          id:
            "knowledge:Z",
        }),

        createTestObject({
          id:
            "knowledge:A",
        }),

        createTestObject({
          id:
            "knowledge:M",
        }),

      ],
    );

  const ids =
    topology.nodes.map(
      node =>
        node.id,
    );

  assert(
    serialize(ids) ===
      serialize([
        "knowledge:A",
        "knowledge:M",
        "knowledge:Z",
      ]),
    "Topology nodes must use canonical identity ordering.",
  );

}

// ============================================================
// TEST 7
// CANONICAL EDGE ORDER
// ============================================================

function verifyCanonicalEdgeOrder(): void {

  const source =
    createTestObject({

      id:
        "knowledge:A",

      relationships: [

        {

          id:
            "relationship:Z",

          type:
            "REFERENCES",

          targetId:
            "knowledge:C",

        },

        {

          id:
            "relationship:A",

          type:
            "REFERENCES",

          targetId:
            "knowledge:B",

        },

      ],

    });

  const topology =
    buildKnowledgeTopology(
      [

        createTestObject({
          id:
            "knowledge:C",
        }),

        source,

        createTestObject({
          id:
            "knowledge:B",
        }),

      ],
    );

  const ids =
    topology.edges.map(
      edge =>
        edge.id,
    );

  assert(
    serialize(ids) ===
      serialize([
        "relationship:A",
        "relationship:Z",
      ]),
    "Topology edges must use canonical relationship ordering.",
  );

}

// ============================================================
// TEST 8
// DUPLICATE OBJECT IDENTITY
// ============================================================

function verifyDuplicateObject(): void {

  const first =
    createTestObject({

      id:
        "knowledge:A",

      title:
        "First A",

    });

  const duplicate =
    createTestObject({

      id:
        "knowledge:A",

      title:
        "Duplicate A",

    });

  const topology =
    buildKnowledgeTopology(
      [
        first,
        duplicate,
      ],
    );

  assert(
    topology.nodes.length === 1,
    "Duplicate Knowledge Object identity must produce one topology node.",
  );

  const diagnostic =
    topology.diagnostics.find(
      item =>
        item.type ===
        KnowledgeTopologyDiagnosticType
          .DUPLICATE_NODE,
    );

  assert(
    diagnostic !== undefined,
    "Duplicate Knowledge Object identity must produce a diagnostic.",
  );

}

// ============================================================
// TEST 9
// DUPLICATE RELATIONSHIP IDENTITY
// ============================================================

function verifyDuplicateRelationship(): void {

  const objectA =
    createTestObject({

      id:
        "knowledge:A",

      relationships: [

        {

          id:
            "relationship:duplicate",

          type:
            "REFERENCES",

          targetId:
            "knowledge:B",

        },

        {

          id:
            "relationship:duplicate",

          type:
            "SUPPORTS",

          targetId:
            "knowledge:B",

        },

      ],

    });

  const objectB =
    createTestObject({

      id:
        "knowledge:B",

    });

  const topology =
    buildKnowledgeTopology(
      [
        objectA,
        objectB,
      ],
    );

  assert(
    topology.edges.length === 1,
    "Duplicate relationship identity must produce one topology edge.",
  );

  const diagnostic =
    topology.diagnostics.find(
      item =>
        item.type ===
        KnowledgeTopologyDiagnosticType
          .DUPLICATE_EDGE,
    );

  assert(
    diagnostic !== undefined,
    "Duplicate relationship identity must produce a diagnostic.",
  );

}

// ============================================================
// TEST 10
// DANGLING RELATIONSHIP
// ============================================================

function verifyDanglingRelationship(): void {

  const objectA =
    createTestObject({

      id:
        "knowledge:A",

      relationships: [

        {

          id:
            "relationship:A:MISSING",

          type:
            "REFERENCES",

          targetId:
            "knowledge:MISSING",

        },

      ],

    });

  const topology =
    buildKnowledgeTopology(
      [
        objectA,
      ],
    );

  assert(
    topology.nodes.length === 1,
    "Dangling relationship must not remove its valid source node.",
  );

  assert(
    topology.edges.length === 0,
    "Dangling relationship must not manufacture an edge.",
  );

  const diagnostic =
    topology.diagnostics.find(
      item =>
        item.type ===
        KnowledgeTopologyDiagnosticType
          .DANGLING_RELATIONSHIP,
    );

  assert(
    diagnostic !== undefined,
    "Dangling relationship must produce a diagnostic.",
  );

  assert(
    diagnostic?.targetId ===
      "knowledge:MISSING",
    "Dangling diagnostic must preserve unresolved target identity.",
  );

}

// ============================================================
// TEST 11
// NON-PROJECTABLE OBJECT
// ============================================================

function verifyNonProjectableObject(): void {

  const hidden =
    createTestObject({

      id:
        "knowledge:HIDDEN",

      projectable:
        false,

    });

  const topology =
    buildKnowledgeTopology(
      [
        hidden,
      ],
    );

  assert(
    topology.nodes.length === 0,
    "Non-projectable Knowledge Object must be omitted by default.",
  );

  assert(
    topology.edges.length === 0,
    "Non-projectable Knowledge Object must emit no topology edges.",
  );

  const diagnostic =
    topology.diagnostics.find(
      item =>
        item.type ===
        KnowledgeTopologyDiagnosticType
          .NON_PROJECTABLE_OBJECT,
    );

  assert(
    diagnostic !== undefined,
    "Non-projectable Knowledge Object must produce a diagnostic.",
  );

}

// ============================================================
// TEST 12
// EXPLICIT INCLUDE NON-PROJECTABLE
// ============================================================

function verifyIncludeNonProjectable(): void {

  const hidden =
    createTestObject({

      id:
        "knowledge:HIDDEN",

      projectable:
        false,

    });

  const topology =
    buildKnowledgeTopology(
      [
        hidden,
      ],
      {
        includeNonProjectable:
          true,
      },
    );

  assert(
    topology.nodes.length === 1,
    "includeNonProjectable must allow explicit topology projection.",
  );

  assert(
    topology.nodes[0]?.id ===
      "knowledge:HIDDEN",
    "Explicit non-projectable inclusion must preserve identity.",
  );

}

// ============================================================
// TEST 13
// SOURCE ARRAY IMMUTABILITY
// ============================================================

function verifyInputArrayNotMutated(): void {

  const objectZ =
    createTestObject({
      id:
        "knowledge:Z",
    });

  const objectA =
    createTestObject({
      id:
        "knowledge:A",
    });

  const input = [
    objectZ,
    objectA,
  ];

  const before =
    input.map(
      object =>
        object.identity.id,
    );

  buildKnowledgeTopology(
    input,
  );

  const after =
    input.map(
      object =>
        object.identity.id,
    );

  assert(
    serialize(before) ===
      serialize(after),
    "Topology construction must not reorder caller-owned K.",
  );

}

// ============================================================
// RUN
// ============================================================

function run(): void {

  console.log(
    "",
  );

  console.log(
    "==============================================",
  );

  console.log(
    "P56A KNOWLEDGE TOPOLOGY VERIFICATION",
  );

  console.log(
    "==============================================",
  );

  console.log(
    "",
  );

  verifyEmptyPopulation();

  console.log(
    "PASS  empty population",
  );

  verifySingleObject();

  console.log(
    "PASS  single object",
  );

  verifyExplicitRelationship();

  console.log(
    "PASS  explicit relationship",
  );

  verifyRepeatExecution();

  console.log(
    "PASS  repeat execution",
  );

  verifyInputPermutation();

  console.log(
    "PASS  input permutation",
  );

  verifyCanonicalNodeOrder();

  console.log(
    "PASS  canonical node order",
  );

  verifyCanonicalEdgeOrder();

  console.log(
    "PASS  canonical edge order",
  );

  verifyDuplicateObject();

  console.log(
    "PASS  duplicate object identity",
  );

  verifyDuplicateRelationship();

  console.log(
    "PASS  duplicate relationship identity",
  );

  verifyDanglingRelationship();

  console.log(
    "PASS  dangling relationship",
  );

  verifyNonProjectableObject();

  console.log(
    "PASS  non-projectable object",
  );

  verifyIncludeNonProjectable();

  console.log(
    "PASS  explicit non-projectable inclusion",
  );

  verifyInputArrayNotMutated();

  console.log(
    "PASS  input array immutability",
  );

  console.log(
    "",
  );

  console.log(
    "All Knowledge Topology deterministic invariants passed.",
  );

  console.log(
    "",
  );

  console.log(
    "Canonical invariant:",
  );

  console.log(
    "same K -> same G0",
  );

  console.log(
    "",
  );

}

// ============================================================
// EXECUTE
// ============================================================

run();

// ============================================================
// END
// ============================================================