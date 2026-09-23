import { readFileSync } from "node:fs";
import {
  commitOverviewSelection,
  NO_OVERVIEW_SELECTION,
  overviewAuthorityEpoch,
  resolveOverviewSelection,
  type OverviewSelection,
  type OverviewSelectionAuthority,
  type OverviewSelectionLibrary,
} from "../../src/workspace/surfaces/overview/OverviewEndStateModel.ts";
import { InvestigationLibraryStatus } from "../../src/investigation/frontDoor/FrontDoorProjectionTypes.ts";

function assert(value: unknown, message: string): asserts value { if (!value) throw new Error(`VERIFY FAILED: ${message}`); }
let passes = 0;
function pass(message: string) { console.log(`PASS ${++passes} — ${message}`); }
const source = (path: string) => readFileSync(new URL(path, import.meta.url), "utf8");
const authority = (principalId: string, revision = 1): OverviewSelectionAuthority => Object.freeze({ kind: "ACCOUNT", principalId, establishedAt: "2026-01-01T00:00:00.000Z", revision });
const ready = (investigationId = "case:one"): OverviewSelectionLibrary => Object.freeze({ status: InvestigationLibraryStatus.READY, summaries: Object.freeze([Object.freeze({ investigationId, title: "Owned case" })]) });

const app = source("../../src/App.tsx");
assert(app.includes("Learn the iSEES research flow, then enter LIBRARY"), "OVERVIEW left panel is not orientational");
assert(app.includes("Browsing, intake, previews, and investigation management are owned by LIBRARY"), "OVERVIEW right panel does not disclose the Library boundary");
for (const component of ["LayersLaboratoryNavigator", "TimelineNavigator", "IntentionNavigator", "InvestigationControl", "LayersExperimentalIntelligence", "TimelineInspector", "IntentionInspector", "RightPanel"]) assert(app.includes(component), `${component} branch was removed`);
assert(/<InvestigationLibraryRuntimeProvider>[\s\S]*<OverviewSelectionProvider>[\s\S]*<OperatorLayout \/>/.test(app), "all OVERVIEW slots do not share the mode-local owners");
assert((app.match(/<InvestigationLibraryRuntimeProvider>/g) ?? []).length === 1 && app.includes("mode === WorkspaceMode.OVERVIEW || mode === WorkspaceMode.LIBRARY"), "shared preview provider is not bounded to OVERVIEW/LIBRARY");
pass("OVERVIEW orientation panels and shared Library preview ownership are explicit while existing branches remain");

const layout = source("../../src/layout/MainLayout.tsx");
assert(layout.includes('overviewMode ? "Orientation"') && layout.includes('overviewMode ? "Overview Boundary"'), "OVERVIEW orientation labels are absent");
assert(layout.includes("enter Library for operational investigation work"), "front-door Library direction is absent");
assert(layout.includes("!studioMode") && !layout.includes("overviewMode && <Research"), "Research Inbox shell visibility expanded into OVERVIEW");
pass("MainLayout labels OVERVIEW without changing Studio suppression");

const accountA = authority("account:A");
const accountB = authority("account:B");
const accountARevision = authority("account:A", 2);
const canon: OverviewSelection = Object.freeze({ kind: "CANON_EVENT", eventId: "E-TICTAC-2004", title: "Nimitz Carrier Strike Group Encounters", year: "2004", location: "Pacific", classification: "MILITARY SENSOR ENCOUNTER", vectors: Object.freeze(["vector"]) });
const owned: OverviewSelection = Object.freeze({ kind: "OWNED_INVESTIGATION", investigationId: "case:one", title: "Owned case" });
const epochA = overviewAuthorityEpoch(accountA);
const canonEnvelope = commitOverviewSelection(epochA, epochA, canon);
assert(canonEnvelope !== null && resolveOverviewSelection(canonEnvelope, accountA, ready()) === canon, "valid same-authority selection was rejected");
assert(resolveOverviewSelection(canonEnvelope, accountB, ready()) === NO_OVERVIEW_SELECTION, "Account A selection appeared under Account B");
assert(resolveOverviewSelection(canonEnvelope, accountARevision, ready()) === NO_OVERVIEW_SELECTION, "authority revision retained selection");
assert(resolveOverviewSelection(canonEnvelope, null, ready()) === NO_OVERVIEW_SELECTION, "removed authority exposed selection");
assert(commitOverviewSelection(epochA, overviewAuthorityEpoch(accountB), canon) === null, "stale queued setter repopulated selection");
pass("authority transitions synchronously fail closed and stale captured epochs are rejected");

const ownedEnvelope = commitOverviewSelection(epochA, epochA, owned);
assert(ownedEnvelope !== null && resolveOverviewSelection(ownedEnvelope, accountA, ready("case:one")) === owned, "current owned summary was rejected");
assert(resolveOverviewSelection(ownedEnvelope, accountA, ready("case:other")) === NO_OVERVIEW_SELECTION, "removed owned summary remained selected");
const loading = Object.freeze({ status: InvestigationLibraryStatus.LOADING, summaries: Object.freeze([]) });
assert(resolveOverviewSelection(ownedEnvelope, accountA, loading) === NO_OVERVIEW_SELECTION, "non-ready library exposed owned selection");
pass("owned selection is reconciled against the current hardened public summaries");

for (const selection of [canon, owned, Object.freeze({ kind: "EXTERNAL_REPOSITORY", name: "AARO", capability: "REFERENCE", note: "Public reference orientation only." }) as OverviewSelection]) {
  const serialized = JSON.stringify(selection);
  assert(!/principal|authority|credential|token|request|generation|error|callback|adapter|runtime/i.test(serialized), "selection leaked non-presentation data");
}
pass("selection variants contain public presentation data only");

const center = source("../../src/workspace/surfaces/OverviewWorkspace.tsx");
assert(center.includes("Enter Library") && center.includes("Bring Your Own Case"), "Overview entry actions are absent");
assert(!/selectCanonEvent|selectRepository|OverviewInspector|GuestCaseIntake/.test(center), "Overview retains operational catalog, inspector, or intake");
pass("Overview center is orientation-only and routes operational work to Library");

const model = source("../../src/workspace/surfaces/overview/OverviewEndStateModel.ts");
assert(model.includes('"E-TICTAC-2004", "E-ROOSEVELT-2015", "E-RENDLESHAM-1980"'), "hydrated Canon IDs changed");
assert(!model.match(/Nuremberg/i) && ["REFERENCE", "EXTERNAL READING", "PLANNED"].every(label => model.includes(label)), "Canon or repository truth regressed");
pass("Canon and repository truth remains exact");

console.log(`\nAll ${passes} OVERVIEW panel ownership invariants passed.`);
