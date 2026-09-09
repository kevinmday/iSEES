import { capsuleHashBasis, canonicalizeSourceCapsuleJson, passageHashBasis, sha256SourceCapsuleValue } from "./SourceCapsuleCanonicalization.ts";
import { SOURCE_CAPSULE_LIMITS, SOURCE_CAPSULE_SCHEMA_ID, SOURCE_CAPSULE_SCHEMA_VERSION, type SourceCapsuleV1 } from "./SourceCapsuleV1.ts";

export class SourceCapsuleValidationError extends Error {
  readonly code: string;
  constructor(code: string, message: string) { super(message); this.code = code; this.name = "SourceCapsuleValidationError"; }
}

const fail = (code: string, message: string): never => { throw new SourceCapsuleValidationError(code, message); };
const bytes = (value: string): number => new TextEncoder().encode(value).byteLength;
const object = (value: unknown, path: string): Record<string, unknown> => {
  if (!value || typeof value !== "object" || Array.isArray(value)) fail("INVALID_OBJECT", `${path} must be an object.`);
  return value as Record<string, unknown>;
};
const exactKeys = (value: Record<string, unknown>, required: readonly string[], optional: readonly string[], path: string): void => {
  for (const key of required) if (!(key in value)) fail("MISSING_PROPERTY", `${path}.${key} is required.`);
  const allowed = new Set([...required, ...optional]);
  for (const key of Object.keys(value)) if (!allowed.has(key)) fail("UNEXPECTED_PROPERTY", `${path}.${key} is not allowed.`);
};
const text = (value: unknown, path: string, maxBytes = 1024): string => {
  if (typeof value !== "string" || value.length === 0 || value.trim().length === 0) fail("INVALID_TEXT", `${path} must be a non-empty string.`);
  const candidate = value as string;
  if (bytes(candidate) > maxBytes) fail("TEXT_TOO_LARGE", `${path} exceeds its UTF-8 byte limit.`);
  return candidate;
};
const timestamp = (value: unknown, path: string): string => {
  const candidate = text(value, path, 64);
  if (!/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/.test(candidate) || new Date(candidate).toISOString() !== candidate) {
    fail("INVALID_TIMESTAMP", `${path} must be a normalized UTC ISO-8601 timestamp with milliseconds.`);
  }
  return candidate;
};
const url = (value: unknown, path: string): string => {
  const candidate = text(value, path, 8_192);
  if (candidate !== candidate.trim() || /[\u0000-\u001f\u007f]/.test(candidate)) fail("INVALID_URL", `${path} must not contain surrounding whitespace or control characters.`);
  let parsed: URL;
  try { parsed = new URL(candidate); } catch { return fail("INVALID_URL", `${path} must be a valid HTTP(S) URL.`); }
  if ((parsed.protocol !== "http:" && parsed.protocol !== "https:") || parsed.username || parsed.password) {
    fail("INVALID_URL", `${path} must be a credential-free HTTP(S) URL.`);
  }
  return candidate;
};
const enumValue = (value: unknown, choices: readonly string[], path: string): void => {
  if (typeof value !== "string" || !choices.includes(value)) fail("INVALID_ENUM", `${path} is not supported.`);
};

const forbiddenKey = /^(authorization|proxyauthorization|cookie|setcookie|headers?|requestheaders?|credentials?|password|tokens?|accesstoken|refreshtoken|apikey|localstorage|sessionstorage|browserstorage|sessionid|sessionidentifier)$/i;
function rejectSecretMaterial(value: unknown, path = "$"): void {
  if (Array.isArray(value)) return value.forEach((item, index) => rejectSecretMaterial(item, `${path}[${index}]`));
  if (!value || typeof value !== "object") return;
  for (const [key, item] of Object.entries(value as Record<string, unknown>)) {
    if (forbiddenKey.test(key.replace(/[_-]/g, ""))) fail("FORBIDDEN_MATERIAL", `${path}.${key} is prohibited capture material.`);
    rejectSecretMaterial(item, `${path}.${key}`);
  }
}

