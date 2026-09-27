from __future__ import annotations

import uuid
import hashlib
from dataclasses import asdict
from functools import lru_cache
from datetime import datetime
from typing import Annotated

from fastapi import APIRouter, Depends, Path, Request
from fastapi.responses import JSONResponse
from pydantic import BaseModel, ConfigDict, Field
from typing import Literal

from isees_uap.api.v1.investigations import repository as investigation_repository
from isees_uap.authentication.principal import AuthenticatedPrincipal, require_authenticated_principal, require_csrf_protected_principal
from isees_uap.investigations.authority import PersistedInvestigationAuthority
from isees_uap.rex.application import RexApiApplicationService
from isees_uap.rex.canonical import canonical_hash
from isees_uap.persistence import database_path
from isees_uap.rex.contracts import TargetKind
from isees_uap.rex.errors import RexExecutionError, RexRepositoryError
from isees_uap.rex.expansion_planner import MAX_ACQUIRED_SOURCES, ExpansionPlanUnavailable, build_expansion_plan
from isees_uap.rex.sqlite_repository import SQLiteRexRepository
from isees_uap.rex.free_execution import FreeRexSettings
from isees_uap.candidate_evidence.web_discovery_schemas import WebDiscoverySearchCommand, WebDiscoveryCaptureCommand
from isees_uap.candidate_evidence.web_discovery_providers import WebDiscoveryRuntimeStatus
from isees_uap.candidate_evidence.web_discovery_runtime import WebDiscoveryRuntimeError
from isees_uap.candidate_evidence.errors import WebDiscoveryAlreadyCaptured
from isees_uap.api.v1.candidate_evidence import web_discovery_runtime, web_discovery_capture_service

router = APIRouter(prefix="/api/v1/investigations/{investigation_id}/rex", tags=["rex"])
IdentityPath = Annotated[str, Path(min_length=1, pattern=r".*\S.*")]


class RexApiError(RuntimeError):
    def __init__(self, code: str, message: str, status_code: int):
        super().__init__(message); self.code=code; self.status_code=status_code


class AssignmentCommand(BaseModel):
    model_config=ConfigDict(extra="forbid")
    targetId: str = Field(min_length=1,max_length=300)
    targetKind: TargetKind
    objective: str = Field(min_length=1,max_length=2000)


class PreparationCommand(BaseModel):
    model_config=ConfigDict(extra="forbid")
    assignmentId: str = Field(min_length=1,max_length=200)
    manifoldRevisionId: str = Field(min_length=1,max_length=300)
    manifoldRevisionHash: str = Field(pattern=r"^sha256:[0-9a-f]{64}$")

class ExpansionProposalCommand(BaseModel):
    model_config=ConfigDict(extra="forbid")
    targetId: str = Field(min_length=1,max_length=300)
    targetKind: TargetKind
    operationalRevisionId: str = Field(min_length=1,max_length=300)
    operationalRevisionHash: str = Field(pattern=r"^sha256:[0-9a-f]{64}$")
    researcherQuestion: str = Field(min_length=1,max_length=2000)
    researcherNotes: str | None = Field(default=None,max_length=4000)

class ProposalApprovalCommand(BaseModel):
    model_config=ConfigDict(extra="forbid")
    proposalId: str = Field(min_length=1,max_length=200)
    targetId: str = Field(min_length=1,max_length=300)
    targetKind: TargetKind
    operationalRevisionId: str = Field(min_length=1,max_length=300)
    operationalRevisionHash: str = Field(pattern=r"^sha256:[0-9a-f]{64}$")
    idempotencyKey: str = Field(min_length=8,max_length=200)
    researcherConfirmation: Literal[True]
    approvedQueries: list[str] = Field(min_length=1,max_length=4)
    approvedLimits: list[str] = Field(min_length=1,max_length=20)
    approvedStopRules: list[str] = Field(min_length=1,max_length=20)
    requestedResultLimit: int = Field(ge=1,le=10)

