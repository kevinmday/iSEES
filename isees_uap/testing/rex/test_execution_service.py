from __future__ import annotations

import ast
import json
import os
import socket
import sqlite3
import subprocess
import sys
from concurrent.futures import ThreadPoolExecutor
from dataclasses import replace
from datetime import timedelta

import pytest

from isees_uap.rex.canonical import canonical_hash
from isees_uap.rex.contracts import *
from isees_uap.rex.errors import *
from isees_uap.rex.fixture import FixtureCandidateNormalizer, LocalFixtureSourceAdapter
from isees_uap.rex.models import AuthorizedExecutionRequest, ReservationRequest
from isees_uap.rex.service import (DurableExecutionContext, ExecuteDurableJob,
                                   RexExecutionService)
from isees_uap.rex.sqlite_repository import SQLiteRexRepository
from isees_uap.testing.rex.test_durable_repository import setup
from isees_uap.testing.rex.test_pure_rex import MANIFOLD, NOW


class CountingAdapter(LocalFixtureSourceAdapter):
    def __init__(self, callback=None, error=None): self.calls=0; self.callback=callback; self.error=error
    def retrieve(self, request):
        self.calls += 1
        if self.callback: self.callback()
        if self.error: raise self.error
        return super().retrieve(request)


class CountingNormalizer(FixtureCandidateNormalizer):
    def __init__(self, callback=None, error=None, mutate=None): self.calls=0; self.callback=callback; self.error=error; self.mutate=mutate
    def normalize(self, request):
        self.calls += 1
        if self.callback: self.callback()
        if self.error: raise self.error
        value=super().normalize(request)
        return self.mutate(value) if self.mutate else value


def prepared(tmp_path, *, adapter=None, normalizer=None, context_changes=None, repo_wrapper=None, reserved_micros=0):
    repo,first,event,decision=setup(tmp_path)
    estimate=CostEstimate(reserved_micros,0,0,0,0,reserved_micros,"rex-test-cost/v1")
    values=dict(execution_id=SearchExecutionId("execution-1"),job_id="job-1",assignment_id=str(first.assignment_id),
        assignment_revision_id=first.revision_id,manifold_revision=MANIFOLD,
        source_adapter_identity=LocalFixtureSourceAdapter.adapter_identity,source_adapter_version=LocalFixtureSourceAdapter.adapter_version,
        normalizer_identity=FixtureCandidateNormalizer.normalizer_identity,normalizer_version=FixtureCandidateNormalizer.normalizer_version,
        candidate_bundle_id=CandidateKnowledgeBundleId("bundle-service-1"),configuration_hash=canonical_hash({"ai":"NONE"}),
        supplied_by="fixture-author",ai_assistance_status=AiAssistanceStatus.NONE,provider_identity="NONE",model_identity="NONE",model_class=ModelClass.NONE,estimate=estimate)
    values.update(context_changes or {}); context=DurableExecutionContext(**values)
    from isees_uap.rex.lifecycle import transition_assignment
    executing=transition_assignment(first,revision_id=FrontierAssignmentRevisionId("executing-service"),target=Lifecycle.EXECUTING,effective_at=NOW,actor_id="runner",reason="authorized")
    reservations=tuple(ReservationRequest("service-reservation-"+k.value,BudgetScope(k,"scope-"+k.value),reserved_micros,0,reserved_micros,"period-1") for k in BudgetScopeKind)
    request=AuthorizedExecutionRequest(context.execution_id,context.job_id,str(event.event_id),decision.decision_id,"service-duplicate",estimate,reservations,(),context,executing,NOW,NOW)
    repo.reserve_authorized_execution_atomically(request)
    adapter=adapter or CountingAdapter(); normalizer=normalizer or CountingNormalizer()
    ids={"lease":0,"ledger":0}
    def make_id(kind): ids[kind]+=1; return f"{kind}-{ids[kind]}"
    service=RexExecutionService(repository=repo_wrapper(repo) if repo_wrapper else repo,
        source_adapters={adapter.adapter_identity:adapter},normalizers={normalizer.normalizer_identity:normalizer},
        clock=lambda:NOW,id_factory=make_id)
    return repo,service,adapter,normalizer,context


