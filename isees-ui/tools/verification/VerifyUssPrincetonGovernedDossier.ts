import { createEntityDossierRevision, cloneJson } from "../../src/knowledge/dossier/EntityDossierCanonicalization.ts";
import type { EntityDossierRevision, EntityDossierRevisionInput } from "../../src/knowledge/dossier/EntityDossierTypes.ts";
import { resolveSystemCanonEntityDossier, USS_PRINCETON_DOSSIER_REVISION_1, USS_PRINCETON_GOVERNED_ENTITY_DOSSIER } from "../../src/knowledge/dossier/SystemCanonEntityDossierRegistry.ts";

function assert(condition: unknown, message: string): asserts condition { if (!condition) throw new Error(`VERIFY FAILED: ${message}`); }

const dossier = USS_PRINCETON_GOVERNED_ENTITY_DOSSIER;
const revision = USS_PRINCETON_DOSSIER_REVISION_1;
assert(dossier.canonicalEntityId === "system:entity:uss-princeton", "registry identity must be USS Princeton canonical identity");
assert(dossier.scope === "GLOBAL_BASE" && revision.scope === "GLOBAL_BASE", "fixture must be global base");
assert(dossier.investigationId === undefined && revision.investigationId === undefined, "global fixture must omit investigation ID");
assert(revision.entityIdentity.displayName === "USS Princeton" && revision.entityIdentity.canonicalKnowledgeObjectId === "system:entity:uss-princeton" && revision.entityIdentity.canonicalType === "ENTITY" && revision.entityIdentity.entitySubtype === "CANONICAL_FACILITY", "identity must contain only System Canon-projected identity values");

const admitted = new Map(revision.facts.map(fact => [fact.predicate, fact.value]));
assert(admitted.size === 4, "fixture must contain exactly four scalar material facts");
assert(JSON.stringify(admitted.get("canonical_type")) === JSON.stringify({ valueType: "STRING", value: "ENTITY" }), "canonical type must be exact");
assert(JSON.stringify(admitted.get("facility_type")) === JSON.stringify({ valueType: "STRING", value: "AEGIS RADAR" }), "facility classification must be exact");
assert(JSON.stringify(admitted.get("system_canon_distance")) === JSON.stringify({ valueType: "STRING", value: "0km" }), "System Canon distance must be exact");
assert(JSON.stringify(admitted.get("source_revision")) === JSON.stringify({ valueType: "INTEGER", value: 1 }), "source revision must be exact");
assert(revision.relationshipFacts.length === 1 && revision.relationshipFacts[0].relationshipType === "OBSERVED_AT" && revision.relationshipFacts[0].objectEntityId === "system:event:E-TICTAC-2004" && revision.relationshipFacts[0].direction === "INBOUND", "only exact event-owned OBSERVED_AT relationship may be represented");

assert(revision.sourceRecords.length === 1, "fixture must use one deterministic source record");
const source = revision.sourceRecords[0];
assert(source.authority === "System Canon" && source.publisher === "System Canon" && source.repositoryIdentity === "SYSTEM_CANON/E-TICTAC-2004", "source must identify System Canon and E-TICTAC-2004");
assert(source.retrievalState === "NOT_APPLICABLE_LOCAL_CANON" && source.retrievedAt === "1970-01-01T00:00:00.000Z" && source.effectiveTime === "1970-01-01T00:00:00.000Z", "local source and unspecified-time semantics must be exact");
const materialIds = new Set([...revision.facts, ...revision.relationshipFacts].map(fact => fact.factId));
assert([...materialIds].every(factId => revision.sourceLinks.some(link => link.factId === factId && link.sourceRecordId === source.sourceRecordId)), "all material facts must have exact source links");

const unavailable = new Set(revision.fieldAvailability.filter(field => field.state === "UNAVAILABLE").map(field => field.field));
for (const field of ["hullNumber", "shipClass", "platformSpecification", "commissioningHistory", "parentCommand", "carrierStrikeGroupMembership", "systemsCapabilities", "crewOperationalHistory", "geographicPosition", "encounterNarrative"]) assert(unavailable.has(field), `${field} must remain typed unavailable`);
const forbiddenPredicates = ["hull_number", "ship_class", "platform", "parent_command", "systems", "capabilities", "history", "geographic_position", "encounter_narrative"];
assert(revision.facts.every(fact => !forbiddenPredicates.includes(fact.predicate)), "unavailable facts must not be invented");
const serialized = JSON.stringify(revision).toLowerCase();
for (const artifact of ["http://", "https://", "tavily", "providerresult", "generated summary", "ai summary"]) assert(!serialized.includes(artifact), `${artifact} artifact must be absent`);

const raw = cloneJson(revision) as EntityDossierRevision & { contentHash?: string }; delete raw.contentHash;
const repeated = createEntityDossierRevision(raw as EntityDossierRevisionInput);
assert(repeated.contentHash === revision.contentHash && JSON.stringify(repeated) === JSON.stringify(revision), "fixture output and hash must be stable");
assert(resolveSystemCanonEntityDossier("system:entity:uss-princeton")?.revisions[0] === revision, "ordinary operational resolution must remain synchronously pinned to revision 1 during I3C-A");
assert(resolveSystemCanonEntityDossier("system:entity:unknown") === undefined, "unknown identities must remain absent without fallback discovery");

assert(dossier.revisions[0] === revision, "revision 1 must remain the immutable first lineage member");
console.log("PASS VerifyUssPrincetonGovernedDossier — 16 fixture groups verified; revision 1 preserved; zero fetch/provider surfaces");
