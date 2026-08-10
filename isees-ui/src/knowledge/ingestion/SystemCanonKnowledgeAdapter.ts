// ============================================================
// src/knowledge/ingestion/SystemCanonKnowledgeAdapter.ts
// P56A
// SYSTEM CANON → COMPUTATIONAL KNOWLEDGE ADAPTER
//
// Deterministically transforms canonical replay events into
// Computational Knowledge Objects.
//
// Governing ingress:
//
//     CanonicalReplayEvent[]
//              ↓
//              Iₛ
//              ↓
//       KnowledgeObject[]
//              ↓
//              K
//
// This adapter establishes explicit source semantics before
// topology construction.
//
// It does NOT:
//
// • mutate KnowledgeObjectRuntime
// • build manifold topology
// • perform Resolve–Dissolve Computation
// • perform layout
// • render UI
// • perform persistence
// • perform networking
// • perform AI inference
//
// Deterministic constraints:
//
// • no Date()
// • no crypto.randomUUID()
// • no Math.random()
//
// ============================================================

import type {
  CanonicalReplayEvent,
} from "../../adapters/canonicalEventAdapter";

import type {
  KnowledgeObject,
} from "../model/KnowledgeObject";

import {
  KnowledgeObjectStatus,
  KnowledgeObjectType,

  type KnowledgeExportCapabilities,
  type KnowledgeGraphReference,
  type KnowledgeLifecycle,
  type KnowledgeProvenance,
  type KnowledgeRelationship,
  type KnowledgeRevision,
  type KnowledgeTag,
} from "../model/KnowledgeObjectTypes";

// ============================================================
// CONSTANTS
// ============================================================

const SYSTEM_CANON_SOURCE_TYPE =
  "SYSTEM_CANON";

const SYSTEM_CANON_VERSION =
  "1.0.0";

const SYSTEM_CANON_REVISION =
  1;

// ------------------------------------------------------------
// System Canon source artifacts currently do not expose their
// own authored timestamps.
//
// Do not introduce wall-clock time.
//
// A fixed epoch represents deterministic "source timestamp not
// supplied" until canonical source metadata gains timestamps.
// ------------------------------------------------------------

const CANONICAL_UNSPECIFIED_TIMESTAMP =
  "1970-01-01T00:00:00.000Z";

// ============================================================
// CANONICAL STRING COMPARISON
// ============================================================

function compareCanonicalStrings(
  a: string,
  b: string,
): number {

  if (
    a < b
  ) {

    return -1;

  }

  if (
    a > b
  ) {

    return 1;

  }

  return 0;

}

// ============================================================
// ID COMPONENT NORMALIZATION
// ============================================================
//
// IDs must be derived entirely from canonical source content.
//
// This normalization is intentionally simple and deterministic.
//
// ============================================================

function normalizeIdComponent(
  value: string,
): string {

  return value
    .trim()
    .toLowerCase()
    .replace(
      /[^a-z0-9]+/g,
      "-",
    )
    .replace(
      /^-+|-+$/g,
      "",
    );

}

// ============================================================
// EVENT KNOWLEDGE ID
// ============================================================

function createEventKnowledgeId(
  eventId: string,
): string {

  return `system:event:${eventId}`;

}

// ============================================================
// LOCATION KNOWLEDGE ID
// ============================================================

function createLocationKnowledgeId(
  event: CanonicalReplayEvent,
): string | undefined {

  const location =
    event.core_event?.location;

  if (
    location === undefined
  ) {

    return undefined;

  }

  const components = [

    location.city,
    location.state,

    location.lat !== undefined
      ? String(location.lat)
      : undefined,

    location.lon !== undefined
      ? String(location.lon)
      : undefined,

  ]
    .filter(
      (
        value,
      ): value is string =>
        value !== undefined &&
        value.trim().length > 0,
    );

  if (
    components.length === 0
  ) {

    return undefined;

  }

  return [
    "system",
    "location",
    normalizeIdComponent(
      components.join("-"),
    ),
  ].join(":");

}

