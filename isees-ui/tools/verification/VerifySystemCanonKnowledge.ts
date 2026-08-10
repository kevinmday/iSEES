// ============================================================
// tools/verification/VerifySystemCanonKnowledge.ts
// P56A
// SYSTEM CANON KNOWLEDGE INGESTION VERIFICATION
//
// Verifies the deterministic ingress:
//
//     CanonicalReplayEvent[]
//              ↓
//              Iₛ
//              ↓
//       KnowledgeObject[] K
//              ↓
//              B(K)
//              ↓
//              G₀
//
// This verifies that System Canon can become generic
// Computational Knowledge without relying on the legacy
// corpus-specific manifold graph builder.
//
// Required invariants:
//
// • canonical events produce Knowledge Objects
// • canonical event identity is stable
// • Nimitz produces an EVENT Knowledge Object
// • Nimitz produces a LOCATION Knowledge Object
// • Nimitz produces infrastructure ENTITY objects
// • explicit LOCATED_AT relationship is preserved
// • explicit OBSERVED_AT relationships are preserved
// • topology contains no dangling relationships
// • repeated ingress is identical
// • permutation of source events is identical
// • repeated topology construction is identical
//
// No React.
// No runtime mutation.
// No persistence.
// No networking.
// No AI.
//
// ============================================================

import {
  CANONICAL_EVENTS,
} from "../../src/canonical/runtimeCorpus";

import {
  NIMITZ_2004,
} from "../../src/canonical/nimitz_2004";

import {
  adaptSystemCanonEventToKnowledge,
  adaptSystemCanonToKnowledge,
} from "../../src/knowledge/ingestion/SystemCanonKnowledgeAdapter";

import {
  buildKnowledgeTopology,
} from "../../src/knowledge/topology/KnowledgeTopologyBuilder";

import {
  KnowledgeTopologyDiagnosticType,
} from "../../src/knowledge/topology/KnowledgeTopologyTypes";

import {
  KnowledgeObjectType,
} from "../../src/knowledge/model/KnowledgeObjectTypes";

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
// CANONICAL IDS
// ============================================================

const NIMITZ_EVENT_ID =
  "system:event:E-TICTAC-2004";

const NIMITZ_LOCATION_ID =
  "system:location:pacific-ocean-california-31-117";

const USS_PRINCETON_ID =
  "system:entity:uss-princeton";

const USS_NIMITZ_GROUP_ID =
  "system:entity:uss-nimitz-carrier-group";

const E2_HAWKEYE_ID =
  "system:entity:e2-hawkeye-sensor-grid";

// ============================================================
// TEST 1
// SYSTEM CANON PRODUCES KNOWLEDGE
// ============================================================

function verifySystemCanonProducesKnowledge(): void {

  const objects =
    adaptSystemCanonToKnowledge(
      CANONICAL_EVENTS,
    );

  assert(
    objects.length > 0,
    "System Canon must produce at least one Knowledge Object.",
  );

}

// ============================================================
// TEST 2
// NIMITZ EVENT OBJECT
// ============================================================

function verifyNimitzEventObject(): void {

  const objects =
    adaptSystemCanonEventToKnowledge(
      NIMITZ_2004,
    );

  const event =
    objects.find(
      object =>
        object.identity.id ===
        NIMITZ_EVENT_ID,
    );

  assert(
    event !== undefined,
    "Nimitz must produce its canonical EVENT Knowledge Object.",
  );

  assert(
    event?.type ===
      KnowledgeObjectType.EVENT,
    "Nimitz event Knowledge Object must have EVENT type.",
  );

  assert(
    event?.metadata.title ===
      "Nimitz Tic Tac Encounter",
    "Nimitz event title must be preserved.",
  );

  assert(
    event?.provenance.sourceType ===
      "SYSTEM_CANON",
    "Nimitz event provenance must identify SYSTEM_CANON.",
  );

  assert(
    event?.provenance.sourceId ===
      "E-TICTAC-2004",
    "Nimitz event provenance must preserve source event identity.",
  );

}

// ============================================================
// TEST 3
// NIMITZ LOCATION OBJECT
// ============================================================

function verifyNimitzLocation(): void {

  const objects =
    adaptSystemCanonEventToKnowledge(
      NIMITZ_2004,
    );

  const location =
    objects.find(
      object =>
        object.identity.id ===
        NIMITZ_LOCATION_ID,
    );

  assert(
    location !== undefined,
    "Nimitz must produce a canonical LOCATION Knowledge Object.",
  );

  assert(
    location?.type ===
      KnowledgeObjectType.LOCATION,
    "Nimitz location must have LOCATION type.",
  );

  assert(
    location?.metadata.title ===
      "Pacific Ocean, California",
    "Nimitz location title must preserve canonical location semantics.",
  );

}

// ============================================================
// TEST 4
// NIMITZ INFRASTRUCTURE ENTITIES
// ============================================================

