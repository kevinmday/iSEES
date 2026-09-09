export const CONTENT_SCHEMA_VERSION = "native-case-draft-content/v1" as const;
export const COMMAND_SCHEMA_VERSION = "native-case-draft-command/v1" as const;
export const PROJECTION_SCHEMA_VERSION = "native-case-draft-projection/v1" as const;
export const LIST_SCHEMA_VERSION = "native-case-draft-list/v1" as const;

export type FieldState = "SUPPLIED" | "UNKNOWN" | "OMITTED";
export type PrivacyClassification = "PUBLIC" | "RESTRICTED" | "PRIVATE";
export type TextFieldEnvelope = Readonly<{ state: FieldState; value?: string | null }>;
export type DateFieldEnvelope = Readonly<{ state: FieldState; value?: string | null }>;
export type TimeFieldEnvelope = Readonly<{ state: FieldState; value?: string | null }>;
export type TimezoneFieldEnvelope = Readonly<{ state: FieldState; value?: string | null }>;
export type WitnessCountFieldEnvelope = Readonly<{ state: FieldState; value?: number | null }>;
export type DurationFieldEnvelope = Readonly<{ state: FieldState; seconds?: number | null }>;
export type PrivacyFieldEnvelope = Readonly<{ state: FieldState; value?: PrivacyClassification | null }>;

export interface NativeCaseDraftContent {
  readonly schemaVersion: typeof CONTENT_SCHEMA_VERSION;
  readonly workingTitle: TextFieldEnvelope; readonly observationLocation: TextFieldEnvelope;
  readonly localObservationDate: DateFieldEnvelope; readonly localObservationTime: TimeFieldEnvelope;
  readonly timezone: TimezoneFieldEnvelope; readonly observationNarrative: TextFieldEnvelope;
  readonly objectShape: TextFieldEnvelope; readonly movementBehavior: TextFieldEnvelope;
  readonly soundCharacteristics: TextFieldEnvelope; readonly lightingVisibility: TextFieldEnvelope;
  readonly observerContext: TextFieldEnvelope; readonly witnessCount: WitnessCountFieldEnvelope;
  readonly environmentalConditions: TextFieldEnvelope; readonly approximateDuration: DurationFieldEnvelope;
  readonly researcherNotes: TextFieldEnvelope; readonly sourceProvenanceStatement: TextFieldEnvelope;
  readonly privacyClassification: PrivacyFieldEnvelope; readonly rightsPublicationRestriction: TextFieldEnvelope;
}
export interface NativeCaseDraftCreateCommand { readonly schemaVersion: typeof COMMAND_SCHEMA_VERSION; readonly investigationId: string | null; readonly content: NativeCaseDraftContent; readonly idempotencyKey: string; }
export interface NativeCaseDraftUpdateCommand extends NativeCaseDraftCreateCommand { readonly expectedRevision: number; }
export interface NativeCaseOwnership { readonly kind: "RESEARCHER_OWNED"; readonly researcherId: string; }
export interface NativeCaseDraftProjection { readonly schemaVersion: typeof PROJECTION_SCHEMA_VERSION; readonly candidateId: string; readonly ownership: NativeCaseOwnership; readonly investigationId: string | null; readonly knowledgeClassification: "CANDIDATE_KNOWLEDGE"; readonly lifecycle: "DRAFT"; readonly revision: number; readonly freshnessToken: string; readonly content: NativeCaseDraftContent; readonly createdAt: string; readonly updatedAt: string; readonly operationalMaterialization: "NONE"; readonly systemCanonIdentity: null; }
export interface NativeCaseDraftReceipt extends NativeCaseDraftProjection { readonly idempotencyDisposition: "CREATED" | "UPDATED" | "REPLAYED"; }
export interface NativeCaseDraftList { readonly schemaVersion: typeof LIST_SCHEMA_VERSION; readonly items: readonly NativeCaseDraftProjection[]; }
export interface StructuredApiErrorEnvelope { readonly error: Readonly<{ code: string; message: string; requestId?: string }> }

