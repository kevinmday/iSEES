from __future__ import annotations

import sqlite3

from fastapi.testclient import TestClient

from isees_uap.api import app
from isees_uap.testing.authenticated_route_support import authenticated_route_session


def create_owned(session):
    response = session.client.post("/api/v1/investigations", json={
        "title": "Empty Field Study", "objective": None, "idempotencyKey": "activation",
    }, headers=session.csrf_headers)
    assert response.status_code == 201
    return response.json()["investigationId"]


def test_activation_requires_session_and_is_non_mutating(tmp_path):
    with authenticated_route_session(tmp_path, investigation_ids=()) as session:
        investigation_id = create_owned(session)
        anonymous = TestClient(app)
        assert anonymous.get(f"/api/v1/investigations/{investigation_id}/activation").status_code == 401
        with sqlite3.connect(session.investigations.path) as connection:
            before = connection.total_changes, connection.execute("SELECT * FROM investigation").fetchall(), connection.execute("SELECT * FROM investigation_aggregate").fetchall()
        response = session.get(f"/api/v1/investigations/{investigation_id}/activation", headers={"X-ISEES-Principal-Id": "acct_spoofed"})
        assert response.status_code == 200
        body = response.json()
        assert body["activationSchemaVersion"] == "owned-investigation-activation/v1"
        assert body["aggregateSchemaVersion"] == "investigation-aggregate/v1"
        assert body["version"] == body["aggregateRevision"] == 0
        assert body["freshnessToken"] == "0:0"
        assert body["access"] == {"kind": "RESEARCHER_OWNED"}
        assert body["operationalState"] == {"kind": "EMPTY", "workspaceId": f"workspace:{investigation_id}", "focusedEventId": None, "nodes": [], "edges": []}
        assert not any(term in response.text.lower() for term in ("nimitz", "tic tac", "canonical", "owner_principal"))
        with sqlite3.connect(session.investigations.path) as connection:
            after = connection.total_changes, connection.execute("SELECT * FROM investigation").fetchall(), connection.execute("SELECT * FROM investigation_aggregate").fetchall()
        assert before[1:] == after[1:]


def test_foreign_and_absent_are_non_disclosing_and_revoked_fails(tmp_path):
    with authenticated_route_session(tmp_path / "a", investigation_ids=()) as a:
        investigation_id = create_owned(a)
        # A second session shares A's production repositories through explicit overrides.
        second = TestClient(app)
        created = second.post("/api/v1/auth/accounts", json={"email": "other@example.test", "password": "correct horse battery staple"})
        assert created.status_code == 201
        foreign = second.get(f"/api/v1/investigations/{investigation_id}/activation", headers={"X-Request-Id": "same"})
        absent = second.get("/api/v1/investigations/inv_absent/activation", headers={"X-Request-Id": "same"})
        assert foreign.status_code == absent.status_code == 404 and foreign.json() == absent.json()
        logout = a.client.post("/api/v1/auth/logout", headers=a.csrf_headers)
        assert logout.status_code == 200
        assert a.get(f"/api/v1/investigations/{investigation_id}/activation").status_code == 401
        second.close()

def test_explicit_canon_import_preserves_owned_identity_replays_and_conflicts(tmp_path):
    with authenticated_route_session(tmp_path, investigation_ids=()) as session:
        investigation_id = create_owned(session); url=f"/api/v1/investigations/{investigation_id}/canon-events"
        payload={"investigationId":investigation_id,"eventId":"E-TICTAC-2004","eventTitle":"Nimitz Tic Tac Encounter","expectedAggregateRevision":0,"idempotencyKey":"import-one","workspace":{"sourceWorkspaceId":f"workspace:{investigation_id}","nodes":[{"id":"system:event:E-TICTAC-2004","kind":"CANONICAL_EVENT","canonicalEventId":"E-TICTAC-2004","title":"Nimitz Tic Tac Encounter"}],"edges":[]},"viewState":{"activeMode":"OVERVIEW","focusedEventId":"E-TICTAC-2004","activeLayers":[],"temporalContext":None,"investigativeScale":None}}
        result=session.client.post(url,json=payload,headers=session.csrf_headers); assert result.status_code==200
        body=result.json(); assert body["investigationId"]==investigation_id and body["aggregateRevision"]==1 and not body["duplicate"]
        assert body["activation"]["title"]=="Empty Field Study" and body["activation"]["operationalState"]["viewState"]["focusedEventId"]=="E-TICTAC-2004"
        replay=session.client.post(url,json=payload,headers=session.csrf_headers).json(); assert replay["replayed"] and replay["aggregateRevision"]==1
        stale={**payload,"idempotencyKey":"stale","eventId":"E-ROOSEVELT-2015"}; stale["workspace"]={**payload["workspace"],"nodes":[{"id":"system:event:E-ROOSEVELT-2015","kind":"CANONICAL_EVENT","canonicalEventId":"E-ROOSEVELT-2015","title":"Roosevelt"}]}; stale["viewState"]={**payload["viewState"],"focusedEventId":"E-ROOSEVELT-2015"}
        assert session.client.post(url,json=stale,headers=session.csrf_headers).status_code==409
        restored=session.get(f"/api/v1/investigations/{investigation_id}/activation").json(); assert restored["aggregateRevision"]==1 and restored["investigationId"]==investigation_id