// ============================================================
// FACILITY KNOWLEDGE ID
// ============================================================

function createFacilityKnowledgeId(
  name: string,
): string {

  return [
    "system",
    "entity",
    normalizeIdComponent(
      name,
    ),
  ].join(":");

}

// ============================================================
// RELATIONSHIP IDS
// ============================================================

function createRelationshipId(
  sourceId: string,
  relationshipType: string,
  targetId: string,
): string {

  return [
    "system",
    "relationship",
    normalizeIdComponent(
      sourceId,
    ),
    normalizeIdComponent(
      relationshipType,
    ),
    normalizeIdComponent(
      targetId,
    ),
  ].join(":");

}

// ============================================================
// COMMON LIFECYCLE
// ============================================================

function createLifecycle():
KnowledgeLifecycle {

  return {

    status:
      KnowledgeObjectStatus.KNOWLEDGE,

    revision:
      SYSTEM_CANON_REVISION,

  };

}

// ============================================================
// COMMON REVISION
// ============================================================

function createRevision():
KnowledgeRevision {

  return {

    revision:
      SYSTEM_CANON_REVISION,

    timestamp:
      CANONICAL_UNSPECIFIED_TIMESTAMP,

  };

}

// ============================================================
// COMMON CAPABILITIES
// ============================================================

function createCapabilities():
KnowledgeExportCapabilities {

  return {

    projectable:
      true,

    publishable:
      true,

    // System Canon is source-authoritative.
    // Editing should occur through canonical source curation,
    // not by mutating the projected Knowledge Object.
    editable:
      false,

  };

}

// ============================================================
// COMMON PROVENANCE
// ============================================================

function createProvenance(
  sourceId: string,
): KnowledgeProvenance {

  return {

    sourceId,

    sourceType:
      SYSTEM_CANON_SOURCE_TYPE,

    sourceRevision:
      SYSTEM_CANON_REVISION,

    observedAt:
      CANONICAL_UNSPECIFIED_TIMESTAMP,

    createdAt:
      CANONICAL_UNSPECIFIED_TIMESTAMP,

    updatedAt:
      CANONICAL_UNSPECIFIED_TIMESTAMP,

  };

}

// ============================================================
// TAG FACTORY
// ============================================================
//
// Tags require IDs.
//
// IDs are derived from object identity + canonical tag value.
//
// ============================================================

