import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const panel = readFileSync(new URL("../../src/components/RightPanel.tsx", import.meta.url), "utf8");
const css = readFileSync(new URL("../../src/components/SelectionIntelligence.css", import.meta.url), "utf8");
let passed = 0;
const prove = (proof: () => void) => { proof(); passed += 1; };
const body = (name: string, next: string) => {
  const start = panel.indexOf(`function ${name}`);
  const end = panel.indexOf(`function ${next}`, start + 1);
  assert(start >= 0 && end > start, `${name} boundary is missing.`);
  return panel.slice(start, end);
};

const empty = body("EmptySelection", "ClusterInspector");
const candidate = body("CandidateInspector", "CandidateDimensionRow");
const cluster = body("ClusterInspector", "SelectionTypeIdentity");
const node = body("NodeInspector", "EdgeInspector");
const edge = body("EdgeInspector", "MetricAvailabilityRow");

prove(() => {
  assert(empty.includes("Nothing selected") && empty.includes("Inspector ready"));
  for (const marker of ["Supporting evidence", "Related entities", "Deterministic basis", "Provenance"]) assert(!empty.includes(marker));
});

prove(() => {
  for (const marker of ["Selected node", "Why it matters", "Related entities", "Supporting evidence", "Provenance", "Deterministic basis", "Restrictions"]) assert(node.includes(marker), marker);
});

prove(() => {
  for (const marker of ["Selected edge", "Endpoint profiles", "Relationship meaning", "Supporting evidence", "Provenance", "Deterministic basis", "Metrics", "Deterministic rationale", "Restrictions"]) assert(edge.includes(marker), marker);
});

prove(() => {
  assert(node.includes("entity.relationships.items.map") && node.includes("Investigation role"));
  assert(edge.includes("const [source, target]") && edge.includes("Graph weight"));
  assert(!node.includes("Endpoint profiles") && !edge.includes("Related entities"));
});

prove(() => {
  assert(node.includes("NON-CANONICAL / REVIEW ONLY"));
  assert(node.includes("Candidate Evidence requires researcher review"));
});

prove(() => {
  assert(panel.includes('availability.status === "AVAILABLE" ? format(availability.value) : "UNAVAILABLE"'));
  assert(edge.includes('format={value => String(value)}'));
  assert(panel.includes('formatMetricAvailability(availability)'));
});

prove(() => {
  assert(node.includes("hiddenRelationships > 0"));
  assert(node.includes("additional relationship"));
});

prove(() => {
  for (const marker of ["overflow-wrap: anywhere", "word-break: break-word", "min-width: 0"]) assert(css.includes(marker), marker);
  assert(css.includes(".selection-intelligence__entity-card strong") && css.includes(".selection-intelligence__endpoint-meta"));
});

prove(() => {
  assert(!node.includes("MetadataRows"));
  assert(!edge.includes("MetadataRows"));
  assert(panel.includes("describeLineage") && panel.includes("Supplied fields:"));
});

prove(() => {
  assert(candidate.includes("CandidateInspector"));
  assert(cluster.includes("Cluster selected") && cluster.includes("Cluster intelligence projection"));
  assert(panel.includes("selectedCandidateIntelligence") && /graphIntelligence\.kind\s*===\s*"CLUSTER"/.test(panel));
});

prove(() => {
  assert(panel.includes('<RexExploreControl selectionBinding={graphIntelligence.kind === "NONE" ? undefined : graphIntelligence.binding} />'));
  assert(!node.includes("RexExploreControl") && !edge.includes("RexExploreControl"));
});

prove(() => {
  for (const forbidden of ["ResearchBridgeRuntime", "useResearchBridge", "createAnchor(", "createAnchorsAtomically", "publishRexDiscoveriesAtomically"]) assert(!panel.includes(forbidden), forbidden);
  assert(panel.includes("Double-click: add to Research Inbox"), "Existing graph interaction guidance must remain present.");
});

prove(() => {
  assert(panel.includes("No Selection Intelligence evaluator or equation is claimed."));
  assert(panel.includes("No evaluator definition or equation is registered here."));
  assert(!node.includes("JSON.stringify") && !edge.includes("JSON.stringify"));
});

prove(() => {
  assert(panel.includes("const selectionScrollIdentity = selectedCandidateIntelligence === undefined"));
  for (const identity of [
    '`NODE:${graphIntelligence.intelligence.nodeId}`',
    '`EDGE:${graphIntelligence.intelligence.edgeId}`',
    '`CLUSTER:${graphIntelligence.clusterId}`',
    '"CANDIDATE"',
    "selectedCandidateIntelligence.identity.candidateId",
    "selectedCandidateIntelligence.identity.evaluationId",
    "selectedCandidateIntelligence.identity.leftKnowledgeObjectId",
    "selectedCandidateIntelligence.identity.rightKnowledgeObjectId",
    '"NONE"',
  ]) assert(panel.includes(identity), identity);
  assert(panel.includes("useLayoutEffect(() =>"));
  assert(panel.includes('[selectionScrollIdentity]'));
  assert(panel.includes('closest(\n      ".selection-intelligence__body"'));
  assert(panel.includes("scrollContainer.scrollTop = 0"));
  const scrollResetStart = panel.indexOf("const selectionScrollIdentity");
  const scrollResetEnd = panel.indexOf("  // RENDER", scrollResetStart);
  assert(scrollResetStart >= 0 && scrollResetEnd > scrollResetStart);
  const scrollReset = panel.slice(scrollResetStart, scrollResetEnd);
  assert(!scrollReset.includes("currentRevisionId"));
  assert(!scrollReset.includes("currentRevisionGraph"));
  assert(!scrollReset.includes("governedDossier"));
  assert(!scrollReset.includes("projectionFingerprint"));
});

prove(() => {
  for (const marker of ["GOVERNED ENTITY DOSSIER", "Operational Summary", "Event-Specific Role", "Capabilities", "Limitations", "Specifications", "Systems", "Platform and Organization", "Service History / Chronology", "Official External References", "Sources and Fact-Level Lineage", "Technical Governance Metadata", "Projection fingerprint"]) assert(node.includes(marker), marker);
  for (const marker of ["GLOBAL ENTITY FACT", "HISTORICALLY BOUNDED FACT", "Encounter-specific claim", "section.availabilityFields"]) assert(node.includes(marker), marker);
  assert(node.includes("entity.governedDossier"));
  assert(panel.includes("dossier.operationalProfile.sections.map") && panel.includes("Source lineage") && panel.includes("fact.applicability"));
  for (const forbidden of ["fetch(", "Tavily", "WebDiscovery", "invokeRex", "CandidateEvidence", "ResearchBridgeRuntime"]) assert(!node.includes(forbidden), forbidden);
});

console.log(`P57-REX-SELECTION-I2C/I2D/I3B right-panel verification passed (${passed}/15 proofs).`);
