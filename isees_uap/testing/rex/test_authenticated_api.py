from __future__ import annotations

import socket
import sqlite3
import hashlib
import json
import time
from concurrent.futures import ThreadPoolExecutor
from datetime import datetime, timezone

import pytest
from fastapi.testclient import TestClient

from isees_uap.api import create_application
from isees_uap.api.v1.authentication import settings
from isees_uap.api.v1.investigations import repository as investigation_repository
from isees_uap.api.v1.rex import repository as rex_repository, service as rex_service
from isees_uap.api.v1.rex import free_rex_settings
from isees_uap.api.v1.candidate_evidence import repository as candidate_repository, web_discovery_runtime, web_discovery_capture_service
from isees_uap.authentication.config import AuthenticationSettings
from isees_uap.authentication.principal import authentication_repository
from isees_uap.authentication.sqlite_repository import SQLiteAuthenticationRepository
from isees_uap.investigations.sqlite_repository import SQLiteInvestigationRepository
from isees_uap.investigations.models import OperationalGraphRevision
from isees_uap.investigations.sqlite_repository import operational_graph_fingerprint
from isees_uap.rex.application import RexApiApplicationService
from isees_uap.rex.fixture import FixtureCandidateNormalizer, LocalFixtureSourceAdapter
from isees_uap.rex.expansion_planner import ExpansionPlanUnavailable, build_expansion_plan
from isees_uap.rex.errors import ContentHashMismatch
from isees_uap.rex.sqlite_repository import SQLiteRexRepository
from isees_uap.rex.free_execution import FreeRexSettings
from isees_uap.candidate_evidence.sqlite_repository import SQLiteCandidateEvidenceRepository
from isees_uap.candidate_evidence.service import CandidateEvidenceService
from isees_uap.candidate_evidence.web_discovery_runtime import WebDiscoverySearchRuntime
from isees_uap.candidate_evidence.web_discovery_fixture import DeterministicWebDiscoveryFixture
from isees_uap.candidate_evidence.web_discovery_providers import WebDiscoveryRuntimeStatus, _UnavailableAdapter
from isees_uap.candidate_evidence.web_discovery import Cancellation
from isees_uap.candidate_evidence.web_discovery_capture import WebDiscoveryCaptureService
from isees_uap.research_sources import SQLiteResearchSourceRepository

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
        graph={"nodes":[{"id":"node-1","label":"Selected","type":"ENTITY"},{"id":"node-2","label":"Other","type":"ENTITY"}],"edges":[{"id":"edge-1","source":"node-1","target":"node-2","relationship":"RELATED","weight":1,"rationale":[]}]}
        fingerprint=operational_graph_fingerprint(graph)
        revision=OperationalGraphRevision("i1","revision-1",1,None,graph,fingerprint,"investigation-operational-graph/v1","test/v1","TEST",datetime.now(timezone.utc),"TEST_BASELINE")
        investigations.append_operational_revision_owned(investigation_id="i1",owner_principal_id=owner,expected_operational_head_id=None,revision=revision,aggregate_payload={"graph":graph},expected_aggregate_revision=0)
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

def proposal_payload(api,target_id="node-1",revision_id="revision-1",revision_hash=None):
    parent=api[0].app.dependency_overrides[investigation_repository]()
    current=parent.get_current_operational_revision(investigation_id="i1",owner_principal_id=api[4])
    current_hash="sha256:"+hashlib.sha256(current.graph_fingerprint.encode("utf-8")).hexdigest()
    return {"targetId":target_id,"targetKind":"NODE","operationalRevisionId":revision_id,"operationalRevisionHash":revision_hash or current_hash,"researcherQuestion":"What evidence could challenge this node?","researcherNotes":"Preserve contradictions."}

def approval_payload(proposal, key="approval-key-0001"):
    return {"proposalId":proposal["proposalId"],"targetId":proposal["selectedObject"]["id"],"targetKind":proposal["selectedObject"]["kind"],"operationalRevisionId":proposal["revision"]["id"],"operationalRevisionHash":proposal["revision"]["hash"],"idempotencyKey":key,"researcherConfirmation":True,"approvedQueries":proposal["proposedQueryPlan"],"approvedLimits":proposal["limits"],"approvedStopRules":proposal["stopRules"],"requestedResultLimit":2}

