import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { CANONICAL_EVENTS } from "../../src/canonical/runtimeCorpus.ts";
import { adaptSystemCanonToKnowledge } from "../../src/knowledge/ingestion/SystemCanonKnowledgeAdapter.ts";
import type { Investigation } from "../../src/investigation/investigationTypes.ts";
import { adaptFocusedEventTimelineSourceRecords } from "../../src/timeline/projection/TimelineSourceRecordAdapter.ts";
import { projectTimelineTemporal } from "../../src/timeline/projection/TimelineTemporalProjection.ts";
import { presentTimelinePrecision, presentTimelineTemporalValue } from "../../src/timeline/presentation/TimelineTemporalPresentation.ts";
import { TimelineCompositionKind, resolveTimelineComposition } from "../../src/timeline/presentation/TimelineComposition.ts";
import { ResearchAnchorType } from "../../src/research/researchBridgeTypes.ts";

const surface = readFileSync("src/surfaces/WorkspaceSurface.tsx", "utf8");
const component = readFileSync("src/timeline/components/TimelineWorkspace.tsx", "utf8");
const css = readFileSync("src/timeline/components/TimelineWorkspace.css", "utf8");
const adapter = readFileSync("src/timeline/projection/TimelineSourceRecordAdapter.ts", "utf8");
const presentation = readFileSync("src/timeline/presentation/TimelineTemporalPresentation.ts", "utf8");
const combined = `${component}\n${adapter}\n${presentation}`;

assert.match(surface, /case WorkspaceMode\.TIMELINE:[\s\S]*?<TimelineWorkspace\s*\/>/);
assert.doesNotMatch(surface, /case WorkspaceMode\.TIMELINE:[\s\S]{0,160}<PlaceholderSurface/);
assert.match(surface, /from "\.\.\/timeline\/components\/TimelineWorkspace"/);
assert.doesNotMatch(combined, /Nimitz|TIC TAC|TICTAC|Rendlesham/i);
assert.match(component, /runtime\.getActiveInvestigation\(\)/);
assert.match(component, /investigation\?\.workspace\.focused_event_id/);
assert.match(component, /projectTimelineTemporal/);
assert.match(component, /projection\.focusedItems\.map/);
for (const token of ["INSTANT", "DATE", "INTERVAL", "OPEN_INTERVAL", "DURATION", "SEQUENCE", "UNKNOWN", "Approximate", "Inferred", "Disputed", "Date only", "Sequence only"]) assert.ok(presentation.includes(token), `missing explicit presentation: ${token}`);
assert.match(component, /NO_TEMPORAL_RECORDS/);
assert.doesNotMatch(component, /1970-01-01/);
assert.doesNotMatch(adapter, /investigation\.createdAt|workspace\.created_at/);
assert.doesNotMatch(adapter, /artifact.*created_at|created_at.*artifact/i);
assert.doesNotMatch(adapter, /Date\.parse|match\([^)]*eventId|split\([^)]*eventId|substring\([^)]*eventId/);
assert.match(component, /inspection\?\.investigationId === projection\.investigationId/);
assert.match(component, /inspection\.focusedEventId === projection\.focusedEventId/);
assert.match(component, /useEffect\(\(\) => \{ setInspection\(undefined\); \}, \[investigation\?\.id, focusedEventId\]\)/);
assert.doesNotMatch(component, /setSelection|clearSelection/);
assert.doesNotMatch(component, /ResearchBridge|publish|createAnchor/);
assert.deepEqual(Object.keys(ResearchAnchorType).sort(), ["CANDIDATE", "EDGE", "EXPERIMENT", "NODE"]);
assert.doesNotMatch(surface, /activeMode ===\s*WorkspaceMode\.TIMELINE/);
assert.equal(resolveTimelineComposition(0), TimelineCompositionKind.FOCUSED_ONLY);
assert.equal(resolveTimelineComposition(1), TimelineCompositionKind.PAIRWISE);
assert.equal(resolveTimelineComposition(2), TimelineCompositionKind.MULTI_EVENT_OVERVIEW);
assert.equal(resolveTimelineComposition(3), TimelineCompositionKind.MULTI_EVENT_OVERVIEW);
for (const invalidCount of [-1, 0.5, Number.NaN, Number.POSITIVE_INFINITY, Number.MAX_SAFE_INTEGER + 1]) {
  assert.throws(() => resolveTimelineComposition(invalidCount));
}
assert.match(component, /const qualifiedComparisonCount = 0/);
assert.match(component, /resolveTimelineComposition\(qualifiedComparisonCount\)/);
assert.doesNotMatch(component, /imported_events\.length/);
assert.doesNotMatch(component, /resolveCompareCandidateOptionProjection|resolveComparePairProjection|resolveCandidateIntelligenceCollection/);
assert.doesNotMatch(component, /comparison panel|compared timeline|compared-event|multi-event overview/i);
assert.doesNotMatch(component, /comparedItems\.map|comparisonItems\.map/);
assert.match(css, /@media\(max-width:760px\).*grid-template-columns:minmax\(0,1fr\)/);
assert.match(component, /<button type="button" aria-pressed=\{selected\} onClick=\{onInspect\}>/);
assert.match(css, /button\[aria-pressed=true\]/);
assert.match(css, /button:focus-visible/);
assert.match(css, /@media\(prefers-reduced-motion:reduce\)/);

