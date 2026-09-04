import { RESEARCH_ANCHOR_SCHEMA_VERSION, ResearchAnchorKind, type FrozenCapturedRepresentation, type ResearchAnchor, type ResearchDisplayProjection, type ResearchInsertability, type ResearchSourceClassification, type ResearchSourceWorkspace } from "./researchBridgeTypes.ts";

export function researchAnchorId(investigationId: string, kind: ResearchAnchorKind, ...identity: readonly string[]): string {
  const parts = [investigationId, kind, ...identity];
  if (parts.some(part => !part.trim())) throw new Error("Research anchor identity requires non-empty exact identities.");
  return ["research-v2", ...parts.map(encodeURIComponent)].join(":");
}

export interface TypedResearchSourceInput {
  readonly investigationId: string; readonly kind: Exclude<ResearchAnchorKind, "GRAPH" | "COMPARE_CANDIDATE" | "LAYERS_EXPERIMENT">;
  readonly sourceWorkspace: ResearchSourceWorkspace; readonly sourceIdentity: string;
  readonly collectedAt?: Date; readonly classification: ResearchSourceClassification;
  readonly sourceRevisionId?: string; readonly sourceExecutionId?: string; readonly sourceProjectionId?: string;
  readonly display: ResearchDisplayProjection; readonly insertability: ResearchInsertability;
  readonly capturedRepresentation: FrozenCapturedRepresentation; readonly pinned?: boolean;
}

function requireQualified(input: TypedResearchSourceInput): void {
  if (!input.investigationId.trim() || !input.sourceIdentity.trim()) throw new Error("Research source requires exact source and Investigation identity.");
  if (!input.capturedRepresentation.schemaVersion.trim() || !input.capturedRepresentation.mediaType.trim()) throw new Error("Research source requires a qualified captured representation.");
  const projectionKinds: readonly ResearchAnchorKind[] = [ResearchAnchorKind.NARRATIVE_PASSAGE, ResearchAnchorKind.TIMELINE_MOMENT, ResearchAnchorKind.TIMELINE_CORRESPONDENCE, ResearchAnchorKind.INTENTION_DERIVATION, ResearchAnchorKind.INTENTION_HYPOTHESIS];
  if (projectionKinds.includes(input.kind) && !input.sourceProjectionId?.trim()) throw new Error(`${input.kind} requires exact projection identity.`);
}

function requireRuntimeTimestamp(value: unknown, label: string): Date {
  if (value instanceof Date) {
    if (Number.isNaN(value.getTime())) throw new Error(`Malformed Research ${label} timestamp.`);
    return value;
  }
  if (typeof value !== "string") throw new Error(`Malformed Research ${label} timestamp.`);
  const timestamp = new Date(value);
  if (Number.isNaN(timestamp.getTime()) || timestamp.toISOString() !== value) {
    throw new Error(`Malformed Research ${label} timestamp.`);
  }
  return timestamp;
}

export function createTypedResearchAnchor(input: TypedResearchSourceInput): ResearchAnchor {
  requireQualified(input);
  const collectedAt = requireRuntimeTimestamp(input.collectedAt ?? new Date(), "capture");
  const common = { schemaVersion: RESEARCH_ANCHOR_SCHEMA_VERSION, kind: input.kind, anchorId: researchAnchorId(input.investigationId, input.kind, input.sourceIdentity), investigationId: input.investigationId, sourceWorkspace: input.sourceWorkspace, sourceIdentity: input.sourceIdentity, collectedAt, createdAt: collectedAt, classification: input.classification, sourceRevisionId: input.sourceRevisionId, sourceExecutionId: input.sourceExecutionId, sourceProjectionId: input.sourceProjectionId, display: Object.freeze({ ...input.display }), insertability: Object.freeze({ ...input.insertability }), capturedRepresentation: Object.freeze({ ...input.capturedRepresentation }), pinned: input.pinned ?? false };
  const payload = Object.freeze({ identity: input.sourceIdentity, representation: input.capturedRepresentation.value });
  switch (input.kind) {
    case "EVIDENCE_RECORD": return Object.freeze({ ...common, kind: input.kind, evidence: payload });
    case "MEDIA": return Object.freeze({ ...common, kind: input.kind, media: payload });
    case "NARRATIVE_PASSAGE": return Object.freeze({ ...common, kind: input.kind, passage: payload });
    case "TIMELINE_MOMENT": return Object.freeze({ ...common, kind: input.kind, moment: payload });
    case "TIMELINE_CORRESPONDENCE": return Object.freeze({ ...common, kind: input.kind, correspondence: payload });
    case "INTENTION_DERIVATION": return Object.freeze({ ...common, kind: input.kind, derivation: payload });
    case "INTENTION_HYPOTHESIS": return Object.freeze({ ...common, kind: input.kind, hypothesis: payload });
  }
}

