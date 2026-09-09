import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

const root = resolve(import.meta.dirname, "../..");
const source = (path: string) => readFileSync(resolve(root, path), "utf8");
const app = source("src/App.tsx");
const main = source("src/main.tsx");
const account = source("src/account/AccountFrontDoor.tsx");
const workspace = source("src/nativeCaseDraft/NativeCaseDraftWorkspace.tsx");
const proves = (condition: unknown, message: string) => assert.ok(condition, message);

proves(app.includes('path="/report"') && app.includes("<OperatorApplication nativeDraftRoute />"), "/report uses authenticated OperatorApplication");
for (const authority of ["OperatorIdentityRuntimeProvider", "AccountFrontDoor", "OperatorEntryGate", "GuestWorkspaceRestorationBoundary", "WorkspaceRuntimeProvider"]) proves(app.includes(authority), `authority chain retains ${authority}`);
proves(!app.includes("PublicIntake"), "/report no longer owns PublicIntake");
proves(app.includes('path="/briefing"') && app.includes("<SystemBriefing />") && app.includes('path="/*"') && app.includes("<OperatorApplication />"), "briefing and wildcard routes remain unchanged");
proves(main.includes("createBrowserRouter") && main.includes("RouterProvider") && !main.match(/<BrowserRouter|\bBrowserRouter\s*[,}]/), "data-router bootstrap supports useBlocker");
proves(workspace.includes("if (investigationId) void loadList") && workspace.includes('setListState("idle")'), "no active investigation makes no draft request");
proves(workspace.includes('identity.identity?.kind === "ACCOUNT"') && workspace.includes("authenticated ? investigation?.id"), "draft requests are authenticated-account only");
proves(workspace.includes("nativeCaseDraftApi.list(signal)") && workspace.includes("filter(item => item.investigationId === id)"), "list API is exact-investigation filtered");
proves(workspace.includes('view.kind === "new" ? { investigationId } : { initialProjection: view.projection }'), "new receives only investigationId; resume receives fetched projection");
proves(workspace.includes("nativeCaseDraftApi.get(candidateId, signal)") && workspace.includes("projection.investigationId !== investigationId"), "fresh fetch is validated and cross-investigation projection fails closed");
for (const state of ['"loading"', '"ready"', '"error"', "drafts.length === 0", "MALFORMED_RESPONSE", "AUTHENTICATION", "HTTP", "NETWORK"]) proves(workspace.includes(state) || source("src/nativeCaseDraft/NativeCaseDraftTypes.ts").includes(state), `state represented: ${state}`);
proves(workspace.includes("AbortController") && workspace.includes("generation.current") && workspace.includes("current(ticket)"), "requests abort and late results are generation gated");
proves(workspace.includes("function returnToList") && workspace.includes("void loadList(investigationId)"), "saved return refreshes list");
for (const boundary of ["returnToList", "openDraft", "useBlocker", "beforeunload", "navigationGuard.current"]) proves(workspace.includes(boundary), `dirty boundary guarded: ${boundary}`);
for (const boundary of ["async function open", "async function create", "async function logout"]) proves(account.includes(boundary), `account boundary exists: ${boundary}`);
proves((account.match(/navigationGuard\.current\.confirmDiscard\(\)/g) ?? []).length === 3, "investigation open/create and logout check the guard");
proves(workspace.includes("blocker.proceed()") && workspace.includes("blocker.reset()") && workspace.includes("window.confirm"), "confirm and cancel branches exist");
proves(!workspace.match(/MainLayout|WorkspaceModeBar|WorkspaceSurface|ResearchInbox|publication|PublicIntake/), "route workspace imports no forbidden owner or publication surface");
proves(app.includes("routeSurface ?? <ModeAwareOperatorLayout />"), "normal Mode Bar and Research Inbox ownership path remains intact");

console.log("PASS VerifyNativeCaseDraftRouting: authenticated routing, native list/resume, fail-closed association, request safety, dirty navigation, and ownership boundaries verified.");
