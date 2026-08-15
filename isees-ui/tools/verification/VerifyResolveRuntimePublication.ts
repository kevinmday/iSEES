// ============================================================
// tools/verification/VerifyResolveRuntimePublication.ts
//
// P56D-E
// RESOLVE RUNTIME PUBLICATION VERIFICATION
//
// Zero-dependency engineering verification harness.
//
// PURPOSE
//
// Proves that ResolveRuntime preserves the complete
// deterministic Resolve Engine product:
//
//                 U -> M -> C -> E
//
// while wrapping that product with runtime-owned lifecycle
// metadata.
//
// GOVERNING COMPUTATION
//
//                 M = g(L,T,S)
//
// Candidate derivation:
//
//                 C = h(M.similarityMatrix)
//
// Candidate evaluation:
//
//                 E = q(C)
//
// ARCHITECTURAL INVARIANT
//
// ResolveEngine owns computational truth.
//
// ResolveRuntime owns execution lifecycle.
//
// Therefore:
//
//   Engine(U).M == Runtime(U).M
//   Engine(U).C == Runtime(U).C
//   Engine(U).E == Runtime(U).E
//
// while runtime metadata such as:
//
//   • executionId
//   • startedAt
//   • completedAt
//   • runtime revision
//   • execution history
//
// may differ between executions.
//
// Runtime MUST NOT:
//
//   • recompute manifold state
//   • recompute similarity
//   • regenerate candidates
//   • regenerate evaluations
//   • filter candidates
//   • filter evaluations
//   • rank candidates
//   • rank evaluations
//   • assert relationships
//   • create topology edges
//   • create Research Vectors
//   • execute REX
//   • perform AI inference
//
// VERIFIED INVARIANTS
//
//   1. Runtime execution publishes a successful complete result.
//   2. Runtime preserves canonical manifold representation.
//   3. Runtime preserves canonical similarity candidates.
//   4. Runtime preserves canonical candidate evaluations.
//   5. Runtime preserves deterministic provenance.
//   6. currentExecution preserves the complete result.
//   7. history preserves the complete result.
//   8. repeated runtime executions preserve deterministic M+C+E.
//   9. runtime metadata may change without changing M+C+E.
//  10. runtime revision/publication does not contaminate
//      deterministic products.
//  11. runtime reaches COMPLETE and retains successful history.
//  12. equivalent reordered input preserves complete
//      deterministic runtime publication.
//
// This is NOT production runtime code.
//
// No React.
// No UI.
// No persistence.
// No networking.
// No AI.
// No random computational values.
//
// Runtime UUIDs and clocks are intentionally exercised because
// they belong outside the deterministic engine boundary.
//
// ============================================================

import type {
  Investigation,
} from "../../src/investigation/investigationTypes";

import type {
  Workspace,
} from "../../src/workspace/workspaceTypes";

import type {
  KnowledgeObject,
} from "../../src/knowledge/model/KnowledgeObject";

import {
  KnowledgeObjectStatus,
  KnowledgeObjectType,
} from "../../src/knowledge/model/KnowledgeObjectTypes";

import type {
  ResolveComputationInput,
  ResolveComputationResult,
} from "../../src/resolve/runtime/ResolveRuntimeTypes";

import {
  ResolveRuntimeStatus,
} from "../../src/resolve/runtime/ResolveRuntimeTypes";

import {
  ResolveRuntime,
} from "../../src/resolve/runtime/ResolveRuntime";

import {
  ResolveEngine,
} from "../../src/resolve/engine/ResolveEngine";

import {
  buildCanonicalComputationalUniverse,
} from "../../src/resolve/engine/CanonicalUniverse";

import {
  computeCanonicalSimilarityCandidateRepresentation,
  computeCanonicalCandidateEvaluationRepresentation,
} from "../../src/resolve/engine/ResolveReplay";

import {
  areResolveProvenanceEquivalent,
} from "../../src/resolve/engine/ResolveProvenance";

// ============================================================
// ASSERTION UTILITIES
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

function assertEqual(
  left: string,
  right: string,
  message: string,
): void {

  assert(
    left === right,
    message,
  );

}

// ============================================================
// WORKSPACE FIXTURE
// ============================================================

