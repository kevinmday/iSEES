from __future__ import annotations

import sqlite3
from concurrent.futures import ThreadPoolExecutor
from dataclasses import replace
from datetime import timedelta

import pytest

from isees_uap.rex.authorization import authorize
from isees_uap.rex.canonical import canonical_hash
from isees_uap.rex.contracts import *
from isees_uap.rex.errors import *
from isees_uap.rex.fixture import FixtureCandidateNormalizer, FixtureNormalizationRequest, LocalFixtureSourceAdapter
from isees_uap.rex.lifecycle import transition_assignment
from isees_uap.rex.models import AuthorizedExecutionRequest, ReservationRequest, ResearchPublication
from isees_uap.rex.sqlite_repository import SCHEMA_VERSION, SQLiteRexRepository
from isees_uap.testing.rex.test_pure_rex import MANIFOLD, NOW, denial_context, eligible, entitlement, normalized_bundle

def setup(tmp_path):
    repo=SQLiteRexRepository(tmp_path/"rex.sqlite",clock=lambda:NOW); repo.initialize()
    first=eligible(); repo.create_assignment(__import__('isees_uap.testing.rex.test_pure_rex',fromlist=['assignment']).assignment()); repo.append_assignment_revision(first)
    event=EligibilityEvent(EligibilityEventId("event-1"),first.assignment_id,first.revision_id,MANIFOLD,TriggerKind.RESEARCHER_REQUEST,"request:node","fixture-v1","coal-1",NOW,"actor")
    repo.append_eligibility_event(event)
    context=denial_context(); context=replace(context,proposal=replace(context.proposal,source_class=SourceClass.LOCAL_FIXTURE))
    decision=authorize(context,decision_id=AuthorizationDecisionId("decision-1"))
    repo.append_authorization_decision(decision,assignment_revision_id=first.revision_id,eligibility_event_id=event.event_id,entitlement_snapshot_id=entitlement().snapshot_id,entitlement_snapshot_hash=entitlement().content_hash,manifold_revision=MANIFOLD)
    return repo,first,event,decision

def request(first,event,decision,n="1"):
    executing=transition_assignment(first,revision_id=FrontierAssignmentRevisionId("executing-"+n),target=Lifecycle.EXECUTING,effective_at=NOW,actor_id="actor",reason="authorized")
    scopes=tuple(ReservationRequest("reservation-"+n+"-"+k.value,BudgetScope(k,"scope-"+k.value),0,0,0,"period-1") for k in BudgetScopeKind)
    return AuthorizedExecutionRequest(SearchExecutionId("execution-"+n),"job-"+n,str(event.event_id),decision.decision_id,"duplicate-key",context.estimate if (context:=denial_context()) else None,scopes,(),{"fixture":"context"},executing,NOW,NOW)

def another_attempt(repo,first,n):
    event=EligibilityEvent(EligibilityEventId("event-"+n),first.assignment_id,first.revision_id,MANIFOLD,TriggerKind.RESEARCHER_REQUEST,"request:node","fixture-v1","coal-"+n,NOW,"actor")
    repo.append_eligibility_event(event)
    context=replace(denial_context(),proposal=replace(denial_context().proposal,source_class=SourceClass.LOCAL_FIXTURE))
    decision=authorize(context,decision_id=AuthorizationDecisionId("decision-"+n))
    repo.append_authorization_decision(decision,assignment_revision_id=first.revision_id,eligibility_event_id=event.event_id,entitlement_snapshot_id=entitlement().snapshot_id,entitlement_snapshot_hash=entitlement().content_hash,manifold_revision=MANIFOLD)
    return request(first,event,decision,n)

def test_explicit_initialization_and_schema(tmp_path):
    path=tmp_path/"rex.sqlite"; repo=SQLiteRexRepository(path); assert not path.exists()
    repo.initialize(); repo.initialize(); assert path.exists() and repo.schema_version()==SCHEMA_VERSION
    with sqlite3.connect(path) as db: assert db.execute("PRAGMA integrity_check").fetchone()[0]=="ok"

def test_assignment_revisions_and_hash_corruption_fail_closed(tmp_path):
    repo,first,_,_=setup(tmp_path); assert repo.get_assignment(first.assignment_id)==first
    with sqlite3.connect(repo.path) as db: db.execute("UPDATE rex_assignments SET current_revision_id=current_revision_id")
    with sqlite3.connect(repo.path) as db:
        with pytest.raises(sqlite3.IntegrityError): db.execute("UPDATE rex_assignment_revisions SET content_hash='bad' WHERE revision_id=?",(str(first.revision_id),))
    assert repo.get_assignment(first.assignment_id)==first

def test_atomic_zero_reservation_duplicate_and_claim(tmp_path):
    repo,first,event,decision=setup(tmp_path); req=request(first,event,decision)
    execution=repo.reserve_authorized_execution_atomically(req); assert execution.execution_id=="execution-1"
    with sqlite3.connect(repo.path) as db: assert db.execute("SELECT count(*) FROM rex_budget_reservations WHERE reserved_micros=0").fetchone()[0]==6
    claim=repo.claim_job_once("job-1",claimant_id="worker",lease_id="lease",claimed_at=NOW,lease_expires_at=NOW+timedelta(minutes=1)); assert claim.attempt_number==1
    with pytest.raises(JobUnavailable): repo.claim_job_once("job-1",claimant_id="other",lease_id="other",claimed_at=NOW,lease_expires_at=NOW+timedelta(minutes=1))

