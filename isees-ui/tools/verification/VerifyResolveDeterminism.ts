// ============================================================
// tools/verification/VerifyResolveDeterminism.ts
//
// P56D-C
// RESOLVE DETERMINISM VERIFICATION
//
// Zero-dependency engineering verification harness.
//
// PURPOSE
//
// Proves foundational deterministic invariants of the
// Resolve Engine:
//
//   1. Knowledge Object insertion order does not affect output.
//   2. Active Layer insertion order does not affect output.
//   3. Duplicate Active Layers do not affect output.
//   4. Duplicate Knowledge Object identities are rejected.
//   5. Empty Investigation identities are rejected.
//   6. Repeated equivalent computation produces a byte-identical
//      canonical representation.
//   7. Semantically equivalent computation replay verifies.
//   8. Meaningful computational divergence is detected.
//   9. Equivalent computation produces equivalent provenance.
//  10. Forged investigation lineage is rejected.
//  11. Forged Knowledge population is rejected.
//  12. Equivalent computation produces identical canonical
//      similarity candidates.
//  13. Replay baseline captures the candidate product.
//  14. Complete replay verifies both manifold and candidate
//      products.
//  15. Candidate-only divergence is independently detected.
//  16. Manifold-only divergence is independently detected.
//  17. Direct complete-product comparison verifies equivalent
//      Resolve outputs.
//  18. Legacy manifold-only comparison remains explicitly
//      manifold-scoped.
//
// P56D-C COMPLETE RESOLVE PRODUCT
//
// Resolve now produces two distinct deterministic layers:
//
//                 U
//                 ↓
//             M = g(L,T,S)
//                 ↓
//        Canonical Manifold
//          ↙           ↘
//         ↓             ↓
// Canonical          Similarity
// Representation      Matrix
//                       ↓
//                 C = h(M.similarityMatrix)
//                       ↓
//              Similarity Candidates
//
// Therefore:
//
//   equivalent canonical input
//            ↓
//   equivalent manifold
//            AND
//   equivalent candidate product
//
// Candidate generation does NOT alter the governing manifold
// equation:
//
//                 M = g(L,T,S)
//
// Candidates are a sibling deterministic product downstream of
// measured manifold similarity state.
//
// This is NOT production runtime code.
//
// No React.
// No UI.
// No persistence.
// No networking.
// No AI.
// No clocks.
// No random values.
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
} from "../../src/resolve/runtime/ResolveRuntimeTypes";

import {
  buildCanonicalComputationalUniverse,
} from "../../src/resolve/engine/CanonicalUniverse";

import {
  ResolveEngine,
} from "../../src/resolve/engine/ResolveEngine";

import {
  computeCanonicalSimilarityCandidateRepresentation,
  createResolveReplayBaseline,
  verifyCanonicalRepresentations,
  verifyResolveReplay,
  verifyResolveRepresentations,
  ResolveReplayStatus,
} from "../../src/resolve/engine/ResolveReplay";