class RexLeadCaptureCommand(BaseModel):
    model_config=ConfigDict(extra="forbid")
    searchSessionId: str = Field(min_length=1,max_length=300)
    resultId: str = Field(min_length=1,max_length=300)
    idempotencyKey: str = Field(min_length=8,max_length=200)
    researcherConfirmation: Literal[True]

def free_rex_settings():
    try:
        return FreeRexSettings.from_environment()
    except RuntimeError:
        return FreeRexSettings(False,1,1,1,1,10)


@lru_cache(maxsize=1)
def repository(): return SQLiteRexRepository(database_path("ISEES_REX_DATABASE_PATH", "rex.sqlite3", "runtime/rex.sqlite3"))

def service(repo=Depends(repository)): return RexApiApplicationService(repo)

def _owned(investigation_id, principal, parent_repo):
    PersistedInvestigationAuthority(parent_repo).require_owned(account_id=principal.account_id, investigation_id=investigation_id)
    return principal.account_id

def owned_read(investigation_id: IdentityPath, principal: AuthenticatedPrincipal=Depends(require_authenticated_principal), parent_repo=Depends(investigation_repository)):
    return _owned(investigation_id,principal,parent_repo)

def owned_mutation(investigation_id: IdentityPath, principal: AuthenticatedPrincipal=Depends(require_csrf_protected_principal), parent_repo=Depends(investigation_repository)):
    return _owned(investigation_id,principal,parent_repo)

def _manifold_binding(parent_repo, owner: str, investigation_id: str):
    aggregate = parent_repo.get_empty_aggregate(
        investigation_id=investigation_id, owner_principal_id=owner)
    if aggregate is None:
        raise RexApiError("REX_INVESTIGATION_UNAVAILABLE", "The saved investigation is unavailable", 404)
    payload = {"schemaVersion": aggregate.schema_version, "state": aggregate.state,
               "revision": aggregate.revision, "payload": aggregate.payload}
    return f"investigation-aggregate:{aggregate.revision}", canonical_hash(payload)

def _operational_binding(parent_repo, owner: str, investigation_id: str, command: ExpansionProposalCommand):
    revision=parent_repo.get_current_operational_revision(investigation_id=investigation_id,owner_principal_id=owner)
    if revision is None:
        raise RexApiError("REX_SELECTION_UNAVAILABLE","The investigation has no governed operational selection",409)
    revision_hash="sha256:"+hashlib.sha256(revision.graph_fingerprint.encode("utf-8")).hexdigest()
    if revision.operational_revision_id!=command.operationalRevisionId or revision_hash!=command.operationalRevisionHash:
        raise RexApiError("REX_STALE_REVISION","The selected operational revision is stale",409)
    collection="nodes" if command.targetKind is TargetKind.NODE else "edges"
    values=revision.graph_snapshot.get(collection,[])
    if not isinstance(values,list) or not any(isinstance(value,dict) and value.get("id")==command.targetId for value in values):
        raise RexApiError("REX_STALE_SELECTION","The selected object is not present in the current operational revision",409)
    return revision

