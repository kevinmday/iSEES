import {
  execFileSync,
} from "node:child_process";

import {
  readFileSync,
} from "node:fs";

const workspaceSurfacePath =
  "src/surfaces/WorkspaceSurface.tsx";
const compareWorkspacePath =
  "src/compare/components/CompareWorkspace.tsx";
const compareCssPath =
  "src/compare/components/CompareWorkspace.css";
const dormantComparePath =
  "src/workspace/surfaces/CompareWorkspace.tsx";

const workspaceSurface = readFileSync(workspaceSurfacePath, "utf8");
const compareWorkspace = readFileSync(compareWorkspacePath, "utf8");
const compareCss = readFileSync(compareCssPath, "utf8");
readFileSync(dormantComparePath, "utf8");

function assert(condition: boolean, message: string): asserts condition {
  if (!condition) {
    throw new Error(`VERIFY FAILED: ${message}`);
  }
}

let passCount = 0;

function pass(message: string): void {
  passCount += 1;
  console.log(`PASS ${passCount} — ${message}`);
}

function assertIncludes(source: string, value: string, message: string): void {
  assert(source.includes(value), message);
  pass(message);
}

function assertExcludes(source: string, value: string, message: string): void {
  assert(!source.includes(value), message);
  pass(message);
}

assertIncludes(workspaceSurface, 'from "../compare/components/CompareWorkspace"', "active WorkspaceSurface imports the production CompareWorkspace");
assert(/case WorkspaceMode\.COMPARE:[\s\S]*?<CompareWorkspace \/>/.test(workspaceSurface), "WorkspaceMode.COMPARE renders the production CompareWorkspace");
pass("WorkspaceMode.COMPARE renders the production CompareWorkspace");
assertExcludes(workspaceSurface, "Comparative Analysis Workspace", "legacy COMPARE placeholder copy is removed from the active router");

for (const placeholder of [
  "Narrative Workspace",
  "Evidence Workspace",
  "Timeline Workspace",
  "Layer Analysis Workspace",
  "Intention Workspace",
]) {
  assertIncludes(workspaceSurface, placeholder, `${placeholder} route remains intact`);
}

assertIncludes(compareWorkspace, "useKnowledgeObjects", "CompareWorkspace consumes canonical Knowledge Objects");
assertIncludes(compareWorkspace, "useResolveRuntimeState", "CompareWorkspace consumes Resolve runtime state");
assertIncludes(compareWorkspace, "useWorkspaceRuntime", "CompareWorkspace consumes Workspace runtime state");
assertIncludes(compareWorkspace, "resolveCandidateIntelligenceCollection", "Candidate Intelligence uses the existing collection resolver");
assertIncludes(compareWorkspace, "resolveComparePairProjection", "pair state uses the canonical I1B projection resolver");

for (const forbiddenImport of [
  "CanonicalKnowledgeSimilarityMatrix",
  "CanonicalKnowledgeSimilarityResolver",
  "acceptResolveCandidate",
  "GraphMutation",
  "ResearchInbox",
]) {
  assertExcludes(compareWorkspace, forbiddenImport, `CompareWorkspace excludes forbidden dependency ${forbiddenImport}`);
}

for (const dimension of [
  "Narrative",
  "Observability",
  "Infrastructure",
  "Topology",
  "Geography",
]) {
  assertIncludes(compareWorkspace, dimension, `${dimension} dimension label is represented`);
}

assertIncludes(compareWorkspace, 'availability === "UNAVAILABLE"', "UNAVAILABLE dimensions have a distinct presentation branch");
assertIncludes(compareWorkspace, "item.source.similarity", "AVAILABLE dimensions display the authoritative pairwise score");
assertExcludes(compareWorkspace, "Case A contribution", "no separate Case A contribution score is fabricated");
assertExcludes(compareWorkspace, "Case B contribution", "no separate Case B contribution score is fabricated");
assertIncludes(compareWorkspace, "Original left Knowledge Object ID", "canonical left lineage is rendered");
assertIncludes(compareWorkspace, "Original right Knowledge Object ID", "canonical right lineage is rendered");
assertIncludes(compareWorkspace, "No canonical relationship has been created", "epistemic boundary rejects relationship creation");
assertIncludes(compareWorkspace, 'role="meter"', "dimension meters expose semantic meter roles");
assertIncludes(compareWorkspace, "aria-valuetext={textualValue}", "dimension meters expose accessible textual values");
assertIncludes(compareWorkspace, "Pair cannot be projected", "malformed pair state has an explicit error presentation");
assertIncludes(compareWorkspace, "NO_COMPLETED_RESOLVE_CANDIDATE_POPULATION", "missing completed Resolve population is explicit");
assertIncludes(compareWorkspace, "Case A has not been fabricated", "missing focused EVENT Knowledge does not fabricate Case A");

const cssSelectors = compareCss
  .split(/\r?\n/)
  .map(line => line.trim())
  .filter(line => line.startsWith("."));
assert(cssSelectors.length > 0, "CompareWorkspace CSS contains component selectors");
assert(cssSelectors.every(selector => selector.startsWith(".compare-workspace")), "all CompareWorkspace CSS selectors use the scoped namespace");
pass("CSS uses only the scoped compare-workspace namespace");

execFileSync(
  "git",
  ["diff", "--exit-code", "--", dormantComparePath],
  { stdio: "pipe" },
);
pass("dormant legacy CompareWorkspace remains unchanged");

assertIncludes(workspaceSurface, "<WorkspaceIdentityHeader />", "persistent WorkspaceIdentityHeader remains mounted");
assertIncludes(workspaceSurface, "activeMode === WorkspaceMode.MANIFOLD", "Research Inbox visibility remains MANIFOLD/RESEARCH scoped");

console.log("");
console.log(`All ${passCount} COMPARE Workspace Projection invariants passed.`);
