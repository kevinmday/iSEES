import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

import { ResearchBridgeRuntime } from "../../src/research/ResearchBridgeRuntime";
import { ResearchAnchorType, type ResearchExperimentAnchor } from "../../src/research/researchBridgeTypes";
import { experimentReferenceSummary } from "../../src/research/LayersExperimentReferencePresentation";

const read = (path: string) => readFileSync(path, "utf8");
const surface = read("src/surfaces/WorkspaceSurface.tsx");
const surfaceCss = read("src/surfaces/WorkspaceSurface.css");
const layout = read("src/layout/MainLayout.tsx");
const intelligence = read("src/layers/components/LayersExperimentalIntelligence.tsx");
const laboratory = read("src/layers/components/LayersLaboratoryWorkspace.tsx");
const laboratoryCss = read("src/layers/components/LayersLaboratoryWorkspace.css");
const sideCss = read("src/layers/components/LayersSideInstruments.css");
const inbox = read("src/manifold/components/ResearchInboxInstrument.tsx");
const inboxCss = read("src/manifold/components/ResearchInboxInstrument.css");
const author = read("src/author/components/AuthorEditorSurface.tsx");
const persistence = read("src/workspace/persistence/GuestWorkspaceSessionPersistence.ts");
const restoration = read("src/workspace/persistence/GuestWorkspaceSessionRestorer.ts");
const researchAuthorAdapter = read("src/studio/sources/ResearchAnchorAuthorInsertion.ts");

assert(surface.includes("workspace-surface__projection--layers"));
assert(surfaceCss.includes("--layers-inbox-collapsed-clearance: 60px"), "collapsed LAYERS dock has bottom clearance");
assert(surfaceCss.includes("--layers-inbox-expanded-clearance: 302px"), "expanded LAYERS dock has side clearance");
assert(surfaceCss.includes('data-research-inbox-expanded="true"'));
assert(!surfaceCss.includes("min-width: calc(760px + var(--layers-inbox-expanded-clearance))"), "expanded Inbox does not force a content-derived LAYERS minimum width");
assert(surfaceCss.includes("padding-right: var(--layers-inbox-expanded-clearance)"), "expanded Inbox reserves mode-scoped side clearance and reflows LAYERS");
assert(surface.includes("activeMode === WorkspaceMode.MANIFOLD &&"), "established MANIFOLD expanded reservation remains mode-specific");
assert(!surfaceCss.includes("--compare") && !surfaceCss.includes("--studio"), "COMPARE and Studio docks are unchanged");

const layersCopy = "Inspect the experimental subjects, layers, wires, delta, contributions, and deterministic provenance.";
const ordinaryCopy = "Deterministic inspection of the active node, edge, cluster, or Resolve candidate.";
assert(layout.includes(layersCopy));
assert(layout.includes(ordinaryCopy));
assert(layout.includes("layersMode"));

assert(!intelligence.includes('`${projection.baseline.relationship.availability} · ${pct(projection.delta.baselineScore)}`'));
assert(intelligence.includes('<Row label="Baseline" value={pct(projection.delta.baselineScore)}/>'));
assert(intelligence.includes('value === undefined ? "UNAVAILABLE"'), "unavailable is distinct from an AVAILABLE zero score");
assert(intelligence.includes("projection.provenance.baselineLayerIds.length === 0"));
assert(intelligence.includes("projection.baseline.relationship.reason"), "active-layer baseline uses the authoritative unavailable reason");