export type NativeCaseDraftErrorKind = "AUTHENTICATION" | "CSRF" | "NOT_FOUND" | "REVISION_CONFLICT" | "IDEMPOTENCY_CONFLICT" | "VALIDATION" | "HTTP" | "NETWORK" | "ABORTED" | "MALFORMED_RESPONSE";
export class NativeCaseDraftClientError extends Error {
  readonly kind: NativeCaseDraftErrorKind; readonly status: number | null; readonly domainCode: string; readonly requestId?: string;
  constructor(kind: NativeCaseDraftErrorKind, message: string, options: Readonly<{ status?: number; domainCode?: string; requestId?: string; cause?: unknown }> = {}) {
    super(message, { cause: options.cause }); this.name = "NativeCaseDraftClientError"; this.kind = kind;
    this.status = options.status ?? null; this.domainCode = options.domainCode ?? kind; this.requestId = options.requestId;
  }
}
export class NativeCaseDraftParseError extends NativeCaseDraftClientError {
  constructor(message: string) { super("MALFORMED_RESPONSE", message, { domainCode: "MALFORMED_RESPONSE" }); this.name = "NativeCaseDraftParseError"; }
}

type JsonObject = Record<string, unknown>;
const CONTENT_KEYS = ["schemaVersion", "workingTitle", "observationLocation", "localObservationDate", "localObservationTime", "timezone", "observationNarrative", "objectShape", "movementBehavior", "soundCharacteristics", "lightingVisibility", "observerContext", "witnessCount", "environmentalConditions", "approximateDuration", "researcherNotes", "sourceProvenanceStatement", "privacyClassification", "rightsPublicationRestriction"] as const;
const PROJECTION_KEYS = ["schemaVersion", "candidateId", "ownership", "investigationId", "knowledgeClassification", "lifecycle", "revision", "freshnessToken", "content", "createdAt", "updatedAt", "operationalMaterialization", "systemCanonIdentity"] as const;
const fail = (path: string): never => { throw new NativeCaseDraftParseError(`Invalid native case draft response at ${path}.`); };
const objectAt = (value: unknown, path: string): JsonObject => value !== null && typeof value === "object" && !Array.isArray(value) ? value as JsonObject : fail(path);
const exact = (value: JsonObject, keys: readonly string[], path: string): void => { const actual = Object.keys(value); if (actual.length !== keys.length || actual.some(key => !keys.includes(key))) fail(path); };
const identity = (value: unknown, path: string): string => typeof value === "string" && value === value.trim() && value.length > 0 && value.length <= 500 ? value : fail(path);
const state = (value: unknown, path: string): FieldState => value === "SUPPLIED" || value === "UNKNOWN" || value === "OMITTED" ? value : fail(path);
const frozen = <T extends object>(value: T): Readonly<T> => Object.freeze(value);
const envelope = (raw: unknown, payload: "value" | "seconds", path: string, supplied: (value: unknown, path: string) => string | number): Readonly<{ state: FieldState; value?: string | number | null; seconds?: number | null }> => {
  const item = objectAt(raw, path); const keys = Object.keys(item); if (!keys.includes("state") || keys.some(key => key !== "state" && key !== payload)) fail(path);
  const fieldState = state(item.state, `${path}.state`); const has = Object.prototype.hasOwnProperty.call(item, payload); const value = item[payload];
  if (fieldState === "SUPPLIED") { if (!has || value === null) fail(`${path}.${payload}`); return frozen({ state: fieldState, [payload]: supplied(value, `${path}.${payload}`) }); }
  if (has && value !== null) fail(`${path}.${payload}`); return frozen(has ? { state: fieldState, [payload]: null } : { state: fieldState });
};
const textValue = (value: unknown, path: string): string => typeof value === "string" && value.length > 0 && value.length <= 20_000 && !Array.from(value).some(char => char.codePointAt(0)! < 32 && char !== "\n" && char !== "\t") ? value : fail(path);
const dateValue = (value: unknown, path: string): string => { if (typeof value !== "string") return fail(path); if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return fail(path); const [y, m, d] = value.split("-").map(Number); const check = new Date(Date.UTC(y!, m! - 1, d)); if (check.getUTCFullYear() !== y || check.getUTCMonth() !== m! - 1 || check.getUTCDate() !== d) return fail(path); return value; };
const timeValue = (value: unknown, path: string): string => typeof value === "string" && /^(?:[01]\d|2[0-3]):[0-5]\d(?::[0-5]\d)?$/.test(value) ? value : fail(path);
export function isValidTimezone(value: string): boolean { if (value === "Z") return true; const offset = /^([+-])(\d{2}):(\d{2})$/.exec(value); if (offset) return Number(offset[2]) < 14 ? Number(offset[3]) <= 59 : Number(offset[2]) === 14 && offset[3] === "00"; if (value.length === 0 || value.length > 100) return false; try { new Intl.DateTimeFormat("en-US", { timeZone: value }).format(); return true; } catch { return false; } }
const timezoneValue = (value: unknown, path: string): string => typeof value === "string" && isValidTimezone(value) ? value : fail(path);
const integer = (value: unknown, path: string, maximum: number): number => typeof value === "number" && Number.isSafeInteger(value) && value >= 0 && value <= maximum ? value : fail(path);
const privacyValue = (value: unknown, path: string): PrivacyClassification => value === "PUBLIC" || value === "RESTRICTED" || value === "PRIVATE" ? value : fail(path);

