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
assert(app.includes("mode === WorkspaceMode.OVERVIEW\n    ? <OverviewCaseIntake />"), "OVERVIEW does not route left to OverviewCaseIntake");
assert(app.includes("mode === WorkspaceMode.OVERVIEW\n    ? <OverviewInspector />"), "OVERVIEW does not route right to OverviewInspector");
for (const component of ["LayersLaboratoryNavigator", "TimelineNavigator", "IntentionNavigator", "InvestigationControl", "LayersExperimentalIntelligence", "TimelineInspector", "IntentionInspector", "RightPanel"]) assert(app.includes(component), `${component} branch was removed`);
assert(/<InvestigationLibraryRuntimeProvider>[\s\S]*<OverviewSelectionProvider>[\s\S]*<OperatorLayout \/>/.test(app), "all OVERVIEW slots do not share the mode-local owners");
assert((app.match(/<InvestigationLibraryRuntimeProvider>/g) ?? []).length === 1 && app.includes("mode === WorkspaceMode.OVERVIEW"), "library provider is not OVERVIEW-only");
pass("OVERVIEW panel routing and mode-local provider ownership are explicit while existing branches remain");

const layout = source("../../src/layout/MainLayout.tsx");
assert(layout.includes('overviewMode ? "Case Intake"') && layout.includes('overviewMode ? "Overview Inspector"'), "OVERVIEW instrument labels are absent");
assert(layout.includes("Inspect public Canon records, repository orientation, and owned investigation summaries"), "front-door inspection description is absent");
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

const center = source("../../src/workspace/surfaces/GuestWelcomeOverview.tsx");
assert(!center.includes("useState") && !center.includes("function CanonInspector"), "center still owns selection or duplicate Canon inspector");
assert(center.includes("overview.selectCanonEvent") && center.includes("overview.selectRepository"), "center cards do not publish shared selection");
assert(!/activateInvestigation|importInvestigation|setWorkspaceMode/.test(center), "center selection imports, activates, or changes mode");
assert(/<button type="button" disabled>Create Empty Investigation/.test(center), "Create Empty Investigation is enabled");
pass("center selection is shared, non-mutating, and has no duplicate inspector");

const model = source("../../src/workspace/surfaces/overview/OverviewEndStateModel.ts");
assert(model.includes('"E-TICTAC-2004", "E-ROOSEVELT-2015", "E-RENDLESHAM-1980"'), "hydrated Canon IDs changed");
assert(!model.match(/Nuremberg/i) && ["REFERENCE", "EXTERNAL READING", "PLANNED"].every(label => model.includes(label)), "Canon or repository truth regressed");
pass("Canon and repository truth remains exact");

console.log(`\nAll ${passes} OVERVIEW panel ownership invariants passed.`);
