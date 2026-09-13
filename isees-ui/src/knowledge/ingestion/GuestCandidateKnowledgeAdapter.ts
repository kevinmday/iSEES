import type { NativeCaseDraftContent } from "../../nativeCaseDraft/NativeCaseDraftTypes";
import type { Workspace } from "../../workspace/workspaceTypes.ts";
import type { KnowledgeObject } from "../model/KnowledgeObject.ts";
import {
  KnowledgeObjectStatus,
  KnowledgeObjectType,
  type KnowledgeObjectStatus as ObjectStatus,
  type KnowledgeObjectType as ObjectType,
  type KnowledgeRelationship,
} from "../model/KnowledgeObjectTypes.ts";

export const GUEST_CANDIDATE_SOURCE_TYPE = "RESEARCHER_SUPPLIED_GUEST_CANDIDATE" as const;
export const GUEST_CANDIDATE_SOURCE_KIND = "NATIVE_CASE_DRAFT_EVENT" as const;
export const GUEST_CANDIDATE_ADAPTER_VERSION = "guest-candidate-normalization/0.2.0" as const;

const RULE = {
  LOCATION: "location-from-supplied-field/v1",
  NARRATIVE: "narrative-from-supplied-field/v1",
  EVIDENCE: "reported-evidence-mention/v1",
  HYPOTHESIS: "qualified-relationship-hypothesis/v1",
  EVENT: "event-from-native-case-draft/v1",
  EVENT_RELATIONSHIP: "event-relationship-from-normalized-object/v1",
  HYPOTHESIS_RELATIONSHIP: "hypothesis-relationship-from-qualified-statement/v1",
} as const;

type NativeCaseField = keyof NativeCaseDraftContent;
export type GuestCandidateOperationalFeatures = Readonly<Record<string, string | number>>;

export interface GuestCandidateSourceSpan {
  readonly field: NativeCaseField;
  readonly start: number;
  readonly end: number;
  readonly text: string;
}

export interface GuestCandidateNormalizationLineage {
  readonly sourceIdentity: string;
  readonly sourceFields: readonly NativeCaseField[];
  readonly sourceSpans: readonly GuestCandidateSourceSpan[];
  readonly normalizationRule: string;
  readonly adapterVersion: typeof GUEST_CANDIDATE_ADAPTER_VERSION;
  readonly sourceRevisionTime: string;
  readonly supplyingActor: string;
}

export interface GuestCandidateRelationshipLineage extends GuestCandidateNormalizationLineage {
  readonly relationshipId: string;
}

export interface GuestCandidateKnowledgePayload {
  readonly source: "RESEARCHER_SUPPLIED";
  readonly sourceKind: typeof GUEST_CANDIDATE_SOURCE_KIND;
  readonly knowledgeClassification: "CANDIDATE_KNOWLEDGE";
  readonly systemCanonIdentity: null;
  readonly sourceFields: readonly NativeCaseField[];
  readonly nativeCaseDraftContent?: NativeCaseDraftContent;
  readonly operationalFeatures: GuestCandidateOperationalFeatures;
  readonly representation?: Readonly<Record<string, unknown>>;
  readonly normalizationCertainty: 1;
  readonly truthConfidence: null;
  readonly lineage: GuestCandidateNormalizationLineage;
  readonly relationshipLineage: readonly GuestCandidateRelationshipLineage[];
}

type Input = Readonly<{ candidateId: string; title: string; content: NativeCaseDraftContent; operatorId: string; recordedAt: string }>;
type Semantic = Readonly<{
  role: string;
  type: ObjectType;
  status: ObjectStatus;
  title: string;
  description: string;
  representation: Readonly<Record<string, unknown>>;
  rule: string;
  spans: readonly GuestCandidateSourceSpan[];
}>;
type RelationshipWithLineage = Readonly<{ relationship: KnowledgeRelationship; lineage: GuestCandidateRelationshipLineage }>;

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

function normalizeIdentityPart(value: string): string {
  return value.trim().toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "");
}

function objectId(candidateId: string, type: ObjectType, role: string): string {
  return `${candidateId}:${normalizeIdentityPart(type)}:${normalizeIdentityPart(role)}`;
}

function suppliedText(content: NativeCaseDraftContent, field: NativeCaseField): string | undefined {
  const envelope = content[field];
  if (typeof envelope !== "object" || envelope === null || !("state" in envelope) || envelope.state !== "SUPPLIED" || !("value" in envelope) || typeof envelope.value !== "string") return undefined;
  const value = envelope.value.trim();
  return value.length > 0 ? value : undefined;
}