def approve(client, proposal, key="approval-key-0001"):
    return client.post(f"/api/v1/investigations/i1/rex/proposals/{proposal['proposalId']}/approval",headers=csrf(client),json=approval_payload(proposal,key))

def test_proposal_is_owned_idempotent_and_inspectable(api):
    first=api[0].post("/api/v1/investigations/i1/rex/proposals",headers=csrf(api[0]),json=proposal_payload(api))
    second=api[0].post("/api/v1/investigations/i1/rex/proposals",headers=csrf(api[0]),json=proposal_payload(api))
    assert first.status_code==201 and second.status_code==200
    assert first.json()["proposalId"]==second.json()["proposalId"] and second.json()["idempotencyDisposition"]=="REPLAYED"
    plan=first.json()["plan"]
    assert plan["plannerVersion"]=="rex-expansion-proposal-planner/v1"
    assert plan["profile"]=={"id":"GENERAL_NODE","version":"rex-general-selection-profile/v1"}
    assert plan["objectivePacks"]==[{"id":"GENERAL_EVIDENCE","version":"rex-general-evidence-objectives/v1"}]
    assert first.json()["researcherQuestion"] in plan["queryGuidance"]
    assert first.json()["researcherNotesRole"]=="GUIDANCE_ONLY"
    assert plan["queryGuidance"]==first.json()["proposedQueryPlan"]
    assert plan["limits"]==first.json()["limits"] and plan["stopRules"]==first.json()["stopRules"]
    inspected=api[0].get(f"/api/v1/investigations/i1/rex/proposals/{first.json()['proposalId']}")
    assert inspected.status_code==200 and inspected.json()["effects"]["manifold"]=="NONE"
    assert inspected.json()["plan"]==plan

def test_proposal_rejects_browser_authored_planning_policy(api):
    payload=proposal_payload(api)|{"proposedQueries":["attacker query"],"limits":["unbounded"],"stopRules":["never"]}
    response=api[0].post("/api/v1/investigations/i1/rex/proposals",headers=csrf(api[0]),json=payload)
    assert response.status_code==422

def test_planner_returns_unavailable_instead_of_fabricating_from_unlabelled_selection():
    with pytest.raises(ExpansionPlanUnavailable,match="no governed label"):
        build_expansion_plan(graph={"nodes":[{"id":"unlabelled","type":"ENTITY"}],"edges":[]},target_kind="NODE",target_id="unlabelled",researcher_question="What happened?")

def test_same_governed_node_produces_bounded_question_specific_queries():
    graph={"nodes":[{"id":"princeton","label":"USS Princeton","type":"VESSEL"}],"edges":[]}
    radar="What publicly available primary-source records describe the USS Princeton radar observations during the 2004 Nimitz Tic Tac encounter?"
    maintenance="Which public records describe USS Princeton maintenance in 2004?"
    radar_plan=build_expansion_plan(graph=graph,target_kind="NODE",target_id="princeton",researcher_question=radar).as_dict()
    maintenance_plan=build_expansion_plan(graph=graph,target_kind="NODE",target_id="princeton",researcher_question=maintenance).as_dict()
    assert radar_plan["queryGuidance"]!=maintenance_plan["queryGuidance"]
    assert radar in radar_plan["queryGuidance"]
    assert all(radar in query for query in radar_plan["queryGuidance"])
    assert 1<=len(radar_plan["queryGuidance"])<=4
    assert all(1<=len(query)<=2000 for query in radar_plan["queryGuidance"])

def test_proposal_inspection_is_owner_scoped(api):
    created=api[0].post("/api/v1/investigations/i1/rex/proposals",headers=csrf(api[0]),json=proposal_payload(api)).json()
    api[0].post("/api/v1/auth/accounts",json={"email":"proposal-other@example.test","password":"correct horse battery staple"})
    response=api[0].get(f"/api/v1/investigations/i1/rex/proposals/{created['proposalId']}")
    assert response.status_code==404 and response.json()["error"]["code"]=="INVESTIGATION_NOT_FOUND"

