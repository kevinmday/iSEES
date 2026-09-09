import { createSourceCapsuleV1, serializeSourceCapsuleV1 } from "./SourceCapsuleCanonicalization.ts";
import { SOURCE_CAPSULE_SCHEMA_ID, SOURCE_CAPSULE_SCHEMA_VERSION, type SourceCapsuleV1, type UnsignedSourceCapsuleV1 } from "./SourceCapsuleV1.ts";
import { SourceCapsuleValidationError, validateSourceCapsuleV1 } from "./SourceCapsuleValidation.ts";
import type { SourceCapsuleExportArtifact, SourceCapsuleExportErrorCode, SourceCapsuleExportRequest } from "./SourceCapsuleExportTypes.ts";

export class SourceCapsuleExportError extends Error {
  readonly code: SourceCapsuleExportErrorCode;
  readonly validationCode?: string;

  constructor(code: SourceCapsuleExportErrorCode, message: string, validationCode?: string) {
    super(message);
    this.name = "SourceCapsuleExportError";
    this.code = code;
    this.validationCode = validationCode;
  }
}

const fail = (code: SourceCapsuleExportErrorCode, message: string): never => {
  throw new SourceCapsuleExportError(code, message);
};

const forbiddenKey = /^(authorization|proxyauthorization|cookie|setcookie|headers?|requestheaders?|credentials?|password|tokens?|accesstoken|refreshtoken|apikey|localstorage|sessionstorage|browserstorage|sessionid|sessionidentifier|researchanchor|candidateevidence|candidateknowledge|systemcanon|canonicalauthority)$/i;

function inspect(value: unknown, path = "$", seen = new Set<object>()): void {
  if (value === null || typeof value === "string" || typeof value === "boolean" || (typeof value === "number" && Number.isFinite(value))) return;
  if (Array.isArray(value)) {
    if (seen.has(value)) fail("MALFORMED_EXPORT_REQUEST", "Export request must not contain cycles.");
    seen.add(value);
    value.forEach((item, index) => inspect(item, `${path}[${index}]`, seen));
    return;
  }
  if (!value || typeof value !== "object" || Object.getPrototypeOf(value as object) !== Object.prototype) fail("MALFORMED_EXPORT_REQUEST", `${path} must be JSON-compatible.`);
  const record = value as Record<string, unknown>;
  if (seen.has(record)) fail("MALFORMED_EXPORT_REQUEST", "Export request must not contain cycles.");
  seen.add(record);
  for (const [key, item] of Object.entries(record)) {
    if (forbiddenKey.test(key.replace(/[_-]/g, ""))) fail("FORBIDDEN_MATERIAL", `Prohibited material occurs at ${path}.${key}.`);
    if (item === undefined) fail("MALFORMED_EXPORT_REQUEST", `${path}.${key} must not be undefined.`);
    inspect(item, `${path}.${key}`, seen);
  }
}

function exactKeys(value: unknown, required: readonly string[], optional: readonly string[], path: string): asserts value is Record<string, unknown> {
  if (!value || typeof value !== "object" || Array.isArray(value)) fail("MALFORMED_EXPORT_REQUEST", `${path} must be an object.`);
  const record = value as Record<string, unknown>;
  for (const key of required) if (!(key in record)) fail("MALFORMED_EXPORT_REQUEST", `${path}.${key} is required.`);
  const allowed = new Set([...required, ...optional]);
  for (const key of Object.keys(record)) if (!allowed.has(key)) fail("MALFORMED_EXPORT_REQUEST", `${path}.${key} is not allowed.`);
}

