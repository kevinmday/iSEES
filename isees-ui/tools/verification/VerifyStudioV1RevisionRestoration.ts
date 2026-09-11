import assert from "node:assert/strict";
import { AuthorDocumentRuntime } from "../../src/author/runtime/AuthorDocumentRuntime.ts";
import { canonicalSha256 } from "../../src/studio/contracts/StudioCanonicalSerialization.ts";
import { decodeArtifactDiscovery, decodeRevisionDetail } from "../../src/studio/v1/api/StudioV1AuthorDecoders.ts";
import { createStudioV1AuthorApiClient, type StudioV1AuthorApiClient } from "../../src/studio/v1/api/StudioV1AuthorApiClient.ts";
import type { SaveAuthorRequest } from "../../src/studio/v1/api/StudioV1AuthorApiTypes.ts";
import { StudioV1AuthorClientError } from "../../src/studio/v1/api/StudioV1AuthorApiTypes.ts";
import { adaptAuthorDocument, restoreAuthorDocument } from "../../src/studio/v1/runtime/StudioV1AuthorAdapter.ts";
import { StudioV1SaveOrchestrator, type StudioV1RestorationFailure } from "../../src/studio/v1/runtime/StudioV1SaveOrchestrator.ts";

const investigationId="inv_066673df05304bbf9fed46026c2061ed";
const ownerPrincipalId="acct_82ea32a577e34467a482ba4e8873d424";
const artifactId="studio-v1-artifact-d513271f-7dd5-4dc1-8821-07579d875d09";
const revisionId="studio-v1-artifact-d513271f-7dd5-4dc1-8821-07579d875d09.r1-163c184a-c439-4c84-a998-0e96bd6c338b";
const createdAt="2026-09-11T01:14:35.365Z",savedAt="2026-09-11T01:14:35.366Z";
const paragraph="This investigation evaluates the available evidence as a connected system of observations, sources, claims, entities, locations, and relationships. The analysis distinguishes established records from experimental results and candidate knowledge. All findings remain provisional unless supported by traceable evidence and reproducible methods.";
const semantic={documentId:"author:ca13f091-550f-4965-ae45-87bd1468ce1c",schemaVersion:"studio-author-semantic/v1" as const,title:"Untitled Investigation Document",nodeOrder:["heading-1","author-paragraph:c06fa8a1-eede-4319-8361-b3741b4c0abe"],nodes:[{id:"heading-1",type:"HEADING" as const,level:2,text:"Analysis"},{id:"author-paragraph:c06fa8a1-eede-4319-8361-b3741b4c0abe",type:"PARAGRAPH" as const,text:paragraph}],citations:[],citationStyle:{style:"APA" as const,styleVersion:"studio-v1-apa/1",locale:"en-US"}};
const persistedSemantic={...semantic,nodeOrder:semantic.nodeOrder.slice(1),nodes:semantic.nodes.slice(1)};
const persistedHash="sha256:2afbda1dd35d490f2a2243ef72698cdbe27371111d947e7d29767f3b6b52b4ce";
assert.equal(canonicalSha256(persistedSemantic),persistedHash,"the database hash must validate over semanticContent");

const discoveryWire={items:[{artifactId,investigationId,ownerPrincipalId,profile:"INVESTIGATION_REPORT",lifecycleClassification:"CANDIDATE_KNOWLEDGE",createdAt,currentRevisionId:revisionId,currentRevisionNumber:1,contentHash:persistedHash,savedAt}]};
const revisionWire={artifactId,revision:{artifactId,revisionId,revisionNumber:1,parentRevisionId:null,semanticContent:persistedSemantic,contentHash:persistedHash,sourceSnapshots:[],profile:"INVESTIGATION_REPORT",profileVersion:"investigation-report/v1",createdAt:savedAt,authorPrincipalId:ownerPrincipalId,immutableStatus:"IMMUTABLE_SAVED_REVISION"}};
const discovery=decodeArtifactDiscovery(discoveryWire),detail=decodeRevisionDetail(revisionWire);
assert.equal(detail.revision.parentRevisionId,undefined,"wire null must normalize to the revision-1 domain omission");

const mapped=restoreAuthorDocument(semantic,savedAt);
assert.deepEqual(mapped.nodes.map(node=>node.id),semantic.nodeOrder);
assert.deepEqual(mapped.nodes.map(node=>(node as {section?:string}).section),["Analysis","Analysis"]);
assert.equal((mapped.nodes[1] as {text:string}).text,paragraph);
const roundTrip=adaptAuthorDocument(mapped,investigationId,{snapshotId:"unused",capturedAt:savedAt});
assert.deepEqual(roundTrip.semanticContent,semantic,"heading/paragraph forward-after-reverse must preserve semantic meaning");