function createWorkspace(): Workspace {

  return {

    id:
      "workspace:resolve-runtime-publication",

    name:
      "Resolve Runtime Publication Verification",

    description:
      "P56D-E runtime publication verification workspace.",

    imported_events:
      [],

    focused_event_id:
      null,

    investigations:
      [],

    artifacts:
      [],

    active_layers:
      [],

    created_at:
      "2026-08-15T00:00:00.000Z",

  };

}

// ============================================================
// INVESTIGATION FIXTURE
// ============================================================

function createInvestigation(
  id = "investigation:resolve-runtime-publication",
): Investigation {

  return {

    id,

    name:
      "Resolve Runtime Publication Verification",

    description:
      "P56D-E complete deterministic product publication verification.",

    createdAt:
      "2026-08-15T00:00:00.000Z",

    updatedAt:
      "2026-08-15T00:00:00.000Z",

    createdBy:
      "P56D_E_VERIFY",

    status:
      "ACTIVE",

    workspace:
      createWorkspace(),

    revisions:
      [],

  };

}

// ============================================================
// KNOWLEDGE OBJECT FIXTURE
// ============================================================

function createKnowledgeObject(
  id: string,
): KnowledgeObject {

  return {

    identity: {

      id,

      createdAt:
        "2026-08-15T00:00:00.000Z",

    },

    metadata: {

      title:
        `Runtime Publication Object ${id}`,

      description:
        "P56D-E deterministic runtime publication fixture.",

      author:
        "P56D_E_VERIFY",

      version:
        "1.0.0",

    },

    lifecycle: {

      status:
        KnowledgeObjectStatus.KNOWLEDGE,

      revision:
        1,

    },

    type:
      KnowledgeObjectType.FACT,

    status:
      KnowledgeObjectStatus.KNOWLEDGE,

    confidence: {

      value:
        1,

      rationale:
        "Deterministic runtime publication fixture.",

    },

    provenance: {

      sourceId:
        `source:${id}`,

      sourceType:
        "VERIFICATION",

      sourceRevision:
        1,

      observedAt:
        "2026-08-15T00:00:00.000Z",

      createdAt:
        "2026-08-15T00:00:00.000Z",

      updatedAt:
        "2026-08-15T00:00:00.000Z",

    },

    revision: {

      revision:
        1,

      timestamp:
        "2026-08-15T00:00:00.000Z",

    },

    graph:
      [],

    relationships:
      [],

    tags:
      [],

    capabilities: {

      projectable:
        true,

      publishable:
        true,

      editable:
        false,

    },

    payload: {

      verificationId:
        id,

    },

  };

}

// ============================================================
// FIXTURES
// ============================================================

const knowledgeA =
  createKnowledgeObject(
    "knowledge:runtime:A",
  );

const knowledgeB =
  createKnowledgeObject(
    "knowledge:runtime:B",
  );

const knowledgeC =
  createKnowledgeObject(
    "knowledge:runtime:C",
  );

const investigation =
  createInvestigation();

const temporalContext = {

  start:
    "2004-11-14T00:00:00.000Z",

  end:
    "2004-11-14T23:59:59.999Z",

};

const investigativeScale = {

  level:
    "EVENT",

  depth:
    1,

};

// ============================================================
// INPUT A
// ============================================================

const inputA:
  ResolveComputationInput = {

    investigation,

    knowledgeObjects: [

      knowledgeA,
      knowledgeB,
      knowledgeC,

    ],

    activeLayers: [

      "GEO",
      "TEMPORAL",
      "SENSOR",

    ],

    temporalContext,

    investigativeScale,

  };

// ============================================================
// INPUT B
//
// Semantically equivalent to A.
//
// Deliberately:
//
//   • reorders Knowledge Objects
//   • reorders Active Layers
//   • duplicates Active Layers
//   • reorders object properties in opaque deterministic input
//
// Canonical deterministic output MUST remain equivalent.
//
// ============================================================

