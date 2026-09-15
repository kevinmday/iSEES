from __future__ import annotations

import json
import os
import sqlite3
import subprocess
import sys
from dataclasses import replace
from datetime import timedelta

import pytest

from isees_uap.rex.authorization import authorize
from isees_uap.rex.canonical import canonical_hash
from isees_uap.rex.contracts import *
from isees_uap.rex.errors import *
from isees_uap.rex.fixture import CandidateKnowledgeBundle, SourceDocument
from isees_uap.rex.lifecycle import transition_assignment
from isees_uap.rex.models import ResearchPublication
from isees_uap.rex.sqlite_repository import SQLiteRexRepository
from isees_uap.testing.rex.test_durable_repository import another_attempt, request, setup
from isees_uap.testing.rex.test_pure_rex import MANIFOLD, NOW, assignment, denial_context, entitlement, normalized_bundle


def _allowed_decision(identity: str):
    context = denial_context()
    context = replace(context, proposal=replace(context.proposal, source_class=SourceClass.LOCAL_FIXTURE))
    return authorize(context, decision_id=AuthorizationDecisionId(identity))


def _reserve(repo, first, event, decision, identity="1"):
    value = request(first, event, decision, identity)
    repo.reserve_authorized_execution_atomically(value)
    return value


def _usage(execution_id="execution-1", actual=0):
    estimate = CostEstimate(0, 0, 0, 0, 0, 0, "rex-zero-cost/v1")
    measurement = UsageMeasurement(0, 0, 1, 0, 0, 0, 0, actual)
    reconciliation = CostReconciliation(SearchExecutionId(execution_id), 0, 0, actual, actual, 0, CostReconciliationStatus.RECONCILED, NOW)
    return RexUsageRecord(SearchExecutionId(execution_id), estimate, measurement, reconciliation)


def _revision_with(value, **changes):
    fields = value.hash_fields() | changes
    return replace(value, **changes, content_hash=canonical_hash(fields))


def test_assignment_and_revision_immutable_identity_collisions(tmp_path):
    repo = SQLiteRexRepository(tmp_path / "rex.sqlite"); repo.initialize()
    original = assignment(); repo.create_assignment(original)
    with pytest.raises(DuplicateImmutableIdentity): repo.create_assignment(original)
    revision = transition_assignment(original, revision_id=FrontierAssignmentRevisionId("revision-2"), target=Lifecycle.ELIGIBLE, effective_at=NOW, actor_id="actor", reason="eligible")
    repo.append_assignment_revision(revision)
    collision = _revision_with(assignment(), assignment_id=FrontierAssignmentId("assignment-2"), revision_id=revision.revision_id)
    with pytest.raises(DuplicateImmutableIdentity): repo.create_assignment(collision)


def test_stale_skipped_and_conflicting_revisions_are_rejected(tmp_path):
    repo, first, _, _ = setup(tmp_path)
    stale = transition_assignment(assignment(), revision_id=FrontierAssignmentRevisionId("stale"), target=Lifecycle.ELIGIBLE, effective_at=NOW, actor_id="actor", reason="stale")
    with pytest.raises(RevisionConflict): repo.append_assignment_revision(stale)
    executing = transition_assignment(first, revision_id=FrontierAssignmentRevisionId("executing"), target=Lifecycle.EXECUTING, effective_at=NOW, actor_id="actor", reason="run")
    with pytest.raises(RevisionConflict): repo.append_assignment_revision(_revision_with(executing, revision_number=4))
    with pytest.raises(InvalidLifecyclePersistence): repo.append_assignment_revision(_revision_with(executing, research_objective="unauthorized mutation"))


def test_eligibility_coalesces_only_while_pending_and_consumes_once(tmp_path):
    repo, first, event, _ = setup(tmp_path)
    duplicate = replace(event, event_id=EligibilityEventId("event-2"))
    with pytest.raises(DuplicateImmutableIdentity): repo.append_eligibility_event(duplicate)
    assert len(repo.get_pending_eligibility(first.assignment_id)) == 1
    repo.consume_eligibility(event.event_id, consumed_at=NOW)
    assert repo.get_pending_eligibility(first.assignment_id) == ()
    with pytest.raises(EligibilityUnavailable): repo.consume_eligibility(event.event_id, consumed_at=NOW)
    repo.append_eligibility_event(duplicate)


