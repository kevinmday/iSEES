import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { captureGuestAdoptionCandidate } from "../../src/account/GuestInvestigationAdoption.ts";

const root = new URL("../../src/", import.meta.url);
const transition = readFileSync(new URL("account/AccountFrontDoor.tsx", root), "utf8");
const adoption = readFileSync(new URL("account/GuestInvestigationAdoption.ts", root), "utf8");
const api = readFileSync(new URL("account/AccountFrontDoorApi.ts", root), "utf8");
const continuity = readFileSync(new URL("investigation/continuity/AccountWorkspaceContinuityCoordinator.ts", root), "utf8");

function has(source: string, pattern: RegExp, message: string) { assert.match(source, pattern, message); }

has(transition, /session\.investigation \? guestWorkspaceSessionLifecycle\.captureNow\(\) : null/, "empty/public-preview Guest must not produce a candidate");
has(transition, /captureGuestAdoptionCandidate\(snapshot\)/, "active candidate must be captured before authentication");
has(transition, /guestWorkspaceSessionLifecycle\.stop\(\).*freeze/s, "candidate must be frozen without deletion");
has(transition, /onContinueAsGuest=\{preservation\.current\.candidate \? cancelAuthentication/, "pre-auth cancellation must restore Guest continuity");
has(transition, /preservation\.current\.authenticated\(\).*setPhase\("ready"\)/s, "authentication must await a decision");
has(transition, /AWAITING_DECISION.*PRESERVING.*RECOVERABLE_ERROR/s, "decision and recovery states must render explicitly");
has(transition, /Preserve investigation/, "preserve action missing");
has(transition, /Continue without preserving/, "explicit discard action missing");
assert.doesNotMatch(transition, /localStorage|document\.cookie\s*=/, "transition must not store tokens or weaken cookies");
has(adoption, /credentials: "include"/, "adoption must include credentials");
has(adoption, /"X-ISEES-CSRF": csrf/, "adoption must include CSRF authority");
assert.doesNotMatch(adoption, /researcherId|accountId|ownerId/, "adoption request must omit client owner fields");
has(adoption, /idempotencyKey/, "candidate must freeze an idempotency key");
has(adoption, /if \(this\.#pending \|\| !this\.#candidate\) return/, "duplicate submission must be suppressed");
has(adoption, /epoch !== this\.#epoch \|\| candidate !== this\.#candidate/, "stale completion must be rejected");
has(adoption, /signal\?: AbortSignal/, "adoption transport must support aborts");
has(adoption, /this\.#phase = "RECOVERABLE_ERROR"/, "failures must terminate recoverably");
has(adoption, /nodeId\.startsWith\("system:event:"\)/, "canonical domain IDs must resolve through the system event graph namespace");
has(adoption, /kind: canonicalEventId \? "CANONICAL_EVENT" : "NOTE", canonicalEventId, title:/, "the real graph node must retain canonical event identity");
assert.doesNotMatch(adoption, /nodes\.push\(\{ id: canonicalId/, "future captures must not manufacture disconnected canonical aliases");
has(adoption, /Some canonical investigation events cannot be preserved safely/, "unrepresented canonical events must fail instead of creating aliases");

const canonicalIds = ["E-TICTAC-2004", "E-ROOSEVELT-2015", "E-RENDLESHAM-1980"];
const graphNodes = [
  ...canonicalIds.map((id, index) => ({ id: `system:event:${id}`, label: ["Nimitz Tic Tac Encounter", "USS Roosevelt encounters", "Rendlesham Forest Incident"][index], type: "EVENT", metadata: {} })),
  ...Array.from({ length: 13 }, (_, index) => ({ id: index === 0 ? "system:entity:an-apg-79-aesa-radar" : `system:entity:support-${index}`, label: index === 0 ? "AN/APG-79 AESA Radar" : `Supporting node ${index}`, type: "NARRATIVE", metadata: {} })),
];
const graphEdges = Array.from({ length: 13 }, (_, index) => ({ id: `edge-${index + 1}`, source: graphNodes[index]!.id, target: graphNodes[index + 1]!.id, relationship: "ASSOCIATED_WITH", weight: 1, rationale: [] }));
const workspace = { id: "guest-workspace", name: "Nimitz Research", description: "", imported_events: canonicalIds.map(event_id => ({ event_id, source: "SYSTEM_CANON" })), focused_event_id: canonicalIds[0], investigations: [], artifacts: [], active_layers: [], created_at: "2026-09-07T00:00:00Z" };
const captured = captureGuestAdoptionCandidate({
  schemaVersion: "guest-workspace-session/v1", createdAt: "2026-09-07T00:00:00Z", updatedAt: "2026-09-07T01:00:00Z",
  workspace: { investigation: { id: "guest-live", name: "Nimitz Research", description: "", createdAt: "2026-09-07T00:00:00Z", updatedAt: "2026-09-07T01:00:00Z", createdBy: "GUEST", status: "ACTIVE", workspace, currentRevisionId: "REV-0001", revisions: [{ id: "REV-0001", revisionNumber: 1, timestamp: "2026-09-07T01:00:00Z", operator: "GUEST", branch: "MAIN", message: "fixture", manifold: { id: "fixture", timestamp: "2026-09-07T01:00:00Z", algorithmVersion: "fixture", activeLayers: [], graph: { nodes: graphNodes, edges: graphEdges, statistics: {} } } }] }, workspace, operator: { activeMode: "MANIFOLD" }, computational: { activeLayers: [], temporalContext: undefined, investigativeScale: undefined } },
  research: { desk: { entries: [{ order: 0, anchor: { anchorId: "research:an-apg-79", sourceIdentity: "NODE:system:entity:an-apg-79-aesa-radar", display: { title: "system:entity:an-apg-79-aesa-radar" } } }] } }, authoring: { activeDocument: undefined },
} as never, "future-write-fixture")!;
assert.equal(captured.command.workspace.nodes.length, 16, "future capture preserves the original node topology");
assert.equal(captured.command.workspace.edges.length, 13, "future capture preserves the original edge topology");
assert.deepEqual((captured.command.workspace.nodes as any[]).filter(node => node.kind === "CANONICAL_EVENT").map(node => [node.id, node.canonicalEventId]), canonicalIds.map(id => [`system:event:${id}`, id]));
assert.equal((captured.command.workspace.nodes as any[]).some(node => canonicalIds.includes(node.id)), false, "future capture adds no domain-ID alias nodes");
assert.deepEqual(captured.command.researchInbox, [{ anchorId: "research:an-apg-79", order: 0, title: "AN/APG-79 AESA Radar", canonicalSourceId: "NODE:system:entity:an-apg-79-aesa-radar" }], "future capture replaces an exact NODE technical placeholder with its graph title");
has(transition, /activation\.investigationId !== receipt\.investigationId/, "returned owned identity must be validated");
has(transition, /openOwnedInvestigation\(receipt\.investigationId\)/, "activation must use the server investigation ID through continuity");
const activationAt = transition.indexOf("coordinator.openOwnedInvestigation(receipt.investigationId)");
const clearAt = transition.indexOf("clearGuestWorkspaceSession();", activationAt);
assert.ok(activationAt >= 0 && clearAt > activationAt, "Guest state may clear only after continuity-owned activation");
has(continuity, /logout\(csrfToken/, "sign-out must use normal account continuity");
has(api, /credentials: "include"/, "account requests must remain credentialed");
assert.doesNotMatch(`${transition}\n${adoption}\n${api}`, /Access-Control-Allow-Origin|SameSite|Secure\s*=/, "client must not weaken cookie/CORS policy");
has(transition, /role="dialog".*aria-modal="true".*aria-labelledby=/s, "decision must be accessible and labelled");

console.log("VerifyGuestInvestigationAdoption: PASS (30 front-door preservation invariants)");