const projection = Object.freeze({
  kind: "LAYERS_EXPERIMENTAL_PAIR_PROJECTION", projectionId: "layers:p", investigationId: "i", executionId: "x",
  pairId: "pair", candidateId: "candidate", evaluationId: "evaluation", subjects: [],
  baseline: { relationship: { availability: "UNAVAILABLE", reason: "NO_PARTICIPATING_LAYERS", participatingLayers: [] }, contributions: [] },
  experimental: { relationship: { availability: "AVAILABLE", score: .4, participatingWeight: 1, participatingLayers: ["INFRASTRUCTURE"] }, contributions: [] },
  layerContributions: [], unavailableInputs: [], delta: { state: "FORMED", experimentalScore: .4 },
  provenance: { governingEquation: "M = g(L,T,S)", executionId: "x", investigationId: "i", pairId: "pair", candidateId: "candidate", evaluationId: "evaluation", baselineLayerIds: [], experimentalLayerIds: ["INFRASTRUCTURE"], participatingLayerIds: ["INFRASTRUCTURE"], unavailableLayerIds: [], canonicalRepresentation: "{}" },
  createsCanonicalKnowledgeRelationship: false,
} as any);
const anchor: ResearchExperimentAnchor = Object.freeze({
  anchorId: "research:i:EXPERIMENT:layers:p", investigationId: "i",
  experiment: Object.freeze({ type: ResearchAnchorType.EXPERIMENT, caseAEventId: "E-TICTAC-2004", caseBEventId: "E-ROOSEVELT-2015", projection, source: "LAYERS_EXPERIMENTAL_LABORATORY" }),
  createdAt: new Date(0), pinned: false,
});
const before = JSON.stringify(anchor);
const summary = experimentReferenceSummary(anchor);
assert(summary.includes("Nimitz Tic Tac Encounter ↔ Roosevelt Carrier Group Encounters"));
for (const field of ["FORMED", "INFRASTRUCTURE", "40.0%", "Baseline UNAVAILABLE", "EXPERIMENTAL / NON-CANONICAL"]) assert(summary.includes(field), `Author experiment reference includes ${field}`);
assert.equal(JSON.stringify(anchor), before, "reference presentation does not mutate the immutable Research snapshot");
for (const sourceField of ["experiment.caseAEventId", "experiment.caseBEventId", "projection.delta.state", "projection.provenance.experimentalLayerIds", "projection.experimental.relationship", "projection.baseline.relationship"]) assert(inbox.includes(sourceField), `reference field derives from Research snapshot: ${sourceField}`);
assert(inbox.includes("createAuthorReferenceFromResearchAnchor"), "shared Inbox delegates author insertion to the canonical typed Research adapter");
assert(researchAuthorAdapter.includes('source: "RESEARCH_BRIDGE"'));
assert(researchAuthorAdapter.includes("targetId: anchor.sourceIdentity"));
for (const field of ["sourceInvestigationId", "sourceWorkspace", "sourceRevisionId", "sourceExecutionId", "sourceProjectionId", "capturedRepresentation"]) assert(researchAuthorAdapter.includes(field), `typed author reference preserves ${field}`);
assert(author.includes('className="author-provenance"') && author.includes("Inspect exact provenance"), "structured Research references expose exact provenance details");
for (const field of ["research.sourceIdentity", "research.sourceWorkspace", "research.sourceKind", "research.sourceInvestigationId", "research.sourceProjectionId", "research.classification", "research.insertability", "research.capturedRepresentation"]) assert(author.includes(field), `author provenance presentation preserves ${field}`);
assert(author.includes("reference.summary"));
assert(researchAuthorAdapter.includes('anchor.kind === "GRAPH" ? anchor.graph.type : "DOCUMENT"') && researchAuthorAdapter.includes("targetId: anchor.sourceIdentity"), "canonical typed adapter preserves NODE/EDGE targets and document-backed COMPARE candidates");

const research = new ResearchBridgeRuntime();
research.createAnchor(anchor);
research.createAnchor(anchor);
assert.equal(research.getDesk().entries.length, 1, "Research experiment deduplication remains intact");
assert(persistence.includes('experiment.type === "EXPERIMENT"') && persistence.includes('projection.kind === "LAYERS_EXPERIMENTAL_PAIR_PROJECTION"'), "persisted Research experiments remain supported");
assert(restoration.includes("runtime.restoreDesk"));
assert(!persistence.includes("LayersExperimentRuntime") && !restoration.includes("LayersExperimentRuntime"), "refresh does not restore or autorun transient LAYERS computation");

for (const step of ["Run Resolve.", "Select a comparison in COMPARE.", "Return to LAYERS.", "Published Research experiments remain available"]) assert(laboratory.includes(step));
assert(laboratory.includes("aria-pressed") && laboratoryCss.includes(":focus-visible"));
assert(inbox.includes('aria-live="polite"') && intelligence.includes("PUBLISHED TO RESEARCH"));
assert(inboxCss.includes(":focus-visible") && inboxCss.includes("prefers-reduced-motion: reduce"));
assert(laboratoryCss.includes("prefers-reduced-motion:reduce") && sideCss.includes("prefers-reduced-motion:reduce") && surfaceCss.includes("prefers-reduced-motion: reduce"));

for (const forbidden of ["acceptResolveCandidate", "createEdge", "setActiveLayers", "executeResolve"]) {
  assert(!inbox.includes(forbidden) && !author.includes(forbidden), `presentation does not mutate canonical Knowledge or relationship state: ${forbidden}`);
}
assert.equal(projection.createsCanonicalKnowledgeRelationship, false);

console.log("PASS VerifyLayersFinalAcceptance");