def test_authorization_allow_and_denial_are_both_durable(tmp_path):
    repo, first, event, allowed = setup(tmp_path)
    denied = authorize(denial_context(), decision_id=AuthorizationDecisionId("denied"))
    repo.append_authorization_decision(denied, assignment_revision_id=first.revision_id, eligibility_event_id=event.event_id,
        entitlement_snapshot_id=entitlement().snapshot_id, entitlement_snapshot_hash=entitlement().content_hash, manifold_revision=MANIFOLD)
    with sqlite3.connect(repo.path) as db:
        assert db.execute("SELECT disposition,denial_reason FROM rex_authorization_decisions ORDER BY decision_id").fetchall() == [("ALLOW", "NONE"), ("DENY", "EXTERNAL_EXECUTION_NOT_ALLOWED")]


def test_authorization_hash_bindings_are_persisted_exactly(tmp_path):
    repo, first, event, decision = setup(tmp_path)
    with sqlite3.connect(repo.path) as db:
        row = db.execute("SELECT entitlement_snapshot_hash,manifold_revision_id,manifold_revision_hash,content_hash FROM rex_authorization_decisions WHERE decision_id=?", (str(decision.decision_id),)).fetchone()
    assert row == (entitlement().content_hash, MANIFOLD.revision_id, MANIFOLD.revision_hash, decision.content_hash)
    assert first.entitlement_snapshot_id == entitlement().snapshot_id


def test_every_budget_scope_can_independently_block_reservation(tmp_path):
    for number, kind in enumerate(BudgetScopeKind, 1):
        repo, first, event, decision = setup(tmp_path / kind.value.lower())
        value = request(first, event, decision, str(number))
        reservations = tuple(replace(r, limit_micros=0, reserved_micros=1 if r.scope.kind is kind else 0) for r in value.reservations)
        with pytest.raises(BudgetExceeded): repo.reserve_authorized_execution_atomically(replace(value, reservations=reservations))
        with sqlite3.connect(repo.path) as db: assert db.execute("SELECT count(*) FROM rex_search_executions").fetchone()[0] == 0


def test_aggregate_reservations_exhaust_a_shared_period_scope(tmp_path):
    repo, first, event, decision = setup(tmp_path); one = request(first, event, decision)
    one = replace(one, semantic_duplicate_key="one", reservations=(replace(one.reservations[0], limit_micros=1, reserved_micros=1),))
    repo.reserve_authorized_execution_atomically(one)
    two = another_attempt(repo, first, "2")
    two = replace(two, semantic_duplicate_key="two", reservations=(replace(two.reservations[0], reservation_id="other", limit_micros=1, reserved_micros=1),))
    with pytest.raises(BudgetExceeded): repo.reserve_authorized_execution_atomically(two)


def test_all_monetary_repository_inputs_reject_negative_and_boolean_values(tmp_path):
    repo, first, event, decision = setup(tmp_path); value = request(first, event, decision)
    for field, invalid in (("limit_micros", -1), ("consumed_micros", True), ("reserved_micros", -1)):
        with pytest.raises(RexContractError):
            repo.reserve_authorized_execution_atomically(replace(value, reservations=(replace(value.reservations[0], **{field: invalid}),)))


def test_zero_cost_reconciliation_releases_zero_and_closes_reservations(tmp_path):
    repo, first, event, decision = setup(tmp_path); _reserve(repo, first, event, decision)
    repo.append_cost_reconciliation("ledger-1", _usage())
    with sqlite3.connect(repo.path) as db:
        assert db.execute("SELECT estimated_micros,reserved_micros,actual_micros,charged_micros,released_micros FROM rex_usage_ledger").fetchone() == (0, 0, 0, 0, 0)
        assert {r[0] for r in db.execute("SELECT status FROM rex_budget_reservations")} == {"RECONCILED"}


def test_premature_outcome_is_rejected_until_job_is_claimed(tmp_path):
    repo, first, event, decision = setup(tmp_path); _reserve(repo, first, event, decision)
    with pytest.raises(JobUnavailable): repo.append_execution_outcome("execution-1", status="COMPLETED", occurred_at=NOW)
    assert repo.get_execution("execution-1").status.value == "QUEUED"


def test_completion_is_persisted_and_repeated_outcome_is_rejected(tmp_path):
    repo, first, event, decision = setup(tmp_path); _reserve(repo, first, event, decision)
    repo.claim_job_once("job-1", claimant_id="worker", lease_id="lease", claimed_at=NOW, lease_expires_at=NOW + timedelta(minutes=1))
    repo.append_execution_outcome("execution-1", status="COMPLETED", occurred_at=NOW)
    assert repo.get_execution("execution-1").status.value == "COMPLETED"
    with pytest.raises(JobUnavailable): repo.append_execution_outcome("execution-1", status="FAILED", occurred_at=NOW, failure_category="late")