@router.post("/proposals",status_code=201)
def create_proposal(investigation_id:IdentityPath,command:ExpansionProposalCommand,owner=Depends(owned_mutation),svc=Depends(service),parent_repo=Depends(investigation_repository)):
    revision=_operational_binding(parent_repo,owner,investigation_id,command)
    try: plan=build_expansion_plan(graph=revision.graph_snapshot,target_kind=command.targetKind.value,target_id=command.targetId,researcher_question=command.researcherQuestion).as_dict()
    except ExpansionPlanUnavailable as error: raise RexApiError("REX_PLAN_UNAVAILABLE",f"A safe REX proposal is unavailable: {error}",422) from error
    request={"principalId":owner,"investigationId":investigation_id,"selectedObject":{"kind":command.targetKind.value,"id":command.targetId},"revision":{"id":revision.operational_revision_id,"hash":command.operationalRevisionHash},"researcherQuestion":command.researcherQuestion,"researcherNotes":command.researcherNotes,"plan":plan}
    request_hash=canonical_hash(request); now=svc.clock()
    proposal={**request,"researcherNotesRole":"GUIDANCE_ONLY","proposedQueryPlan":plan["queryGuidance"],"limits":plan["limits"],"stopRules":plan["stopRules"],"proposalId":f"rxp_{request_hash.removeprefix('sha256:')}","status":"PROPOSAL_ONLY","createdAt":now.isoformat().replace("+00:00","Z"),"inspectionWork":["Search Tavily for metadata-only leads","Preserve URL, title, snippet, provider, query, and selection provenance","Quarantine returned leads as review-only Candidate Evidence","Do not fetch or claim inspection of source pages"],"costEnvelope":{"status":"OPERATOR_FUNDED_FREE","providerComponent":"COVERED_BY_ISEES","iseesMargin":"NOT_APPLICABLE","maximumCustomerPrice":"$0.00","customerCharge":"$0.00"},"effects":{"externalDispatch":"NONE","webpageAcquisition":"NONE","candidateEvidence":"NONE","researchInbox":"NONE","graphChanges":"NONE","canon":"NONE","manifold":"NONE","creditDebit":"NONE","billing":"NONE"}}
    value,replayed=svc.repository.create_expansion_proposal(proposal,request_hash=request_hash)
    return JSONResponse(status_code=200 if replayed else 201,content={**value,"idempotencyDisposition":"REPLAYED" if replayed else "CREATED"})

@router.get("/proposals/{proposal_id}")
def get_proposal(investigation_id:IdentityPath,proposal_id:IdentityPath,owner=Depends(owned_read),svc=Depends(service)):
    return svc.repository.get_expansion_proposal(proposal_id,owner_subject_id=owner,investigation_id=investigation_id)

@router.post("/executions/{execution_id}/leads/{result_id}/candidate-evidence")
def capture_rex_lead(investigation_id:IdentityPath,execution_id:IdentityPath,result_id:IdentityPath,
        command:RexLeadCaptureCommand,owner=Depends(owned_mutation),svc=Depends(service),
        parent_repo=Depends(investigation_repository),capture_service=Depends(web_discovery_capture_service)):
    if command.resultId!=result_id:
        raise RexApiError("REX_RESULT_IDENTITY_MISMATCH","The confirmation does not identify the routed result",409)
    receipt=svc.repository.reconstruct_proposal_execution_receipt(execution_id,owner_subject_id=owner,investigation_id=investigation_id)
    if receipt is None: raise RexApiError("REX_NOT_FOUND","The REX execution receipt was not found",404)
    lead=next((item for item in receipt.get("ephemeralLeads",[]) if item.get("resultId")==result_id and item.get("searchSessionId")==command.searchSessionId),None)
    if lead is None: raise RexApiError("REX_RESULT_NOT_FOUND","The selected lead is not part of the authoritative REX receipt",404)
    aggregate=parent_repo.get_empty_aggregate(investigation_id=investigation_id,owner_principal_id=owner)
    if aggregate is None: raise RexApiError("REX_INVESTIGATION_UNAVAILABLE","The saved investigation is unavailable",404)
    capture_command=WebDiscoveryCaptureCommand(schemaVersion="web-discovery-capture/v1",investigationId=investigation_id,
        expectedInvestigationRevision=lead["expectedInvestigationRevision"],manifoldRevisionId=lead["manifoldRevisionId"],
        searchSessionId=command.searchSessionId,resultId=result_id,operationId=f"rex-capture:{execution_id}:{result_id}",
        idempotencyKey=command.idempotencyKey,researcherConfirmation=True,addToResearchInbox=False)
    if capture_command.expectedInvestigationRevision!=aggregate.revision or capture_command.manifoldRevisionId!=f"investigation-aggregate:{aggregate.revision}":
        raise RexApiError("REX_STALE_REVISION","The REX lead is bound to a stale investigation revision",409)
    try: query_index=int(command.searchSessionId.rsplit("-q",1)[1])-1
    except (ValueError,IndexError): query_index=-1
    searches=receipt.get("queriesAttempted",[])
    query=searches[query_index].get("query") if 0<=query_index<len(searches) else None
    provenance={"proposalId":receipt["proposalId"],"executionId":execution_id,"searchSessionId":command.searchSessionId,"resultId":result_id,"query":query,"selectedObject":svc.repository.get_expansion_proposal(receipt["proposalId"],owner_subject_id=owner,investigation_id=investigation_id)["selectedObject"]}
    try: result,replayed=capture_service.capture(principal_id=owner,command=capture_command,trusted_rex_provenance=provenance)
    except WebDiscoveryAlreadyCaptured as error: raise RexApiError(error.code,str(error),409) from error
    except WebDiscoveryRuntimeError as error: raise RexApiError(error.code,str(error),error.status_code) from error
    return JSONResponse(status_code=200 if replayed else 201,content=result.model_dump(mode="json",exclude_none=False))

