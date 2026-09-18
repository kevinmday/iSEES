import {
  CandidateEvidenceHttpError,
  candidateEvidenceRequest,
  type CandidateEvidenceApiScope,
} from "./CandidateEvidenceApi.ts";

export interface WebDiscoveryAlreadyCapturedOutcome { readonly disposition: "REPLAYED"; readonly candidateId: string }
export function webDiscoveryAlreadyCaptured(error: unknown): WebDiscoveryAlreadyCapturedOutcome | undefined {
  if (!(error instanceof CandidateEvidenceHttpError) || error.status !== 409 || error.backendError?.code !== "WEB_DISCOVERY_ALREADY_CAPTURED" || !error.backendError.existingCandidateId) return undefined;
  return Object.freeze({ disposition: "REPLAYED", candidateId: error.backendError.existingCandidateId });
}

export interface WebDiscoverySelectedObjectContext { readonly objectType: string; readonly objectId: string; readonly objectRevision?: string | null }
export interface WebDiscoveryExecutionPolicy { readonly metadataOnly: true; readonly aiAssistance: "NONE"; readonly rexExecution: "NONE"; readonly authorizedSpend: 0 }
export interface WebDiscoverySearchCommand {
  readonly schemaVersion: "web-discovery-search/v1"; readonly investigationId: string; readonly expectedInvestigationRevision: number;
  readonly manifoldRevisionId: string; readonly searchSessionId: string; readonly operationId: string; readonly query: string;
  readonly selectedObjectContext?: WebDiscoverySelectedObjectContext | null; readonly resultLimit: number; readonly adapterId: string;
  readonly adapterVersion: string; readonly idempotencyKey: string; readonly executionPolicy: WebDiscoveryExecutionPolicy;
}
export type WebDiscoverySearchCommandInput = Omit<WebDiscoverySearchCommand, "schemaVersion" | "executionPolicy">;
export interface WebDiscoverySearchResult {
  readonly resultId: string; readonly providerResultId: string | null; readonly rank: number; readonly title: string;
  readonly providerReturnedUrl: string; readonly normalizedUrl: string; readonly displayUrl: string; readonly displayDomain: string;
  readonly snippet: string; readonly mediaType: string | null; readonly attribution: string;
  readonly retentionRestrictions: readonly string[]; readonly providerMetadata: Readonly<{ readonly language?: string; readonly publishedAt?: string; readonly sourceType?: string; readonly thumbnailAvailable?: string }>;
}
export interface WebDiscoveryStableError { readonly code: string; readonly message: string }
export interface WebDiscoveryZeroEffectReceipt {
  readonly schemaVersion: string; readonly operationId: string; readonly investigationId: string; readonly manifoldRevisionId: string;
  readonly status: WebDiscoverySearchStatus; readonly createdAt: string; readonly completedAt: string; readonly aiAssistance: "NONE";
  readonly rexExecution: "NONE"; readonly estimatedProviderCost: 0; readonly actualProviderCost: 0; readonly finalCharge: 0;
  readonly researchInboxEffect: "NONE"; readonly publicationEffect: "NONE"; readonly candidateKnowledgeEffect: "NONE";
  readonly canonEffect: "NONE"; readonly graphEffect: "NONE"; readonly manifoldEffect: "NONE"; readonly resolveEffect: "NONE";
}
export type WebDiscoverySearchStatus = "COMPLETED" | "ZERO_RESULTS" | "CANCELLED" | "UNAVAILABLE" | "RATE_LIMITED" | "FAILED";
export interface WebDiscoverySearchResponse {
  readonly schemaVersion: "web-discovery-outcome/v1"; readonly searchSessionId: string; readonly operationId: string;
  readonly investigationId: string; readonly expectedInvestigationRevision: number; readonly manifoldRevisionId: string;
  readonly normalizedQuery: string; readonly queryNormalizationVersion: string; readonly adapterId: string; readonly adapterVersion: string;
  readonly status: WebDiscoverySearchStatus; readonly startedAt: string; readonly completedAt: string; readonly expiresAt: string;
  readonly resultCount: number; readonly results: readonly WebDiscoverySearchResult[]; readonly providerAttribution: string;
  readonly restrictions: readonly string[]; readonly warnings: readonly string[]; readonly error: WebDiscoveryStableError | null;
  readonly receipt: WebDiscoveryZeroEffectReceipt;
}
export interface WebDiscoveryCaptureCommand {
  readonly schemaVersion: "web-discovery-capture/v1"; readonly investigationId: string; readonly expectedInvestigationRevision: number;
  readonly manifoldRevisionId: string; readonly searchSessionId: string; readonly resultId: string; readonly operationId: string;
  readonly idempotencyKey: string; readonly researcherConfirmation: true; readonly researcherNote?: string | null;
}
export type WebDiscoveryCaptureCommandInput = Omit<WebDiscoveryCaptureCommand, "schemaVersion" | "researcherConfirmation">;
export interface WebDiscoveryCaptureSource {
  readonly title: string; readonly providerReturnedUrl: string; readonly normalizedUrl: string; readonly sourceDomain: string;
  readonly snippet: string; readonly mediaType: string | null; readonly attribution: string; readonly retentionRestrictions: readonly string[];
  readonly providerMetadata: WebDiscoverySearchResult["providerMetadata"];
}
export interface WebDiscoveryCaptureReceipt {
  readonly schemaVersion: "web-discovery-capture-receipt/v1"; readonly operationId: string; readonly searchSessionId: string;
  readonly resultId: string; readonly candidateId: string; readonly principalAuthority: string; readonly investigationId: string;
  readonly expectedInvestigationRevision: number; readonly manifoldRevisionId: string; readonly providerAdapterId: string;
  readonly providerAdapterVersion: string; readonly providerResultId: string | null; readonly normalizedQuery: string;
  readonly queryNormalizationVersion: string; readonly resultRank: number; readonly providerReturnedUrl: string; readonly normalizedUrl: string;
  readonly capturedAt: string; readonly idempotencyDisposition: WebDiscoveryCaptureDisposition; readonly aiAssistance: "NONE";
  readonly rexExecution: "NONE"; readonly estimatedProviderCost: 0; readonly actualProviderCost: 0; readonly finalCharge: 0;
  readonly researchInboxEffect: "NONE"; readonly publicationEffect: "NONE"; readonly candidateKnowledgeEffect: "NONE";
  readonly canonEffect: "NONE"; readonly graphEffect: "NONE"; readonly manifoldEffect: "NONE"; readonly resolveEffect: "NONE";
}
export type WebDiscoveryCaptureDisposition = "CREATED" | "REPLAYED";
interface WebDiscoveryCaptureResponseBase {
  readonly schemaVersion: "web-discovery-capture-outcome/v1"; readonly operationId: string; readonly searchSessionId: string;
  readonly resultId: string; readonly investigationId: string; readonly expectedInvestigationRevision: number; readonly manifoldRevisionId: string;
  readonly candidateId: string; readonly candidateRevision: number; readonly origin: "DISCOVERY"; readonly intakePathway: "WEB_DISCOVERY";
  readonly visibleOrigin: "WEB_DISCOVERED"; readonly lifecycleState: "DISCOVERED" | "REFERENCED" | "IN_REVIEW" | "DEFERRED" | "EXCLUDED";
  readonly acquisitionState: "NOT_REQUESTED"; readonly publicationState: "NOT_PUBLISHED"; readonly capturedAt: string;
  readonly source: WebDiscoveryCaptureSource; readonly receipt: WebDiscoveryCaptureReceipt;
}
export type WebDiscoveryCaptureResponse =
  | (WebDiscoveryCaptureResponseBase & { readonly idempotencyDisposition: "CREATED"; readonly receipt: WebDiscoveryCaptureReceipt & { readonly idempotencyDisposition: "CREATED" } })
  | (WebDiscoveryCaptureResponseBase & { readonly idempotencyDisposition: "REPLAYED"; readonly receipt: WebDiscoveryCaptureReceipt & { readonly idempotencyDisposition: "REPLAYED" } });

