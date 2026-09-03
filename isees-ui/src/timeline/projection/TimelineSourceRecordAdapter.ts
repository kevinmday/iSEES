import type { Investigation } from "../../investigation/investigationTypes";
import type { KnowledgeObject } from "../../knowledge/model/KnowledgeObject";
import { KnowledgeObjectType } from "../../knowledge/model/KnowledgeObjectTypes";
import type { GraphNode } from "../../manifold/graphTypes";
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

function currentGraphEventNode(investigation: Investigation, eventId: string): GraphNode | undefined {
  const graph = investigation.revisions.find(
    revision => revision.id === investigation.currentRevisionId,
  )?.manifold.graph;
  if (!graph) return undefined;

  const matches = graph.nodes.filter(node => {
    if (node.type !== "EVENT") return false;
    const sourceId = node.metadata?.sourceId;
    const retainedEventId = node.metadata?.eventId;
    return node.id === eventId || sourceId === eventId || retainedEventId === eventId;
  });

  return matches.length === 1 ? matches[0] : undefined;
}

/**
 * Admits only explicitly typed temporal fields. Creation timestamps, the 1970
 * unspecified sentinel, identifiers, titles, and narrative prose are ignored.
 */
export function adaptEventTimelineSourceRecords(
  investigation: Investigation,
  eventId: string,
  knowledgeObjects: readonly KnowledgeObject[],
): readonly TimelineSourceRecord[] {
  if (!eventId.trim() || !investigation.workspace.imported_events.some(reference => reference.event_id === eventId)) return Object.freeze([]);
  const object = canonicalEventObject(eventId, knowledgeObjects);
  if (!object) return Object.freeze([]);
  const graphNode = currentGraphEventNode(investigation, eventId);

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
    ...(graphNode ? { subject: Object.freeze({ type: "NODE" as const, id: graphNode.id }) } : {}),
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

export function adaptFocusedEventTimelineSourceRecords(
  investigation: Investigation,
  knowledgeObjects: readonly KnowledgeObject[],
): readonly TimelineSourceRecord[] {
  const eventId = investigation.workspace.focused_event_id;
  return eventId ? adaptEventTimelineSourceRecords(investigation, eventId, knowledgeObjects) : Object.freeze([]);
}
