from __future__ import annotations

import socket
import sqlite3
from concurrent.futures import ThreadPoolExecutor
from datetime import datetime, timezone

import pytest
from fastapi.testclient import TestClient

from isees_uap.api import create_application
from isees_uap.api.v1.authentication import settings
from isees_uap.api.v1.investigations import repository as investigation_repository
from isees_uap.api.v1.rex import repository as rex_repository, service as rex_service
from isees_uap.authentication.config import AuthenticationSettings
from isees_uap.authentication.principal import authentication_repository
from isees_uap.authentication.sqlite_repository import SQLiteAuthenticationRepository
from isees_uap.investigations.sqlite_repository import SQLiteInvestigationRepository
from isees_uap.rex.application import RexApiApplicationService
from isees_uap.rex.fixture import FixtureCandidateNormalizer, LocalFixtureSourceAdapter
from isees_uap.rex.sqlite_repository import SQLiteRexRepository

HASH="sha256:"+"a"*64

class CountingAdapter(LocalFixtureSourceAdapter):
    def __init__(self): self.calls=0
    def retrieve(self,request): self.calls+=1; return super().retrieve(request)

class CountingNormalizer(FixtureCandidateNormalizer):
    def __init__(self): self.calls=0
    def normalize(self,request): self.calls+=1; return super().normalize(request)

@pytest.fixture
def api(tmp_path):
    auth=SQLiteAuthenticationRepository(tmp_path/"auth.sqlite3")
    investigations=SQLiteInvestigationRepository(tmp_path/"investigations.sqlite3")
    rex=SQLiteRexRepository(tmp_path/"rex.sqlite3")
    adapter,normalizer=CountingAdapter(),CountingNormalizer()
    svc=RexApiApplicationService(rex,adapter=adapter,normalizer=normalizer)
    app=create_application({"ISEES_AUTH_ENV":"test","ISEES_STUDIO_V1_ENABLED":"false"},frontend_directory=tmp_path/"missing")
    app.dependency_overrides.update({authentication_repository:lambda:auth,settings:lambda:AuthenticationSettings(database_path=auth.path,secure_cookies=False,session_ttl_seconds=3600),investigation_repository:lambda:investigations,rex_repository:lambda:rex,rex_service:lambda:svc})
    with TestClient(app) as client:
        response=client.post("/api/v1/auth/accounts",json={"email":"owner@example.test","password":"correct horse battery staple"})
        owner=response.json()["researcherId"]; investigations.create(investigation_id="i1",owner_principal_id=owner,title="Owned")
        yield client,rex,adapter,normalizer,owner

def csrf(client): return {"X-ISEES-CSRF":client.cookies.get("isees_csrf")}
def assign(client): return client.post("/api/v1/investigations/i1/rex/assignments",headers=csrf(client),json={"targetId":"node-1","targetKind":"NODE","objective":"Inspect fixture evidence."})
def prepare(client,assignment): return client.post("/api/v1/investigations/i1/rex/execution-preparations",headers=csrf(client),json={"assignmentId":assignment,"manifoldRevisionId":"revision-1","manifoldRevisionHash":HASH})
def workflow(client):
    assignment=assign(client).json()["assignmentId"]; prepared=prepare(client,assignment).json()
    executed=client.post(f"/api/v1/investigations/i1/rex/jobs/{prepared['jobId']}/executions",headers=csrf(client)).json()
    return assignment,prepared,executed

def test_authenticated_assignment_creation_and_server_identity(api):
    response=assign(api[0]); body=response.json()
    assert response.status_code==201 and body["assignmentId"].startswith("rxa_") and body["lifecycle"]=="SLEEPING"

def test_assignment_idempotency(api):
    first=assign(api[0]); second=assign(api[0])
    assert second.status_code==200 and first.json()["assignmentId"]==second.json()["assignmentId"] and second.json()["idempotencyDisposition"]=="REPLAYED"

def test_owned_preparation_is_zero_cost_and_durable(api):
    body=prepare(api[0],assign(api[0]).json()["assignmentId"]).json()
    assert body["disposition"]=="EXECUTABLE" and body["estimatedMicros"]==body["reservedMicros"]==0
    with sqlite3.connect(api[1].path) as db: assert db.execute("select count(*) from rex_budget_reservations").fetchone()[0]==6

def test_explicit_execution_receipt_and_candidate_reads(api):
    _,prepared,executed=workflow(api[0]); receipt=executed["receipt"]
    got=api[0].get(f"/api/v1/investigations/i1/rex/executions/{prepared['executionId']}/receipt")
    bundle=api[0].get(f"/api/v1/investigations/i1/rex/candidate-bundles/{receipt['candidateBundleId']}")
    assert executed["terminalStatus"]=="COMPLETED" and got.json()["contentHash"]==executed["receiptContentHash"]
    assert [f["candidateField"] for f in bundle.json()["fieldLineage"][0]["fields"]]==["kind","label","claim"]

