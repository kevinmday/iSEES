// ============================================================
// src/resolve/features/CanonicalKnowledgeFeatureExtractor.ts
//
// P56C-A
// CANONICAL KNOWLEDGE FEATURE EXTRACTOR
//
// Deterministically projects canonical Knowledge state into the
// computational feature representation consumed by Resolve
// operators.
//
// GOVERNING TRANSFORMATION
//
//              (K, G₀)
//                 ↓
//                 F
//                 ↓
//    CanonicalKnowledgeFeatureSet[]
//
// IMPORTANT
//
// This module does NOT:
//
//   • compute similarity
//   • create computed relationships
//   • create rendered graph edges
//   • mutate Knowledge
//   • mutate Knowledge Runtime
//   • depend upon legacy Corpus resolution
//   • perform Resolve runtime lifecycle
//   • perform UI work
//   • perform persistence
//   • perform networking
//   • perform AI inference
//
// Feature absence is NOT equivalent to zero.
//
// No clocks.
// No random values.
// No external mutable state.
//
// ============================================================

import type {
  CanonicalReplayEvent,
} from "../../adapters/canonicalEventAdapter";

import type {
  KnowledgeObject,
} from "../../knowledge/model/KnowledgeObject";

import {
  KnowledgeObjectType,
} from "../../knowledge/model/KnowledgeObjectTypes";

import {
  CanonicalFeatureAvailability,
  CanonicalFeatureSource,

  type AvailableCanonicalFeature,
  type CanonicalFeatureLineage,
  type CanonicalFeatureValue,
  type CanonicalGeographicLocation,
  type CanonicalInfrastructureEntityFeature,
  type CanonicalKnowledgeFeatureCollection,
  type CanonicalKnowledgeFeatureSet,
  type CanonicalTopologyState,
  type UnavailableCanonicalFeature,
} from "./CanonicalKnowledgeFeatureTypes";

// ============================================================
// SYSTEM CANON PAYLOAD SHAPES
// ============================================================
//
// KnowledgeObject.payload is intentionally unknown.
//
// The feature boundary therefore performs structural validation
// before consuming source-specific payload data.
//
// These interfaces describe only the properties required by
// this extractor.
//
// They do NOT replace the canonical Knowledge Object model.
//
// ============================================================

interface SystemCanonEventPayload {

  source:
    "SYSTEM_CANON";

  sourceKind:
    "CANONICAL_REPLAY_EVENT";

  canonicalEvent:
    CanonicalReplayEvent;

}

interface CanonicalLocationPayload {

  source:
    "SYSTEM_CANON";

  sourceKind:
    "CANONICAL_LOCATION";

  eventId:
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

interface CanonicalFacilityPayload {

  source:
    "SYSTEM_CANON";

  sourceKind:
    "CANONICAL_FACILITY";

  eventId:
    string;

  facilityName:
    string;

  facilityType:
    string;

