import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import type { Artifact } from "../../src/artifacts/artifactTypes";
import type { Investigation } from "../../src/investigation/investigationTypes";
import { createProjectedEvidenceId, projectInvestigationEvidence, resolveEvidenceInspection } from "../../src/evidence/projection/EvidenceWorkspaceProjection.ts";

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

const activeSelection = {
  investigationId: "case/active",
  evidenceId: firstProjection.records[0]!.evidenceId,
};
assert.equal(resolveEvidenceInspection(firstProjection, activeSelection)?.sourceArtifactId, "a:id");
assert.equal(resolveEvidenceInspection(projectInvestigationEvidence(investigation("case/other", [secondArtifact])), activeSelection), undefined, "stale cross-Investigation evidence remained selected");
assert.equal(resolveEvidenceInspection(firstProjection, { ...activeSelection, evidenceId: "evidence:missing" }), undefined, "removed evidence remained selected");
assert.equal(resolveEvidenceInspection(undefined, activeSelection), undefined, "selection survived no-Investigation state");

const workspaceSource = readFileSync("src/workspace/surfaces/EvidenceWorkspace.tsx", "utf8");
const projectionSource = readFileSync("src/evidence/projection/EvidenceWorkspaceProjection.ts", "utf8");
const productionShellSource = readFileSync("src/surfaces/WorkspaceSurface.tsx", "utf8");
for (const removedPlaceholder of ["Nimitz Investigation", "E-TICTAC-2004", "147", "82%", "Corroborated", "Future Evidence Engine"]) {
  assert(!workspaceSource.includes(removedPlaceholder), `static placeholder remains: ${removedPlaceholder}`);
}
assert(workspaceSource.includes("No active Investigation"));
assert(workspaceSource.includes("No evidence records available in this investigation projection"));
assert(workspaceSource.includes("This does not establish that zero evidence exists."));
assert(workspaceSource.includes("setSelection(undefined)"), "local inspection does not explicitly reset on Investigation change");
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
