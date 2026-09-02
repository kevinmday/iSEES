import type { Artifact } from "../../artifacts/artifactTypes";
import type { Investigation } from "../../investigation/investigationTypes";
import type { EvidenceInspectionSelection, EvidenceKnownValue, EvidenceOptionalValue, EvidenceWorkspaceFilters, EvidenceWorkspaceProjection, EvidenceWorkspaceRecord, EvidenceWorkspaceView } from "./EvidenceWorkspaceProjectionTypes";

const PAYLOAD_UNAVAILABLE_REASON = "No canonical evidence payload resolver is available.";
export const CANONICAL_EVIDENCE_ARTIFACT_TYPES = Object.freeze([
  "SOURCE", "OCR", "TRANSLATION", "EXTRACTION", "SUMMARY", "ANNOTATION",
  "OBSERVATION", "FACILITY", "CONTACT", "POINTEL", "HYPOTHESIS", "NARRATIVE",
] as const);

function known<T>(value: T): EvidenceKnownValue<T> {
  return Object.freeze({ status: "KNOWN", value });
}

function optionalText(value: string | undefined): EvidenceOptionalValue<string> {
  return value === undefined || value.length === 0 ? Object.freeze({ status: "UNKNOWN" }) : known(value);
}

function optionalNumber(value: number | undefined): EvidenceOptionalValue<number> {
  return value === undefined ? Object.freeze({ status: "UNKNOWN" }) : known(value);
}

function optionalList(values: readonly string[] | undefined): EvidenceOptionalValue<readonly string[]> {
  return values === undefined || values.length === 0
    ? Object.freeze({ status: "UNKNOWN" })
    : known(Object.freeze([...values]));
}

export function createProjectedEvidenceId(investigationId: string, sourceArtifactId: string): string {
  return `evidence:${encodeURIComponent(investigationId)}:${encodeURIComponent(sourceArtifactId)}`;
}

function projectArtifact(investigationId: string, artifact: Artifact): EvidenceWorkspaceRecord {
  return Object.freeze({
    evidenceId: createProjectedEvidenceId(investigationId, artifact.id),
    investigationId,
    sourceArtifactId: artifact.id,
    title: artifact.title,
    artifactType: artifact.artifact_type,
    provenance: Object.freeze({ repository: artifact.repository, createdAt: artifact.created_at }),
    description: optionalText(artifact.description),
    confidence: optionalNumber(artifact.confidence),
    doi: optionalText(artifact.doi),
    url: optionalText(artifact.url),
    tags: optionalList(artifact.tags),
    sourceDerivationIdentifiers: optionalList(artifact.derived_from),
    payload: Object.freeze({ status: "UNAVAILABLE", reason: PAYLOAD_UNAVAILABLE_REASON }),
  });
}

export function projectInvestigationEvidence(investigation: Investigation): EvidenceWorkspaceProjection {
  const sourceArtifactIds = new Set<string>();

  for (const artifact of investigation.workspace.artifacts) {
    if (sourceArtifactIds.has(artifact.id)) {
      throw new Error(`Duplicate source Artifact identity in Investigation ${investigation.id}: ${artifact.id}`);
    }
    sourceArtifactIds.add(artifact.id);
  }

  const records = investigation.workspace.artifacts
    .map((artifact) => projectArtifact(investigation.id, artifact))
    .sort((left, right) => {
      const identityOrder = left.evidenceId < right.evidenceId ? -1 : left.evidenceId > right.evidenceId ? 1 : 0;
      return identityOrder || (left.title < right.title ? -1 : left.title > right.title ? 1 : 0);
    });

  return Object.freeze({
    kind: "EVIDENCE_WORKSPACE_PROJECTION",
    investigation: Object.freeze({ id: investigation.id, name: investigation.name }),
    records: Object.freeze(records),
  });
}

export function resolveEvidenceInspection(
  projection: EvidenceWorkspaceProjection | undefined,
  selection: EvidenceInspectionSelection | undefined,
): EvidenceWorkspaceRecord | undefined {
  if (projection === undefined || selection === undefined || selection.investigationId !== projection.investigation.id) {
    return undefined;
  }

  return projection.records.find((record) => record.evidenceId === selection.evidenceId);
}

export function createEvidenceWorkspaceView(
  projection: EvidenceWorkspaceProjection,
  filters: EvidenceWorkspaceFilters,
): EvidenceWorkspaceView {
  const typeCounts = new Map<EvidenceWorkspaceRecord["artifactType"], number>();
  let unavailableCount = 0;

  for (const record of projection.records) {
    typeCounts.set(record.artifactType, (typeCounts.get(record.artifactType) ?? 0) + 1);
    if (record.payload.status === "UNAVAILABLE") unavailableCount += 1;
  }

  const records = projection.records.filter((record) =>
    (filters.artifactType === undefined || record.artifactType === filters.artifactType) &&
    (filters.availability === undefined || record.payload.status === filters.availability)
  );

  return Object.freeze({
    totalCount: projection.records.length,
    visibleCount: records.length,
    navigator: Object.freeze(CANONICAL_EVIDENCE_ARTIFACT_TYPES
      .map((artifactType) => Object.freeze({ artifactType, count: typeCounts.get(artifactType) ?? 0 }))),
    availabilityCounts: Object.freeze({ UNAVAILABLE: unavailableCount }),
    records: Object.freeze(records),
  });
}
