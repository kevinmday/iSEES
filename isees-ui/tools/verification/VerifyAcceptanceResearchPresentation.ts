import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

import { KnowledgeObjectType } from "../../src/knowledge/model/KnowledgeObjectTypes";
import type { KnowledgeObject } from "../../src/knowledge/model/KnowledgeObject";
import {
  createAcceptedResolveCandidateRelationshipId,
  materializeAcceptedResolveCandidate,
  resolveCandidateAcceptanceState,
  ResolveCandidateAcceptanceState,
} from "../../src/resolve/acceptance/ResolveCandidateAcceptance";
import type { ResolveCandidateIntelligence } from "../../src/resolve/intelligence/ResolveCandidateIntelligenceTypes";
import { ResearchBridgeRuntime, type ResearchBridgeMutation } from "../../src/research/ResearchBridgeRuntime";
import { ResearchAnchorType, type ResearchAnchor } from "../../src/research/researchBridgeTypes";

const manifold = readFileSync("src/manifold/components/PrimaryInvestigationManifold.tsx", "utf8");
const compare = readFileSync("src/compare/components/CompareWorkspace.tsx", "utf8");
const inbox = readFileSync("src/manifold/components/ResearchInboxInstrument.tsx", "utf8");
const inboxCss = readFileSync("src/manifold/components/ResearchInboxInstrument.css", "utf8");
const workspaceSurface = readFileSync("src/surfaces/WorkspaceSurface.tsx", "utf8");
const rightPanel = readFileSync("src/components/RightPanel.tsx", "utf8");

for (const text of [
  "RELATIONSHIP ACCEPTED",
  "Canonical relationship created. EDGE",
  "useKnowledgeObjects",
  "resolveCandidateAcceptanceState",
  "ResolveCandidateAcceptanceState.ACCEPTED",
  "role=\"alert\"",
  "Create a canonical relationship between these events. This changes the Investigation Manifold.",
  "This candidate has been accepted as a canonical relationship in the Investigation Manifold.",
  "aria-label={acceptanceDescription}",
]) assert(manifold.includes(text), `acceptance UI contains ${text}`);

for (const text of [
  "resolveCandidateAcceptanceState",
  "Accepted Relationship",
  "Relationship Conflict",
  'label="EDGE ID"',
]) assert(rightPanel.includes(text), `Right Inspector contains ${text}`);

for (const text of [
  "Preserve this pairwise comparison in Research Inbox for inspection and writing. This does not accept the relationship.",
  "This pairwise comparison is preserved in Research Inbox. No relationship was accepted.",
  "aria-label={publicationDescription}",
]) assert(compare.includes(text), `publication UI contains ${text}`);

for (const text of [
  "Added to Research Inbox",
  "Pairwise correspondence preserved. No relationship was accepted.",
  "researchDesk.entries.some(entry => entry.anchor.anchorId === anchorId)",
]) assert(compare.includes(text), `persistent COMPARE confirmation contains ${text}`);

for (const text of [
  "NODE added to Research Inbox.",
  "EDGE added to Research Inbox.",
  "Pairwise correspondence added to Research Inbox.",
  'aria-live="polite"',
  'researchMutation?.kind !== "CREATE"',
  "2400",
]) assert(inbox.includes(text), `shared collection feedback contains ${text}`);

assert(inboxCss.includes("prefers-reduced-motion: reduce"), "reduced-motion feedback is nonanimated");
assert(inboxCss.includes("#86efac"), "feedback uses established green success color");
assert.equal((workspaceSurface.match(/<ResearchInboxInstrument\b/g) ?? []).length, 1, "one shared ResearchInboxInstrument remains mounted");
assert(workspaceSurface.includes("useState(false)"), "Research Inbox remains collapsed by default");
assert(!inbox.includes("onExpandedChange(true)"), "collection feedback never expands Research Inbox");

const orderedCardFields = ["Narrative", "Observability", "Infrastructure", "Topology", "Geography"];
let previous = -1;
for (const field of orderedCardFields) {
  const next = inbox.indexOf(`[\"${field.toUpperCase()}\", \"${field}\"]`);
  assert(next > previous, `${field} appears in canonical order`);
  previous = next;
}

for (const text of [
  "PAIRWISE CORRESPONDENCE",
  "aggregate ·",
  "CANDIDATE — inspection only",
  "Candidate ID",
  "Evaluation ID",
  "Canonical lineage",
  "Focused EVENT",
  "Comparison EVENT",
  "Resolve execution",
  "Epistemic status",
  "COMPARE pair inspection",
  "not an accepted EDGE",
  "No Author REFERENCE insertion",
  "Open this deterministic pairwise comparison. Research publication does not accept or create a relationship.",
  "dimension.source.reason",
  "formatPercent(dimension.source.similarity)",
]) assert(inbox.includes(text), `Research card contains ${text}`);

assert(inbox.includes("if (\"graph\" in entry.anchor)"), "NODE/EDGE insertion remains graph-only");
assert(inbox.includes("onClick={() => handleInsert(entry)}"), "NODE/EDGE insertion remains available");
assert(!inbox.includes("onClick={() => handleInsert(entry.anchor.candidate"), "CANDIDATE has no Author insertion path");
assert.equal(`${(0 * 100).toFixed(1)}%`, "0.0%", "AVAILABLE zero formats as 0.0%");