function verifyNimitzInfrastructure(): void {

  const objects =
    adaptSystemCanonEventToKnowledge(
      NIMITZ_2004,
    );

  const princeton =
    objects.find(
      object =>
        object.identity.id ===
        USS_PRINCETON_ID,
    );

  const nimitzGroup =
    objects.find(
      object =>
        object.identity.id ===
        USS_NIMITZ_GROUP_ID,
    );

  const hawkeye =
    objects.find(
      object =>
        object.identity.id ===
        E2_HAWKEYE_ID,
    );

  assert(
    princeton !== undefined,
    "Nimitz ingress must produce USS Princeton entity.",
  );

  assert(
    nimitzGroup !== undefined,
    "Nimitz ingress must produce USS Nimitz Carrier Group entity.",
  );

  assert(
    hawkeye !== undefined,
    "Nimitz ingress must produce E2 Hawkeye Sensor Grid entity.",
  );

  assert(
    princeton?.type ===
      KnowledgeObjectType.ENTITY,
    "USS Princeton must enter KOM as ENTITY.",
  );

  assert(
    nimitzGroup?.type ===
      KnowledgeObjectType.ENTITY,
    "USS Nimitz Carrier Group must enter KOM as ENTITY.",
  );

  assert(
    hawkeye?.type ===
      KnowledgeObjectType.ENTITY,
    "E2 Hawkeye Sensor Grid must enter KOM as ENTITY.",
  );

}

// ============================================================
// TEST 5
// NIMITZ EXPLICIT RELATIONSHIPS
// ============================================================

function verifyNimitzRelationships(): void {

  const objects =
    adaptSystemCanonEventToKnowledge(
      NIMITZ_2004,
    );

  const event =
    objects.find(
      object =>
        object.identity.id ===
        NIMITZ_EVENT_ID,
    );

  assert(
    event !== undefined,
    "Nimitz EVENT object is required for relationship verification.",
  );

  if (
    event === undefined
  ) {

    return;

  }

  const locatedAt =
    event.relationships.filter(
      relationship =>
        relationship.type ===
        "LOCATED_AT",
    );

  const observedAt =
    event.relationships.filter(
      relationship =>
        relationship.type ===
        "OBSERVED_AT",
    );

  assert(
    locatedAt.length === 1,
    "Nimitz event must contain exactly one LOCATED_AT relationship.",
  );

  assert(
    locatedAt[0]?.targetId ===
      NIMITZ_LOCATION_ID,
    "Nimitz LOCATED_AT must target its canonical location.",
  );

  assert(
    observedAt.length === 3,
    "Nimitz event must contain exactly three OBSERVED_AT relationships.",
  );

  const observedTargets =
    observedAt
      .map(
        relationship =>
          relationship.targetId,
      )
      .sort();

  assert(
    serialize(
      observedTargets,
    ) ===
      serialize(
        [
          E2_HAWKEYE_ID,
          USS_NIMITZ_GROUP_ID,
          USS_PRINCETON_ID,
        ].sort(),
      ),
    "Nimitz OBSERVED_AT relationships must target all canonical infrastructure entities.",
  );

}

// ============================================================
// TEST 6
// NIMITZ TOPOLOGY
// ============================================================

function verifyNimitzTopology(): void {

  const objects =
    adaptSystemCanonEventToKnowledge(
      NIMITZ_2004,
    );

  const topology =
    buildKnowledgeTopology(
      objects,
    );

  assert(
    topology.nodes.length ===
      objects.length,
    "Every projectable Nimitz Knowledge Object must become a topology node.",
  );

  assert(
    topology.edges.length === 4,
    "Nimitz topology must contain one location edge and three infrastructure edges.",
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
    "Nimitz topology must contain zero dangling relationships.",
  );

}

// ============================================================
// TEST 7
// REPEAT SINGLE-EVENT INGRESS
// ============================================================

function verifyRepeatNimitzIngress(): void {

  const first =
    adaptSystemCanonEventToKnowledge(
      NIMITZ_2004,
    );

  const second =
    adaptSystemCanonEventToKnowledge(
      NIMITZ_2004,
    );

  assert(
    serialize(first) ===
      serialize(second),
    "Repeated Nimitz ingress must produce identical K.",
  );

}

// ============================================================
// TEST 8
// REPEAT FULL SYSTEM CANON INGRESS
// ============================================================

function verifyRepeatSystemCanonIngress(): void {

  const first =
    adaptSystemCanonToKnowledge(
      CANONICAL_EVENTS,
    );

  const second =
    adaptSystemCanonToKnowledge(
      CANONICAL_EVENTS,
    );

  assert(
    serialize(first) ===
      serialize(second),
    "Repeated System Canon ingress must produce identical K.",
  );

}

// ============================================================
// TEST 9
// SOURCE EVENT PERMUTATION
// ============================================================

