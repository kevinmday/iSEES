import type { ResearchAnchor } from "../../research/researchBridgeTypes";
import { STUDIO_DRAFTING_CONTEXT_VERSION, STUDIO_DRAFTING_LIMITS, StudioDraftingValidationError, type AssembleStudioDraftingContextInput, type AssembledStudioDraftingContext, type DraftingContextSource, type DraftingExcludedSource, type DraftingResearcherNote } from "./StudioDraftingTypes.ts";

const bytes = (value: string) => new TextEncoder().encode(value).byteLength;
const utcIso = (value: Date) => value.toISOString().replace(".000Z", "Z");
const fail = (code: string, message: string): never => { throw new StudioDraftingValidationError(code, message); };
const ordinal = (left: string, right: string): number => {
  const a = Array.from(left, value => value.codePointAt(0)!); const b = Array.from(right, value => value.codePointAt(0)!);
  for (let index = 0; index < Math.min(a.length, b.length); index += 1) if (a[index] !== b[index]) return a[index]! - b[index]!;
  return a.length - b.length;
};

function normalize(value: unknown): unknown {
  if (value instanceof Date) {
    if (Number.isNaN(value.valueOf())) fail("INVALID_DATE", "Drafting timestamps must be valid dates.");
    return utcIso(value);
  }
  if (Array.isArray(value)) return value.map(item => normalize(item));
  if (value && typeof value === "object") return Object.keys(value as object).sort(ordinal).reduce<Record<string, unknown>>((result, key) => {
    const item = (value as Record<string, unknown>)[key]; result[key] = item === undefined ? null : normalize(item); return result;
  }, {});
  if (typeof value === "number" && !Number.isFinite(value)) fail("NON_CANONICAL_NUMBER", "Drafting context cannot contain non-finite numbers.");
  if (value === undefined) return null;
  return value;
}

export function canonicalSerializeDraftingContext(value: unknown): string { return JSON.stringify(normalize(value)); }
export async function sha256Canonical(value: unknown): Promise<string> {
  const digest = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(canonicalSerializeDraftingContext(value)));
  return `sha256:${Array.from(new Uint8Array(digest), byte => byte.toString(16).padStart(2, "0")).join("")}`;
}

async function sourceRecord(anchor: ResearchAnchor): Promise<DraftingContextSource> {
  const graph = anchor.kind === "GRAPH" ? anchor.graph : undefined;
  const unhashed = { anchorId: anchor.anchorId, investigationId: anchor.investigationId, sourceWorkspace: anchor.sourceWorkspace, sourceIdentity: anchor.sourceIdentity, sourceKind: anchor.kind, classification: anchor.classification as "CANONICAL" | "RESEARCHER_GENERATED", insertionState: "INSERTABLE" as const, insertionReason: anchor.insertability.reason, displayTitle: anchor.display.title, displaySummary: anchor.display.summary, sourceRevisionId: anchor.sourceRevisionId ?? null, sourceExecutionId: anchor.sourceExecutionId ?? null, sourceProjectionId: anchor.sourceProjectionId ?? null, graphIdentity: graph ? `${graph.type}:${graph.id}` : null, graphRevision: anchor.kind === "GRAPH" ? anchor.graphRevision : null, captureSchemaVersion: anchor.capturedRepresentation.schemaVersion, captureMediaType: anchor.capturedRepresentation.mediaType, capturedRepresentation: anchor.capturedRepresentation.value, collectedAt: utcIso(anchor.collectedAt), createdAt: utcIso(anchor.createdAt) };
  const result = { ...unhashed, immutableSourceHash: await sha256Canonical(unhashed) };
  if (bytes(canonicalSerializeDraftingContext(result)) > STUDIO_DRAFTING_LIMITS.maxSourceBytes) fail("SOURCE_TOO_LARGE", `Source ${anchor.anchorId} exceeds the drafting byte limit.`);
  return result;
}

function noteText(node: Record<string, unknown>): string | undefined {
  if (typeof node.text === "string") return node.text;
  if (typeof node.citation === "string") return node.citation;
  return undefined;
}

