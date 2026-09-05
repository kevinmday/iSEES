import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";

import {
  INVESTIGATION_LIBRARY_PRINCIPAL_HEADER,
  createInvestigationLibraryApi,
  type InvestigationLibraryApi,
  type InvestigationLibraryTransport,
} from "../../src/investigation/library/InvestigationLibraryApi.ts";
import {
  InvestigationLibraryRuntime,
  createInitialInvestigationLibraryState,
  toFrontDoorInvestigationLibraryProjection,
} from "../../src/investigation/library/InvestigationLibraryRuntime.ts";
import {
  InvestigationLifecycle,
  InvestigationLibraryError,
  InvestigationLibraryErrorCode,
  type InvestigationListResult,
  type InvestigationSummary,
} from "../../src/investigation/library/InvestigationLibraryTypes.ts";
import { InvestigationLibraryStatus } from "../../src/investigation/frontDoor/FrontDoorProjectionTypes.ts";

function assert(condition: boolean, message: string): asserts condition {
  if (!condition) throw new Error(`VERIFY FAILED: ${message}`);
}

function equal<T>(actual: T, expected: T, message: string): void {
  assert(actual === expected, `${message} Expected ${String(expected)}, received ${String(actual)}.`);
}

async function rejectsCode(operation: () => Promise<unknown>, code: InvestigationLibraryErrorCode): Promise<InvestigationLibraryError> {
  try {
    await operation();
  } catch (error: unknown) {
    assert(error instanceof InvestigationLibraryError, `Expected typed error ${code}.`);
    equal(error.code, code, "Unexpected error code.");
    return error;
  }
  throw new Error(`VERIFY FAILED: Expected rejection ${code}.`);
}

function response(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), { status, headers: { "Content-Type": "application/json" } });
}

function responseValue(body: unknown, status = 500): Response {
  return {
    ok: status >= 200 && status < 300,
    status,
    json: async () => body,
  } as unknown as Response;
}

function metadataResponse(ok: unknown, status: unknown, body: unknown, onJson: () => void): Response {
  return {
    ok,
    status,
    json: async () => {
      onJson();
      return body;
    },
  } as unknown as Response;
}

function summary(investigationId: string, title = investigationId): InvestigationSummary {
  return Object.freeze({
    investigationId,
    title,
    objective: null,
    lifecycle: InvestigationLifecycle.ACTIVE,
    createdAt: "2026-09-05T10:00:00Z",
    modifiedAt: "2026-09-05T11:00:00+00:00",
    version: 0,
  });
}

function payload(investigationId: string, overrides: Readonly<Record<string, unknown>> = {}): Readonly<Record<string, unknown>> {
  return { ...summary(investigationId), ...overrides };
}

function deferred<T>(): { readonly promise: Promise<T>; readonly resolve: (value: T) => void; readonly reject: (reason: unknown) => void } {
  let resolvePromise!: (value: T) => void;
  let rejectPromise!: (reason: unknown) => void;
  const promise = new Promise<T>((resolve, reject) => {
    resolvePromise = resolve;
    rejectPromise = reject;
  });
  return { promise, resolve: resolvePromise, reject: rejectPromise };
}

function frozenRecursively(value: unknown): boolean {
  if (value === null || typeof value !== "object") return true;
  if (!Object.isFrozen(value)) return false;
  return Object.values(value).every(frozenRecursively);
}

let passCount = 0;
function pass(message: string): void {
  passCount += 1;
  console.log(`PASS ${passCount} — ${message}`);
}

const initial = createInitialInvestigationLibraryState();
equal(initial.status, InvestigationLibraryStatus.NOT_REQUESTED, "Initial state must be NOT_REQUESTED.");
equal(initial.summaries.length, 0, "Initial state must be empty.");
pass("initial NOT_REQUESTED state");

let transportCalls = 0;
const observations: Array<{ readonly url: string; readonly init: RequestInit }> = [];
const orderedPayload = { items: [payload("INV-z"), payload("INV-a")] };
const observingTransport: InvestigationLibraryTransport = async (url, init) => {
  transportCalls += 1;
  observations.push({ url, init });
  return response(url.endsWith("/api/v1/investigations") ? orderedPayload : payload("INV/a b"));
};
const api = createInvestigationLibraryApi({ baseUrl: "https://library.test/", transport: observingTransport });
equal(transportCalls, 0, "Creating/importing the adapter must not request.");
pass("no request at module import or adapter construction");

const emptyApi = createInvestigationLibraryApi({ transport: async () => response({ items: [] }) });
const emptyRuntime = new InvestigationLibraryRuntime(emptyApi);
await emptyRuntime.load("principal:one");
equal(emptyRuntime.getState().status, InvestigationLibraryStatus.EMPTY, "Empty result must become EMPTY.");
pass("empty API result becomes EMPTY");

const runtime = new InvestigationLibraryRuntime(api);
await runtime.load("  principal:one  ");
equal(runtime.getState().status, InvestigationLibraryStatus.READY, "Nonempty result must become READY.");
equal(runtime.getState().summaries[0]?.investigationId, "INV-z", "Server ordering must be retained.");
equal(runtime.getState().summaries[1]?.investigationId, "INV-a", "Server ordering must not be sorted client-side.");
pass("nonempty result becomes READY and preserves deterministic server ordering");

equal(observations[0]?.url, "https://library.test/api/v1/investigations", "List endpoint is incorrect.");
const firstHeaders = new Headers(observations[0]?.init.headers);
equal(firstHeaders.get(INVESTIGATION_LIBRARY_PRINCIPAL_HEADER), "principal:one", "Principal header must be trimmed.");
pass("list endpoint and local/development ownership header");

await api.getInvestigation(" p ", "INV/a b");
equal(observations[1]?.url, "https://library.test/api/v1/investigations/INV%2Fa%20b", "Detail ID must be encoded.");
pass("detail identifier is URL encoded");

const callsBeforeBlank = transportCalls;
await rejectsCode(() => api.listInvestigations("   "), InvestigationLibraryErrorCode.INVALID_PRINCIPAL);
equal(transportCalls, callsBeforeBlank, "Blank principal must fail before transport.");
pass("blank principal rejected before transport");

