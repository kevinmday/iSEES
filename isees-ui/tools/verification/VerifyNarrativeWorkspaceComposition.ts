import { readFileSync } from "node:fs";

const surfacePath = "src/narrative/components/NarrativeWorkspace.tsx";
const cssPath = "src/narrative/components/NarrativeWorkspace.css";
const workspaceSurfacePath = "src/surfaces/WorkspaceSurface.tsx";
const compareVerifierPath = "tools/verification/VerifyCompareWorkspaceProjection.ts";

const surface = readFileSync(surfacePath, "utf8");
const css = readFileSync(cssPath, "utf8");
const workspaceSurface = readFileSync(workspaceSurfacePath, "utf8");
const compareVerifier = readFileSync(compareVerifierPath, "utf8");

function assert(condition: boolean, message: string): asserts condition {
  if (!condition) throw new Error(`VERIFY FAILED: ${message}`);
}

let passCount = 0;
function pass(message: string): void { passCount += 1; console.log(`PASS ${passCount} — ${message}`); }
function includes(source: string, value: string, message: string): void { assert(source.includes(value), message); pass(message); }
function excludes(source: string, value: string, message: string): void { assert(!source.includes(value), message); pass(message); }

function workspaceModeCase(source: string, mode: string): string {
  const marker = `case WorkspaceMode.${mode}:`;
  const start = source.indexOf(marker);
  assert(start >= 0, `WorkspaceMode.${mode} case exists`);
  const remainder = source.slice(start + marker.length);
  const nextCase = remainder.search(/\bcase WorkspaceMode\.[A-Z_]+:/);
  return nextCase >= 0
    ? source.slice(start, start + marker.length + nextCase)
    : source.slice(start);
}

const narrativeCase = workspaceModeCase(workspaceSurface, "NARRATIVE");

