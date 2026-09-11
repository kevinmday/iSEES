import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { CANONICAL_EVENTS } from "../../src/canonical/runtimeCorpus";
import { SystemCanonAdapter } from "../../src/federation/adapters/SystemCanonAdapter";
import type { FederationAdapter } from "../../src/federation/adapters/FederationAdapter";
import { adaptSystemCanonToKnowledge } from "../../src/knowledge/ingestion/SystemCanonKnowledgeAdapter";
import { WorkspaceRuntime } from "../../src/workspace/runtime/WorkspaceRuntime";
import { WorkspaceMode } from "../../src/workspace/runtime/WorkspaceRuntimeTypes";
import { executeOverviewCanonicalActivation } from "../../src/workspace/surfaces/overview/OverviewCanonicalActivationCommand";

const source = (path: string) => readFileSync(path, "utf8");
const inspector = source("src/workspace/surfaces/overview/OverviewInspector.tsx");
const context = source("src/workspace/surfaces/overview/OverviewCanonicalActivationContext.tsx");
const app = source("src/App.tsx");
const service = source("src/federation/services/importInvestigation.ts");
const command = source("src/workspace/surfaces/overview/OverviewCanonicalActivationCommand.ts");
const canonicalBefore = JSON.stringify(CANONICAL_EVENTS);
const knowledge = adaptSystemCanonToKnowledge(CANONICAL_EVENTS);
const systemCanon = new SystemCanonAdapter();

function adapterWithPreview(preview: FederationAdapter["preview"]): FederationAdapter {
  return { repository: systemCanon.repository, load: () => systemCanon.load(), search: request => systemCanon.search(request), preview, import: eventId => systemCanon.import(eventId) };
}

