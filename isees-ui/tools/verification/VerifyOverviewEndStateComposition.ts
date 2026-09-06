import { readFileSync } from "node:fs";
import { CANON_PRESENTATION_VISUAL, OVERVIEW_REPOSITORIES, projectHydratedOverviewEvents, resolveOverviewCompositionKind } from "../../src/workspace/surfaces/overview/OverviewEndStateModel.ts";
import { resolveOverviewFrontDoorProjection } from "../../src/investigation/frontDoor/FrontDoorProjection.ts";
import { FrontDoorIdentityKind, FrontDoorPersistenceCapability, GuestRestorableWorkStatus, InvestigationLibraryStatus } from "../../src/investigation/frontDoor/FrontDoorProjectionTypes.ts";

function assert(value: unknown, message: string): asserts value { if (!value) throw new Error(`VERIFY FAILED: ${message}`); }
let passes = 0;
function pass(message: string) { passes += 1; console.log(`PASS ${passes} — ${message}`); }
function projection(kind: "GUEST" | "ACCOUNT", status: "NOT_REQUESTED" | "EMPTY" | "READY", summaries: readonly { investigationId: string; title: string }[] = []) {
  return resolveOverviewFrontDoorProjection({ identity: { kind: kind === "GUEST" ? FrontDoorIdentityKind.GUEST : FrontDoorIdentityKind.ACCOUNT, persistence: kind === "GUEST" ? FrontDoorPersistenceCapability.SESSION : FrontDoorPersistenceCapability.PERSISTENT }, library: { status, summaries }, guestRestorableWork: { status: GuestRestorableWorkStatus.NONE }, activeInvestigation: { claimsOwnedByIdentity: false }, caseGateway: { canonCards: [], repositories: [] } });
}

const cards = projectHydratedOverviewEvents();
assert(cards.map(card => card.eventId).join(",") === "E-TICTAC-2004,E-ROOSEVELT-2015,E-RENDLESHAM-1980", "live corpus did not project exactly the three hydrated records");
assert(!JSON.stringify(cards).includes("NUREMBERG"), "registry-only Nuremberg was promoted");
assert(projectHydratedOverviewEvents([]).length === 0, "missing runtime events were manufactured by presentation");
pass("cards derive from the hydrated production corpus and omit registry-only cases");

assert(CANON_PRESENTATION_VISUAL.evidence === null && CANON_PRESENTATION_VISUAL.provenance === null, "presentation visual entered evidence or provenance");
assert(cards.every(card => !("image" in card) && !("provenance" in card) && !("evidence" in card)), "canonical card data owns presentation imagery");
pass("shared presentation visual is isolated from canonical, evidence, and provenance data");

assert(OVERVIEW_REPOSITORIES.every(item => ["REFERENCE", "EXTERNAL READING", "PLANNED"].includes(item.state)), "repository capability was overstated");
assert(!JSON.stringify(OVERVIEW_REPOSITORIES).match(/partner|integrated|import supported/i), "repository copy implies unsupported integration");
pass("external repositories remain informational and truthfully labelled");

assert(resolveOverviewCompositionKind(projection("GUEST", "NOT_REQUESTED")) === "GUEST_GATEWAY", "Fresh Guest composition is wrong");
assert(resolveOverviewCompositionKind(projection("ACCOUNT", "EMPTY")) === "NEW_ACCOUNT_GATEWAY", "New Account composition is wrong");
assert(resolveOverviewCompositionKind(projection("ACCOUNT", "READY", [{ investigationId: "investigation:owned", title: "Owned case" }])) === "RETURNING_ACCOUNT", "Returning Account composition is wrong");
assert(resolveOverviewCompositionKind(projection("ACCOUNT", "NOT_REQUESTED")) === "ACCOUNT_UNRESOLVED", "unresolved Account composition is wrong");
assert(resolveOverviewCompositionKind(null) === "CLOSED", "unsettled authority did not fail closed");
pass("Guest, New Account, Returning Account, and unresolved compositions are distinct");

const overviewSource = readFileSync(new URL("../../src/workspace/surfaces/GuestWelcomeOverview.tsx", import.meta.url), "utf8");
assert((overviewSource.match(/<CanonCard key=/g) ?? []).length === 1 && overviewSource.includes("aria-pressed={selected}"), "canonical selection is not an operable production control");
assert(overviewSource.includes("useOverviewSelection") && overviewSource.includes("Import remains a separate action in the Case Library"), "shared selection/import boundary is not visible");
assert(!overviewSource.includes("activateInvestigation") && !overviewSource.includes("importInvestigation"), "browsing calls import or activation");
assert(/<button type="button" disabled>Create Empty Investigation/.test(overviewSource), "planned investigation creation is enabled");
assert(!overviewSource.includes("function CanonInspector") && !overviewSource.includes("useState"), "center retained a private selection owner or duplicate inspector");
pass("selection is shared preview, import stays explicit elsewhere, the duplicate inspector is absent, and empty creation is disabled");

const app = readFileSync(new URL("../../src/App.tsx", import.meta.url), "utf8");
assert(app.includes("mode === WorkspaceMode.OVERVIEW") && app.includes("InvestigationLibraryRuntimeProvider"), "OVERVIEW provider boundary is absent");
for (const mode of ["MANIFOLD", "COMPARE", "NARRATIVE", "EVIDENCE", "TIMELINE", "LAYERS", "INTENTION", "STUDIO"]) {
  assert(!app.includes(`mode === WorkspaceMode.${mode}\n                              ? (\n                                <InvestigationLibraryRuntimeProvider>`), `${mode} entered the library provider boundary`);
}
pass("non-OVERVIEW routes remain outside the investigation-library composition boundary");
console.log(`\nAll ${passes} OVERVIEW end-state composition invariants passed.`);
