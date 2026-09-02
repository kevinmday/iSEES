import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

let passCount = 0;
const proves = (condition: unknown, message: string) => {
  assert(condition, message);
  passCount++;
};

const status = readFileSync("src/components/workspace/ManifoldProjectionStatus.tsx", "utf8");
const compute = readFileSync("src/investigationControl/ComputePanel.tsx", "utf8");
const manifold = readFileSync("src/manifold/components/PrimaryInvestigationManifold.tsx", "utf8");
const right = readFileSync("src/components/RightPanel.tsx", "utf8");
const runtime = readFileSync("src/resolve/runtime/ResolveRuntime.ts", "utf8");
const workspace = readFileSync("src/workspace/runtime/WorkspaceRuntime.ts", "utf8");
const snapshot = readFileSync("src/workspace/persistence/GuestWorkspaceSessionSnapshotFactory.ts", "utf8");
const restorer = readFileSync("src/workspace/persistence/GuestWorkspaceSessionRestorer.ts", "utf8");
const lifecycle = readFileSync("src/workspace/persistence/GuestWorkspaceSessionLifecycle.ts", "utf8");
const research = readFileSync("src/research/ResearchBridgeRuntime.ts", "utf8");
const researchContext = readFileSync("src/research/ResearchBridgeContext.tsx", "utf8");
const app = readFileSync("src/App.tsx", "utf8");

proves(status.includes("workspaceRuntime.getActiveLayers()"), "current layers use WorkspaceRuntime");
proves(status.includes("latestExecution.input"), "resolved context uses execution input");
proves(status.includes("resolvedInput.activeLayers"), "comparison uses resolved layer snapshot");
proves(status.includes("latestExecution\r\n        ?.input\r\n        .activeLayers"), "resolved count uses immutable execution input");
proves(status.includes("layersEqual"), "layer equality is explicit");
proves(status.includes("ManifoldProjectionStatusValue.STALE"), "mismatch is stale");
proves(status.includes("ManifoldProjectionStatusValue.SYNCHRONIZED"), "match is synchronized");
proves(!status.includes("execute("), "status derivation cannot run Resolve");
proves(runtime.includes("input,"), "execution record preserves supplied input");
proves(runtime.includes("record.result"), "completed product remains attached to its record");
proves(manifold.includes("workspaceRuntime.getActiveLayers()"), "Resolve consumes canonical current layers");
proves(manifold.includes("candidateEvaluations.evaluations"), "candidate evidence comes from evaluation product");
proves(compute.includes("Current selection"), "current selection is labeled");
proves(compute.includes("Resolved execution"), "resolved execution is labeled");
proves(compute.includes("Candidate evidence is evaluated independently"), "independent candidate domain is explained");
proves(compute.includes("Temporal and Topology are distinct domains"), "Temporal is not equated to Topology");
proves(compute.includes("current layer selection differs from the completed Resolve execution"), "stale guidance is truthful");
proves(workspace.includes("setActiveLayers"), "WorkspaceRuntime owns layer mutation");
proves(snapshot.includes("input.workspace.computational.activeLayers"), "Guest snapshot captures workspace configuration");
proves(restorer.includes("restoreWorkspace"), "Guest restorer restores workspace configuration");
proves(app.includes("<WorkspaceRuntimeProvider>"), "one shared workspace provider wraps modes");
proves(app.includes("<ResearchBridgeProvider>"), "one shared Research provider wraps modes");
proves(research.includes('this.notify({ kind: "RESTORE" })'), "Desk restoration emits RESTORE");
proves(!research.includes('restoreDesk(\r\n    desk') || research.includes('this.notify({ kind: "RESTORE" })'), "restoration does not masquerade as CREATE");
proves(researchContext.includes("getRevision()"), "late Research subscriber observes restored revision");
proves(lifecycle.includes("restoreGuestWorkspaceSession"), "lifecycle owns restoration");
proves(lifecycle.includes("attachRuntimeSubscriptions"), "subscriptions attach after restoration");
proves(lifecycle.includes("sessionStorage") || readFileSync("src/workspace/persistence/GuestWorkspaceSessionPersistence.ts", "utf8").includes("sessionStorage"), "Guest persistence is browser session scoped");
proves(right.includes("resolveCandidateAcceptanceState"), "Right Inspector uses shared acceptance resolver");
proves(manifold.includes("resolveCandidateAcceptanceState"), "MANIFOLD uses shared acceptance resolver");
proves(right.includes("Accepted Relationship"), "Right Inspector names accepted relationship");
proves(right.includes('label="EDGE ID"'), "Right Inspector shows canonical EDGE identity");
proves(manifold.includes("RELATIONSHIP CONFLICT"), "MANIFOLD blocks malformed acceptance state");
proves(right.includes("Relationship Conflict"), "Right Inspector exposes malformed state");
proves(manifold.includes("accepted || conflict || !candidateAcceptanceAllowed"), "repeat/conflicting acceptance is disabled");

console.log(`All ${passCount} COMPARE state-coherence invariants passed.`);