const inputB:
  ResolveComputationInput = {

    investigation,

    knowledgeObjects: [

      knowledgeC,
      knowledgeA,
      knowledgeB,

    ],

    activeLayers: [

      "TEMPORAL",
      "GEO",
      "SENSOR",
      "TEMPORAL",
      "GEO",

    ],

    temporalContext: {

      end:
        "2004-11-14T23:59:59.999Z",

      start:
        "2004-11-14T00:00:00.000Z",

    },

    investigativeScale: {

      depth:
        1,

      level:
        "EVENT",

    },

  };

// ============================================================
// ENGINE BASELINE
// ============================================================
//
// Compute the authoritative deterministic product directly
// through ResolveEngine.
//
// Runtime publication will be compared against this baseline.
//
// ============================================================

const canonicalUniverse =
  buildCanonicalComputationalUniverse(
    inputA,
  );

const engine =
  new ResolveEngine();

const engineOutput =
  engine.execute({

    universe:
      canonicalUniverse,

  });

const engineCandidateRepresentation =
  computeCanonicalSimilarityCandidateRepresentation(
    engineOutput.similarityCandidates,
  );

const engineEvaluationRepresentation =
  computeCanonicalCandidateEvaluationRepresentation(
    engineOutput.candidateEvaluations,
  );

// ============================================================
// RUNTIME
// ============================================================

const runtime =
  new ResolveRuntime();

runtime.initialize();

// ============================================================
// TEST 1
// RUNTIME EXECUTION PUBLISHES SUCCESSFUL COMPLETE RESULT
// ============================================================

const firstResult =
  runtime.execute(
    inputA,
  );

assert(

  firstResult.success === true,

  "ResolveRuntime execution must publish a successful result.",

);

assert(

  runtime.getState().status ===
    ResolveRuntimeStatus.COMPLETE,

  "ResolveRuntime must reach COMPLETE after successful execution.",

);

console.log(
  "PASS 1 — runtime execution publishes a successful complete result",
);

// ============================================================
// TEST 2
// RUNTIME PRESERVES CANONICAL MANIFOLD REPRESENTATION
// ============================================================

assertEqual(

  firstResult.canonicalRepresentation,

  engineOutput.canonicalRepresentation,

  "Runtime must preserve the engine canonical manifold representation exactly.",

);

assertEqual(

  JSON.stringify(
    firstResult.manifold,
  ),

  JSON.stringify(
    engineOutput.manifold,
  ),

  "Runtime must preserve the engine CanonicalManifold exactly.",

);

console.log(
  "PASS 2 — runtime preserves canonical manifold product",
);

// ============================================================
// TEST 3
// RUNTIME PRESERVES SIMILARITY CANDIDATES
// ============================================================

const firstCandidateRepresentation =
  computeCanonicalSimilarityCandidateRepresentation(
    firstResult.similarityCandidates,
  );

assertEqual(

  firstCandidateRepresentation,

  engineCandidateRepresentation,

  "Runtime must preserve the engine similarity candidate product exactly.",

);

console.log(
  "PASS 3 — runtime preserves canonical similarity candidate product",
);

// ============================================================
// TEST 4
// RUNTIME PRESERVES CANDIDATE EVALUATIONS
// ============================================================

const firstEvaluationRepresentation =
  computeCanonicalCandidateEvaluationRepresentation(
    firstResult.candidateEvaluations,
  );

assertEqual(

  firstEvaluationRepresentation,

  engineEvaluationRepresentation,

  "Runtime must preserve the engine candidate evaluation product exactly.",

);

console.log(
  "PASS 4 — runtime preserves canonical candidate evaluation product",
);

// ============================================================
// TEST 5
// RUNTIME PRESERVES DETERMINISTIC PROVENANCE
// ============================================================

assert(

  areResolveProvenanceEquivalent(
    firstResult.provenance,
    engineOutput.provenance,
  ),

  "Runtime must preserve deterministic engine provenance.",

);

console.log(
  "PASS 5 — runtime preserves deterministic computational provenance",
);

// ============================================================
// COMPLETE PRODUCT COMPARATOR
// ============================================================

