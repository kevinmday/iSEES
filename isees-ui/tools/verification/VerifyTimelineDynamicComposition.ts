import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { resolveTimelineComposition, TimelineCompositionKind } from "../../src/timeline/presentation/TimelineComposition.ts";
import { projectTimelineCorrespondences } from "../../src/timeline/projection/TimelineCorrespondenceProjection.ts";
import type { TimelineTemporalItem } from "../../src/timeline/projection/TimelineTemporalProjectionTypes.ts";
import { CANONICAL_EVENTS } from "../../src/canonical/runtimeCorpus.ts";
import { adaptSystemCanonToKnowledge } from "../../src/knowledge/ingestion/SystemCanonKnowledgeAdapter.ts";
import { resolveTimelineEventTitle } from "../../src/timeline/presentation/TimelineEventPresentation.ts";

const app = readFileSync("src/App.tsx", "utf8");
const workspace = readFileSync("src/timeline/components/TimelineWorkspace.tsx", "utf8");
const navigator = readFileSync("src/timeline/components/TimelineNavigator.tsx", "utf8");
const inspector = readFileSync("src/timeline/components/TimelineInspector.tsx", "utf8");
const context = readFileSync("src/timeline/context/TimelineInspectionContext.tsx", "utf8");
const adapter = readFileSync("src/timeline/projection/TimelineSourceRecordAdapter.ts", "utf8");
const correspondence = readFileSync("src/timeline/projection/TimelineCorrespondenceProjection.ts", "utf8");
const css = readFileSync("src/timeline/components/TimelineWorkspace.css", "utf8");
const researchTypes = readFileSync("src/research/researchBridgeTypes.ts", "utf8");
const mainLayout = readFileSync("src/layout/MainLayout.tsx", "utf8");
const eventPresentation = readFileSync("src/timeline/presentation/TimelineEventPresentation.ts", "utf8");
const typedResearchAdapters = readFileSync("src/studio/sources/TypedResearchSourceAdapters.ts", "utf8");
const directResearchPublication = readFileSync("src/studio/sources/DirectResearchPublication.ts", "utf8");

assert.equal(resolveTimelineComposition({ qualifiedComparisonCount: 0, selectedComparisonAvailable: false, overviewRequested: true }), TimelineCompositionKind.FOCUSED_ONLY);
assert.equal(resolveTimelineComposition({ qualifiedComparisonCount: 1, selectedComparisonAvailable: true, overviewRequested: true }), TimelineCompositionKind.PAIRWISE);
assert.equal(resolveTimelineComposition({ qualifiedComparisonCount: 2, selectedComparisonAvailable: false, overviewRequested: true }), TimelineCompositionKind.MULTI_EVENT_OVERVIEW);
assert.equal(resolveTimelineComposition({ qualifiedComparisonCount: 3, selectedComparisonAvailable: true, overviewRequested: false }), TimelineCompositionKind.PAIRWISE);
assert.equal(resolveTimelineComposition({ qualifiedComparisonCount: 3, selectedComparisonAvailable: true, overviewRequested: true }), TimelineCompositionKind.MULTI_EVENT_OVERVIEW);
assert.doesNotMatch(context, /imported_events\.length/);
assert.match(context, /resolveCurrentInvestigationExecution/);
assert.match(context, /resolveCandidateIntelligenceCollection/);
assert.match(context, /resolveCompareCandidateOptionProjection/);
assert.match(context, /runtime\.setSelection\(option\.selection\)/);
assert.match(context, /setOverviewRequested\(true\)/);
assert.match(context, /setInspection\(undefined\)/);
assert.match(context, /\[investigation\?\.id, focusedEventId\]/);
assert.match(app, /mode === WorkspaceMode\.TIMELINE[\s\S]*?<TimelineNavigator/);
assert.match(app, /mode === WorkspaceMode\.TIMELINE[\s\S]*?<TimelineInspector/);
assert.match(app, /TimelineInspectionProvider/);
assert.match(workspace, /timeline-workspace__pair/);
assert.match(workspace, /timeline-workspace__overview/);
assert.match(workspace, /role="FOCUSED" items=\{pairReady\.focusedItems\} compact/);
assert.match(workspace, /role="COMPARED" items=\{pairReady\.comparedItems\} compact/);
assert.match(workspace, /presentTimelineTemporalValue\(item\.temporal\)/);
assert.match(workspace, /presentTimelinePrecision\(item\).*presentTimelineSemantic\(item\)/);
assert.match(workspace, /Duration band/);
assert.match(navigator, /Back to Overview/);
assert.doesNotMatch(workspace, />FOCUSED_ONLY<|>PAIRWISE<|>MULTI_EVENT_OVERVIEW</);
assert.doesNotMatch(workspace, /timeline-workspace__inspector/);
assert.match(navigator, /aria-pressed/);
assert.match(navigator, /Candidate comparison; not an accepted relationship/);
assert.match(navigator, /No qualified comparisons yet/);
assert.match(navigator, /OPEN COMPUTE/);
assert.match(navigator, /setActiveMode\(WorkspaceMode\.MANIFOLD\)/);
assert.doesNotMatch(navigator, /execute\(|executeResolve|beginExecution/);
assert.ok(navigator.indexOf("Back to Overview") < navigator.indexOf("Qualified comparisons"));
assert.match(workspace, /INSPECT PAIR/);
assert.match(workspace, /Add sourced temporal evidence in EVIDENCE or inspect another qualified comparison/);
assert.match(inspector, /Research publication unavailable/);
assert.match(inspector, /Technical details and provenance/);
assert.match(inspector, /useResearchBridge/);
assert.match(inspector, /collectTypedResearchSource/);
assert.match(inspector, /timelineMomentResearchAnchor/);
assert.match(inspector, /timelineCorrespondenceResearchAnchor/);
assert.match(inspector, /Add to Research Inbox/);
assert.match(typedResearchAdapters, /sourceWorkspace: "TIMELINE"/);
assert.match(typedResearchAdapters, /sourceIdentity: context\.moment\.itemId/);
assert.match(typedResearchAdapters, /sourceIdentity: context\.correspondence\.correspondenceId/);
assert.match(typedResearchAdapters, /Timeline correspondence is unresolved and is not an accepted relationship/);
assert.match(directResearchPublication, /runtime\.createAnchor\(create\(\)\)/);
for (const forbidden of ["createEdge", "acceptResolveCandidate", "executeResolve", "setActiveLayers"]) assert.doesNotMatch(inspector + typedResearchAdapters + directResearchPublication, new RegExp(forbidden), `Timeline publication does not mutate canonical state: ${forbidden}`);
assert.match(adapter, /adaptEventTimelineSourceRecords/);
assert.match(adapter, /matches\.length === 1/);
assert.doesNotMatch(adapter, /Date\.parse|event_name|node\.label/);
assert.doesNotMatch(correspondence, /EDGE|publish|Research/);
assert.match(css, /@media\(max-width:980px\)/);
assert.match(css, /grid-template-columns:minmax\(0,1fr\)/);
assert.match(css, /minmax\(280px,1\.15fr\)/);
assert.match(css, /overflow-wrap:anywhere/);
assert.match(css, /timeline-workspace__entry--pairwise button\{[^}]*grid-template-columns:minmax\(0,1fr\)/);
assert.match(css, /timeline-workspace__entry--pairwise button\{[^}]*overflow:visible/);
assert.doesNotMatch(css, /timeline-workspace__entry--pairwise[^}]*text-overflow:ellipsis/);
assert.doesNotMatch(css, /timeline-workspace__entry--pairwise[^}]*overflow:hidden/);
assert.match(workspace, /TimelineCompositionKind\.FOCUSED_ONLY[\s\S]*?<EventLane[^>]*role="FOCUSED"/);
assert.match(workspace, /TimelineCompositionKind\.MULTI_EVENT_OVERVIEW[\s\S]*?timeline-workspace__overview/);
assert.match(css, /prefers-reduced-motion:reduce/);
assert.match(mainLayout, /timelineMode[\s\S]*?Inspect temporal records, Event lanes, correspondences, provenance, and supporting evidence/);
assert.match(mainLayout, /Deterministic inspection of the active node, edge, cluster, or Resolve candidate/);
assert.doesNotMatch(eventPresentation, /E-TICTAC|E-RENDLESHAM|E-ROOSEVELT|Nimitz|Rendlesham|Roosevelt/);
assert.equal((researchTypes.match(/NODE|EDGE/g) ?? []).length > 0, true);

