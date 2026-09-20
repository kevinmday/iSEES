import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { AuthorDocumentRuntime } from "../../src/author/runtime/AuthorDocumentRuntime.ts";
import type { ComputationalAuthorDocument } from "../../src/author/model/AuthorDocument.ts";
import { canonicalSha256 } from "../../src/studio/contracts/StudioCanonicalSerialization.ts";
import type { AuthorRevision, SemanticDocument } from "../../src/studio/contracts/StudioV1Contract.ts";
import type { RevisionDetail, SaveAuthorRequest } from "../../src/studio/v1/api/StudioV1AuthorApiTypes.ts";
import type { StudioV1AuthorApiClient } from "../../src/studio/v1/api/StudioV1AuthorApiClient.ts";
import { projectAuthorRevisionHtml, projectCurrentDraftHtml } from "../../src/studio/projection/StudioHtmlProjection.ts";
import { StudioV1SaveOrchestrator } from "../../src/studio/v1/runtime/StudioV1SaveOrchestrator.ts";

const hostile = "<script>x</script><img src=x onerror=x> javascript:x";
const semantic: SemanticDocument = { documentId: "author:revision-preview", schemaVersion: "studio-author-semantic/v1", title: `Saved ${hostile}`, nodeOrder: ["h","s","p","c","q","cr","f","e","g","t","a","n"], nodes: [
  { id:"h",type:"HEADING",level:2,text:"01 Heading" },
  { id:"s",type:"SECTION",title:"02 Section",childNodeIds:["p"] },
  { id:"p",type:"PARAGRAPH",text:`03 Paragraph ${hostile}` },
  { id:"c",type:"CLAIM",text:"04 Claim",sourceSnapshotIds:["snapshot:1"],supportState:"SUPPORTED" },
  { id:"q",type:"QUOTATION",text:hostile,citationId:"citation:1",locator:"05 Locator" },
  { id:"cr",type:"CITATION_REFERENCE",citationId:"citation:1" },
  { id:"f",type:"FOOTNOTE",text:"07 Footnote",marker:"1" },
  { id:"e",type:"EQUATION",notation:"DISPLAY",latexSource:"08 x < y",equationId:"eq:1",variables:[],assumptions:[],crossReferenceTargets:[] },
  { id:"g",type:"FIGURE",caption:"09 Figure",altText:hostile,assetId:"asset:1",sourceAttribution:hostile,lineage:[] },
  { id:"t",type:"TABLE",caption:"10 Table",altText:"table",dataId:"data:1",columns:[hostile],rows:[["cell"]],sourceAttribution:"source",lineage:[] },
  { id:"a",type:"APPENDIX",title:"11 Appendix",childNodeIds:[] },
  { id:"n",type:"RESEARCHER_NOTE",text:"12 Researcher note" },
], citations:[{citationId:"citation:1",institutionalAuthor:hostile,title:hostile,url:hostile,sourceSnapshotId:"snapshot:1",completeness:"COMPLETE",missingRequiredFields:[]}], citationStyle:{style:"APA",styleVersion:"v1",locale:"en-US"} };
const revision = (number:number,id=`revision:${number}`,content=semantic):AuthorRevision => ({artifactId:"artifact:preview",revisionId:id,revisionNumber:number,...(number>1?{parentRevisionId:`revision:${number-1}`}:{ }),semanticContent:content,contentHash:canonicalSha256(content),sourceSnapshots:[],profile:"INVESTIGATION_REPORT",profileVersion:"v1",createdAt:"2026-01-01T00:00:00.000Z",authorPrincipalId:"principal:preview",immutableStatus:"IMMUTABLE_SAVED_REVISION"});