def _price_unavailable_reason(envelope):
    if not isinstance(envelope,dict): return "Price envelope is unavailable."
    reasons=[]
    if envelope.get("status")!="AVAILABLE": reasons.append(f"price status is {envelope.get('status','UNAVAILABLE')}")
    for key,label in (("providerComponent","provider component"),("iseesMargin","iSEES margin"),("maximumCustomerPrice","maximum customer price")):
        value=envelope.get(key)
        if not isinstance(value,dict) or value.get("status")!="AVAILABLE" or type(value.get("amountMicros")) is not int or value.get("amountMicros")<0 or value.get("currency")!="USD":
            state=value.get("status","UNAVAILABLE") if isinstance(value,dict) else value or "UNAVAILABLE"
            reasons.append(f"{label} is {state}")
    return None if not reasons else "Approval unavailable: "+"; ".join(reasons)+"."

@router.post("/proposals/{proposal_id}/approval")
def approve_proposal(investigation_id:IdentityPath,proposal_id:IdentityPath,command:ProposalApprovalCommand,owner=Depends(owned_mutation),svc=Depends(service),parent_repo=Depends(investigation_repository),settings:FreeRexSettings=Depends(free_rex_settings),discovery=Depends(web_discovery_runtime)):
    if command.proposalId!=proposal_id: raise RexApiError("REX_PROPOSAL_IDENTITY_MISMATCH","The approval does not identify the routed proposal",409)
    proposal=svc.repository.get_expansion_proposal(proposal_id,owner_subject_id=owner,investigation_id=investigation_id)
    revision=_operational_binding(parent_repo,owner,investigation_id,ExpansionProposalCommand(targetId=command.targetId,targetKind=command.targetKind,operationalRevisionId=command.operationalRevisionId,operationalRevisionHash=command.operationalRevisionHash,researcherQuestion="approval binding"))
    expected={"kind":command.targetKind.value,"id":command.targetId}
    if proposal.get("selectedObject")!=expected or proposal.get("revision")!={"id":revision.operational_revision_id,"hash":command.operationalRevisionHash}:
        raise RexApiError("REX_STALE_PROPOSAL","The proposal is not bound to the current selection and revision",409)
    request={"proposalId":proposal_id,"selectedObject":expected,"revision":proposal["revision"],"queries":command.approvedQueries,"limits":command.approvedLimits,"stopRules":command.approvedStopRules,"requestedResultLimit":command.requestedResultLimit,"researcherConfirmation":command.researcherConfirmation}
    if command.approvedQueries!=proposal["proposedQueryPlan"] or command.approvedLimits!=proposal["limits"] or command.approvedStopRules!=proposal["stopRules"]:
        raise RexApiError("REX_APPROVAL_SCOPE_MISMATCH","Approval must exactly confirm the current proposal queries, limits, and stop conditions",409)
    if not settings.enabled:
        raise RexApiError("REX_FREE_EXECUTION_DISABLED","Operator-funded REX execution is disabled",503)
    if (len(command.approvedQueries)>settings.maximum_queries
            or command.requestedResultLimit>settings.maximum_results_per_query
            or len(command.approvedQueries)*command.requestedResultLimit>MAX_ACQUIRED_SOURCES):
        raise RexApiError("REX_FREE_LIMIT_EXCEEDED","The requested work exceeds the server-controlled free entitlement",409)
    if getattr(discovery,"_runtime_status",None) is not WebDiscoveryRuntimeStatus.LIVE_WEB_DISCOVERY:
        raise RexApiError("REX_TAVILY_UNAVAILABLE","Live Tavily is not configured for operator-funded REX",503)
    request_hash=canonical_hash(request)
    now=svc.clock().isoformat().replace("+00:00","Z")
    aggregate_id,aggregate_hash=_manifold_binding(parent_repo,owner,investigation_id)
    identity=canonical_hash({"owner":owner,"investigation":investigation_id,"proposal":proposal_id,"request":request_hash}).removeprefix("sha256:")
    claim={"proposalId":proposal_id,"principalId":owner,"investigationId":investigation_id,"idempotencyKey":command.idempotencyKey,"assignmentId":f"rxta_{identity}","executionId":f"rxtx_{identity}","jobId":f"rxtj_{identity}","claimedAt":now}
    adapter=getattr(discovery,"_adapter",None)
    context={"schemaVersion":"rex-tavily-execution-context/v1","executionId":claim["executionId"],"jobId":claim["jobId"],"assignmentId":claim["assignmentId"],"proposalId":proposal_id,"ownerSubjectId":owner,"investigationId":investigation_id,"target":expected,"operationalRevision":proposal["revision"],"manifoldRevisionId":aggregate_id,"manifoldRevisionHash":aggregate_hash,"sourceAdapterIdentity":getattr(adapter,"adapter_id","tavily-search"),"sourceAdapterVersion":getattr(adapter,"adapter_version","unknown"),"providerIdentity":"Tavily Search","sourceAcquisition":"METADATA_ONLY","resultRetention":"SESSION_EPHEMERAL","queries":command.approvedQueries,"requestedResultLimit":command.requestedResultLimit,"customerCharge":"$0.00","providerUsageCoveredBy":"iSEES","createdAt":now}
    try:
        durable_claim,prior,replayed=svc.repository.reserve_tavily_proposal_execution(claim,request_hash=request_hash,context=context,maximum_account_jobs=settings.maximum_jobs_per_account,maximum_investigation_jobs=settings.maximum_jobs_per_investigation)
    except PermissionError as error: raise RexApiError("REX_FREE_LIMIT_EXCEEDED",str(error),409) from error
    except Exception as error:
        if error.__class__.__name__=="DuplicateImmutableIdentity": raise RexApiError("REX_APPROVAL_IDEMPOTENCY_CONFLICT","The approval idempotency key or proposal was already authorized",409) from error
        raise
    if replayed:
        authority={"authorizationId":durable_claim["execution_id"],"assignmentId":durable_claim["assignment_id"],"jobId":durable_claim["job_id"],"customerCharge":"$0.00","providerUsageCoveredBy":"iSEES"}
        if prior is None: return JSONResponse(status_code=202,content={"authorization":authority,"execution":{"executionStatus":"INDETERMINATE","customerCharge":"$0.00","candidateEvidence":[],"ephemeralLeads":[],"researchInboxEffect":"NONE","graphEffect":"NONE","manifoldEffect":"NONE"},"idempotencyDisposition":"REPLAYED"})
        return {"authorization":authority,"execution":prior,"idempotencyDisposition":"REPLAYED"}
    aggregate=parent_repo.get_empty_aggregate(investigation_id=investigation_id,owner_principal_id=owner)
    leads=[]; searches=[]; terminal="COMPLETED"; failure_code=None
    try:
        for index,query in enumerate(command.approvedQueries):
            search_id=f"{claim['executionId']}-q{index+1}"
            search_command=WebDiscoverySearchCommand.model_validate({"schemaVersion":"web-discovery-search/v1","investigationId":investigation_id,"expectedInvestigationRevision":aggregate.revision,"manifoldRevisionId":f"investigation-aggregate:{aggregate.revision}","searchSessionId":search_id,"operationId":search_id,"query":query,"selectedObjectContext":{"objectType":command.targetKind.value,"objectId":command.targetId,"objectRevision":command.operationalRevisionId},"resultLimit":command.requestedResultLimit,"idempotencyKey":search_id,"executionPolicy":{"metadataOnly":True,"aiAssistance":"NONE","rexExecution":"NONE","authorizedSpend":0}})
            search=discovery.search(principal_id=owner,command=search_command,timeout_seconds=settings.timeout_seconds)
            searches.append({"query":query,"status":search.response.status,"resultCount":search.response.resultCount})
            if search.response.status not in ("COMPLETED","ZERO_RESULTS"):
                terminal=search.response.status; break
            for result in search.response.results:
                leads.append({"searchSessionId":search.response.searchSessionId,
                    "expectedInvestigationRevision":search.response.expectedInvestigationRevision,
                    "manifoldRevisionId":search.response.manifoldRevisionId,
                    "resultId":result.resultId,"providerResultId":result.providerResultId,
                    "rank":result.rank,"title":result.title,"snippet":result.snippet,
                    "providerReturnedUrl":result.providerReturnedUrl,"sourceUrl":result.normalizedUrl,
                    "displayUrl":result.displayUrl,"displayDomain":result.displayDomain,
                    "mediaType":result.mediaType,"attribution":result.attribution,
                    "retentionRestrictions":result.retentionRestrictions,
                    "providerMetadata":result.providerMetadata,
                    "acquisitionLabel":"METADATA_ONLY - EPHEMERAL LEAD; SOURCE PAGE NOT ACQUIRED OR INSPECTED"})
    except Exception as error:
        terminal="FAILED"; failure_code=error.__class__.__name__
    completed=svc.clock().isoformat().replace("+00:00","Z")
    receipt={"schemaVersion":"rex-tavily-execution-receipt/v1","executionId":claim["executionId"],"jobId":claim["jobId"],"assignmentId":claim["assignmentId"],"proposalId":proposal_id,"source":{"adapterId":context["sourceAdapterIdentity"],"adapterVersion":context["sourceAdapterVersion"],"providerIdentity":"Tavily Search","acquisition":"METADATA_ONLY","retention":"SESSION_EPHEMERAL"},"executionStatus":terminal,"failureCode":failure_code,"customerCharge":"$0.00","providerUsageCoveredBy":"iSEES","providerPrice":"NOT_DISCLOSED","queriesAttempted":searches,"candidateEvidence":[],"ephemeralLeads":leads,"candidateEvidenceEffect":"NONE","researchInboxEffect":"NONE","graphEffect":"NONE","canonEffect":"NONE","manifoldEffect":"NONE","sourceAcquisition":"METADATA_ONLY","completedAt":completed}
    svc.repository.complete_proposal_execution(claim["executionId"],receipt)
    authority={"authorizationId":claim["executionId"],"assignmentId":claim["assignmentId"],"jobId":claim["jobId"],"customerCharge":"$0.00","providerUsageCoveredBy":"iSEES"}
    return JSONResponse(status_code=200 if terminal=="COMPLETED" else 202 if terminal=="INDETERMINATE" else 502,content={"authorization":authority,"execution":receipt,"idempotencyDisposition":"CREATED"})


