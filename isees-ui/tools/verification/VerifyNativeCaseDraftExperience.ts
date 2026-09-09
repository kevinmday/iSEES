import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { NativeCaseDraftCoordinator } from "../../src/nativeCaseDraft/NativeCaseDraftCoordinator.ts";
import type { NativeCaseDraftApiDependency, NativeCaseDraftMutationCommand } from "../../src/nativeCaseDraft/NativeCaseDraftCoordinator.ts";
import { NATIVE_CASE_DRAFT_FIELD_ORDER, createBlankNativeCaseDraftContent } from "../../src/nativeCaseDraft/NativeCaseDraftFieldState.ts";
import { NativeCaseDraftClientError } from "../../src/nativeCaseDraft/NativeCaseDraftTypes.ts";
import type { NativeCaseDraftContent, NativeCaseDraftCreateCommand, NativeCaseDraftProjection, NativeCaseDraftReceipt, NativeCaseDraftUpdateCommand } from "../../src/nativeCaseDraft/NativeCaseDraftTypes.ts";

const blank = createBlankNativeCaseDraftContent();
const withTitle = (title: string): NativeCaseDraftContent => Object.freeze({ ...blank, workingTitle: Object.freeze({ state: "SUPPLIED" as const, value: title }) });
const projection = (content: NativeCaseDraftContent, revision = 0, disposition?: NativeCaseDraftReceipt["idempotencyDisposition"]): NativeCaseDraftProjection | NativeCaseDraftReceipt => Object.freeze({ schemaVersion: "native-case-draft-projection/v1", candidateId: "candidate-1", ownership: Object.freeze({ kind: "RESEARCHER_OWNED" as const, researcherId: "researcher-1" }), investigationId: "investigation-1", knowledgeClassification: "CANDIDATE_KNOWLEDGE", lifecycle: "DRAFT", revision, freshnessToken: `candidate-1:${revision}`, content, createdAt: "2026-09-09T12:00:00Z", updatedAt: `2026-09-09T12:00:0${revision}Z`, operationalMaterialization: "NONE", systemCanonIdentity: null, ...(disposition ? { idempotencyDisposition: disposition } : {}) });
type Calls = { creates: NativeCaseDraftCreateCommand[]; updates: NativeCaseDraftUpdateCommand[]; gets: string[] };
function mockApi(calls: Calls, behavior: Partial<NativeCaseDraftApiDependency> = {}): NativeCaseDraftApiDependency {
  return {
    create: behavior.create ?? (async command => { calls.creates.push(command); return projection(command.content, 0, "CREATED") as NativeCaseDraftReceipt; }),
    update: behavior.update ?? (async (_id, command) => { calls.updates.push(command); return projection(command.content, command.expectedRevision + 1, "UPDATED") as NativeCaseDraftReceipt; }),
    get: behavior.get ?? (async id => { calls.gets.push(id); return projection(withTitle("server latest"), 2) as NativeCaseDraftProjection; }),
  };
}
const make = (api: NativeCaseDraftApiDependency, initialProjection?: NativeCaseDraftProjection, keys: string[] = ["key-1", "key-2", "key-3"]) => new NativeCaseDraftCoordinator({ api, initialProjection, investigationId: "investigation-1", generateIdempotencyKey: () => { const key = keys.shift(); assert(key, "unexpected idempotency request"); return key; } });
const emptyCalls = (): Calls => ({ creates: [], updates: [], gets: [] });