def test_proposal_restoration_rejects_payload_integrity_failure(api):
    created=api[0].post("/api/v1/investigations/i1/rex/proposals",headers=csrf(api[0]),json=proposal_payload(api)).json()
    with sqlite3.connect(api[1].path) as db:
        db.execute("drop trigger rex_no_proposal_update")
        db.execute("update rex_expansion_proposals set content_hash=? where proposal_id=?",("sha256:"+"0"*64,created["proposalId"]))
    with pytest.raises(ContentHashMismatch):
        api[1].get_expansion_proposal(created["proposalId"],owner_subject_id=api[4],investigation_id="i1")

def test_unauthenticated_proposal_creation_is_rejected(api):
    api[0].post("/api/v1/auth/logout",headers=csrf(api[0]))
    response=api[0].post("/api/v1/investigations/i1/rex/proposals",json=proposal_payload(api))
    assert response.status_code==401 and response.json()["error"]["code"]=="AUTHENTICATION_REQUIRED"

@pytest.mark.parametrize("field,value,code",[("operationalRevisionId","stale","REX_STALE_REVISION"),("targetId","missing","REX_STALE_SELECTION")])
def test_proposal_rejects_stale_revision_or_selection(api,field,value,code):
    payload=proposal_payload(api); payload[field]=value
    response=api[0].post("/api/v1/investigations/i1/rex/proposals",headers=csrf(api[0]),json=payload)
    assert response.status_code==409 and response.json()["error"]["code"]==code

def test_proposal_has_zero_downstream_effects(api,monkeypatch):
    monkeypatch.setattr(socket,"create_connection",lambda *a,**k: (_ for _ in ()).throw(AssertionError("network")))
    before=api[0].app.dependency_overrides[investigation_repository]().get_current_operational_revision(investigation_id="i1",owner_principal_id=api[4])
    response=api[0].post("/api/v1/investigations/i1/rex/proposals",headers=csrf(api[0]),json=proposal_payload(api))
    assert response.status_code==201 and response.json()["costEnvelope"]=={"status":"OPERATOR_FUNDED_FREE","providerComponent":"COVERED_BY_ISEES","iseesMargin":"NOT_APPLICABLE","maximumCustomerPrice":"$0.00","customerCharge":"$0.00"}
    after=api[0].app.dependency_overrides[investigation_repository]().get_current_operational_revision(investigation_id="i1",owner_principal_id=api[4])
    assert before==after and api[2].calls==api[3].calls==0
    assert set(response.json()["effects"].values())=={"NONE"}
    with sqlite3.connect(api[1].path) as db:
        assert db.execute("select count(*) from rex_candidate_bundles").fetchone()[0]==0
        assert db.execute("select count(*) from rex_research_publications").fetchone()[0]==0
        assert db.execute("select count(*) from rex_search_executions").fetchone()[0]==0

def test_free_execution_configuration_fails_closed(api):
    proposal=api[0].post("/api/v1/investigations/i1/rex/proposals",headers=csrf(api[0]),json=proposal_payload(api)).json()
    response=approve(api[0],proposal)
    assert response.status_code==503 and response.json()["error"]["code"]=="REX_FREE_EXECUTION_DISABLED"
    with sqlite3.connect(api[1].path) as db: assert db.execute("select count(*) from rex_proposal_execution_claims").fetchone()[0]==0

def test_free_execution_rejects_results_above_server_entitlement(api):
    api[0].app.dependency_overrides[free_rex_settings]=lambda:FreeRexSettings(True,1,1,4,1,10)
    proposal=api[0].post("/api/v1/investigations/i1/rex/proposals",headers=csrf(api[0]),json=proposal_payload(api)).json()
    response=approve(api[0],proposal)
    assert response.status_code==409 and response.json()["error"]["code"]=="REX_FREE_LIMIT_EXCEEDED"
    with sqlite3.connect(api[1].path) as db: assert db.execute("select count(*) from rex_proposal_execution_claims").fetchone()[0]==0