function assertCompleteDeterministicProductEquivalent(
  left:
    ResolveComputationResult,
  right:
    ResolveComputationResult,
  context:
    string,
): void {

  assertEqual(

    left.canonicalRepresentation,

    right.canonicalRepresentation,

    `${context} — manifold canonical representation diverged.`,

  );

  assertEqual(

    computeCanonicalSimilarityCandidateRepresentation(
      left.similarityCandidates,
    ),

    computeCanonicalSimilarityCandidateRepresentation(
      right.similarityCandidates,
    ),

    `${context} — similarity candidate product diverged.`,

  );

  assertEqual(

    computeCanonicalCandidateEvaluationRepresentation(
      left.candidateEvaluations,
    ),

    computeCanonicalCandidateEvaluationRepresentation(
      right.candidateEvaluations,
    ),

    `${context} — candidate evaluation product diverged.`,

  );

  assert(

    areResolveProvenanceEquivalent(
      left.provenance,
      right.provenance,
    ),

    `${context} — deterministic provenance diverged.`,

  );

}

// ============================================================
// TEST 6
// CURRENT EXECUTION PRESERVES COMPLETE RESULT
// ============================================================

const firstState =
  runtime.getState();

const currentExecution =
  firstState.currentExecution;

assert(

  currentExecution !== undefined,

  "Runtime COMPLETE state must retain currentExecution.",

);

assert(

  currentExecution?.result !== undefined,

  "Completed currentExecution must retain ResolveComputationResult.",

);

if (
  currentExecution?.result === undefined
) {

  throw new Error(
    "VERIFY FAILED: currentExecution result unexpectedly unavailable.",
  );

}

assertCompleteDeterministicProductEquivalent(

  firstResult,

  currentExecution.result,

  "currentExecution preservation",

);

console.log(
  "PASS 6 — currentExecution preserves complete M+C+E result",
);

// ============================================================
// TEST 7
// HISTORY PRESERVES COMPLETE RESULT
// ============================================================

assert(

  firstState.history.length === 1,

  "First successful runtime execution must create exactly one history record.",

);

const firstHistoryResult =
  firstState.history[0]?.result;

assert(

  firstHistoryResult !== undefined,

  "Successful history record must retain ResolveComputationResult.",

);

if (
  firstHistoryResult === undefined
) {

  throw new Error(
    "VERIFY FAILED: first history result unexpectedly unavailable.",
  );

}

assertCompleteDeterministicProductEquivalent(

  firstResult,

  firstHistoryResult,

  "history preservation",

);

console.log(
  "PASS 7 — runtime history preserves complete M+C+E result",
);

// ============================================================
// TEST 8
// REPEATED RUNTIME EXECUTION PRESERVES DETERMINISTIC PRODUCT
// ============================================================

const secondResult =
  runtime.execute(
    inputA,
  );

assertCompleteDeterministicProductEquivalent(

  firstResult,

  secondResult,

  "repeated runtime execution",

);

console.log(
  "PASS 8 — repeated runtime executions preserve deterministic M+C+E",
);

// ============================================================
// TEST 9
// RUNTIME METADATA IS OUTSIDE DETERMINISTIC PRODUCT
// ============================================================
//
// executionId MUST be runtime-owned and therefore may differ.
//
// We assert UUID inequality because ResolveRuntime generates a
// fresh execution identity for every execution.
//
// Timestamps are deliberately NOT required to differ because
// two fast executions may legally occur within the same clock
// resolution.
//
// ============================================================

assert(

  firstResult.executionId !==
    secondResult.executionId,

  "Separate runtime executions must receive distinct execution identities.",

);

assertCompleteDeterministicProductEquivalent(

  firstResult,

  secondResult,

  "runtime metadata separation",

);

console.log(
  "PASS 9 — runtime execution identity changes without changing deterministic products",
);

// ============================================================
// TEST 10
// RUNTIME REVISION / PUBLICATION DOES NOT CONTAMINATE PRODUCT
// ============================================================

const stateAfterSecondExecution =
  runtime.getState();

assert(

  stateAfterSecondExecution.revision >
    firstState.revision,

  "Runtime revision must advance across runtime publication.",

);

assertCompleteDeterministicProductEquivalent(

  firstResult,

  secondResult,

  "runtime revision separation",

);

console.log(
  "PASS 10 — runtime revision advances without contaminating M+C+E",
);

