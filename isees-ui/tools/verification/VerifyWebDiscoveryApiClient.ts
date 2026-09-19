import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import {
  CandidateEvidenceHttpError,
  createCandidateEvidenceRequester,
  type CandidateEvidenceTransport,
} from "../../src/evidence/candidates/CandidateEvidenceApi.ts";
import {
  buildWebDiscoveryCaptureCommand,
  buildWebDiscoverySearchCommand,
  createWebDiscoveryApi,
  webDiscoveryAlreadyCaptured,
} from "../../src/evidence/candidates/WebDiscoveryApi.ts";

let passCount = 0;
function check(value: unknown, message: string): asserts value { assert(value, message); passCount += 1; }
function equal(actual: unknown, expected: unknown, message: string): void { assert.equal(actual, expected, message); passCount += 1; }
function deepEqual(actual: unknown, expected: unknown, message: string): void { assert.deepEqual(actual, expected, message); passCount += 1; }

const timestamp = "2026-09-17T12:00:00Z";
const zeroEffects = { aiAssistance:"NONE",rexExecution:"NONE",estimatedProviderCost:0,actualProviderCost:0,finalCharge:0,researchInboxEffect:"NONE",publicationEffect:"NONE",candidateKnowledgeEffect:"NONE",canonEffect:"NONE",graphEffect:"NONE",manifoldEffect:"NONE",resolveEffect:"NONE" } as const;
const result = { resultId:"opaque-result-1",providerResultId:"provider-1",rank:1,title:"Ephemeral",providerReturnedUrl:"https://example.test/a",normalizedUrl:"https://example.test/a",displayUrl:"https://example.test/a",displayDomain:"example.test",snippet:"Discovery only",mediaType:"text/html",attribution:"Fixture",retentionRestrictions:[],providerMetadata:{language:"en"} };
const searchBody = { schemaVersion:"web-discovery-outcome/v1",searchSessionId:"opaque-session-1",operationId:"search-op-1",investigationId:"investigation-a",expectedInvestigationRevision:7,manifoldRevisionId:"investigation-aggregate:7",normalizedQuery:"query",queryNormalizationVersion:"web-discovery-query-normalization/v1",runtimeStatus:"OFFLINE_FIXTURE",adapterId:"fixture",adapterVersion:"1",status:"COMPLETED",startedAt:timestamp,completedAt:timestamp,expiresAt:timestamp,resultCount:1,results:[result],providerAttribution:"Fixture",restrictions:[],warnings:[],error:null,receipt:{schemaVersion:"web-discovery-receipt/v1",operationId:"search-op-1",investigationId:"investigation-a",manifoldRevisionId:"investigation-aggregate:7",status:"COMPLETED",createdAt:timestamp,completedAt:timestamp,...zeroEffects} };
const captureBody = (idempotencyDisposition:"CREATED"|"REPLAYED") => { const researchInboxEffect=idempotencyDisposition; return {schemaVersion:"web-discovery-capture-outcome/v1",operationId:"capture-op-1",searchSessionId:"opaque-session-1",resultId:"opaque-result-1",investigationId:"investigation-a",expectedInvestigationRevision:7,manifoldRevisionId:"investigation-aggregate:7",candidateId:"candidate-1",candidateRevision:0,origin:"DISCOVERY",intakePathway:"WEB_DISCOVERY",visibleOrigin:"WEB_DISCOVERED",lifecycleState:"DISCOVERED",acquisitionState:"NOT_REQUESTED",publicationState:"NOT_PUBLISHED",idempotencyDisposition,capturedAt:timestamp,researchInboxEffect,researchInboxAnchorId:"research-v2:investigation-a:EVIDENCE_RECORD:candidate-1",source:{title:result.title,providerReturnedUrl:result.providerReturnedUrl,normalizedUrl:result.normalizedUrl,sourceDomain:result.displayDomain,snippet:result.snippet,mediaType:result.mediaType,attribution:result.attribution,retentionRestrictions:[],providerMetadata:result.providerMetadata},receipt:{schemaVersion:"web-discovery-capture-receipt/v1",operationId:"capture-op-1",searchSessionId:"opaque-session-1",resultId:"opaque-result-1",candidateId:"candidate-1",principalAuthority:"principal-a",investigationId:"investigation-a",expectedInvestigationRevision:7,manifoldRevisionId:"investigation-aggregate:7",providerAdapterId:"fixture",providerAdapterVersion:"1",providerResultId:"provider-1",normalizedQuery:"query",queryNormalizationVersion:"web-discovery-query-normalization/v1",resultRank:1,providerReturnedUrl:result.providerReturnedUrl,normalizedUrl:result.normalizedUrl,capturedAt:timestamp,idempotencyDisposition,...zeroEffects,researchInboxEffect}}; };