const knownApi = createInvestigationLibraryApi({ transport: async () => response({ error: {
  code: "INVESTIGATION_REPOSITORY_UNAVAILABLE", message: "Repository unavailable", requestId: "req-7",
} }, 503) });
const known = await rejectsCode(() => knownApi.listInvestigations("p"), InvestigationLibraryErrorCode.INVESTIGATION_REPOSITORY_UNAVAILABLE);
equal(known.status, 503, "Known server error must preserve HTTP status.");
equal(known.requestId, "req-7", "Known server error must preserve request ID.");
equal(known.backendCode, "INVESTIGATION_REPOSITORY_UNAVAILABLE", "Known server code must be retained.");
equal(known.message, "The Investigation Library repository is unavailable.", "Known server error must use frontend-owned prose.");
pass("known backend error classified with frontend-owned message");

const unknownApi = createInvestigationLibraryApi({ transport: async () => response({ error: {
  code: "DATABASE_PATH_LEAK", message: "Safe public message", requestId: "req-8",
} }, 500) });
const unknown = await rejectsCode(() => unknownApi.listInvestigations("p"), InvestigationLibraryErrorCode.UNKNOWN_SERVER_ERROR);
equal(unknown.backendCode, undefined, "Unknown backend code must not be retained.");
pass("unknown backend error safely classified");

const hostileDiagnostics = [
  "SELECT password FROM users",
  "C:\\service\\secrets\\database.sqlite",
  "/srv/app/private/database.sqlite",
  "at repository.load (repository.ts:42:7)",
  "Authorization: Basic inert-credential",
  "Bearer inert-token-value",
  "api_key=inert-api-key password=inert-password secret=inert-secret",
] as const;
const hostileMessage = hostileDiagnostics.join("\n");
const recognizedHostileApi = createInvestigationLibraryApi({ transport: async () => response({ error: {
  code: "INVESTIGATION_REPOSITORY_UNAVAILABLE", message: hostileMessage, requestId: "trace_ABC-123.4:node",
} }, 503) });
const recognizedHostile = await rejectsCode(
  () => recognizedHostileApi.listInvestigations("p"),
  InvestigationLibraryErrorCode.INVESTIGATION_REPOSITORY_UNAVAILABLE,
);
equal(recognizedHostile.message, "The Investigation Library repository is unavailable.", "Recognized errors must ignore backend prose.");
equal(recognizedHostile.requestId, "trace_ABC-123.4:node", "Valid correlation ID must be retained.");
const recognizedPublic = JSON.stringify({
  ...recognizedHostile,
  name: recognizedHostile.name,
  message: recognizedHostile.message,
  serializedError: JSON.stringify(recognizedHostile),
});
for (const hostile of hostileDiagnostics) {
  assert(!recognizedPublic.includes(hostile), `Recognized error retained hostile diagnostic: ${hostile}`);
}
pass("recognized backend errors exclude hostile diagnostics from every public and serialized field");

const unknownHostileApi = createInvestigationLibraryApi({ transport: async () => response({ error: {
  code: `UNKNOWN_${hostileMessage}`, message: hostileMessage, requestId: "req-8",
} }, 500) });
const unknownHostile = await rejectsCode(
  () => unknownHostileApi.listInvestigations("p"),
  InvestigationLibraryErrorCode.UNKNOWN_SERVER_ERROR,
);
equal(unknownHostile.message, "The Investigation Library request failed.", "Unknown errors must use generic frontend-owned prose.");
equal(unknownHostile.backendCode, undefined, "Arbitrary unknown backend code must be discarded.");
const unknownPublic = JSON.stringify({
  ...unknownHostile,
  name: unknownHostile.name,
  message: unknownHostile.message,
  serializedError: JSON.stringify(unknownHostile),
});
for (const hostile of hostileDiagnostics) {
  assert(!unknownPublic.includes(hostile), `Unknown error retained hostile diagnostic: ${hostile}`);
}
pass("unknown backend code and hostile diagnostics are absent from every public and serialized field");

const hostileGetterDiagnostic = "SELECT inert_password FROM inert_users Authorization: Bearer inert-getter-token";
const hostileGetterEnvelope = Object.create(null) as Record<string, unknown>;
Object.defineProperty(hostileGetterEnvelope, "code", {
  enumerable: true,
  get: () => { throw new Error(hostileGetterDiagnostic); },
});
const hostileGetterPayload = { error: hostileGetterEnvelope };
const hostileGetterResponse = responseValue(hostileGetterPayload, 500);
const hostileGetterApi = createInvestigationLibraryApi({ transport: async () => hostileGetterResponse });
const hostileGetterError = await rejectsCode(
  () => hostileGetterApi.listInvestigations("p"),
  InvestigationLibraryErrorCode.UNKNOWN_SERVER_ERROR,
);
assert(!String(hostileGetterError.stack).includes(hostileGetterDiagnostic), "Hostile getter diagnostic entered error stack.");
assert(!JSON.stringify(hostileGetterError).includes(hostileGetterDiagnostic), "Hostile getter diagnostic was serialized.");
pass("hostile error-envelope getter returns a fixed error without retaining its thrown diagnostic");

const hostileProxyDiagnostic = "C:\\inert\\secret.txt /inert/private/key Authorization: Basic inert-proxy-key";
const hostileProxyEnvelope = new Proxy(Object.create(null) as Record<string, unknown>, {
  get: () => { throw new Error(hostileProxyDiagnostic); },
});
const hostileProxyPayload = { error: hostileProxyEnvelope };
const hostileProxyResponse = responseValue(hostileProxyPayload, 502);
const hostileProxyApi = createInvestigationLibraryApi({ transport: async () => hostileProxyResponse });
const hostileProxyError = await rejectsCode(
  () => hostileProxyApi.listInvestigations("p"),
  InvestigationLibraryErrorCode.UNKNOWN_SERVER_ERROR,
);
const hostileProxyInspection = JSON.stringify(Object.getOwnPropertyDescriptors(hostileProxyError));
assert(!hostileProxyInspection.includes(hostileProxyDiagnostic), "Hostile Proxy diagnostic entered property metadata.");
pass("hostile error-envelope Proxy returns a fixed error without retaining its diagnostic");

