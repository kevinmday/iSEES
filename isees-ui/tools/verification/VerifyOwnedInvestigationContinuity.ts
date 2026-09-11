/* eslint-disable @typescript-eslint/no-explicit-any -- wire-shape corruption fixtures intentionally cross static type boundaries */
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import ts from "typescript";
import { AccountWorkspaceContinuityCoordinator } from "../../src/investigation/continuity/AccountWorkspaceContinuityCoordinator.ts";
import { ContinuityError, materializeOwnedActivation, parseOwnedActivationAggregate } from "../../src/investigation/continuity/OwnedInvestigationContinuity.ts";
import type { AccountContinuityApi } from "../../src/investigation/continuity/AccountContinuityApi.ts";
import { ResearchBridgeRuntime } from "../../src/research/ResearchBridgeRuntime.ts";
import { researchInboxGraphEntryTitle } from "../../src/manifold/components/ResearchInboxPresentation.ts";
import type { ResearchGraphAnchor } from "../../src/research/researchBridgeTypes.ts";

const aggregate = (id: string, revision = 0) => ({
  activationSchemaVersion: "owned-investigation-activation/v1", investigationId: id, title: "Empty Study", objective: null,
  lifecycle: "ACTIVE", createdAt: "2026-09-08T00:00:00Z", modifiedAt: "2026-09-08T00:00:00Z", version: revision,
  aggregateSchemaVersion: "investigation-aggregate/v1", aggregateState: "EMPTY", aggregateRevision: revision,
  access: { kind: "RESEARCHER_OWNED" }, operationalState: { kind: "EMPTY", workspaceId: `workspace:${id}`, focusedEventId: null, nodes: [], edges: [] },
  freshnessToken: `${revision}:${revision}`,
});
const adopted = (id: string) => ({ ...aggregate(id, 1), title: "Adopted Study", aggregateState: "ADOPTED", operationalState: {
  kind: "ADOPTED", workspaceId: `workspace:${id}`, schemaVersion: "guest-investigation-adoption/v1",
  source: { kind: "GUEST_SESSION", guestInvestigationId: "guest-1", snapshotCreatedAt: "2026-09-07T00:00:00Z", snapshotUpdatedAt: "2026-09-07T01:00:00Z" },
  title: "Adopted Study", objective: null,
  workspace: { sourceWorkspaceId: "guest-workspace", nodes: [
    { id: "event-1", kind: "CANONICAL_EVENT", canonicalEventId: "event-1", title: "Canonical event" },
    { id: "note-1", kind: "NOTE", canonicalEventId: null, title: "Note" },
  ], edges: [{ id: "edge-1", sourceId: "event-1", targetId: "note-1", kind: "SUPPORTS" }] },
  researchInbox: [{ anchorId: "anchor-1", order: 0, title: "Saved event", canonicalSourceId: "event-1" }],
  artifacts: [{ artifactId: "artifact-1", kind: "NOTE", title: "Finding", content: "Saved", canonicalSourceIds: ["event-1"] }],
  viewState: { activeMode: "MANIFOLD", focusedEventId: "event-1", activeLayers: ["TEMPORAL"], temporalContext: "1945", investigativeScale: "fleet" },
}, freshnessToken: "1:1" });

