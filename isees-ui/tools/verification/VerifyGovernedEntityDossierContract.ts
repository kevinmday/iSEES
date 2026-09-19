import {
  cloneJson,
  createEntityDossierRevision,
  createGovernedEntityDossier,
  EntityDossierValidationError,
  validateEntityDossierProjectionBinding,
  validateEntityDossierRevision,
} from "../../src/knowledge/dossier/EntityDossierCanonicalization.ts";
import { ENTITY_DOSSIER_SCHEMA_VERSION, type EntityDossierRevision, type EntityDossierRevisionInput } from "../../src/knowledge/dossier/EntityDossierTypes.ts";
import { USS_PRINCETON_GOVERNED_ENTITY_DOSSIER } from "../../src/knowledge/dossier/SystemCanonEntityDossierRegistry.ts";

function assert(condition: unknown, message: string): asserts condition { if (!condition) throw new Error(`VERIFY FAILED: ${message}`); }
function fails(action: () => void, fragment: string): void {
  try { action(); } catch (error) { assert(error instanceof EntityDossierValidationError, `expected governed validation error for ${fragment}`); assert(error.message.includes(fragment), `expected error containing ${fragment}, received ${error.message}`); return; }
  throw new Error(`VERIFY FAILED: expected failure containing ${fragment}`);
}

const fixture = USS_PRINCETON_GOVERNED_ENTITY_DOSSIER.revisions[0];
const inputOf = (revision: EntityDossierRevision): EntityDossierRevisionInput => { const value = cloneJson(revision) as EntityDossierRevision & { contentHash?: string }; delete value.contentHash; return value; };
const baseline = inputOf(fixture);

const reconstructed = createEntityDossierRevision(baseline);
assert(reconstructed.contentHash === fixture.contentHash, "valid global-base reconstruction must retain hash");
assert(reconstructed.investigationId === undefined, "global base must omit investigation identity");

const overlayRevision = createEntityDossierRevision({ ...baseline, dossierRevisionId: "dossier-revision:system:entity:uss-princeton:overlay:1", dossierId: "dossier:system:entity:uss-princeton", scope: "INVESTIGATION_OVERLAY", investigationId: "investigation:test" });
const overlay = createGovernedEntityDossier({ dossierId: overlayRevision.dossierId, schemaVersion: ENTITY_DOSSIER_SCHEMA_VERSION, canonicalEntityId: overlayRevision.entityIdentity.canonicalEntityId, scope: "INVESTIGATION_OVERLAY", investigationId: "investigation:test", revisions: [overlayRevision] });
assert(overlay.investigationId === "investigation:test", "valid overlay must retain investigation identity");
fails(() => createEntityDossierRevision({ ...baseline, scope: "INVESTIGATION_OVERLAY" }), "requires investigation ID");

const permuted = createEntityDossierRevision({
  ...baseline,
  facts: [...baseline.facts].reverse(),
  sourceRecords: [...baseline.sourceRecords].reverse(),
  sourceLinks: [...baseline.sourceLinks].reverse(),
  fieldAvailability: [...baseline.fieldAvailability].reverse(),
  limitations: [...baseline.limitations].reverse(),
  entityIdentity: { ...baseline.entityIdentity, aliases: [...baseline.entityIdentity.aliases].reverse(), identifiers: [...baseline.entityIdentity.identifiers].reverse() },
});
assert(permuted.contentHash === fixture.contentHash, "permitted set permutations must have stable canonical hash");
assert(permuted.facts.every((value, index, values) => index === 0 || values[index - 1].factId < value.factId), "explicit fact ordering must be stable");
assert(Object.isFrozen(reconstructed) && Object.isFrozen(reconstructed.facts) && Object.isFrozen(reconstructed.facts[0].value), "authoritative nested structures must be deeply frozen");
assert(!Reflect.set(reconstructed.facts[0].value, "value", "mutation"), "deep mutation must fail");

fails(() => createEntityDossierRevision({ ...baseline, sourceLinks: baseline.sourceLinks.filter(value => value.factId !== baseline.facts[0].factId) }), "accepted material fact requires supporting source linkage");
fails(() => createEntityDossierRevision({ ...baseline, sourceLinks: [...baseline.sourceLinks, { ...baseline.sourceLinks[0], sourceLinkId: "link:dangling-fact", factId: "missing" }] }), "dangling fact reference");
fails(() => createEntityDossierRevision({ ...baseline, sourceLinks: [...baseline.sourceLinks, { ...baseline.sourceLinks[0], sourceLinkId: "link:dangling-source", sourceRecordId: "missing" }] }), "dangling source reference");
fails(() => createEntityDossierRevision({ ...baseline, entityIdentity: { ...baseline.entityIdentity, identifiers: [{ identifierId: "duplicate", scheme: "TEST", value: "one" }, { identifierId: "duplicate", scheme: "TEST", value: "two" }] } }), "duplicate identifier IDs");

const wrongHash = { ...cloneJson(fixture), contentHash: `sha256:${"0".repeat(64)}` } as EntityDossierRevision;
fails(() => validateEntityDossierRevision(wrongHash), "invalid content hash");
fails(() => createEntityDossierRevision({ ...baseline, dossierId: "dossier:system:entity:not-princeton" }), "entity/revision mismatch");
fails(() => createEntityDossierRevision({ ...baseline, schemaVersion: "entity-dossier/v2" as typeof ENTITY_DOSSIER_SCHEMA_VERSION }), "schema mismatch");

const inferred = { ...baseline.facts[0], derivation: "INFERRED" as const, epistemicClassification: "ESTABLISHED" as const };
fails(() => createEntityDossierRevision({ ...baseline, facts: [inferred, ...baseline.facts.slice(1)] }), "cannot claim established authority");
const candidate = { ...baseline.facts[0], epistemicClassification: "CANDIDATE" as const, reviewStatus: "REVIEW_REQUIRED" as const, canonEffect: "GLOBAL_BASE" as const };
fails(() => createEntityDossierRevision({ ...baseline, facts: [candidate, ...baseline.facts.slice(1)] }), "canon effect NONE");

fails(() => validateEntityDossierProjectionBinding({ bindingId: "binding:1", investigationId: "investigation:1", manifoldRevisionId: "manifold:1", graphRevisionId: "graph:1", canonicalEntityId: fixture.entityIdentity.canonicalEntityId, dossierId: fixture.dossierId, dossierRevisionId: "latest", dossierContentHash: fixture.contentHash }), "never latest");
validateEntityDossierProjectionBinding({ bindingId: "binding:1", investigationId: "investigation:1", manifoldRevisionId: "manifold:1", graphRevisionId: "graph:1", canonicalEntityId: fixture.entityIdentity.canonicalEntityId, dossierId: fixture.dossierId, dossierRevisionId: fixture.dossierRevisionId, dossierContentHash: fixture.contentHash });

const operational = USS_PRINCETON_GOVERNED_ENTITY_DOSSIER.revisions[1];
assert(operational.parentRevisionId === fixture.dossierRevisionId, "operational revision must preserve explicit parent lineage");
const missingCategory = inputOf(operational); delete (missingCategory.facts[0] as { category?: unknown }).category;
fails(() => createEntityDossierRevision(missingCategory), "operational governance fields are required");
fails(() => createEntityDossierRevision({ ...inputOf(operational), sourceLinks: operational.sourceLinks.map((link, index) => index === 0 ? { ...link, governingDossierRevisionId: fixture.dossierRevisionId } : link) }), "governing revision mismatch");

console.log("PASS VerifyGovernedEntityDossierContract — 18 contract groups verified");