const searchCommand = buildWebDiscoverySearchCommand({investigationId:"investigation-a",expectedInvestigationRevision:7,manifoldRevisionId:"investigation-aggregate:7",searchSessionId:"opaque-session-1",operationId:"search-op-1",query:"query",resultLimit:10,idempotencyKey:"search-key-1"});
const captureCommand = buildWebDiscoveryCaptureCommand({investigationId:"investigation-a",expectedInvestigationRevision:7,manifoldRevisionId:"investigation-aggregate:7",searchSessionId:"opaque-session-1",resultId:"opaque-result-1",operationId:"capture-op-1",idempotencyKey:"capture-key-1",addToResearchInbox:true,researcherNote:"Human selected this result."});
const calls: Array<{url:string;init:RequestInit}> = [];
let nextBody: unknown = searchBody;
let nextStatus = 200;
const transport: CandidateEvidenceTransport = async (url, init) => { calls.push({url,init}); return new Response(JSON.stringify(nextBody),{status:nextStatus,headers:{"Content-Type":"application/json"}}); };
const request = createCandidateEvidenceRequester({baseUrl:"https://api.example.test",transport,cookieSource:()=>"other=x; isees_csrf=csrf%20token"});
const api = createWebDiscoveryApi(request);
const scope = {principalId:"principal-a",investigationId:"investigation-a"};

const searched = await api.search(scope,searchCommand);
equal(calls[0]?.url,"https://api.example.test/api/v1/investigations/investigation-a/candidate-evidence/web-discovery/searches","search path");
deepEqual(JSON.parse(String(calls[0]?.init.body)),searchCommand,"search body");
equal(calls[0]?.init.credentials,"include","authenticated cookie transport");
equal(new Headers(calls[0]?.init.headers).get("X-ISEES-CSRF"),"csrf token","CSRF transport");
equal(new Headers(calls[0]?.init.headers).get("X-ISEES-Principal-Id"),"principal-a","principal transport");
equal(searched.searchSessionId,"opaque-session-1","opaque session retained");
equal(searched.results[0]?.resultId,"opaque-result-1","opaque result retained");
equal(searched.expectedInvestigationRevision,7,"Investigation revision retained");
equal(searched.manifoldRevisionId,"investigation-aggregate:7","Manifold revision retained");
equal(searched.runtimeStatus,"OFFLINE_FIXTURE","provider-neutral runtime status retained");
for(const forbidden of ["adapterId","adapterVersion","provider","apiKey"])check(!(forbidden in searchCommand),`browser search excludes ${forbidden}`);