{
  const calls = emptyCalls(), coordinator = make(mockApi(calls));
  assert.equal(NATIVE_CASE_DRAFT_FIELD_ORDER.length, 18);
  for (const field of NATIVE_CASE_DRAFT_FIELD_ORDER) assert.equal(coordinator.state.form[field].state, "OMITTED");
  assert.equal(coordinator.state.lifecycle, "NEW"); assert.equal(coordinator.state.dirty, false);
  coordinator.updateField("workingTitle", { state: "SUPPLIED", value: "" });
  assert.equal(coordinator.state.dirty, true);
  assert.equal(await coordinator.save(), false); assert.equal(calls.creates.length, 0, "validation prevents transport");
  assert.equal(coordinator.state.firstInvalidField, "workingTitle", "contract field order selects first invalid");
  coordinator.updateField("observationLocation", { state: "SUPPLIED", value: "" });
  assert.equal(await coordinator.save(), false); assert.equal(coordinator.state.firstInvalidField, "workingTitle");
  coordinator.updateField("workingTitle", { state: "SUPPLIED", value: "  local title  " });
  coordinator.updateField("observationLocation", { state: "OMITTED" });
  assert.equal(await coordinator.save(), true); assert.equal(calls.creates.length, 1); assert.equal(calls.updates.length, 0);
  assert.equal(calls.creates[0]?.investigationId, "investigation-1");
  for (const forbidden of ["researcherId", "ownerId", "principalId"]) assert(!Object.hasOwn(calls.creates[0]!, forbidden));
  assert.equal(coordinator.state.candidateId, "candidate-1"); assert.equal(coordinator.state.revision, 0); assert.equal(coordinator.state.form.workingTitle.value, "local title", "server-normalized content visibly adopted"); assert.equal(coordinator.state.dirty, false);
  coordinator.updateField("workingTitle", { state: "SUPPLIED", value: "changed" }); assert.equal(coordinator.state.dirty, true);
  assert.equal(await coordinator.save(), true); assert.equal(calls.updates.length, 1); assert.equal(calls.updates[0]?.expectedRevision, 0); assert.equal(coordinator.state.revision, 1);
  coordinator.updateField("workingTitle", { state: "SUPPLIED", value: "temporary" }); assert(coordinator.state.dirty); assert(coordinator.discard()); assert.equal(coordinator.state.form.workingTitle.value, "changed"); assert.equal(coordinator.state.dirty, false);
}
{
  const calls = emptyCalls(), coordinator = make(mockApi(calls));
  coordinator.updateField("workingTitle", { state: "UNKNOWN" }); assert(coordinator.state.dirty); coordinator.discard();
  for (const field of NATIVE_CASE_DRAFT_FIELD_ORDER) assert.equal(coordinator.state.form[field].state, "OMITTED", "new draft discard resets omitted");
}
{
  const calls = emptyCalls(); let attempts = 0; const seen: NativeCaseDraftMutationCommand[] = [];
  const api = mockApi(calls, { create: async command => { attempts += 1; seen.push(command); if (attempts === 1) throw new NativeCaseDraftClientError("NETWORK", "uncertain", { domainCode: "NETWORK_FAILURE" }); return projection(command.content, 0, "REPLAYED") as NativeCaseDraftReceipt; } });
  const coordinator = make(api); coordinator.updateField("workingTitle", { state: "SUPPLIED", value: "retry me" });
  assert.equal(await coordinator.save(), false); assert.equal(attempts, 1, "no automatic retry");
  const pending = coordinator.state.pendingRetryIdentity; assert(pending); assert.equal(pending.idempotencyKey, "key-1");
  assert.equal(await coordinator.retrySave(), true); assert.equal(attempts, 2); assert.strictEqual(seen[0], seen[1], "retry reuses exact frozen command object"); assert.equal(coordinator.state.disposition, "REPLAYED");
}
{
  const calls = emptyCalls(); const seen: NativeCaseDraftCreateCommand[] = [];
  const api = mockApi(calls, { create: async command => { seen.push(command); throw new NativeCaseDraftClientError("NETWORK", "offline"); } });
  const coordinator = make(api); coordinator.updateField("workingTitle", { state: "SUPPLIED", value: "first" }); await coordinator.save();
  coordinator.updateField("workingTitle", { state: "SUPPLIED", value: "second" }); assert.equal(coordinator.state.pendingRetryIdentity, null); await coordinator.save();
  assert.equal(seen.length, 2); assert.notStrictEqual(seen[0], seen[1]); assert.notEqual(seen[0]?.idempotencyKey, seen[1]?.idempotencyKey);
}
for (const disposition of ["CREATED", "UPDATED", "REPLAYED"] as const) {
  const calls = emptyCalls(); const initial = disposition === "UPDATED" ? projection(withTitle("base"), 0) as NativeCaseDraftProjection : undefined;
  const api = mockApi(calls, disposition === "UPDATED" ? { update: async (_id, command) => projection(command.content, 1, disposition) as NativeCaseDraftReceipt } : { create: async command => projection(command.content, 0, disposition) as NativeCaseDraftReceipt });
  const coordinator = make(api, initial); coordinator.updateField("workingTitle", { state: "SUPPLIED", value: disposition }); await coordinator.save(); assert.equal(coordinator.state.disposition, disposition);
}
{
  const calls = emptyCalls(); const local = "my local edit";
  const api = mockApi(calls, { update: async () => { throw new NativeCaseDraftClientError("REVISION_CONFLICT", "stale", { status: 409, domainCode: "REVISION_CONFLICT", requestId: "request-9" }); } });
  const coordinator = make(api, projection(withTitle("base"), 0) as NativeCaseDraftProjection);
  coordinator.updateField("workingTitle", { state: "SUPPLIED", value: local }); await coordinator.save(); assert(coordinator.state.conflict); assert.equal(coordinator.state.form.workingTitle.value, local); assert.equal(coordinator.state.error?.requestId, "request-9");
  await coordinator.reloadLatest(); assert.equal(calls.gets.length, 1); assert.equal(coordinator.state.form.workingTitle.value, local, "GET does not overwrite local edits"); assert.equal(coordinator.state.latestServerProjection?.revision, 2);
  coordinator.keepEditsForComparison(); assert.equal(coordinator.state.form.workingTitle.value, local); assert(coordinator.state.conflict, "keep retains conflict context");
  coordinator.replaceWithLatest(); assert.equal(coordinator.state.form.workingTitle.value, "server latest"); assert.equal(coordinator.state.revision, 2); assert.equal(coordinator.state.conflict, false);
}
{
  let resolveCreate!: (receipt: NativeCaseDraftReceipt) => void; let signal: AbortSignal | undefined;
  const pending = new Promise<NativeCaseDraftReceipt>(resolve => { resolveCreate = resolve; });
  const calls = emptyCalls(); const api = mockApi(calls, { create: async (command, requestSignal) => { calls.creates.push(command); signal = requestSignal; return pending; } });
  const coordinator = make(api); coordinator.updateField("workingTitle", { state: "SUPPLIED", value: "busy" }); const saving = coordinator.save();
  assert(coordinator.state.inFlight); assert.equal(await coordinator.save(), false, "competing save rejected"); assert.equal(coordinator.discard(), false, "competing reset rejected"); assert.equal(await coordinator.reloadLatest(), false, "competing reload rejected");
  coordinator.dispose(); assert.equal(signal?.aborted, true, "dispose aborts request"); resolveCreate(projection(withTitle("late"), 0, "CREATED") as NativeCaseDraftReceipt); assert.equal(await saving, false); assert.equal(coordinator.state.candidateId, null, "late response ignored");
}

