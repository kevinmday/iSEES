import {
  ENTITY_DOSSIER_SCHEMA_VERSION,
  type EntityDossierFact,
  type EntityDossierProjectionBinding,
  type EntityDossierRelationshipFact,
  type EntityDossierRevision,
  type EntityDossierRevisionInput,
  type GovernedEntityDossier,
} from "./EntityDossierTypes.ts";

export class EntityDossierValidationError extends Error {}

type Json = null | boolean | number | string | readonly Json[] | { readonly [key: string]: Json };

const compare = (a: string, b: string): number => a < b ? -1 : a > b ? 1 : 0;
const required = (value: string, name: string): void => {
  if (value.trim().length === 0) throw new EntityDossierValidationError(`${name} must be non-blank`);
};
const unique = (values: readonly string[], name: string): void => {
  if (new Set(values).size !== values.length) throw new EntityDossierValidationError(`duplicate ${name}`);
};
const hash = (value: string, name: string): void => {
  if (!/^sha256:[0-9a-f]{64}$/.test(value)) throw new EntityDossierValidationError(`${name} must be SHA-256`);
};
const iso = (value: string, name: string): void => {
  if (!/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/.test(value) || Number.isNaN(Date.parse(value))) {
    throw new EntityDossierValidationError(`${name} must be canonical UTC`);
  }
};

export function canonicalizeEntityDossierJson(value: unknown): string {
  if (value === null || typeof value === "boolean" || typeof value === "string") return JSON.stringify(value);
  if (typeof value === "number" && Number.isFinite(value)) return JSON.stringify(value);
  if (Array.isArray(value)) return `[${value.map(canonicalizeEntityDossierJson).join(",")}]`;
  if (typeof value === "object") {
    const record = value as Record<string, unknown>;
    return `{${Object.keys(record).sort(compare).map(key => `${JSON.stringify(key)}:${canonicalizeEntityDossierJson(record[key])}`).join(",")}}`;
  }
  throw new EntityDossierValidationError("canonical JSON supports only finite JSON-compatible values");
}

function sha256(text: string): string {
  const bytes = new TextEncoder().encode(text);
  const length = Math.ceil((bytes.length + 9) / 64) * 64;
  const data = new Uint8Array(length); data.set(bytes); data[bytes.length] = 0x80;
  const view = new DataView(data.buffer); const bits = bytes.length * 8;
  view.setUint32(length - 8, Math.floor(bits / 0x100000000)); view.setUint32(length - 4, bits >>> 0);
  const h = new Uint32Array([0x6a09e667,0xbb67ae85,0x3c6ef372,0xa54ff53a,0x510e527f,0x9b05688c,0x1f83d9ab,0x5be0cd19]);
  const k = new Uint32Array([0x428a2f98,0x71374491,0xb5c0fbcf,0xe9b5dba5,0x3956c25b,0x59f111f1,0x923f82a4,0xab1c5ed5,0xd807aa98,0x12835b01,0x243185be,0x550c7dc3,0x72be5d74,0x80deb1fe,0x9bdc06a7,0xc19bf174,0xe49b69c1,0xefbe4786,0x0fc19dc6,0x240ca1cc,0x2de92c6f,0x4a7484aa,0x5cb0a9dc,0x76f988da,0x983e5152,0xa831c66d,0xb00327c8,0xbf597fc7,0xc6e00bf3,0xd5a79147,0x06ca6351,0x14292967,0x27b70a85,0x2e1b2138,0x4d2c6dfc,0x53380d13,0x650a7354,0x766a0abb,0x81c2c92e,0x92722c85,0xa2bfe8a1,0xa81a664b,0xc24b8b70,0xc76c51a3,0xd192e819,0xd6990624,0xf40e3585,0x106aa070,0x19a4c116,0x1e376c08,0x2748774c,0x34b0bcb5,0x391c0cb3,0x4ed8aa4a,0x5b9cca4f,0x682e6ff3,0x748f82ee,0x78a5636f,0x84c87814,0x8cc70208,0x90befffa,0xa4506ceb,0xbef9a3f7,0xc67178f2]);
  const rotate = (x: number, n: number): number => (x >>> n) | (x << (32 - n)); const w = new Uint32Array(64);
  for (let offset = 0; offset < data.length; offset += 64) {
    for (let i = 0; i < 16; i += 1) w[i] = view.getUint32(offset + i * 4);
    for (let i = 16; i < 64; i += 1) { const a = rotate(w[i - 15], 7) ^ rotate(w[i - 15], 18) ^ (w[i - 15] >>> 3); const b = rotate(w[i - 2], 17) ^ rotate(w[i - 2], 19) ^ (w[i - 2] >>> 10); w[i] = (w[i - 16] + a + w[i - 7] + b) >>> 0; }
    let [a,b,c,d,e,f,g,z] = h;
    for (let i = 0; i < 64; i += 1) { const s1=rotate(e,6)^rotate(e,11)^rotate(e,25); const ch=(e&f)^(~e&g); const t1=(z+s1+ch+k[i]+w[i])>>>0; const s0=rotate(a,2)^rotate(a,13)^rotate(a,22); const maj=(a&b)^(a&c)^(b&c); const t2=(s0+maj)>>>0; z=g;g=f;f=e;e=(d+t1)>>>0;d=c;c=b;b=a;a=(t1+t2)>>>0; }
    [a,b,c,d,e,f,g,z].forEach((value, i) => { h[i] = (h[i] + value) >>> 0; });
  }
  return [...h].map(value => value.toString(16).padStart(8, "0")).join("");
}