def test_free_execution_is_explicit_zero_charge_replay_safe_and_quarantined(api,tmp_path):
    runtime=WebDiscoverySearchRuntime(adapter=DeterministicWebDiscoveryFixture())
    runtime._runtime_status=WebDiscoveryRuntimeStatus.LIVE_WEB_DISCOVERY
    candidates=SQLiteCandidateEvidenceRepository(tmp_path/"candidates.sqlite3")
    capture=WebDiscoveryCaptureService(CandidateEvidenceService(candidates),runtime,SQLiteResearchSourceRepository(tmp_path/"research.sqlite3"))
    api[0].app.dependency_overrides.update({free_rex_settings:lambda:FreeRexSettings(True,2,1,4,2,10),web_discovery_runtime:lambda:runtime,web_discovery_capture_service:lambda:capture,candidate_repository:lambda:candidates})
    proposal=api[0].post("/api/v1/investigations/i1/rex/proposals",headers=csrf(api[0]),json=proposal_payload(api)).json()
    missing=approval_payload(proposal); del missing["researcherConfirmation"]
    assert api[0].post(f"/api/v1/investigations/i1/rex/proposals/{proposal['proposalId']}/approval",headers=csrf(api[0]),json=missing).status_code==422
    first=approve(api[0],proposal,"stable-approval-key"); dispatches=runtime.adapter_execution_count
    replay=approve(api[0],proposal,"stable-approval-key")
    assert first.status_code==200 and first.json()["execution"]["customerCharge"]=="$0.00",first.text
    assert first.json()["execution"]["providerUsageCoveredBy"]=="iSEES"
    assert first.json()["execution"]["researchInboxEffect"]==first.json()["execution"]["graphEffect"]==first.json()["execution"]["manifoldEffect"]=="NONE"
    assert first.json()["execution"]["candidateEvidence"]==[]
    assert [item["query"] for item in first.json()["execution"]["queriesAttempted"]]==proposal["proposedQueryPlan"]
    assert all(item["acquisitionLabel"].startswith("METADATA_ONLY - EPHEMERAL") for item in first.json()["execution"]["ephemeralLeads"])
    with sqlite3.connect(candidates.path) as candidate_db:
        assert candidate_db.execute("select count(*) from candidate_evidence").fetchone()[0]==0
    assert replay.status_code==200 and replay.json()["idempotencyDisposition"]=="REPLAYED" and runtime.adapter_execution_count==dispatches
    with sqlite3.connect(api[1].path) as db:
        assert db.execute("select count(*) from rex_proposal_execution_claims").fetchone()[0]==1
        assert db.execute("select count(*) from rex_execution_receipts").fetchone()[0]==1
    second=approval_payload(proposal,"second-key")
    limited=api[0].post(f"/api/v1/investigations/i1/rex/proposals/{proposal['proposalId']}/approval",headers=csrf(api[0]),json=second)
    assert limited.status_code==409