const eventId = "E-TICTAC-2004";
const knowledge = adaptSystemCanonToKnowledge(CANONICAL_EVENTS.filter(event => event.event_id === eventId));
const graph = { nodes: [{ id: "system:event:E-TICTAC-2004", label: eventId, type: "EVENT" as const }], edges: [], statistics: { nodeCount: 1, edgeCount: 0, eventCount: 1, facilityCount: 0, artifactCount: 0, personCount: 0, organizationCount: 0, locationCount: 0, narrativeCount: 0, hypothesisCount: 0 } };
const investigation: Investigation = { id: "INV-I2", name: "Dynamic Investigation", description: "", createdAt: "2026-01-01T00:00:00Z", updatedAt: "2026-01-01T00:00:00Z", createdBy: "verify", status: "ACTIVE", workspace: { id: "WS-I2", name: "", description: "", imported_events: [{ event_id: eventId, source: "SYSTEM_CANON" }], focused_event_id: eventId, investigations: [], artifacts: [], active_layers: [], created_at: "2026-01-01T00:00:00Z" }, currentRevisionId: "REV-I2", revisions: [{ id: "REV-I2", revisionNumber: 1, timestamp: "2026-01-01T00:00:00Z", operator: "verify", branch: "MAIN", message: "", manifold: { id: "M-I2", timestamp: "2026-01-01T00:00:00Z", algorithmVersion: "1", activeLayers: [], graph } }] };
const records = adaptFocusedEventTimelineSourceRecords(investigation, knowledge);
assert.equal(records.length, 1);
assert.equal(records[0]!.temporal.kind, "DURATION");
assert.equal(records[0]!.semantic, "OCCURRENCE");
assert.equal(records[0]!.precision, "APPROXIMATE");
const projection = projectTimelineTemporal({ investigation, knowledgeObjects: knowledge, records });
assert.equal(projection.status, "READY");
if (projection.status === "READY") {
  assert.deepEqual(projection.focusedItems.map(item => item.itemId), records.map(item => item.itemId));
  assert.equal(presentTimelineTemporalValue(projection.focusedItems[0]!.temporal), "300 minutes");
  assert.equal(presentTimelinePrecision(projection.focusedItems[0]!), "Approximate");
  assert.notEqual(presentTimelineTemporalValue(projection.focusedItems[0]!.temporal), projection.focusedItems[0]!.orderKey);
}
const emptyKnowledge = knowledge.map(object => object.type === "EVENT" ? { ...object, payload: { source: "SYSTEM_CANON", sourceKind: "CANONICAL_REPLAY_EVENT", canonicalEvent: {} } } : object);
assert.equal(adaptFocusedEventTimelineSourceRecords(investigation, emptyKnowledge).length, 0);
assert.equal(projectTimelineTemporal({ investigation, knowledgeObjects: emptyKnowledge, records: [] }).status, "NO_TEMPORAL_RECORDS");
assert.equal(Object.isFrozen(records), true);
assert.equal(Object.isFrozen(records[0]), true);

console.log("PASS VerifyTimelineFocusedWorkspace — production focused TIMELINE ownership and presentation verified");