nextBody=captureBody("CREATED");nextStatus=201;
const created=await api.capture(scope,captureCommand);
equal(calls[1]?.url,"https://api.example.test/api/v1/investigations/investigation-a/candidate-evidence/web-discovery/captures","capture path");
const serializedCapture=JSON.parse(String(calls[1]?.init.body)) as {[key:string]:unknown};
deepEqual(serializedCapture,captureCommand,"capture body");
equal(serializedCapture.researcherConfirmation,true,"literal researcher confirmation");
equal(serializedCapture.addToResearchInbox,true,"explicit Research Inbox choice");
deepEqual(Object.keys(serializedCapture).sort(),["addToResearchInbox","expectedInvestigationRevision","idempotencyKey","investigationId","manifoldRevisionId","operationId","researcherConfirmation","researcherNote","resultId","schemaVersion","searchSessionId"].sort(),"capture allowlist");
for(const forbidden of ["title","url","normalizedUrl","domain","snippet","attribution","mediaType","providerMetadata","retentionRestrictions","query"]) check(!(forbidden in serializedCapture),`capture excludes ${forbidden}`);
equal(created.idempotencyDisposition,"CREATED","created disposition");
equal(created.researchInboxEffect,"CREATED","created Inbox disposition");
const injectedCapture=Object.freeze({...captureCommand,title:"browser title",url:"https://evil.test",providerMetadata:{language:"xx"}}) as typeof captureCommand;
await api.capture(scope,injectedCapture);
const injectedSerialized=JSON.parse(String(calls[2]?.init.body)) as {[key:string]:unknown};
for(const forbidden of ["title","url","providerMetadata"])check(!(forbidden in injectedSerialized),`runtime capture projection excludes injected ${forbidden}`);
nextBody=captureBody("REPLAYED");nextStatus=200;
const replayed=await api.capture(scope,captureCommand);
equal(replayed.idempotencyDisposition,"REPLAYED","replayed disposition");

nextBody={error:{code:"REVISION_CONFLICT",message:"Expected Investigation revision is stale",requestId:"request-1"}};nextStatus=409;
let structured:CandidateEvidenceHttpError|undefined;
try{await api.capture(scope,captureCommand);}catch(error){if(error instanceof CandidateEvidenceHttpError)structured=error;}
equal(structured?.status,409,"structured error status");
deepEqual(structured?.backendError,{code:"REVISION_CONFLICT",message:"Expected Investigation revision is stale",requestId:"request-1"},"structured error envelope");

nextBody={error:{code:"WEB_DISCOVERY_ALREADY_CAPTURED",message:"Web Discovery result is already captured",existingCandidateId:"candidate-1"}};nextStatus=409;
let duplicate:CandidateEvidenceHttpError|undefined;
try{await api.capture(scope,captureCommand);}catch(error){if(error instanceof CandidateEvidenceHttpError)duplicate=error;}
deepEqual(webDiscoveryAlreadyCaptured(duplicate),{disposition:"REPLAYED",candidateId:"candidate-1"},"duplicate conflict becomes typed governed replay outcome");
equal(duplicate?.backendError?.existingCandidateId,"candidate-1","stable existing Candidate Evidence identity retained");

nextBody={error:{code:"ORIGIN_IDENTITY_CONFLICT",message:"Unrelated origin conflict"}};nextStatus=409;
let unrelated:CandidateEvidenceHttpError|undefined;
try{await api.capture(scope,captureCommand);}catch(error){if(error instanceof CandidateEvidenceHttpError)unrelated=error;}
equal(webDiscoveryAlreadyCaptured(unrelated),undefined,"unrelated conflicts are not converted to replay outcomes");

const source=readFileSync("src/evidence/candidates/WebDiscoveryApi.ts","utf8");
for(const forbidden of ["CandidateEvidenceRuntime","ResearchInboxStore","publishRex","createAnchorsAtomically","GraphRuntime","ManifoldRuntime","ResolveRuntime","RexApi","AiApi","provider.search","chargeAccount"])check(!source.includes(forbidden),`client has no ${forbidden} side-effect integration`);
equal(calls.length,7,"only explicit search/capture HTTP calls occurred");
check(Object.isFrozen(searched)&&Object.isFrozen(searched.results),"ephemeral search projection is immutable ordinary response data");

console.log(`PASS VerifyWebDiscoveryApiClient — ${passCount} focused assertions passed`);