def test_rex_lead_requires_individual_confirmation_and_captures_exactly_one_without_graph_effect(api,tmp_path):
    runtime=WebDiscoverySearchRuntime(adapter=DeterministicWebDiscoveryFixture()); runtime._runtime_status=WebDiscoveryRuntimeStatus.LIVE_WEB_DISCOVERY
    candidates=SQLiteCandidateEvidenceRepository(tmp_path/"capture-candidates.sqlite3")
    capture_service=WebDiscoveryCaptureService(CandidateEvidenceService(candidates),runtime,SQLiteResearchSourceRepository(tmp_path/"capture-research.sqlite3"))
    api[0].app.dependency_overrides.update({free_rex_settings:lambda:FreeRexSettings(True,2,1,4,2,10),web_discovery_runtime:lambda:runtime,web_discovery_capture_service:lambda:capture_service,candidate_repository:lambda:candidates})
    before=api[0].app.dependency_overrides[investigation_repository]().get_current_operational_revision(investigation_id="i1",owner_principal_id=api[4])
    proposal=api[0].post("/api/v1/investigations/i1/rex/proposals",headers=csrf(api[0]),json=proposal_payload(api)).json()
    execution=approve(api[0],proposal,"capture-approval-key").json()["execution"]; lead=execution["ephemeralLeads"][0]
    path=f"/api/v1/investigations/i1/rex/executions/{execution['executionId']}/leads/{lead['resultId']}/candidate-evidence"
    command={"searchSessionId":lead["searchSessionId"],"resultId":lead["resultId"],"idempotencyKey":"one-lead-capture-key","researcherConfirmation":True}
    with sqlite3.connect(candidates.path) as db: assert db.execute("select count(*) from candidate_evidence").fetchone()[0]==0
    assert api[0].post(path,headers=csrf(api[0]),json={k:v for k,v in command.items() if k!="researcherConfirmation"}).status_code==422
    first=api[0].post(path,headers=csrf(api[0]),json=command); replay=api[0].post(path,headers=csrf(api[0]),json=command)
    assert first.status_code==201 and replay.status_code==200
    assert first.json()["candidateId"]==replay.json()["candidateId"] and replay.json()["idempotencyDisposition"]=="REPLAYED"
    assert first.json()["researchInboxEffect"]==first.json()["receipt"]["graphEffect"]==first.json()["receipt"]["manifoldEffect"]=="NONE"
    assert first.json()["receipt"]["rexProvenance"]["proposalId"]==proposal["proposalId"]
    with sqlite3.connect(candidates.path) as db: assert db.execute("select count(*) from candidate_evidence").fetchone()[0]==1
    after=api[0].app.dependency_overrides[investigation_repository]().get_current_operational_revision(investigation_id="i1",owner_principal_id=api[4])
    assert before==after

def test_rex_lead_capture_rejects_expired_session(api,tmp_path):
    now=[datetime(2026,9,27,tzinfo=timezone.utc)]
    runtime=WebDiscoverySearchRuntime(adapter=DeterministicWebDiscoveryFixture(),clock=lambda:now[0]); runtime._runtime_status=WebDiscoveryRuntimeStatus.LIVE_WEB_DISCOVERY
    candidates=SQLiteCandidateEvidenceRepository(tmp_path/"expired-candidates.sqlite3")
    capture_service=WebDiscoveryCaptureService(CandidateEvidenceService(candidates),runtime,SQLiteResearchSourceRepository(tmp_path/"expired-research.sqlite3"))
    api[0].app.dependency_overrides.update({free_rex_settings:lambda:FreeRexSettings(True,2,1,4,2,10),web_discovery_runtime:lambda:runtime,web_discovery_capture_service:lambda:capture_service})
    proposal=api[0].post("/api/v1/investigations/i1/rex/proposals",headers=csrf(api[0]),json=proposal_payload(api)).json()
    execution=approve(api[0],proposal,"expiry-approval-key").json()["execution"]; lead=execution["ephemeralLeads"][0]
    now[0]=datetime(2026,9,28,tzinfo=timezone.utc)
    response=api[0].post(f"/api/v1/investigations/i1/rex/executions/{execution['executionId']}/leads/{lead['resultId']}/candidate-evidence",headers=csrf(api[0]),json={"searchSessionId":lead["searchSessionId"],"resultId":lead["resultId"],"idempotencyKey":"expired-lead-key","researcherConfirmation":True})
    assert response.status_code==410 and response.json()["error"]["code"]=="WEB_DISCOVERY_SESSION_EXPIRED"

