import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { cloneJson, createEntityDossierRevision } from "../../src/knowledge/dossier/EntityDossierCanonicalization.ts";
import type { EntityDossierRevision, EntityDossierRevisionInput } from "../../src/knowledge/dossier/EntityDossierTypes.ts";
import { SYSTEM_CANON_ENTITY_DOSSIER_REGISTRY, USS_PRINCETON_DOSSIER_REVISION_1, USS_PRINCETON_DOSSIER_REVISION_2, USS_PRINCETON_GOVERNED_ENTITY_DOSSIER, USS_PRINCETON_PINNED_HEAD_REVISION_ID, resolvePinnedSystemCanonEntityDossierRevision, resolveSystemCanonEntityDossierRevision } from "../../src/knowledge/dossier/SystemCanonEntityDossierRegistry.ts";

const r1=USS_PRINCETON_DOSSIER_REVISION_1,r2=USS_PRINCETON_DOSSIER_REVISION_2;
assert.equal(r1.dossierRevisionId,"dossier-revision:system:entity:uss-princeton:1");
assert.equal(r1.contentHash,"sha256:0e58fe0382bdb2c9f857f3eb333b7f572252119629f931a7348940bec48c25c4","revision 1 hash must remain byte-for-byte stable");
assert.equal(r2.revisionNumber,2); assert.equal(r2.parentRevisionId,r1.dossierRevisionId);
assert.equal(USS_PRINCETON_GOVERNED_ENTITY_DOSSIER.revisions[0],r1); assert.equal(USS_PRINCETON_GOVERNED_ENTITY_DOSSIER.revisions[1],r2);
assert.equal(USS_PRINCETON_PINNED_HEAD_REVISION_ID,r2.dossierRevisionId);
assert.equal(SYSTEM_CANON_ENTITY_DOSSIER_REGISTRY["system:entity:uss-princeton"].pinnedHeadRevisionId,r2.dossierRevisionId);
assert.equal(resolvePinnedSystemCanonEntityDossierRevision("system:entity:uss-princeton"),r2);
assert.equal(resolveSystemCanonEntityDossierRevision("system:entity:uss-princeton",r1.dossierRevisionId),r1);
assert.equal(resolveSystemCanonEntityDossierRevision("system:entity:uss-princeton",r2.dossierRevisionId),r2);
assert.equal(resolveSystemCanonEntityDossierRevision("system:entity:uss-princeton","latest"),undefined);

assert.equal(r2.entityIdentity.entityType,"PLATFORM"); assert.equal(r2.entityIdentity.entitySubtype,"NAVAL_VESSEL");
const byPredicate=new Map(r2.facts.map(f=>[f.predicate,f]));
assert.equal(byPredicate.get("vessel_type")?.value.value,"GUIDED_MISSILE_CRUISER");
assert.equal(byPredicate.get("ship_class")?.value.value,"TICONDEROGA_CLASS");
assert.equal(byPredicate.get("combat_system")?.category,"SYSTEM");
assert.equal(byPredicate.get("radar_system")?.category,"SENSOR");
assert(!r2.facts.some(f=>f.predicate==="facility_type"),"revision 2 must not identify the vessel as an AEGIS RADAR facility");

const sourceIds=new Set(r2.sourceRecords.map(s=>s.sourceRecordId));
for(const f of [...r2.facts,...r2.relationshipFacts]){
  assert.equal(f.governingDossierRevisionId,r2.dossierRevisionId);
  const supporting=r2.sourceLinks.filter(l=>l.factId===f.factId&&l.relationship==="SUPPORTS");
  assert(supporting.length>0,`${f.factId} requires supporting lineage`);
  for(const link of supporting){assert(sourceIds.has(link.sourceRecordId));assert(link.citationLocator);assert.equal(link.governingDossierRevisionId,r2.dossierRevisionId);}
}
for(const s of r2.sourceRecords){assert(s.sourceTitle);assert(s.locator||s.repositoryIdentity);assert(s.sourceRevisionLabel);assert(s.authoritativeScope?.length);assert.match(s.contentHash,/^sha256:[0-9a-f]{64}$/);}
for(const p of ["class_length","class_beam","class_full_load_displacement","class_speed","class_propulsion"])assert.equal(byPredicate.get(p)?.applicability,"CLASS_LEVEL");
for(const p of ["official_name","hull_number","vessel_type","ship_class","commissioned_date","combat_system","radar_system"])assert.equal(byPredicate.get(p)?.applicability,"SHIP_SPECIFIC");
assert.equal(byPredicate.get("commissioned_date")?.temporalQualification.kind,"AT_TIME");
assert(!r2.facts.some(f=>f.predicate.includes("current_")),"time-sensitive current facts must not masquerade as permanent Canon");

const unavailable=new Map(r2.fieldAvailability.map(f=>[f.field,f.state]));
assert.equal(unavailable.get("encounterNarrativeNovember2004"),"NOT_ESTABLISHED");
assert.equal(unavailable.get("specificCrewActionsNovember2004"),"NOT_ESTABLISHED");
assert.equal(unavailable.get("encounterRadarTracksNovember2004"),"NOT_ESTABLISHED");
assert.equal(unavailable.get("currentCommandAssignment"),"NOT_RESEARCHED");
assert.equal(unavailable.get("documentedLimitations"),"NO_LIMITATION_DOCUMENTED");
assert.equal(unavailable.get("researcherConfidenceScore"),"UNAVAILABLE");

const raw=cloneJson(r2) as EntityDossierRevision&{contentHash?:string};delete raw.contentHash;
const repeat=createEntityDossierRevision(raw as EntityDossierRevisionInput);
const permuted=createEntityDossierRevision({...raw,facts:[...raw.facts].reverse(),sourceRecords:[...raw.sourceRecords].reverse(),sourceLinks:[...raw.sourceLinks].reverse(),fieldAvailability:[...raw.fieldAvailability].reverse(),limitations:[...raw.limitations].reverse()} as EntityDossierRevisionInput);
assert.equal(repeat.contentHash,r2.contentHash);assert.equal(permuted.contentHash,r2.contentHash);assert(Object.isFrozen(r2)&&Object.isFrozen(r2.facts)&&Object.isFrozen(r2.sourceRecords[0].authoritativeScope));

const implementation=["src/knowledge/dossier/EntityDossierTypes.ts","src/knowledge/dossier/EntityDossierCanonicalization.ts","src/knowledge/dossier/SystemCanonEntityDossierRegistry.ts","src/knowledge/dossier/sources/uss-princeton/manifest.ts"].map(p=>readFileSync(p,"utf8")).join("\n");
for(const forbidden of ["fetch(","Tavily","WebDiscovery","invokeRex","CandidateEvidence","ResearchInbox","XMLHttpRequest","WebSocket"])assert.equal(implementation.includes(forbidden),false,forbidden);
for(const forbiddenLatestPattern of ["revisions.at(-1)","revisions[revisions.length - 1]","revisions[revisions.length-1]"])assert.equal(implementation.includes(forbiddenLatestPattern),false,"no implicit latest lookup may exist");

console.log(`PASS VerifyUssPrincetonOperationalDossier — revision 2 ${r2.contentHash}; 20 accepted facts with exact official-source lineage`);