def rows(repo, sql):
    with sqlite3.connect(repo.path) as db: return db.execute(sql).fetchall()


def test_successful_zero_cost_execution_and_deterministic_receipt(tmp_path):
    repo,service,adapter,normalizer,context=prepared(tmp_path)
    receipt=service.execute_one(ExecuteDurableJob("job-1","inline-runner"))
    assert receipt.terminal_execution_status=="COMPLETED" and receipt.estimated_micros==receipt.actual_micros==receipt.charged_micros==0
    assert receipt.content_hash==canonical_hash(receipt.hash_fields()) and receipt.candidate_bundle_id==str(context.candidate_bundle_id)
    assert adapter.calls==normalizer.calls==1


def test_success_persists_bundle_lineage_usage_and_zero_reconciliation(tmp_path):
    repo,service,_,_,_=prepared(tmp_path); receipt=service.execute_one(ExecuteDurableJob("job-1","runner"))
    assert rows(repo,"SELECT count(*) FROM rex_candidate_bundles")==[(1,)]
    assert rows(repo,"SELECT count(*) FROM rex_candidate_lineage")==[(3,)]
    assert rows(repo,"SELECT estimated_micros,reserved_micros,actual_micros,charged_micros,released_micros FROM rex_usage_ledger")==[(0,0,0,0,0)]
    assert rows(repo,"SELECT status FROM rex_budget_reservations GROUP BY status")== [("RECONCILED",)]
    assert service.reconstruct_receipt(SearchExecutionId(receipt.execution_id))==receipt


def test_success_releases_unused_reservation_deterministically(tmp_path):
    repo,service,_,_,_=prepared(tmp_path,reserved_micros=7)
    receipt=service.execute_one(ExecuteDurableJob("job-1","runner"))
    assert (receipt.reserved_micros,receipt.actual_micros,receipt.charged_micros,receipt.released_micros)==(7,0,0,7)
    assert rows(repo,"SELECT reserved_micros,actual_micros,charged_micros,released_micros FROM rex_usage_ledger")==[(7,0,0,7)]


def test_adapter_and_normalizer_run_outside_transactions_with_committed_visibility(tmp_path):
    observations=[]
    def observe():
        with sqlite3.connect(path) as db:
            observations.append((db.in_transaction,db.execute("SELECT status FROM rex_jobs WHERE job_id='job-1'").fetchone()[0],db.execute("SELECT count(*) FROM rex_candidate_bundles").fetchone()[0]))
            db.execute("BEGIN IMMEDIATE"); db.rollback()
    path=tmp_path/"rex.sqlite"; adapter=CountingAdapter(observe); normalizer=CountingNormalizer(observe)
    _,service,_,_,_=prepared(tmp_path,adapter=adapter,normalizer=normalizer)
    service.execute_one(ExecuteDurableJob("job-1","runner"))
    assert observations==[(False,"CLAIMED",0),(False,"CLAIMED",0)]


def test_completion_occurs_only_after_bundle_storage(tmp_path):
    seen=[]
    class Proxy:
        def __init__(self,repo): self.repo=repo
        def __getattr__(self,n): return getattr(self.repo,n)
        def finalize_execution_success(self,**kw):
            seen.append(rows(self.repo,"SELECT count(*) FROM rex_candidate_bundles")[0][0]); result=self.repo.finalize_execution_success(**kw)
            seen.append(rows(self.repo,"SELECT count(*) FROM rex_candidate_bundles")[0][0]); return result
    repo,service,_,_,_=prepared(tmp_path,repo_wrapper=Proxy); service.execute_one(ExecuteDurableJob("job-1","runner"))
    assert seen==[0,1] and rows(repo,"SELECT status FROM rex_search_executions")== [("COMPLETED",)]


