from __future__ import annotations

import hashlib
import json
import sqlite3

import pytest
from fastapi.testclient import TestClient

from isees_uap.api import app
from isees_uap.investigations.errors import RepositoryUnavailable
from isees_uap.investigations.sqlite_repository import SQLiteInvestigationRepository
from isees_uap.testing.authenticated_route_support import authenticated_route_session


def payload(key="adopt-1"):
    return {
        "schemaVersion": "guest-investigation-adoption/v1", "idempotencyKey": key,
        "source": {"kind": "GUEST_SESSION", "guestInvestigationId": "guest-inv-7",
                   "snapshotCreatedAt": "2026-09-08T10:00:00Z", "snapshotUpdatedAt": "2026-09-08T10:05:00Z"},
        "title": "Guest Field Study", "objective": "Retain observations",
        "workspace": {"sourceWorkspaceId": "guest-workspace-7", "nodes": [
            {"id": "node-canon", "kind": "CANONICAL_EVENT", "canonicalEventId": "evt-canonical-44", "title": "Canonical event"},
            {"id": "note-1", "kind": "NOTE", "title": "Working note"}],
            "edges": [{"id": "edge-1", "sourceId": "note-1", "targetId": "node-canon", "kind": "SUPPORTS"}]},
        "researchInbox": [{"anchorId": "anchor-1", "order": 0, "title": "Source", "canonicalSourceId": "source:44"}],
        "artifacts": [{"artifactId": "artifact-1", "kind": "DOCUMENT", "title": "Draft", "content": "Finding", "canonicalSourceIds": ["source:44"]}],
        "viewState": {"activeMode": "RESEARCH", "focusedEventId": "evt-canonical-44",
                      "activeLayers": ["layer:reports"], "temporalContext": "2026-Q3", "investigativeScale": "EVENT"},
    }


def test_authenticated_non_empty_adoption_is_atomic_durable_and_idempotent(tmp_path):
    with authenticated_route_session(tmp_path, investigation_ids=()) as session:
        first = session.post("/api/v1/investigations/adoptions", json=payload())
        assert first.status_code == 201, first.text
        body = first.json()
        assert body["investigationId"].startswith("inv_") and body["investigationId"] != "guest-inv-7"
        assert body["activeInvestigation"] is True and body["aggregateRevision"] == 1
        assert body["activation"]["operationalState"]["workspaceId"] == f"workspace:{body['investigationId']}"
        assert body["activation"]["operationalState"]["workspace"]["nodes"][0]["canonicalEventId"] == "evt-canonical-44"
        replay = session.post("/api/v1/investigations/adoptions", json=payload())
        assert replay.json()["investigationId"] == body["investigationId"]
        assert replay.json()["idempotencyDisposition"] == "REPLAYED"
        changed = payload(); changed["title"] = "Changed"
        assert session.post("/api/v1/investigations/adoptions", json=changed).status_code == 409
        activation = session.get(f"/api/v1/investigations/{body['investigationId']}/activation").json()
        assert activation["operationalState"]["researchInbox"][0]["canonicalSourceId"] == "source:44"
        assert session.get("/api/v1/investigations/active/activation").json()["investigationId"] == body["investigationId"]
        session.post("/api/v1/auth/logout")
        with sqlite3.connect(session.investigations.path) as db:
            db.row_factory = sqlite3.Row
            parent = db.execute("SELECT * FROM investigation").fetchone()
            receipt = db.execute("SELECT * FROM investigation_adoption_receipt").fetchone()
            assert parent["owner_principal_id"] == session.account_id
            assert receipt["payload_digest"] == hashlib.sha256(receipt["payload_json"].encode()).hexdigest()
            assert not any(term in receipt["payload_json"].lower() for term in ("password", "cookie", "token"))
            with pytest.raises(sqlite3.IntegrityError):
                db.execute("UPDATE investigation_adoption_receipt SET payload_digest='changed'")


def test_security_validation_and_account_isolation(tmp_path):
    with authenticated_route_session(tmp_path, investigation_ids=()) as session:
        anonymous = TestClient(app)
        assert anonymous.post("/api/v1/investigations/adoptions", json=payload()).status_code == 401
        anonymous.close()
        assert session.client.post("/api/v1/investigations/adoptions", json=payload()).status_code == 403
        for mutation in (lambda p: p.update(ownerId="acct_bad"),
                         lambda p: p.update(schemaVersion="guest-investigation-adoption/v99"),
                         lambda p: p["viewState"].update(selection="transient")):
            value = payload(); mutation(value)
            assert session.post("/api/v1/investigations/adoptions", json=value).status_code == 422
        a = session.post("/api/v1/investigations/adoptions", json=payload("shared")).json()
        other = TestClient(app)
        assert other.post("/api/v1/auth/accounts", json={"email": "other-adopt@example.test", "password": "correct horse battery staple"}).status_code == 201
        headers = {"X-ISEES-CSRF": other.cookies.get("isees_csrf")}
        b = other.post("/api/v1/investigations/adoptions", json=payload("shared"), headers=headers)
        assert b.status_code == 201 and b.json()["investigationId"] != a["investigationId"]
        other.close()


def test_rollback_on_final_active_pointer_failure(tmp_path):
    repo = SQLiteInvestigationRepository(tmp_path / "rollback.sqlite3")
    with sqlite3.connect(repo.path) as db:
        db.execute("CREATE TRIGGER fail_active_pointer BEFORE INSERT ON account_active_investigation BEGIN SELECT RAISE(FAIL, 'injected'); END")
    value = payload(); value.pop("idempotencyKey")
    with pytest.raises(RepositoryUnavailable):
        repo.adopt_guest_owned(investigation_id="inv_atomic", owner_principal_id="acct_a", title="Atomic",
            objective=None, idempotency_key="retry", command_hash="digest", payload=value)
    with sqlite3.connect(repo.path) as db:
        for table in ("investigation", "investigation_aggregate", "investigation_adoption_receipt", "investigation_adoption_idempotency", "account_active_investigation", "investigation_research_inbox", "investigation_adopted_artifact"):
            assert db.execute(f"SELECT count(*) FROM {table}").fetchone()[0] == 0