const liveLegacyAdopted = (id: string) => {
  const canonical = ["E-TICTAC-2004", "E-ROOSEVELT-2015", "E-RENDLESHAM-1980"];
  const nodes = [
    { id: "system:event:E-TICTAC-2004", kind: "NOTE", canonicalEventId: null, title: "Nimitz Tic Tac Encounter" },
    { id: "system:event:E-ROOSEVELT-2015", kind: "CANONICAL_EVENT", canonicalEventId: canonical[1], title: "USS Roosevelt encounters" },
    { id: "system:event:E-RENDLESHAM-1980", kind: "CANONICAL_EVENT", canonicalEventId: canonical[2], title: "Rendlesham Forest Incident" },
    { id: "system:entity:an-apg-79-aesa-radar", kind: "NOTE", canonicalEventId: null, title: "AN/APG-79 AESA Radar" },
    ...Array.from({ length: 12 }, (_, index) => ({ id: `system:entity:support-${index + 1}`, kind: "NOTE", canonicalEventId: null, title: `Supporting node ${index + 1}` })),
    { id: canonical[0], kind: "CANONICAL_EVENT", canonicalEventId: canonical[0], title: canonical[0] },
  ];
  const originalIds = nodes.slice(0, 16).map(node => node.id);
  const edges = Array.from({ length: 13 }, (_, index) => ({ id: `edge-${index + 1}`, sourceId: originalIds[index]!, targetId: originalIds[index + 1]!, kind: "RELATED" }));
  return { ...aggregate(id, 1), title: "Nimitz Research", aggregateState: "ADOPTED", operationalState: {
    kind: "ADOPTED", workspaceId: `workspace:${id}`, schemaVersion: "guest-investigation-adoption/v1",
    source: { kind: "GUEST_SESSION", guestInvestigationId: "guest-live", snapshotCreatedAt: "2026-09-07T00:00:00Z", snapshotUpdatedAt: "2026-09-07T01:00:00Z" },
    title: "Nimitz Research", objective: null, workspace: { sourceWorkspaceId: "guest-live-workspace", nodes, edges },
    researchInbox: [{ anchorId: "research:an-apg-79", order: 0, title: "system:entity:an-apg-79-aesa-radar", canonicalSourceId: "NODE:system:entity:an-apg-79-aesa-radar" }], artifacts: [],
    viewState: { activeMode: "MANIFOLD", focusedEventId: canonical[0], activeLayers: [], temporalContext: null, investigativeScale: null },
  }, freshnessToken: "1:1" };
};