@pytest.mark.parametrize("which,error_type",[("adapter",SourceAdapterFailed),("normalizer",CandidateNormalizationFailed)])
def test_provider_and_normalizer_failures_are_sanitized_terminal_and_bundle_free(tmp_path,which,error_type):
    secret="credential=top-secret C:\\private\\rex.sqlite"
    adapter=CountingAdapter(error=RuntimeError(secret)) if which=="adapter" else CountingAdapter()
    normalizer=CountingNormalizer(error=RuntimeError(secret)) if which=="normalizer" else CountingNormalizer()
    repo,service,adapter,normalizer,_=prepared(tmp_path,adapter=adapter,normalizer=normalizer)
    with pytest.raises(error_type) as caught: service.execute_one(ExecuteDurableJob("job-1","runner"))
    assert "secret" not in str(caught.value) and "sqlite" not in str(caught.value)
    assert rows(repo,"SELECT status,failure_category FROM rex_jobs")==[("FAILED",error_type.category)] and rows(repo,"SELECT count(*) FROM rex_candidate_bundles")==[(0,)]
    assert rows(repo,"SELECT status FROM rex_budget_reservations GROUP BY status")==[("RECONCILED",)]


@pytest.mark.parametrize("identity_field,version_field",[("source_adapter_identity","source_adapter_version"),("normalizer_identity","normalizer_version")])
def test_unknown_and_version_mismatched_ports_fail_before_invocation(tmp_path,identity_field,version_field):
    repo,service,adapter,normalizer,_=prepared(tmp_path,context_changes={identity_field:"unknown"})
    with pytest.raises(PortResolutionFailed): service.execute_one(ExecuteDurableJob("job-1","runner"))
    assert adapter.calls==normalizer.calls==0 and rows(repo,"SELECT status FROM rex_jobs")==[("FAILED",)]
    repo2,service2,adapter2,normalizer2,_=prepared(tmp_path/"version",context_changes={version_field:"999"})
    with pytest.raises(PortResolutionFailed): service2.execute_one(ExecuteDurableJob("job-1","runner"))
    assert adapter2.calls==normalizer2.calls==0


def test_execution_context_hash_corruption_fails_terminal_without_invocation(tmp_path):
    repo,service,adapter,normalizer,_=prepared(tmp_path)
    with sqlite3.connect(repo.path) as db: db.execute("DROP TRIGGER rex_execution_context_immutable"); db.execute("UPDATE rex_search_executions SET context_hash='sha256:bad'")
    with pytest.raises(ExecutionContextInvalid): service.execute_one(ExecuteDurableJob("job-1","runner"))
    assert adapter.calls==normalizer.calls==0 and rows(repo,"SELECT status FROM rex_jobs")==[("FAILED",)]


def _mutated(field,value):
    def mutate(bundle):
        values=bundle.hash_fields()|{field:value}; return replace(bundle,**values,content_hash=canonical_hash(values))
    return mutate


@pytest.mark.parametrize("field,value",[
    ("assignment_revision_id",FrontierAssignmentRevisionId("wrong")),
    ("manifold_revision",replace(MANIFOLD,revision_id="wrong")),
    ("execution_id",SearchExecutionId("wrong")),
])
def test_candidate_binding_mismatches_fail_closed(tmp_path,field,value):
    repo,service,adapter,normalizer,_=prepared(tmp_path,normalizer=CountingNormalizer(mutate=_mutated(field,value)))
    with pytest.raises(CandidateValidationFailed): service.execute_one(ExecuteDurableJob("job-1","runner"))
    assert adapter.calls==normalizer.calls==1 and rows(repo,"SELECT count(*) FROM rex_candidate_bundles")==[(0,)]


def test_source_content_hash_corruption_fails_closed(tmp_path):
    class Corrupt(CountingAdapter):
        def retrieve(self,request):
            value=super().retrieve(request); object.__setattr__(value,"content_hash","sha256:bad"); return value
    repo,service,adapter,normalizer,_=prepared(tmp_path,adapter=Corrupt())
    with pytest.raises(CandidateValidationFailed): service.execute_one(ExecuteDurableJob("job-1","runner"))
    assert adapter.calls==1 and normalizer.calls==0 and rows(repo,"SELECT count(*) FROM rex_candidate_bundles")==[(0,)]


def test_candidate_content_hash_corruption_fails_closed(tmp_path):
    def corrupt(bundle): object.__setattr__(bundle,"content_hash","sha256:bad"); return bundle
    repo,service,_,_,_=prepared(tmp_path,normalizer=CountingNormalizer(mutate=corrupt))
    with pytest.raises(CandidateValidationFailed): service.execute_one(ExecuteDurableJob("job-1","runner"))
    assert rows(repo,"SELECT count(*) FROM rex_candidate_bundles")==[(0,)]


