import type { KnowledgeObject } from "../../knowledge/model/KnowledgeObject";
import { KnowledgeObjectType } from "../../knowledge/model/KnowledgeObjectTypes";
import type { GuestCandidateEvent } from "../../workspace/workspaceTypes";

export interface GuestCandidateCanonField { readonly label: string; readonly value: string | null; }
export interface GuestCandidateCompareOption { readonly eventId: string; readonly knowledgeObjectId: string; readonly title: string; readonly fields: readonly GuestCandidateCanonField[]; }

function canonFields(payload: unknown): readonly GuestCandidateCanonField[] {
  const event = payload !== null && typeof payload === "object" && "canonicalEvent" in payload ? payload.canonicalEvent : null;
  if (event === null || typeof event !== "object") return [];
  const core = "core_event" in event && event.core_event && typeof event.core_event === "object" ? event.core_event : null;
  const location = core && "location" in core && core.location && typeof core.location === "object" ? core.location : null;
  const profile = core && "observability_profile" in core && core.observability_profile && typeof core.observability_profile === "object" ? core.observability_profile : null;
  const signature = core && "semantic_signature" in core && core.semantic_signature && typeof core.semantic_signature === "object" ? core.semantic_signature : null;
  const text = (value: unknown) => typeof value === "string" && value.trim() ? value : null;
  const city = location && "city" in location ? text(location.city) : null;
  const state = location && "state" in location ? text(location.state) : null;
  const narratives = signature && "narratives" in signature && Array.isArray(signature.narratives) ? signature.narratives.filter((value): value is string => typeof value === "string") : [];
  const reports = profile && "reports" in profile && typeof profile.reports === "number" ? String(profile.reports) : null;
  const minutes = profile && "duration_minutes" in profile && typeof profile.duration_minutes === "number" ? `${profile.duration_minutes * 60} seconds` : null;
  return Object.freeze([
    { label: "Title", value: "event_name" in event ? text(event.event_name) : null }, { label: "Location", value: [city, state].filter(Boolean).join(", ") || null },
    { label: "Local date", value: null }, { label: "Local time", value: null }, { label: "Timezone", value: null },
    { label: "Narrative", value: narratives.length ? narratives.join("\n\n") : null }, { label: "Shape", value: null }, { label: "Movement", value: null },
    { label: "Sound", value: null }, { label: "Lighting / visibility", value: null }, { label: "Observer context", value: null },
    { label: "Witness count", value: reports }, { label: "Environmental conditions", value: null }, { label: "Duration", value: minutes },
  ]);
}

export function projectGuestCandidateCanonOptions(candidate: GuestCandidateEvent, objects: readonly KnowledgeObject[]): readonly GuestCandidateCompareOption[] {
  if (candidate.objectType !== "EVENT" || candidate.knowledgeClassification !== "CANDIDATE_KNOWLEDGE" || candidate.origin !== "RESEARCHER_SUPPLIED" || candidate.systemCanonIdentity !== null) return [];
  return Object.freeze(objects
    .filter(object => object.type === KnowledgeObjectType.EVENT && object.provenance.sourceType === "SYSTEM_CANON" && object.provenance.sourceId.trim())
    .map(object => Object.freeze({ eventId: object.provenance.sourceId, knowledgeObjectId: object.identity.id, title: object.metadata.title, fields: canonFields(object.payload) }))
    .sort((left, right) => left.eventId.localeCompare(right.eventId)));
}