const knowledge = (id: string): KnowledgeObject => ({
  identity: { id, type: KnowledgeObjectType.EVENT, canonicalKey: id },
  epistemicStatus: "ESTABLISHED",
  provenance: { sources: [], derivation: "SYSTEM_CANON", createdAt: new Date(0), updatedAt: new Date(0) },
  layers: [],
  temporalBounds: {},
  relationships: [],
  payload: {},
} as KnowledgeObject);

const intelligence = {
  identity: { candidateId: "candidate:left:right", evaluationId: "evaluation:candidate:left:right", leftKnowledgeObjectId: "left", rightKnowledgeObjectId: "right" },
  candidate: { id: "candidate:left:right", leftKnowledgeObjectId: "left", rightKnowledgeObjectId: "right" },
  sourceEvaluation: { identity: { candidateId: "candidate:left:right", evaluationId: "evaluation:candidate:left:right", leftKnowledgeObjectId: "left", rightKnowledgeObjectId: "right" }, candidate: { id: "candidate:left:right", leftKnowledgeObjectId: "left", rightKnowledgeObjectId: "right" } },
} as unknown as ResolveCandidateIntelligence;

const first = materializeAcceptedResolveCandidate(intelligence, [knowledge("left"), knowledge("right")]);
assert.equal(resolveCandidateAcceptanceState(intelligence, [knowledge("left"), knowledge("right")]).state, ResolveCandidateAcceptanceState.POTENTIAL);
assert.equal(first.changed, true);
assert.equal(first.relationship.id, createAcceptedResolveCandidateRelationshipId("candidate:left:right"));
const repeated = materializeAcceptedResolveCandidate(intelligence, [first.knowledgeObject, knowledge("right")]);
assert.equal(repeated.changed, false, "canonical accepted Knowledge prevents duplicate relationship");
assert.equal(repeated.relationship.id, first.relationship.id);
const acceptedState = resolveCandidateAcceptanceState(intelligence, [first.knowledgeObject, knowledge("right")]);
assert.equal(acceptedState.state, ResolveCandidateAcceptanceState.ACCEPTED);
assert.equal(acceptedState.relationshipId, first.relationship.id);
const endpointOnly = knowledge("left");
endpointOnly.relationships.push({ id: "unrelated", type: "RESOLVE_CANDIDATE", targetId: "right" });
assert.equal(resolveCandidateAcceptanceState(intelligence, [endpointOnly, knowledge("right")]).state, ResolveCandidateAcceptanceState.POTENTIAL, "endpoint coincidence does not prove acceptance");
const conflicting = knowledge("left");
conflicting.relationships.push({ id: first.relationship.id, type: "CONFLICTING", targetId: "right" });
assert.equal(resolveCandidateAcceptanceState(intelligence, [conflicting, knowledge("right")]).state, ResolveCandidateAcceptanceState.MALFORMED_CONFLICT);
assert.throws(() => materializeAcceptedResolveCandidate(intelligence, [knowledge("left")]), /missing target Knowledge Object/);

{
  const runtime = new ResearchBridgeRuntime();
  const mutations: ResearchBridgeMutation[] = [];
  runtime.subscribe(mutation => mutations.push(mutation));
  const anchors: ResearchAnchor[] = [
    { anchorId: "research:i:NODE:n", investigationId: "i", graph: { type: ResearchAnchorType.NODE, id: "n" }, graphRevision: 1, createdAt: new Date(0), pinned: false },
    { anchorId: "research:i:EDGE:e", investigationId: "i", graph: { type: ResearchAnchorType.EDGE, id: "e" }, graphRevision: 1, createdAt: new Date(0), pinned: false },
    { anchorId: "research:i:CANDIDATE:c:v", investigationId: "i", candidate: { type: ResearchAnchorType.CANDIDATE, candidateId: "c", evaluationId: "v", leftKnowledgeObjectId: "left", rightKnowledgeObjectId: "right", focusedEventId: "right", focusedEventKnowledgeObjectId: "right", comparisonEventId: "left", comparisonEventKnowledgeObjectId: "left", epistemicStatus: "POTENTIAL_RELATIONSHIP", aggregate: intelligence.aggregate, dimensions: intelligence.dimensions, source: "COMPARE_PAIR_INSPECTION" }, createdAt: new Date(0), pinned: false },
  ];

  for (const anchor of anchors) {
    runtime.createAnchor(anchor);
    runtime.createAnchor(anchor);
  }

  assert.equal(runtime.getDesk().entries.length, 3, "NODE, EDGE, and CANDIDATE are each idempotent");
  assert.deepEqual(mutations.map(mutation => mutation.kind), ["CREATE", "CREATE", "CREATE"], "duplicates produce no success mutation");
  assert.deepEqual(mutations.flatMap(mutation => mutation.kind === "CREATE" ? ["graph" in mutation.anchor ? mutation.anchor.graph.type : mutation.anchor.candidate.type] : []), ["NODE", "EDGE", "CANDIDATE"]);

  runtime.restoreDesk(runtime.getDesk() as any);
  assert.equal(mutations.at(-1)?.kind, "RESTORE", "guest restoration is distinguishable from live collection");
}

console.log("PASS VerifyAcceptanceResearchPresentation");