function verifySystemCanonPermutation(): void {

  const forward =
    adaptSystemCanonToKnowledge(
      CANONICAL_EVENTS,
    );

  const reversed =
    adaptSystemCanonToKnowledge(
      [
        ...CANONICAL_EVENTS,
      ].reverse(),
    );

  assert(
    serialize(forward) ===
      serialize(reversed),
    "Permutation of CanonicalReplayEvent[] must not change K.",
  );

}

// ============================================================
// TEST 10
// FULL TOPOLOGY REPEATABILITY
// ============================================================

function verifyFullTopologyRepeatability(): void {

  const firstKnowledge =
    adaptSystemCanonToKnowledge(
      CANONICAL_EVENTS,
    );

  const secondKnowledge =
    adaptSystemCanonToKnowledge(
      CANONICAL_EVENTS,
    );

  const firstTopology =
    buildKnowledgeTopology(
      firstKnowledge,
    );

  const secondTopology =
    buildKnowledgeTopology(
      secondKnowledge,
    );

  assert(
    serialize(firstTopology) ===
      serialize(secondTopology),
    "Repeated System Canon ingress and topology construction must produce identical G0.",
  );

}

// ============================================================
// TEST 11
// PERMUTED SOURCE → IDENTICAL TOPOLOGY
// ============================================================

function verifyPermutedTopology(): void {

  const forwardKnowledge =
    adaptSystemCanonToKnowledge(
      CANONICAL_EVENTS,
    );

  const reversedKnowledge =
    adaptSystemCanonToKnowledge(
      [
        ...CANONICAL_EVENTS,
      ].reverse(),
    );

  const forwardTopology =
    buildKnowledgeTopology(
      forwardKnowledge,
    );

  const reversedTopology =
    buildKnowledgeTopology(
      reversedKnowledge,
    );

  assert(
    serialize(forwardTopology) ===
      serialize(reversedTopology),
    "Permutation of System Canon source events must produce identical G0.",
  );

}

// ============================================================
// TEST 12
// FULL SYSTEM CANON HAS NO DANGLING RELATIONSHIPS
// ============================================================

function verifyNoSystemCanonDanglingRelationships(): void {

  const knowledge =
    adaptSystemCanonToKnowledge(
      CANONICAL_EVENTS,
    );

  const topology =
    buildKnowledgeTopology(
      knowledge,
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
    "System Canon topology must contain zero dangling relationships.",
  );

}

// ============================================================
// DIAGNOSTIC SUMMARY
// ============================================================

function printSummary(): void {

  const knowledge =
    adaptSystemCanonToKnowledge(
      CANONICAL_EVENTS,
    );

  const topology =
    buildKnowledgeTopology(
      knowledge,
    );

  console.log(
    "",
  );

  console.log(
    "System Canon source events:",
    CANONICAL_EVENTS.length,
  );

  console.log(
    "Knowledge Objects:",
    knowledge.length,
  );

  console.log(
    "Topology nodes:",
    topology.nodes.length,
  );

  console.log(
    "Topology edges:",
    topology.edges.length,
  );

  console.log(
    "Topology diagnostics:",
    topology.diagnostics.length,
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
    "P56A SYSTEM CANON KNOWLEDGE VERIFICATION",
  );

  console.log(
    "==============================================",
  );

  console.log(
    "",
  );

  verifySystemCanonProducesKnowledge();

  console.log(
    "PASS  System Canon produces knowledge",
  );

  verifyNimitzEventObject();

  console.log(
    "PASS  Nimitz EVENT object",
  );

  verifyNimitzLocation();

  console.log(
    "PASS  Nimitz LOCATION object",
  );

  verifyNimitzInfrastructure();

  console.log(
    "PASS  Nimitz infrastructure entities",
  );

  verifyNimitzRelationships();

  console.log(
    "PASS  Nimitz explicit relationships",
  );

  verifyNimitzTopology();

  console.log(
    "PASS  Nimitz topology",
  );

  verifyRepeatNimitzIngress();

  console.log(
    "PASS  repeat Nimitz ingress",
  );

  verifyRepeatSystemCanonIngress();

  console.log(
    "PASS  repeat System Canon ingress",
  );

  verifySystemCanonPermutation();

  console.log(
    "PASS  System Canon source permutation",
  );

  verifyFullTopologyRepeatability();

  console.log(
    "PASS  full topology repeatability",
  );

  verifyPermutedTopology();

  console.log(
    "PASS  permuted source topology",
  );

  verifyNoSystemCanonDanglingRelationships();

  console.log(
    "PASS  zero dangling System Canon relationships",
  );

  printSummary();

  console.log(
    "",
  );

  console.log(
    "All System Canon Knowledge invariants passed.",
  );

  console.log(
    "",
  );

  console.log(
    "Canonical ingress:",
  );

  console.log(
    "CanonicalReplayEvent[] -> K -> G0",
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