assert.throws(() => parseOwnedActivationAggregate({ ...aggregate("i"), activationSchemaVersion: "v2" }, "i"), /invalid/);
assert.throws(() => parseOwnedActivationAggregate(aggregate("foreign"), "i"), /invalid/);
assert.throws(() => parseOwnedActivationAggregate({ ...aggregate("i"), operationalState: { ...aggregate("i").operationalState, nodes: [{}] } }, "i"), /invalid/);
assert.equal(parseOwnedActivationAggregate(adopted("adopted"), "adopted").aggregateState, "ADOPTED");
assert.throws(() => parseOwnedActivationAggregate({ ...adopted("i"), operationalState: { ...adopted("i").operationalState, workspace: { ...adopted("i").operationalState.workspace, edges: [{ id: "edge-1", sourceId: "missing", targetId: "note-1", kind: "SUPPORTS" }] } } }, "i"), /invalid/);
assert.throws(() => parseOwnedActivationAggregate({ ...adopted("i"), operationalState: { ...adopted("i").operationalState, viewState: { ...adopted("i").operationalState.viewState, activeMode: "STUDIO" } } }, "i"), /invalid/);
assert.throws(() => parseOwnedActivationAggregate({ ...adopted("i"), operationalState: { ...adopted("i").operationalState, unexplained: true } }, "i"), /invalid/);
const liveParsed = parseOwnedActivationAggregate(liveLegacyAdopted("inv_232d12918a204a029c51f781ca18c6dc"), "inv_232d12918a204a029c51f781ca18c6dc");
const liveMaterialized = materializeOwnedActivation(liveParsed);
const liveGraph = liveMaterialized.investigation.revisions[0]!.manifold.graph;
assert.equal(liveGraph.nodes.length, 16, "legacy disconnected alias is collapsed without changing original topology");
assert.equal(liveGraph.edges.length, 13); assert.equal(liveGraph.statistics.eventCount, 3);
assert.equal(liveGraph.nodes.find(node => node.id === "system:event:E-TICTAC-2004")?.metadata.canonicalEventId, "E-TICTAC-2004");
assert.equal(liveGraph.nodes.some(node => node.id === "E-TICTAC-2004"), false, "synthetic canonical alias is absent after normalization");
assert.equal(liveMaterialized.investigation.workspace.focused_event_id, "E-TICTAC-2004"); assert.equal(liveMaterialized.activeMode, "MANIFOLD");
assert.equal(liveMaterialized.researchDesk.entries.length, 1); assert.equal(liveMaterialized.researchDesk.entries[0]!.anchor.display.title, "AN/APG-79 AESA Radar"); assert.equal(liveMaterialized.researchDesk.entries[0]!.anchor.graph?.type, "NODE");
assert.equal(liveMaterialized.researchDesk.entries[0]!.anchor.graph?.id, "system:entity:an-apg-79-aesa-radar");
assert.equal(liveMaterialized.researchDesk.entries[0]!.anchor.sourceIdentity, "NODE:system:entity:an-apg-79-aesa-radar", "typed canonical source remains identity, not presentation");
const typedPlaceholder = liveLegacyAdopted("typed-placeholder"); typedPlaceholder.operationalState.researchInbox[0] = { ...typedPlaceholder.operationalState.researchInbox[0]!, title: "NODE:system:entity:an-apg-79-aesa-radar" };
assert.equal(materializeOwnedActivation(parseOwnedActivationAggregate(typedPlaceholder, "typed-placeholder")).researchDesk.entries[0]!.anchor.display.title, "AN/APG-79 AESA Radar", "typed canonical source is repaired as a technical placeholder");
const blankPlaceholder = liveLegacyAdopted("blank-placeholder"); blankPlaceholder.operationalState.researchInbox[0] = { ...blankPlaceholder.operationalState.researchInbox[0]!, title: "   " };
assert.equal(materializeOwnedActivation(parseOwnedActivationAggregate(blankPlaceholder, "blank-placeholder")).researchDesk.entries[0]!.anchor.display.title, "AN/APG-79 AESA Radar", "blank legacy title resolves through exact graph identity");
const readablePersisted = liveLegacyAdopted("readable-title"); readablePersisted.operationalState.researchInbox[0] = { ...readablePersisted.operationalState.researchInbox[0]!, title: "Researcher radar note" };
assert.equal(materializeOwnedActivation(parseOwnedActivationAggregate(readablePersisted, "readable-title")).researchDesk.entries[0]!.anchor.display.title, "Researcher radar note", "valid persisted human title is preserved");
const edgePlaceholder = liveLegacyAdopted("edge-title"); edgePlaceholder.operationalState.researchInbox[0] = { ...edgePlaceholder.operationalState.researchInbox[0]!, title: "edge-1", canonicalSourceId: "EDGE:edge-1" };
const edgeEntry = materializeOwnedActivation(parseOwnedActivationAggregate(edgePlaceholder, "edge-title")).researchDesk.entries[0]!;
assert.equal(edgeEntry.anchor.display.title, "Nimitz Tic Tac Encounter related USS Roosevelt encounters", "EDGE placeholder resolves through its exact validated edge and endpoint presentation");
assert.deepEqual(edgeEntry.anchor.graph, { type: "EDGE", id: "edge-1" });
const missingReference = liveLegacyAdopted("missing-reference"); missingReference.operationalState.researchInbox[0] = { ...missingReference.operationalState.researchInbox[0]!, canonicalSourceId: "NODE:missing" };
assert.throws(() => parseOwnedActivationAggregate(missingReference, "missing-reference"), /invalid/, "missing typed reference is rejected rather than guessed");
const ambiguousReference = liveLegacyAdopted("ambiguous-reference"); ambiguousReference.operationalState.workspace.edges[0] = { ...ambiguousReference.operationalState.workspace.edges[0]!, id: "system:entity:an-apg-79-aesa-radar" }; ambiguousReference.operationalState.researchInbox[0] = { ...ambiguousReference.operationalState.researchInbox[0]!, canonicalSourceId: "system:entity:an-apg-79-aesa-radar" };
assert.throws(() => parseOwnedActivationAggregate(ambiguousReference, "ambiguous-reference"), /invalid/, "ambiguous untyped reference is rejected rather than guessed");
const connectedAlias = liveLegacyAdopted("ambiguous"); connectedAlias.operationalState.workspace.edges[0] = { ...connectedAlias.operationalState.workspace.edges[0]!, sourceId: "E-TICTAC-2004" };
assert.throws(() => parseOwnedActivationAggregate(connectedAlias, "ambiguous"), /invalid/, "connected legacy aliases are rejected, not guessed");
const inboxReferencedAlias = liveLegacyAdopted("inbox-ambiguous"); inboxReferencedAlias.operationalState.researchInbox[0] = { ...inboxReferencedAlias.operationalState.researchInbox[0]!, canonicalSourceId: "NODE:E-TICTAC-2004" };
assert.throws(() => parseOwnedActivationAggregate(inboxReferencedAlias, "inbox-ambiguous"), /invalid/, "Inbox-referenced aliases are not treated as disconnected compatibility aliases");