const arbitraryPayload = {
  error: {
    message: hostileMessage,
    cause: hostileMessage,
    stack: hostileMessage,
    response: hostileGetterResponse,
    payload: hostileGetterPayload,
    authorization: "Bearer inert-arbitrary-token",
    apiKey: "inert-arbitrary-api-key",
    password: "inert-arbitrary-password",
    extra: "inert-arbitrary-secret",
  },
};
const arbitraryResponse = responseValue(arbitraryPayload, 500);
const arbitraryApi = createInvestigationLibraryApi({ transport: async () => arbitraryResponse });
const arbitraryError = await rejectsCode(
  () => arbitraryApi.listInvestigations("p"),
  InvestigationLibraryErrorCode.UNKNOWN_SERVER_ERROR,
);
equal(
  JSON.stringify(Object.keys(arbitraryError)),
  JSON.stringify(["code", "status", "requestId", "backendCode", "name"]),
  "Public error enumerable fields changed.",
);
const expectedSpread = {
  code: InvestigationLibraryErrorCode.UNKNOWN_SERVER_ERROR,
  status: 500,
  requestId: undefined,
  backendCode: undefined,
  name: "InvestigationLibraryError",
};
equal(JSON.stringify({ ...arbitraryError }), JSON.stringify(expectedSpread), "Object spread exposed unsupported values.");
equal(JSON.stringify(arbitraryError), JSON.stringify(expectedSpread), "Error serialization exposed unsupported values.");
assert(!Object.hasOwn(arbitraryError, "cause"), "Public error acquired an own cause property.");
assert(!("cause" in arbitraryError), "Public error acquired an inherited cause property.");
equal((arbitraryError as Error & { readonly cause?: unknown }).cause, undefined, "Public error exposed a cause value.");
const inspectedValues = Reflect.ownKeys(arbitraryError).map(key =>
  Object.getOwnPropertyDescriptor(arbitraryError, key)?.value
);
assert(!inspectedValues.includes(arbitraryResponse), "Raw Response is reachable from the public error.");
assert(!inspectedValues.includes(arbitraryPayload), "Raw payload is reachable from the public error.");
assert(!inspectedValues.includes(arbitraryPayload.error), "Raw error envelope is reachable from the public error.");
const arbitraryPublic = JSON.stringify({
  keys: Object.keys(arbitraryError),
  names: Object.getOwnPropertyNames(arbitraryError),
  descriptors: Object.getOwnPropertyDescriptors(arbitraryError),
  spread: { ...arbitraryError },
  serialized: JSON.stringify(arbitraryError),
});
for (const hostile of [
  ...hostileDiagnostics,
  hostileGetterDiagnostic,
  hostileProxyDiagnostic,
  "Bearer inert-arbitrary-token",
  "inert-arbitrary-api-key",
  "inert-arbitrary-password",
  "inert-arbitrary-secret",
]) {
  assert(!arbitraryPublic.includes(hostile), `Public error inspection retained hostile diagnostic: ${hostile}`);
}
pass("malformed envelopes expose only exact safe fields with no cause, raw response, payload, exception, or diagnostic retention");

for (const invalidRequestId of [
  "", "   ", "req id", "req/path", "req\\path", "req=value", "req\"value", "req'value",
  `req-${"a".repeat(125)}`,
]) {
  const invalidRequestApi = createInvestigationLibraryApi({ transport: async () => response({ error: {
    code: "INVALID_PRINCIPAL", message: hostileMessage, requestId: invalidRequestId,
  } }, 422) });
  const invalidRequestError = await rejectsCode(
    () => invalidRequestApi.listInvestigations("p"),
    InvestigationLibraryErrorCode.INVALID_PRINCIPAL,
  );
  equal(invalidRequestError.requestId, undefined, `Invalid request ID must be discarded: ${JSON.stringify(invalidRequestId)}`);
}
pass("blank, whitespace, path-like, quoted, equals-sign, and overlong request IDs discarded");

for (const [backendCode, expectedCode, expectedMessage] of [
  ["INVALID_PRINCIPAL", InvestigationLibraryErrorCode.INVALID_PRINCIPAL, "The Investigation Library principal is invalid."],
  ["INVESTIGATION_NOT_FOUND", InvestigationLibraryErrorCode.INVESTIGATION_NOT_FOUND, "The requested investigation was not found."],
  ["DUPLICATE_INVESTIGATION_ID", InvestigationLibraryErrorCode.UNKNOWN_SERVER_ERROR, "The Investigation Library could not complete the request."],
  ["INVESTIGATION_REPOSITORY_UNAVAILABLE", InvestigationLibraryErrorCode.INVESTIGATION_REPOSITORY_UNAVAILABLE, "The Investigation Library repository is unavailable."],
  ["INVALID_STORED_INVESTIGATION", InvestigationLibraryErrorCode.INVESTIGATION_REPOSITORY_UNAVAILABLE, "The Investigation Library repository returned invalid data."],
] as const) {
  const mappedApi = createInvestigationLibraryApi({ transport: async () => response({ error: {
    code: backendCode, message: hostileMessage,
  } }, 500) });
  const mapped = await rejectsCode(() => mappedApi.listInvestigations("p"), expectedCode);
  equal(mapped.backendCode, backendCode, `${backendCode} must be retained exactly.`);
  equal(mapped.message, expectedMessage, `${backendCode} fixed message is incorrect.`);
}
pass("complete I2A backend allowlist retains known classification with fixed messages");

const metadataDiagnostic = "inert-response-status-diagnostic-secret";
let metadataBodyCalls = 0;
const hostileStatusResponse = new Proxy({
  ok: false,
  json: async () => {
    metadataBodyCalls += 1;
    return { error: { code: "INVALID_PRINCIPAL" } };
  },
}, {
  get: (target, property, receiver) => property === "status"
    ? metadataDiagnostic
    : Reflect.get(target, property, receiver),
}) as unknown as Response;
const hostileStatusApi = createInvestigationLibraryApi({ transport: async () => hostileStatusResponse });
const hostileStatusError = await rejectsCode(
  () => hostileStatusApi.listInvestigations("p"),
  InvestigationLibraryErrorCode.MALFORMED_RESPONSE,
);
equal(hostileStatusError.message, "Investigation Library returned invalid response metadata.", "Invalid metadata must use fixed prose.");
equal(hostileStatusError.status, undefined, "Hostile status must be discarded.");
equal(hostileStatusError.backendCode, undefined, "Invalid metadata must not retain a backend code.");
equal(hostileStatusError.requestId, undefined, "Invalid metadata must not retain a request ID.");
equal((hostileStatusError as Error & { readonly cause?: unknown }).cause, undefined, "Invalid metadata must not expose a cause.");
const hostileStatusPublic = JSON.stringify({
  message: hostileStatusError.message,
  status: hostileStatusError.status,
  backendCode: hostileStatusError.backendCode,
  requestId: hostileStatusError.requestId,
  cause: (hostileStatusError as Error & { readonly cause?: unknown }).cause,
  keys: Object.keys(hostileStatusError),
  spread: { ...hostileStatusError },
  descriptors: Object.getOwnPropertyDescriptors(hostileStatusError),
  serialized: JSON.stringify(hostileStatusError),
});
assert(!hostileStatusPublic.includes(metadataDiagnostic), "Hostile Response status entered public error inspection.");
equal(metadataBodyCalls, 0, "Hostile Response status must prevent body consumption.");
pass("hostile Response Proxy status is discarded from every public and serialized field before body consumption");