def test_candidate_is_quarantined_and_ai_free(api):
    _,_,executed=workflow(api[0]); bid=executed["receipt"]["candidateBundleId"]
    body=api[0].get(f"/api/v1/investigations/i1/rex/candidate-bundles/{bid}").json()
    assert (body["candidateClassification"],body["reviewStatus"],body["canonEffect"],body["aiAssistanceStatus"],body["providerIdentity"],body["modelIdentity"])==("CANDIDATE_KNOWLEDGE","RESEARCHER_REVIEW_REQUIRED","NONE","NONE","NONE","NONE")

def test_completed_discovery_read_restores_stable_target_aware_bundle_without_execution(api):
    client,_,adapter,normalizer=api[:4]
    assignment,_,executed=workflow(client)
    before=(adapter.calls,normalizer.calls)
    first=client.get("/api/v1/investigations/i1/rex/completed-discoveries")
    second=client.get("/api/v1/investigations/i1/rex/completed-discoveries")
    assert first.status_code==second.status_code==200
    assert first.json()==second.json()
    discoveries=first.json()["discoveries"]
    assert len(discoveries)==1
    restored=discoveries[0]
    assert restored["assignmentId"]==assignment
    assert restored["selectedSource"]=={"kind":"NODE","identity":"node-1"}
    assert restored["receipt"]["executionId"]==executed["receipt"]["executionId"]
    assert restored["bundle"]["nodes"][0]["label"]=="Reported blue indicator"
    assert (restored["bundle"]["reviewStatus"],restored["bundle"]["canonEffect"])==("RESEARCHER_REVIEW_REQUIRED","NONE")
    assert (adapter.calls,normalizer.calls)==before,"hydration reads must never execute adapters"
    with sqlite3.connect(api[1].path) as db:
        assert db.execute("select count(*) from rex_search_executions where disposition='EXECUTABLE'").fetchone()[0]==1
        assert db.execute("select count(*) from rex_candidate_bundles").fetchone()[0]==1

def test_completed_discovery_read_is_investigation_scoped(api):
    client,_,_,_,owner=api
    workflow(client)
    dependency=client.app.dependency_overrides[investigation_repository]()
    dependency.create(investigation_id="i2",owner_principal_id=owner,title="Other owned investigation")
    response=client.get("/api/v1/investigations/i2/rex/completed-discoveries")
    assert response.status_code==200 and response.json()=={"discoveries":[]}

@pytest.mark.parametrize("route",["assign","prepare","execute"])
def test_missing_csrf_performs_no_rex_mutation(api,route):
    client,repo=api[0],api[1]
    if route=="assign": response=client.post("/api/v1/investigations/i1/rex/assignments",json={"targetId":"n","targetKind":"NODE","objective":"x"})
    else:
        assignment=assign(client).json()["assignmentId"]
        if route=="prepare": response=client.post("/api/v1/investigations/i1/rex/execution-preparations",json={"assignmentId":assignment,"manifoldRevisionId":"r","manifoldRevisionHash":HASH})
        else:
            job=prepare(client,assignment).json()["jobId"]; response=client.post(f"/api/v1/investigations/i1/rex/jobs/{job}/executions")
    assert response.status_code==403

def test_invalid_csrf_rejected(api):
    response=api[0].post("/api/v1/investigations/i1/rex/assignments",headers={"X-ISEES-CSRF":"invalid"},json={"targetId":"n","targetKind":"NODE","objective":"x"})
    assert response.status_code==403 and response.json()["error"]["code"]=="CSRF_REJECTED"

def test_unauthenticated_and_guest_rejected(tmp_path):
    app=create_application({"ISEES_AUTH_ENV":"test","ISEES_STUDIO_V1_ENABLED":"false"},frontend_directory=tmp_path/"none")
    with TestClient(app) as client:
        response=client.post("/api/v1/investigations/i1/rex/assignments",json={"targetId":"n","targetKind":"NODE","objective":"x"})
    assert response.status_code==401 and response.json()["error"]["code"]=="AUTHENTICATION_REQUIRED"

    with TestClient(app) as client:
        restored=client.get("/api/v1/investigations/i1/rex/completed-discoveries")
    assert restored.status_code==401 and restored.json()["error"]["code"]=="AUTHENTICATION_REQUIRED"

