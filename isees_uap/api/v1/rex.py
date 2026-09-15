from __future__ import annotations

import uuid
from dataclasses import asdict
from functools import lru_cache
from datetime import datetime
from typing import Annotated

from fastapi import APIRouter, Depends, Path, Request
from fastapi.responses import JSONResponse
from pydantic import BaseModel, ConfigDict, Field

from isees_uap.api.v1.investigations import repository as investigation_repository
from isees_uap.authentication.principal import AuthenticatedPrincipal, require_authenticated_principal, require_csrf_protected_principal
from isees_uap.investigations.authority import PersistedInvestigationAuthority
from isees_uap.rex.application import RexApiApplicationService
from isees_uap.persistence import database_path
from isees_uap.rex.contracts import TargetKind
from isees_uap.rex.errors import RexExecutionError, RexRepositoryError
from isees_uap.rex.sqlite_repository import SQLiteRexRepository

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

def _assignment(value,replayed):
    return {"assignmentId":str(value.assignment_id),"investigationId":value.investigation_id,
        "targetId":value.target_id,"targetKind":value.target_kind.value,"lifecycle":value.lifecycle.value,
        "currentRevisionId":str(value.revision_id),"createdAt":value.created_at,"updatedAt":value.effective_at,
        "idempotencyDisposition":"REPLAYED" if replayed else "CREATED"}

@router.post("/assignments",status_code=201)
def create_assignment(investigation_id:IdentityPath,command:AssignmentCommand,owner=Depends(owned_mutation),svc=Depends(service)):
    value,replayed=svc.assignment(subject_id=owner,investigation_id=investigation_id,target_id=command.targetId,target_kind=command.targetKind,objective=command.objective)
    return JSONResponse(status_code=200 if replayed else 201,content=AssignmentResponse(**_assignment(value,replayed)).model_dump(mode="json"))

class AssignmentResponse(BaseModel):
    assignmentId:str; investigationId:str; targetId:str; targetKind:str; lifecycle:str
    currentRevisionId:str; createdAt:datetime; updatedAt:datetime; idempotencyDisposition:str

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
    return {"candidateBundleId":str(value.bundle_id),"sourceContentHash":value.source_content_hash,"candidateContentHash":value.content_hash,
        "candidateClassification":"CANDIDATE_KNOWLEDGE","reviewStatus":"RESEARCHER_REVIEW_REQUIRED","canonEffect":"NONE",
        "aiAssistanceStatus":value.ai_assistance_status.value,"providerIdentity":value.provider_identity,"modelIdentity":value.model_identity,
        "nodes":[{"candidateId":n.candidate_id,"kind":n.kind,"label":n.label,"claim":n.claim} for n in value.candidates],"edges":[],
        "fieldLineage":[{"candidateId":line.candidate_id,"sourceLocator":line.source_locator,"sourceVersion":line.source_version,
            "fields":[{"candidateField":f.candidate_field,"sourceField":f.source_field,"exactValue":f.exact_value,"normalizationRule":f.normalization_rule} for f in line.fields]} for line in value.lineage]}

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