def _assignment(value,replayed,manifold_revision_id,manifold_revision_hash):
    return {"assignmentId":str(value.assignment_id),"investigationId":value.investigation_id,
        "targetId":value.target_id,"targetKind":value.target_kind.value,"lifecycle":value.lifecycle.value,
        "currentRevisionId":str(value.revision_id),"createdAt":value.created_at,"updatedAt":value.effective_at,
        "idempotencyDisposition":"REPLAYED" if replayed else "CREATED",
        "manifoldRevisionId":manifold_revision_id,"manifoldRevisionHash":manifold_revision_hash}

@router.post("/assignments",status_code=201)
def create_assignment(investigation_id:IdentityPath,command:AssignmentCommand,owner=Depends(owned_mutation),svc=Depends(service),parent_repo=Depends(investigation_repository)):
    value,replayed=svc.assignment(subject_id=owner,investigation_id=investigation_id,target_id=command.targetId,target_kind=command.targetKind,objective=command.objective)
    revision_id,revision_hash=_manifold_binding(parent_repo,owner,investigation_id)
    return JSONResponse(status_code=200 if replayed else 201,content=AssignmentResponse(**_assignment(value,replayed,revision_id,revision_hash)).model_dump(mode="json"))

class AssignmentResponse(BaseModel):
    assignmentId:str; investigationId:str; targetId:str; targetKind:str; lifecycle:str
    currentRevisionId:str; createdAt:datetime; updatedAt:datetime; idempotencyDisposition:str
    manifoldRevisionId:str; manifoldRevisionHash:str