let principal = "acct_a"; let pending: ((value: never) => void) | undefined; let notFound = false; let malformed = false;
const api: AccountContinuityApi = {
  async restoreSession() { return { researcherId: principal, email: `${principal}@test`, sessionExpiresAt: "2026-09-09T00:00:00Z" }; },
  async fetchActivation(id) {
    if (notFound) throw new ContinuityError("INVESTIGATION_NOT_FOUND", "missing");
    if (malformed) throw new ContinuityError("ACTIVATION_INVALID", "malformed");
    if (id === "late") return await new Promise(resolve => { pending = resolve; });
    if (id === "adopted") return parseOwnedActivationAggregate(adopted(id), id);
    return parseOwnedActivationAggregate(aggregate(id), id);
  },
  async logout() {},
};
const values = new Map<string, string>();
const store = { read: (account: string) => values.get(account) ?? null, write: (account: string, id: string) => { values.set(account, id); } };
let subordinate = "sensitive"; const teardown = { clearAccountState() { subordinate = ""; } };
let activeInvestigation: unknown;
let adoptedActivation: any; let restoredDesk: any;
const workspace = {
  deactivate() { activeInvestigation = undefined; },
  activateEmptyOwnedInvestigation(investigation: unknown) { activeInvestigation = investigation; },
  activateAdoptedOwnedInvestigation(activation: unknown) { adoptedActivation = activation; activeInvestigation = (activation as any).investigation; },
  activateOwnedInvestigation(activation: any, install: () => void) { adoptedActivation = activation; activeInvestigation = activation.investigation; install(); },
  getActiveInvestigation() { return activeInvestigation as { id: string; workspace: { focused_event_id: null; imported_events: unknown[]; active_layers: unknown[] } } | undefined; },
  getActiveWorkspace() { return this.getActiveInvestigation()?.workspace; },
  getComputationalConfiguration() { return { activeLayers: this.getActiveWorkspace()?.active_layers ?? [] }; },
};
const coordinator = new AccountWorkspaceContinuityCoordinator(api, workspace, store, [teardown]);

await coordinator.restoreSession();
const receipt = await coordinator.openOwnedInvestigation("owned-empty");
assert.equal(receipt.code, "ACTIVATION_READY");
assert.equal(workspace.getActiveInvestigation()?.id, "owned-empty");
assert.equal(workspace.getActiveWorkspace()?.focused_event_id, null);
assert.deepEqual(workspace.getActiveWorkspace()?.imported_events, []);
assert.deepEqual(workspace.getComputationalConfiguration().activeLayers, []);
assert.equal(store.read("acct_a"), "owned-empty"); assert.equal(subordinate, "");

const researchOwner = { clearAccountState() {}, activateOwnedInvestigation(activation: any) { restoredDesk = activation.researchDesk; } };
const adoptedCoordinator = new AccountWorkspaceContinuityCoordinator(api, workspace, store, [researchOwner]);
await adoptedCoordinator.restoreSession(); const adoptedReceipt = await adoptedCoordinator.openOwnedInvestigation("adopted");
assert.equal(adoptedReceipt.investigationId, "adopted", "reload uses the returned server investigation ID");
assert.equal(adoptedActivation.activeMode, "MANIFOLD"); assert.equal(adoptedActivation.investigation.workspace.focused_event_id, "event-1");
assert.deepEqual(adoptedActivation.investigation.workspace.active_layers, ["TEMPORAL"]); assert.equal(adoptedActivation.temporalContext, "1945");
assert.deepEqual(adoptedActivation.investigation.revisions[0].manifold.graph.nodes.map((node: any) => node.id), ["event-1", "note-1"]);
assert.equal(restoredDesk.entries[0].anchor.anchorId, "anchor-1"); assert.equal(restoredDesk.entries[0].anchor.investigationId, "adopted");

