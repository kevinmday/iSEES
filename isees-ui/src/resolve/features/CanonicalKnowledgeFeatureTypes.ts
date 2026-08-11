// ============================================================
// src/resolve/features/CanonicalKnowledgeFeatureTypes.ts
//
// P56C-A
// CANONICAL KNOWLEDGE FEATURE TYPES
//
// Canonical deterministic computational feature vocabulary
// consumed by Resolve operators.
//
// PURPOSE
//
// Knowledge Objects are the canonical epistemic units owned by
// the Knowledge Runtime.
//
// Resolve operators must NOT depend directly upon:
//
//   • legacy CorpusEvent structures
//   • renderer GraphNode / GraphEdge structures
//   • arbitrary UI state
//   • mutable runtime state
//
// Instead:
//
//        KnowledgeObject[]
//              +
//      explicit Knowledge topology
//              ↓
//      Canonical Feature Extraction
//              ↓
//     CanonicalKnowledgeFeatureSet[]
//              ↓
//        Resolve Operators
//
// This establishes the deterministic boundary:
//
//        (K, G₀)
//           ↓
//           F
//           ↓
//        operators
//
// IMPORTANT
//
// Feature absence is NOT equivalent to a feature value of zero.
//
// Therefore optional feature dimensions remain undefined when
// canonical Knowledge does not support their computation.
//
// No React.
// No runtime lifecycle.
// No graph rendering.
// No persistence.
// No networking.
// No AI inference.
// No clocks.
// No random values.
//
// ============================================================

// ============================================================
// FEATURE AVAILABILITY
// ============================================================
//
// Explicit availability allows Resolve operators to distinguish:
//
//   value = 0
//
// from:
//
//   feature unavailable
//
// This distinction becomes essential when heterogeneous
// Knowledge Object types participate in the same computational
// universe.
//
// ============================================================

export const CanonicalFeatureAvailability = {

  AVAILABLE:
    "AVAILABLE",

  UNAVAILABLE:
    "UNAVAILABLE",

} as const;

export type CanonicalFeatureAvailability =
  (typeof CanonicalFeatureAvailability)[keyof typeof CanonicalFeatureAvailability];

// ============================================================
// FEATURE SOURCE
// ============================================================
//
// Describes the canonical source from which a feature was
// extracted.
//
// These are computational lineage classifications.
//
// They are NOT runtime provenance timestamps or execution
// metadata.
//
// ============================================================

export const CanonicalFeatureSource = {

  KNOWLEDGE_OBJECT:
    "KNOWLEDGE_OBJECT",

  KNOWLEDGE_PAYLOAD:
    "KNOWLEDGE_PAYLOAD",

  KNOWLEDGE_RELATIONSHIP:
    "KNOWLEDGE_RELATIONSHIP",

  KNOWLEDGE_NEIGHBORHOOD:
    "KNOWLEDGE_NEIGHBORHOOD",

} as const;

export type CanonicalFeatureSource =
  (typeof CanonicalFeatureSource)[keyof typeof CanonicalFeatureSource];

// ============================================================
// FEATURE LINEAGE
// ============================================================
//
// Every available computational feature should be traceable to
// the canonical Knowledge state that produced it.
//
// sourceKnowledgeObjectIds are canonically ordered.
//
// relationshipIds are canonically ordered when present.
//
// ============================================================

export interface CanonicalFeatureLineage {

  source:
    CanonicalFeatureSource;

  sourceKnowledgeObjectIds:
    readonly string[];

  relationshipIds?:
    readonly string[];

}

// ============================================================
// GENERIC FEATURE VALUE
// ============================================================
//
// CanonicalFeatureValue<T> provides one common deterministic
// representation for feature availability.
//
// AVAILABLE:
//
//   availability = AVAILABLE
//   value        = canonical feature value
//   lineage      = canonical source lineage
//
// UNAVAILABLE:
//
//   availability = UNAVAILABLE
//   value        does not exist
//
// This prevents accidental coercion:
//
//     undefined → 0
//
// inside computational operators.
//
// ============================================================

export interface AvailableCanonicalFeature<T> {

  availability:
    typeof CanonicalFeatureAvailability.AVAILABLE;

