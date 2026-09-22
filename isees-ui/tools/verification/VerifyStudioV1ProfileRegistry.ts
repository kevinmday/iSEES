import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { ARTIFACT_PROFILES } from "../../src/studio/contracts/StudioV1Contract.ts";
import { STUDIO_V1_PROFILE_REGISTRY, getStudioV1Profile, getStudioV1ProfileVersion, listStudioV1Profiles, listVerifiedAvailableStudioV1Profiles, serializeStudioV1ProfileRegistry, validateStudioV1ProfileRegistry, type StudioV1ProfileDefinition } from "../../src/studio/contracts/StudioV1ProfileRegistry.ts";

assert.equal(validateStudioV1ProfileRegistry(STUDIO_V1_PROFILE_REGISTRY), true);
assert.deepEqual(listStudioV1Profiles().map(x=>x.profileId), ARTIFACT_PROFILES);
assert.deepEqual(listVerifiedAvailableStudioV1Profiles().map(x=>x.profileId), ["INVESTIGATION_REPORT"]);
const report=getStudioV1Profile("INVESTIGATION_REPORT");
assert.deepEqual(report.sections.map(x=>x.sectionId),["abstract","research-question","hypothesis","method","evidence","analysis","figures-tables","conclusion","references-footnotes"]);
assert.equal(getStudioV1ProfileVersion("INVESTIGATION_REPORT","investigation-report/v1"),report);
assert.throws(()=>getStudioV1Profile("UNKNOWN" as never)); assert.throws(()=>getStudioV1ProfileVersion("INVESTIGATION_REPORT","investigation-report/v2"));
assert.ok(Object.isFrozen(STUDIO_V1_PROFILE_REGISTRY)&&Object.isFrozen(report)&&Object.isFrozen(report.sections)&&Object.isFrozen(report.sections[0]));
assert.throws(()=>{(report.sections as unknown as {sectionId:string}[])[0]!.sectionId="changed";},TypeError);
assert.deepEqual(report.projectionCapabilities.map(x=>[x.format,x.templateProfileVersion,x.rendererVersion,x.currentDraftSupport,x.savedRevisionSupport,x.disposition]),[
  ["PDF","investigation-report-pdf/1","studio-v1-reportlab-pdf/1",true,true,"DURABLE_CHILD_PROJECTION"],
  ["DOCX","investigation-report-docx/1","studio-v1-python-docx/1",true,true,"DURABLE_CHILD_PROJECTION"],
  ["HTML","studio-current-draft/v1","studio-local-html/v1",true,false,"LOCAL_DISPOSABLE_PREVIEW"]]);
assert.ok(STUDIO_V1_PROFILE_REGISTRY.slice(1).every(x=>x.projectionCapabilities.every(capability=>capability.capabilityState!=="VERIFIED_AVAILABLE"&&!capability.currentDraftSupport&&!capability.savedRevisionSupport)));
assert.ok(STUDIO_V1_PROFILE_REGISTRY.every(x=>x.profileChangePolicy.afterFirstSave==="IMMUTABLE_FOR_ARTIFACT_LINEAGE"));
const clone=structuredClone(STUDIO_V1_PROFILE_REGISTRY) as StudioV1ProfileDefinition[];
clone.push(structuredClone(clone[0]!)); assert.throws(()=>validateStudioV1ProfileRegistry(clone),/Duplicate/);
const duplicateSection=structuredClone(STUDIO_V1_PROFILE_REGISTRY) as StudioV1ProfileDefinition[];
(duplicateSection[0]!.sections as {sectionId:string}[])[1]!.sectionId="abstract"; assert.throws(()=>validateStudioV1ProfileRegistry(duplicateSection),/section/);

const python=spawnSync(process.platform==="win32"?"python":"python3",["-c","import json; from isees_uap.studio.v1.profile_registry import serialize_profile_registry; print(json.dumps(serialize_profile_registry(), separators=(',', ':')))"] ,{cwd:new URL("../../../",import.meta.url),encoding:"utf8"});
assert.equal(python.status,0,python.stderr); assert.deepEqual(JSON.parse(python.stdout),serializeStudioV1ProfileRegistry(),"TypeScript/Python profile registries must have exact semantic parity");
console.log("PASS VerifyStudioV1ProfileRegistry — invariants, immutability, projection truth, and exact Python parity verified");
