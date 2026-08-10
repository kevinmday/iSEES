// ============================================================
// src/knowledge/topology/KnowledgeTopologyTypes.ts
// P56A
// KNOWLEDGE-DRIVEN INVESTIGATION TOPOLOGY
//
// Canonical deterministic topology types projected from the
// runtime-owned Computational Knowledge Object population.
//
// Governing transformation:
//
//     K
//     ↓
//     B(K)
//     ↓
//     G₀
//
// where:
//
//     K  = canonical Knowledge Object population
//     B  = deterministic topology construction
//     G₀ = base Investigation Topology
//
// This topology represents what is explicitly present in the
// current knowledge state.
//
// It does NOT:
//
//   • perform Resolve–Dissolve Computation
//   • infer unsupported relationships
//   • perform graph layout
//   • assign spatial coordinates
//   • render UI
//   • perform persistence
//   • perform networking
//   • perform AI inference
//
// ============================================================

// ============================================================
// TOPOLOGY NODE TYPE
// ============================================================
//
// Knowledge Object types are intentionally preserved as
// strings at this boundary.
//
// This prevents the topology layer from maintaining a second
// competing semantic type system.
//
// Examples:
//
//   EVENT
//   OBSERVATION
//   EVIDENCE
//   PERSON
//   LOCATION
//   ORGANIZATION
//   ARTIFACT
//   HYPOTHESIS
//   NARRATIVE
//   DOCUMENT
//
// ============================================================

export type KnowledgeTopologyNodeType =
  string;

// ============================================================
// TOPOLOGY RELATIONSHIP TYPE
// ============================================================
//
// Relationship semantics originate from canonical Knowledge
// Object relationships.
//
// Examples:
//
//   OBSERVED_AT
//   ASSOCIATED_WITH
//   LOCATED_AT
//   SUPPORTS
//   CONTRADICTS
//   DERIVED_FROM
//   REFERENCES
//
// P56A does not maintain a competing relationship vocabulary.
//
// ============================================================

export type KnowledgeTopologyRelationshipType =
  string;

// ============================================================
// TOPOLOGY NODE
// ============================================================
//
// One projectable Knowledge Object becomes one topology node.
//
// identity:
//
//   id is inherited directly from KnowledgeObject.identity.id.
//
// No topology UUID is generated.
//
// This is essential for deterministic reconstruction:
//
//     same K → same node identities
//
// ============================================================

export interface KnowledgeTopologyNode {

  // ----------------------------------------------------------
  // CANONICAL IDENTITY
  // ----------------------------------------------------------

  id: string;

  // ----------------------------------------------------------
  // SEMANTIC TYPE
  // ----------------------------------------------------------

  type: KnowledgeTopologyNodeType;

  // ----------------------------------------------------------
  // OPERATOR LABEL
  // ----------------------------------------------------------

  label: string;

  // ----------------------------------------------------------
  // EPISTEMIC CONFIDENCE
  // ----------------------------------------------------------

  confidence: number;

  // ----------------------------------------------------------
  // SOURCE / PROVENANCE CLASSIFICATION
  // ----------------------------------------------------------
  //
  // P56A preserves the existing KnowledgeProvenance sourceType.
  //
  // A later provenance package may formalize authority domains:
  //
  //   SYSTEM_CANON
  //   RESEARCH
  //   FEDERATED
  //   DERIVED
  //
  // independently from provider identity.
  //
  // ----------------------------------------------------------

  sourceType: string;

  // ----------------------------------------------------------
  // METADATA
  // ----------------------------------------------------------
  //
  // Topology metadata remains computationally descriptive.
  //
  // It must not contain spatial layout coordinates.
  //
  // ----------------------------------------------------------

  metadata: Record<
    string,
    unknown
  >;

}

// ============================================================
// TOPOLOGY EDGE
// ============================================================
//
// A topology edge represents an explicit canonical
// KnowledgeRelationship.
//
// P56A does not infer relationships.
//
// Therefore:
//
//     no canonical relationship
//              ↓
//          no edge
//
// ============================================================

export interface KnowledgeTopologyEdge {

  // ----------------------------------------------------------
  // CANONICAL RELATIONSHIP ID
  // ----------------------------------------------------------

  id: string;