/** Deterministic migration for the three v1 snapshot shapes. */
export function migrateResearchAnchor(value: ResearchAnchor | Record<string, unknown>): ResearchAnchor {
  if (value.schemaVersion === RESEARCH_ANCHOR_SCHEMA_VERSION && typeof value.kind === "string") {
    const candidate = value as Partial<ResearchAnchor>;
    const kinds = Object.values(ResearchAnchorKind) as readonly string[];
    if (!kinds.includes(value.kind) || !candidate.anchorId || !candidate.investigationId || !candidate.sourceIdentity || !candidate.sourceWorkspace || !candidate.display || !candidate.insertability || !candidate.capturedRepresentation || !candidate.createdAt) throw new Error("Malformed Research anchor v2.");
    const payloadKey: Record<string, string> = { GRAPH: "graph", COMPARE_CANDIDATE: "candidate", LAYERS_EXPERIMENT: "experiment", EVIDENCE_RECORD: "evidence", MEDIA: "media", NARRATIVE_PASSAGE: "passage", TIMELINE_MOMENT: "moment", TIMELINE_CORRESPONDENCE: "correspondence", INTENTION_DERIVATION: "derivation", INTENTION_HYPOTHESIS: "hypothesis" };
    const raw = value as Record<string, unknown>;
    if (!raw[payloadKey[value.kind]!] || (candidate.insertability.state !== "INSERTABLE" && candidate.insertability.state !== "INSPECTION_ONLY") || (candidate.classification !== "CANONICAL" && candidate.classification !== "RESEARCHER_GENERATED" && candidate.classification !== "UNDETERMINED")) throw new Error("Malformed Research anchor discriminated variant.");
    const collectedAt = requireRuntimeTimestamp(candidate.collectedAt, "capture");
    const createdAt = requireRuntimeTimestamp(candidate.createdAt, "creation");
    return { ...candidate, collectedAt, createdAt } as ResearchAnchor;
  }
  const legacy = value as Record<string, unknown> & { anchorId: string; investigationId: string; createdAt: Date | string; pinned: boolean };
  const collectedAt = requireRuntimeTimestamp(legacy.createdAt, "creation");
  if (!legacy.investigationId || !legacy.anchorId) throw new Error("Malformed legacy Research anchor.");
  if (legacy.graph && typeof legacy.graph === "object") {
    const graph = legacy.graph as { type: "NODE" | "EDGE"; id: string }; const revision = legacy.graphRevision as number;
    return { ...legacy, schemaVersion: RESEARCH_ANCHOR_SCHEMA_VERSION, kind: "GRAPH", sourceWorkspace: "MANIFOLD", sourceIdentity: `${graph.type}:${graph.id}`, collectedAt, createdAt: collectedAt, classification: "CANONICAL", sourceRevisionId: String(revision), display: { title: graph.id, summary: `${graph.type} at graph revision ${revision}` }, insertability: { state: "INSERTABLE", reason: "Exact graph identity and revision are available." }, capturedRepresentation: { schemaVersion: "research-graph/v1", mediaType: "application/json", value: { graph, graphRevision: revision } } } as ResearchAnchor;
  }
  if (legacy.candidate && typeof legacy.candidate === "object") {
    const candidate = legacy.candidate as { candidateId: string; evaluationId: string; resolveExecutionId?: string; focusedEventId: string; comparisonEventId: string };
    return { ...legacy, schemaVersion: RESEARCH_ANCHOR_SCHEMA_VERSION, kind: "COMPARE_CANDIDATE", sourceWorkspace: "COMPARE", sourceIdentity: `CANDIDATE:${candidate.candidateId}:${candidate.evaluationId}`, collectedAt, createdAt: collectedAt, classification: "RESEARCHER_GENERATED", sourceExecutionId: candidate.resolveExecutionId, display: { title: `${candidate.focusedEventId} ↔ ${candidate.comparisonEventId}`, summary: "Candidate pairwise correspondence; not accepted." }, insertability: { state: "INSPECTION_ONLY", reason: "COMPARE candidates are not accepted relationships." }, capturedRepresentation: { schemaVersion: "compare-candidate/v1", mediaType: "application/json", value: legacy.candidate } } as ResearchAnchor;
  }
  if (legacy.experiment && typeof legacy.experiment === "object") {
    const experiment = legacy.experiment as { projection: { projectionId: string; executionId: string } };
    return { ...legacy, schemaVersion: RESEARCH_ANCHOR_SCHEMA_VERSION, kind: "LAYERS_EXPERIMENT", sourceWorkspace: "LAYERS", sourceIdentity: `EXPERIMENT:${experiment.projection.projectionId}`, collectedAt, createdAt: collectedAt, classification: "RESEARCHER_GENERATED", sourceExecutionId: experiment.projection.executionId, sourceProjectionId: experiment.projection.projectionId, display: { title: `LAYERS experiment ${experiment.projection.projectionId}`, summary: "Researcher-generated experimental projection." }, insertability: { state: "INSERTABLE", reason: "Exact experiment execution and projection are available." }, capturedRepresentation: { schemaVersion: "layers-experiment/v1", mediaType: "application/json", value: legacy.experiment } } as ResearchAnchor;
  }
  throw new Error("Unknown Research anchor variant.");
}