  value:
    T;

  lineage:
    CanonicalFeatureLineage;

}

export interface UnavailableCanonicalFeature {

  availability:
    typeof CanonicalFeatureAvailability.UNAVAILABLE;

  reason:
    string;

}

export type CanonicalFeatureValue<T> =

  | AvailableCanonicalFeature<T>

  | UnavailableCanonicalFeature;

// ============================================================
// NARRATIVE FEATURES
// ============================================================
//
// First canonical feature dimension corresponding to the
// historical narrative similarity dimension.
//
// Traits are canonical semantic descriptors.
//
// They are represented independently of any similarity
// algorithm.
//
// ============================================================

export interface CanonicalNarrativeFeatures {

  traits:
    CanonicalFeatureValue<
      readonly string[]
    >;

}

// ============================================================
// OBSERVABILITY FEATURES
// ============================================================
//
// Canonical observability state.
//
// Confidence and duration remain independent features.
//
// A missing duration is NOT duration zero.
//
// ============================================================

export interface CanonicalObservabilityFeatures {

  confidence:
    CanonicalFeatureValue<number>;

  durationMinutes:
    CanonicalFeatureValue<number>;

}

// ============================================================
// INFRASTRUCTURE FEATURE
// ============================================================
//
// Infrastructure is contextual Knowledge.
//
// The feature representation preserves canonical entity
// identity and infrastructure classification rather than
// collapsing directly into a similarity score.
//
// ============================================================

export interface CanonicalInfrastructureEntityFeature {

  knowledgeObjectId:
    string;

  facilityType:
    string;

}

// ============================================================
// INFRASTRUCTURE FEATURES
// ============================================================

export interface CanonicalInfrastructureFeatures {

  entities:
    CanonicalFeatureValue<
      readonly CanonicalInfrastructureEntityFeature[]
    >;

}

// ============================================================
// TOPOLOGY FEATURES
// ============================================================
//
// Canonical computational topology consumed by the historical
// deterministic Resolve similarity computation.
//
// The initial topology vector is:
//
//     T = (Dc, Ri, Es, Fc)
//
// where:
//
//   Dc = contradiction density
//   Ri = residual instability
//   Es = entanglement score
//   Fc = cluster fragmentation
//
// These values originate from canonical event topology state.
//
// They are computational features, NOT rendered topology.
//
// IMPORTANT:
//
// Missing topology state is NOT equivalent to a zero-valued
// topology vector.
//
// P56C-A.1 corrects the provisional P56C-A topology vocabulary
// against the actual P24.2 Resolve computation contract.
//
// ============================================================
export interface CanonicalTopologyState {

  // ----------------------------------------------------------
  // CONTRADICTION DENSITY
  // ----------------------------------------------------------

  contradictionDensity:
    number;

  // ----------------------------------------------------------
  // RESIDUAL INSTABILITY
  // ----------------------------------------------------------

  residualInstability:
    number;

  // ----------------------------------------------------------
  // ENTANGLEMENT SCORE
  // ----------------------------------------------------------

  entanglementScore:
    number;

  // ----------------------------------------------------------
  // CLUSTER FRAGMENTATION
  // ----------------------------------------------------------

  clusterFragmentation:
    number;

}

export interface CanonicalTopologyFeatures {

  state:
    CanonicalFeatureValue<
      CanonicalTopologyState
    >;

}

// ============================================================
// GEOGRAPHIC FEATURES
// ============================================================
//
// Geography is represented independently from graph rendering.
//
// Location identity is preserved when available.
//
// State remains explicit because it is required by the first
// legacy-parity similarity operator.
//
// Latitude / longitude remain optional because canonical
// Knowledge may legitimately contain only partial geography.
//
// ============================================================

export interface CanonicalGeographicLocation {

  knowledgeObjectId:
    string;

  city?:
    string;

  state?:
    string;

  lat?:
    number;

  lon?:
    number;

}

export interface CanonicalGeographicFeatures {

  location:
    CanonicalFeatureValue<
      CanonicalGeographicLocation
    >;

}