  // ----------------------------------------------------------
  // SOURCE KNOWLEDGE OBJECT
  // ----------------------------------------------------------

  source: string;

  // ----------------------------------------------------------
  // TARGET KNOWLEDGE OBJECT
  // ----------------------------------------------------------

  target: string;

  // ----------------------------------------------------------
  // SEMANTIC RELATIONSHIP
  // ----------------------------------------------------------

  relationshipType:
    KnowledgeTopologyRelationshipType;

  // ----------------------------------------------------------
  // CONFIDENCE
  // ----------------------------------------------------------
  //
  // P56A initially inherits confidence from the owning
  // Knowledge Object unless a future relationship-level
  // confidence model is introduced.
  //
  // ----------------------------------------------------------

  confidence: number;

  // ----------------------------------------------------------
  // METADATA
  // ----------------------------------------------------------

  metadata: Record<
    string,
    unknown
  >;

}

// ============================================================
// TOPOLOGY DIAGNOSTIC TYPE
// ============================================================

export const KnowledgeTopologyDiagnosticType = {

  DANGLING_RELATIONSHIP:
    "DANGLING_RELATIONSHIP",

  DUPLICATE_NODE:
    "DUPLICATE_NODE",

  DUPLICATE_EDGE:
    "DUPLICATE_EDGE",

  NON_PROJECTABLE_OBJECT:
    "NON_PROJECTABLE_OBJECT",

} as const;

export type KnowledgeTopologyDiagnosticType =
  (
    typeof KnowledgeTopologyDiagnosticType
  )[
    keyof typeof KnowledgeTopologyDiagnosticType
  ];

// ============================================================
// TOPOLOGY DIAGNOSTIC
// ============================================================
//
// Diagnostics describe deterministic construction decisions.
//
// They do not mutate topology.
//
// Example:
//
//   Knowledge Object A references missing object B.
//
// P56A behavior:
//
//   • do not manufacture B
//   • omit the unresolved edge
//   • emit DANGLING_RELATIONSHIP
//
// ============================================================

export interface KnowledgeTopologyDiagnostic {

  type:
    KnowledgeTopologyDiagnosticType;

  objectId?: string;

  relationshipId?: string;

  targetId?: string;

  message: string;

}

// ============================================================
// TOPOLOGY STATISTICS
// ============================================================

export interface KnowledgeTopologyStatistics {

  nodeCount: number;

  edgeCount: number;

  diagnosticCount: number;

}

// ============================================================
// KNOWLEDGE TOPOLOGY
// ============================================================
//
// G₀ — Base Investigation Topology
//
// This is the complete deterministic topology product produced
// from the current Knowledge Object population.
//
// No coordinates.
//
// No viewport state.
//
// No React state.
//
// No runtime timestamps.
//
// ============================================================

export interface KnowledgeTopology {

  nodes:
    KnowledgeTopologyNode[];

  edges:
    KnowledgeTopologyEdge[];

  diagnostics:
    KnowledgeTopologyDiagnostic[];

  statistics:
    KnowledgeTopologyStatistics;

}

// ============================================================
// TOPOLOGY BUILD INPUT
// ============================================================
//
// The builder consumes canonical Knowledge Objects.
//
// This interface intentionally remains small.
//
// Computational configuration:
//
//   L — Layers
//   T — Temporal Context
//   S — Investigative Scale
//
// belongs to Resolve–Dissolve Computation, not base topology
// construction.
//
// ============================================================

export interface KnowledgeTopologyBuildOptions {

  includeNonProjectable?: boolean;

}

// ============================================================
// DETERMINISTIC INVARIANTS
// ============================================================
//
// P56A requires:
//
//   identical K
//       ↓
//   identical G₀
//
// Input ordering must not affect the canonical topology.
//
// Therefore implementations consuming these types must:
//
//   • preserve Knowledge Object IDs
//   • preserve relationship IDs
//   • canonicalize output ordering
//   • deterministically deduplicate
//   • deterministically handle dangling relationships
//
// Forbidden inside deterministic topology construction:
//
//   • Date()
//   • crypto.randomUUID()
//   • Math.random()
//   • network access
//   • external mutable state
//   • AI inference
//
// ============================================================

// ============================================================
// END
// ============================================================