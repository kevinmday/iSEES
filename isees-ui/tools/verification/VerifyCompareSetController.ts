import { execFileSync } from "node:child_process";
import { readFileSync } from "node:fs";
import { CANONICAL_EVENTS } from "../../src/canonical/runtimeCorpus";
import { resolveCompareCandidateOptionProjection, CompareCandidateOptionProjectionStatus } from "../../src/compare/projection/CompareCandidateOptionProjection";
import { adaptSystemCanonToKnowledge } from "../../src/knowledge/ingestion/SystemCanonKnowledgeAdapter";
import { KnowledgeObjectType } from "../../src/knowledge/model/KnowledgeObjectTypes";
import { resolveCandidateIntelligence } from "../../src/resolve/intelligence/ResolveCandidateIntelligenceResolver";
import { createWorkspaceCandidateSelection } from "../../src/resolve/intelligence/ResolveCandidateSelection";
import { WorkspaceSelectionKind } from "../../src/workspace/runtime/WorkspaceRuntimeTypes";
import type { CanonicalSimilarityCandidateEvaluation } from "../../src/resolve/evaluation/CanonicalSimilarityCandidateEvaluationTypes";

function assert(value: unknown, message: string): asserts value { if (!value) throw new Error(`VERIFY FAILED: ${message}`); console.log(`PASS — ${message}`); }
function throws(fn: () => unknown, message: string) { let did = false; try { fn(); } catch { did = true; } assert(did, message); }
const ids = ["E-TICTAC-2004", "E-ROOSEVELT-2015", "E-RENDLESHAM-1980"];
const knowledge = adaptSystemCanonToKnowledge(CANONICAL_EVENTS.filter(event => ids.includes(event.event_id)));
const kid = (id: string) => knowledge.find(object => object.type === KnowledgeObjectType.EVENT && object.provenance.sourceId === id)!.identity.id;

function evaluation(left: string, right: string, similarity: number, participating = 1): CanonicalSimilarityCandidateEvaluation {
  const candidateId = `candidate:${left}::${right}`;
  const candidate = { identity: { candidateId, leftKnowledgeObjectId: left, rightKnowledgeObjectId: right } } as any;
  return {
    identity: { evaluationId: `evaluation:${candidateId}`, candidateId, leftKnowledgeObjectId: left, rightKnowledgeObjectId: right }, candidate,
    explanation: {
      aggregate: { aggregateSimilarity: similarity, participatingDimensionCount: participating, totalDimensionCount: 1 },
      evidence: { availableDimensions: participating ? ["NARRATIVE"] : [], unavailableDimensions: participating ? [] : ["NARRATIVE"], availableDimensionCount: participating, unavailableDimensionCount: participating ? 0 : 1, totalDimensionCount: 1 },
      dimensions: [{ dimension: "NARRATIVE", status: participating ? "AVAILABLE" : "UNAVAILABLE", source: participating ? { availability: "AVAILABLE", dimension: "NARRATIVE", similarity, weight: 1 } : { availability: "UNAVAILABLE", dimension: "NARRATIVE", reason: "fixture unavailable" } }],
      similarityRationale: ["verification fixture"],
    },
  } as CanonicalSimilarityCandidateEvaluation;
}