const r2=revision(2), projection=projectAuthorRevisionHtml(r2), repeated=projectAuthorRevisionHtml(structuredClone(r2));
assert.deepEqual(projection,repeated,"same immutable revision and configuration are byte-identical");
assert.equal(projection.sourceHash,r2.contentHash,"saved projection uses exact AuthorRevision content hash");
assert.equal(projection.sourceKind,"AUTHOR_REVISION");
let position=-1; for(const marker of ["01 Heading","02 Section","03 Paragraph","04 Claim","05 Locator",hostile.replaceAll("<","&lt;").replaceAll(">","&gt;"),"07 Footnote","08 x &lt; y","09 Figure","10 Table","11 Appendix","12 Researcher note"]){const next=projection.html.indexOf(marker,position+1);assert.ok(next>position,`${marker} preserves saved order`);position=next}
assert.ok(!projection.html.includes(hostile)&&projection.html.includes("&lt;script&gt;"));assert.ok(!/<script>|<img[^>]+onerror|href=["']?javascript:/i.test(projection.html));
const unsupported=structuredClone(r2);unsupported.semanticContent={...unsupported.semanticContent,nodeOrder:["unknown"],nodes:[{id:"unknown",type:"UNKNOWN",payload:hostile} as never]};unsupported.contentHash=canonicalSha256(unsupported.semanticContent);
assert.match(projectAuthorRevisionHtml(unsupported).html,/Unsupported or malformed UNKNOWN content/);

const document:ComputationalAuthorDocument={identity:{id:"author:preview",createdAt:new globalThis.Date("2026-01-01T00:00:00.000Z")},metadata:{title:"Working",description:"",author:"Researcher",modifiedAt:new globalThis.Date("2026-01-01T00:00:00.000Z"),version:1},type:"DOCUMENT",status:"MODIFIED",nodes:[{id:"p",type:"PARAGRAPH",text:"Working content"}]};
const currentBefore=projectCurrentDraftHtml(document);
type Deferred={promise:Promise<RevisionDetail>;resolve(value:RevisionDetail):void;reject(reason:unknown):void};
const deferred=():Deferred=>{let resolve!:(value:RevisionDetail)=>void,reject!:(reason:unknown)=>void;const promise=new Promise<RevisionDetail>((yes,no)=>{resolve=yes;reject=no});return{promise,resolve,reject}};
const requests:SaveAuthorRequest[]=[];const pending=new Map<string,Deferred>();let creates=0,saves=0,revisionReads=0;
const api:StudioV1AuthorApiClient={async createArtifact(_i,request){creates++;requests.push(request);return{artifactId:request.artifact.artifactId,revisionId:request.revision.revisionId,revisionNumber:request.revision.revisionNumber,projectionIds:[],replayed:false}},async saveRevision(_i,_a,request){saves++;requests.push(request);return{artifactId:request.artifact.artifactId,revisionId:request.revision.revisionId,revisionNumber:request.revision.revisionNumber,projectionIds:[],replayed:false}},async getArtifact(){throw Error("unused")},async listRevisions(_i,a){return{artifactId:a,items:[{revisionId:"revision:B",revisionNumber:2,parentRevisionId:"revision:A",contentHash:r2.contentHash,savedAt:r2.createdAt,sourceSnapshots:[]},{revisionId:"revision:A",revisionNumber:1,parentRevisionId:null,contentHash:r2.contentHash,savedAt:r2.createdAt,sourceSnapshots:[]}]}},async getRevision(_i,a,id){revisionReads++;const wait=pending.get(id);if(wait)return wait.promise;return{artifactId:a,revision:{...r2,artifactId:a,revisionId:id,revisionNumber:id.endsWith("B")?2:1,...(id.endsWith("B")?{parentRevisionId:"revision:A"}:{parentRevisionId:undefined})}}},async listProjectionStatuses(){throw Error("unused")}};
const runtime=new AuthorDocumentRuntime();runtime.activateInvestigation("investigation:preview");runtime.setActiveDocument(document);const owner=new StudioV1SaveOrchestrator(api,(()=>{let n=0;return()=>`id:${++n}`})(),()=>"2026-01-01T00:00:00.000Z");owner.observe(document,false,"investigation:preview");await owner.save(runtime,true);runtime.updateNodeText("p","Working content edited");owner.observe(document,true,"investigation:preview");
const runtimeReference=runtime.getActiveDocument(),runtimeContent=JSON.stringify(runtimeReference),runtimeRevision=runtime.getRevision(),dirty=runtime.isDirty(),canSave=owner.getState().canSave;
await owner.listRevisions();assert.deepEqual(owner.getState().revisions.map(item=>item.revisionNumber),[2,1],"revision list is descending");

const slowA=deferred(),fastB=deferred();pending.set("revision:A",slowA);pending.set("revision:B",fastB);const aRequest=owner.loadRevision("revision:A"),bRequest=owner.loadRevision("revision:B");fastB.resolve({artifactId:owner.getState().artifactId!,revision:{...r2,artifactId:owner.getState().artifactId!,revisionId:"revision:B"}});await bRequest;slowA.resolve({artifactId:owner.getState().artifactId!,revision:{...r2,artifactId:owner.getState().artifactId!,revisionId:"revision:A",revisionNumber:1,parentRevisionId:undefined}});await aRequest;
assert.equal(owner.getState().selectedRevision?.revision.revisionId,"revision:B","late A cannot replace B");
assert.equal(runtime.getActiveDocument(),runtimeReference);assert.equal(JSON.stringify(runtimeReference),runtimeContent);assert.equal(runtime.getRevision(),runtimeRevision);assert.equal(runtime.isDirty(),dirty);assert.equal(owner.getState().canSave,canSave,"preview leaves Save eligibility unchanged");
runtime.updateNodeText("p","Newest live content");owner.observe(document,true,"investigation:preview");assert.equal(owner.getState().selectedRevision?.revision.revisionId,"revision:B","live edits do not replace history");
const pendingA=deferred();pending.set("revision:A",pendingA);const pendingRequest=owner.loadRevision("revision:A");owner.clearRevisionPreview();pendingA.resolve({artifactId:owner.getState().artifactId!,revision:{...r2,artifactId:owner.getState().artifactId!,revisionId:"revision:A",revisionNumber:1,parentRevisionId:undefined}});await pendingRequest;assert.equal(owner.getState().selectedRevision,undefined,"pending result cannot replace Current Draft");assert.match(projectCurrentDraftHtml(runtime.getActiveDocument()!).html,/Newest live content/);
pending.delete("revision:A");const failing=deferred();pending.set("revision:A",failing);const failure=owner.loadRevision("revision:A");failing.reject(Error("offline"));await failure;assert.equal(owner.getState().revisionPreviewStatus,"ERROR");assert.match(owner.getState().revisionPreviewError??"",/could not be loaded/);assert.equal(runtime.getActiveDocument(),runtimeReference);
assert.equal(creates,1);assert.equal(saves,0);assert.ok(revisionReads>=4);assert.ok(requests.every(request=>request.projections.length===0));assert.equal(projectCurrentDraftHtml(baseCurrent(document)).projectionId,currentBefore.projectionId,"current draft projection behavior remains stable for original content");

function baseCurrent(value:ComputationalAuthorDocument):ComputationalAuthorDocument{return{...value,metadata:{...value.metadata},nodes:[{id:"p",type:"PARAGRAPH",text:"Working content"}]}}
const component=readFileSync(new URL("../../src/studio/components/StudioHtmlProjectionPreview.tsx",import.meta.url),"utf8");for(const label of ["Current Draft","Saved Revision","Historical Revision","Read-only reconstruction from immutable AuthorRevision.","Not an authority record."])assert.ok(component.includes(label));assert.match(component,/sandbox=""/);assert.doesNotMatch(component,/restoreActiveDocument|dangerouslySetInnerHTML|setInterval|setTimeout/);
const orchestrator=readFileSync(new URL("../../src/studio/v1/runtime/StudioV1SaveOrchestrator.ts",import.meta.url),"utf8");assert.doesNotMatch(orchestrator,/loadRevision[^]*?restoreActiveDocument/);assert.match(orchestrator,/projections:\[\]/);
console.log("PASS VerifyStudioRevisionHtmlProjection — saved and historical rendering, exact lineage, ordered selection, race cancellation, draft independence, Save isolation, and unavailable-state safety verified");
