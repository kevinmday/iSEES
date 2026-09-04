import assert from "node:assert/strict";
import { AuthorDocumentStatuses, AuthorDocumentTypes } from "../../src/author/model/AuthorDocumentTypes.ts";
import { AuthorNodeTypes } from "../../src/author/model/AuthorNodeTypes.ts";
import { activeStudioContentHash, canMaterializeProjection, canonicalStudioJson, selectCurrentProjection } from "../../src/studio/components/StudioArtifactInspectorSemantics.ts";

const at = new Date("2026-09-04T12:00:00.000Z");
const document = { identity: { id: "author:a", createdAt: at }, metadata: { title: "A", description: "", author: "principal:a", modifiedAt: at, version: 1 }, type: AuthorDocumentTypes.DOCUMENT, status: AuthorDocumentStatuses.MODIFIED, nodes: [
  { id: "observation:1", type: AuthorNodeTypes.OBSERVATION, text: "Claim", source: "AUTHOR", relatedReferences: [], createdAt: at },
] } as const;
const scope = { investigationId: "investigation:a", principalId: "principal:a" };
const projection = (overrides = {}) => ({ projectionId: "projection:a", artifactVersionId: "author:a:v1", projectionFormat: "PDF" as const, readinessState: "READY" as const, validationWarnings: [], materializationState: "NOT_MATERIALIZED" as const, validatorVersion: "validator/v1", validatedAt: "2026-09-04T12:00:00.000000Z", ...overrides });
const artifact = (contentHash: string) => ({
  artifact: { artifactId: "author:a", investigationId: scope.investigationId, ownerPrincipalId: scope.principalId, revision: 1, lifecycleState: "DRAFT" as const, currentVersionNumber: 1, currentVersionId: "author:a:v1", createdAt: at.toISOString(), updatedAt: at.toISOString() },
  currentVersion: { versionId: "author:a:v1", versionNumber: 1, parentVersionId: null, authorSchemaVersion: "computational-author-document/v1", document: JSON.parse(JSON.stringify(document)), sourceSnapshotIds: [], claims: [{ claimId: "observation:1", claimText: "Claim", lineageState: "UNRESOLVED" as const }], citations: [], claimSourceMappings: [], contentHash, createdAt: at.toISOString(), comparisonContext: null },
  sourceSnapshots: [], candidateArtifacts: [], projections: [],
});

assert.equal(canonicalStudioJson({ z: 1, a: { y: 2, x: at } }), canonicalStudioJson({ a: { x: at.toISOString(), y: 2 }, z: 1 }), "property order and Date/string timestamp representation are canonical");
const initial = artifact("");
const savedHash = await activeStudioContentHash(scope, document as never, initial);
assert.equal(savedHash, "sha256:b1f9239b8589f3bcf47335229ccf773cec813035b9a02741a1b1430ef406dd3a", "frontend content hash matches the backend canonical hash fixture");
initial.currentVersion.contentHash = savedHash;
assert.equal(await activeStudioContentHash(scope, document as never, initial), initial.currentVersion.contentHash, "unchanged active document is synchronized");
assert.notEqual(await activeStudioContentHash(scope, { ...document, metadata: { ...document.metadata, title: "Changed" } } as never, initial), savedHash, "hashed metadata mutation is changed");
assert.notEqual(await activeStudioContentHash(scope, { ...document, nodes: [{ ...document.nodes[0], text: "Changed claim" }] } as never, initial), savedHash, "document and derived lineage mutation is changed");
assert.notEqual(canonicalStudioJson({ claimSourceMappings: [] }), canonicalStudioJson({ claimSourceMappings: [{ mappingId: "mapping:1" }] }), "lineage collections remain part of canonical content");

const records = [
  projection({ projectionId: "old-version", artifactVersionId: "author:a:v0", validatedAt: "2027-01-01T00:00:00Z" }),
  projection({ projectionId: "pdf:old", validatedAt: "2026-09-04T12:00:00Z", readinessState: "NOT_READY" }),
  projection({ projectionId: "docx:new", projectionFormat: "DOCX", validatedAt: "2026-09-05T12:00:00Z" }),
  projection({ projectionId: "pdf:z", validatedAt: "2026-09-05T12:00:00Z" }),
  projection({ projectionId: "pdf:a", validatedAt: "2026-09-05T12:00:00Z" }),
];
assert.equal(selectCurrentProjection(records, "author:a:v1", "PDF")?.projectionId, "pdf:z", "latest current-version PDF uses deterministic identity tie-break");
assert.equal(selectCurrentProjection(records, "author:a:v1", "DOCX")?.projectionId, "docx:new", "formats do not leak");
assert.equal(selectCurrentProjection(records, "author:a:v1", "HTML"), undefined, "missing format remains absent");
const eligible = { durableVersionExists: true, synchronized: true, dirty: false, inFlight: false, owned: true, currentVersionId: "author:a:v1", format: "PDF" as const, projection: projection() };
assert.equal(canMaterializeProjection(eligible), true, "READY synchronized current PDF enables materialization");
assert.equal(canMaterializeProjection({ ...eligible, dirty: true }), false, "dirty runtime fails closed");
assert.equal(canMaterializeProjection({ ...eligible, durableVersionExists: false }), false, "missing durable identity fails closed");
assert.equal(canMaterializeProjection({ ...eligible, projection: projection({ artifactVersionId: "author:a:v0" }) }), false, "older version fails closed");
assert.equal(canMaterializeProjection({ ...eligible, projection: projection({ readinessState: "NOT_READY" }) }), false, "non-ready projection fails closed");
assert.equal(canMaterializeProjection({ ...eligible, projection: projection({ validationWarnings: ["blocking"] }) }), false, "blocking validation warning fails closed");
assert.equal(canMaterializeProjection({ ...eligible, inFlight: true }), false, "in-flight operation fails closed");
assert.equal(canMaterializeProjection({ ...eligible, owned: false }), false, "ownership mismatch fails closed");

console.log("PASS VerifyStudioProjectionConsistency — canonical synchronization, mutations, timestamps, property order, lineage, deterministic per-format projection selection, and fail-closed materialization gates verified");