for (const invalidStatus of [
  "500", Number.NaN, Number.POSITIVE_INFINITY, Number.NEGATIVE_INFINITY, 200.5, 99, 600, null, { value: 500 },
]) {
  let jsonCalls = 0;
  const invalidStatusApi = createInvestigationLibraryApi({ transport: async () => metadataResponse(
    false,
    invalidStatus,
    { error: { code: "INVALID_PRINCIPAL" } },
    () => { jsonCalls += 1; },
  ) });
  const invalidStatusError = await rejectsCode(
    () => invalidStatusApi.listInvestigations("p"),
    InvestigationLibraryErrorCode.MALFORMED_RESPONSE,
  );
  equal(invalidStatusError.status, undefined, `Invalid status must be discarded: ${String(invalidStatus)}`);
  equal(jsonCalls, 0, `Invalid status must prevent body consumption: ${String(invalidStatus)}`);
}
pass("string, non-finite, fractional, out-of-range, null, and object statuses are rejected before body consumption");

for (const invalidOk of ["false", 0, null, { value: false }]) {
  let jsonCalls = 0;
  const invalidOkApi = createInvestigationLibraryApi({ transport: async () => metadataResponse(
    invalidOk,
    500,
    { error: { code: "INVALID_PRINCIPAL" } },
    () => { jsonCalls += 1; },
  ) });
  const invalidOkError = await rejectsCode(
    () => invalidOkApi.listInvestigations("p"),
    InvestigationLibraryErrorCode.MALFORMED_RESPONSE,
  );
  equal(invalidOkError.status, undefined, `Invalid ok must not retain status: ${String(invalidOk)}`);
  equal(jsonCalls, 0, `Invalid ok must prevent body consumption: ${String(invalidOk)}`);
}
pass("string, number, null, and object ok values are rejected before body consumption");

for (const [property, diagnostic] of [
  ["status", "inert-throwing-status-getter-secret"],
  ["ok", "inert-throwing-ok-getter-secret"],
] as const) {
  let jsonCalls = 0;
  const throwingMetadataResponse = {
    ok: true,
    status: 200,
    json: async () => { jsonCalls += 1; return { items: [] }; },
  };
  Object.defineProperty(throwingMetadataResponse, property, {
    get: () => { throw new Error(diagnostic); },
  });
  const throwingMetadataApi = createInvestigationLibraryApi({
    transport: async () => throwingMetadataResponse as unknown as Response,
  });
  const throwingMetadataError = await rejectsCode(
    () => throwingMetadataApi.listInvestigations("p"),
    InvestigationLibraryErrorCode.MALFORMED_RESPONSE,
  );
  const publicInspection = JSON.stringify({
    message: throwingMetadataError.message,
    keys: Object.keys(throwingMetadataError),
    spread: { ...throwingMetadataError },
    descriptors: Object.getOwnPropertyDescriptors(throwingMetadataError),
    serialized: JSON.stringify(throwingMetadataError),
  });
  assert(!String(throwingMetadataError.stack).includes(diagnostic), `${property} getter diagnostic entered error stack.`);
  assert(!publicInspection.includes(diagnostic), `${property} getter diagnostic entered public error inspection.`);
  equal(jsonCalls, 0, `Throwing ${property} getter must prevent body consumption.`);
}
pass("throwing status and ok getters disclose no diagnostics and prevent body consumption");

for (const [ok, status] of [[true, 500], [false, 200]] as const) {
  let jsonCalls = 0;
  const inconsistentApi = createInvestigationLibraryApi({ transport: async () => metadataResponse(
    ok, status, { items: [] }, () => { jsonCalls += 1; },
  ) });
  const inconsistentError = await rejectsCode(
    () => inconsistentApi.listInvestigations("p"),
    InvestigationLibraryErrorCode.MALFORMED_RESPONSE,
  );
  equal(inconsistentError.status, undefined, "Inconsistent metadata must not retain status.");
  equal(jsonCalls, 0, "Inconsistent metadata must prevent body consumption.");
}
pass("ok values inconsistent with 2xx HTTP semantics are rejected before body consumption");

let validSuccessBodyCalls = 0;
const validSuccessApi = createInvestigationLibraryApi({ transport: async () => metadataResponse(
  true, 299, { items: [payload("valid-metadata-success")] }, () => { validSuccessBodyCalls += 1; },
) });
const validSuccess = await validSuccessApi.listInvestigations("p");
equal(validSuccess.items[0]?.investigationId, "valid-metadata-success", "Valid 2xx response must follow success parsing.");
equal(validSuccessBodyCalls, 1, "Valid 2xx response body must be consumed once.");
let validErrorBodyCalls = 0;
const validErrorApi = createInvestigationLibraryApi({ transport: async () => metadataResponse(
  false, 599, { error: { code: "INVALID_PRINCIPAL", message: metadataDiagnostic, requestId: "req-valid-599" } },
  () => { validErrorBodyCalls += 1; },
) });
const validMetadataError = await rejectsCode(
  () => validErrorApi.listInvestigations("p"),
  InvestigationLibraryErrorCode.INVALID_PRINCIPAL,
);
equal(validMetadataError.status, 599, "Validated numeric HTTP status must be public.");
equal(validMetadataError.message, "The Investigation Library principal is invalid.", "Valid server error must use fixed mapping.");
equal(validMetadataError.backendCode, "INVALID_PRINCIPAL", "Valid server error must retain allowlisted code.");
equal(validMetadataError.requestId, "req-valid-599", "Valid server error must retain safe request ID.");
equal(validErrorBodyCalls, 1, "Valid non-2xx response body must be consumed once.");
pass("valid 2xx and non-2xx metadata preserve success parsing and safe server-error mapping with numeric status only");

function failingBodyResponse(thrown: unknown, onJson?: () => void): Response {
  return {
    ok: true,
    status: 200,
    json: async () => {
      onJson?.();
      throw thrown;
    },
  } as unknown as Response;
}