@router.post("/execution-preparations")
def prepare(investigation_id:IdentityPath,command:PreparationCommand,owner=Depends(owned_mutation),svc=Depends(service)):
    value,disposition=svc.prepare(subject_id=owner,investigation_id=investigation_id,assignment_id=command.assignmentId,manifold_revision_id=command.manifoldRevisionId,manifold_revision_hash=command.manifoldRevisionHash)
    return {"executionId":value.execution_id,"jobId":None if disposition=="SUPPRESSED_DUPLICATE" else svc.repository.job_id_for_execution(value.execution_id),
        "disposition":disposition,"semanticDuplicateStatus":"SUPPRESSED" if disposition=="SUPPRESSED_DUPLICATE" else "UNIQUE",
        "originalExecutionId":value.execution_id if disposition=="SUPPRESSED_DUPLICATE" else None,
        "authorizationDisposition":"ALLOW","estimatedMicros":0,"reservedMicros":0,"executionStatus":value.status.value}

@router.post("/jobs/{job_id}/executions")
def execute(investigation_id:IdentityPath,job_id:IdentityPath,owner=Depends(owned_mutation),svc=Depends(service)):
    receipt=svc.execute(subject_id=owner,investigation_id=investigation_id,job_id=job_id)
    return {"receipt":_receipt(receipt),"terminalStatus":receipt.terminal_execution_status,"receiptContentHash":receipt.content_hash}