  distance:
    string;

}

// ============================================================
// CANONICAL STRING COMPARATOR
// ============================================================
//
// Explicit lexical comparison avoids locale-dependent ordering.
//
// ============================================================

function compareCanonicalStrings(
  left: string,
  right: string,
): number {

  if (
    left < right
  ) {

    return -1;

  }

  if (
    left > right
  ) {

    return 1;

  }

  return 0;

}

// ============================================================
// RECORD GUARD
// ============================================================

function isRecord(
  value: unknown,
): value is Record<string, unknown> {

  return (
    typeof value === "object" &&
    value !== null &&
    !Array.isArray(value)
  );

}

// ============================================================
// AVAILABLE FEATURE
// ============================================================

function availableFeature<T>(
  value: T,
  lineage: CanonicalFeatureLineage,
): AvailableCanonicalFeature<T> {

  return {

    availability:
      CanonicalFeatureAvailability.AVAILABLE,

    value,

    lineage,

  };

}

// ============================================================
// UNAVAILABLE FEATURE
// ============================================================

function unavailableFeature(
  reason: string,
): UnavailableCanonicalFeature {

  return {

    availability:
      CanonicalFeatureAvailability.UNAVAILABLE,

    reason,

  };

}

// ============================================================
// CANONICAL LINEAGE
// ============================================================

function createLineage(
  source:
    CanonicalFeatureLineage["source"],
  sourceKnowledgeObjectIds:
    readonly string[],
  relationshipIds?:
    readonly string[],
): CanonicalFeatureLineage {

  const canonicalObjectIds =
    Array.from(
      new Set(
        sourceKnowledgeObjectIds,
      ),
    )
      .sort(
        compareCanonicalStrings,
      );

  const canonicalRelationshipIds =
    relationshipIds === undefined
      ? undefined
      : Array.from(
          new Set(
            relationshipIds,
          ),
        )
          .sort(
            compareCanonicalStrings,
          );

  return {

    source,

    sourceKnowledgeObjectIds:
      canonicalObjectIds,

    ...(
      canonicalRelationshipIds === undefined
        ? {}
        : {
            relationshipIds:
              canonicalRelationshipIds,
          }
    ),

  };

}

// ============================================================
// SYSTEM CANON EVENT PAYLOAD GUARD
// ============================================================

function isSystemCanonEventPayload(
  payload: unknown,
): payload is SystemCanonEventPayload {

  if (
    !isRecord(
      payload,
    )
  ) {

    return false;

  }

  if (
    payload.source !== "SYSTEM_CANON" ||
    payload.sourceKind !==
      "CANONICAL_REPLAY_EVENT"
  ) {

    return false;

  }

  return isRecord(
    payload.canonicalEvent,
  );

}

// ============================================================
// LOCATION PAYLOAD GUARD
// ============================================================

function isCanonicalLocationPayload(
  payload: unknown,
): payload is CanonicalLocationPayload {

  if (
    !isRecord(
      payload,
    )
  ) {

    return false;

  }

  return (
    payload.source ===
      "SYSTEM_CANON" &&
    payload.sourceKind ===
      "CANONICAL_LOCATION" &&
    typeof payload.eventId ===
      "string"
  );

}

// ============================================================
// FACILITY PAYLOAD GUARD
// ============================================================

function isCanonicalFacilityPayload(
  payload: unknown,
): payload is CanonicalFacilityPayload {

  if (
    !isRecord(
      payload,
    )
  ) {

    return false;

  }

  return (
    payload.source ===
      "SYSTEM_CANON" &&
    payload.sourceKind ===
      "CANONICAL_FACILITY" &&
    typeof payload.eventId ===
      "string" &&
    typeof payload.facilityName ===
      "string" &&
    typeof payload.facilityType ===
      "string" &&
    typeof payload.distance ===
      "string"
  );

}

// ============================================================
// KNOWLEDGE INDEX
// ============================================================

function buildKnowledgeIndex(
  knowledgeObjects:
    readonly KnowledgeObject[],
): ReadonlyMap<string, KnowledgeObject> {

  const index =
    new Map<
      string,
      KnowledgeObject
    >();

  const canonicalObjects =
    [...knowledgeObjects]
      .sort(
        (
          left,
          right,
        ) =>
          compareCanonicalStrings(
            left.identity.id,
            right.identity.id,
          ),
      );

  for (
    const object
    of canonicalObjects
  ) {

    if (
      !index.has(
        object.identity.id,
      )
    ) {

      index.set(
        object.identity.id,
        object,
      );

    }

  }

  return index;

}

// ============================================================
// NARRATIVE TRAITS
// ============================================================

function extractNarrativeTraits(
  object: KnowledgeObject,
): CanonicalFeatureValue<
  readonly string[]
> {

  const payload =
    object.payload;

  if (
    isSystemCanonEventPayload(
      payload,
    )
  ) {

    const traits =
      payload
        .canonicalEvent
        .core_event
        ?.semantic_signature
        ?.traits;

    if (
      traits !== undefined
    ) {

      const canonicalTraits =
        Array.from(
          new Set(
            traits
              .map(
                value =>
                  value.trim(),
              )
              .filter(
                value =>
                  value.length > 0,
              ),
          ),
        )
          .sort(
            compareCanonicalStrings,
          );

      return availableFeature(
        canonicalTraits,
        createLineage(
          CanonicalFeatureSource
            .KNOWLEDGE_PAYLOAD,
          [
            object.identity.id,
          ],
        ),
      );

    }

  }

  // ----------------------------------------------------------
  // FALLBACK
  // ----------------------------------------------------------
  //
  // Tags are canonical Knowledge semantics and may provide
  // useful narrative descriptors for non-System-Canon objects.
  //
  // We deliberately do NOT treat every tag as equivalent to a
  // System Canon semantic trait.
  //
  // Until a canonical tag-to-narrative contract exists, feature
  // absence remains explicit.
  //
  // ----------------------------------------------------------

  return unavailableFeature(
    "Canonical narrative traits are not available for this Knowledge Object.",
  );

}

// ============================================================
// OBSERVABILITY CONFIDENCE
// ============================================================

function extractConfidence(
  object: KnowledgeObject,
): CanonicalFeatureValue<number> {

  const confidence =
    object.confidence?.value;

  if (
    typeof confidence === "number" &&
    Number.isFinite(
      confidence,
    )
  ) {

    return availableFeature(
      confidence,
      createLineage(
        CanonicalFeatureSource
          .KNOWLEDGE_OBJECT,
        [
          object.identity.id,
        ],
      ),
    );

  }

  return unavailableFeature(
    "Canonical Knowledge confidence is unavailable.",
  );

}

// ============================================================
// OBSERVABILITY DURATION
// ============================================================

function extractDurationMinutes(
  object: KnowledgeObject,
): CanonicalFeatureValue<number> {

  const payload =
    object.payload;

  if (
    isSystemCanonEventPayload(
      payload,
    )
  ) {

    const duration =
      payload
        .canonicalEvent
        .core_event
        ?.observability_profile
        ?.duration_minutes;

    if (
      typeof duration === "number" &&
      Number.isFinite(
        duration,
      )
    ) {

      return availableFeature(
        duration,
        createLineage(
          CanonicalFeatureSource
            .KNOWLEDGE_PAYLOAD,
          [
            object.identity.id,
          ],
        ),
      );

    }

  }

  return unavailableFeature(
    "Canonical observability duration is unavailable.",
  );

}

// ============================================================
// INFRASTRUCTURE
// ============================================================
//
// Infrastructure is extracted through explicit OBSERVED_AT
// relationships.
//
// This is important:
//
//   EVENT payload
//
// is not treated as the canonical topology authority.
//
// Explicit Knowledge relationships establish the contextual
// neighborhood.
//
// Facility payload supplies the facility classification.
//
// ============================================================

function extractInfrastructure(
  object: KnowledgeObject,
  knowledgeIndex:
    ReadonlyMap<
      string,
      KnowledgeObject
    >,
): CanonicalFeatureValue<
  readonly CanonicalInfrastructureEntityFeature[]
> {

  const relationships =
    object.relationships
      .filter(
        relationship =>
          relationship.type ===
            "OBSERVED_AT",
      )
      .sort(
        (
          left,
          right,
        ) =>
          compareCanonicalStrings(
            left.id,
            right.id,
          ),
      );

  if (
    relationships.length === 0
  ) {

    return unavailableFeature(
      "No explicit OBSERVED_AT Knowledge relationships are available.",
    );

  }

  const entities:
    CanonicalInfrastructureEntityFeature[] =
      [];

  const sourceObjectIds:
    string[] = [
      object.identity.id,
    ];

  const relationshipIds:
    string[] = [];

  for (
    const relationship
    of relationships
  ) {

    const target =
      knowledgeIndex.get(
        relationship.targetId,
      );

    if (
      target === undefined
    ) {

      continue;

    }

    if (
      target.type !==
        KnowledgeObjectType.ENTITY
    ) {

      continue;

    }

    if (
      !isCanonicalFacilityPayload(
        target.payload,
      )
    ) {

      continue;

    }

    entities.push({

      knowledgeObjectId:
        target.identity.id,

      facilityType:
        target.payload
          .facilityType,

    });

    sourceObjectIds.push(
      target.identity.id,
    );

    relationshipIds.push(
      relationship.id,
    );

  }

  if (
    entities.length === 0
  ) {

    return unavailableFeature(
      "OBSERVED_AT relationships exist, but no canonical infrastructure entity features could be extracted.",
    );

  }

  const canonicalEntities =
    entities
      .sort(
        (
          left,
          right,
        ) => {

          const byId =
            compareCanonicalStrings(
              left.knowledgeObjectId,
              right.knowledgeObjectId,
            );

          if (
            byId !== 0
          ) {

            return byId;

          }

          return compareCanonicalStrings(
            left.facilityType,
            right.facilityType,
          );

        },
      );

  return availableFeature(
    canonicalEntities,
    createLineage(
      CanonicalFeatureSource
        .KNOWLEDGE_NEIGHBORHOOD,
      sourceObjectIds,
      relationshipIds,
    ),
  );

}

// ============================================================
// TOPOLOGY STATE
// ============================================================
//
// Initial migration parity requires the historical topology
// dimensions encoded by CanonicalReplayEvent.
//
// These values are extracted from canonical EVENT payload.
//
// They are NOT GraphNode / GraphEdge rendering properties.
//
// Future RDC packages may derive richer topology directly from
// canonical Knowledge topology.
//
// ============================================================

function extractTopologyState(
  object: KnowledgeObject,
): CanonicalFeatureValue<
  CanonicalTopologyState
> {

  // ----------------------------------------------------------
  // P56C-A.1
  // CANONICAL TOPOLOGY FEATURE EXTRACTION
  // ----------------------------------------------------------
  //
  // Historical deterministic Resolve topology similarity
  // consumes the canonical topology vector:
  //
  //     T = (Dc, Ri, Es, Fc)
  //
  // where:
  //
  //   Dc = contradiction_density
  //   Ri = residual_instability
  //   Es = entanglement_score
  //   Fc = cluster_fragmentation
  //
  // These values are represented directly by the canonical
  // EVENT topology contract carried by the Knowledge payload.
  //
  // IMPORTANT:
  //
  // Missing topology MUST NOT be represented as:
  //
  //     (0, 0, 0, 0)
  //
  // Zero is a legitimate computational value.
  //
  // Therefore topology is AVAILABLE only when all four
  // numerical dimensions are explicitly present and finite.
  //
  // This preserves the canonical feature invariant:
  //
  //     UNAVAILABLE != 0
  //
  // No legacy Corpus state is imported.
  // No missing values are manufactured.
  // No absent values are substituted with zero.
  //
  // ----------------------------------------------------------

  if (
    !isSystemCanonEventPayload(
      object.payload,
    )
  ) {

    return unavailableFeature(
      "Knowledge Object does not contain a canonical System Canon EVENT payload.",
    );

  }

  const topology =
    object
      .payload
      .canonicalEvent
      .topology
      ?.topology_state;

  if (
    topology === undefined
  ) {

    return unavailableFeature(
      "Canonical EVENT does not contain topology state.",
    );

  }

  const contradictionDensity =
    topology
      .contradiction_density;

  const residualInstability =
    topology
      .residual_instability;

  const entanglementScore =
    topology
      .entanglement_score;

  const clusterFragmentation =
    topology
      .cluster_fragmentation;

  if (
    typeof contradictionDensity !==
      "number" ||
    !Number.isFinite(
      contradictionDensity,
    ) ||
    typeof residualInstability !==
      "number" ||
    !Number.isFinite(
      residualInstability,
    ) ||
    typeof entanglementScore !==
      "number" ||
    !Number.isFinite(
      entanglementScore,
    ) ||
    typeof clusterFragmentation !==
      "number" ||
    !Number.isFinite(
      clusterFragmentation,
    )
  ) {

    return unavailableFeature(
      "Canonical EVENT topology state is incomplete or non-finite.",
    );

  }

  return availableFeature(
    {

      contradictionDensity,

      residualInstability,

      entanglementScore,

      clusterFragmentation,

    },
    createLineage(
      CanonicalFeatureSource
        .KNOWLEDGE_PAYLOAD,
      [
        object.identity.id,
      ],
      [],
    ),
  );

}

// ============================================================
// GEOGRAPHY
// ============================================================
//
// Geography is resolved through explicit LOCATED_AT Knowledge
// topology.
//
// The EVENT payload is NOT used as topology authority here.
//
// ============================================================

function extractGeography(
  object: KnowledgeObject,
  knowledgeIndex:
    ReadonlyMap<
      string,
      KnowledgeObject
    >,
): CanonicalFeatureValue<
  CanonicalGeographicLocation
> {

  const relationships =
    object.relationships
      .filter(
        relationship =>
          relationship.type ===
            "LOCATED_AT",
      )
      .sort(
        (
          left,
          right,
        ) =>
          compareCanonicalStrings(
            left.id,
            right.id,
          ),
      );

  for (
    const relationship
    of relationships
  ) {

    const target =
      knowledgeIndex.get(
        relationship.targetId,
      );

    if (
      target === undefined
    ) {

      continue;

    }

    if (
      target.type !==
        KnowledgeObjectType.LOCATION
    ) {

      continue;

    }

    if (
      !isCanonicalLocationPayload(
        target.payload,
      )
    ) {

      continue;

    }

    const location:
      CanonicalGeographicLocation = {

        knowledgeObjectId:
          target.identity.id,

        ...(
          typeof target.payload.city ===
            "string"
            ? {
                city:
                  target.payload.city,
              }
            : {}
        ),

        ...(
          typeof target.payload.state ===
            "string"
            ? {
                state:
                  target.payload.state,
              }
            : {}
        ),

        ...(
          typeof target.payload.lat ===
            "number" &&
          Number.isFinite(
            target.payload.lat,
          )
            ? {
                lat:
                  target.payload.lat,
              }
            : {}
        ),

        ...(
          typeof target.payload.lon ===
            "number" &&
          Number.isFinite(
            target.payload.lon,
          )
            ? {
                lon:
                  target.payload.lon,
              }
            : {}
        ),

      };

    return availableFeature(
      location,
      createLineage(
        CanonicalFeatureSource
          .KNOWLEDGE_NEIGHBORHOOD,
        [
          object.identity.id,
          target.identity.id,
        ],
        [
          relationship.id,
        ],
      ),
    );

  }

  return unavailableFeature(
    "No canonical LOCATED_AT Knowledge relationship could be resolved.",
  );

}

// ============================================================
// SINGLE KNOWLEDGE OBJECT EXTRACTION
// ============================================================
//
// Every Knowledge Object receives a feature set.
//
// This does NOT mean every object is eligible for every
// operator.
//
// Heterogeneous Knowledge remains heterogeneous.
//
// ============================================================

export function extractCanonicalKnowledgeFeatures(
  object: KnowledgeObject,
  knowledgeObjects:
    readonly KnowledgeObject[],
): CanonicalKnowledgeFeatureSet {

  const knowledgeIndex =
    buildKnowledgeIndex(
      knowledgeObjects,
    );

  return {

    knowledgeObjectId:
      object.identity.id,

    knowledgeObjectType:
      object.type,

    narrative: {

      traits:
        extractNarrativeTraits(
          object,
        ),

    },

    observability: {

      confidence:
        extractConfidence(
          object,
        ),

      durationMinutes:
        extractDurationMinutes(
          object,
        ),

    },

    infrastructure: {

      entities:
        extractInfrastructure(
          object,
          knowledgeIndex,
        ),

    },

    topology: {

      state:
        extractTopologyState(
          object,
        ),

    },

    geography: {

      location:
        extractGeography(
          object,
          knowledgeIndex,
        ),

    },

  };

}

// ============================================================
// COLLECTION EXTRACTION
// ============================================================
//
// Canonical ordering:
//
//   knowledgeObjectId ascending
//
// Input order therefore cannot alter feature collection order.
//
// ============================================================

export function extractCanonicalKnowledgeFeatureCollection(
  knowledgeObjects:
    readonly KnowledgeObject[],
): CanonicalKnowledgeFeatureCollection {

  const canonicalObjects =
    [...knowledgeObjects]
      .sort(
        (
          left,
          right,
        ) =>
          compareCanonicalStrings(
            left.identity.id,
            right.identity.id,
          ),
      );

  const features =
    canonicalObjects.map(
      object =>
        extractCanonicalKnowledgeFeatures(
          object,
          canonicalObjects,
        ),
    );

  return {

    features,

  };

}

// ============================================================
// EVENT FEATURE EXTRACTION
// ============================================================
//
// Convenience projection for operators whose eligibility begins
// with canonical EVENT Knowledge Objects.
//
// This performs no operator eligibility evaluation beyond the
// source Knowledge Object type.
//
// ============================================================

export function extractCanonicalEventFeatureSets(
  knowledgeObjects:
    readonly KnowledgeObject[],
): readonly CanonicalKnowledgeFeatureSet[] {

  return extractCanonicalKnowledgeFeatureCollection(
    knowledgeObjects,
  )
    .features
    .filter(
      feature =>
        feature.knowledgeObjectType ===
          KnowledgeObjectType.EVENT,
    );

}

// ============================================================
// ARCHITECTURAL INVARIANTS
// ============================================================
//
// 1.
//
//   Knowledge remains canonical source state.
//
// 2.
//
//   Feature extraction is deterministic.
//
// 3.
//
//   Feature extraction does not mutate Knowledge.
//
// 4.
//
//   Feature extraction does not compute relationships.
//
// 5.
//
//   Feature extraction does not create rendered topology.
//
// 6.
//
//   Explicit Knowledge relationships are used for contextual
//   features such as geography and infrastructure.
//
// 7.
//
//   Missing features remain UNAVAILABLE rather than being
//   silently converted to zero.
//
// 8.
//
//   Legacy Corpus resolution types are not dependencies of this
//   module.
//
// 9.
//
//   Equivalent Knowledge state produces equivalent feature
//   state.
//
// ============================================================

// ============================================================
// END
// ============================================================