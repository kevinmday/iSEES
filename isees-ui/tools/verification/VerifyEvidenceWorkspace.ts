import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import type { Artifact } from "../../src/artifacts/artifactTypes";
import type { Investigation } from "../../src/investigation/investigationTypes";
import { CANONICAL_EVIDENCE_ARTIFACT_TYPES, createEvidenceWorkspaceView, createProjectedEvidenceId, projectInvestigationEvidence, resolveEvidenceInspection } from "../../src/evidence/projection/EvidenceWorkspaceProjection.ts";

function artifact(id: string, overrides: Partial<Artifact> = {}): Artifact {
  return {
    id,
    title: `Artifact ${id}`,
    artifact_type: "SOURCE",
    repository: "WORKSPACE",
    derived_from: [],
    created_at: "2026-09-02T00:00:00.000Z",
    ...overrides,
  };
}

function investigation(id: string, artifacts: Artifact[]): Investigation {
  return {
    id,
    name: `Investigation ${id}`,
    description: "Verifier fixture",
    createdAt: "2026-09-02T00:00:00.000Z",
    updatedAt: "2026-09-02T00:00:00.000Z",
    createdBy: "verifier",
    status: "ACTIVE",
    workspace: {
      id: `workspace-${id}`,
      name: `Workspace ${id}`,
      description: "Verifier fixture",
      imported_events: [],
      focused_event_id: null,
      investigations: [],
      artifacts,
      active_layers: [],
      created_at: "2026-09-02T00:00:00.000Z",
    },
    revisions: [],
  };
}

const firstArtifact = artifact("b/id", { description: "Known description", confidence: 0, tags: ["source"], derived_from: ["parent-1"] });
const secondArtifact = artifact("a:id");
const activeInvestigation = investigation("case/active", [firstArtifact, secondArtifact]);
const sourceBefore = JSON.stringify(activeInvestigation);
const firstProjection = projectInvestigationEvidence(activeInvestigation);
const secondProjection = projectInvestigationEvidence(investigation("case/active", [secondArtifact, firstArtifact]));

assert.deepEqual(firstProjection, secondProjection, "projection changed with source ordering");
assert.equal(JSON.stringify(activeInvestigation), sourceBefore, "projection mutated canonical Investigation data");
assert.deepEqual(firstProjection.records.map((record) => record.sourceArtifactId), ["a:id", "b/id"]);
assert.equal(firstProjection.records[1]?.evidenceId, createProjectedEvidenceId("case/active", "b/id"));
assert.equal(firstProjection.records[1]?.investigationId, "case/active");
assert.equal(firstProjection.records[1]?.sourceArtifactId, "b/id");
assert.equal(firstProjection.records[1]?.confidence.status, "KNOWN");
assert.equal(firstProjection.records[1]?.confidence.status === "KNOWN" && firstProjection.records[1].confidence.value, 0, "known zero confidence became unknown");
assert.equal(firstProjection.records[0]?.description.status, "UNKNOWN");
assert.equal(firstProjection.records[0]?.confidence.status, "UNKNOWN");
assert.equal(firstProjection.records[0]?.tags.status, "UNKNOWN");
assert.equal(firstProjection.records[0]?.sourceDerivationIdentifiers.status, "UNKNOWN");
assert.equal(firstProjection.records[0]?.payload.status, "UNAVAILABLE");
assert.match(firstProjection.records[0]?.payload.reason ?? "", /canonical evidence payload resolver/i);
assert.equal(projectInvestigationEvidence(investigation("empty", [])).records.length, 0);
assert.throws(
  () => projectInvestigationEvidence(investigation("duplicate", [artifact("same"), artifact("same")])),
  /Duplicate source Artifact identity/,
  "ambiguous source identities produced colliding projected identities",
);

const unfilteredView = createEvidenceWorkspaceView(firstProjection, {});
assert.equal(unfilteredView.totalCount, 2);
assert.equal(unfilteredView.visibleCount, 2);
assert.deepEqual(unfilteredView.records.map((record) => record.sourceArtifactId), ["a:id", "b/id"], "filtering changed stable record ordering");
assert.deepEqual(unfilteredView.navigator.map((entry) => entry.artifactType), [...CANONICAL_EVIDENCE_ARTIFACT_TYPES], "navigator category order is not deterministic");
assert.equal(unfilteredView.navigator.reduce((count, entry) => count + entry.count, 0), unfilteredView.totalCount, "navigator counts disagree with inventory total");
assert.equal(unfilteredView.availabilityCounts.UNAVAILABLE, unfilteredView.totalCount, "availability count disagrees with inventory total");
const sourceView = createEvidenceWorkspaceView(firstProjection, { artifactType: "SOURCE" });
assert.equal(sourceView.visibleCount, sourceView.records.length, "visible count disagrees with filtered result count");
assert.equal(sourceView.visibleCount, sourceView.navigator.find((entry) => entry.artifactType === "SOURCE")?.count, "type filter count disagrees with result count");
assert.deepEqual(sourceView, createEvidenceWorkspaceView(secondProjection, { artifactType: "SOURCE" }), "filter results changed with source ordering");
const filteredEmptyView = createEvidenceWorkspaceView(firstProjection, { artifactType: "OCR" });
assert.equal(filteredEmptyView.visibleCount, 0, "zero-count canonical filter did not produce filtered-empty result");
assert.equal(filteredEmptyView.totalCount, 2, "filtered-empty result implied an empty Investigation projection");
const unavailableView = createEvidenceWorkspaceView(firstProjection, { availability: "UNAVAILABLE" });
assert.equal(unavailableView.visibleCount, unavailableView.availabilityCounts.UNAVAILABLE, "availability filter count disagrees with results");