includes(workspaceSurface, 'from "../narrative/components/NarrativeWorkspace"', "active WorkspaceSurface imports the production NarrativeWorkspace");
includes(narrativeCase, "<NarrativeWorkspace />", "WorkspaceMode.NARRATIVE renders NarrativeWorkspace");
excludes(narrativeCase, "PlaceholderSurface", "old NARRATIVE PlaceholderSurface branch is absent");
excludes(narrativeCase, '"Narrative Workspace"', "old NARRATIVE placeholder literal is absent");
for (const [mode, component] of [["OVERVIEW", "OverviewWorkspace"], ["MANIFOLD", "ManifoldWorkspace"], ["COMPARE", "CompareWorkspace"], ["EVIDENCE", "EvidenceWorkspace"], ["TIMELINE", "TimelineWorkspace"], ["LAYERS", "LayersWorkspace"], ["RESEARCH", "StudioShell"]]) {
  assert(new RegExp(`case WorkspaceMode\\.${mode}:[\\s\\S]*?<${component} \\/>`).test(workspaceSurface), `${mode} route remains present`);
}
assert(/case WorkspaceMode\.INTENTION:[\s\S]*?<PlaceholderSurface[\s\S]*?title="Intention Workspace"/.test(workspaceSurface), "INTENTION route remains present"); pass("all other WorkspaceSurface MODE branches remain present");
includes(workspaceSurface, "<WorkspaceIdentityHeader />", "persistent WorkspaceIdentityHeader remains at the shared boundary");
const inboxVisibility = workspaceSurface.match(/const researchInboxVisible\s*=[\s\S]*?;/)?.[0] ?? "";
assert(inboxVisibility.length > 0 && !inboxVisibility.includes("WorkspaceMode.NARRATIVE"), "Research Inbox visibility excludes NARRATIVE"); pass("Research Inbox visibility excludes NARRATIVE");
includes(surface, 'from "../projection/NarrativeWorkspaceProjection"', "NarrativeWorkspace imports the I1 resolver");
includes(surface, "resolveNarrativeWorkspaceProjection({", "NarrativeWorkspace calls the I1 resolver");
includes(surface, "workspaceRuntime.getActiveInvestigation()", "NarrativeWorkspace reads the active Investigation from WorkspaceRuntime");
includes(surface, "workspaceRuntime.getSelection()", "NarrativeWorkspace reads shared canonical selection from WorkspaceRuntime");
includes(surface, "useKnowledgeObjects()", "NarrativeWorkspace reads Knowledge through the existing hook");
includes(surface, "useResolveRuntimeState()", "NarrativeWorkspace reads Resolve state through the existing hook");
includes(surface, "resolveCurrentInvestigationExecution(investigation, resolveState.currentExecution)", "NarrativeWorkspace uses coherent current Resolve execution");
assert(/resolveNarrativeWorkspaceProjection\(\{\s*investigation,\s*knowledgeObjects,\s*selection,\s*candidateEvaluations,\s*\}\)/.test(surface), "I1 invocation passes exactly its four required inputs"); pass("I1 invocation passes exactly its four required inputs");
includes(surface, "EMPTY_CANDIDATE_EVALUATIONS", "missing evaluations use a stable empty collection");
excludes(surface, "useState", "NarrativeWorkspace introduces no local comparison state");
for (const forbidden of ["setSelection", "setActiveMode", "createContext", "createStore", "selectedCandidateId"]) excludes(surface, forbidden, `NarrativeWorkspace excludes local comparison owner ${forbidden}`);
const focusedIndex = surface.indexOf('role="FOCUSED NARRATIVE"');
const normalizedIndex = surface.indexOf("<NormalizedRegion projection={projection}");
const comparedIndex = surface.indexOf('role="COMPARED NARRATIVE"');
assert(focusedIndex >= 0 && focusedIndex < normalizedIndex && normalizedIndex < comparedIndex, "FOCUSED, NORMALIZED, and COMPARED regions occur in semantic source order"); pass("FOCUSED, NORMALIZED, and COMPARED regions occur in semantic source order");
for (const status of ["READY", "NO_INVESTIGATION", "NO_FOCUSED_EVENT", "NO_COMPARISON", "STALE_SELECTION", "UNAVAILABLE"]) includes(surface, `NarrativeWorkspaceProjectionStatus.${status}`, `${status} has explicit presentation`);
for (const dimension of ["NARRATIVE", "OBSERVABILITY", "INFRASTRUCTURE", "TOPOLOGY", "GEOGRAPHY"]) includes(surface, `"${dimension}"`, `${dimension} normalized dimension is represented`);
includes(surface, "secondaryExactComparison", "exact secondary comparison is rendered");
includes(surface, "projection.unsupported", "unsupported analysis is rendered explicitly");
assert(/narrative\.paragraphs\.map\(\(paragraph, index\) => <p key=\{index\}>\{paragraph\}<\/p>\)/.test(surface), "canonical narrative paragraphs render directly and in array order"); pass("canonical narrative paragraphs render directly and in array order");
for (const forbidden of ["useResearchBridge", "useResearchDesk", "ResearchBridgeRuntime", "publish", "ResearchInbox", "fetch(", "XMLHttpRequest", "localStorage", "sessionStorage", "setTimeout", "setInterval"]) excludes(surface, forbidden, `NarrativeWorkspace excludes side-effect dependency ${forbidden}`);
for (const forbidden of ["executeResolve", ".execute(", "GraphMutation", "createEdge", "setNodes", "setEdges", "currentRevisionId ="]) excludes(surface, forbidden, `NarrativeWorkspace excludes mutation dependency ${forbidden}`);
for (const forbidden of ["assistant", "Assistant", "OpenAI", "LLM", "Studio", "Author", "Editor", "contentEditable", "textarea", '<input']) excludes(surface, forbidden, `NarrativeWorkspace excludes AI/STUDIO/editor dependency ${forbidden}`);
const cssSelectors = css.split(/\r?\n/).map(line => line.trim()).filter(line => line.startsWith("."));
assert(cssSelectors.length > 0 && cssSelectors.every(selector => selector.startsWith(".narrative-workspace")), "all component CSS selectors use the NARRATIVE namespace"); pass("all component CSS selectors use the NARRATIVE namespace");
includes(css, "grid-template-columns: minmax(230px, .8fr) minmax(420px, 1.5fr) minmax(230px, .8fr)", "desktop grid preserves specified three-region proportions");
includes(css, "@media (max-width: 1050px)", "responsive stacking breakpoint exists");
includes(css, "grid-template-columns: minmax(0,1fr)", "responsive composition stacks to one column");
includes(css, "overflow-x: hidden", "horizontal overflow protection exists");
includes(css, "position: static", "stacked layout disables sticky region headers");
excludes(compareVerifier, '"Timeline Workspace"', "COMPARE verifier no longer requires the obsolete TIMELINE placeholder literal");
assert(/const timelineCase = workspaceModeCase\(workspaceSurface, "TIMELINE"\);[\s\S]*?assertIncludes\(timelineCase, "<TimelineWorkspace \/>"/.test(compareVerifier), "COMPARE verifier case-bounds the production TIMELINE route assertion"); pass("COMPARE verifier case-bounds the production TIMELINE route assertion");
includes(compareVerifier, '"Intention Workspace"', "COMPARE verifier retains INTENTION placeholder protection");
assert(/for \(const placeholder of \[\s*"Intention Workspace",?\s*\]\)/.test(compareVerifier), "COMPARE verifier keeps INTENTION alone in placeholder protection"); pass("COMPARE verifier keeps INTENTION alone in placeholder protection");
excludes(compareVerifier, '"Narrative Workspace"', "COMPARE verifier no longer requires the obsolete NARRATIVE placeholder");

console.log("");
console.log(`PASS VerifyNarrativeWorkspaceComposition — ${passCount} source-contract assertions verified`);
console.log("Source-contract assertions do not constitute browser-rendering proof.");
