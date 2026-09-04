import type { ComputationalAuthorDocument } from "../../author/model/AuthorDocument.ts";
import { composeStudioVersionCommand } from "../api/StudioAuthorDocumentAdapter.ts";
import type { ProjectionFormat, StudioArtifactProjection, StudioProjectionRecord, StudioScope } from "../api/StudioApi.ts";

export const STUDIO_ARTIFACT_EMPTY_MESSAGE = "No Studio artifact has been saved yet.";
export const STUDIO_ARTIFACT_EMPTY_ACTION = "Save the active .author document to create its first Studio artifact version.";
export const STUDIO_PROJECTION_EMPTY_MESSAGE = "Save a Studio artifact version before validating, previewing, or materializing output.";

export function isExpectedUnsavedArtifact(error: unknown, hasValidActiveDocument: boolean): boolean {
  return hasValidActiveDocument
    && typeof error === "object"
    && error !== null
    && "code" in error
    && error.code === "STUDIO_ARTIFACT_NOT_FOUND";
}

export function hasDurableArtifactVersion(artifactId: string | undefined, currentVersionId: string | undefined, versionId: string | undefined): boolean {
  return Boolean(artifactId && currentVersionId && versionId && currentVersionId === versionId);
}

function compareUnicode(left: string, right: string): number {
  const a = Array.from(left, character => character.codePointAt(0)!);
  const b = Array.from(right, character => character.codePointAt(0)!);
  for (let index = 0; index < Math.min(a.length, b.length); index += 1) if (a[index] !== b[index]) return a[index]! - b[index]!;
  return a.length - b.length;
}

function canonicalValue(value: unknown): unknown {
  if (value instanceof Date) {
    if (Number.isNaN(value.getTime())) throw new Error("Invalid canonical timestamp");
    return value.toISOString();
  }
  if (Array.isArray(value)) return value.map(canonicalValue);
  if (value && typeof value === "object") {
    return Object.fromEntries(Object.entries(value).sort(([left], [right]) => compareUnicode(left, right)).map(([key, item]) => [key, canonicalValue(item)]));
  }
  if (value === null || ["string", "number", "boolean"].includes(typeof value)) return value;
  throw new Error(`Unsupported canonical JSON value: ${typeof value}`);
}

export function canonicalStudioJson(value: unknown): string {
  return JSON.stringify(canonicalValue(value));
}

async function sha256(value: string): Promise<string> {
  const bytes = new TextEncoder().encode(value);
  const digest = await crypto.subtle.digest("SHA-256", bytes);
  return `sha256:${Array.from(new Uint8Array(digest), byte => byte.toString(16).padStart(2, "0")).join("")}`;
}

export async function activeStudioContentHash(scope: StudioScope, document: ComputationalAuthorDocument, artifact: StudioArtifactProjection): Promise<string> {
  const command = composeStudioVersionCommand(scope, document);
  const version = artifact.currentVersion;
  const claims = command.claims.map(claim => ({ claimId: claim.claimId, claimText: claim.claimText ?? null, spanIdentity: null, reviewState: claim.reviewState }));
  const content = {
    artifactId: artifact.artifact.artifactId,
    versionNumber: version.versionNumber,
    parentVersionId: version.parentVersionId ?? null,
    authorSchemaVersion: command.authorSchemaVersion,
    document: command.document,
    sourceSnapshotIds: command.sourceSnapshots.map(snapshot => snapshot.snapshotId),
    claims,
    citations: command.citations,
    claimSourceMappings: command.claimSourceMappings,
    comparisonContext: command.comparisonContext,
  };
  return sha256(canonicalStudioJson(content));
}

export function selectCurrentProjection(projections: readonly StudioProjectionRecord[], currentVersionId: string | undefined, format: ProjectionFormat): StudioProjectionRecord | undefined {
  if (!currentVersionId) return undefined;
  return projections.filter(item => item.artifactVersionId === currentVersionId && item.projectionFormat === format).toSorted((left, right) => {
    const time = Date.parse(right.validatedAt) - Date.parse(left.validatedAt);
    if (Number.isFinite(time) && time !== 0) return time;
    return compareUnicode(right.projectionId, left.projectionId);
  })[0];
}

export function canMaterializeProjection(input: {
  durableVersionExists: boolean;
  synchronized: boolean;
  dirty: boolean;
  inFlight: boolean;
  owned: boolean;
  currentVersionId?: string;
  format: ProjectionFormat;
  projection?: StudioProjectionRecord;
}): boolean {
  const projection = input.projection;
  return input.durableVersionExists && input.synchronized && !input.dirty && !input.inFlight && input.owned
    && Boolean(input.currentVersionId && projection
      && projection.artifactVersionId === input.currentVersionId
      && projection.projectionFormat === input.format
      && projection.readinessState === "READY"
      && projection.validationWarnings.length === 0
      && projection.materializationState !== "MATERIALIZED");
}