def test_bundle_identity_collision_rolls_back_and_fails_terminal(tmp_path):
    repo,service,_,_,context=prepared(tmp_path)
    with sqlite3.connect(repo.path) as db:
        db.execute("PRAGMA foreign_keys=OFF"); db.execute("INSERT INTO rex_candidate_bundles VALUES(?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)",(str(context.candidate_bundle_id),"foreign",str(context.assignment_revision_id),MANIFOLD.revision_id,MANIFOLD.revision_hash,b"{}","x",b"{}","x","CANDIDATE_KNOWLEDGE","RESEARCHER_REVIEW_REQUIRED","NONE","NONE","NONE","NONE",NOW.isoformat()))
    with pytest.raises(ExecutionPersistenceFailed): service.execute_one(ExecuteDurableJob("job-1","runner"))
    assert rows(repo,"SELECT status FROM rex_jobs")==[("FAILED",)] and rows(repo,"SELECT count(*) FROM rex_usage_ledger")==[(1,)]


@pytest.mark.parametrize("method",["finalize_execution_success","reserved_micros"])
def test_storage_or_reconciliation_failure_cannot_complete_or_leave_bundle(tmp_path,method):
    class Proxy:
        def __init__(self,repo): self.repo=repo
        def __getattr__(self,n):
            if n==method: return lambda *a,**k: (_ for _ in ()).throw(RepositoryUnavailable("sanitized"))
            return getattr(self.repo,n)
    repo,service,_,_,_=prepared(tmp_path,repo_wrapper=Proxy)
    with pytest.raises(ExecutionPersistenceFailed): service.execute_one(ExecuteDurableJob("job-1","runner"))
    assert rows(repo,"SELECT count(*) FROM rex_candidate_bundles")==[(0,)] and rows(repo,"SELECT status FROM rex_jobs")==[("FAILED",)]


def test_completion_persistence_failure_rolls_back_all_success_artifacts(tmp_path):
    class Proxy:
        def __init__(self,repo): self.repo=repo
        def __getattr__(self,n): return getattr(self.repo,n)
        def finalize_execution_success(self,**kw):
            with sqlite3.connect(self.repo.path) as db: db.execute("CREATE TRIGGER break_completion BEFORE UPDATE OF status ON rex_search_executions WHEN NEW.status='COMPLETED' BEGIN SELECT RAISE(ABORT,'break'); END")
            return self.repo.finalize_execution_success(**kw)
    repo,service,_,_,_=prepared(tmp_path,repo_wrapper=Proxy)
    with pytest.raises(ExecutionPersistenceFailed): service.execute_one(ExecuteDurableJob("job-1","runner"))
    assert rows(repo,"SELECT count(*) FROM rex_candidate_bundles")==[(0,)] and rows(repo,"SELECT status FROM rex_jobs")==[("FAILED",)]


def test_completed_and_failed_job_replay_denied_without_second_adapter_call(tmp_path):
    repo,service,adapter,_,_=prepared(tmp_path); service.execute_one(ExecuteDurableJob("job-1","runner"))
    with pytest.raises(JobUnavailable): service.execute_one(ExecuteDurableJob("job-1","runner"))
    assert adapter.calls==1
    repo2,service2,adapter2,_,_=prepared(tmp_path/"failed",adapter=CountingAdapter(error=RuntimeError("x")))
    with pytest.raises(SourceAdapterFailed): service2.execute_one(ExecuteDurableJob("job-1","runner"))
    with pytest.raises(JobUnavailable): service2.execute_one(ExecuteDurableJob("job-1","runner"))
    assert adapter2.calls==1


def test_concurrent_attempts_invoke_adapter_once(tmp_path):
    _,service,adapter,_,_=prepared(tmp_path)
    def run(_):
        try: service.execute_one(ExecuteDurableJob("job-1","runner")); return "ok"
        except JobUnavailable: return "denied"
    with ThreadPoolExecutor(max_workers=2) as pool: result=sorted(pool.map(run,range(2)))
    assert result==["denied","ok"] and adapter.calls==1