function assertRejectedValueNotRetained(
  error: InvestigationLibraryError,
  diagnostic: string,
  forbiddenValues: readonly unknown[],
): void {
  const cause = (error as Error & { readonly cause?: unknown }).cause;
  const descriptorValues = Reflect.ownKeys(error).map(key =>
    Object.getOwnPropertyDescriptor(error, key)?.value
  );
  const publicInspection = JSON.stringify({
    name: error.name,
    message: error.message,
    code: error.code,
    status: error.status,
    requestId: error.requestId,
    backendCode: error.backendCode,
    cause,
    stack: error.stack,
    keys: Object.keys(error),
    spread: { ...error },
    descriptors: Object.getOwnPropertyDescriptors(error),
    serialized: JSON.stringify(error),
  });
  assert(!publicInspection.includes(diagnostic), "Hostile rejection diagnostic entered public error inspection.");
  equal(cause, undefined, "Hostile rejection must not expose a cause.");
  for (const forbidden of forbiddenValues) {
    assert(!descriptorValues.includes(forbidden), "Hostile rejection input was retained by the public error.");
  }
}

const malformedSuccessMessage = "Investigation Library returned a malformed successful response.";

async function assertHostileSuccessfulBody(
  endpoint: "list" | "detail",
  trap: string,
  body: unknown,
  diagnostic: string,
  forbiddenValues: readonly unknown[],
  unchanged: () => boolean,
): Promise<void> {
  const hostileResponse = responseValue(body, 200);
  const hostileApi = createInvestigationLibraryApi({ transport: async () => hostileResponse });
  let escaped: unknown;
  try {
    await (endpoint === "list"
      ? hostileApi.listInvestigations("p")
      : hostileApi.getInvestigation("p", "hostile-detail"));
  } catch (error: unknown) {
    escaped = error;
  }
  assert(escaped instanceof InvestigationLibraryError, `${endpoint} ${trap} must return a typed error.`);
  equal(escaped.code, InvestigationLibraryErrorCode.MALFORMED_RESPONSE, `${endpoint} ${trap} code changed.`);
  equal(escaped.message, malformedSuccessMessage, `${endpoint} ${trap} message changed.`);
  equal(escaped.status, undefined, `${endpoint} ${trap} retained status.`);
  equal(escaped.requestId, undefined, `${endpoint} ${trap} retained request ID.`);
  equal(escaped.backendCode, undefined, `${endpoint} ${trap} retained backend code.`);
  assertRejectedValueNotRetained(escaped, diagnostic, [
    body, hostileResponse, ...forbiddenValues,
  ]);
  assert(unchanged(), `${endpoint} ${trap} mutated its input target.`);
}

type HostileBodyCase = Readonly<{
  readonly trap: string;
  readonly body: unknown;
  readonly diagnostic: string;
  readonly forbiddenValues: readonly unknown[];
  readonly unchanged: () => boolean;
}>;

function hostileSuccessfulBodies(endpoint: "list" | "detail"): readonly HostileBodyCase[] {
  const validBody = endpoint === "list" ? { items: [payload("hostile-list")] } : payload("hostile-detail");
  const wrapTop = (trap: string, handler: ProxyHandler<Record<string, unknown>>): HostileBodyCase => {
    const target = { ...validBody };
    const before = JSON.stringify(target);
    const exception = new Error(`inert-success-${endpoint}-${trap}-marker`);
    const body = new Proxy(target, handlerFactory(handler, exception));
    return { trap, body, diagnostic: exception.message, forbiddenValues: [target, exception], unchanged: () => JSON.stringify(target) === before };
  };
  const cases: HostileBodyCase[] = [
    wrapTop("ownKeys", { ownKeys: () => [] }),
    wrapTop("getOwnPropertyDescriptor", { getOwnPropertyDescriptor: () => undefined }),
    wrapTop("get", { get: () => undefined }),
    wrapTop("getPrototypeOf", { getPrototypeOf: () => null }),
  ];

  const arrayTarget = [payload(`hostile-${endpoint}-array`)];
  const arrayBefore = JSON.stringify(arrayTarget);
  const arrayException = new Error(`inert-success-${endpoint}-array-access-marker`);
  const arrayProxy = new Proxy(arrayTarget, {
    get: (target, property, receiver) => {
      if (property === "length" || property === "0") throw arrayException;
      return Reflect.get(target, property, receiver);
    },
  });
  const arrayBody = endpoint === "list" ? { items: arrayProxy } : arrayProxy;
  cases.push({ trap: "array length/index", body: arrayBody, diagnostic: arrayException.message, forbiddenValues: [arrayTarget, arrayProxy, arrayException], unchanged: () => JSON.stringify(arrayTarget) === arrayBefore });

  const nestedTarget = { ...payload(`hostile-${endpoint}-nested`) };
  const nestedBefore = JSON.stringify(nestedTarget);
  const nestedException = new Error(`inert-success-${endpoint}-nested-field-marker`);
  const nestedProxy = new Proxy(nestedTarget, {
    get: (target, property, receiver) => {
      if (property === "investigationId") throw nestedException;
      return Reflect.get(target, property, receiver);
    },
  });
  const nestedBody = endpoint === "list" ? { items: [nestedProxy] } : nestedProxy;
  cases.push({ trap: "nested item field", body: nestedBody, diagnostic: nestedException.message, forbiddenValues: [nestedTarget, nestedProxy, nestedException], unchanged: () => JSON.stringify(nestedTarget) === nestedBefore });
  return cases;
}

function handlerFactory(
  handler: ProxyHandler<Record<string, unknown>>,
  exception: Error,
): ProxyHandler<Record<string, unknown>> {
  if (handler.ownKeys !== undefined) return { ownKeys: () => { throw exception; } };
  if (handler.getOwnPropertyDescriptor !== undefined) return { getOwnPropertyDescriptor: () => { throw exception; } };
  if (handler.get !== undefined) return {
    get: (target, property, receiver) => property === "then"
      ? Reflect.get(target, property, receiver)
      : (() => { throw exception; })(),
  };
  return { getPrototypeOf: () => { throw exception; } };
}

for (const endpoint of ["list", "detail"] as const) {
  for (const hostile of hostileSuccessfulBodies(endpoint)) {
    await assertHostileSuccessfulBody(
      endpoint,
      hostile.trap,
      hostile.body,
      hostile.diagnostic,
      hostile.forbiddenValues,
      hostile.unchanged,
    );
  }
  pass(`hostile successful ${endpoint} bodies normalize all schema traps without disclosure or retention`);
}