// Production composition boundary: the same runtime classes used by the React
// providers receive one coordinator transaction, and the dock's projection API
// observes the selected Investigation's replacement desk.
let liveFailure = false;
let resolveLiveLate: ((aggregate: ReturnType<typeof parseOwnedActivationAggregate>) => void) | undefined;
const liveApi: AccountContinuityApi = {
  async restoreSession() { return { researcherId: "live-account", email: "live@test", sessionExpiresAt: "2026-09-09T00:00:00Z" }; },
  async fetchActivation(id) {
    if (liveFailure) throw new ContinuityError("ACTIVATION_INVALID", "malformed");
    if (id === "late-live") return await new Promise(resolve => { resolveLiveLate = resolve; });
    return parseOwnedActivationAggregate(id === "nimitz" ? liveLegacyAdopted(id) : aggregate(id), id);
  },
  async logout() {},
};
const liveStoreValues = new Map<string, string>();
const liveStore = { read: (account: string) => liveStoreValues.get(account) ?? null, write: (account: string, id: string) => { liveStoreValues.set(account, id); } };
const createProductionBoundaryWorkspace = () => {
  let activation: any;
  return {
    deactivate() { activation = undefined; },
    activateOwnedInvestigation(next: any, install: () => void) { const previous = activation; activation = next; try { install(); } catch (error) { activation = previous; throw error; } },
    getActiveInvestigation() { return activation?.investigation; },
    getActiveMode() { return activation?.activeMode; },
  };
};
const productionWorkspace = createProductionBoundaryWorkspace();
const productionResearch = new ResearchBridgeRuntime();
const authorOwner = { clearAccountState() {}, activateOwnedInvestigation() {} };
const productionCoordinator = new AccountWorkspaceContinuityCoordinator(liveApi, productionWorkspace, liveStore, [productionResearch, authorOwner]);
await productionCoordinator.restoreSession();
await productionCoordinator.openOwnedInvestigation("nimitz");
let dockProjection = productionResearch.projectInvestigation({ investigationId: productionWorkspace.getActiveInvestigation()?.id });
assert.equal(productionWorkspace.getActiveMode(), "MANIFOLD");
assert.equal(dockProjection.entries.length, 1, "mounted MANIFOLD dock owner observes count 1");
assert.equal(dockProjection.entries[0]!.anchor.display.title, "AN/APG-79 AESA Radar");
assert.deepEqual(dockProjection.entries[0]!.anchor.graph, { type: "NODE", id: "system:entity:an-apg-79-aesa-radar" });
const restoredNodeAnchor = dockProjection.entries[0]!.anchor as ResearchGraphAnchor;
assert.equal(researchInboxGraphEntryTitle(restoredNodeAnchor), "AN/APG-79 AESA Radar", "restored NODE renders its display title at the instrument boundary");
assert.notEqual(researchInboxGraphEntryTitle(restoredNodeAnchor), restoredNodeAnchor.graph.id, "a valid display title prevents the internal graph ID becoming the primary label");
assert.deepEqual(restoredNodeAnchor.graph, { type: "NODE", id: "system:entity:an-apg-79-aesa-radar" }, "presentation preserves deterministic graph identity");
const wrongOwnershipResearch = new ResearchBridgeRuntime();
wrongOwnershipResearch.restoreDesk({ entries: [{ ...dockProjection.entries[0]!, anchor: { ...restoredNodeAnchor, investigationId: "foreign-investigation" } }] });
assert.equal(wrongOwnershipResearch.projectInvestigation({ investigationId: "nimitz" }).entries.length, 0, "incorrect Research Inbox ownership cannot enter the active Investigation projection");

const edgeAnchor = {
  ...restoredNodeAnchor,
  anchorId: "research:edge",
  display: { ...restoredNodeAnchor.display, title: "Nimitz sensor association" },
  graph: { type: "EDGE", id: "edge-4" },
} as ResearchGraphAnchor;
assert.equal(researchInboxGraphEntryTitle(edgeAnchor), "Nimitz sensor association", "EDGE entries retain human-readable display titles");
assert.deepEqual(edgeAnchor.graph, { type: "EDGE", id: "edge-4" });

const legacyUntitledAnchor = {
  ...restoredNodeAnchor,
  display: { ...restoredNodeAnchor.display, title: "   " },
} as ResearchGraphAnchor;
assert.equal(researchInboxGraphEntryTitle(legacyUntitledAnchor), "NODE system:entity:an-apg-79-aesa-radar", "deterministic graph fallback applies when the display title is absent");
assert.equal(researchInboxGraphEntryTitle({ ...restoredNodeAnchor, display: { ...restoredNodeAnchor.display, title: "Guest radar note" } }), "Guest radar note", "guest-created graph entries render their supplied display title");
await productionCoordinator.openOwnedInvestigation("empty-owned");
assert.equal(productionResearch.projectInvestigation({ investigationId: "empty-owned" }).entries.length, 0, "empty owned activation replaces the live Inbox");
await productionCoordinator.openOwnedInvestigation("nimitz");
assert.equal(productionResearch.projectInvestigation({ investigationId: "nimitz" }).entries.length, 1, "switching back restores only Nimitz's Inbox");
liveFailure = true;
await assert.rejects(() => productionCoordinator.openOwnedInvestigation("empty-owned"));
liveFailure = false;
assert.equal(productionResearch.projectInvestigation({ investigationId: "nimitz" }).entries.length, 1, "failed activation cannot clear the live Inbox");
const lateLive = productionCoordinator.openOwnedInvestigation("late-live");
await productionCoordinator.openOwnedInvestigation("nimitz");
resolveLiveLate?.(parseOwnedActivationAggregate(aggregate("late-live"), "late-live"));
await assert.rejects(lateLive, (error: unknown) => error instanceof ContinuityError && error.code === "ACTIVATION_STALE");
assert.equal(productionResearch.projectInvestigation({ investigationId: "nimitz" }).entries.length, 1, "stale activation cannot overwrite the live Inbox");

