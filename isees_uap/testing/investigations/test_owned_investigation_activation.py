from __future__ import annotations

import sqlite3
import json

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


def test_nimitz_canon_import_accepts_frontend_fingerprint_and_persists_graph(tmp_path):
    with authenticated_route_session(tmp_path, investigation_ids=()) as session:
        investigation_id = create_owned(session)
        graph = {
            "nodes": [
                {"id": "system:event:E-TICTAC-2004", "label": "Nimitz Tic Tac Encounter", "type": "EVENT",
                 "metadata": {"classification": "multi_sensor_naval_event", "sourceId": "E-TICTAC-2004"}},
                {"id": "system:facility:USS-Princeton", "label": "USS Princeton", "type": "FACILITY",
                 "metadata": {"facilityType": "AEGIS RADAR", "sourceId": "E-TICTAC-2004"}},
            ],
            "edges": [
                {"id": "edge:E-TICTAC-2004:USS-Princeton", "source": "system:event:E-TICTAC-2004",
                 "target": "system:facility:USS-Princeton", "relationship": "ASSOCIATED_WITH", "weight": 1,
                 "rationale": ["System Canon infrastructure context."]},
            ],
            "statistics": {"nodeCount": 2, "edgeCount": 1, "eventCount": 1, "facilityCount": 1},
        }
        fingerprint = json.dumps({"nodes": graph["nodes"], "edges": graph["edges"]}, ensure_ascii=False, separators=(",", ":"))
        payload = {
            "investigationId": investigation_id, "eventId": "E-TICTAC-2004",
            "eventTitle": "Nimitz Tic Tac Encounter", "expectedAggregateRevision": 0,
            "idempotencyKey": "rex-local-trial-nimitz", "workspace": {
                "sourceWorkspaceId": f"workspace:{investigation_id}",
                "nodes": [
                    {"id": node["id"], "kind": "CANONICAL_EVENT" if node["type"] == "EVENT" else "NOTE",
                     "canonicalEventId": "E-TICTAC-2004" if node["type"] == "EVENT" else None,
                     "title": node["label"]} for node in graph["nodes"]
                ], "edges": [{"id": edge["id"], "sourceId": edge["source"], "targetId": edge["target"], "kind": "RELATED"} for edge in graph["edges"]]},
            "viewState": {"activeMode": "OVERVIEW", "focusedEventId": "E-TICTAC-2004", "activeLayers": [], "temporalContext": None, "investigativeScale": None},
            "operationalRevision": {"expectedHeadId": None, "graph": graph, "fingerprint": fingerprint,
                                    "algorithmVersion": "KNOWLEDGE_TOPOLOGY_V1", "recordedAt": "2026-09-27T12:00:00Z"},
        }
        response = session.client.post(f"/api/v1/investigations/{investigation_id}/canon-events", json=payload, headers=session.csrf_headers)
        assert response.status_code == 200
        head = response.json()["activation"]["operationalRevisionHead"]
        assert head["sourceIdentity"] == "E-TICTAC-2004"
        assert head["fingerprint"] == fingerprint
        assert head["graph"] == graph