def test_concurrent_free_approval_reserves_exactly_one_job_before_dispatch(api):
    class SlowFixture(DeterministicWebDiscoveryFixture):
        def search(self,request,cancellation):
            time.sleep(.2)
            return super().search(request,cancellation)
    runtime=WebDiscoverySearchRuntime(adapter=SlowFixture()); runtime._runtime_status=WebDiscoveryRuntimeStatus.LIVE_WEB_DISCOVERY
    api[0].app.dependency_overrides.update({free_rex_settings:lambda:FreeRexSettings(True,2,2,4,2,2),web_discovery_runtime:lambda:runtime})
    proposal=api[0].post("/api/v1/investigations/i1/rex/proposals",headers=csrf(api[0]),json=proposal_payload(api)).json()
    with ThreadPoolExecutor(max_workers=2) as pool:
        responses=list(pool.map(lambda _:approve(api[0],proposal,"concurrent-stable-key"),(1,2)))
    assert sorted(response.status_code for response in responses)==[200,202]
    assert runtime.adapter_execution_count==len(proposal["proposedQueryPlan"])
    with sqlite3.connect(api[1].path) as db:
        execution_id=db.execute("select execution_id from rex_proposal_execution_claims").fetchone()[0]
        assert db.execute("select count(*) from rex_jobs where execution_id=?",(execution_id,)).fetchone()[0]==1
        assert db.execute("select count(*) from rex_search_executions where execution_id=?",(execution_id,)).fetchone()[0]==1

@pytest.mark.parametrize("cancelled,terminal",[(False,"UNAVAILABLE"),(True,"CANCELLED")])
def test_free_execution_failure_and_cancellation_are_receipted_without_retry(api,tmp_path,cancelled,terminal):
    class TerminalAdapter(_UnavailableAdapter):
        def search(self,request,cancellation): return super().search(request,Cancellation(cancelled))
    runtime=WebDiscoverySearchRuntime(adapter=TerminalAdapter()); runtime._runtime_status=WebDiscoveryRuntimeStatus.LIVE_WEB_DISCOVERY
    candidates=SQLiteCandidateEvidenceRepository(tmp_path/"terminal-candidates.sqlite3")
    capture=WebDiscoveryCaptureService(CandidateEvidenceService(candidates),runtime,SQLiteResearchSourceRepository(tmp_path/"terminal-research.sqlite3"))
    api[0].app.dependency_overrides.update({free_rex_settings:lambda:FreeRexSettings(True,2,2,4,2,10),web_discovery_runtime:lambda:runtime,web_discovery_capture_service:lambda:capture})
    proposal=api[0].post("/api/v1/investigations/i1/rex/proposals",headers=csrf(api[0]),json=proposal_payload(api)).json()
    first=approve(api[0],proposal,"terminal-key"); replay=approve(api[0],proposal,"terminal-key")
    assert first.status_code==502 and first.json()["execution"]["executionStatus"]==terminal
    assert replay.status_code==200 and replay.json()["idempotencyDisposition"]=="REPLAYED"
    assert runtime.adapter_execution_count==1

def test_free_execution_does_not_wrap_fixture_adapter_in_a_false_thread_timeout(api):
    class BlockingAdapter(DeterministicWebDiscoveryFixture):
        calls=0
        def search(self,request,cancellation):
            self.calls+=1
            time.sleep(2)
            return super().search(request,cancellation)
    runtime=WebDiscoverySearchRuntime(adapter=BlockingAdapter()); runtime._runtime_status=WebDiscoveryRuntimeStatus.LIVE_WEB_DISCOVERY
    api[0].app.dependency_overrides.update({free_rex_settings:lambda:FreeRexSettings(True,2,2,4,2,1),web_discovery_runtime:lambda:runtime})
    proposal=api[0].post("/api/v1/investigations/i1/rex/proposals",headers=csrf(api[0]),json=proposal_payload(api)).json()
    first=approve(api[0],proposal,"timeout-stable-key")
    replay=approve(api[0],proposal,"timeout-stable-key")
    assert first.status_code==200 and first.json()["execution"]["executionStatus"]=="COMPLETED"
    assert replay.status_code==200 and replay.json()["execution"]["executionStatus"]=="COMPLETED"
    assert runtime._adapter.calls==len(proposal["proposedQueryPlan"])