const evals = [evaluation(kid(ids[0]!), kid(ids[1]!), 0), evaluation(kid(ids[0]!), kid(ids[2]!), .5), evaluation(kid(ids[1]!), kid(ids[2]!), .25)];
const intelligence = evals.map(resolveCandidateIntelligence);
const before = JSON.stringify({ knowledge, intelligence });
const tic = resolveCompareCandidateOptionProjection(ids[0], knowledge, intelligence, undefined);
assert(tic.status === CompareCandidateOptionProjectionStatus.READY && tic.options.map(x => x.comparisonEventId).join() === `${ids[1]},${ids[2]}`, "Tic Tac produces Roosevelt then Rendlesham from canonical fixtures");
const roo = resolveCompareCandidateOptionProjection(ids[1], knowledge, intelligence, undefined);
assert(roo.status === CompareCandidateOptionProjectionStatus.READY && roo.options.map(x => x.comparisonEventId).join() === `${ids[0]},${ids[2]}`, "Roosevelt produces Tic Tac then Rendlesham and unrelated candidates are excluded");
assert(tic.status === "READY" && tic.options[0]!.aggregate.availability === "AVAILABLE" && tic.options[0]!.aggregate.similarity === 0, "AVAILABLE zero remains AVAILABLE zero");
const unavailableIntelligence = resolveCandidateIntelligence(evaluation(kid(ids[0]!), kid(ids[1]!), 0, 0));
const unavailable = resolveCompareCandidateOptionProjection(ids[0], knowledge, [unavailableIntelligence], undefined);
assert(unavailable.status === "READY" && unavailable.options[0]!.aggregate.availability === "UNAVAILABLE" && !("similarity" in unavailable.options[0]!.aggregate), "UNAVAILABLE remains UNAVAILABLE");
for (const selection of [undefined, { kind: WorkspaceSelectionKind.NONE }, { kind: WorkspaceSelectionKind.NODE, nodeId: "n" }, { kind: WorkspaceSelectionKind.EDGE, edgeId: "e" }] as const) {
  const result = resolveCompareCandidateOptionProjection(ids[0], knowledge, intelligence, selection);
  assert(result.status === "READY" && result.selectedOption === undefined, `${selection?.kind ?? "undefined"} selects no option`);
}
const selectedProduct = createWorkspaceCandidateSelection(intelligence[0]!);
const selected = resolveCompareCandidateOptionProjection(ids[0], knowledge, intelligence, selectedProduct);
assert(selected.status === "READY" && selected.options.filter(x => x.selected).length === 1 && selected.selectedOption?.selection === selected.options[0]?.selection, "complete four-field CANDIDATE identity selects exactly one canonical product");
throws(() => resolveCompareCandidateOptionProjection(ids[0], knowledge, intelligence, { ...selectedProduct, evaluationId: "stale" }), "stale focused CANDIDATE selection throws");
const malformed = { ...intelligence[0]!, identity: { ...intelligence[0]!.identity, rightKnowledgeObjectId: kid(ids[0]!) } };
throws(() => resolveCompareCandidateOptionProjection(ids[0], knowledge, [malformed], undefined), "malformed relevant candidate throws");
const opposite = knowledge.find(object => object.type !== KnowledgeObjectType.EVENT)!;
const nonEvent = resolveCandidateIntelligence(evaluation(kid(ids[0]!), opposite.identity.id, .3));
throws(() => resolveCompareCandidateOptionProjection(ids[0], knowledge, [nonEvent], undefined), "relevant candidate with opposite non-EVENT throws explicitly");
assert(JSON.stringify(resolveCompareCandidateOptionProjection(ids[0], knowledge, intelligence, undefined)) === JSON.stringify(tic), "repeat projection is structurally identical");
assert(JSON.stringify({ knowledge, intelligence }) === before, "projection does not mutate inputs");

const owner = readFileSync("src/investigationControl/InvestigationControl.tsx", "utf8");
const controller = readFileSync("src/compare/components/CompareSetController.tsx", "utf8");
const projection = readFileSync("src/compare/projection/CompareCandidateOptionProjection.ts", "utf8");
const css = readFileSync("src/compare/components/CompareSetController.css", "utf8");
assert(/WorkspaceMode\.COMPARE[\s\S]*?<CompareSetController \/>/.test(owner), "live left owner renders controller for COMPARE");
assert(/WorkspaceMode\.MANIFOLD[\s\S]*?<ManifoldNavigator \/>/.test(owner) && owner.includes("Investigation Library"), "MANIFOLD and non-COMPARE branches remain");
for (const value of ["useKnowledgeObjects", "useResolveRuntimeState", "useWorkspaceRuntime", "resolveCandidateIntelligenceCollection", "setSelection(option.selection)", "FOCUSED EVENT", "COMPARISON EVENT", "aria-pressed={option.selected}"]) assert(controller.includes(value), `controller contains required contract: ${value}`);
assert(projection.includes("createWorkspaceCandidateSelection") && projection.includes("resolveComparePairProjection"), "projection uses established selection product and I1B readiness");
for (const forbidden of [
  "execute(",
  "executeResolve",
  "acceptResolveCandidate",
  "ResolveCandidateAcceptance",
  "CanonicalKnowledgeSimilarityResolver",
  "GraphMutation",
  "createEdge",
  "setNodes",
  "setEdges",
  "ResearchInbox",
  "publishCompareCandidateToResearch",
  "createAnchor",
]) assert(!controller.includes(forbidden) && !projection.includes(forbidden), `forbidden mutation/computation absent: ${forbidden}`);
const selectors = css.split(/\r?\n/).map(x => x.trim()).filter(x => x.startsWith("."));
assert(selectors.length > 0 && selectors.every(x => x.startsWith(".compare-set")), "CSS uses only compare-set namespace");
for (const path of ["src/components/RightPanel.tsx"]) { execFileSync("git", ["diff", "--exit-code", "--", path]); assert(true, `${path} remains unchanged`); }
console.log("\nAll COMPARE Set Controller invariants passed.");