async function verify(): Promise<void> {
  const runtime = new WorkspaceRuntime();
  let publications = 0;
  let guestPersistenceNotifications = 0;
  runtime.subscribe(() => { publications += 1; });
  runtime.subscribe(() => { guestPersistenceNotifications += 1; });
  const outcome = await executeOverviewCanonicalActivation({ adapter: systemCanon, eventId: "E-TICTAC-2004", runtime, admittedKnowledge: knowledge, activationStillCurrent: () => true });
  assert.equal(outcome.status, "SUCCEEDED", "one click did not settle as SUCCEEDED");
  assert.equal(runtime.getWorkspace()?.focused_event_id, "E-TICTAC-2004");
  assert.equal(outcome.status === "SUCCEEDED" ? outcome.result.eventId : undefined, "E-TICTAC-2004", "the command did not return the explicitly requested canonical identity");
  assert.equal(publications, 1, "activation must publish exactly once");
  assert.equal(guestPersistenceNotifications, 1, "existing runtime subscriber path was not notified");
  for (const mode of Object.values(WorkspaceMode)) assert.equal(runtime.getModeAvailability(mode).available, true, `${mode} did not derive availability from the active runtime`);

  let releasePreview!: () => void;
  const previewGate = new Promise<void>(resolve => { releasePreview = resolve; });
  let previewCalls = 0;
  const delayedAdapter = adapterWithPreview(async eventId => { previewCalls += 1; await previewGate; return systemCanon.preview(eventId); });
  const rapidRuntime = new WorkspaceRuntime();
  let pending: ReturnType<typeof executeOverviewCanonicalActivation> | null = null;
  const click = () => pending ??= executeOverviewCanonicalActivation({ adapter: delayedAdapter, eventId: "E-TICTAC-2004", runtime: rapidRuntime, admittedKnowledge: knowledge, activationStillCurrent: () => true }).finally(() => { pending = null; });
  const first = click();
  const second = click();
  assert.equal(first, second, "rapid clicks did not share the pending command");
  releasePreview();
  assert.equal((await first).status, "SUCCEEDED");
  assert.equal(previewCalls, 1, "rapid clicks duplicated intake");

  let failConstruction = true;
  const retryRuntime = new WorkspaceRuntime();
  const retryAdapter = adapterWithPreview(eventId => {
    if (failConstruction) { failConstruction = false; throw new Error("construction failed"); }
    return systemCanon.preview(eventId);
  });
  const failed = await executeOverviewCanonicalActivation({ adapter: retryAdapter, eventId: "E-TICTAC-2004", runtime: retryRuntime, admittedKnowledge: knowledge, activationStillCurrent: () => true });
  assert.equal(failed.status, "ERROR");
  assert.equal(retryRuntime.getActiveInvestigation(), undefined, "failed construction mutated runtime");
  assert.equal((await executeOverviewCanonicalActivation({ adapter: retryAdapter, eventId: "E-TICTAC-2004", runtime: retryRuntime, admittedKnowledge: knowledge, activationStillCurrent: () => true })).status, "SUCCEEDED", "ERROR did not permit retry");

  let current = true;
  let releaseStale!: () => void;
  const staleGate = new Promise<void>(resolve => { releaseStale = resolve; });
  const staleRuntime = new WorkspaceRuntime();
  const stalePromise = executeOverviewCanonicalActivation({ adapter: adapterWithPreview(async eventId => { await staleGate; return systemCanon.preview(eventId); }), eventId: "E-TICTAC-2004", runtime: staleRuntime, admittedKnowledge: knowledge, activationStillCurrent: () => current });
  current = false;
  releaseStale();
  assert.equal((await stalePromise).status, "ERROR", "stale completion did not settle as ERROR");
  assert.equal(staleRuntime.getActiveInvestigation(), undefined, "stale completion activated runtime");

  assert.equal(JSON.stringify(CANONICAL_EVENTS), canonicalBefore, "canonical source input was mutated");
  assert.match(context, /selection\.kind === "CANON_EVENT" \? selection\.eventId : null/, "no-selection state must not fabricate a default event");
  assert.match(context, /const canActivate = selectedEventId !== null/, "activation must require explicit canonical-event selection");
  assert.match(context, /mounted\.current = true[\s\S]*return \(\) => \{[\s\S]*mounted\.current = false/, "StrictMode replay-safe mount acknowledgement is absent");
  assert.match(context, /if \(pending\.current !== null\) return pending\.current/, "production rapid-click promise lock is absent");
  assert.match(context, /status: "STARTING"[\s\S]*status: "SUCCEEDED"[\s\S]*status: "ERROR"/, "pending, success, and failure states must be explicit");
  assert.match(context, /generation\.current \+= 1[\s\S]*feedback\?\.eventId === selectedEventId/, "selection changes must invalidate stale completion UI");
  assert.match(inspector, /<button[\s\S]*type="button"[\s\S]*void activation\.activate\(\)[\s\S]*>Open Event in Workspace<\/button>/, "activation must be an explicit native button with approved copy");
  assert.match(inspector, /Loads a local investigation workspace from this canonical event\. It does not create a saved account investigation\./);
  assert.match(inspector, /aria-describedby="overview-canonical-activation-boundary"/, "the action must expose its local-only boundary accessibly");
  assert.match(app, /<OverviewSelectionProvider>[\s\S]*<OverviewCanonicalActivationProvider>[\s\S]*<OperatorLayout/);
  assert.equal((service.match(/runtime\.activateInvestigation\(/g) ?? []).length, 1);
  assert.equal(command.includes("new WorkspaceRuntime"), false, "activation context must not create a second runtime");
  const activationSource = `${command}\n${service}`;
  assert.doesNotMatch(activationSource, /fetch\s*\(|axios|\.post\s*\(|method:\s*["']POST|localStorage|sessionStorage/, "local intake must not claim network or browser persistence");
  assert.doesNotMatch(activationSource, /ResearchBridge|ResearchInbox|publish[A-Z]\w*\s*\(|executeResolve|ResolveRuntime|setActiveMode|setSelection|selectComparison/i, "activation must not mutate adjacent research, computation, mode, or selection owners");
  assert.doesNotMatch(inspector, /Create Investigation|Save Investigation/, "UI must not claim durable ownership");
  console.log("VerifyOverviewLocalCanonicalActivation: PASS (explicit local intake, exact identity, one publication, stale/failure isolation, accessible status, and non-mutation verified)");
}

void verify().catch(error => { console.error(error); process.exitCode = 1; });