def test_failure_category_is_persisted_on_execution_and_job(tmp_path):
    repo, first, event, decision = setup(tmp_path); _reserve(repo, first, event, decision)
    repo.claim_job_once("job-1", claimant_id="worker", lease_id="lease", claimed_at=NOW, lease_expires_at=NOW + timedelta(minutes=1))
    repo.append_execution_outcome("execution-1", status="FAILED", occurred_at=NOW, failure_category="FIXTURE_FAILURE")
    with sqlite3.connect(repo.path) as db:
        assert db.execute("SELECT status,failure_category FROM rex_search_executions").fetchone() == ("FAILED", "FIXTURE_FAILURE")
        assert db.execute("SELECT status,failure_category FROM rex_jobs").fetchone() == ("FAILED", "FIXTURE_FAILURE")


def test_usage_ledger_is_append_only_and_identity_unique(tmp_path):
    repo, first, event, decision = setup(tmp_path); _reserve(repo, first, event, decision); repo.append_cost_reconciliation("ledger-1", _usage())
    with pytest.raises(DuplicateImmutableIdentity): repo.append_cost_reconciliation("ledger-1", _usage())
    with sqlite3.connect(repo.path) as db:
        with pytest.raises(sqlite3.IntegrityError): db.execute("UPDATE rex_usage_ledger SET charged_micros=1")
        with pytest.raises(sqlite3.IntegrityError): db.execute("DELETE FROM rex_usage_ledger")


def test_candidate_lineage_order_and_hashes_are_durable(tmp_path):
    repo, first, event, decision = setup(tmp_path); _reserve(repo, first, event, decision); bundle = normalized_bundle(); repo.store_candidate_bundle(bundle, created_at=NOW)
    with sqlite3.connect(repo.path) as db:
        rows = db.execute("SELECT field_order,field_identity,payload,content_hash FROM rex_candidate_lineage ORDER BY field_order").fetchall()
    assert [(r[0], r[1]) for r in rows] == [(0, "kind"), (1, "label"), (2, "claim")]
    assert all(canonical_hash(json.loads(r[2])) == r[3] for r in rows)


def test_candidate_and_source_content_hash_corruption_fail_closed(tmp_path):
    repo, first, event, decision = setup(tmp_path); _reserve(repo, first, event, decision); bundle = normalized_bundle(); repo.store_candidate_bundle(bundle, created_at=NOW)
    with sqlite3.connect(repo.path) as db: db.execute("DROP TRIGGER rex_no_bundle_update"); db.execute("UPDATE rex_candidate_bundles SET bundle_hash='sha256:bad'")
    with pytest.raises(ContentHashMismatch): repo.get_candidate_bundle(bundle.bundle_id)
    with sqlite3.connect(repo.path) as db: db.execute("UPDATE rex_candidate_bundles SET bundle_hash=?,source_hash='sha256:bad'", (bundle.content_hash,))
    with pytest.raises(ContentHashMismatch): repo.get_candidate_bundle(bundle.bundle_id)


def test_ai_provider_and_model_annotations_survive_bundle_round_trip(tmp_path):
    repo, first, event, decision = setup(tmp_path); _reserve(repo, first, event, decision); base = normalized_bundle()
    values = base.hash_fields() | {"ai_assistance_status": AiAssistanceStatus.ASSISTED, "provider_identity": "provider:test", "model_identity": "model:test", "model_class": ModelClass.LANGUAGE}
    assisted = replace(base, **values, content_hash=canonical_hash(values)); repo.store_candidate_bundle(assisted, created_at=NOW)
    restored = repo.get_candidate_bundle(assisted.bundle_id)
    assert (restored.ai_assistance_status, restored.provider_identity, restored.model_identity, restored.model_class) == (AiAssistanceStatus.ASSISTED, "provider:test", "model:test", ModelClass.LANGUAGE)