function validateRequestShape(value: unknown): asserts value is SourceCapsuleExportRequest {
  inspect(value);
  if (!value || typeof value !== "object" || Array.isArray(value) || (value as Record<string, unknown>).confirmed !== true) fail("CAPTURE_NOT_CONFIRMED", "Capture requires explicit researcher confirmation.");
  exactKeys(value, ["confirmed", "capsuleId", "capturedAt", "source", "rightsClassification", "privacyClassification", "passages", "researcherNotes"], ["filenameStem"], "$request");
  exactKeys(value.source, ["identity", "finalUrl"], ["requestedUrl", "redirectChain", "canonicalUrl", "pageTitle", "publisher", "authorByline", "publishedAt", "modifiedAt", "language", "revisionIdentity"], "$request.source");
  const passages = value.passages;
  const researcherNotes = value.researcherNotes;
  if (!Array.isArray(passages) || !Array.isArray(researcherNotes)) fail("MALFORMED_EXPORT_REQUEST", "Passages and researcher notes must be arrays.");
  (passages as unknown[]).forEach((passage: unknown, index: number) => {
    exactKeys(passage, ["passageId", "exactText"], ["originalHtml", "htmlSanitization", "governingHeading", "prefixContext", "suffixContext", "documentPosition", "selection"], `$request.passages[${index}]`);
    if ("documentPosition" in passage) exactKeys(passage.documentPosition, ["kind"], ["startOffset", "endOffset", "domPath", "pageNumber"], `$request.passages[${index}].documentPosition`);
    if ("selection" in passage) exactKeys(passage.selection, [], ["selectionId", "direction"], `$request.passages[${index}].selection`);
  });
  (researcherNotes as unknown[]).forEach((note: unknown, index: number) => exactKeys(note, ["noteId", "researcherId", "createdAt", "text"], ["derivedFromPassageIds"], `$request.researcherNotes[${index}]`));
}

function deepFreeze<T>(value: T, seen = new Set<object>()): T {
  if (value && typeof value === "object" && !seen.has(value)) {
    seen.add(value);
    for (const child of Object.values(value as Record<string, unknown>)) deepFreeze(child, seen);
    Object.freeze(value);
  }
  return value;
}

const reservedDevice = /^(?:con|prn|aux|nul|com[1-9]|lpt[1-9])(?:\.|$)/i;
const safeStem = /^[A-Za-z0-9][A-Za-z0-9._-]{0,119}$/;

function filenameFor(stem: unknown, capsuleHash: string): string {
  const fallback = `source-capsule-${capsuleHash.slice("sha256:".length, "sha256:".length + 24)}`;
  if (stem === undefined) return `${fallback}.isees-source.json`;
  if (typeof stem !== "string" || !safeStem.test(stem) || stem.includes("..") || stem.endsWith(".") || stem.endsWith(" ") || reservedDevice.test(stem)) {
    fail("UNSAFE_FILENAME", "Requested filename stem is unsafe.");
  }
  return `${stem}.isees-source.json`;
}

export async function exportSourceCapsule(request: unknown): Promise<SourceCapsuleExportArtifact> {
  validateRequestShape(request);
  const unsigned: UnsignedSourceCapsuleV1 = {
    schema: { identity: SOURCE_CAPSULE_SCHEMA_ID, version: SOURCE_CAPSULE_SCHEMA_VERSION },
    capsuleId: request.capsuleId,
    captureMethod: "ISEES_CAPTURE_EXPLICIT",
    capturedAt: request.capturedAt,
    source: structuredClone(request.source),
    rightsClassification: request.rightsClassification,
    privacyClassification: request.privacyClassification,
    passages: structuredClone(request.passages),
    researcherNotes: structuredClone(request.researcherNotes),
  };
  let capsule: SourceCapsuleV1;
  try {
    capsule = await validateSourceCapsuleV1(await createSourceCapsuleV1(unsigned));
  } catch (error) {
    if (error instanceof SourceCapsuleValidationError) throw new SourceCapsuleExportError("SOURCE_CAPSULE_VALIDATION_FAILED", "Source Capsule v1 validation failed.", error.code);
    throw new SourceCapsuleExportError("EXPORT_ENCODING_FAILED", "Source Capsule hashing or encoding failed.");
  }
  let canonicalJson: string;
  let retainedBytes: Uint8Array;
  try {
    canonicalJson = serializeSourceCapsuleV1(capsule);
    retainedBytes = new TextEncoder().encode(canonicalJson);
  } catch {
    throw new SourceCapsuleExportError("EXPORT_ENCODING_FAILED", "Source Capsule serialization or UTF-8 encoding failed.");
  }
  const frozenCapsule = deepFreeze(capsule);
  const artifact: SourceCapsuleExportArtifact = {
    filename: filenameFor(request.filenameStem, frozenCapsule.integrity.capsuleHash),
    mediaType: "application/json",
    canonicalJson,
    byteLength: retainedBytes.byteLength,
    capsuleHash: frozenCapsule.integrity.capsuleHash,
    capsule: frozenCapsule,
    utf8Bytes: () => retainedBytes.slice(),
  };
  return deepFreeze(artifact);
}