def test_candidate_and_quarantined_publication_round_trip(tmp_path):
    repo,first,event,decision=setup(tmp_path); repo.reserve_authorized_execution_atomically(request(first,event,decision))
    bundle=normalized_bundle(); repo.store_candidate_bundle(bundle,created_at=NOW); assert repo.get_candidate_bundle(bundle.bundle_id)==bundle
    payload={"anchor":"anchor-1","classification":"CANDIDATE_KNOWLEDGE"}
    pub=ResearchPublication("publication-1",MANIFOLD.investigation_id,bundle.bundle_id,"anchor-1","CANDIDATE_KNOWLEDGE","RESEARCHER_REVIEW_REQUIRED","NONE",NOW,payload,canonical_hash(payload))
    repo.create_research_publication(pub); assert len(repo.list_investigation_publications(MANIFOLD.investigation_id))==1
    with pytest.raises(DuplicateImmutableIdentity): repo.create_research_publication(pub)

def test_sequential_duplicate_is_recorded_without_job_or_money(tmp_path):
    repo,first,event,decision=setup(tmp_path); repo.reserve_authorized_execution_atomically(request(first,event,decision))
    duplicate=another_attempt(repo,first,"2")
    with pytest.raises(DuplicateSuppressed) as caught: repo.reserve_authorized_execution_atomically(duplicate)
    assert caught.value.original_execution_id=="execution-1"
    stored=repo.get_execution("execution-2"); assert stored.original_execution_id=="execution-1"
    with sqlite3.connect(repo.path) as db:
        assert db.execute("SELECT count(*) FROM rex_jobs WHERE execution_id='execution-2'").fetchone()[0]==0
        assert db.execute("SELECT count(*) FROM rex_budget_reservations WHERE execution_id='execution-2'").fetchone()[0]==0

def test_concurrent_duplicate_has_one_executable(tmp_path):
    repo,first,event,decision=setup(tmp_path); a=request(first,event,decision); b=another_attempt(repo,first,"2")
    def run(value):
        try: repo.reserve_authorized_execution_atomically(value); return "original"
        except DuplicateSuppressed: return "suppressed"
    with ThreadPoolExecutor(max_workers=2) as pool: results=list(pool.map(run,(a,b)))
    assert sorted(results)==["original","suppressed"]
    with sqlite3.connect(repo.path) as db:
        assert db.execute("SELECT count(*) FROM rex_jobs").fetchone()[0]==1
        assert db.execute("SELECT count(*) FROM rex_budget_reservations").fetchone()[0]==6

def test_invalid_money_fails_before_sql(tmp_path):
    repo,first,event,decision=setup(tmp_path); good=request(first,event,decision)
    bad=replace(good,reservations=(replace(good.reservations[0],reserved_micros=0.0),))
    with pytest.raises(RexContractError): repo.reserve_authorized_execution_atomically(bad)
    with sqlite3.connect(repo.path) as db: assert db.execute("SELECT count(*) FROM rex_search_executions").fetchone()[0]==0

def test_budget_and_breaker_rollback_all_rows(tmp_path):
    repo,first,event,decision=setup(tmp_path); good=request(first,event,decision)
    bad=replace(good,reservations=(replace(good.reservations[0],reserved_micros=1),))
    with pytest.raises(BudgetExceeded): repo.reserve_authorized_execution_atomically(bad)
    breaker=CircuitBreakerSnapshot(BudgetScope(BudgetScopeKind.GLOBAL,"global"),True,SuspensionReason.CIRCUIT_BREAKER,"breaker/v1")
    with pytest.raises(CircuitBreakerOpen): repo.reserve_authorized_execution_atomically(replace(good,circuit_breakers=(breaker,)))
    with sqlite3.connect(repo.path) as db:
        assert db.execute("SELECT count(*) FROM rex_search_executions").fetchone()[0]==0
        assert db.execute("SELECT count(*) FROM rex_budget_reservations").fetchone()[0]==0

def test_locked_database_is_sanitized(tmp_path):
    repo,_,_,_=setup(tmp_path); repo.busy_timeout_ms=0
    lock=sqlite3.connect(repo.path,isolation_level=None); lock.execute("BEGIN IMMEDIATE")
    try:
        with pytest.raises(RepositoryUnavailable) as caught: repo.consume_eligibility("event-1",consumed_at=NOW)
        assert str(repo.path) not in str(caught.value)
    finally: lock.rollback(); lock.close()

def test_unsupported_schema_fails_closed(tmp_path):
    path=tmp_path/"future.sqlite"
    with sqlite3.connect(path) as db: db.execute("CREATE TABLE rex_schema_migrations(version INTEGER PRIMARY KEY,applied_at TEXT NOT NULL)"); db.execute("INSERT INTO rex_schema_migrations VALUES(99,'now')")
    with pytest.raises(SchemaMismatch): SQLiteRexRepository(path).initialize()