export async function assembleStudioDraftingContext(input: AssembleStudioDraftingContextInput): Promise<AssembledStudioDraftingContext> {
  if (!input.investigationId || input.researchProjection.investigationId !== input.investigationId) fail("INVESTIGATION_MISMATCH", "Research projection must match the active Investigation.");
  const mode = input.sourceSelectionMode ?? "SUBSET";
  if (input.draftingInstruction.length < 1 || input.draftingInstruction.length > STUDIO_DRAFTING_LIMITS.maxInstructionChars) fail("INVALID_INSTRUCTION", "Drafting instruction is outside the allowed length.");
  const requested = input.selectedSourceAnchorIds;
  if (new Set(requested).size !== requested.length) fail("DUPLICATE_SOURCE", "Selected source identities must be unique.");
  if (mode === "ALL" && requested.length) fail("INVALID_ALL_SELECTION", "ALL requires an empty explicit source list.");
  const entries = input.researchProjection.entries;
  const cross = entries.filter(entry => entry.anchor.investigationId !== input.investigationId);
  if (cross.length) fail("CROSS_INVESTIGATION_SOURCE", "Research projection contains a cross-Investigation source.");
  const byId = new Map(entries.map(entry => [entry.anchor.anchorId, entry.anchor]));
  if (mode === "SUBSET") for (const id of requested) if (!byId.has(id)) fail("UNKNOWN_SOURCE", `Selected source ${id} is not in the active Investigation projection.`);
  const candidates = mode === "ALL" ? entries.map(entry => entry.anchor) : requested.map(id => byId.get(id)!);
  if (new Set(candidates.map(anchor => anchor.sourceIdentity)).size !== candidates.length) fail("DUPLICATE_SOURCE_IDENTITY", "Stable source identities must be unique.");
  const excluded: DraftingExcludedSource[] = [];
  const eligible: ResearchAnchor[] = [];
  for (const anchor of candidates) {
    if (anchor.insertability.state === "INSPECTION_ONLY") excluded.push({ anchorId: anchor.anchorId, reason: "INSPECTION_ONLY" });
    else if (anchor.classification === "UNDETERMINED") excluded.push({ anchorId: anchor.anchorId, reason: "UNDETERMINED" });
    else eligible.push(anchor);
  }
  if (mode === "SUBSET" && excluded.length) fail("INELIGIBLE_SOURCE", `Selected source ${excluded[0]!.anchorId} is not eligible for drafting.`);
  if (eligible.length > STUDIO_DRAFTING_LIMITS.maxSources) fail("TOO_MANY_SOURCES", "Drafting source count exceeds the limit.");
  const noteSelection = input.selectedResearcherNoteNodeIds;
  if (new Set(noteSelection).size !== noteSelection.length) fail("DUPLICATE_NOTE", "Selected researcher-note identities must be unique.");
  const selectedNotes = new Set(noteSelection); const notes: DraftingResearcherNote[] = [];
  input.document.nodes.forEach((raw, documentOrder) => {
    const node = raw as unknown as Record<string, unknown>; if (!selectedNotes.has(String(node.id))) return;
    if (node.type === "REFERENCE") fail("REFERENCE_NOTE", "REFERENCE nodes cannot be selected as researcher notes.");
    const candidateText = noteText(node); if (candidateText === undefined) fail("NON_TEXT_NOTE", `Selected node ${String(node.id)} is not textual.`);
    const text = candidateText as string;
    if (bytes(text) > STUDIO_DRAFTING_LIMITS.maxNoteBytes) fail("NOTE_TOO_LARGE", `Researcher note ${String(node.id)} exceeds the byte limit.`);
    notes.push({ nodeId: String(node.id), nodeType: String(node.type), section: typeof node.section === "string" ? node.section : null, text, documentOrder });
  });
  if (notes.length !== noteSelection.length) fail("UNKNOWN_NOTE", "Every selected researcher note must exist and be eligible in the active document.");
  if (notes.length > STUDIO_DRAFTING_LIMITS.maxNotes) fail("TOO_MANY_NOTES", "Researcher-note count exceeds the limit.");
  const sources = await Promise.all(eligible.sort((a, b) => ordinal(a.anchorId, b.anchorId)).map(sourceRecord));
  if (!sources.length && !notes.length) fail("EMPTY_CONTEXT", "At least one eligible source or researcher note is required.");
  const context = { contextContractVersion: STUDIO_DRAFTING_CONTEXT_VERSION, investigationId: input.investigationId, documentId: input.document.identity.id, baseIdentity: { documentRuntimeRevision: input.documentRuntimeRevision, artifactId: input.durableBase?.artifactId ?? null, artifactVersionId: input.durableBase?.artifactVersionId ?? null, artifactRevision: input.durableBase?.artifactRevision ?? null }, sourceSelectionMode: mode, selectedSourceAnchorIds: mode === "SUBSET" ? [...requested].sort(ordinal) : [], selectedResearcherNoteNodeIds: notes.map(note => note.nodeId), artifactDesign: input.artifactDesign, draftingInstruction: input.draftingInstruction, sources, researcherNotes: notes, excludedSources: excluded.sort((a, b) => ordinal(a.anchorId, b.anchorId)) };
  const canonicalContext = canonicalSerializeDraftingContext(context);
  if (bytes(canonicalContext) > STUDIO_DRAFTING_LIMITS.maxContextBytes) fail("CONTEXT_TOO_LARGE", "Drafting context exceeds the byte limit.");
  return { context, canonicalContext, contextHash: await sha256Canonical(context) };
}