interface JsonObject { readonly [key: string]: unknown }
const object = (value: unknown, label: string): JsonObject => { if (value === null || typeof value !== "object" || Array.isArray(value)) throw new TypeError(`${label} must be an object.`); return value as JsonObject; };
const text = (value: unknown, label: string): string => { if (typeof value !== "string") throw new TypeError(`${label} must be text.`); return value; };
const integer = (value: unknown, label: string): number => { if (typeof value !== "number" || !Number.isInteger(value)) throw new TypeError(`${label} must be an integer.`); return value; };
const literal = <T extends string | number>(value: unknown, expected: T, label: string): T => { if (value !== expected) throw new TypeError(`${label} is invalid.`); return expected; };
const strings = (value: unknown, label: string): readonly string[] => { if (!Array.isArray(value) || value.some((item) => typeof item !== "string")) throw new TypeError(`${label} must be text values.`); return Object.freeze([...value]) as readonly string[]; };
const disposition = (value: unknown): WebDiscoveryCaptureDisposition => value === "CREATED" || value === "REPLAYED" ? value : (() => { throw new TypeError("Capture disposition is invalid."); })();
const status = (value: unknown): WebDiscoverySearchStatus => ["COMPLETED", "ZERO_RESULTS", "CANCELLED", "UNAVAILABLE", "RATE_LIMITED", "FAILED"].includes(String(value)) ? value as WebDiscoverySearchStatus : (() => { throw new TypeError("Search status is invalid."); })();
const nullableText = (value: unknown, label: string): string | null => value === null ? null : text(value, label);
const zeroEffects = (value: JsonObject): void => {
  for (const key of ["estimatedProviderCost", "actualProviderCost", "finalCharge"]) literal(value[key], 0, key);
  for (const key of ["aiAssistance", "rexExecution", "researchInboxEffect", "publicationEffect", "candidateKnowledgeEffect", "canonEffect", "graphEffect", "manifoldEffect", "resolveEffect"]) literal(value[key], "NONE", key);
};
const metadata = (value: unknown): WebDiscoverySearchResult["providerMetadata"] => {
  const item = object(value, "providerMetadata");
  const allowed = new Set(["language", "publishedAt", "sourceType", "thumbnailAvailable"]);
  for (const [key, entry] of Object.entries(item)) if (!allowed.has(key) || typeof entry !== "string") throw new TypeError("providerMetadata is invalid.");
  return Object.freeze({ ...item }) as WebDiscoverySearchResult["providerMetadata"];
};
function parseResult(value: unknown): WebDiscoverySearchResult { const v=object(value,"result"); return Object.freeze({resultId:text(v.resultId,"resultId"),providerResultId:nullableText(v.providerResultId,"providerResultId"),rank:integer(v.rank,"rank"),title:text(v.title,"title"),providerReturnedUrl:text(v.providerReturnedUrl,"providerReturnedUrl"),normalizedUrl:text(v.normalizedUrl,"normalizedUrl"),displayUrl:text(v.displayUrl,"displayUrl"),displayDomain:text(v.displayDomain,"displayDomain"),snippet:text(v.snippet,"snippet"),mediaType:nullableText(v.mediaType,"mediaType"),attribution:text(v.attribution,"attribution"),retentionRestrictions:strings(v.retentionRestrictions,"retentionRestrictions"),providerMetadata:metadata(v.providerMetadata)}); }
function parseSearchReceipt(value: unknown): WebDiscoveryZeroEffectReceipt { const v=object(value,"receipt"); zeroEffects(v); return Object.freeze({schemaVersion:text(v.schemaVersion,"schemaVersion"),operationId:text(v.operationId,"operationId"),investigationId:text(v.investigationId,"investigationId"),manifoldRevisionId:text(v.manifoldRevisionId,"manifoldRevisionId"),status:status(v.status),createdAt:text(v.createdAt,"createdAt"),completedAt:text(v.completedAt,"completedAt"),aiAssistance:"NONE",rexExecution:"NONE",estimatedProviderCost:0,actualProviderCost:0,finalCharge:0,researchInboxEffect:"NONE",publicationEffect:"NONE",candidateKnowledgeEffect:"NONE",canonEffect:"NONE",graphEffect:"NONE",manifoldEffect:"NONE",resolveEffect:"NONE"}); }
export function parseWebDiscoverySearchResponse(value: unknown): WebDiscoverySearchResponse { const v=object(value,"search response"); if(!Array.isArray(v.results))throw new TypeError("results must be an array."); const error=v.error===null?null:(()=>{const e=object(v.error,"error");return Object.freeze({code:text(e.code,"error.code"),message:text(e.message,"error.message")});})(); const results=Object.freeze(v.results.map(parseResult)); const resultCount=integer(v.resultCount,"resultCount"); if(resultCount!==results.length)throw new TypeError("resultCount does not match results."); return Object.freeze({schemaVersion:literal(v.schemaVersion,"web-discovery-outcome/v1","schemaVersion"),searchSessionId:text(v.searchSessionId,"searchSessionId"),operationId:text(v.operationId,"operationId"),investigationId:text(v.investigationId,"investigationId"),expectedInvestigationRevision:integer(v.expectedInvestigationRevision,"expectedInvestigationRevision"),manifoldRevisionId:text(v.manifoldRevisionId,"manifoldRevisionId"),normalizedQuery:text(v.normalizedQuery,"normalizedQuery"),queryNormalizationVersion:text(v.queryNormalizationVersion,"queryNormalizationVersion"),adapterId:text(v.adapterId,"adapterId"),adapterVersion:text(v.adapterVersion,"adapterVersion"),status:status(v.status),startedAt:text(v.startedAt,"startedAt"),completedAt:text(v.completedAt,"completedAt"),expiresAt:text(v.expiresAt,"expiresAt"),resultCount,results,providerAttribution:text(v.providerAttribution,"providerAttribution"),restrictions:strings(v.restrictions,"restrictions"),warnings:strings(v.warnings,"warnings"),error,receipt:parseSearchReceipt(v.receipt)}); }
function parseCaptureSource(value:unknown):WebDiscoveryCaptureSource{const v=object(value,"source");return Object.freeze({title:text(v.title,"title"),providerReturnedUrl:text(v.providerReturnedUrl,"providerReturnedUrl"),normalizedUrl:text(v.normalizedUrl,"normalizedUrl"),sourceDomain:text(v.sourceDomain,"sourceDomain"),snippet:text(v.snippet,"snippet"),mediaType:nullableText(v.mediaType,"mediaType"),attribution:text(v.attribution,"attribution"),retentionRestrictions:strings(v.retentionRestrictions,"retentionRestrictions"),providerMetadata:metadata(v.providerMetadata)});}
function parseCaptureReceipt(value:unknown):WebDiscoveryCaptureReceipt{const v=object(value,"receipt");zeroEffects(v);return Object.freeze({schemaVersion:literal(v.schemaVersion,"web-discovery-capture-receipt/v1","schemaVersion"),operationId:text(v.operationId,"operationId"),searchSessionId:text(v.searchSessionId,"searchSessionId"),resultId:text(v.resultId,"resultId"),candidateId:text(v.candidateId,"candidateId"),principalAuthority:text(v.principalAuthority,"principalAuthority"),investigationId:text(v.investigationId,"investigationId"),expectedInvestigationRevision:integer(v.expectedInvestigationRevision,"expectedInvestigationRevision"),manifoldRevisionId:text(v.manifoldRevisionId,"manifoldRevisionId"),providerAdapterId:text(v.providerAdapterId,"providerAdapterId"),providerAdapterVersion:text(v.providerAdapterVersion,"providerAdapterVersion"),providerResultId:nullableText(v.providerResultId,"providerResultId"),normalizedQuery:text(v.normalizedQuery,"normalizedQuery"),queryNormalizationVersion:text(v.queryNormalizationVersion,"queryNormalizationVersion"),resultRank:integer(v.resultRank,"resultRank"),providerReturnedUrl:text(v.providerReturnedUrl,"providerReturnedUrl"),normalizedUrl:text(v.normalizedUrl,"normalizedUrl"),capturedAt:text(v.capturedAt,"capturedAt"),idempotencyDisposition:disposition(v.idempotencyDisposition),aiAssistance:"NONE",rexExecution:"NONE",estimatedProviderCost:0,actualProviderCost:0,finalCharge:0,researchInboxEffect:"NONE",publicationEffect:"NONE",candidateKnowledgeEffect:"NONE",canonEffect:"NONE",graphEffect:"NONE",manifoldEffect:"NONE",resolveEffect:"NONE"});}
export function parseWebDiscoveryCaptureResponse(value:unknown):WebDiscoveryCaptureResponse{const v=object(value,"capture response"),d=disposition(v.idempotencyDisposition),receipt=parseCaptureReceipt(v.receipt),lifecycle=text(v.lifecycleState,"lifecycleState");if(receipt.idempotencyDisposition!==d)throw new TypeError("Capture dispositions do not match.");if(!["DISCOVERED","REFERENCED","IN_REVIEW","DEFERRED","EXCLUDED"].includes(lifecycle))throw new TypeError("lifecycleState is invalid.");return Object.freeze({schemaVersion:literal(v.schemaVersion,"web-discovery-capture-outcome/v1","schemaVersion"),operationId:text(v.operationId,"operationId"),searchSessionId:text(v.searchSessionId,"searchSessionId"),resultId:text(v.resultId,"resultId"),investigationId:text(v.investigationId,"investigationId"),expectedInvestigationRevision:integer(v.expectedInvestigationRevision,"expectedInvestigationRevision"),manifoldRevisionId:text(v.manifoldRevisionId,"manifoldRevisionId"),candidateId:text(v.candidateId,"candidateId"),candidateRevision:integer(v.candidateRevision,"candidateRevision"),origin:literal(v.origin,"DISCOVERY","origin"),intakePathway:literal(v.intakePathway,"WEB_DISCOVERY","intakePathway"),visibleOrigin:literal(v.visibleOrigin,"WEB_DISCOVERED","visibleOrigin"),lifecycleState:lifecycle as WebDiscoveryCaptureResponse["lifecycleState"],acquisitionState:literal(v.acquisitionState,"NOT_REQUESTED","acquisitionState"),publicationState:literal(v.publicationState,"NOT_PUBLISHED","publicationState"),idempotencyDisposition:d,capturedAt:text(v.capturedAt,"capturedAt"),source:parseCaptureSource(v.source),receipt}) as WebDiscoveryCaptureResponse;}