function wholeFieldSpan(field: NativeCaseField, value: string): GuestCandidateSourceSpan {
  return { field, start: 0, end: value.length, text: value };
}

function matchedSpan(field: NativeCaseField, source: string, match: RegExpExecArray): GuestCandidateSourceSpan {
  return { field, start: match.index, end: match.index + match[0].length, text: source.slice(match.index, match.index + match[0].length) };
}

function createLineage(input: Input, rule: string, spans: readonly GuestCandidateSourceSpan[]): GuestCandidateNormalizationLineage {
  return {
    sourceIdentity: input.candidateId,
    sourceFields: [...new Set(spans.map(span => span.field))].sort(lexical),
    sourceSpans: [...spans].sort((left, right) => lexical(`${left.field}:${left.start}`, `${right.field}:${right.start}`)),
    normalizationRule: rule,
    adapterVersion: GUEST_CANDIDATE_ADAPTER_VERSION,
    sourceRevisionTime: input.recordedAt,
    supplyingActor: input.operatorId,
  };
}

const NUMBER_WORDS: Readonly<Record<string, number>> = Object.freeze({ one: 1, two: 2, three: 3, four: 4, five: 5, six: 6, seven: 7, eight: 8, nine: 9, ten: 10 });

function reportedCount(token: string | undefined): number | undefined {
  if (!token) return undefined;
  const numeric = Number(token);
  return Number.isInteger(numeric) && numeric > 0 ? numeric : NUMBER_WORDS[token.toLowerCase()];
}

function evidenceSemantics(content: NativeCaseDraftContent): Semantic[] {
  const notes = suppliedText(content, "researcherNotes");
  if (!notes) return [];
  const rules = [
    { role: "phone-video", category: "PHONE_VIDEO", noun: "phone videos?" },
    { role: "photograph", category: "PHOTOGRAPH", noun: "photographs?" },
    { role: "contemporaneous-note", category: "CONTEMPORANEOUS_NOTES", noun: "contemporaneous notes?" },
    { role: "approximate-coordinate", category: "APPROXIMATE_COORDINATES", noun: "approximate coordinates?" },
    { role: "timestamp", category: "TIMESTAMPS", noun: "timestamps?" },
  ] as const;
  const results: Semantic[] = [];
  for (const rule of rules) {
    const pattern = new RegExp(`\\b(?:(one|two|three|four|five|six|seven|eight|nine|ten|\\d+)\\s+)?(${rule.noun})\\b`, "i");
    const match = pattern.exec(notes);
    if (!match) continue;
    const count = reportedCount(match[1]);
    results.push({
      role: `reported-${rule.role}`,
      type: KnowledgeObjectType.ARTIFACT,
      status: KnowledgeObjectStatus.COLLECTED,
      title: `${count === undefined ? "Reported" : `${count} reported`} ${match[2]!.toLowerCase()}`,
      description: "Researcher-reported evidence; existence, availability, contents, and authenticity are unverified.",
      representation: { category: rule.category, reportedCount: count ?? null, inspected: false },
      rule: RULE.EVIDENCE,
      spans: [matchedSpan("researcherNotes", notes, match)],
    });
  }
  return results;
}

function hypothesisSemantics(content: NativeCaseDraftContent): Semantic[] {
  const fields = ["observationNarrative", "environmentalConditions"] as const;
  const qualifier = /\b(possible|possibly|may|might|could|hypothesis|hypothesized|unverified)\b/i;
  const relationship = /\b(?:relationship|relation|correlation|association|connection|linked?|related)\s+(?:to|with|between)\s+([^.;\n]+)/i;
  for (const field of fields) {
    const value = suppliedText(content, field);
    if (!value) continue;
    const match = relationship.exec(value);
    if (!match) continue;
    const start = Math.max(value.lastIndexOf(".", match.index) + 1, 0);
    const terminator = /[.\n]/.exec(value.slice(match.index));
    const end = terminator ? match.index + terminator.index : value.length;
    const sentence = value.slice(start, end).trim();
    if (!qualifier.test(sentence)) continue;
    const subject = match[1]!.trim().replace(/\s+(?:is|remains)\s+(?:an?\s+)?(?:unverified|possible|hypothesized).*$/i, "").trim();
    return [{
      role: `qualified-hypothesis-${normalizeIdentityPart(subject)}`,
      type: KnowledgeObjectType.HYPOTHESIS,
      status: KnowledgeObjectStatus.HYPOTHESIS,
      title: `Possible relationship to ${subject}`,
      description: "Researcher-supplied, explicitly qualified, unverified working hypothesis.",
      representation: { statement: sentence, verified: false, ambiguity: null },
      rule: RULE.HYPOTHESIS,
      spans: [{ field, start, end, text: value.slice(start, end) }],
    }];
  }
  return [];
}