export const entityDossierSha256 = (value: unknown): string => `sha256:${sha256(canonicalizeEntityDossierJson(value))}`;

function deepFreeze<T>(value: T): T {
  if (value !== null && typeof value === "object" && !Object.isFrozen(value)) {
    Object.freeze(value);
    for (const child of Object.values(value as Record<string, unknown>)) deepFreeze(child);
  }
  return value;
}

function normalizeFact<T extends EntityDossierFact | EntityDossierRelationshipFact>(fact: T): T {
  return { ...fact, uncertainty: [...fact.uncertainty].sort((a, b) => compare(a.code, b.code)), limitationIds: [...fact.limitationIds].sort(compare) };
}

function normalizeInput(input: EntityDossierRevisionInput): EntityDossierRevisionInput {
  return {
    ...input,
    entityIdentity: { ...input.entityIdentity, aliases: [...input.entityIdentity.aliases].sort(compare), identifiers: [...input.entityIdentity.identifiers].sort((a, b) => compare(a.identifierId, b.identifierId)) },
    facts: input.facts.map(normalizeFact).sort((a, b) => compare(a.factId, b.factId)),
    relationshipFacts: input.relationshipFacts.map(normalizeFact).sort((a, b) => compare(a.factId, b.factId)),
    sourceRecords: input.sourceRecords.map(source => ({
      ...source,
      ...(source.authoritativeScope === undefined ? {} : { authoritativeScope: [...source.authoritativeScope].sort(compare) }),
    })).sort((a, b) => compare(a.sourceRecordId, b.sourceRecordId)),
    sourceLinks: [...input.sourceLinks].sort((a, b) => compare(a.sourceLinkId, b.sourceLinkId)),
    fieldAvailability: [...input.fieldAvailability].sort((a, b) => compare(a.field, b.field)),
    limitations: [...input.limitations].sort((a, b) => compare(a.limitationId, b.limitationId)),
  };
}

function validateQualification(fact: EntityDossierFact | EntityDossierRelationshipFact): void {
  const temporal = fact.temporalQualification;
  if ("effectiveTime" in temporal) iso(temporal.effectiveTime, `${fact.factId} effectiveTime`);
  if (temporal.kind === "RANGE") { iso(temporal.effectiveFrom, `${fact.factId} effectiveFrom`); iso(temporal.effectiveTo, `${fact.factId} effectiveTo`); }
  if (fact.geographicQualification.state === "AVAILABLE" && fact.geographicQualification.placeId === undefined && fact.geographicQualification.latitude === undefined && fact.geographicQualification.longitude === undefined) throw new EntityDossierValidationError(`${fact.factId} available geography must carry a value`);
}

