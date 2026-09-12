import type { KnowledgeObject } from "../model/KnowledgeObject.ts";
import { KnowledgeObjectStatus, KnowledgeObjectType } from "../model/KnowledgeObjectTypes.ts";
import type { NativeCaseDraftContent } from "../../nativeCaseDraft/NativeCaseDraftTypes";
import type { Workspace } from "../../workspace/workspaceTypes.ts";

export const GUEST_CANDIDATE_SOURCE_TYPE = "RESEARCHER_SUPPLIED_GUEST_CANDIDATE" as const;
export const GUEST_CANDIDATE_SOURCE_KIND = "NATIVE_CASE_DRAFT_EVENT" as const;

export type GuestCandidateOperationalFeatures = Readonly<Record<string, string | number>>;

export interface GuestCandidateKnowledgePayload {
  readonly source: "RESEARCHER_SUPPLIED";
  readonly sourceKind: typeof GUEST_CANDIDATE_SOURCE_KIND;
  readonly nativeCaseDraftContent: NativeCaseDraftContent;
  readonly operationalFeatures: GuestCandidateOperationalFeatures;
}

function lexical(left: string, right: string): number {
  return left < right ? -1 : left > right ? 1 : 0;
}

function canonicalValue(value: unknown): unknown {
  if (Array.isArray(value)) return value.map(canonicalValue);
  if (value !== null && typeof value === "object") {
    return Object.fromEntries(Object.entries(value as Record<string, unknown>)
      .sort(([left], [right]) => lexical(left, right))
      .map(([key, child]) => [key, canonicalValue(child)]));
  }
  return value;
}

function deepFreeze<T>(value: T): T {
  if (value !== null && typeof value === "object" && !Object.isFrozen(value)) {
    Object.values(value as Record<string, unknown>).forEach(deepFreeze);
    Object.freeze(value);
  }
  return value;
}

export function serializeGuestCandidateContent(content: NativeCaseDraftContent): string {
  return JSON.stringify(canonicalValue(content));
}

export function projectSuppliedGuestCandidateFeatures(content: NativeCaseDraftContent): GuestCandidateOperationalFeatures {
  const projected: Record<string, string | number> = {};
  for (const [field, envelope] of Object.entries(content)) {
    if (field === "schemaVersion" || envelope === null || typeof envelope !== "object" || !("state" in envelope) || envelope.state !== "SUPPLIED") continue;
    if ("seconds" in envelope && typeof envelope.seconds === "number") projected[field] = envelope.seconds;
    else if ("value" in envelope && (typeof envelope.value === "string" || typeof envelope.value === "number")) projected[field] = envelope.value;
  }
  return deepFreeze(canonicalValue(projected) as GuestCandidateOperationalFeatures);
}

export function isGuestCandidateKnowledgePayload(value: unknown): value is GuestCandidateKnowledgePayload {
  return value !== null && typeof value === "object" &&
    "source" in value && value.source === "RESEARCHER_SUPPLIED" &&
    "sourceKind" in value && value.sourceKind === GUEST_CANDIDATE_SOURCE_KIND &&
    "nativeCaseDraftContent" in value && "operationalFeatures" in value;
}

export function createGuestCandidateKnowledgeObject(input: Readonly<{
  candidateId: string;
  title: string;
  content: NativeCaseDraftContent;
  operatorId: string;
  recordedAt: string;
}>): KnowledgeObject {
  const payload: GuestCandidateKnowledgePayload = {
    source: "RESEARCHER_SUPPLIED",
    sourceKind: GUEST_CANDIDATE_SOURCE_KIND,
    nativeCaseDraftContent: input.content,
    operationalFeatures: projectSuppliedGuestCandidateFeatures(input.content),
  };
  return deepFreeze({
    identity: { id: input.candidateId, createdAt: input.recordedAt },
    metadata: { title: input.title, description: "Researcher-supplied temporary guest candidate.", author: input.operatorId, version: "1.0.0" },
    lifecycle: { status: KnowledgeObjectStatus.COLLECTED, revision: 1 },
    type: KnowledgeObjectType.EVENT,
    status: KnowledgeObjectStatus.COLLECTED,
    confidence: { value: 1, rationale: "Object confidence is not an asserted guest operational feature." },
    provenance: { sourceId: input.candidateId, sourceType: GUEST_CANDIDATE_SOURCE_TYPE, sourceRevision: 1, observedAt: input.recordedAt, createdAt: input.recordedAt, updatedAt: input.recordedAt },
    revision: { revision: 1, timestamp: input.recordedAt },
    graph: [], relationships: [], tags: [],
    capabilities: { projectable: true, publishable: false, editable: false },
    payload,
  });
}

export function composeGuestOperationalKnowledgeObjects(workspace: Workspace | undefined, canonicalObjects: readonly KnowledgeObject[]): readonly KnowledgeObject[] {
  const candidate = workspace?.guest_candidate_event?.knowledgeObject;
  if (candidate === undefined) return canonicalObjects;
  const conflicting = canonicalObjects.find(object => object.identity.id === candidate.identity.id);
  if (conflicting !== undefined && JSON.stringify(canonicalValue(conflicting)) !== JSON.stringify(canonicalValue(candidate))) {
    throw new Error("Guest candidate Knowledge identity conflicts with existing Knowledge.");
  }
  return Object.freeze(conflicting === undefined ? [...canonicalObjects, candidate] : [...canonicalObjects]);
}