def test_tavily_job_identity_fixture_isolation_and_receipt_reconstruction(api,tmp_path):
    runtime=WebDiscoverySearchRuntime(adapter=DeterministicWebDiscoveryFixture())
    runtime._runtime_status=WebDiscoveryRuntimeStatus.LIVE_WEB_DISCOVERY
    api[0].app.dependency_overrides.update({free_rex_settings:lambda:FreeRexSettings(True,2,2,4,2,1),web_discovery_runtime:lambda:runtime})
    proposal=api[0].post("/api/v1/investigations/i1/rex/proposals",headers=csrf(api[0]),json=proposal_payload(api)).json()
    response=approve(api[0],proposal,"receipt-reconstruction-key")
    assert response.status_code==200
    execution=response.json()["execution"]
    rebuilt=api[0].get(f"/api/v1/investigations/i1/rex/executions/{execution['executionId']}/receipt")
    assert rebuilt.status_code==200 and rebuilt.json()==execution
    with sqlite3.connect(api[1].path) as db:
        context=json.loads(db.execute("select context_payload from rex_search_executions where execution_id=?",(execution["executionId"],)).fetchone()[0])
        assert context["schemaVersion"]=="rex-tavily-execution-context/v1"
        assert context["sourceAdapterIdentity"]==runtime._adapter.adapter_id
        assert context["sourceAcquisition"]=="METADATA_ONLY"
        assert db.execute("select count(*) from rex_candidate_bundles").fetchone()[0]==0

def test_stale_proposal_approval_and_guest_approval_are_rejected(api):
    proposal=api[0].post("/api/v1/investigations/i1/rex/proposals",headers=csrf(api[0]),json=proposal_payload(api)).json()
    stale=approval_payload(proposal); stale["operationalRevisionId"]="stale"
    response=api[0].post(f"/api/v1/investigations/i1/rex/proposals/{proposal['proposalId']}/approval",headers=csrf(api[0]),json=stale)
    assert response.status_code==409 and response.json()["error"]["code"]=="REX_STALE_REVISION"
    api[0].post("/api/v1/auth/logout",headers=csrf(api[0]))
    guest=api[0].post(f"/api/v1/investigations/i1/rex/proposals/{proposal['proposalId']}/approval",json=approval_payload(proposal,"guest-attempt-key"))
    assert guest.status_code==401 and guest.json()["error"]["code"]=="AUTHENTICATION_REQUIRED"

def test_changed_question_creates_new_proposal_and_tampered_review_cannot_execute(api):
    first_payload=proposal_payload(api)
    first=api[0].post("/api/v1/investigations/i1/rex/proposals",headers=csrf(api[0]),json=first_payload).json()
    second_payload=proposal_payload(api)
    second_payload["researcherQuestion"]="Which official records support this node?"
    second=api[0].post("/api/v1/investigations/i1/rex/proposals",headers=csrf(api[0]),json=second_payload).json()
    assert first["proposalId"]!=second["proposalId"]
    assert first["proposedQueryPlan"]!=second["proposedQueryPlan"]
    tampered=approval_payload(first,"tampered-query-key")
    tampered["approvedQueries"]=second["proposedQueryPlan"]
    response=api[0].post(f"/api/v1/investigations/i1/rex/proposals/{first['proposalId']}/approval",headers=csrf(api[0]),json=tampered)
    assert response.status_code==409 and response.json()["error"]["code"]=="REX_APPROVAL_SCOPE_MISMATCH"

def test_openapi_contains_exact_rex_surface(api):
    paths={p for p in api[0].get("/openapi.json").json()["paths"] if "/rex" in p}
    assert paths=={"/api/v1/investigations/{investigation_id}/rex/proposals","/api/v1/investigations/{investigation_id}/rex/proposals/{proposal_id}","/api/v1/investigations/{investigation_id}/rex/proposals/{proposal_id}/approval","/api/v1/investigations/{investigation_id}/rex/assignments","/api/v1/investigations/{investigation_id}/rex/execution-preparations","/api/v1/investigations/{investigation_id}/rex/jobs/{job_id}/executions","/api/v1/investigations/{investigation_id}/rex/executions/{execution_id}/receipt","/api/v1/investigations/{investigation_id}/rex/executions/{execution_id}/leads/{result_id}/candidate-evidence","/api/v1/investigations/{investigation_id}/rex/candidate-bundles/{bundle_id}","/api/v1/investigations/{investigation_id}/rex/completed-discoveries"}
