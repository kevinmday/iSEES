import type { Investigation } from "../../investigation/investigationTypes";
import type { KnowledgeObject } from "../../knowledge/model/KnowledgeObject";
import { KnowledgeObjectType } from "../../knowledge/model/KnowledgeObjectTypes";
import {
  TimelineTemporalPrecision,
  TimelineTemporalSemantic,
  type TimelineSourceRecord,
} from "./TimelineTemporalProjectionTypes";

type CanonicalEventPayload = Readonly<{
  source?: unknown;
  sourceKind?: unknown;
  canonicalEvent?: Readonly<{
    core_event?: Readonly<{
      observability_profile?: Readonly<{ duration_minutes?: unknown }>;
    }>;
  }>;
}>;

function canonicalEventObject(eventId: string, objects: readonly KnowledgeObject[]): KnowledgeObject | undefined {
  const matches = objects.filter(object =>
    object.type === KnowledgeObjectType.EVENT &&
    object.provenance.sourceType === "SYSTEM_CANON" &&
    object.provenance.sourceId === eventId
  );
  return matches.length === 1 ? matches[0] : undefined;
}

/**
 * Admits only explicitly typed temporal fields. Creation timestamps, the 1970
 * unspecified sentinel, identifiers, titles, and narrative prose are ignored.
 */
export function adaptFocusedEventTimelineSourceRecords(
  investigation: Investigation,
  knowledgeObjects: readonly KnowledgeObject[],
): readonly TimelineSourceRecord[] {
  const eventId = investigation.workspace.focused_event_id;
  if (!eventId) return Object.freeze([]);
  const object = canonicalEventObject(eventId, knowledgeObjects);
  if (!object) return Object.freeze([]);

  const payload = object.payload as CanonicalEventPayload | undefined;
  const duration = payload?.source === "SYSTEM_CANON" && payload.sourceKind === "CANONICAL_REPLAY_EVENT"
    ? payload.canonicalEvent?.core_event?.observability_profile?.duration_minutes
    : undefined;

  if (typeof duration !== "number" || !Number.isFinite(duration) || duration < 0) {
    return Object.freeze([]);
  }

  return Object.freeze([Object.freeze({
    itemId: `timeline:${encodeURIComponent(investigation.id)}:${encodeURIComponent(eventId)}:duration`,
    investigationId: investigation.id,
    eventId,
    semantic: TimelineTemporalSemantic.OCCURRENCE,
    precision: TimelineTemporalPrecision.APPROXIMATE,
    temporal: Object.freeze({ kind: "DURATION", value: duration, unit: "MINUTES" }),
    subject: Object.freeze({ type: "NODE", id: object.identity.id }),
    provenance: Object.freeze({
      sourceType: "SYSTEM_CANON",
      sourceId: eventId,
      sourceField: "core_event.observability_profile.duration_minutes",
      sourceValue: String(duration),
    }),
    qualification: Object.freeze({
      confidence: object.confidence.value,
      rationale: "Canonical Event observability profile; duration does not establish an occurrence instant.",
    }),
    evidenceReferenceIds: Object.freeze([]),
    mediaReferenceIds: Object.freeze([]),
  } satisfies TimelineSourceRecord)]);
}