const activeSelection = {
  investigationId: "case/active",
  evidenceId: firstProjection.records[0]!.evidenceId,
};
assert.equal(resolveEvidenceInspection(firstProjection, activeSelection)?.sourceArtifactId, "a:id");
assert.equal(resolveEvidenceInspection(projectInvestigationEvidence(investigation("case/other", [secondArtifact])), activeSelection), undefined, "stale cross-Investigation evidence remained selected");
assert.equal(resolveEvidenceInspection(firstProjection, { ...activeSelection, evidenceId: "evidence:missing" }), undefined, "removed evidence remained selected");
assert.equal(resolveEvidenceInspection(undefined, activeSelection), undefined, "selection survived no-Investigation state");
assert.equal(resolveEvidenceInspection({ ...firstProjection, records: filteredEmptyView.records }, activeSelection), undefined, "selection survived being filtered out");

const workspaceSource = readFileSync("src/workspace/surfaces/EvidenceWorkspace.tsx", "utf8");
const projectionSource = readFileSync("src/evidence/projection/EvidenceWorkspaceProjection.ts", "utf8");
const productionShellSource = readFileSync("src/surfaces/WorkspaceSurface.tsx", "utf8");
for (const removedPlaceholder of ["Nimitz Investigation", "E-TICTAC-2004", "147", "82%", "Corroborated", "Future Evidence Engine"]) {
  assert(!workspaceSource.includes(removedPlaceholder), `static placeholder remains: ${removedPlaceholder}`);
}
assert(workspaceSource.includes("No active Investigation"));
assert(workspaceSource.includes("No evidence records available in this investigation projection"));
assert(workspaceSource.includes("This does not establish that zero evidence exists."));
assert(workspaceSource.includes("No evidence records match the active filters."), "distinct filtered-empty state is absent");
assert(workspaceSource.includes("aria-live=\"polite\""), "live result feedback is absent");
assert(workspaceSource.includes("aria-pressed"), "pressed/selected state is absent");
assert(workspaceSource.includes("Show all evidence"), "clear show-all action is absent");
assert(workspaceSource.includes("setSelection(undefined)"), "local inspection does not explicitly reset on Investigation change");
assert(workspaceSource.includes("setFilters({})"), "filters do not explicitly reset on Investigation change");
assert(projectionSource.includes("investigation.workspace.artifacts"), "projection does not use the active Investigation artifact corpus");
assert.match(
  productionShellSource,
  /import\s+EvidenceWorkspace\s+from\s+["']\.\.\/workspace\/surfaces\/EvidenceWorkspace["'];/,
  "production WorkspaceSurface does not import EvidenceWorkspace",
);
assert.match(
  productionShellSource,
  /case\s+WorkspaceMode\.EVIDENCE:\s*return\s*\(\s*<EvidenceWorkspace\s*\/>\s*\);/,
  "production EVIDENCE route does not render EvidenceWorkspace",
);
assert.doesNotMatch(
  productionShellSource,
  /case\s+WorkspaceMode\.EVIDENCE:[\s\S]*?<PlaceholderSurface\s+title=["']Evidence Workspace["']/,
  "obsolete generic EVIDENCE placeholder remains in the production route",
);
assert.match(productionShellSource, /WorkspaceMode\.LAYERS\s*\|\|\s*activeMode\s*===\s*WorkspaceMode\.EVIDENCE/, "shared Research Inbox is not visible in EVIDENCE");

const cssSource = readFileSync("src/workspace/surfaces/EvidenceWorkspace.css", "utf8");
assert(cssSource.includes("@media(max-width:1100px)"), "desktop panel responsiveness contract is absent");
assert(cssSource.includes("@media(max-width:720px)"), "narrow workspace responsiveness contract is absent");
assert(cssSource.includes(":focus-visible"), "keyboard focus treatment is absent");
assert(cssSource.includes("min-width:0"), "horizontal overflow containment is absent");

const forbiddenRuntimeOwnership = [
  "useEvidenceAuthority",
  "EvidenceReservoir",
  "session.artifacts",
  "setSelection(",
  "addArtifact",
  "removeArtifact",
  "acceptResolveCandidate",
  "createEdge",
  "executeResolve",
  "ResearchBridgeRuntime",
  "AuthorDocumentRuntime",
  "KnowledgeObjectRuntime",
];
for (const forbidden of forbiddenRuntimeOwnership) {
  assert(!projectionSource.includes(forbidden), `projection contains forbidden owner or mutation: ${forbidden}`);
}
for (const forbidden of forbiddenRuntimeOwnership.filter((value) => value !== "setSelection(")) {
  assert(!workspaceSource.includes(forbidden), `workspace contains forbidden owner or mutation: ${forbidden}`);
}

console.log("PASS VerifyEvidenceWorkspace — deterministic, Investigation-scoped, read-only evidence projection verified");