export function parseNativeCaseDraftContent(raw: unknown, path = "content"): NativeCaseDraftContent {
  const item = objectAt(raw, path); exact(item, CONTENT_KEYS, path); if (item.schemaVersion !== CONTENT_SCHEMA_VERSION) fail(`${path}.schemaVersion`);
  const text = (key: string) => envelope(item[key], "value", `${path}.${key}`, textValue) as TextFieldEnvelope;
  return frozen({ schemaVersion: CONTENT_SCHEMA_VERSION, workingTitle: text("workingTitle"), observationLocation: text("observationLocation"), localObservationDate: envelope(item.localObservationDate, "value", `${path}.localObservationDate`, dateValue) as DateFieldEnvelope, localObservationTime: envelope(item.localObservationTime, "value", `${path}.localObservationTime`, timeValue) as TimeFieldEnvelope, timezone: envelope(item.timezone, "value", `${path}.timezone`, timezoneValue) as TimezoneFieldEnvelope, observationNarrative: text("observationNarrative"), objectShape: text("objectShape"), movementBehavior: text("movementBehavior"), soundCharacteristics: text("soundCharacteristics"), lightingVisibility: text("lightingVisibility"), observerContext: text("observerContext"), witnessCount: envelope(item.witnessCount, "value", `${path}.witnessCount`, (v, p) => integer(v, p, 1_000_000)) as WitnessCountFieldEnvelope, environmentalConditions: text("environmentalConditions"), approximateDuration: envelope(item.approximateDuration, "seconds", `${path}.approximateDuration`, (v, p) => integer(v, p, 31_536_000)) as DurationFieldEnvelope, researcherNotes: text("researcherNotes"), sourceProvenanceStatement: text("sourceProvenanceStatement"), privacyClassification: envelope(item.privacyClassification, "value", `${path}.privacyClassification`, privacyValue) as PrivacyFieldEnvelope, rightsPublicationRestriction: text("rightsPublicationRestriction") });
}
const timestamp = (value: unknown, path: string): string => { if (typeof value !== "string") return fail(path); if (!/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:\.\d+)?(?:Z|\+00:00)$/.test(value) || !Number.isFinite(Date.parse(value))) return fail(path); return value; };
function projection(raw: unknown, receipt: boolean): NativeCaseDraftProjection | NativeCaseDraftReceipt {
  const item = objectAt(raw, "projection"); exact(item, receipt ? [...PROJECTION_KEYS, "idempotencyDisposition"] : PROJECTION_KEYS, "projection");
  if (item.schemaVersion !== PROJECTION_SCHEMA_VERSION || item.knowledgeClassification !== "CANDIDATE_KNOWLEDGE" || item.lifecycle !== "DRAFT" || item.operationalMaterialization !== "NONE" || item.systemCanonIdentity !== null) fail("projection");
  const candidateId = identity(item.candidateId, "projection.candidateId"); const revision = integer(item.revision, "projection.revision", Number.MAX_SAFE_INTEGER); if (item.freshnessToken !== `${candidateId}:${revision}`) fail("projection.freshnessToken");
  const own = objectAt(item.ownership, "projection.ownership"); exact(own, ["kind", "researcherId"], "projection.ownership"); if (own.kind !== "RESEARCHER_OWNED") fail("projection.ownership.kind");
  const result = { schemaVersion: PROJECTION_SCHEMA_VERSION, candidateId, ownership: frozen({ kind: "RESEARCHER_OWNED" as const, researcherId: identity(own.researcherId, "projection.ownership.researcherId") }), investigationId: item.investigationId === null ? null : identity(item.investigationId, "projection.investigationId"), knowledgeClassification: "CANDIDATE_KNOWLEDGE" as const, lifecycle: "DRAFT" as const, revision, freshnessToken: identity(item.freshnessToken, "projection.freshnessToken"), content: parseNativeCaseDraftContent(item.content), createdAt: timestamp(item.createdAt, "projection.createdAt"), updatedAt: timestamp(item.updatedAt, "projection.updatedAt"), operationalMaterialization: "NONE" as const, systemCanonIdentity: null };
  if (!receipt) return frozen(result); const disposition = item.idempotencyDisposition; if (disposition !== "CREATED" && disposition !== "UPDATED" && disposition !== "REPLAYED") fail("projection.idempotencyDisposition"); return frozen({ ...result, idempotencyDisposition: disposition });
}
export const parseNativeCaseDraftProjection = (raw: unknown): NativeCaseDraftProjection => projection(raw, false) as NativeCaseDraftProjection;
export const parseNativeCaseDraftReceipt = (raw: unknown): NativeCaseDraftReceipt => projection(raw, true) as NativeCaseDraftReceipt;
export function parseNativeCaseDraftList(raw: unknown): NativeCaseDraftList { const item = objectAt(raw, "list"); exact(item, ["schemaVersion", "items"], "list"); if (item.schemaVersion !== LIST_SCHEMA_VERSION) return fail("list"); const rawItems = item.items; if (!Array.isArray(rawItems)) return fail("list.items"); const items = rawItems.map(parseNativeCaseDraftProjection); if (new Set(items.map(entry => entry.candidateId)).size !== items.length) fail("list.items"); return frozen({ schemaVersion: LIST_SCHEMA_VERSION, items: Object.freeze(items) }); }
export function parseStructuredApiError(raw: unknown): StructuredApiErrorEnvelope { const root = objectAt(raw, "errorEnvelope"); exact(root, ["error"], "errorEnvelope"); const error = objectAt(root.error, "errorEnvelope.error"); const allowed = error.requestId === undefined ? ["code", "message"] : ["code", "message", "requestId"]; exact(error, allowed, "errorEnvelope.error"); const code = identity(error.code, "errorEnvelope.error.code"), message = identity(error.message, "errorEnvelope.error.message"); const requestId = error.requestId === undefined ? undefined : identity(error.requestId, "errorEnvelope.error.requestId"); return frozen({ error: frozen(requestId === undefined ? { code, message } : { code, message, requestId }) }); }