const directListInput = { items: [{ ...summary("direct-list") }] };
const directDetailInput = { ...summary("direct-detail") };
const directSuccessApi = createInvestigationLibraryApi({ transport: async input => responseValue(
  input.endsWith("/api/v1/investigations") ? directListInput : directDetailInput,
  200,
) });
const directListResult = await directSuccessApi.listInvestigations("p");
const directDetailResult = await directSuccessApi.getInvestigation("p", "direct-detail");
equal(directListResult.items[0]?.investigationId, "direct-list", "Valid direct list response changed.");
equal(directDetailResult.investigationId, "direct-detail", "Valid direct detail response changed.");
assert(frozenRecursively(directListResult), "Valid list result must be recursively immutable.");
assert(frozenRecursively(directDetailResult), "Valid detail result must be recursively immutable.");
assert(directListResult !== directListInput, "List result aliased its input envelope.");
assert(directListResult.items !== directListInput.items, "List result aliased its input array.");
assert(directListResult.items[0] !== directListInput.items[0], "List result aliased its input item.");
assert(directDetailResult !== directDetailInput, "Detail result aliased its input item.");
const ordinaryMalformedListApi = createInvestigationLibraryApi({ transport: async () => responseValue({ records: [] }, 200) });
const ordinaryMalformedDetailApi = createInvestigationLibraryApi({ transport: async () => responseValue({ investigationId: "incomplete" }, 200) });
const ordinaryListError = await rejectsCode(
  () => ordinaryMalformedListApi.listInvestigations("p"),
  InvestigationLibraryErrorCode.MALFORMED_RESPONSE,
);
const ordinaryDetailError = await rejectsCode(
  () => ordinaryMalformedDetailApi.getInvestigation("p", "incomplete"),
  InvestigationLibraryErrorCode.MALFORMED_RESPONSE,
);
equal(ordinaryListError.message, malformedSuccessMessage, "Ordinary malformed list must use normalized prose.");
equal(ordinaryDetailError.message, malformedSuccessMessage, "Ordinary malformed detail must use normalized prose.");
pass("valid list/detail remain immutable and non-aliased while ordinary malformed successes normalize");

const rejectedPrototypeDiagnostic = "inert-rejected-prototype-trap-marker";
const rejectedPrototypeException = new Error(rejectedPrototypeDiagnostic);
const rejectedPrototypeProxy = new Proxy(Object.create(null) as Record<string, unknown>, {
  getPrototypeOf: () => { throw rejectedPrototypeException; },
});
const hostileTransportApi = createInvestigationLibraryApi({
  transport: async () => { throw rejectedPrototypeProxy; },
});
const hostileTransportError = await rejectsCode(
  () => hostileTransportApi.listInvestigations("p"),
  InvestigationLibraryErrorCode.TRANSPORT_FAILURE,
);
equal(hostileTransportError.message, "The Investigation Library transport is unavailable.", "Hostile transport rejection must use fixed prose.");
assertRejectedValueNotRetained(hostileTransportError, rejectedPrototypeDiagnostic, [
  rejectedPrototypeProxy, rejectedPrototypeException,
]);
pass("hostile transport rejection prototype trap becomes fixed TRANSPORT_FAILURE without retention or disclosure");

const hostileBodyPayload = { items: [payload("must-not-be-retained")] };
const hostileBodyProxy = new Proxy(hostileBodyPayload, {
  getPrototypeOf: () => { throw rejectedPrototypeException; },
});
const hostileBodyResponse = failingBodyResponse(hostileBodyProxy);
const hostileBodyApi = createInvestigationLibraryApi({ transport: async () => hostileBodyResponse });
const hostileBodyError = await rejectsCode(
  () => hostileBodyApi.listInvestigations("p"),
  InvestigationLibraryErrorCode.MALFORMED_RESPONSE,
);
equal(hostileBodyError.message, "Investigation Library returned malformed JSON.", "Hostile body rejection must use fixed prose.");
assertRejectedValueNotRetained(hostileBodyError, rejectedPrototypeDiagnostic, [
  hostileBodyProxy, rejectedPrototypeException, hostileBodyResponse, hostileBodyPayload,
]);
pass("hostile body rejection prototype trap becomes fixed MALFORMED_RESPONSE without retention or disclosure");

const rejectedNameDiagnostic = "inert-rejected-name-trap-marker";
const rejectedNameException = new Error(rejectedNameDiagnostic);
const rejectedNameProxy = new Proxy(new DOMException("inert", "AbortError"), {
  get: (target, property, receiver) => {
    if (property === "name") throw rejectedNameException;
    return Reflect.get(target, property, receiver);
  },
});
const hostileNameApi = createInvestigationLibraryApi({ transport: async () => { throw rejectedNameProxy; } });
const hostileNameError = await rejectsCode(
  () => hostileNameApi.listInvestigations("p"),
  InvestigationLibraryErrorCode.TRANSPORT_FAILURE,
);
assertRejectedValueNotRetained(hostileNameError, rejectedNameDiagnostic, [rejectedNameProxy, rejectedNameException]);
pass("hostile DOMException name access cannot escape abort classification");

const hostileSignalDiagnostic = "inert-signal-aborted-getter-marker";
const hostileSignalException = new Error(hostileSignalDiagnostic);
const hostileSignal = Object.create(null) as Record<string, unknown>;
Object.defineProperty(hostileSignal, "aborted", {
  get: () => { throw hostileSignalException; },
});
const hostileSignalApi = createInvestigationLibraryApi({ transport: async () => { throw new Error("inert transport failure"); } });
const hostileSignalError = await rejectsCode(
  () => hostileSignalApi.listInvestigations("p", hostileSignal as unknown as AbortSignal),
  InvestigationLibraryErrorCode.TRANSPORT_FAILURE,
);
assertRejectedValueNotRetained(hostileSignalError, hostileSignalDiagnostic, [hostileSignal, hostileSignalException]);
pass("throwing signal aborted getter neither proves abort nor discloses its diagnostic");