export function buildWebDiscoverySearchCommand(input: WebDiscoverySearchCommandInput): WebDiscoverySearchCommand { return Object.freeze({schemaVersion:"web-discovery-search/v1",investigationId:input.investigationId,expectedInvestigationRevision:input.expectedInvestigationRevision,manifoldRevisionId:input.manifoldRevisionId,searchSessionId:input.searchSessionId,operationId:input.operationId,query:input.query,...(input.selectedObjectContext===undefined?{}:{selectedObjectContext:input.selectedObjectContext}),resultLimit:input.resultLimit,adapterId:input.adapterId,adapterVersion:input.adapterVersion,idempotencyKey:input.idempotencyKey,executionPolicy:Object.freeze({metadataOnly:true,aiAssistance:"NONE",rexExecution:"NONE",authorizedSpend:0})}); }
export function buildWebDiscoveryCaptureCommand(input: WebDiscoveryCaptureCommandInput): WebDiscoveryCaptureCommand { return Object.freeze({schemaVersion:"web-discovery-capture/v1",investigationId:input.investigationId,expectedInvestigationRevision:input.expectedInvestigationRevision,manifoldRevisionId:input.manifoldRevisionId,searchSessionId:input.searchSessionId,resultId:input.resultId,operationId:input.operationId,idempotencyKey:input.idempotencyKey,researcherConfirmation:true,...(input.researcherNote===undefined?{}:{researcherNote:input.researcherNote})}); }
export interface WebDiscoveryApi { search(scope:CandidateEvidenceApiScope,command:WebDiscoverySearchCommand,signal?:AbortSignal):Promise<WebDiscoverySearchResponse>; capture(scope:CandidateEvidenceApiScope,command:WebDiscoveryCaptureCommand,signal?:AbortSignal):Promise<WebDiscoveryCaptureResponse> }
export type WebDiscoveryRequest = typeof candidateEvidenceRequest;
export function createWebDiscoveryApi(request:WebDiscoveryRequest=candidateEvidenceRequest):WebDiscoveryApi{return Object.freeze({search:(scope:CandidateEvidenceApiScope,command:WebDiscoverySearchCommand,signal?:AbortSignal)=>request(scope,"/web-discovery/searches",{method:"POST",body:JSON.stringify(buildWebDiscoverySearchCommand(command)),signal},parseWebDiscoverySearchResponse,true),capture:(scope:CandidateEvidenceApiScope,command:WebDiscoveryCaptureCommand,signal?:AbortSignal)=>request(scope,"/web-discovery/captures",{method:"POST",body:JSON.stringify(buildWebDiscoveryCaptureCommand(command)),signal},parseWebDiscoveryCaptureResponse)});}
export const webDiscoveryApi=createWebDiscoveryApi();
