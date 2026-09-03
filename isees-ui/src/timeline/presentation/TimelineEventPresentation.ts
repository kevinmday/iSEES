import type { KnowledgeObject } from "../../knowledge/model/KnowledgeObject";
import { KnowledgeObjectType } from "../../knowledge/model/KnowledgeObjectTypes";

export function resolveTimelineEventTitle(eventId: string, knowledgeObjects: readonly KnowledgeObject[]): string {
  const matches = knowledgeObjects.filter(object =>
    object.type === KnowledgeObjectType.EVENT &&
    object.provenance.sourceType === "SYSTEM_CANON" &&
    object.provenance.sourceId === eventId &&
    object.metadata.title.trim().length > 0
  );
  return matches.length === 1 ? matches[0]!.metadata.title.trim() : eventId;
}