const bodyAbortController = new AbortController();
const bodyAbortApi = createInvestigationLibraryApi({ transport: async () => failingBodyResponse(
  new SyntaxError("inert parse failure"),
  () => bodyAbortController.abort(),
) });
await rejectsCode(
  () => bodyAbortApi.listInvestigations("p", bodyAbortController.signal),
  InvestigationLibraryErrorCode.REQUEST_ABORTED,
);
pass("signal-confirmed body-consumption failure is REQUEST_ABORTED");
const renamedAbort = new Error("inert renamed error");
renamedAbort.name = "AbortError";
const renamedAbortApi = createInvestigationLibraryApi({ transport: async () => failingBodyResponse(renamedAbort) });
await rejectsCode(() => renamedAbortApi.listInvestigations("p"), InvestigationLibraryErrorCode.MALFORMED_RESPONSE);
pass("renamed generic Error remains MALFORMED_RESPONSE");
const abortMessageApi = createInvestigationLibraryApi({ transport: async () => failingBodyResponse(
  new Error("request was aborted while reading the body"),
) });
await rejectsCode(() => abortMessageApi.listInvestigations("p"), InvestigationLibraryErrorCode.MALFORMED_RESPONSE);
pass("abort-like generic Error message remains MALFORMED_RESPONSE");
const abortObjectApi = createInvestigationLibraryApi({ transport: async () => failingBodyResponse({ name: "AbortError" }) });
await rejectsCode(() => abortObjectApi.listInvestigations("p"), InvestigationLibraryErrorCode.MALFORMED_RESPONSE);
pass("plain AbortError-like object remains MALFORMED_RESPONSE");
const genuineBodyAbortApi = createInvestigationLibraryApi({ transport: async () => failingBodyResponse(
  new DOMException("inert body read abort", "AbortError"),
) });
await rejectsCode(() => genuineBodyAbortApi.listInvestigations("p"), InvestigationLibraryErrorCode.REQUEST_ABORTED);
pass("genuine AbortError DOMException is REQUEST_ABORTED");
const syntaxFailureApi = createInvestigationLibraryApi({ transport: async () => failingBodyResponse(
  new SyntaxError("inert JSON syntax failure"),
) });
await rejectsCode(() => syntaxFailureApi.listInvestigations("p"), InvestigationLibraryErrorCode.MALFORMED_RESPONSE);
pass("normal SyntaxError remains MALFORMED_RESPONSE");

const malformedJsonApi = createInvestigationLibraryApi({ transport: async () => new Response("{", { status: 200 }) });
await rejectsCode(() => malformedJsonApi.listInvestigations("p"), InvestigationLibraryErrorCode.MALFORMED_RESPONSE);
pass("malformed JSON rejected");

for (const [name, body] of [
  ["malformed success", { records: [] }],
  ["blank identifier", { items: [payload("   ")] }],
  ["blank title", { items: [payload("one", { title: "  " })] }],
  ["unsupported response field", { items: [payload("one", { ownerPrincipalId: "must-not-leak" })] }],
  ["unsupported lifecycle", { items: [payload("one", { lifecycle: "ARCHIVED" })] }],
  ["invalid timestamp", { items: [payload("one", { createdAt: "not-a-date" })] }],
  ["invalid calendar timestamp", { items: [payload("one", { createdAt: "2026-02-30T11:00:00Z" })] }],
  ["timezone-less timestamp", { items: [payload("one", { modifiedAt: "2026-09-05T11:00:00" })] }],
  ["invalid version", { items: [payload("one", { version: 1.5 })] }],
  ["duplicate IDs", { items: [payload("one"), payload("one")] }],
] as const) {
  const malformedApi = createInvestigationLibraryApi({ transport: async () => response(body) });
  await rejectsCode(() => malformedApi.listInvestigations("p"), InvestigationLibraryErrorCode.MALFORMED_RESPONSE);
  pass(`${name} rejected`);
}

const transportApi = createInvestigationLibraryApi({ transport: async () => { throw new Error("socket details"); } });
const transportError = await rejectsCode(() => transportApi.listInvestigations("p"), InvestigationLibraryErrorCode.TRANSPORT_FAILURE);
assert(!transportError.message.includes("socket"), "Transport internals must not escape.");
pass("transport failure distinguished without leaking details");

const abortApi = createInvestigationLibraryApi({ transport: async () => {
  throw new DOMException("inert transport abort", "AbortError");
} });
await rejectsCode(() => abortApi.listInvestigations("p"), InvestigationLibraryErrorCode.REQUEST_ABORTED);
pass("abort distinguished from transport failure");

const failingRuntime = new InvestigationLibraryRuntime(transportApi);
await failingRuntime.load("p");
equal(failingRuntime.getState().status, InvestigationLibraryStatus.ERROR, "First failure must become ERROR.");
equal(failingRuntime.getState().summaries.length, 0, "First failure must fabricate no data.");
pass("first-load failure becomes ERROR");

let refreshFails = false;
const refreshApi = createInvestigationLibraryApi({ transport: async () => {
  if (refreshFails) throw new Error("offline");
  return response({ items: [payload("kept")] });
} });
const refreshRuntime = new InvestigationLibraryRuntime(refreshApi);
await refreshRuntime.load("p", { loadedAt: "supplied-1" });
refreshFails = true;
await refreshRuntime.load("p", { loadedAt: "supplied-2" });
equal(refreshRuntime.getState().status, InvestigationLibraryStatus.STALE, "Refresh failure must become STALE.");
equal(refreshRuntime.getState().summaries[0]?.investigationId, "kept", "STALE must preserve the last snapshot.");
equal(refreshRuntime.getState().lastSuccessfulLoad?.loadedAt, "supplied-1", "Failed refresh must preserve successful metadata.");
pass("refresh failure becomes STALE and preserves prior snapshot");

const older = deferred<InvestigationListResult>();
const newer = deferred<InvestigationListResult>();
let requestNumber = 0;
const raceApi: InvestigationLibraryApi = Object.freeze({
  listInvestigations: () => (++requestNumber === 1 ? older.promise : newer.promise),
  getInvestigation: async () => summary("unused"),
});
const raceRuntime = new InvestigationLibraryRuntime(raceApi);
const olderLoad = raceRuntime.load("p");
const newerLoad = raceRuntime.load("p");
newer.resolve(Object.freeze({ items: Object.freeze([summary("newer")]) }));
await newerLoad;
older.resolve(Object.freeze({ items: Object.freeze([summary("older")]) }));
await olderLoad;
equal(raceRuntime.getState().summaries[0]?.investigationId, "newer", "Late older response overwrote new state.");
pass("late older response cannot overwrite newer success");