def test_annotations_and_authority_boundaries_survive_success(tmp_path):
    repo,service,_,_,_=prepared(tmp_path); receipt=service.execute_one(ExecuteDurableJob("job-1","runner")); bundle=repo.get_candidate_bundle(CandidateKnowledgeBundleId(receipt.candidate_bundle_id))
    assert bundle.ai_assistance_status is AiAssistanceStatus.NONE and bundle.provider_identity==bundle.model_identity=="NONE"
    assert all(c.epistemic_classification is CandidateEpistemicClassification.CANDIDATE_KNOWLEDGE and c.review_status is CandidateReviewStatus.RESEARCHER_REVIEW_REQUIRED and c.canon_effect is CanonEffect.NONE for c in bundle.candidates)
    assert rows(repo,"SELECT count(*) FROM rex_research_publications")==[(0,)]


def test_ai_assisted_annotations_are_preserved_exactly(tmp_path):
    context_changes=dict(ai_assistance_status=AiAssistanceStatus.ASSISTED,provider_identity="provider:x",model_identity="model:y",model_class=ModelClass.LANGUAGE)
    def assisted(bundle):
        values=bundle.hash_fields()|context_changes; return replace(bundle,**values,content_hash=canonical_hash(values))
    repo,service,_,_,_=prepared(tmp_path,context_changes=context_changes,normalizer=CountingNormalizer(mutate=assisted)); receipt=service.execute_one(ExecuteDurableJob("job-1","runner"))
    assert (receipt.ai_assistance_status,receipt.provider_identity,receipt.model_identity)==("ASSISTED","provider:x","model:y")


def test_receipt_hash_is_stable_in_fresh_processes(tmp_path):
    repo,service,_,_,_=prepared(tmp_path); expected=service.execute_one(ExecuteDurableJob("job-1","runner")).content_hash
    code="from isees_uap.rex.sqlite_repository import SQLiteRexRepository; from isees_uap.rex.contracts import SearchExecutionId; import sys; print(SQLiteRexRepository(sys.argv[1]).reconstruct_execution_receipt(SearchExecutionId('execution-1')).content_hash)"
    outputs=[subprocess.run([sys.executable,"-c",code,str(repo.path)],cwd=os.getcwd(),text=True,capture_output=True,check=True).stdout.strip() for _ in range(2)]
    assert outputs==[expected,expected]


def test_import_time_isolation_and_no_production_api_import(tmp_path):
    marker=tmp_path/"no.sqlite"
    code="import json,threading,sys; b={t.ident for t in threading.enumerate()}; import isees_uap.rex.service; print(json.dumps([b=={t.ident for t in threading.enumerate()},any(n=='isees_uap.rex.service' for n in sys.modules)]))"
    result=subprocess.run([sys.executable,"-c",code],cwd=os.getcwd(),env=os.environ|{"ISEES_PERSISTENT_ROOT":str(marker)},text=True,capture_output=True,check=True)
    assert json.loads(result.stdout)==[True,True] and not marker.exists()
    import isees_uap.api
    assert "isees_uap.rex.service" not in {n for n in sys.modules if n.startswith("isees_uap.api")}


def test_service_has_no_external_calls_dynamic_imports_or_background_constructs():
    tree=ast.parse(open("isees_uap/rex/service.py",encoding="utf-8").read())
    imports=[n.module or "" for n in ast.walk(tree) if isinstance(n,ast.ImportFrom)]+[a.name for n in ast.walk(tree) if isinstance(n,ast.Import) for a in n.names]
    source=open("isees_uap/rex/service.py",encoding="utf-8").read().lower()
    assert not any(x.startswith(("requests","httpx","urllib","google")) for x in imports)
    assert not any(x in source for x in ("import_module(","threading","timer(","scheduler","polling loop","getenv(","environ["))


def test_successful_fixture_uses_no_network(tmp_path,monkeypatch):
    monkeypatch.setattr(socket,"create_connection",lambda *a,**k: (_ for _ in ()).throw(AssertionError("network")))
    _,service,_,_,_=prepared(tmp_path); assert service.execute_one(ExecuteDurableJob("job-1","runner")).terminal_execution_status=="COMPLETED"