// Hard reload restoration follows the same coordinator transaction into fresh
// production runtime owners.
liveStore.write("live-account", "nimitz");
const reloadWorkspace = createProductionBoundaryWorkspace();
const reloadResearch = new ResearchBridgeRuntime();
const reloadCoordinator = new AccountWorkspaceContinuityCoordinator(liveApi, reloadWorkspace, liveStore, [reloadResearch, authorOwner]);
await reloadCoordinator.restoreSession(); await reloadCoordinator.restoreLastActiveInvestigation();
dockProjection = reloadResearch.projectInvestigation({ investigationId: reloadWorkspace.getActiveInvestigation()?.id });
assert.equal(dockProjection.entries.length, 1); assert.equal(dockProjection.entries[0]!.anchor.display.title, "AN/APG-79 AESA Radar");

const appSource = readFileSync(new URL("../../src/App.tsx", import.meta.url), "utf8");
const contextSource = readFileSync(new URL("../../src/research/ResearchBridgeContext.tsx", import.meta.url), "utf8");
const dockSource = readFileSync(new URL("../../src/manifold/components/ResearchInboxInstrument.tsx", import.meta.url), "utf8");
const workspaceSource = readFileSync(new URL("../../src/workspace/runtime/WorkspaceRuntime.ts", import.meta.url), "utf8");
const frontDoorSource = readFileSync(new URL("../../src/account/AccountFrontDoor.tsx", import.meta.url), "utf8");
const frontDoorCss = readFileSync(new URL("../../src/account/AccountFrontDoor.css", import.meta.url), "utf8");
const mainLayoutSource = readFileSync(new URL("../../src/layout/MainLayout.tsx", import.meta.url), "utf8");
assert.equal((appSource.match(/<ResearchBridgeProvider>/g) ?? []).length, 1, "production provider identity is singular");
assert.match(contextSource, /runtime:\s*researchBridgeRuntime/, "provider publishes the singleton live Research owner");
assert.match(dockSource, /useResearchBridge\(\)/, "MANIFOLD dock consumes that provider owner");
assert.match(dockSource, /researchInboxGraphEntryTitle\(entry\.anchor\)/, "graph entry JSX renders through the verified title projection");
assert.doesNotMatch(dockSource, /<div style=\{\{ marginTop: 3, overflowWrap: "anywhere", color: "#e2e8f0", fontSize: 11 \}\}>\s*\{entry\.anchor\.graph\.id\}/, "instrument does not render the raw graph ID as its primary visible label");
assert.match(workspaceSource, /installAccountState\(\);[\s\S]*this\.notify\(\)/, "Workspace publishes only after live account owners install");
function verifyAuthenticatedComposition(source: string): void {
  const sourceFile = ts.createSourceFile("AccountFrontDoor.tsx", source, ts.ScriptTarget.Latest, true, ts.ScriptKind.TSX);
  let shell: ts.JsxElement | undefined;
  const visit = (node: ts.Node): void => {
    if (ts.isJsxElement(node) && node.openingElement.tagName.getText(sourceFile) === "div" && node.openingElement.attributes.properties.some(property => ts.isJsxAttribute(property) && property.name.getText(sourceFile) === "className" && property.initializer?.getText(sourceFile) === '"account-authenticated-shell"')) shell = node;
    ts.forEachChild(node, visit);
  };
  visit(sourceFile);
  assert(shell, "missing authenticated Account shell boundary");
  const directElements = shell.children.filter(ts.isJsxElement);
  const accountBar = shell.children.find(child => ts.isJsxSelfClosingElement(child) && child.tagName.getText(sourceFile) === "AccountBar") as ts.JsxSelfClosingElement | undefined;
  assert(accountBar, "authenticated Account shell must own AccountBar");
  assert(accountBar.attributes.properties.some(property => ts.isJsxAttribute(property) && property.name.getText(sourceFile) === "activeInvestigationId" && property.initializer?.getText(sourceFile) === "{activeInvestigationId}"), "AccountBar must receive active-investigation continuity");
  const workspaceBoundary = directElements.find(element => element.openingElement.attributes.properties.some(property => ts.isJsxAttribute(property) && property.name.getText(sourceFile) === "className" && property.initializer?.getText(sourceFile) === '"account-authenticated-shell__workspace"'));
  assert(workspaceBoundary, "authenticated Account shell must own workspace boundary");
  assert(workspaceBoundary.children.some(child => ts.isJsxExpression(child) && child.expression?.getText(sourceFile) === "children"), "workspace boundary must retain active workspace children");
}
verifyAuthenticatedComposition(frontDoorSource);
assert.throws(() => verifyAuthenticatedComposition(frontDoorSource.replace('className="account-authenticated-shell"', 'className="removed-shell"')), /missing authenticated Account shell boundary/, "negative control detects a missing authenticated Account shell boundary");
assert.throws(() => verifyAuthenticatedComposition(frontDoorSource.replace(' activeInvestigationId={activeInvestigationId}', '')), /active-investigation continuity/, "negative control detects missing active-investigation continuity");
assert.match(frontDoorCss, /\.account-authenticated-shell \{[^}]*height:100vh[^}]*display:grid[^}]*grid-template-rows:auto minmax\(0,1fr\)[^}]*overflow:hidden/, "authenticated shell owns one viewport with intrinsic Account Bar and bounded workspace row");
assert.match(frontDoorCss, /\.account-authenticated-shell__workspace \{[^}]*min-height:0[^}]*overflow:hidden/, "workspace row remains shrinkable without page scrolling");
assert.match(mainLayoutSource, /height: "100%"/, "MainLayout fills its parent");
assert.doesNotMatch(mainLayoutSource, /height: "100vh"/, "MainLayout does not add a second viewport height");
assert.equal((mainLayoutSource.match(/<WorkspaceModeBar \/>/g) ?? []).length, 1, "Mode Bar remains mounted exactly once inside MainLayout");
assert.match(mainLayoutSource, /flex: 1,[\s\S]*minHeight: 0,[\s\S]*overflow: "hidden"/, "bounded workspace retains internal flex sizing");
assert.match(mainLayoutSource, /overflowY: "auto"/, "workspace panels retain internal scrolling");
assert.match(frontDoorSource, /identityState\.identity\?\.kind === "GUEST"[\s\S]*<GuestBar/, "Guest composition remains distinct");
assert.match(frontDoorSource, /if \(!principal\) return <AnonymousDoor/, "anonymous Front Door remains distinct");

