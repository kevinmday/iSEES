import {
  InvestigationLifecycle,
  InvestigationLibraryError,
  InvestigationLibraryErrorCode,
  type InvestigationListResult,
  type InvestigationSummary,
} from "./InvestigationLibraryTypes.ts";

export const INVESTIGATION_LIBRARY_PRINCIPAL_HEADER = "X-ISEES-Principal-Id";

export type InvestigationLibraryTransport = (
  input: string,
  init: RequestInit,
) => Promise<Response>;

export interface InvestigationLibraryApi {
  listInvestigations(principalId: string, signal?: AbortSignal): Promise<InvestigationListResult>;
  getInvestigation(principalId: string, investigationId: string, signal?: AbortSignal): Promise<InvestigationSummary>;
}

export interface InvestigationLibraryApiOptions {
  readonly baseUrl?: string;
  readonly transport?: InvestigationLibraryTransport;
}

const environment = (import.meta as ImportMeta & {
  readonly env?: Readonly<Record<string, string | undefined>>;
}).env;

export const INVESTIGATION_LIBRARY_API_BASE_URL = (
  environment?.VITE_INVESTIGATION_LIBRARY_API_BASE_URL
  ?? environment?.VITE_API_BASE_URL
  ?? "http://127.0.0.1:8000"
).replace(/\/$/, "");

function isRecord(value: unknown): value is Readonly<Record<string, unknown>> {
  if (value === null || typeof value !== "object" || Array.isArray(value)) return false;
  const prototype = Object.getPrototypeOf(value);
  return prototype === Object.prototype || prototype === null;
}

const backendErrorMappings = Object.freeze({
  INVALID_PRINCIPAL: Object.freeze({
    code: InvestigationLibraryErrorCode.INVALID_PRINCIPAL,
    message: "The Investigation Library principal is invalid.",
  }),
  INVESTIGATION_NOT_FOUND: Object.freeze({
    code: InvestigationLibraryErrorCode.INVESTIGATION_NOT_FOUND,
    message: "The requested investigation was not found.",
  }),
  DUPLICATE_INVESTIGATION_ID: Object.freeze({
    code: InvestigationLibraryErrorCode.UNKNOWN_SERVER_ERROR,
    message: "The Investigation Library could not complete the request.",
  }),
  INVESTIGATION_REPOSITORY_UNAVAILABLE: Object.freeze({
    code: InvestigationLibraryErrorCode.INVESTIGATION_REPOSITORY_UNAVAILABLE,
    message: "The Investigation Library repository is unavailable.",
  }),
  INVALID_STORED_INVESTIGATION: Object.freeze({
    code: InvestigationLibraryErrorCode.INVESTIGATION_REPOSITORY_UNAVAILABLE,
    message: "The Investigation Library repository returned invalid data.",
  }),
} satisfies Readonly<Record<string, Readonly<{
  code: InvestigationLibraryErrorCode;
  message: string;
}>>>);

type AllowlistedBackendErrorCode = keyof typeof backendErrorMappings;

function isAllowlistedBackendErrorCode(value: unknown): value is AllowlistedBackendErrorCode {
  return typeof value === "string" && Object.hasOwn(backendErrorMappings, value);
}

const CORRELATION_REQUEST_ID_MAX_LENGTH = 128;
const CORRELATION_REQUEST_ID_PATTERN = /^[A-Za-z0-9_.:-]+$/;

// Request IDs are opaque correlation identifiers, never diagnostic text.
function validCorrelationRequestId(value: unknown): string | undefined {
  return typeof value === "string"
    && value.length <= CORRELATION_REQUEST_ID_MAX_LENGTH
    && CORRELATION_REQUEST_ID_PATTERN.test(value)
    ? value
    : undefined;
}

export function normalizeInvestigationPrincipal(principalId: string): string {
  const normalized = principalId.trim();
  if (normalized.length === 0) {
    throw new InvestigationLibraryError(
      InvestigationLibraryErrorCode.INVALID_PRINCIPAL,
      "The local/development ownership principal must not be blank.",
    );
  }
  return normalized;
}

function malformed(message: string): never {
  throw new InvestigationLibraryError(InvestigationLibraryErrorCode.MALFORMED_RESPONSE, message);
}