def test_publication_quarantine_rejects_reviewed_or_canon_effect_payloads(tmp_path):
    repo, first, event, decision = setup(tmp_path); _reserve(repo, first, event, decision); bundle = normalized_bundle(); repo.store_candidate_bundle(bundle, created_at=NOW)
    payload = {"candidate": "one"}; base = ResearchPublication("pub", MANIFOLD.investigation_id, bundle.bundle_id, "anchor", "CANDIDATE_KNOWLEDGE", "RESEARCHER_REVIEW_REQUIRED", "NONE", NOW, payload, canonical_hash(payload))
    with pytest.raises(InvalidStoredRecord): repo.create_research_publication(replace(base, review_status="ADMITTED"))
    with pytest.raises(InvalidStoredRecord): repo.create_research_publication(replace(base, canon_effect="PROMOTE"))


def test_publication_listing_is_isolated_and_ordered_per_investigation(tmp_path):
    repo, first, event, decision = setup(tmp_path); _reserve(repo, first, event, decision); bundle = normalized_bundle(); repo.store_candidate_bundle(bundle, created_at=NOW)
    payload = {"candidate": "one"}; pub = ResearchPublication("pub", "investigation-a", bundle.bundle_id, "anchor", "CANDIDATE_KNOWLEDGE", "RESEARCHER_REVIEW_REQUIRED", "NONE", NOW, payload, canonical_hash(payload)); repo.create_research_publication(pub)
    assert [r["publication_id"] for r in repo.list_investigation_publications("investigation-a")] == ["pub"]
    assert repo.list_investigation_publications("investigation-b") == ()


def test_partially_applied_schema_is_rejected_without_mutation(tmp_path):
    path = tmp_path / "partial.sqlite"
    with sqlite3.connect(path) as db: db.execute("CREATE TABLE rex_schema_migrations(version INTEGER PRIMARY KEY,applied_at TEXT NOT NULL)"); db.execute("INSERT INTO rex_schema_migrations VALUES(1,'now')")
    with pytest.raises(SchemaMismatch): SQLiteRexRepository(path).initialize()
    with sqlite3.connect(path) as db: assert db.execute("SELECT count(*) FROM sqlite_master WHERE name='rex_assignments'").fetchone()[0] == 0


def test_foreign_keys_are_enforced_and_database_integrity_is_clean(tmp_path):
    repo = SQLiteRexRepository(tmp_path / "rex.sqlite"); repo.initialize()
    with repo._connect() as db:
        assert db.execute("PRAGMA foreign_keys").fetchone()[0] == 1
        with pytest.raises(sqlite3.IntegrityError): db.execute("INSERT INTO rex_assignment_revisions VALUES('orphan','missing',1,NULL,'SLEEPING',x'00','hash','now','actor','reason')")
        assert db.execute("PRAGMA integrity_check").fetchone()[0] == "ok" and db.execute("PRAGMA foreign_key_check").fetchall() == []


def test_corrupt_and_unavailable_databases_expose_sanitized_errors(tmp_path):
    corrupt = tmp_path / "secret-corrupt.sqlite"; corrupt.write_bytes(b"not sqlite")
    with pytest.raises(RepositoryUnavailable) as caught: SQLiteRexRepository(corrupt).initialize()
    assert str(corrupt) not in str(caught.value) and "file is not a database" not in str(caught.value)
    directory = tmp_path / "database-directory"; directory.mkdir()
    with pytest.raises(RepositoryUnavailable) as caught: SQLiteRexRepository(directory).initialize()
    assert str(directory) not in str(caught.value)


def test_import_is_inert_and_composed_api_creates_no_rex_database_or_thread(tmp_path):
    marker = tmp_path / "must-not-exist.sqlite"
    code = "import json,sys,threading; before=set(t.ident for t in threading.enumerate()); import isees_uap.api; print(json.dumps({'threads':before==set(t.ident for t in threading.enumerate()),'api_rex':any(n.startswith('isees_uap.rex') for n in sys.modules)}))"
    env = os.environ | {"ISEES_PERSISTENT_ROOT": str(marker)}
    result = subprocess.run([sys.executable, "-c", code], cwd=os.getcwd(), env=env, text=True, capture_output=True, check=True)
    assert json.loads(result.stdout) == {"threads": True, "api_rex": True} and not marker.exists()


def test_fixture_and_candidate_hashes_are_stable_across_fresh_processes():
    code = "from isees_uap.testing.rex.test_pure_rex import normalized_bundle; b=normalized_bundle(); print(b.source_content_hash); print(b.content_hash)"
    outputs = [subprocess.run([sys.executable, "-c", code], cwd=os.getcwd(), text=True, capture_output=True, check=True).stdout for _ in range(2)]
    assert outputs[0] == outputs[1]
    assert all(line.startswith("sha256:") and len(line) == 71 for line in outputs[0].splitlines())