const priorPrincipal = deferred<InvestigationListResult>();
const principalApi: InvestigationLibraryApi = Object.freeze({
  listInvestigations: () => priorPrincipal.promise,
  getInvestigation: async () => summary("unused"),
});
const principalRuntime = new InvestigationLibraryRuntime(principalApi);
const priorLoad = principalRuntime.load("principal:old");
principalRuntime.setPrincipal("principal:new");
equal(principalRuntime.getState().principalId, "principal:new", "Principal must change immediately.");
equal(principalRuntime.getState().summaries.length, 0, "Principal change must clear summaries immediately.");
priorPrincipal.resolve(Object.freeze({ items: Object.freeze([summary("old-data")]) }));
await priorLoad;
equal(principalRuntime.getState().summaries.length, 0, "Prior principal response entered new state.");
pass("principal change clears immediately and isolates prior response");

const disposalResult = deferred<InvestigationListResult>();
const disposalRuntime = new InvestigationLibraryRuntime(Object.freeze({
  listInvestigations: () => disposalResult.promise,
  getInvestigation: async () => summary("unused"),
}));
const disposalLoad = disposalRuntime.load("p");
const stateAtDisposal = disposalRuntime.getState();
disposalRuntime.dispose();
disposalResult.resolve(Object.freeze({ items: Object.freeze([summary("too-late")]) }));
await disposalLoad;
assert(disposalRuntime.getState() === stateAtDisposal, "Disposal must prevent later mutation.");
pass("disposal blocks later mutation");

const mutablePayload = { items: [{ ...summary("input") }] };
const mutableBefore = JSON.stringify(mutablePayload);
const immutabilityApi = createInvestigationLibraryApi({ transport: async () => response(mutablePayload) });
const immutabilityRuntime = new InvestigationLibraryRuntime(immutabilityApi);
let subscriberState = createInitialInvestigationLibraryState();
immutabilityRuntime.subscribe(state => {
  subscriberState = state;
  try { Object.assign(state.summaries[0] ?? {}, { title: "mutated" }); } catch { /* expected */ }
});
immutabilityRuntime.subscribe(() => { throw new Error("subscriber failure"); });
await immutabilityRuntime.load("p");
equal(JSON.stringify(mutablePayload), mutableBefore, "API input payload was mutated.");
equal(immutabilityRuntime.getState().summaries[0]?.title, "input", "Subscriber mutated runtime authority.");
assert(subscriberState === immutabilityRuntime.getState(), "Subscriber must observe the authoritative frozen snapshot.");
assert(frozenRecursively(immutabilityRuntime.getState()), "Runtime state must be recursively frozen.");
equal(immutabilityRuntime.getState().status, InvestigationLibraryStatus.READY, "Subscriber failure corrupted runtime.");
pass("payload immutability, recursive state immutability, and subscriber isolation");

const deterministicA = new InvestigationLibraryRuntime(immutabilityApi);
const deterministicB = new InvestigationLibraryRuntime(immutabilityApi);
await deterministicA.load("p", { loadedAt: "supplied" });
await deterministicB.load("p", { loadedAt: "supplied" });
equal(JSON.stringify(deterministicA.getState()), JSON.stringify(deterministicB.getState()), "Equivalent loads must be deterministic.");
pass("structurally equivalent loads are deterministic");

for (const status of Object.values(InvestigationLibraryStatus)) {
  const summaries = status === InvestigationLibraryStatus.READY || status === InvestigationLibraryStatus.STALE
    ? [summary("projected")]
    : [];
  const projection = toFrontDoorInvestigationLibraryProjection(Object.freeze({
    principalId: "p", status, summaries: Object.freeze(summaries), requestGeneration: 1,
  }));
  equal(projection.status, status, `Front-door status ${status} was not preserved.`);
  assert(frozenRecursively(projection), "Front-door projection must be recursively immutable.");
}
pass("front-door adapter preserves all six valid statuses");

const invalidReady = toFrontDoorInvestigationLibraryProjection(Object.freeze({
  principalId: "p", status: InvestigationLibraryStatus.READY, summaries: Object.freeze([]), requestGeneration: 1,
}));
const invalidEmpty = toFrontDoorInvestigationLibraryProjection(Object.freeze({
  principalId: "p", status: InvestigationLibraryStatus.EMPTY, summaries: Object.freeze([summary("unexpected")]), requestGeneration: 1,
}));
equal(invalidReady.status, InvestigationLibraryStatus.ERROR, "Invalid READY must not pass through.");
equal(invalidEmpty.status, InvestigationLibraryStatus.ERROR, "Invalid EMPTY must not pass through.");
for (const status of [InvestigationLibraryStatus.LOADING, InvestigationLibraryStatus.ERROR]) {
  const projection = toFrontDoorInvestigationLibraryProjection(Object.freeze({
    principalId: "p", status, summaries: Object.freeze([]), requestGeneration: 1,
  }));
  assert(projection.status !== InvestigationLibraryStatus.EMPTY, `${status} masqueraded as EMPTY.`);
}
pass("READY/EMPTY invariants hold and loading/error never masquerade as EMPTY");

const serialized = JSON.stringify({
  state: runtime.getState(),
  projection: toFrontDoorInvestigationLibraryProjection(runtime.getState()),
});
for (const fabricated of ["activeWorkspace", "activeMode", "canonCase", "Tic Tac", "E-TICTAC"]) {
  assert(!serialized.includes(fabricated), `Runtime fabricated ${fabricated}.`);
}
pass("no Workspace, mode, canon case, or Tic Tac default fabricated");

for (const relative of [
  "../../src/investigation/library/InvestigationLibraryTypes.ts",
  "../../src/investigation/library/InvestigationLibraryApi.ts",
  "../../src/investigation/library/InvestigationLibraryRuntime.ts",
]) {
  const source = readFileSync(fileURLToPath(new URL(relative, import.meta.url)), "utf8");
  for (const forbidden of [
    "from \"react", "from 'react", "localStorage", "sessionStorage", "WorkspaceRuntime",
    "FederationContext", "Studio", "Date.now", "Math.random", "randomUUID", "crypto.randomUUID",
  ]) assert(!source.includes(forbidden), `${relative} contains forbidden dependency ${forbidden}.`);
}
const apiSource = readFileSync(fileURLToPath(new URL(
  "../../src/investigation/library/InvestigationLibraryApi.ts", import.meta.url,
)), "utf8");
assert(
  apiSource.indexOf("fetch(input, init)") > apiSource.indexOf("export function createInvestigationLibraryApi"),
  "Default fetch must be captured only inside adapter construction.",
);
pass("source isolation and no module-import fetch dependency");

console.log("");
console.log(`All ${passCount} Investigation Library Runtime invariants passed.`);