import {
  createResolveProvenance,
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

function assertThrows(
  operation: () => void,
  expectedMessageFragment: string,
  message: string,
): void {

  let thrown: unknown;

  try {

    operation();

  } catch (error) {

    thrown = error;

  }

  assert(
    thrown instanceof Error,
    `${message} — expected an Error to be thrown.`,
  );

  if (
    thrown instanceof Error
  ) {

    assert(
      thrown.message.includes(
        expectedMessageFragment,
      ),
      `${message} — unexpected error message: ${thrown.message}`,
    );

  }

}

// ============================================================
// WORKSPACE FIXTURE
// ============================================================

function createWorkspace(): Workspace {

  return {

    id:
      "workspace:verification",

    name:
      "Resolve Determinism Verification",

    description:
      "P56D-C deterministic computation verification workspace.",

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
      "2026-08-08T00:00:00.000Z",

  };

}

// ============================================================
// INVESTIGATION FIXTURE
// ============================================================

function createInvestigation(
  id = "investigation:verification",
): Investigation {

  return {

    id,

    name:
      "Resolve Determinism Verification",

    description:
      "P56D-C canonical computation verification investigation.",

    createdAt:
      "2026-08-08T00:00:00.000Z",

    updatedAt:
      "2026-08-08T00:00:00.000Z",

    createdBy:
      "P56D_C_VERIFY",

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
        "2026-08-08T00:00:00.000Z",

    },

    metadata: {

      title:
        `Verification Object ${id}`,

      description:
        "Deterministic verification fixture.",

      author:
        "P56D_C_VERIFY",

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
        "Deterministic verification fixture.",

    },

    provenance: {

      sourceId:
        `source:${id}`,

      sourceType:
        "VERIFICATION",

      sourceRevision:
        1,

      observedAt:
        "2026-08-08T00:00:00.000Z",

      createdAt:
        "2026-08-08T00:00:00.000Z",

      updatedAt:
        "2026-08-08T00:00:00.000Z",

    },

    revision: {

      revision:
        1,

      timestamp:
        "2026-08-08T00:00:00.000Z",

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
// COMPUTATION
// ============================================================

function compute(
  input: ResolveComputationInput,
): string {

  const universe =
    buildCanonicalComputationalUniverse(
      input,
    );

  const engine =
    new ResolveEngine();

  const output =
    engine.execute({

      universe,

    });

  return output.canonicalRepresentation;

}

// ============================================================
// FIXTURES
// ============================================================

const knowledgeA =
  createKnowledgeObject(
    "knowledge:A",
  );

const knowledgeB =
  createKnowledgeObject(
    "knowledge:B",
  );

const knowledgeC =
  createKnowledgeObject(
    "knowledge:C",
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
// UNIVERSE A
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
// UNIVERSE B
//
// Semantically equivalent to A.
//
// Deliberately:
//
//   • reorders Knowledge Objects
//   • reorders layers
//   • duplicates active layers
//
// Canonical output MUST remain identical.
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
      "SENSOR",
      "GEO",
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
// TEST 1
// KNOWLEDGE OBJECT ORDER INVARIANCE
// ============================================================

const representationA =
  compute(
    inputA,
  );

const representationB =
  compute(
    inputB,
  );

assertEqual(

  representationA,

  representationB,

  "Equivalent universes must produce byte-identical canonical representations.",

);

console.log(
  "PASS 1 — equivalent reordered universes produce identical canonical output",
);

// ============================================================
// TEST 2
// REPLAY INVARIANCE
// ============================================================

const replayA =
  compute(
    inputA,
  );

assertEqual(

  representationA,

  replayA,

  "Replaying identical canonical input must produce identical output.",

);

console.log(
  "PASS 2 — replay produces byte-identical canonical output",
);

// ============================================================
// TEST 3
// CANONICAL KNOWLEDGE ORDER
// ============================================================

const canonicalUniverse =
  buildCanonicalComputationalUniverse(
    inputB,
  );

const canonicalIds =
  canonicalUniverse.knowledgeObjects.map(
    (knowledgeObject) =>
      knowledgeObject.identity.id,
  );

assert(

  canonicalIds.join("|") ===
    "knowledge:A|knowledge:B|knowledge:C",

  "Knowledge Objects must be canonically ordered by identity.id.",

);

console.log(
  "PASS 3 — Knowledge Objects are canonically ordered",
);

// ============================================================
// TEST 4
// CANONICAL LAYER SET
// ============================================================

assert(

  canonicalUniverse.activeLayers.join("|") ===
    "GEO|SENSOR|TEMPORAL",

  "Active Layers must be unique and canonically ordered.",

);

console.log(
  "PASS 4 — Active Layers are deduplicated and canonically ordered",
);

// ============================================================
// TEST 5
// DUPLICATE KNOWLEDGE ID REJECTION
// ============================================================

const duplicateKnowledgeObject =
  createKnowledgeObject(
    "knowledge:A",
  );

assertThrows(

  () => {

    buildCanonicalComputationalUniverse({

      ...inputA,

      knowledgeObjects: [

        knowledgeA,
        duplicateKnowledgeObject,

      ],

    });

  },

  "duplicate Knowledge Object identity",

  "Duplicate Knowledge Object identities must be rejected.",

);

console.log(
  "PASS 5 — duplicate Knowledge Object identities are rejected",
);

// ============================================================
// TEST 6
// EMPTY INVESTIGATION ID REJECTION
// ============================================================

assertThrows(

  () => {

    buildCanonicalComputationalUniverse({

      ...inputA,

      investigation:
        createInvestigation(
          "   ",
        ),

    });

  },

  "non-empty investigation ID",

  "Empty Investigation identities must be rejected.",

);

console.log(
  "PASS 6 — empty Investigation identities are rejected",
);

// ============================================================
// TEST 7
// SEMANTICALLY EQUIVALENT REPLAY
// ============================================================
//
// inputA and inputB differ in:
//
//   • Knowledge Object insertion order
//   • Active Layer insertion order
//   • duplicate Active Layers
//   • property insertion order within T
//   • property insertion order within S
//
// They represent the same computational universe.
//
// Replay MUST verify.
//
// ============================================================

const replayBaseline =
  createResolveReplayBaseline(
    inputA,
  );

const equivalentReplay =
  verifyResolveReplay(
    replayBaseline,
    inputB,
  );

assert(

  equivalentReplay.verified === true,

  "Semantically equivalent Resolve input must verify against the replay baseline.",

);

assert(

  equivalentReplay.status ===
    ResolveReplayStatus.VERIFIED,

  "Equivalent Resolve replay must report VERIFIED.",

);

console.log(
  "PASS 7 — semantically equivalent computation replay is VERIFIED",
);

// ============================================================
// TEST 8
// COMPUTATIONAL DIVERGENCE DETECTION
// ============================================================
//
// Change an actual computational dimension.
//
// Here L changes by activating ONTOLOGICAL.
//
// This is no longer equivalent to the baseline universe.
//
// Replay MUST detect divergence.
//
// ============================================================

const divergentInput:
  ResolveComputationInput = {

    ...inputA,

    activeLayers: [

      ...inputA.activeLayers,

      "ONTOLOGICAL",

    ],

  };

const divergentReplay =
  verifyResolveReplay(
    replayBaseline,
    divergentInput,
  );

assert(

  divergentReplay.verified === false,

  "Changed computational state must not verify against the original replay baseline.",

);

assert(

  divergentReplay.status ===
    ResolveReplayStatus.DIVERGED,

  "Changed computational state must report DIVERGED.",

);

assert(

  divergentReplay.actualCanonicalRepresentation !==
    divergentReplay.expectedCanonicalRepresentation,

  "Divergent computation must produce a different canonical representation.",

);

console.log(
  "PASS 8 — meaningful computational change is detected as DIVERGED",
);

// ============================================================
// TEST 9
// EQUIVALENT COMPUTATION PRODUCES EQUIVALENT PROVENANCE
// ============================================================

const provenanceUniverseA =
  buildCanonicalComputationalUniverse(
    inputA,
  );

const provenanceUniverseB =
  buildCanonicalComputationalUniverse(
    inputB,
  );

const provenanceEngine =
  new ResolveEngine();

const provenanceOutputA =
  provenanceEngine.execute({

    universe:
      provenanceUniverseA,

  });

const provenanceOutputB =
  provenanceEngine.execute({

    universe:
      provenanceUniverseB,

  });

const provenanceA =
  createResolveProvenance({

    universe:
      provenanceUniverseA,

    manifold:
      provenanceOutputA.manifold,

    canonicalRepresentation:
      provenanceOutputA.canonicalRepresentation,

  });

const provenanceB =
  createResolveProvenance({

    universe:
      provenanceUniverseB,

    manifold:
      provenanceOutputB.manifold,

    canonicalRepresentation:
      provenanceOutputB.canonicalRepresentation,

  });

assert(

  areResolveProvenanceEquivalent(
    provenanceA,
    provenanceB,
  ),

  "Semantically equivalent computation must produce equivalent deterministic provenance.",

);

console.log(
  "PASS 9 — equivalent computation produces equivalent deterministic provenance",
);

// ============================================================
// TEST 10
// PROVENANCE REJECTS MISMATCHED COMPUTATIONAL LINEAGE
// ============================================================
//
// Forge a manifold claiming to belong to another investigation.
//
// Provenance construction MUST reject the mismatch rather than
// record false computational lineage.
//
// ============================================================

assertThrows(

  () => {

    createResolveProvenance({

      universe:
        provenanceUniverseA,

      manifold: {

        ...provenanceOutputA.manifold,

        investigationId:
          "investigation:forged",

      },

      canonicalRepresentation:
        provenanceOutputA.canonicalRepresentation,

    });

  },

  "mismatched universe and manifold investigation identities",

  "Resolve provenance must reject mismatched computational lineage.",

);

console.log(
  "PASS 10 — forged investigation lineage is rejected by provenance validation",
);

// ============================================================
// TEST 11
// PROVENANCE REJECTS MISMATCHED KNOWLEDGE POPULATION
// ============================================================
//
// Forge the manifold population while retaining the original
// investigation identity.
//
// Provenance MUST reject it.
//
// ============================================================

assertThrows(

  () => {

    createResolveProvenance({

      universe:
        provenanceUniverseA,

      manifold: {

        ...provenanceOutputA.manifold,

        knowledgeObjectIds: [

          ...provenanceOutputA.manifold
            .knowledgeObjectIds,

          "knowledge:forged",

        ],

      },

      canonicalRepresentation:
        provenanceOutputA.canonicalRepresentation,

    });

  },

  "mismatched Knowledge Object populations",

  "Resolve provenance must reject mismatched Knowledge Object populations.",

);

console.log(
  "PASS 11 — forged Knowledge Object population is rejected by provenance validation",
);

// ============================================================
// TEST 12
// EQUIVALENT COMPUTATION PRODUCES EQUIVALENT CANDIDATES
// ============================================================
//
// similarityCandidates are a sibling deterministic Resolve
// product.
//
// Equivalent canonical universes must therefore produce
// byte-identical candidate representations.
//
// ============================================================

const candidateRepresentationA =
  computeCanonicalSimilarityCandidateRepresentation(
    provenanceOutputA.similarityCandidates,
  );

const candidateRepresentationB =
  computeCanonicalSimilarityCandidateRepresentation(
    provenanceOutputB.similarityCandidates,
  );

assertEqual(

  candidateRepresentationA,

  candidateRepresentationB,

  "Equivalent computation must produce byte-identical canonical similarity candidate representations.",

);

console.log(
  "PASS 12 — equivalent computation produces identical canonical similarity candidates",
);

// ============================================================
// TEST 13
// REPLAY BASELINE CAPTURES CANDIDATE PRODUCT
// ============================================================

assertEqual(

  replayBaseline.similarityCandidateRepresentation,

  candidateRepresentationA,

  "Resolve replay baseline must capture the deterministic similarity candidate representation.",

);

console.log(
  "PASS 13 — replay baseline captures canonical similarity candidate representation",
);

// ============================================================
// TEST 14
// COMPLETE EQUIVALENT REPLAY VERIFIES BOTH PRODUCTS
// ============================================================

assert(

  equivalentReplay.manifoldVerified === true,

  "Equivalent replay must verify the canonical manifold representation.",

);

assert(

  equivalentReplay.similarityCandidatesVerified === true,

  "Equivalent replay must verify the canonical similarity candidate representation.",

);

assert(

  equivalentReplay.verified === true,

  "Equivalent replay must verify the complete deterministic Resolve product.",

);

console.log(
  "PASS 14 — equivalent replay verifies both manifold and candidate products",
);

// ============================================================
// TEST 15
// CANDIDATE-ONLY DIVERGENCE DETECTION
// ============================================================
//
// Critical P56D-C invariant:
//
//     M1 = M2
//     C1 != C2
//
// must imply:
//
//     replay = DIVERGED
//
// Candidates are deliberately outside CanonicalManifold.
//
// Therefore replay must detect candidate divergence
// independently from manifold divergence.
//
// ============================================================

const forgedCandidateRepresentation =
  `${candidateRepresentationA}#FORGED-CANDIDATE-DIVERGENCE`;

const candidateOnlyDivergence =
  verifyResolveRepresentations(

    representationA,

    representationA,

    candidateRepresentationA,

    forgedCandidateRepresentation,

  );

assert(

  candidateOnlyDivergence.manifoldVerified === true,

  "Candidate-only divergence fixture must retain manifold equivalence.",

);

assert(

  candidateOnlyDivergence.similarityCandidatesVerified === false,

  "Candidate-only divergence must fail candidate verification.",

);

assert(

  candidateOnlyDivergence.verified === false,

  "Candidate-only divergence must fail complete Resolve replay verification.",

);

assert(

  candidateOnlyDivergence.status ===
    ResolveReplayStatus.DIVERGED,

  "Candidate-only divergence must report DIVERGED.",

);

console.log(
  "PASS 15 — candidate-only divergence is detected even when manifold bytes are identical",
);

// ============================================================
// TEST 16
// MANIFOLD-ONLY DIVERGENCE DETECTION
// ============================================================

const manifoldOnlyDivergence =
  verifyResolveRepresentations(

    representationA,

    `${representationA}#FORGED-MANIFOLD-DIVERGENCE`,

    candidateRepresentationA,

    candidateRepresentationA,

  );

assert(

  manifoldOnlyDivergence.manifoldVerified === false,

  "Manifold-only divergence must fail manifold verification.",

);

assert(

  manifoldOnlyDivergence.similarityCandidatesVerified === true,

  "Manifold-only divergence fixture must retain candidate equivalence.",

);

assert(

  manifoldOnlyDivergence.verified === false,

  "Manifold-only divergence must fail complete Resolve replay verification.",

);

assert(

  manifoldOnlyDivergence.status ===
    ResolveReplayStatus.DIVERGED,

  "Manifold-only divergence must report DIVERGED.",

);

console.log(
  "PASS 16 — manifold-only divergence remains independently detectable",
);

// ============================================================
// TEST 17
// DIRECT COMPLETE-PRODUCT EQUIVALENCE
// ============================================================

const completeEquivalentRepresentations =
  verifyResolveRepresentations(

    representationA,

    representationB,

    candidateRepresentationA,

    candidateRepresentationB,

  );

assert(

  completeEquivalentRepresentations.manifoldVerified === true,

  "Direct complete-product verification must recognize equivalent manifold representations.",

);

assert(

  completeEquivalentRepresentations.similarityCandidatesVerified === true,

  "Direct complete-product verification must recognize equivalent candidate representations.",

);

assert(

  completeEquivalentRepresentations.verified === true,

  "Equivalent deterministic Resolve products must verify directly.",

);

assert(

  completeEquivalentRepresentations.status ===
    ResolveReplayStatus.VERIFIED,

  "Equivalent direct Resolve-product verification must report VERIFIED.",

);

console.log(
  "PASS 17 — direct complete-product comparison verifies equivalent Resolve outputs",
);

// ============================================================
// TEST 18
// LEGACY MANIFOLD-ONLY COMPARISON REMAINS SCOPED
// ============================================================
//
// verifyCanonicalRepresentations() remains intentionally
// backward-compatible.
//
// It verifies only the supplied CanonicalManifold
// representations.
//
// It does NOT compare an external candidate product.
//
// Complete Resolve replay verification belongs to:
//
//   verifyResolveReplay()
//
// or:
//
//   verifyResolveRepresentations()
//
// ============================================================

const manifoldOnlyEquivalent =
  verifyCanonicalRepresentations(

    representationA,

    representationB,

  );

assert(

  manifoldOnlyEquivalent.manifoldVerified === true,

  "Legacy manifold-only comparison must verify equivalent canonical manifold representations.",

);

assert(

  manifoldOnlyEquivalent.verified === true,

  "Explicitly scoped manifold-only comparison must remain backward-compatible.",

);

console.log(
  "PASS 18 — legacy canonical representation comparison remains explicitly manifold-scoped",
);

// ============================================================
// RESULT
// ============================================================

console.log("");
console.log(
  "============================================================",
);
console.log(
  " P56D-C COMPLETE RESOLVE DETERMINISM VERIFIED",
);
console.log(
  "============================================================",
);
console.log("");
console.log(
  "Verified:",
);
console.log(
  "  canonical Knowledge ordering",
);
console.log(
  "  canonical Active Layer ordering and deduplication",
);
console.log(
  "  repeated deterministic computation",
);
console.log(
  "  malformed canonical input rejection",
);
console.log(
  "  semantically equivalent replay",
);
console.log(
  "  meaningful computational divergence detection",
);
console.log(
  "  deterministic provenance equivalence",
);
console.log(
  "  forged computational lineage rejection",
);
console.log(
  "  equivalent similarity candidate generation",
);
console.log(
  "  replay baseline candidate preservation",
);
console.log(
  "  complete manifold + candidate replay verification",
);
console.log(
  "  candidate-only divergence detection",
);
console.log(
  "  manifold-only divergence detection",
);
console.log(
  "  direct complete-product equivalence",
);
console.log(
  "  backward-compatible manifold-only comparison",
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
  "Downstream candidate derivation:",
);
console.log(
  "  C = h(M.similarityMatrix)",
);
console.log("");
console.log(
  "Complete deterministic Resolve product:",
);
console.log(
  "  U -> M -> C",
);
console.log("");
console.log(
  "All 18 deterministic invariants passed.",
);

// ============================================================
// END
// ============================================================