const canonicalKnowledge = adaptSystemCanonToKnowledge(CANONICAL_EVENTS);
for (const event of CANONICAL_EVENTS.slice(0, 3)) {
  assert.equal(resolveTimelineEventTitle(event.event_id, canonicalKnowledge), event.event_name);
  const canonicalObject = canonicalKnowledge.find(object => object.type === "EVENT" && object.provenance.sourceId === event.event_id)!;
  const relatedObject = { ...canonicalObject, identity: { ...canonicalObject.identity, id: `related:${event.event_id}` }, type: "FACILITY", metadata: { ...canonicalObject.metadata, title: "Related graph NODE label" } } as typeof canonicalObject;
  assert.equal(resolveTimelineEventTitle(event.event_id, [relatedObject, ...canonicalKnowledge]), event.event_name);
}
assert.equal(resolveTimelineEventTitle("E-MISSING", canonicalKnowledge), "E-MISSING");

const base = Object.freeze({
  investigationId: "INV", semantic: "OCCURRENCE", precision: "APPROXIMATE",
  subject: Object.freeze({ availability: "UNAVAILABLE", reason: "No subject" }),
  provenance: Object.freeze({ sourceType: "TEST", sourceId: "source", sourceField: "duration" }),
  qualification: Object.freeze({ confidence: .5 }), evidenceReferenceIds: Object.freeze([]), mediaReferenceIds: Object.freeze([]),
  orderKey: "5:+0000000000000001:+0000000000000000:~:item", validity: "VALID",
} as const);
const focused = Object.freeze({ ...base, itemId: "focused", eventId: "A", temporal: Object.freeze({ kind: "DURATION", value: 5, unit: "MINUTES" }) }) as TimelineTemporalItem;
const compared = Object.freeze({ ...base, itemId: "compared", eventId: "B", temporal: Object.freeze({ kind: "DURATION", value: 5, unit: "MINUTES" }) }) as TimelineTemporalItem;
const first = projectTimelineCorrespondences([focused], [compared]);
const second = projectTimelineCorrespondences([focused], [compared]);
assert.deepEqual(first, second);
assert.equal(first[0]?.status, "UNRESOLVED");
assert.match(first[0]?.explanation ?? "", /does not establish a relationship/);
const unknown = Object.freeze({ ...compared, itemId: "unknown", temporal: Object.freeze({ kind: "UNKNOWN", reason: "Absent" }), precision: "UNKNOWN" }) as TimelineTemporalItem;
assert.equal(projectTimelineCorrespondences([focused], [unknown])[0]?.status, "UNAVAILABLE");

console.log("PASS VerifyTimelineDynamicComposition — canonical qualified comparison, dynamic composition, mode-aware panels, and deterministic correspondence verified");
