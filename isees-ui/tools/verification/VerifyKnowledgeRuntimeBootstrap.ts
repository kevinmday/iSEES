// ============================================================
// tools/verification/VerifyKnowledgeRuntimeBootstrap.ts
// P56A
// KNOWLEDGE RUNTIME BOOTSTRAP VERIFICATION
//
// Verifies the runtime-owned chain:
//
//     SYSTEM CANON
//          ↓
//     Knowledge Ingress
//          ↓
//          K
//          ↓
//     KnowledgeObjectRuntime
//          ↓
//          Kᵣ
//          ↓
//     KnowledgeTopologyBuilder
//          ↓
//          G₀
//
// Required invariants:
//
// • bootstrap population is non-empty
// • runtime receives complete population
// • runtime identities equal bootstrap identities
// • bootstrap status can be verified
// • runtime-owned K produces topology
// • runtime topology contains no dangling relationships
// • repeated bootstrap preserves population identity
// • repeated bootstrap preserves resulting topology
//
// No React.
// No UI.
// No manifold mutation.
// No persistence.
// No networking.
// No AI.
//
// ============================================================

import {
  bootstrapKnowledgeRuntime,
  buildKnowledgeBootstrapPopulation,
  isKnowledgeRuntimeBootstrapped,
} from "../../src/knowledge/ingestion/KnowledgeRuntimeBootstrap";

import {
  knowledgeObjectRuntime,
} from "../../src/knowledge/runtime/KnowledgeObjectRuntime";

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
// CANONICAL IDENTITIES
// ============================================================

function getIds(
  objects: ReturnType<
    typeof buildKnowledgeBootstrapPopulation
  >,
): string[] {

  return objects
    .map(
      object =>
        object.identity.id,
    )
    .sort();

}

// ============================================================
// TEST 1
// BOOTSTRAP POPULATION
// ============================================================

function verifyBootstrapPopulation(): void {

  const population =
    buildKnowledgeBootstrapPopulation();

  assert(
    population.length > 0,
    "Bootstrap population must not be empty.",
  );

  assert(
    population.length === 16,
    "Current System Canon bootstrap must produce 16 Knowledge Objects.",
  );

}

// ============================================================
// TEST 2
// RUNTIME BOOTSTRAP
// ============================================================

function verifyRuntimeBootstrap(): void {

  knowledgeObjectRuntime.clear();

  const result =
    bootstrapKnowledgeRuntime();

  assert(
    result.sourceEventCount === 3,
    "Runtime bootstrap must ingest three System Canon events.",
  );

  assert(
    result.knowledgeObjectCount === 16,
    "Bootstrap must construct 16 Knowledge Objects.",
  );

  assert(
    result.runtimeObjectCount === 16,
    "Knowledge Runtime must own 16 Knowledge Objects after bootstrap.",
  );

  assert(
    knowledgeObjectRuntime
      .getObjects()
      .length === 16,
    "Runtime getObjects() must expose the complete bootstrap population.",
  );

}

// ============================================================
// TEST 3
// RUNTIME IDENTITY EQUALITY
// ============================================================

function verifyRuntimeIdentityEquality(): void {

  const expected =
    buildKnowledgeBootstrapPopulation();

  bootstrapKnowledgeRuntime();

  const actual =
    [
      ...knowledgeObjectRuntime
        .getObjects(),
    ];

  const expectedIds =
    getIds(
      expected,
    );

  const actualIds =
    actual
      .map(
        object =>
          object.identity.id,
      )
      .sort();

  assert(
    serialize(expectedIds) ===
      serialize(actualIds),
    "Runtime Knowledge identities must equal bootstrap identities.",
  );

}

// ============================================================
// TEST 4
// BOOTSTRAP DETECTION
// ============================================================

function verifyBootstrapDetection(): void {

  bootstrapKnowledgeRuntime();

  assert(
    isKnowledgeRuntimeBootstrapped(),
    "Runtime must report itself as bootstrapped after canonical installation.",
  );

}

// ============================================================
// TEST 5
// RUNTIME-OWNED TOPOLOGY
// ============================================================

function verifyRuntimeTopology(): void {

  bootstrapKnowledgeRuntime();

  const runtimeKnowledge =
    [
      ...knowledgeObjectRuntime
        .getObjects(),
    ];

  const topology =
    buildKnowledgeTopology(
      runtimeKnowledge,
    );

  assert(
    topology.nodes.length === 16,
    "Runtime-owned K must produce 16 topology nodes.",
  );

  assert(
    topology.edges.length === 13,
    "Runtime-owned K must produce 13 topology edges.",
  );

}

// ============================================================
// TEST 6
// ZERO DANGLING RELATIONSHIPS
// ============================================================