const formSource = readFileSync(resolve(process.cwd(), "src/nativeCaseDraft/StructuredObservationForm.tsx"), "utf8");
const editorSource = readFileSync(resolve(process.cwd(), "src/nativeCaseDraft/NativeCaseDraftEditor.tsx"), "utf8");
const coordinatorSource = readFileSync(resolve(process.cwd(), "src/nativeCaseDraft/NativeCaseDraftCoordinator.ts"), "utf8");
const statusSource = readFileSync(resolve(process.cwd(), "src/nativeCaseDraft/NativeCaseDraftStatus.tsx"), "utf8");
const cssSource = readFileSync(resolve(process.cwd(), "src/nativeCaseDraft/NativeCaseDraft.css"), "utf8");
for (const label of ["Working title", "Observation location", "Local observation date", "Local observation time", "Timezone", "Observation narrative", "Object shape", "Movement behavior", "Sound characteristics", "Lighting/visibility", "Observer context", "Witness count", "Environmental conditions", "Approximate duration in seconds", "Researcher notes", "Source/provenance statement", "Privacy classification", "Rights/publication restrictions"]) assert(formSource.includes(label), `missing field label ${label}`);
for (const semantic of ["<form", "<fieldset", "<legend", "htmlFor=", "aria-invalid", "role=\"alert\"", "aria-busy", "type=\"submit\""]) assert(formSource.includes(semantic), `missing accessible form semantic ${semantic}`);
assert(statusSource.includes("role=\"status\"")); assert(statusSource.includes("Candidate Knowledge")); assert(statusSource.includes("System Canon"));
assert(!formSource.includes("alert(")); assert(!editorSource.includes("window.confirm"));
assert(!coordinatorSource.includes("localStorage")); assert(!coordinatorSource.includes("sessionStorage"));
const importSource = [formSource, editorSource, coordinatorSource, statusSource].flatMap(source => source.split(/\r?\n/).filter(line => line.startsWith("import "))).join("\n");
for (const forbidden of ["workspace", "ResearchInbox", "federation", "STUDIO", "KOD", "/ai/", "activation", "publication"]) assert(!importSource.includes(forbidden), `forbidden import ${forbidden}`);
for (const line of cssSource.split(/\r?\n/)) if (line.includes("{")) assert(line.trim().startsWith(".native-case-draft") || line.trim().startsWith("@media"), `unscoped CSS selector: ${line}`);
assert(cssSource.includes("@media")); assert(!cssSource.includes("100vh")); assert(!/(^|,)\s*(html|body|#root)\b/m.test(cssSource));

console.log("PASS VerifyNativeCaseDraftExperience: coordinator lifecycle, frozen retry, conflict comparison, accessible 18-field form, isolated composition, and scoped responsive CSS verified.");
