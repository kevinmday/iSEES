import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { createNativeCaseDraftApi } from "../../src/nativeCaseDraft/NativeCaseDraftApi.ts";
import { NativeCaseDraftClientError, parseNativeCaseDraftContent, parseNativeCaseDraftList, parseNativeCaseDraftProjection, parseNativeCaseDraftReceipt, parseStructuredApiError } from "../../src/nativeCaseDraft/NativeCaseDraftTypes.ts";
import { NATIVE_CASE_DRAFT_FIELD_ORDER, applyCanonicalBaseline, contentMatchesBaseline, createBlankNativeCaseDraftContent, createNativeCaseDraftCommand, firstInvalidField, mapFormStateToContent, restoreFormState, updateNativeCaseDraftCommand } from "../../src/nativeCaseDraft/NativeCaseDraftFieldState.ts";
import type { NativeCaseDraftFormState } from "../../src/nativeCaseDraft/NativeCaseDraftFieldState.ts";

const rejects = (work: () => unknown, label: string) => assert.throws(work, NativeCaseDraftClientError, label);
const clone = <T>(value: T): T => structuredClone(value);
const blank = createBlankNativeCaseDraftContent();
assert.deepEqual(Object.keys(blank), ["schemaVersion", ...NATIVE_CASE_DRAFT_FIELD_ORDER]);
assert.equal(NATIVE_CASE_DRAFT_FIELD_ORDER.length, 18);
for (const field of NATIVE_CASE_DRAFT_FIELD_ORDER) assert.equal(blank[field].state, "OMITTED");

const form = restoreFormState({ content: blank } as never);
const values: Partial<Record<(typeof NATIVE_CASE_DRAFT_FIELD_ORDER)[number], string | number>> = { workingTitle: "  Ｎight\u00a0light  ", observationLocation: "Ridge", localObservationDate: "2026-02-28", localObservationTime: "23:59:58", timezone: "America/Los_Angeles", observationNarrative: "Narrative", objectShape: "Disk", movementBehavior: "Hover", soundCharacteristics: "Silent", lightingVisibility: "Clear", observerContext: "Outside", witnessCount: 2, environmentalConditions: "Dry", approximateDuration: 90, researcherNotes: "Note", sourceProvenanceStatement: "Direct observation", privacyClassification: "RESTRICTED", rightsPublicationRestriction: "No publication" };
const suppliedForm = Object.freeze(Object.fromEntries(NATIVE_CASE_DRAFT_FIELD_ORDER.map(field => [field, Object.freeze({ state: "SUPPLIED", value: values[field] })]))) as NativeCaseDraftFormState;
const content = mapFormStateToContent(suppliedForm);
assert.equal(content.workingTitle.value, "Night light", "NFKC and trim normalization");
assert.equal(content.approximateDuration.seconds, 90);
assert.deepEqual(mapFormStateToContent(restoreFormState(parseNativeCaseDraftProjection(projection(content)))), content, "all kinds round-trip");
const unknownForm = Object.freeze({ ...form, timezone: Object.freeze({ state: "UNKNOWN" as const }) });
assert.deepEqual(mapFormStateToContent(unknownForm).timezone, { state: "UNKNOWN" });

function projection(draftContent = content, candidateId = "candidate-1") { return { schemaVersion: "native-case-draft-projection/v1", candidateId, ownership: { kind: "RESEARCHER_OWNED", researcherId: "researcher-1" }, investigationId: null, knowledgeClassification: "CANDIDATE_KNOWLEDGE", lifecycle: "DRAFT", revision: 0, freshnessToken: `${candidateId}:0`, content: draftContent, createdAt: "2026-09-09T12:00:00Z", updatedAt: "2026-09-09T12:00:00+00:00", operationalMaterialization: "NONE", systemCanonIdentity: null }; }
const parsed = parseNativeCaseDraftProjection(projection()); assert(Object.isFrozen(parsed)); assert(Object.isFrozen(parsed.content));
const receipt = parseNativeCaseDraftReceipt({ ...projection(), idempotencyDisposition: "CREATED" }); assert.equal(receipt.idempotencyDisposition, "CREATED");
assert.deepEqual(parseNativeCaseDraftList({ schemaVersion: "native-case-draft-list/v1", items: [projection()] }).items[0], parsed);
assert.deepEqual(parseStructuredApiError({ error: { code: "REVISION_CONFLICT", message: "stale", requestId: "request-1" } }).error.requestId, "request-1");