function hasExactKeys(value: Readonly<Record<string, unknown>>, expected: readonly string[]): boolean {
  const actual = Object.keys(value).sort();
  const sortedExpected = [...expected].sort();
  return actual.length === sortedExpected.length
    && actual.every((key, index) => key === sortedExpected[index]);
}

function parseTimestamp(value: unknown, field: string): string {
  if (typeof value !== "string" || value.trim() !== value || value.length === 0) {
    return malformed(`Investigation ${field} must be a timestamp string.`);
  }
  const match = /^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2}):(\d{2})(?:\.\d+)?(?:Z|([+-])(\d{2}):(\d{2}))$/i.exec(value);
  if (match === null || !Number.isFinite(Date.parse(value))) {
    return malformed(`Investigation ${field} must be a valid timezone-aware timestamp.`);
  }
  const year = Number(match[1]);
  const month = Number(match[2]);
  const day = Number(match[3]);
  const hour = Number(match[4]);
  const minute = Number(match[5]);
  const second = Number(match[6]);
  const offsetHour = Number(match[8] ?? 0);
  const offsetMinute = Number(match[9] ?? 0);
  const calendarCheck = new Date(Date.UTC(year, month - 1, day));
  if (
    calendarCheck.getUTCFullYear() !== year
    || calendarCheck.getUTCMonth() !== month - 1
    || calendarCheck.getUTCDate() !== day
    || hour > 23
    || minute > 59
    || second > 59
    || offsetHour > 23
    || offsetMinute > 59
  ) return malformed(`Investigation ${field} must be a valid timezone-aware timestamp.`);
  return value;
}

function parseSummary(value: unknown): InvestigationSummary {
  if (!isRecord(value)) return malformed("Investigation response item must be an object.");
  if (!hasExactKeys(value, [
    "investigationId", "title", "objective", "lifecycle", "createdAt", "modifiedAt", "version",
  ])) return malformed("Investigation response contains missing or unsupported fields.");
  const investigationId = value.investigationId;
  const title = value.title;
  if (typeof investigationId !== "string" || investigationId.trim().length === 0) {
    return malformed("Investigation response requires a non-blank investigationId.");
  }
  if (typeof title !== "string" || title.trim().length === 0) {
    return malformed("Investigation response requires a non-blank title.");
  }
  if (value.objective !== null && typeof value.objective !== "string") {
    return malformed("Investigation objective must be a string or null.");
  }
  if (value.lifecycle !== InvestigationLifecycle.ACTIVE) {
    return malformed("Investigation lifecycle is unsupported.");
  }
  if (!Number.isInteger(value.version) || typeof value.version !== "number" || value.version < 0) {
    return malformed("Investigation version must be a non-negative integer.");
  }
  return Object.freeze({
    investigationId,
    title,
    objective: value.objective,
    lifecycle: InvestigationLifecycle.ACTIVE,
    createdAt: parseTimestamp(value.createdAt, "createdAt"),
    modifiedAt: parseTimestamp(value.modifiedAt, "modifiedAt"),
    version: value.version,
  });
}

function parseList(value: unknown): InvestigationListResult {
  if (!isRecord(value) || !hasExactKeys(value, ["items"]) || !Array.isArray(value.items)) {
    return malformed("Investigation list response must contain an items array.");
  }
  const items = value.items.map(parseSummary);
  const identifiers = new Set<string>();
  for (const item of items) {
    if (identifiers.has(item.investigationId)) {
      return malformed("Investigation list response contains duplicate investigation IDs.");
    }
    identifiers.add(item.investigationId);
  }
  return Object.freeze({ items: Object.freeze(items) });
}

const MALFORMED_SUCCESS_MESSAGE = "Investigation Library returned a malformed successful response.";

function normalizeSuccessfulPayload<Result>(
  body: unknown,
  parser: (value: unknown) => Result,
): Result {
  try {
    return parser(body);
  } catch {
    throw new InvestigationLibraryError(
      InvestigationLibraryErrorCode.MALFORMED_RESPONSE,
      MALFORMED_SUCCESS_MESSAGE,
    );
  }
}

function signalObservedAborted(signal?: AbortSignal): boolean {
  try {
    return signal?.aborted === true;
  } catch {
    return false;
  }
}

function isAbortDomException(error: unknown): boolean {
  try {
    return error instanceof DOMException && error.name === "AbortError";
  } catch {
    return false;
  }
}