const before = workspace.getActiveInvestigation();
malformed = true; await assert.rejects(() => coordinator.openOwnedInvestigation("malformed")); malformed = false;
assert.equal(workspace.getActiveInvestigation(), before, "failed fetch preserves valid state");

store.write("acct_a", "missing"); notFound = true;
assert.equal(await coordinator.restoreLastActiveInvestigation(), null);
assert.equal(workspace.getActiveInvestigation(), undefined, "missing remembered item leaves no active Investigation");
notFound = false; store.write("acct_a", "owned-empty"); principal = "acct_b";
await coordinator.restoreSession();
assert.equal(workspace.getActiveInvestigation(), undefined, "account switch tears down old workspace first");
assert.equal(store.read("acct_b"), null, "last active is account scoped");

principal = "acct_a"; await coordinator.restoreSession();
const late = coordinator.openOwnedInvestigation("late");
principal = "acct_b"; await coordinator.restoreSession();
pending?.(parseOwnedActivationAggregate(aggregate("late"), "late") as never);
await assert.rejects(late, (error: unknown) => error instanceof ContinuityError && error.code === "ACTIVATION_STALE");
assert.equal(workspace.getActiveInvestigation(), undefined, "late prior-account response cannot activate");

await coordinator.openOwnedInvestigation("b-owned"); await coordinator.logout("csrf");
assert.equal(workspace.getActiveInvestigation(), undefined); assert.equal(coordinator.getState().code, "AUTHENTICATION_REQUIRED");

console.log("PASS VerifyOwnedInvestigationContinuity");
