from __future__ import annotations

import sqlite3

import pytest
from fastapi.testclient import TestClient

from isees_uap.api import app, clusters_store, report_store
from isees_uap.api.submit_report import KOD_MANAGER
from isees_uap.api.v1.authentication import settings
from isees_uap.api.v1.candidate_evidence import native_case_repository
from isees_uap.api.v1.investigations import repository as investigation_repository
from isees_uap.authentication.config import AuthenticationSettings
from isees_uap.authentication.principal import authentication_repository
from isees_uap.authentication.sqlite_repository import SQLiteAuthenticationRepository
from isees_uap.candidate_evidence.sqlite_native_case_repository import SQLiteNativeCaseDraftRepository
from isees_uap.investigations.sqlite_repository import SQLiteInvestigationRepository

PASSWORD = "correct horse battery staple"
URL = "/api/v1/native-case-drafts"


def field(state="OMITTED", value=None):
    result = {"state": state}
    if value is not None:
        result["value"] = value
    return result


def content():
    return {
        "schemaVersion": "native-case-draft-content/v1",
        "workingTitle": field(), "observationLocation": field(),
        "localObservationDate": field(), "localObservationTime": field(),
        "timezone": field("UNKNOWN"), "observationNarrative": field(),
        "objectShape": field(), "movementBehavior": field(),
        "soundCharacteristics": field(), "lightingVisibility": field(),
        "observerContext": field(), "witnessCount": field(),
        "environmentalConditions": field(),
        "approximateDuration": {"state": "OMITTED"},
        "researcherNotes": field(), "sourceProvenanceStatement": field(),
        "privacyClassification": field("UNKNOWN"),
        "rightsPublicationRestriction": field(),
    }


def command(key="create-1", investigation_id=None):
    result = {"schemaVersion": "native-case-draft-command/v1",
              "content": content(), "idempotencyKey": key}
    if investigation_id is not None:
        result["investigationId"] = investigation_id
    return result


def csrf(client):
    return {"X-ISEES-CSRF": client.cookies.get("isees_csrf")}


@pytest.fixture
def environment(tmp_path):
    auth = SQLiteAuthenticationRepository(tmp_path / "authentication.sqlite3")
    investigations = SQLiteInvestigationRepository(tmp_path / "investigations.sqlite3")
    drafts = SQLiteNativeCaseDraftRepository(tmp_path / "candidate.sqlite3")
    config = AuthenticationSettings(database_path=auth.path, secure_cookies=False,
                                    session_ttl_seconds=3600)
    overrides = {
        authentication_repository: lambda: auth, settings: lambda: config,
        investigation_repository: lambda: investigations,
        native_case_repository: lambda: drafts,
    }
    app.dependency_overrides.update(overrides)
    clients = [TestClient(app), TestClient(app)]
    owners = []
    try:
        for index, client in enumerate(clients):
            response = client.post("/api/v1/auth/accounts", json={
                "email": f"native-case-{index}@example.test", "password": PASSWORD})
            assert response.status_code == 201
            owners.append(response.json()["researcherId"])
        investigations.create(investigation_id="OWNED-A", owner_principal_id=owners[0], title="A")
        investigations.create(investigation_id="OWNED-B", owner_principal_id=owners[1], title="B")
        yield clients, owners, investigations, drafts
    finally:
        for client in clients:
            client.close()
        for dependency in overrides:
            app.dependency_overrides.pop(dependency, None)


def test_authenticated_create_server_owner_incomplete_unknown_and_durable_list(environment):
    (owner_client, _), (owner_id, _), _, drafts = environment
    payload = command(investigation_id="OWNED-A")
    payload["content"]["workingTitle"] = field("SUPPLIED", "  Night\u00a0light  ")
    created = owner_client.post(URL, json=payload, headers=csrf(owner_client))
    assert created.status_code == 201, created.text
    receipt = created.json()
    assert receipt["ownership"] == {"kind": "RESEARCHER_OWNED", "researcherId": owner_id}
    assert receipt["content"]["workingTitle"]["value"] == "Night light"
    assert receipt["content"]["timezone"] == {"state": "UNKNOWN", "value": None}
    assert receipt["content"]["observationNarrative"] == {"state": "OMITTED", "value": None}
    assert receipt["lifecycle"] == "DRAFT" and receipt["operationalMaterialization"] == "NONE"
    candidate_id = receipt["candidateId"]
    assert owner_client.get(f"{URL}/{candidate_id}").json()["candidateId"] == candidate_id
    assert [item["candidateId"] for item in owner_client.get(URL).json()["items"]] == [candidate_id]
    restored = SQLiteNativeCaseDraftRepository(drafts.path)
    assert restored.get(principal_id=owner_id, candidate_id=candidate_id)["content"] == receipt["content"]