def _receipt(value):
    if isinstance(value,dict): return value
    raw=asdict(value)
    return {"executionId":raw["execution_id"],"jobId":raw["job_id"],"assignmentId":raw["assignment_id"],
        "assignmentRevisionId":raw["assignment_revision_id"],"manifoldRevisionId":raw["manifold_revision_id"],
        "manifoldRevisionHash":raw["manifold_revision_hash"],"sourceAdapterIdentity":raw["source_adapter_identity"],
        "sourceAdapterVersion":raw["source_adapter_version"],"normalizerIdentity":raw["normalizer_identity"],
        "normalizerVersion":raw["normalizer_version"],"candidateBundleId":raw["candidate_bundle_id"],
        "candidateContentHash":raw["candidate_content_hash"],"sourceContentHash":raw["source_content_hash"],
        "aiAssistanceStatus":raw["ai_assistance_status"],"providerIdentity":raw["provider_identity"],
        "modelIdentity":raw["model_identity"],"estimatedMicros":raw["estimated_micros"],
        "reservedMicros":raw["reserved_micros"],"actualMicros":raw["actual_micros"],
        "chargedMicros":raw["charged_micros"],"releasedMicros":raw["released_micros"],
        "terminalExecutionStatus":raw["terminal_execution_status"],"completedAt":raw["completed_at"],"contentHash":raw["content_hash"]}

@router.get("/executions/{execution_id}/receipt")
def receipt(investigation_id:IdentityPath,execution_id:IdentityPath,owner=Depends(owned_read),svc=Depends(service)):
    return _receipt(svc.receipt(subject_id=owner,investigation_id=investigation_id,execution_id=execution_id))