function createTags(
  objectId: string,
  values: string[],
): KnowledgeTag[] {

  const unique =
    Array.from(
      new Set(
        values
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

  return unique.map(
    value => ({

      id: [
        objectId,
        "tag",
        normalizeIdComponent(
          value,
        ),
      ].join(":"),

      label:
        value,

    }),
  );

}

// ============================================================
// EVENT RELATIONSHIPS
// ============================================================

function createEventRelationships(
  event: CanonicalReplayEvent,
): KnowledgeRelationship[] {

  const eventKnowledgeId =
    createEventKnowledgeId(
      event.event_id,
    );

  const relationships:
    KnowledgeRelationship[] = [];

  // ----------------------------------------------------------
  // LOCATION
  // ----------------------------------------------------------

  const locationId =
    createLocationKnowledgeId(
      event,
    );

  if (
    locationId !== undefined
  ) {

    relationships.push({

      id:
        createRelationshipId(
          eventKnowledgeId,
          "LOCATED_AT",
          locationId,
        ),

      type:
        "LOCATED_AT",

      targetId:
        locationId,

    });

  }

  // ----------------------------------------------------------
  // FACILITIES
  // ----------------------------------------------------------

  const facilities =
    event.core_event
      ?.infrastructure_context
      ?.facilities ??
    [];

  for (
    const facility
    of facilities
  ) {

    const facilityId =
      createFacilityKnowledgeId(
        facility.name,
      );

    relationships.push({

      id:
        createRelationshipId(
          eventKnowledgeId,
          "OBSERVED_AT",
          facilityId,
        ),

      type:
        "OBSERVED_AT",

      targetId:
        facilityId,

    });

  }

  return relationships
    .sort(
      (
        a,
        b,
      ) =>
        compareCanonicalStrings(
          a.id,
          b.id,
        ),
    );

}

// ============================================================
// EVENT OBJECT
// ============================================================

function createEventObject(
  event: CanonicalReplayEvent,
): KnowledgeObject {

  const id =
    createEventKnowledgeId(
      event.event_id,
    );

  const confidence =
    event.core_event
      ?.observability_profile
      ?.confidence ??
    0;

  const traits =
    event.core_event
      ?.semantic_signature
      ?.traits ??
    [];

  const domains =
    event.operational_intelligence
      ?.domain_inference ??
    [];

  return {

    identity: {

      id,

      createdAt:
        CANONICAL_UNSPECIFIED_TIMESTAMP,

    },

    metadata: {

      title:
        event.event_name,

      description:
        `System Canon event: ${event.classification}`,

      version:
        SYSTEM_CANON_VERSION,

    },

    lifecycle:
      createLifecycle(),

    type:
      KnowledgeObjectType.EVENT,

    status:
      KnowledgeObjectStatus.KNOWLEDGE,

    confidence: {

      value:
        confidence,

      rationale:
        "Inherited from System Canon observability profile.",

    },

    provenance:
      createProvenance(
        event.event_id,
      ),

    revision:
      createRevision(),

    graph:
      [] as KnowledgeGraphReference[],

    relationships:
      createEventRelationships(
        event,
      ),

    tags:
      createTags(
        id,
        [
          event.classification,
          ...traits,
          ...domains,
        ],
      ),

    capabilities:
      createCapabilities(),

    payload: {

      source:
        "SYSTEM_CANON",

      sourceKind:
        "CANONICAL_REPLAY_EVENT",

      canonicalEvent:
        event,

    },

  };

}

// ============================================================
// LOCATION OBJECT
// ============================================================

function createLocationObject(
  event: CanonicalReplayEvent,
): KnowledgeObject | undefined {

  const location =
    event.core_event?.location;

  const id =
    createLocationKnowledgeId(
      event,
    );

  if (
    location === undefined ||
    id === undefined
  ) {

    return undefined;

  }

  const labelParts = [

    location.city,
    location.state,

  ]
    .filter(
      (
        value,
      ): value is string =>
        value !== undefined &&
        value.trim().length > 0,
    );

  const title =
    labelParts.length > 0
      ? labelParts.join(", ")
      : id;

  return {

    identity: {

      id,

      createdAt:
        CANONICAL_UNSPECIFIED_TIMESTAMP,

    },

    metadata: {

      title,

      description:
        "Location derived from System Canon event.",

      version:
        SYSTEM_CANON_VERSION,

    },

    lifecycle:
      createLifecycle(),

    type:
      KnowledgeObjectType.LOCATION,

    status:
      KnowledgeObjectStatus.KNOWLEDGE,

    confidence: {

      value:
        1,

      rationale:
        "Explicit location encoded in System Canon.",

    },

    provenance:
      createProvenance(
        event.event_id,
      ),

    revision:
      createRevision(),

    graph:
      [],

    relationships:
      [],

    tags:
      createTags(
        id,
        [
          "SYSTEM_CANON_LOCATION",
        ],
      ),

    capabilities:
      createCapabilities(),

    payload: {

      source:
        "SYSTEM_CANON",

      sourceKind:
        "CANONICAL_LOCATION",

      eventId:
        event.event_id,

      city:
        location.city,

      state:
        location.state,

      lat:
        location.lat,

      lon:
        location.lon,

    },

  };

}

// ============================================================
// FACILITY / INFRASTRUCTURE ENTITY OBJECT
// ============================================================
//
// KOM intentionally does not require the renderer-specific
// FACILITY type.
//
// Canonical facility semantics are represented as ENTITY and
// preserved explicitly in payload and tags.
//
// ============================================================

function createFacilityObject(
  event: CanonicalReplayEvent,
  facility: {
    name: string;
    type: string;
    distance: string;
  },
): KnowledgeObject {

  const id =
    createFacilityKnowledgeId(
      facility.name,
    );

  return {

    identity: {

      id,

      createdAt:
        CANONICAL_UNSPECIFIED_TIMESTAMP,

    },

    metadata: {

      title:
        facility.name,

      description:
        `System Canon infrastructure entity: ${facility.type}`,

      version:
        SYSTEM_CANON_VERSION,

    },

    lifecycle:
      createLifecycle(),

    type:
      KnowledgeObjectType.ENTITY,

    status:
      KnowledgeObjectStatus.KNOWLEDGE,

    confidence: {

      value:
        1,

      rationale:
        "Explicit infrastructure entity encoded in System Canon.",

    },

    provenance:
      createProvenance(
        event.event_id,
      ),

    revision:
      createRevision(),

    graph:
      [],

    relationships:
      [],

    tags:
      createTags(
        id,
        [
          "SYSTEM_CANON_FACILITY",
          facility.type,
        ],
      ),

    capabilities:
      createCapabilities(),

    payload: {

      source:
        "SYSTEM_CANON",

      sourceKind:
        "CANONICAL_FACILITY",

      eventId:
        event.event_id,

      facilityName:
        facility.name,

      facilityType:
        facility.type,

      distance:
        facility.distance,

    },

  };

}

// ============================================================
// SINGLE EVENT INGESTION
// ============================================================

export function adaptSystemCanonEventToKnowledge(
  event: CanonicalReplayEvent,
): KnowledgeObject[] {

  const objects:
    KnowledgeObject[] = [];

  // ----------------------------------------------------------
  // EVENT
  // ----------------------------------------------------------

  objects.push(
    createEventObject(
      event,
    ),
  );

  // ----------------------------------------------------------
  // LOCATION
  // ----------------------------------------------------------

  const location =
    createLocationObject(
      event,
    );

  if (
    location !== undefined
  ) {

    objects.push(
      location,
    );

  }

  // ----------------------------------------------------------
  // INFRASTRUCTURE ENTITIES
  // ----------------------------------------------------------

  const facilities =
    event.core_event
      ?.infrastructure_context
      ?.facilities ??
    [];

  for (
    const facility
    of facilities
  ) {

    objects.push(
      createFacilityObject(
        event,
        facility,
      ),
    );

  }

  return objects
    .sort(
      (
        a,
        b,
      ) =>
        compareCanonicalStrings(
          a.identity.id,
          b.identity.id,
        ),
    );

}

// ============================================================
// MULTI-EVENT INGESTION
// ============================================================
//
// Duplicate Knowledge Object identities are deterministically
// collapsed.
//
// This matters when multiple canonical events reference the
// same infrastructure entity.
//
// First canonical occurrence by sorted event identity wins.
//
// ============================================================

export function adaptSystemCanonToKnowledge(
  events: CanonicalReplayEvent[],
): KnowledgeObject[] {

  const objectMap =
    new Map<
      string,
      KnowledgeObject
    >();

  const canonicalEvents =
    [...events]
      .sort(
        (
          a,
          b,
        ) =>
          compareCanonicalStrings(
            a.event_id,
            b.event_id,
          ),
      );

  for (
    const event
    of canonicalEvents
  ) {

    const objects =
      adaptSystemCanonEventToKnowledge(
        event,
      );

    for (
      const object
      of objects
    ) {

      if (
        !objectMap.has(
          object.identity.id,
        )
      ) {

        objectMap.set(
          object.identity.id,
          object,
        );

      }

    }

  }

  return Array.from(
    objectMap.values(),
  )
    .sort(
      (
        a,
        b,
      ) =>
        compareCanonicalStrings(
          a.identity.id,
          b.identity.id,
        ),
    );

}

// ============================================================
// END
// ============================================================