function semanticObjects(content: NativeCaseDraftContent): Semantic[] {
  const result: Semantic[] = [];
  const location = suppliedText(content, "observationLocation");
  if (location) result.push({ role: "observation-location", type: KnowledgeObjectType.LOCATION, status: KnowledgeObjectStatus.COLLECTED, title: location, description: "Researcher-supplied observation location.", representation: { location }, rule: RULE.LOCATION, spans: [wholeFieldSpan("observationLocation", location)] });
  result.push(...evidenceSemantics(content));
  const narrative = suppliedText(content, "observationNarrative");
  if (narrative) result.push({ role: "observation-narrative", type: KnowledgeObjectType.NARRATIVE, status: KnowledgeObjectStatus.COLLECTED, title: "Researcher-supplied observation narrative", description: narrative, representation: { narrative, verified: false }, rule: RULE.NARRATIVE, spans: [wholeFieldSpan("observationNarrative", narrative)] });
  result.push(...hypothesisSemantics(content));
  return result.sort((left, right) => lexical(`${left.type}:${left.role}`, `${right.type}:${right.role}`));
}

function createRelationship(input: Input, sourceId: string, type: string, targetId: string, rule: string, spans: readonly GuestCandidateSourceSpan[]): RelationshipWithLineage {
  const id = `${sourceId}:relationship:${normalizeIdentityPart(type)}:${normalizeIdentityPart(targetId)}`;
  return { relationship: { id, type, targetId }, lineage: { ...createLineage(input, rule, spans), relationshipId: id } };
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
  return value !== null && typeof value === "object" && "source" in value && value.source === "RESEARCHER_SUPPLIED" && "sourceKind" in value && value.sourceKind === GUEST_CANDIDATE_SOURCE_KIND && "knowledgeClassification" in value && value.knowledgeClassification === "CANDIDATE_KNOWLEDGE" && "systemCanonIdentity" in value && value.systemCanonIdentity === null && "lineage" in value && "relationshipLineage" in value;
}

function createKnowledgeObject(input: Input, id: string, type: ObjectType, status: ObjectStatus, title: string, description: string, payload: GuestCandidateKnowledgePayload, relationships: readonly KnowledgeRelationship[]): KnowledgeObject {
  return deepFreeze({
    identity: { id, createdAt: input.recordedAt }, metadata: { title, description, author: input.operatorId, version: GUEST_CANDIDATE_ADAPTER_VERSION }, lifecycle: { status, revision: 1 }, type, status,
    confidence: { value: 0, rationale: "Truth confidence unavailable; payload.normalizationCertainty records deterministic representation certainty." },
    provenance: { sourceId: input.candidateId, sourceType: GUEST_CANDIDATE_SOURCE_TYPE, sourceRevision: 1, observedAt: input.recordedAt, createdAt: input.recordedAt, updatedAt: input.recordedAt },
    revision: { revision: 1, timestamp: input.recordedAt }, graph: [], relationships: [...relationships].sort((left, right) => lexical(left.id, right.id)), tags: [], capabilities: { projectable: true, publishable: false, editable: false }, payload,
  });
}

function eventRepresentation(input: Input): Readonly<Record<string, unknown>> {
  const observerContext = suppliedText(input.content, "observerContext");
  const witnessCount = input.content.witnessCount.state === "SUPPLIED" ? input.content.witnessCount.value : undefined;
  if (!observerContext && typeof witnessCount !== "number") return {};
  return { aggregateObservation: { observerContext: observerContext ?? null, witnessCount: typeof witnessCount === "number" ? witnessCount : null, individualPersonObjectsMaterialized: false } };
}