// ============================================================
// TEST 11
// COMPLETE STATE AND SUCCESSFUL HISTORY RETENTION
// ============================================================

assert(

  stateAfterSecondExecution.status ===
    ResolveRuntimeStatus.COMPLETE,

  "Runtime must remain COMPLETE after successful execution.",

);

assert(

  stateAfterSecondExecution.history.length === 2,

  "Two successful executions must produce two successful history records.",

);

assert(

  stateAfterSecondExecution.currentExecution?.executionId ===
    secondResult.executionId,

  "currentExecution must reference the most recently completed execution.",

);

const secondHistoryResult =
  stateAfterSecondExecution.history[1]?.result;

assert(

  secondHistoryResult !== undefined,

  "Second successful history record must retain its result.",

);

if (
  secondHistoryResult === undefined
) {

  throw new Error(
    "VERIFY FAILED: second history result unexpectedly unavailable.",
  );

}

assertCompleteDeterministicProductEquivalent(

  secondResult,

  secondHistoryResult,

  "second history preservation",

);

console.log(
  "PASS 11 — runtime reaches COMPLETE and retains successful execution history",
);

// ============================================================
// TEST 12
// SEMANTICALLY EQUIVALENT REORDERED INPUT
// ============================================================
//
// This crosses BOTH boundaries:
//
//   Runtime canonicalization boundary
//             ↓
//   Engine deterministic boundary
//             ↓
//   Runtime publication boundary
//
// Equivalent input B must therefore publish the same complete
// deterministic product despite different collection order.
//
// ============================================================

const reorderedResult =
  runtime.execute(
    inputB,
  );

assertCompleteDeterministicProductEquivalent(

  firstResult,

  reorderedResult,

  "semantically equivalent reordered runtime input",

);

assert(

  reorderedResult.executionId !==
    firstResult.executionId,

  "Equivalent computation in a separate runtime execution must retain independent execution identity.",

);

const finalState =
  runtime.getState();

assert(

  finalState.status ===
    ResolveRuntimeStatus.COMPLETE,

  "Runtime must remain COMPLETE after reordered equivalent execution.",

);

assert(

  finalState.history.length === 3,

  "Three successful runtime executions must produce three history records.",

);

console.log(
  "PASS 12 — reordered equivalent input preserves complete deterministic runtime publication",
);

// ============================================================
// RESULT
// ============================================================

console.log("");
console.log(
  "============================================================",
);
console.log(
  " P56D-E RESOLVE RUNTIME PUBLICATION VERIFIED",
);
console.log(
  "============================================================",
);
console.log("");
console.log(
  "Verified:",
);
console.log(
  "  successful ResolveRuntime execution",
);
console.log(
  "  runtime COMPLETE lifecycle",
);
console.log(
  "  canonical manifold preservation",
);
console.log(
  "  canonical representation preservation",
);
console.log(
  "  similarity candidate preservation",
);
console.log(
  "  candidate evaluation preservation",
);
console.log(
  "  deterministic provenance preservation",
);
console.log(
  "  currentExecution complete-product preservation",
);
console.log(
  "  execution history complete-product preservation",
);
console.log(
  "  repeated runtime deterministic equivalence",
);
console.log(
  "  runtime execution identity separation",
);
console.log(
  "  runtime revision separation",
);
console.log(
  "  equivalent reordered-input publication",
);
console.log("");
console.log(
  "Governing computation:",
);
console.log(
  "  M = g(L,T,S)",
);
console.log("");
console.log(
  "Candidate derivation:",
);
console.log(
  "  C = h(M.similarityMatrix)",
);
console.log("");
console.log(
  "Candidate evaluation:",
);
console.log(
  "  E = q(C)",
);
console.log("");
console.log(
  "Deterministic engine path:",
);
console.log(
  "  U -> M -> C -> E",
);
console.log("");
console.log(
  "Runtime publication path:",
);
console.log(
  "  U -> M -> C -> E -> ResolveComputationResult -> currentExecution -> history",
);
console.log("");
console.log(
  "Runtime metadata remains outside deterministic computation.",
);
console.log("");
console.log(
  "All 12 runtime publication invariants passed.",
);

// ============================================================
// END
// ============================================================