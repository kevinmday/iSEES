from __future__ import annotations

import json
import sqlite3
from datetime import datetime, timezone

import pytest

from isees_uap.investigations.errors import (
    InvalidOperationalGraph, InvalidStoredInvestigation, OperationalRevisionConflict,
    RepositoryUnavailable,
)
from isees_uap.investigations.models import OperationalGraphRevision
from isees_uap.investigations.sqlite_repository import (
    GRAPH_SCHEMA_VERSION, SQLiteInvestigationRepository,
    operational_graph_fingerprint,
)

NOW = datetime(2026, 9, 25, tzinfo=timezone.utc)


def graph(label="Event"):
    return {"nodes": [{"id": "event-1", "label": label, "type": "EVENT",
                       "metadata": {"sourceId": "event-1"}}],
            "edges": [], "statistics": {"nodeCount": 1, "edgeCount": 0}}


def revision(investigation_id, number, parent, snapshot=None, revision_id=None):
    snapshot = snapshot or graph()
    return OperationalGraphRevision(
        investigation_id, revision_id or f"REV-{number:04d}", number, parent,
        snapshot, operational_graph_fingerprint(snapshot), GRAPH_SCHEMA_VERSION,
        "KNOWLEDGE_TOPOLOGY_V1", "AUTHENTICATED_RESEARCHER", NOW,
        "TEST_MUTATION", "event-1")


def payload(label="Event"):
    return {"schemaVersion": "canon-event-import/v1",
            "source": {"kind": "SYSTEM_CANON", "eventId": "event-1",
                       "importedAt": NOW.isoformat()},
            "title": "Study", "objective": None,
            "workspace": {"sourceWorkspaceId": "workspace:inv", "nodes": [
                {"id": "event-1", "kind": "CANONICAL_EVENT",
                 "canonicalEventId": "event-1", "title": label}], "edges": []},
            "researchInbox": [], "artifacts": [],
            "viewState": {"activeMode": "MANIFOLD", "focusedEventId": "event-1",
                          "activeLayers": [], "temporalContext": None,
                          "investigativeScale": None}}


def test_initial_child_head_retention_and_aggregate_revision_are_distinct(tmp_path):
    repo = SQLiteInvestigationRepository(tmp_path / "authority.sqlite3", clock=lambda: NOW)
    repo.create(investigation_id="inv", owner_principal_id="owner", title="Study")
    _, aggregate, first = repo.append_operational_revision_owned(
        investigation_id="inv", owner_principal_id="owner",
        expected_operational_head_id=None, revision=revision("inv", 1, None),
        aggregate_payload=payload(), expected_aggregate_revision=0)
    assert aggregate.revision == 1 and first.revision_number == 1
    second_graph = graph("Changed")
    _, aggregate, second = repo.append_operational_revision_owned(
        investigation_id="inv", owner_principal_id="owner",
        expected_operational_head_id="REV-0001",
        revision=revision("inv", 2, "REV-0001", second_graph),
        aggregate_payload=payload("Changed"), expected_aggregate_revision=1)
    lineage = repo.get_operational_revision_lineage(
        investigation_id="inv", owner_principal_id="owner")
    assert aggregate.revision == 2 and second.revision_number == 2
    assert lineage.current_operational_revision_id == "REV-0002"
    assert [item.graph_snapshot["nodes"][0]["label"] for item in lineage.revisions] == ["Event", "Changed"]
    with sqlite3.connect(repo.path) as db, pytest.raises(sqlite3.IntegrityError):
        db.execute("UPDATE investigation_operational_revision SET mutation_kind='changed'")


def test_stale_head_duplicate_and_fingerprint_fail_without_mutation(tmp_path):
    repo = SQLiteInvestigationRepository(tmp_path / "conflicts.sqlite3", clock=lambda: NOW)
    repo.create(investigation_id="inv", owner_principal_id="owner", title="Study")
    repo.append_operational_revision_owned(investigation_id="inv", owner_principal_id="owner",
        expected_operational_head_id=None, revision=revision("inv", 1, None),
        aggregate_payload=payload(), expected_aggregate_revision=0)
    with pytest.raises(OperationalRevisionConflict):
        repo.append_operational_revision_owned(investigation_id="inv", owner_principal_id="owner",
            expected_operational_head_id=None, revision=revision("inv", 2, None),
            aggregate_payload=payload(), expected_aggregate_revision=1)
    with pytest.raises(OperationalRevisionConflict):
        repo.append_operational_revision_owned(investigation_id="inv", owner_principal_id="owner",
            expected_operational_head_id="REV-0001",
            revision=revision("inv", 2, "REV-0001", revision_id="REV-0001"),
            aggregate_payload=payload(), expected_aggregate_revision=1)
    bad = revision("inv", 2, "REV-0001")
    bad = OperationalGraphRevision(**{**bad.__dict__, "graph_fingerprint": "wrong"})
    with pytest.raises(InvalidOperationalGraph):
        repo.append_operational_revision_owned(investigation_id="inv", owner_principal_id="owner",
            expected_operational_head_id="REV-0001", revision=bad,
            aggregate_payload=payload(), expected_aggregate_revision=1)
    assert len(repo.get_operational_revision_lineage(
        investigation_id="inv", owner_principal_id="owner").revisions) == 1
    assert repo.get_operational_revision_lineage(
        investigation_id="inv", owner_principal_id="other") is None


def test_atomic_rollback_and_legacy_baseline_idempotency_fail_closed(tmp_path):
    repo = SQLiteInvestigationRepository(tmp_path / "atomic.sqlite3", clock=lambda: NOW)
    repo.create(investigation_id="inv", owner_principal_id="owner", title="Study")
    with sqlite3.connect(repo.path) as db:
        db.execute("CREATE TRIGGER fail_projection BEFORE UPDATE ON investigation_aggregate "
                   "BEGIN SELECT RAISE(FAIL, 'injected'); END")
    with pytest.raises(RepositoryUnavailable):
        repo.append_operational_revision_owned(investigation_id="inv", owner_principal_id="owner",
            expected_operational_head_id=None, revision=revision("inv", 1, None),
            aggregate_payload=payload(), expected_aggregate_revision=0)
    with sqlite3.connect(repo.path) as db:
        assert db.execute("SELECT count(*) FROM investigation_operational_revision").fetchone()[0] == 0
        db.execute("DROP TRIGGER fail_projection")
        db.execute("UPDATE investigation_aggregate SET state='ADOPTED',revision=1,payload_json=? WHERE investigation_id='inv'", (json.dumps(payload()),))
    baseline = repo.materialize_compatibility_baseline_owned(
        investigation_id="inv", owner_principal_id="owner")
    again = repo.materialize_compatibility_baseline_owned(
        investigation_id="inv", owner_principal_id="owner")
    assert baseline.current_operational_revision_id == "MIGRATION-BASELINE-0001"
    assert again == baseline and baseline.revisions[0].mutation_kind == "MIGRATION_BASELINE"

    repo.create(investigation_id="bad", owner_principal_id="owner", title="Bad")
    with sqlite3.connect(repo.path) as db:
        db.execute("UPDATE investigation_aggregate SET state='ADOPTED',revision=1,payload_json=? WHERE investigation_id='bad'", ('{"ambiguous":true}',))
    with pytest.raises(InvalidStoredInvestigation):
        repo.materialize_compatibility_baseline_owned(
            investigation_id="bad", owner_principal_id="owner")