for (const [label, mutate] of [
  ["projection extra", (v: Record<string, unknown>) => { v.extra = true; }], ["schema", (v: Record<string, unknown>) => { v.schemaVersion = "wrong"; }], ["identity", (v: Record<string, unknown>) => { v.candidateId = " "; }], ["timestamp", (v: Record<string, unknown>) => { v.createdAt = "today"; }], ["freshness", (v: Record<string, unknown>) => { v.freshnessToken = "wrong:0"; }], ["ownership extra", (v: Record<string, unknown>) => { (v.ownership as Record<string, unknown>).extra = true; }], ["content extra", (v: Record<string, unknown>) => { (v.content as Record<string, unknown>).extra = true; }], ["envelope extra", (v: Record<string, unknown>) => { ((v.content as Record<string, unknown>).workingTitle as Record<string, unknown>).extra = true; }],
] as const) { const value = clone(projection(blank)); mutate(value); rejects(() => parseNativeCaseDraftProjection(value), label); }
const badContent = (field: string, envelope: object) => ({ ...clone(blank), [field]: envelope });
for (const [label, field, envelope] of [
  ["date", "localObservationDate", { state: "SUPPLIED", value: "2026-02-30" }], ["time", "localObservationTime", { state: "SUPPLIED", value: "24:00" }], ["timezone", "timezone", { state: "SUPPLIED", value: "+14:01" }], ["count fractional", "witnessCount", { state: "SUPPLIED", value: 1.5 }], ["count negative", "witnessCount", { state: "SUPPLIED", value: -1 }], ["count overflow", "witnessCount", { state: "SUPPLIED", value: 1_000_001 }], ["duration", "approximateDuration", { state: "SUPPLIED", seconds: 31_536_001 }], ["privacy", "privacyClassification", { state: "SUPPLIED", value: "SECRET" }], ["supplied missing", "workingTitle", { state: "SUPPLIED" }], ["unknown value", "workingTitle", { state: "UNKNOWN", value: "x" }], ["omitted value", "workingTitle", { state: "OMITTED", value: "x" }], ["control", "workingTitle", { state: "SUPPLIED", value: "bad\u0001text" }],
] as const) rejects(() => parseNativeCaseDraftContent(badContent(field, envelope)), label);
rejects(() => parseNativeCaseDraftList({ schemaVersion: "native-case-draft-list/v1", items: [projection(), projection()] }), "duplicate list identity");
rejects(() => parseNativeCaseDraftList({ schemaVersion: "wrong", items: [] }), "list schema");
rejects(() => parseNativeCaseDraftReceipt({ ...projection(), idempotencyDisposition: "SAVED" }), "receipt literal");
rejects(() => parseStructuredApiError({ error: { code: "X", message: "x", extra: true } }), "error extra");

const invalidForm = Object.freeze({ ...suppliedForm, workingTitle: { state: "SUPPLIED" as const, value: "" }, observationLocation: { state: "SUPPLIED" as const, value: "" } });
assert.equal(firstInvalidField(invalidForm)?.field, "workingTitle");
assert(contentMatchesBaseline(content, applyCanonicalBaseline(parsed)));
assert(!contentMatchesBaseline({ ...content, workingTitle: { state: "SUPPLIED", value: "changed" } }, applyCanonicalBaseline(parsed)));
assert.strictEqual(applyCanonicalBaseline(parsed), parsed.content, "canonical server content retained exactly");
const create = createNativeCaseDraftCommand(suppliedForm, null, "key-1");
const update = updateNativeCaseDraftCommand(suppliedForm, "investigation-1", 0, "key-2");
assert.deepEqual(Object.keys(create), ["schemaVersion", "investigationId", "content", "idempotencyKey"]); assert.deepEqual(Object.keys(update), ["schemaVersion", "investigationId", "expectedRevision", "content", "idempotencyKey"]); assert(Object.isFrozen(create)); assert(Object.isFrozen(update));
for (const forbidden of ["researcherId", "ownerId", "principalId", "lifecycle", "knowledgeClassification", "operationalMaterialization", "systemCanonIdentity"]) { assert(!Object.hasOwn(create, forbidden)); assert(!Object.hasOwn(update, forbidden)); }