let projectionCalls=0,saveRequest:SaveAuthorRequest|undefined,mutationCalls=0;
const api:StudioV1AuthorApiClient={
 async discoverArtifacts(){return discovery},async getRevision(){return detail},
 async listProjectionStatuses(){projectionCalls++;return{artifactId,revisionId,items:[]}},
 async getArtifact(){return{artifactId,currentRevisionId:revisionId,currentRevisionNumber:1,contentHash:persistedHash,savedAt}},
 async listRevisions(){return{artifactId,items:[]}},
 async createArtifact(){mutationCalls++;throw Error("restore must not create")},
 async saveRevision(_i,_a,request){mutationCalls++;saveRequest=request;return{artifactId,revisionId:"revision-2",revisionNumber:2,projectionIds:[],replayed:false}},
};
const runtime=new AuthorDocumentRuntime();runtime.activateInvestigation(investigationId);const owner=new StudioV1SaveOrchestrator(api,()=>"next",()=>"2026-09-11T02:00:00.000Z");
await owner.discover(runtime,investigationId,ownerPrincipalId);
assert.equal(owner.getState().status,"SAVED");assert.equal(runtime.isDirty(),false);assert.equal(projectionCalls,1);assert.equal(mutationCalls,0);
runtime.updateNodeText(persistedSemantic.nodeOrder[0]!,`${paragraph} Edited.`);owner.observe(runtime.getActiveDocument(),runtime.isDirty(),investigationId);assert.equal(owner.getState().status,"DIRTY");
await owner.save(runtime,true);assert.equal(saveRequest?.expectedHeadRevisionId,revisionId);assert.equal(saveRequest?.revision.parentRevisionId,revisionId);assert.equal(saveRequest?.revision.revisionNumber,2);assert.equal(mutationCalls,1);
assert.equal(saveRequest?.artifact.createdAt,createdAt,"revision 2 preserves immutable artifact creation identity rather than substituting revision 1 time");
assert.equal(saveRequest?.artifact.currentSavedRevisionId,revisionId);assert.equal(saveRequest?.artifact.workingDraft.basedOnRevisionId,revisionId);
assert.deepEqual(saveRequest?.revision.semanticContent.nodeOrder,persistedSemantic.nodeOrder,"stable node order survives restore, edit, and revision composition");
assert.deepEqual(saveRequest?.revision.semanticContent.nodes.map(node=>node.id),persistedSemantic.nodeOrder,"stable node identities survive restore, edit, and revision composition");
assert.equal(saveRequest?.revision.contentHash,canonicalSha256(saveRequest?.revision.semanticContent),"revision 2 carries the deterministic semantic hash");
let transported:unknown;const validatingClient=createStudioV1AuthorApiClient({baseUrl:"https://contract.test",readCsrfToken:()=>"csrf",fetch:async(_input,init)=>{transported=JSON.parse(String(init?.body));return new Response(JSON.stringify({artifactId,revisionId:"revision-2",revisionNumber:2,projectionIds:[],replayed:false}),{status:201,headers:{"Content-Type":"application/json"}})}});
await validatingClient.saveRevision(investigationId,artifactId,saveRequest!);
assert.deepEqual(transported,saveRequest,"the exact restored-edit request passes the production TypeScript contract validator before transport");

async function failure(classification:StudioV1RestorationFailure,change:(d:typeof discoveryWire,r:typeof revisionWire)=>void){const d=structuredClone(discoveryWire),r=structuredClone(revisionWire);change(d,r);let projections=0;const isolated=new AuthorDocumentRuntime();isolated.activateInvestigation(investigationId);const orchestration=new StudioV1SaveOrchestrator({...api,async discoverArtifacts(){return d},async getRevision(){return r as never},async listProjectionStatuses(){projections++;return{artifactId,revisionId,items:[]}}});await orchestration.discover(isolated,investigationId,ownerPrincipalId);assert.equal(orchestration.getState().restorationFailure,classification);assert.equal(isolated.getActiveDocument(),undefined);assert.equal(projections,0)}
await failure("INVESTIGATION_MISMATCH",d=>{d.items[0]!.investigationId="other"});
await failure("OWNER_MISMATCH",d=>{d.items[0]!.ownerPrincipalId="other"});
await failure("IDENTITY_MISMATCH",(_d,r)=>{r.artifactId="other"});
await failure("HEAD_MISMATCH",(_d,r)=>{r.revision.revisionId="other"});
await failure("CONTENT_HASH_MISMATCH",(_d,r)=>{r.revision.contentHash=`sha256:${"0".repeat(64)}`});

for(const classification of ["DISCOVERY_DECODE_FAILED","REVISION_DECODE_FAILED"] as const){const isolated=new AuthorDocumentRuntime();isolated.activateInvestigation(investigationId);const orchestration=new StudioV1SaveOrchestrator({...api,async discoverArtifacts(){if(classification==="DISCOVERY_DECODE_FAILED")throw new StudioV1AuthorClientError("MALFORMED_RESPONSE","safe","discoverArtifacts",{decodeFailure:classification});return discovery},async getRevision(){throw new StudioV1AuthorClientError("MALFORMED_RESPONSE","safe","getRevision",{decodeFailure:classification})}});await orchestration.discover(isolated,investigationId,ownerPrincipalId);assert.equal(orchestration.getState().restorationFailure,classification);assert.equal(isolated.getActiveDocument(),undefined)}
const unsupported=structuredClone(revisionWire);unsupported.revision.semanticContent.nodes=[{id:"section-1",type:"SECTION",title:"Unsupported",childNodeIds:[]}] as never;unsupported.revision.semanticContent.nodeOrder=["section-1"];unsupported.revision.contentHash=canonicalSha256(unsupported.revision.semanticContent);
{const isolated=new AuthorDocumentRuntime();isolated.activateInvestigation(investigationId);const orchestration=new StudioV1SaveOrchestrator({...api,async discoverArtifacts(){const value=structuredClone(discovery);value.items[0]!.contentHash=unsupported.revision.contentHash;return value},async getRevision(){return unsupported as never}});await orchestration.discover(isolated,investigationId,ownerPrincipalId);assert.equal(orchestration.getState().restorationFailure,"REVERSE_ADAPTATION_FAILED");assert.equal(isolated.getActiveDocument(),undefined)}

console.log("PASS VerifyStudioV1RevisionRestoration — exact revision-1 wire decode, authoritative semantic hash, ordered heading/paragraph reverse adaptation, neutral placement, lossless round trip, clean/dirty reconciliation, revision-2 parent/head, mismatch failure classes, projection gating, and restore side-effect prohibition verified.");
