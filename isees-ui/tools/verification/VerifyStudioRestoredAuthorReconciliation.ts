import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { AuthorDocumentRuntime } from "../../src/author/runtime/AuthorDocumentRuntime.ts";
import { activeStudioContentHash } from "../../src/studio/components/StudioArtifactInspectorSemantics.ts";
import { composeStudioVersionCommand } from "../../src/studio/api/StudioAuthorDocumentAdapter.ts";

const at = new Date("2026-09-05T12:00:00.000Z");
const scope = { investigationId: "investigation:a", principalId: "principal:a" };
const canonical = { identity: { id: "document:a", createdAt: at }, metadata: { title: "Draft", description: "", author: "Researcher", modifiedAt: at, version: 1 }, type: "DOCUMENT", status: "NEW", nodes: [] };
const sourceBlock = { id: "reference:graph", type: "REFERENCE", targetType: "DOCUMENT", targetId: "graph:1", title: "Graph", source: "Research", corpusId: "graph:1", insertedAt: at, researchSource: { anchorId: "anchor:1", sourceIdentity: "graph:1", sourceInvestigationId: scope.investigationId, sourceWorkspace: "MANIFOLD", sourceKind: "GRAPH", classification: "CANONICAL", sourceRevisionId: "1", capturedRepresentation: { schemaVersion: "graph/v1", mediaType: "application/json", value: { b: 2, a: 1 } }, insertability: { state: "INSERTABLE", reason: "Canonical" } } };
const local = { ...canonical, metadata: { ...canonical.metadata }, nodes: [sourceBlock] };
const artifact = { artifact: { artifactId: canonical.identity.id, investigationId: scope.investigationId, ownerPrincipalId: scope.principalId, revision: 1, lifecycleState: "DRAFT", currentVersionNumber: 1, currentVersionId: "version:1", createdAt: at.toISOString(), updatedAt: at.toISOString() }, currentVersion: { versionId: "version:1", versionNumber: 1, parentVersionId: null, authorSchemaVersion: "computational-author-document/v1", document: canonical, sourceSnapshotIds: [], claims: [], citations: [], claimSourceMappings: [], contentHash: "", createdAt: at.toISOString(), comparisonContext: null }, sourceSnapshots: [], candidateArtifacts: [], projections: [] };
artifact.currentVersion.contentHash = await activeStudioContentHash(scope, canonical as never, artifact as never);

const runtime = new AuthorDocumentRuntime();
runtime.activateInvestigation(scope.investigationId);
runtime.restoreActiveDocument(local as never);
assert.equal(runtime.isDirty(), true, "browser restoration is unresolved and fail-safe dirty");
assert.equal(runtime.getActiveDocument()?.nodes[0]?.id, sourceBlock.id, "restored source block remains intact");
const comparedRevision = runtime.getRevision();
assert.notEqual(await activeStudioContentHash(scope, local as never, artifact as never), artifact.currentVersion.contentHash, "source-backed block absent canonically changes the canonical hash");
assert.equal(runtime.reconcileCanonicalState({ investigationId: scope.investigationId, document: local as never, revision: comparedRevision, synchronized: false }), true);
assert.equal(runtime.isDirty(), true, "different restored content remains dirty");

const equalRuntime = new AuthorDocumentRuntime();
equalRuntime.activateInvestigation(scope.investigationId);
equalRuntime.restoreActiveDocument(canonical as never);
const equalRevision = equalRuntime.getRevision();
equalRuntime.reconcileCanonicalState({ investigationId: scope.investigationId, document: canonical as never, revision: equalRevision, synchronized: true });
assert.equal(equalRuntime.isDirty(), false, "proven equal restored content becomes clean");

runtime.updateDocumentTitle("Edited during comparison");
assert.equal(runtime.reconcileCanonicalState({ investigationId: scope.investigationId, document: local as never, revision: comparedRevision, synchronized: true }), false, "stale comparison cannot mutate a newer revision");
assert.equal(runtime.isDirty(), true, "edit during comparison remains dirty");
runtime.activateInvestigation("investigation:b");
runtime.activateInvestigation(scope.investigationId);
assert.equal(runtime.isDirty(), true, "Investigation switching preserves draft dirtiness");
assert.equal(runtime.getActiveDocument()?.nodes[0]?.id, sourceBlock.id, "Investigation switching preserves restored content");

const command = composeStudioVersionCommand(scope, local as never);
assert.equal(command.sourceSnapshots.length, 1, "derived source snapshot participates in save/hash content");
assert.equal(command.sourceSnapshots[0]?.snapshotId, "studio-source:anchor:1");
const inspector = readFileSync("src/studio/components/StudioArtifactInspector.tsx", "utf8");
const toolbar = readFileSync("src/author/components/StudioToolbar.tsx", "utf8");
const status = readFileSync("src/author/components/StudioStatusBar.tsx", "utf8");
assert.match(toolbar, /dirty[\s\S]*\? "Unsaved Changes"/, "header projects runtime dirtiness as Unsaved Changes");
assert.doesNotMatch(toolbar, /runtime\.markClean\(\)/, "local .author download cannot claim canonical cleanliness");
assert.match(status, /dirty[\s\S]*\? "Dirty"[\s\S]*: "Clean"/, "footer projects runtime dirtiness as Dirty");
assert.match(inspector, /dirty \? "Dirty · unsaved changes"/, "Inspector projects the runtime dirty owner");
assert.match(inspector, /activeArtifact && !dirty \? "The canonical draft has no unsaved changes/, "Save Draft remains enabled for a reconciled difference");
assert.match(inspector, /contentConsistent === undefined \? "Unavailable" : contentConsistent \? "Current" : "Draft changed"/, "projection consistency reports a reconciled difference as Draft changed");
assert.match(inspector, /publishCanonicalGraphSource\(anchor, scope\.principalId\)/, "v2 save retains I2I canonical Research publication");
console.log("PASS VerifyStudioRestoredAuthorReconciliation — fail-safe restore, canonical equality/difference, source lineage, stale revision, edit race, and Investigation switching verified");