function validateSafeHtml(value: unknown, marker: unknown, path: string): void {
  const html = text(value, path, SOURCE_CAPSULE_LIMITS.maxPassageHtmlBytes);
  if (marker !== "ISEES_CAPTURE_ALLOWLIST_V1") fail("UNSANITIZED_HTML", `${path} requires the v1 sanitization marker.`);
  if (/<!--|<!doctype|<\?|<\/?(?:script|style|iframe|object|embed|svg|math|form|input|button|link|meta|base|template)\b|\bon\w+\s*=|\b(?:href|src|action|style)\s*=|javascript:|data:/i.test(html)) {
    fail("UNSAFE_HTML", `${path} contains executable or unsafe markup.`);
  }
  const tags = html.match(/<[^>]*>/g) ?? [];
  for (const tag of tags) if (!/^<\/?(?:b|i|em|strong|p|br|span|blockquote|code|pre|ul|ol|li|h[1-6])\s*\/?\s*>$/i.test(tag)) {
    fail("UNSAFE_HTML", `${path} contains markup outside the inert allowlist.`);
  }
  if (/[<>]/.test(html.replace(/<[^>]*>/g, ""))) fail("UNSAFE_HTML", `${path} contains malformed markup.`);
}

function validatePassage(value: unknown, index: number): void {
  const path = `$.passages[${index}]`; const passage = object(value, path);
  exactKeys(passage, ["passageId", "exactText", "passageHash"], ["originalHtml", "htmlSanitization", "governingHeading", "prefixContext", "suffixContext", "documentPosition", "selection"], path);
  text(passage.passageId, `${path}.passageId`, 256);
  text(passage.exactText, `${path}.exactText`, SOURCE_CAPSULE_LIMITS.maxPassageTextBytes);
  text(passage.passageHash, `${path}.passageHash`, 71);
  if (("originalHtml" in passage) !== ("htmlSanitization" in passage)) fail("UNSANITIZED_HTML", `${path} HTML and its sanitization marker must occur together.`);
  if ("originalHtml" in passage) validateSafeHtml(passage.originalHtml, passage.htmlSanitization, `${path}.originalHtml`);
  for (const key of ["governingHeading", "prefixContext", "suffixContext"] as const) if (key in passage) text(passage[key], `${path}.${key}`, key === "governingHeading" ? 2_048 : SOURCE_CAPSULE_LIMITS.maxContextBytes);
  if ("documentPosition" in passage) {
    const position = object(passage.documentPosition, `${path}.documentPosition`);
    exactKeys(position, ["kind"], ["startOffset", "endOffset", "domPath", "pageNumber"], `${path}.documentPosition`);
    enumValue(position.kind, ["TEXT_OFFSETS", "DOM_PATH", "PAGE", "UNKNOWN"], `${path}.documentPosition.kind`);
    const integer = (key: string): number => { const item = position[key]; if (!Number.isSafeInteger(item) || (item as number) < 0) fail("INVALID_POSITION", `${path}.documentPosition.${key} must be a non-negative safe integer.`); return item as number; };
    if (position.kind === "TEXT_OFFSETS") { if (!("startOffset" in position) || !("endOffset" in position) || integer("endOffset") < integer("startOffset")) fail("INVALID_POSITION", `${path} requires ordered text offsets.`); }
    else if ("startOffset" in position || "endOffset" in position) fail("MANUFACTURED_POSITION", `${path} offsets are allowed only when their kind is TEXT_OFFSETS.`);
    if (position.kind === "DOM_PATH") { if (!("domPath" in position)) fail("INVALID_POSITION", `${path} requires domPath.`); text(position.domPath, `${path}.documentPosition.domPath`, 4_096); } else if ("domPath" in position) fail("MANUFACTURED_POSITION", `${path} domPath does not match its kind.`);
    if (position.kind === "PAGE") { if (!("pageNumber" in position) || integer("pageNumber") < 1) fail("INVALID_POSITION", `${path} requires a positive pageNumber.`); } else if ("pageNumber" in position) fail("MANUFACTURED_POSITION", `${path} pageNumber does not match its kind.`);
    if (position.kind === "UNKNOWN" && Object.keys(position).length !== 1) fail("MANUFACTURED_POSITION", `${path} UNKNOWN cannot carry invented position values.`);
  }
  if ("selection" in passage) {
    const selection = object(passage.selection, `${path}.selection`);
    exactKeys(selection, [], ["selectionId", "direction"], `${path}.selection`);
    if (!Object.keys(selection).length) fail("EMPTY_SELECTION", `${path}.selection must carry known metadata or be absent.`);
    if ("selectionId" in selection) text(selection.selectionId, `${path}.selection.selectionId`, 256);
    if ("direction" in selection) enumValue(selection.direction, ["FORWARD", "BACKWARD", "NONE"], `${path}.selection.direction`);
  }
}