type Captured = { url: string; init?: RequestInit };
const calls: Captured[] = [];
const responses: unknown[] = [{ schemaVersion: "native-case-draft-list/v1", items: [] }, projection(), { ...projection(), idempotencyDisposition: "CREATED" }];
const mockFetch = async (input: RequestInfo | URL, init?: RequestInit) => { calls.push({ url: String(input), init }); return new Response(JSON.stringify(responses.shift()), { status: init?.method === "POST" ? 201 : 200, headers: { "Content-Type": "application/json" } }); };
const api = createNativeCaseDraftApi({ fetch: mockFetch, apiBaseUrl: "", cookieSource: () => "other=x; isees_csrf=csrf%201" });
await api.list(); await api.get("candidate-1"); await api.create(create);
assert.equal(calls.length, 3, "one fetch per call: no retries");
for (const call of calls) assert.equal(call.init?.credentials, "include");
assert.equal(new Headers(calls[0]!.init?.headers).has("X-ISEES-CSRF"), false); assert.equal(new Headers(calls[1]!.init?.headers).has("X-ISEES-CSRF"), false); assert.equal(new Headers(calls[2]!.init?.headers).get("X-ISEES-CSRF"), "csrf 1"); assert.equal(new Headers(calls[2]!.init?.headers).get("Content-Type"), "application/json");
const abort = new AbortController(); abort.abort(); const abortApi = createNativeCaseDraftApi({ fetch: async (_input, init) => { throw init?.signal?.reason; }, cookieSource: () => "" }); await assert.rejects(abortApi.list(abort.signal), (error: unknown) => error instanceof NativeCaseDraftClientError && error.kind === "ABORTED");
const conflictApi = createNativeCaseDraftApi({ fetch: async () => new Response(JSON.stringify({ error: { code: "REVISION_CONFLICT", message: "stale", requestId: "r" } }), { status: 409 }) }); await assert.rejects(conflictApi.list(), (error: unknown) => error instanceof NativeCaseDraftClientError && error.kind === "REVISION_CONFLICT" && error.status === 409 && error.requestId === "r");
const networkApi = createNativeCaseDraftApi({ fetch: async () => { throw new Error("offline"); } }); await assert.rejects(networkApi.list(), (error: unknown) => error instanceof NativeCaseDraftClientError && error.kind === "NETWORK");
const malformedApi = createNativeCaseDraftApi({ fetch: async () => new Response("{}", { status: 200 }) }); await assert.rejects(malformedApi.list(), (error: unknown) => error instanceof NativeCaseDraftClientError && error.kind === "MALFORMED_RESPONSE");

const apiSource = readFileSync(resolve(process.cwd(), "src/nativeCaseDraft/NativeCaseDraftApi.ts"), "utf8");
assert(!apiSource.includes("800" + "1")); assert(!apiSource.includes("/rep" + "ort"));
const importLines = apiSource.split(/\r?\n/).filter(line => line.startsWith("import ")).join("\n");
for (const forbiddenImport of ["Candidate" + "EvidenceApi", "workspace", "Research" + "Inbox", "federation", "studio", "KOD", "activation", "System" + "Canon", "/ai/"]) assert(!importLines.includes(forbiddenImport), `forbidden import ${forbiddenImport}`);
console.log("PASS VerifyNativeCaseDraftContracts: strict contracts, tri-state mapping, commands, authenticated transport, CSRF, abort/errors, and no-retry isolation verified.");