export function validateEntityDossierRevision(revision: EntityDossierRevision): void {
  if (revision.schemaVersion !== ENTITY_DOSSIER_SCHEMA_VERSION) throw new EntityDossierValidationError("schema mismatch");
  if (revision.immutableState !== "IMMUTABLE") throw new EntityDossierValidationError("revision must be immutable");
  if (!Number.isInteger(revision.revisionNumber) || revision.revisionNumber < 1) throw new EntityDossierValidationError("revision number must be positive integer");
  if (revision.revisionNumber === 1 && revision.parentRevisionId !== undefined) throw new EntityDossierValidationError("first revision cannot have parent");
  if (revision.revisionNumber > 1 && revision.parentRevisionId === undefined) throw new EntityDossierValidationError("later revision requires stable parent lineage");
  if (revision.scope === "GLOBAL_BASE" && revision.investigationId !== undefined) throw new EntityDossierValidationError("global base cannot carry investigation ID");
  if (revision.scope === "INVESTIGATION_OVERLAY" && revision.investigationId === undefined) throw new EntityDossierValidationError("investigation overlay requires investigation ID");
  required(revision.entityIdentity.canonicalEntityId, "canonical entity ID");
  if (revision.entityIdentity.canonicalEntityId !== revision.dossierId.replace(/^dossier:/, "")) throw new EntityDossierValidationError("entity/revision mismatch");
  unique(revision.entityIdentity.identifiers.map(value => value.identifierId), "identifier IDs");
  const facts = [...revision.facts, ...revision.relationshipFacts];
  unique(facts.map(value => value.factId), "fact IDs");
  unique(revision.sourceRecords.map(value => value.sourceRecordId), "source record IDs");
  unique(revision.sourceLinks.map(value => value.sourceLinkId), "source link IDs");
  unique(revision.fieldAvailability.map(value => value.field), "availability fields");
  unique(revision.limitations.map(value => value.limitationId), "limitation IDs");
  const factIds = new Set(facts.map(value => value.factId)); const sourceIds = new Set(revision.sourceRecords.map(value => value.sourceRecordId));
  for (const fact of facts) {
    if (fact.subjectEntityId !== revision.entityIdentity.canonicalEntityId) throw new EntityDossierValidationError(`${fact.factId} entity mismatch`);
    validateQualification(fact);
    if (["INFERRED", "GENERATED", "PROVIDER_SUMMARY"].includes(fact.derivation) && ["ESTABLISHED", "CORROBORATED"].includes(fact.epistemicClassification)) throw new EntityDossierValidationError(`${fact.factId} derivation cannot claim established authority`);
    if ((fact.reviewStatus !== "ACCEPTED" || ["CANDIDATE", "UNRESOLVED"].includes(fact.epistemicClassification)) && fact.canonEffect !== "NONE") throw new EntityDossierValidationError(`${fact.factId} candidate or review-required material must have canon effect NONE`);
    if (fact.reviewStatus === "ACCEPTED" && fact.canonEffect !== "NONE" && !revision.sourceLinks.some(link => link.factId === fact.factId && link.relationship === "SUPPORTS")) throw new EntityDossierValidationError(`${fact.factId} accepted material fact requires supporting source linkage`);
    if (revision.revisionNumber > 1) {
      if (fact.category === undefined || fact.displayLabel === undefined || fact.scope === undefined || fact.applicability === undefined || fact.conflictState === undefined || fact.governingDossierRevisionId === undefined) throw new EntityDossierValidationError(`${fact.factId} operational governance fields are required`);
      required(fact.displayLabel, `${fact.factId} displayLabel`);
      if (fact.scope !== revision.scope) throw new EntityDossierValidationError(`${fact.factId} fact scope mismatch`);
      if (fact.governingDossierRevisionId !== revision.dossierRevisionId) throw new EntityDossierValidationError(`${fact.factId} governing revision mismatch`);
      if ("value" in fact && fact.value.valueType === "DATE") iso(fact.value.value, `${fact.factId} date value`);
      if ("value" in fact && fact.value.valueType === "URL_REFERENCE" && !/^https:\/\//.test(fact.value.url)) throw new EntityDossierValidationError(`${fact.factId} URL reference must use HTTPS`);
    }
    for (const limitationId of fact.limitationIds) if (!revision.limitations.some(value => value.limitationId === limitationId)) throw new EntityDossierValidationError(`${fact.factId} has dangling limitation`);
  }
  for (const link of revision.sourceLinks) {
    if (!factIds.has(link.factId)) throw new EntityDossierValidationError(`${link.sourceLinkId} has dangling fact reference`);
    if (!sourceIds.has(link.sourceRecordId)) throw new EntityDossierValidationError(`${link.sourceLinkId} has dangling source reference`);
    if (revision.revisionNumber > 1) {
      if (link.governingDossierRevisionId !== revision.dossierRevisionId) throw new EntityDossierValidationError(`${link.sourceLinkId} governing revision mismatch`);
      if (link.citationLocator === undefined) throw new EntityDossierValidationError(`${link.sourceLinkId} requires citation locator`);
      required(link.citationLocator, `${link.sourceLinkId} citationLocator`);
      if (link.extractedFragmentHash !== undefined) hash(link.extractedFragmentHash, `${link.sourceLinkId} extractedFragmentHash`);
    }
  }
  for (const source of revision.sourceRecords) {
    required(source.authority, "source authority"); required(source.publisher, "source publisher"); required(source.snapshotIdentity, "snapshot identity");
    if (source.locator === undefined && source.repositoryIdentity === undefined) throw new EntityDossierValidationError(`${source.sourceRecordId} requires locator or repository identity`);
    iso(source.retrievedAt, "retrievedAt"); if (source.publicationTime !== undefined) iso(source.publicationTime, "publicationTime"); if (source.effectiveTime !== undefined) iso(source.effectiveTime, "effectiveTime"); hash(source.contentHash, "source contentHash");
    if (source.lastVerifiedAt !== undefined) iso(source.lastVerifiedAt, "lastVerifiedAt");
    if (revision.revisionNumber > 1) {
      if (source.sourceTitle === undefined || source.sourceType === undefined || source.sourceRevisionLabel === undefined || source.mediaType === undefined || source.authoritativeScope === undefined || source.authoritativeScope.length === 0 || source.freshnessPolicy === undefined) throw new EntityDossierValidationError(`${source.sourceRecordId} operational source fields are required`);
      required(source.sourceTitle, "source title"); required(source.sourceRevisionLabel, "source revision label"); required(source.mediaType, "source media type");
      source.authoritativeScope.forEach(value => required(value, "source authoritative scope"));
    }
  }
  hash(revision.contentHash, "revision contentHash");
  const domain = { ...revision } as Record<string, unknown>; delete domain.contentHash;
  if (revision.contentHash !== entityDossierSha256(domain)) throw new EntityDossierValidationError("invalid content hash");
}

export function createEntityDossierRevision(input: EntityDossierRevisionInput): EntityDossierRevision {
  const normalized = normalizeInput(input); const revision = { ...normalized, contentHash: entityDossierSha256(normalized) };
  validateEntityDossierRevision(revision); return deepFreeze(revision);
}

export function createGovernedEntityDossier(input: Omit<GovernedEntityDossier, "revisions"> & { readonly revisions: readonly EntityDossierRevision[] }): GovernedEntityDossier {
  if (input.schemaVersion !== ENTITY_DOSSIER_SCHEMA_VERSION) throw new EntityDossierValidationError("dossier schema mismatch");
  if (input.scope === "GLOBAL_BASE" && input.investigationId !== undefined) throw new EntityDossierValidationError("global dossier cannot carry investigation ID");
  if (input.scope === "INVESTIGATION_OVERLAY" && input.investigationId === undefined) throw new EntityDossierValidationError("overlay dossier requires investigation ID");
  const revisions = [...input.revisions].sort((a, b) => a.revisionNumber - b.revisionNumber);
  unique(revisions.map(value => value.dossierRevisionId), "dossier revision IDs");
  revisions.forEach((revision, index) => { validateEntityDossierRevision(revision); if (revision.dossierId !== input.dossierId || revision.entityIdentity.canonicalEntityId !== input.canonicalEntityId || revision.scope !== input.scope || revision.schemaVersion !== input.schemaVersion || revision.investigationId !== input.investigationId) throw new EntityDossierValidationError("dossier/revision schema, entity, or scope mismatch"); if (revision.revisionNumber !== index + 1 || (index > 0 && revision.parentRevisionId !== revisions[index - 1].dossierRevisionId)) throw new EntityDossierValidationError("revision ordering or parent lineage mismatch"); });
  return deepFreeze({ ...input, revisions });
}

export function validateEntityDossierProjectionBinding(binding: EntityDossierProjectionBinding): void {
  for (const [name, value] of Object.entries(binding)) required(value, name);
  if (binding.dossierRevisionId.toLowerCase().includes("latest")) throw new EntityDossierValidationError("projection binding must pin an exact revision, never latest");
  hash(binding.dossierContentHash, "projection dossierContentHash");
}

export function cloneJson<T>(value: T): T { return JSON.parse(JSON.stringify(value)) as T; }
export type CanonicalEntityDossierJson = Json;