export async function validateSourceCapsuleV1(value: unknown): Promise<SourceCapsuleV1> {
  rejectSecretMaterial(value);
  const capsule = object(value, "$");
  exactKeys(capsule, ["schema", "capsuleId", "captureMethod", "capturedAt", "source", "rightsClassification", "privacyClassification", "passages", "researcherNotes", "integrity"], [], "$");
  const schema = object(capsule.schema, "$.schema"); exactKeys(schema, ["identity", "version"], [], "$.schema");
  if (schema.identity !== SOURCE_CAPSULE_SCHEMA_ID || schema.version !== SOURCE_CAPSULE_SCHEMA_VERSION) fail("UNSUPPORTED_SCHEMA", "Only Source Capsule schema v1 is supported.");
  text(capsule.capsuleId, "$.capsuleId", 256);
  if (capsule.captureMethod !== "ISEES_CAPTURE_EXPLICIT") fail("INVALID_CAPTURE_METHOD", "Capture must be explicitly activated.");
  timestamp(capsule.capturedAt, "$.capturedAt");
  const source = object(capsule.source, "$.source");
  exactKeys(source, ["identity", "finalUrl"], ["requestedUrl", "redirectChain", "canonicalUrl", "pageTitle", "publisher", "authorByline", "publishedAt", "modifiedAt", "language", "revisionIdentity"], "$.source");
  text(source.identity, "$.source.identity", 1_024); url(source.finalUrl, "$.source.finalUrl");
  for (const key of ["requestedUrl", "canonicalUrl"] as const) if (key in source) url(source[key], `$.source.${key}`);
  if ("redirectChain" in source) { if (!Array.isArray(source.redirectChain)) fail("INVALID_REDIRECT_CHAIN", "Redirect chain must be an array."); const redirects = source.redirectChain as unknown[]; if (redirects.length > SOURCE_CAPSULE_LIMITS.maxRedirects) fail("TOO_MANY_REDIRECTS", "Redirect chain exceeds the v1 bound."); redirects.forEach((item, index) => url(item, `$.source.redirectChain[${index}]`)); }
  for (const key of ["pageTitle", "publisher", "authorByline", "language", "revisionIdentity"] as const) if (key in source) text(source[key], `$.source.${key}`, key === "language" ? 64 : 4_096);
  for (const key of ["publishedAt", "modifiedAt"] as const) if (key in source) timestamp(source[key], `$.source.${key}`);
  enumValue(capsule.rightsClassification, ["PUBLIC_REFERENCE", "RESEARCHER_OWNED", "PRIVATE_CORRESPONDENCE", "PERSONAL_COMMUNICATION", "RESTRICTED_DISTRIBUTION", "LICENSED_REPOSITORY_CONTENT", "QUOTATION_PERMITTED", "REFERENCE_ONLY", "UNKNOWN_RIGHTS"], "$.rightsClassification");
  enumValue(capsule.privacyClassification, ["PUBLIC", "PRIVATE", "RESTRICTED", "UNKNOWN"], "$.privacyClassification");
  if (!Array.isArray(capsule.passages) || capsule.passages.length < 1) fail("MISSING_PASSAGES", "At least one Source Passage is required.");
  const passages = capsule.passages as unknown[];
  if (passages.length > SOURCE_CAPSULE_LIMITS.maxPassages) fail("TOO_MANY_PASSAGES", "Passage count exceeds the v1 bound.");
  passages.forEach(validatePassage);
  const passageIds = passages.map(item => (item as Record<string, unknown>).passageId);
  if (new Set(passageIds).size !== passageIds.length) fail("DUPLICATE_PASSAGE", "Passage identities must be unique.");
  if (!Array.isArray(capsule.researcherNotes)) fail("INVALID_NOTES", "Researcher notes must be an array separate from Source Passages.");
  const researcherNotes = capsule.researcherNotes as unknown[];
  const noteIds: unknown[] = [];
  researcherNotes.forEach((item, index) => {
    const path = `$.researcherNotes[${index}]`; const note = object(item, path);
    exactKeys(note, ["noteId", "researcherId", "createdAt", "text"], ["derivedFromPassageIds"], path);
    noteIds.push(text(note.noteId, `${path}.noteId`, 256)); text(note.researcherId, `${path}.researcherId`, 256); timestamp(note.createdAt, `${path}.createdAt`); text(note.text, `${path}.text`, SOURCE_CAPSULE_LIMITS.maxNoteBytes);
    if ("derivedFromPassageIds" in note) { if (!Array.isArray(note.derivedFromPassageIds) || !note.derivedFromPassageIds.length) fail("INVALID_NOTE_LINEAGE", `${path}.derivedFromPassageIds must be a non-empty array.`); const lineage = note.derivedFromPassageIds as unknown[]; for (const id of lineage) { text(id, `${path}.derivedFromPassageIds`, 256); if (!passageIds.includes(id)) fail("INVALID_NOTE_LINEAGE", `${path} references an unknown passage.`); } if (new Set(lineage).size !== lineage.length) fail("INVALID_NOTE_LINEAGE", `${path} repeats passage lineage.`); }
  });
  if (new Set(noteIds).size !== noteIds.length) fail("DUPLICATE_NOTE", "Researcher note identities must be unique.");
  const integrity = object(capsule.integrity, "$.integrity"); exactKeys(integrity, ["algorithm", "capsuleHash"], [], "$.integrity");
  if (integrity.algorithm !== "SHA-256") fail("INVALID_INTEGRITY", "Only SHA-256 integrity is supported."); text(integrity.capsuleHash, "$.integrity.capsuleHash", 71);
  const typed = capsule as unknown as SourceCapsuleV1;
  for (const passage of typed.passages) if (!/^sha256:[0-9a-f]{64}$/.test(passage.passageHash) || await sha256SourceCapsuleValue(passageHashBasis(passage)) !== passage.passageHash) fail("PASSAGE_HASH_MISMATCH", `Passage ${passage.passageId} failed integrity validation.`);
  if (!/^sha256:[0-9a-f]{64}$/.test(typed.integrity.capsuleHash) || await sha256SourceCapsuleValue(capsuleHashBasis(typed)) !== typed.integrity.capsuleHash) fail("CAPSULE_HASH_MISMATCH", "Source Capsule failed integrity validation.");
  if (bytes(canonicalizeSourceCapsuleJson(typed)) > SOURCE_CAPSULE_LIMITS.maxPackageBytes) fail("PACKAGE_TOO_LARGE", "Source Capsule exceeds the v1 package byte bound.");
  return typed;
}

export function assertNoCapsuleIdentityConflict(existing: SourceCapsuleV1, incoming: SourceCapsuleV1): void {
  if (existing.capsuleId === incoming.capsuleId && existing.integrity.capsuleHash !== incoming.integrity.capsuleHash) fail("CAPSULE_IDENTITY_CONFLICT", `Capsule identity ${existing.capsuleId} has conflicting immutable content.`);
}