@router.get("/candidate-bundles/{bundle_id}")
def bundle(investigation_id:IdentityPath,bundle_id:IdentityPath,owner=Depends(owned_read),svc=Depends(service)):
    value=svc.bundle(subject_id=owner,investigation_id=investigation_id,bundle_id=bundle_id)
    return _bundle(value)

def _bundle(value):
    return {"candidateBundleId":str(value.bundle_id),"investigationId":value.manifold_revision.investigation_id,
        "assignmentRevisionId":str(value.assignment_revision_id),"executionId":str(value.execution_id),
        "manifoldRevisionId":value.manifold_revision.revision_id,"manifoldRevisionHash":value.manifold_revision.revision_hash,
        "sourceLocator":value.source_locator,"sourceVersion":value.source_version,
        "sourceClassification":value.source_document.source_class.value,
        "adapterIdentity":value.adapter_identity,"adapterVersion":value.adapter_version,
        "normalizerIdentity":value.normalizer_identity,"normalizerVersion":value.normalizer_version,
        "sourceContentHash":value.source_content_hash,"candidateContentHash":value.content_hash,
        "candidateClassification":"CANDIDATE_KNOWLEDGE","reviewStatus":"RESEARCHER_REVIEW_REQUIRED","canonEffect":"NONE",
        "aiAssistanceStatus":value.ai_assistance_status.value,"providerIdentity":value.provider_identity,"modelIdentity":value.model_identity,
        "modelClass":value.model_class.value,
        "nodes":[{"candidateId":n.candidate_id,"kind":n.kind,"label":n.label,"claim":n.claim,
            "candidateContentHash":canonical_hash({"candidateId":n.candidate_id,"kind":n.kind,"label":n.label,"claim":n.claim})} for n in value.candidates],"edges":[],
        "fieldLineage":[{"candidateId":line.candidate_id,"sourceLocator":line.source_locator,"sourceVersion":line.source_version,
            "fields":[{"candidateField":f.candidate_field,"sourceField":f.source_field,"exactValue":f.exact_value,"normalizationRule":f.normalization_rule} for f in line.fields]} for line in value.lineage]}

@router.get("/completed-discoveries")
def completed_discoveries(investigation_id:IdentityPath,owner=Depends(owned_read),svc=Depends(service)):
    return {"discoveries":[{"selectedSource":{"kind":assignment.target_kind.value,"identity":assignment.target_id},
        "assignmentId":str(assignment.assignment_id),"receipt":_receipt(receipt),"bundle":_bundle(bundle)}
        for assignment,receipt,bundle in svc.completed_discoveries(subject_id=owner,investigation_id=investigation_id)]}

def rex_error_handler(request:Request,error:Exception):
    request_id=request.headers.get("X-Request-Id") or str(uuid.uuid4())
    if isinstance(error,RexApiError): status,code,message=error.status_code,error.code,str(error)
    elif error.__class__.__name__ in {"RecordNotFound","JobUnavailable"}: status,code,message=404,"REX_NOT_FOUND","REX resource was not found"
    elif error.__class__.__name__ in {"DuplicateSuppressed"}: status,code,message=409,"REX_DUPLICATE_SUPPRESSED","Semantic duplicate execution was suppressed"
    elif error.__class__.__name__ in {"AuthorizationDenied"}: status,code,message=403,"REX_AUTHORIZATION_DENIED","REX execution was denied"
    elif error.__class__.__name__ in {"BudgetExceeded"}: status,code,message=409,"REX_BUDGET_EXCEEDED","REX budget was exceeded"
    elif error.__class__.__name__ in {"CircuitBreakerOpen"}: status,code,message=503,"REX_CIRCUIT_BREAKER_OPEN","REX execution is unavailable"
    elif isinstance(error,RexExecutionError): status,code,message=422,error.category,"REX execution failed"
    else: status,code,message=503,"REX_REPOSITORY_UNAVAILABLE","REX repository is unavailable"
    return JSONResponse(status_code=status,content={"error":{"code":code,"message":message,"requestId":request_id}},headers={"X-Request-Id":request_id})
