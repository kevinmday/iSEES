import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { ResearchBridgeRuntime } from "../../src/research/ResearchBridgeRuntime.ts";
import { ResearchAnchorType } from "../../src/research/researchBridgeTypes.ts";

const graphPath = "src/manifold/components/InvestigationGraph.tsx";
const graph = readFileSync(graphPath, "utf8");
const graphNodes = readFileSync("src/manifold/components/GraphNodes.tsx", "utf8");
const graphEdges = readFileSync("src/manifold/components/GraphEdges.tsx", "utf8");
const graph3D = readFileSync("src/manifold/components/InvestigationGraph3D.tsx", "utf8");
const bridgeSource = readFileSync("src/research/ResearchBridgeRuntime.ts", "utf8");
const confirmationSource = readFileSync("src/manifold/components/ResearchInboxInstrument.tsx", "utf8");

let count = 0;
function proves(value: unknown, message: string): asserts value {
  count += 1;
  assert.ok(value, message);
}

const nodeHandler = graph.match(/function handleCollectNode\([\s\S]*?\n\}/)?.[0] ?? "";
const edgeHandler = graph.match(/function handleCollectEdge\([\s\S]*?\n\}/)?.[0] ?? "";
proves(graph.includes(".getActiveInvestigation()"), "live owner obtains the active Investigation from Workspace Runtime");
for (const [kind, handler] of [["NODE", nodeHandler], ["EDGE", edgeHandler]] as const) {
  proves(handler.includes("if (!activeInvestigation)"), `${kind} publication fails closed without an active Investigation`);
  proves(/investigationId:\s*activeInvestigation\.id/.test(handler), `${kind} publication uses the active Investigation identity`);
  proves(!/investigationId:\s*focusedEventId/.test(handler), `${kind} publication does not use focused EVENT identity as ownership`);
}

const runtime = new ResearchBridgeRuntime();
const owningInvestigationId = "INV-SYSTEM_CANON-E-TICTAC-2004";
const focusedEventId = "E-TICTAC-2004";
const publish = (type: ResearchAnchorType, id: string) => runtime.bridge({
  investigationId: owningInvestigationId,
  graph: { type, id },
  graphRevision: 1,
});

publish(ResearchAnchorType.NODE, focusedEventId);
publish(ResearchAnchorType.EDGE, "EDGE-E-TICTAC-2004-RELATED");
publish(ResearchAnchorType.NODE, focusedEventId);
publish(ResearchAnchorType.EDGE, "EDGE-E-TICTAC-2004-RELATED");
const owningProjection = runtime.projectInvestigation({ investigationId: owningInvestigationId });
proves(owningProjection.entries.length === 2, "NODE and EDGE publication is duplicate-idempotent");
proves(owningProjection.entries.some(entry => entry.anchor.graph?.type === ResearchAnchorType.NODE && entry.anchor.investigationId === owningInvestigationId), "owning Investigation Inbox includes the focused-event NODE");
proves(owningProjection.entries.some(entry => entry.anchor.graph?.type === ResearchAnchorType.EDGE && entry.anchor.investigationId === owningInvestigationId), "owning Investigation Inbox includes the EDGE");
proves(runtime.projectInvestigation({ investigationId: "INV-OTHER" }).entries.length === 0, "another Investigation excludes both entries");
proves(runtime.projectInvestigation({ investigationId: owningInvestigationId }).entries.length === 2, "returning to the owning Investigation restores both entries");

proves(/onClick=[\s\S]*?setSelection/.test(graphNodes) && /onDoubleClick=[\s\S]*?onCollectNode/.test(graphNodes), "2D NODE selection and collection remain independent");
proves(/onClick=[\s\S]*?setSelection/.test(graphEdges) && /onDoubleClick=[\s\S]*?onCollectEdge/.test(graphEdges), "2D EDGE selection and collection remain independent");
proves(graph.includes("onCollectNode={handleCollectNode}") && graph.includes("onCollectEdge={handleCollectEdge}"), "corrected callbacks reach the 3D projection");
proves(graph3D.includes("onCollectNode?.(projected)") && graph3D.includes("onCollectEdge?.(projected)"), "3D NODE and EDGE paths invoke their collection callbacks");
proves(/researchMutation\.anchor\.investigationId !== activeInvestigation\?\.id/.test(confirmationSource), "confirmation accepts only active-Investigation-qualified mutations");
proves((bridgeSource.match(/export const researchBridgeRuntime\s*=/g) ?? []).length === 1, "the existing Research Bridge singleton remains unique");

console.log(`PASS VerifyManifoldResearchPublicationOwnership — ${count} assertions verified`);