@pytest.mark.parametrize("resource",["assignment","preparation","execution","receipt","bundle","discoveries"])
def test_cross_user_access_is_non_enumerating(api,resource):
    client=api[0]; assignment,prepared,executed=workflow(client); bundle=executed["receipt"]["candidateBundleId"]
    client.post("/api/v1/auth/accounts",json={"email":"other@example.test","password":"correct horse battery staple"})
    if resource=="assignment": response=client.post("/api/v1/investigations/i1/rex/assignments",headers=csrf(client),json={"targetId":"n","targetKind":"NODE","objective":"x"})
    elif resource=="preparation": response=prepare(client,assignment)
    elif resource=="execution": response=client.post(f"/api/v1/investigations/i1/rex/jobs/{prepared['jobId']}/executions",headers=csrf(client))
    elif resource=="receipt": response=client.get(f"/api/v1/investigations/i1/rex/executions/{prepared['executionId']}/receipt")
    elif resource=="bundle": response=client.get(f"/api/v1/investigations/i1/rex/candidate-bundles/{bundle}")
    else: response=client.get("/api/v1/investigations/i1/rex/completed-discoveries")
    assert response.status_code==404 and response.json()["error"]["code"]=="INVESTIGATION_NOT_FOUND"

@pytest.mark.parametrize("resource",["investigation","assignment","execution","job","bundle"])
def test_unknown_resources_are_sanitized(api,resource):
    client=api[0]
    if resource=="investigation": response=client.post("/api/v1/investigations/missing/rex/assignments",headers=csrf(client),json={"targetId":"n","targetKind":"NODE","objective":"x"})
    elif resource=="assignment": response=prepare(client,"missing")
    elif resource=="execution": response=client.get("/api/v1/investigations/i1/rex/executions/missing/receipt")
    elif resource=="job": response=client.post("/api/v1/investigations/i1/rex/jobs/missing/executions",headers=csrf(client))
    else: response=client.get("/api/v1/investigations/i1/rex/candidate-bundles/missing")
    assert response.status_code==404 and "sqlite" not in response.text.lower()

def test_sequential_duplicate_preparation_returns_original(api):
    assignment=assign(api[0]).json()["assignmentId"]; first=prepare(api[0],assignment).json(); second=prepare(api[0],assignment).json()
    assert second["disposition"]=="SUPPRESSED_DUPLICATE" and second["originalExecutionId"]==first["executionId"]

def test_concurrent_duplicate_preparation_creates_one_job(api):
    client,repo=api[0],api[1]; assignment=assign(client).json()["assignmentId"]
    with ThreadPoolExecutor(max_workers=2) as pool: bodies=list(pool.map(lambda _:prepare(client,assignment).json(),(1,2)))
    assert sorted(body["disposition"] for body in bodies)==["EXECUTABLE","SUPPRESSED_DUPLICATE"]
    with sqlite3.connect(repo.path) as db: assert db.execute("select count(*) from rex_jobs").fetchone()[0]==1

def test_concurrent_execution_invokes_ports_once_and_replay_denied(api):
    client,_,adapter,normalizer=api[:4]
    assignment=assign(client).json()["assignmentId"]; prepared=prepare(client,assignment).json()
    def run(_): return client.post(f"/api/v1/investigations/i1/rex/jobs/{prepared['jobId']}/executions",headers=csrf(client)).status_code
    with ThreadPoolExecutor(max_workers=2) as pool: statuses=list(pool.map(run,(1,2)))
    assert sorted(statuses)==[200,404] and adapter.calls==normalizer.calls==1

def test_client_overrides_and_nonfixture_fields_are_rejected(api):
    payload={"targetId":"n","targetKind":"NODE","objective":"x","ownerSubjectId":"attacker","adapter":"google"}
    response=api[0].post("/api/v1/investigations/i1/rex/assignments",headers=csrf(api[0]),json=payload)
    assert response.status_code==422

def test_no_network_canon_or_research_publication(api,monkeypatch):
    monkeypatch.setattr(socket,"create_connection",lambda *a,**k: (_ for _ in ()).throw(AssertionError("network")))
    workflow(api[0])
    with sqlite3.connect(api[1].path) as db:
        assert db.execute("select count(*) from rex_research_publications").fetchone()[0]==0
        assert not any("canon" in row[0].lower() for row in db.execute("select name from sqlite_master where type='table'"))

def test_openapi_contains_exact_rex_surface(api):
    paths={p for p in api[0].get("/openapi.json").json()["paths"] if "/rex" in p}
    assert paths=={"/api/v1/investigations/{investigation_id}/rex/assignments","/api/v1/investigations/{investigation_id}/rex/execution-preparations","/api/v1/investigations/{investigation_id}/rex/jobs/{job_id}/executions","/api/v1/investigations/{investigation_id}/rex/executions/{execution_id}/receipt","/api/v1/investigations/{investigation_id}/rex/candidate-bundles/{bundle_id}","/api/v1/investigations/{investigation_id}/rex/completed-discoveries"}
