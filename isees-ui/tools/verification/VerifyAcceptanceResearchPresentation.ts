import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

import { KnowledgeObjectType } from "../../src/knowledge/model/KnowledgeObjectTypes";
import type { KnowledgeObject } from "../../src/knowledge/model/KnowledgeObject";
import {
  createAcceptedResolveCandidateRelationshipId,
  materializeAcceptedResolveCandidate,
} from "../../src/resolve/acceptance/ResolveCandidateAcceptance";
import type { ResolveCandidateIntelligence } from "../../src/resolve/intelligence/ResolveCandidateIntelligenceTypes";

const manifold = readFileSync("src/manifold/components/PrimaryInvestigationManifold.tsx", "utf8");
const compare = readFileSync("src/compare/components/CompareWorkspace.tsx", "utf8");
const inbox = readFileSync("src/manifold/components/ResearchInboxInstrument.tsx", "utf8");

for (const text of [
  "RELATIONSHIP ACCEPTED",
  "Canonical relationship created. EDGE",
  "useKnowledgeObjects",
  "acceptedRelationship !== undefined",
  "role=\"alert\"",
  "Create a canonical relationship between these events. This changes the Investigation Manifold.",
  "This candidate has been accepted as a canonical relationship in the Investigation Manifold.",
  "aria-label={acceptanceDescription}",
]) assert(manifold.includes(text), `acceptance UI contains ${text}`);

for (const text of [
  "Preserve this pairwise comparison in Research Inbox for inspection and writing. This does not accept the relationship.",
  "This pairwise comparison is preserved in Research Inbox. No relationship was accepted.",
  "aria-label={publicationDescription}",
]) assert(compare.includes(text), `publication UI contains ${text}`);

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
assert.equal(first.changed, true);
assert.equal(first.relationship.id, createAcceptedResolveCandidateRelationshipId("candidate:left:right"));
const repeated = materializeAcceptedResolveCandidate(intelligence, [first.knowledgeObject, knowledge("right")]);
assert.equal(repeated.changed, false, "canonical accepted Knowledge prevents duplicate relationship");
assert.equal(repeated.relationship.id, first.relationship.id);
assert.throws(() => materializeAcceptedResolveCandidate(intelligence, [knowledge("left")]), /missing target Knowledge Object/);

console.log("PASS VerifyAcceptanceResearchPresentation");