export function createGuestCandidateKnowledgeObjects(input: Input): readonly KnowledgeObject[] {
  const semantics = semanticObjects(input.content);
  const ids = new Map(semantics.map(item => [item.role, objectId(input.candidateId, item.type, item.role)]));
  const eventRelationships: RelationshipWithLineage[] = [];
  for (const item of semantics) {
    if (item.type === KnowledgeObjectType.LOCATION) eventRelationships.push(createRelationship(input, input.candidateId, "LOCATED_AT", ids.get(item.role)!, RULE.EVENT_RELATIONSHIP, item.spans));
    else if (item.type === KnowledgeObjectType.ARTIFACT || item.type === KnowledgeObjectType.NARRATIVE) eventRelationships.push(createRelationship(input, input.candidateId, "REFERENCES", ids.get(item.role)!, RULE.EVENT_RELATIONSHIP, item.spans));
  }

  const operationalFeatures = projectSuppliedGuestCandidateFeatures(input.content);
  const suppliedFields = Object.keys(operationalFeatures).sort(lexical) as NativeCaseField[];
  const eventSpans = suppliedFields.map(field => ({ field, start: 0, end: String(operationalFeatures[field]).length, text: String(operationalFeatures[field]) }));
  const eventPayload: GuestCandidateKnowledgePayload = {
    source: "RESEARCHER_SUPPLIED", sourceKind: GUEST_CANDIDATE_SOURCE_KIND, knowledgeClassification: "CANDIDATE_KNOWLEDGE", systemCanonIdentity: null,
    sourceFields: suppliedFields, nativeCaseDraftContent: input.content, operationalFeatures, representation: eventRepresentation(input), normalizationCertainty: 1, truthConfidence: null,
    lineage: createLineage(input, RULE.EVENT, eventSpans), relationshipLineage: eventRelationships.map(item => item.lineage),
  };
  const objects: KnowledgeObject[] = [createKnowledgeObject(input, input.candidateId, KnowledgeObjectType.EVENT, KnowledgeObjectStatus.COLLECTED, input.title, "Researcher-supplied temporary guest candidate.", eventPayload, eventRelationships.map(item => item.relationship))];

  for (const item of semantics) {
    const id = ids.get(item.role)!;
    const outgoing = item.type === KnowledgeObjectType.HYPOTHESIS ? [createRelationship(input, id, "INVESTIGATES", input.candidateId, RULE.HYPOTHESIS_RELATIONSHIP, item.spans)] : [];
    const payload: GuestCandidateKnowledgePayload = {
      source: "RESEARCHER_SUPPLIED", sourceKind: GUEST_CANDIDATE_SOURCE_KIND, knowledgeClassification: "CANDIDATE_KNOWLEDGE", systemCanonIdentity: null,
      sourceFields: [...new Set(item.spans.map(span => span.field))].sort(lexical), operationalFeatures: {}, representation: item.representation, normalizationCertainty: 1, truthConfidence: null,
      lineage: createLineage(input, item.rule, item.spans), relationshipLineage: outgoing.map(entry => entry.lineage),
    };
    objects.push(createKnowledgeObject(input, id, item.type, item.status, item.title, item.description, payload, outgoing.map(entry => entry.relationship)));
  }
  return deepFreeze(objects.sort((left, right) => lexical(left.identity.id, right.identity.id)));
}

export function createGuestCandidateKnowledgeObject(input: Input): KnowledgeObject {
  const event = createGuestCandidateKnowledgeObjects(input).find(object => object.identity.id === input.candidateId);
  if (!event) throw new Error("Guest candidate normalization did not produce its authoritative EVENT.");
  return event;
}

export function composeGuestOperationalKnowledgeObjects(workspace: Workspace | undefined, canonicalObjects: readonly KnowledgeObject[]): readonly KnowledgeObject[] {
  const candidate = workspace?.guest_candidate_event?.knowledgeObject;
  if (!candidate) return canonicalObjects;
  const payload = candidate.payload;
  if (!isGuestCandidateKnowledgePayload(payload) || !payload.nativeCaseDraftContent) throw new Error("Guest candidate EVENT payload cannot materialize operational Knowledge.");
  const guest = createGuestCandidateKnowledgeObjects({ candidateId: candidate.identity.id, title: candidate.metadata.title, content: payload.nativeCaseDraftContent, operatorId: candidate.metadata.author ?? "", recordedAt: candidate.identity.createdAt });
  const reconstructedEvent = guest.find(object => object.identity.id === candidate.identity.id);
  if (JSON.stringify(canonicalValue(reconstructedEvent)) !== JSON.stringify(canonicalValue(candidate))) throw new Error("Stored guest EVENT diverges from its authoritative normalized projection.");
  const composed = new Map(canonicalObjects.map(object => [object.identity.id, object]));
  for (const object of guest) {
    const conflict = composed.get(object.identity.id);
    if (conflict && JSON.stringify(canonicalValue(conflict)) !== JSON.stringify(canonicalValue(object))) throw new Error("Guest candidate Knowledge identity conflicts with existing Knowledge.");
    if (!conflict) composed.set(object.identity.id, object);
  }
  return deepFreeze([...composed.values()].sort((left, right) => lexical(left.identity.id, right.identity.id)));
}