function classifyAbort(error: unknown, signal?: AbortSignal): boolean {
  return signalObservedAborted(signal) || isAbortDomException(error);
}

function serverError(body: unknown, status: number): InvestigationLibraryError {
  let requestId: string | undefined;
  let backendCode: AllowlistedBackendErrorCode | undefined;
  try {
    const envelope = isRecord(body) && isRecord(body.error) ? body.error : undefined;
    requestId = validCorrelationRequestId(envelope?.requestId);
    const candidateCode = envelope?.code;
    backendCode = isAllowlistedBackendErrorCode(candidateCode) ? candidateCode : undefined;
  } catch {
    return new InvestigationLibraryError(
      InvestigationLibraryErrorCode.UNKNOWN_SERVER_ERROR,
      "The Investigation Library request failed.",
      { status },
    );
  }
  const mapping = backendCode === undefined
    ? undefined
    : backendErrorMappings[backendCode];
  return new InvestigationLibraryError(
    mapping?.code ?? InvestigationLibraryErrorCode.UNKNOWN_SERVER_ERROR,
    mapping?.message ?? "The Investigation Library request failed.", {
    status,
    requestId,
    backendCode,
  });
}

async function parseJson(response: Response, signal?: AbortSignal): Promise<unknown> {
  try {
    return await response.json();
  } catch (error: unknown) {
    if (classifyAbort(error, signal)) {
      throw new InvestigationLibraryError(
        InvestigationLibraryErrorCode.REQUEST_ABORTED,
        "The Investigation Library request was aborted.",
      );
    }
    return malformed("Investigation Library returned malformed JSON.");
  }
}

function responseMetadata(response: Response): Readonly<{ ok: boolean; status: number }> {
  let ok: unknown;
  let status: unknown;
  try {
    ok = response.ok;
    status = response.status;
  } catch {
    return malformed("Investigation Library returned invalid response metadata.");
  }
  if (
    typeof ok !== "boolean"
    || typeof status !== "number"
    || !Number.isFinite(status)
    || !Number.isInteger(status)
    || status < 100
    || status > 599
    || ok !== (status >= 200 && status < 300)
  ) {
    return malformed("Investigation Library returned invalid response metadata.");
  }
  return { ok, status };
}

export function createInvestigationLibraryApi(
  options: InvestigationLibraryApiOptions = {},
): InvestigationLibraryApi {
  const baseUrl = (options.baseUrl ?? INVESTIGATION_LIBRARY_API_BASE_URL).replace(/\/$/, "");
  const transport = options.transport ?? ((input, init) => fetch(input, init));

  async function request(path: string, principalId: string, signal?: AbortSignal): Promise<unknown> {
    const principal = normalizeInvestigationPrincipal(principalId);
    let response: Response;
    try {
      response = await transport(`${baseUrl}${path}`, {
        method: "GET",
        headers: { [INVESTIGATION_LIBRARY_PRINCIPAL_HEADER]: principal },
        signal,
      });
    } catch (error: unknown) {
      if (classifyAbort(error, signal)) {
        throw new InvestigationLibraryError(
          InvestigationLibraryErrorCode.REQUEST_ABORTED,
          "The Investigation Library request was aborted.",
        );
      }
      throw new InvestigationLibraryError(
        InvestigationLibraryErrorCode.TRANSPORT_FAILURE,
        "The Investigation Library transport is unavailable.",
      );
    }
    const { ok, status } = responseMetadata(response);
    const body = await parseJson(response, signal);
    if (!ok) throw serverError(body, status);
    return body;
  }

  return Object.freeze({
    async listInvestigations(principalId: string, signal?: AbortSignal) {
      return normalizeSuccessfulPayload(
        await request("/api/v1/investigations", principalId, signal),
        parseList,
      );
    },
    async getInvestigation(principalId: string, investigationId: string, signal?: AbortSignal) {
      const normalizedId = investigationId.trim();
      if (normalizedId.length === 0) return malformed("Investigation ID must not be blank.");
      return normalizeSuccessfulPayload(
        await request(
          `/api/v1/investigations/${encodeURIComponent(normalizedId)}`,
          principalId,
          signal,
        ),
        parseSummary,
      );
    },
  });
}

export const investigationLibraryApi = createInvestigationLibraryApi();