function verifyRuntimeTopologyIntegrity(): void {

  bootstrapKnowledgeRuntime();

  const topology =
    buildKnowledgeTopology(
      [
        ...knowledgeObjectRuntime
          .getObjects(),
      ],
    );

  const dangling =
    topology.diagnostics.filter(
      diagnostic =>
        diagnostic.type ===
        KnowledgeTopologyDiagnosticType
          .DANGLING_RELATIONSHIP,
    );

  assert(
    dangling.length === 0,
    "Runtime-owned topology must contain zero dangling relationships.",
  );

}

// ============================================================
// TEST 7
// REPEATED BOOTSTRAP POPULATION
// ============================================================

function verifyRepeatedBootstrapPopulation(): void {

  bootstrapKnowledgeRuntime();

  const first =
    [
      ...knowledgeObjectRuntime
        .getObjects(),
    ];

  bootstrapKnowledgeRuntime();

  const second =
    [
      ...knowledgeObjectRuntime
        .getObjects(),
    ];

  assert(
    serialize(first) ===
      serialize(second),
    "Repeated bootstrap must preserve identical runtime K.",
  );

}

// ============================================================
// TEST 8
// REPEATED BOOTSTRAP TOPOLOGY
// ============================================================

function verifyRepeatedBootstrapTopology(): void {

  bootstrapKnowledgeRuntime();

  const firstTopology =
    buildKnowledgeTopology(
      [
        ...knowledgeObjectRuntime
          .getObjects(),
      ],
    );

  bootstrapKnowledgeRuntime();

  const secondTopology =
    buildKnowledgeTopology(
      [
        ...knowledgeObjectRuntime
          .getObjects(),
      ],
    );

  assert(
    serialize(firstTopology) ===
      serialize(secondTopology),
    "Repeated runtime bootstrap must produce identical G0.",
  );

}

// ============================================================
// TEST 9
// RUNTIME POPULATION MATCHES PURE POPULATION
// ============================================================

function verifyPureVsRuntimeTopology(): void {

  const pureKnowledge =
    buildKnowledgeBootstrapPopulation();

  const pureTopology =
    buildKnowledgeTopology(
      pureKnowledge,
    );

  bootstrapKnowledgeRuntime();

  const runtimeTopology =
    buildKnowledgeTopology(
      [
        ...knowledgeObjectRuntime
          .getObjects(),
      ],
    );

  assert(
    serialize(pureTopology) ===
      serialize(runtimeTopology),
    "Pure bootstrap K and runtime-owned K must produce identical G0.",
  );

}

// ============================================================
// SUMMARY
// ============================================================

function printSummary(): void {

  const state =
    knowledgeObjectRuntime.getState();

  const topology =
    buildKnowledgeTopology(
      [
        ...knowledgeObjectRuntime
          .getObjects(),
      ],
    );

  console.log("");
  console.log(
    "Runtime status:",
    state.status,
  );

  console.log(
    "Runtime revision:",
    state.revision,
  );

  console.log(
    "Runtime Knowledge Objects:",
    state.objects.length,
  );

  console.log(
    "Runtime topology nodes:",
    topology.nodes.length,
  );

  console.log(
    "Runtime topology edges:",
    topology.edges.length,
  );

  console.log(
    "Runtime topology diagnostics:",
    topology.diagnostics.length,
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
    "P56A KNOWLEDGE RUNTIME BOOTSTRAP VERIFICATION",
  );

  console.log(
    "==============================================",
  );

  console.log("");

  verifyBootstrapPopulation();

  console.log(
    "PASS  bootstrap population",
  );

  verifyRuntimeBootstrap();

  console.log(
    "PASS  runtime bootstrap",
  );

  verifyRuntimeIdentityEquality();

  console.log(
    "PASS  runtime identity equality",
  );

  verifyBootstrapDetection();

  console.log(
    "PASS  bootstrap detection",
  );

  verifyRuntimeTopology();

  console.log(
    "PASS  runtime-owned topology",
  );

  verifyRuntimeTopologyIntegrity();

  console.log(
    "PASS  runtime topology integrity",
  );

  verifyRepeatedBootstrapPopulation();

  console.log(
    "PASS  repeated bootstrap population",
  );

  verifyRepeatedBootstrapTopology();

  console.log(
    "PASS  repeated bootstrap topology",
  );

  verifyPureVsRuntimeTopology();

  console.log(
    "PASS  pure K equals runtime-owned K topology",
  );

  printSummary();

  console.log("");

  console.log(
    "All Knowledge Runtime bootstrap invariants passed.",
  );

  console.log("");

  console.log(
    "Runtime-owned canonical chain:",
  );

  console.log(
    "SYSTEM CANON -> K -> KnowledgeObjectRuntime -> G0",
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