// ============================================================
// CANONICAL KNOWLEDGE FEATURE SET
// ============================================================
//
// One deterministic computational feature representation for
// one Knowledge Object.
//
// This object does NOT assert that every Knowledge Object is
// eligible for every Resolve operator.
//
// Operator eligibility is evaluated downstream.
//
// Example:
//
//   EVENT
//     → may expose all five initial similarity dimensions
//
//   OBSERVATION
//     → may expose confidence and authored semantics
//     → may NOT possess sufficient features for EVENT_SIMILARITY
//
// Therefore:
//
//   existence in K
//        ≠
//   eligibility for every operator
//
// ============================================================

export interface CanonicalKnowledgeFeatureSet {

  // ----------------------------------------------------------
  // SOURCE KNOWLEDGE IDENTITY
  // ----------------------------------------------------------

  knowledgeObjectId:
    string;

  // ----------------------------------------------------------
  // SOURCE KNOWLEDGE TYPE
  // ----------------------------------------------------------

  knowledgeObjectType:
    string;

  // ----------------------------------------------------------
  // NARRATIVE
  // ----------------------------------------------------------

  narrative:
    CanonicalNarrativeFeatures;

  // ----------------------------------------------------------
  // OBSERVABILITY
  // ----------------------------------------------------------

  observability:
    CanonicalObservabilityFeatures;

  // ----------------------------------------------------------
  // INFRASTRUCTURE
  // ----------------------------------------------------------

  infrastructure:
    CanonicalInfrastructureFeatures;

  // ----------------------------------------------------------
  // TOPOLOGY
  // ----------------------------------------------------------

  topology:
    CanonicalTopologyFeatures;

  // ----------------------------------------------------------
  // GEOGRAPHY
  // ----------------------------------------------------------

  geography:
    CanonicalGeographicFeatures;

}

// ============================================================
// FEATURE COLLECTION
// ============================================================
//
// Canonical ordering:
//
//   knowledgeObjectId ascending by explicit lexical comparison.
//
// The extractor owns establishment of this ordering.
//
// ============================================================

export interface CanonicalKnowledgeFeatureCollection {

  features:
    readonly CanonicalKnowledgeFeatureSet[];

}

// ============================================================
// FEATURE DIMENSION
// ============================================================
//
// Stable vocabulary used by operator eligibility and future
// computational provenance.
//
// ============================================================

export const CanonicalFeatureDimension = {

  NARRATIVE:
    "NARRATIVE",

  OBSERVABILITY:
    "OBSERVABILITY",

  INFRASTRUCTURE:
    "INFRASTRUCTURE",

  TOPOLOGY:
    "TOPOLOGY",

  GEOGRAPHY:
    "GEOGRAPHY",

} as const;

export type CanonicalFeatureDimension =
  (typeof CanonicalFeatureDimension)[keyof typeof CanonicalFeatureDimension];

// ============================================================
// INITIAL OPERATOR FEATURE REQUIREMENTS
// ============================================================
//
// This contract does NOT execute an operator.
//
// It simply provides a deterministic vocabulary by which an
// operator can declare the computational dimensions it needs.
//
// ============================================================

export interface CanonicalOperatorFeatureRequirements {

  requiredDimensions:
    readonly CanonicalFeatureDimension[];

}

// ============================================================
// ARCHITECTURAL INVARIANTS
// ============================================================
//
// 1.
//
//   Knowledge Objects remain canonical epistemic state.
//
// 2.
//
//   Feature Sets are deterministic computational projections
//   of Knowledge.
//
// 3.
//
//   Feature Sets are NOT Knowledge Objects.
//
// 4.
//
//   Feature Sets are NOT rendered graph topology.
//
// 5.
//
//   Missing feature ≠ zero feature.
//
// 6.
//
//   Resolve operators consume canonical features rather than
//   legacy CorpusEvent structures.
//
// 7.
//
//   Feature extraction may use:
//
//       F(kᵢ, K, G₀)
//
//   because contextual features may arise from explicit
//   Knowledge relationships.
//
// 8.
//
//   Feature extraction introduces no wall-clock time,
//   randomness, runtime identity, or external mutable state.
//
// ============================================================

// ============================================================
// END
// ============================================================