def test_revision_update_replay_and_conflicts_are_non_destructive(environment):
    (client, _), _, _, _ = environment
    created = client.post(URL, json=command(), headers=csrf(client)).json()
    candidate_id = created["candidateId"]
    update = command("update-1")
    update.update({"expectedRevision": 0})
    update["content"]["researcherNotes"] = field("SUPPLIED", "retain this")
    response = client.put(f"{URL}/{candidate_id}", json=update, headers=csrf(client))
    assert response.status_code == 200 and response.json()["revision"] == 1
    assert response.json()["freshnessToken"] == f"{candidate_id}:1"
    replay = client.put(f"{URL}/{candidate_id}", json=update, headers=csrf(client))
    assert replay.status_code == 200 and replay.json()["idempotencyDisposition"] == "REPLAYED"
    stale = {**update, "idempotencyKey": "stale"}
    assert client.put(f"{URL}/{candidate_id}", json=stale, headers=csrf(client)).status_code == 409
    reused = command("update-1")
    reused.update({"expectedRevision": 1})
    assert client.put(f"{URL}/{candidate_id}", json=reused, headers=csrf(client)).status_code == 409
    unchanged = client.get(f"{URL}/{candidate_id}").json()
    assert unchanged["revision"] == 1
    assert unchanged["content"]["researcherNotes"]["value"] == "retain this"


def test_create_idempotency_and_strict_malformed_rejection(environment):
    (client, _), _, _, _ = environment
    payload = command("same")
    first = client.post(URL, json=payload, headers=csrf(client))
    replay = client.post(URL, json=payload, headers=csrf(client))
    assert first.status_code == 201 and replay.status_code == 201
    assert first.json()["candidateId"] == replay.json()["candidateId"]
    assert replay.json()["idempotencyDisposition"] == "REPLAYED"
    conflicting = command("same")
    conflicting["content"]["workingTitle"] = field("UNKNOWN")
    assert client.post(URL, json=conflicting, headers=csrf(client)).status_code == 409
    cases = []
    extra = command("extra"); extra["ownerId"] = "forged"; cases.append(extra)
    bad_date = command("date"); bad_date["content"]["localObservationDate"] = field("SUPPLIED", "2026-02-30"); cases.append(bad_date)
    bad_time = command("time"); bad_time["content"]["localObservationTime"] = field("SUPPLIED", "25:61"); cases.append(bad_time)
    bad_zone = command("zone"); bad_zone["content"]["timezone"] = field("SUPPLIED", "Mars/Base"); cases.append(bad_zone)
    bad_count = command("count"); bad_count["content"]["witnessCount"] = field("SUPPLIED", "2"); cases.append(bad_count)
    bad_duration = command("duration"); bad_duration["content"]["approximateDuration"] = {"state": "SUPPLIED", "seconds": -1}; cases.append(bad_duration)
    controls = command("controls"); controls["content"]["researcherNotes"] = field("SUPPLIED", "bad\u0000text"); cases.append(controls)
    canon = command("canon"); canon["content"]["systemCanonIdentity"] = "CANON-1"; cases.append(canon)
    for invalid in cases:
        assert client.post(URL, json=invalid, headers=csrf(client)).status_code == 422


def test_cross_owner_draft_and_investigation_association_are_denied(environment):
    (client_a, client_b), _, _, _ = environment
    created = client_a.post(URL, json=command(investigation_id="OWNED-A"), headers=csrf(client_a)).json()
    candidate_id = created["candidateId"]
    assert client_b.get(f"{URL}/{candidate_id}").status_code == 404
    assert client_b.get(URL).json()["items"] == []
    assert client_b.post(URL, json=command("foreign", "OWNED-A"), headers=csrf(client_b)).status_code == 404
    assert client_a.post(URL, json=command("missing", "MISSING"), headers=csrf(client_a)).status_code == 404
    update = command("foreign-update", "OWNED-B"); update["expectedRevision"] = 0
    assert client_a.put(f"{URL}/{candidate_id}", json=update, headers=csrf(client_a)).status_code == 404
    assert client_a.get(f"{URL}/{candidate_id}").json()["investigationId"] == "OWNED-A"


def test_draft_has_no_activation_canon_candidate_evidence_or_kod_side_effect(environment, monkeypatch):
    (client, _), _, investigations, drafts = environment
    calls = []
    monkeypatch.setattr(KOD_MANAGER, "execute", lambda *args, **kwargs: calls.append((args, kwargs)))
    clusters_before, reports_before = list(clusters_store), dict(report_store)
    with sqlite3.connect(investigations.path) as connection:
        parent_before = connection.execute("SELECT * FROM investigation WHERE investigation_id='OWNED-A'").fetchone()
    response = client.post(URL, json=command(investigation_id="OWNED-A"), headers=csrf(client))
    assert response.status_code == 201
    with sqlite3.connect(investigations.path) as connection:
        assert connection.execute("SELECT * FROM investigation WHERE investigation_id='OWNED-A'").fetchone() == parent_before
    with sqlite3.connect(drafts.path) as connection:
        assert connection.execute("SELECT count(*) FROM candidate_evidence").fetchone()[0] == 0
        assert connection.execute("SELECT count(*) FROM native_case_draft").fetchone()[0] == 1
    assert calls == [] and clusters_store == clusters_before and report_store == reports_before
    body = response.json()
    assert body["systemCanonIdentity"] is None and body["operationalMaterialization"] == "NONE"


def test_update_cors_preflight_allows_browser_contract(environment):
    (client, _), _, _, _ = environment
    response = client.options(URL + "/candidate", headers={
        "Origin": "http://localhost:5173",
        "Access-Control-Request-Method": "PUT",
        "Access-Control-Request-Headers": "content-type,x-isees-csrf",
    })
    assert response.status_code == 200
    assert "PUT" in response.headers["access-control-allow-methods"]
