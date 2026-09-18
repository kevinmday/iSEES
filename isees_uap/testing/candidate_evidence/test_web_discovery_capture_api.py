from __future__ import annotations

from datetime import datetime, timedelta, timezone
import sqlite3
from uuid import uuid4

import pytest
from fastapi.testclient import TestClient

from isees_uap.api import app
from isees_uap.api.v1.candidate_evidence import repository, web_discovery_runtime
from isees_uap.candidate_evidence.sqlite_repository import SQLiteCandidateEvidenceRepository
from isees_uap.candidate_evidence.web_discovery_fixture import DeterministicWebDiscoveryFixture
from isees_uap.candidate_evidence.web_discovery_runtime import WebDiscoverySearchRuntime
from isees_uap.testing.authenticated_route_support import TEST_PASSWORD, authenticated_route_session


BASE = "/api/v1/investigations/investigation-a/candidate-evidence"
SEARCH = BASE + "/web-discovery/searches"
CAPTURE = BASE + "/web-discovery/captures"


class Clock:
    def __init__(self):
        self.value = datetime(2026, 1, 2, 3, 4, 5, tzinfo=timezone.utc)

    def __call__(self):
        return self.value


def search_command(session="session-1", operation="search-1", key="search-key-1", **changes):
    value = {
        "schemaVersion": "web-discovery-search/v1", "investigationId": "investigation-a",
        "expectedInvestigationRevision": 0, "manifoldRevisionId": "investigation-aggregate:0",
        "searchSessionId": session, "operationId": operation, "query": "multiple",
        "resultLimit": 10, "idempotencyKey": key,
        "executionPolicy": {"metadataOnly": True, "aiAssistance": "NONE",
                            "rexExecution": "NONE", "authorizedSpend": 0},
    }
    value.update(changes)
    return value


def capture_command(result_id="opaque-result", session="session-1", key="capture-key-1", **changes):
    value = {
        "schemaVersion": "web-discovery-capture/v1", "investigationId": "investigation-a",
        "expectedInvestigationRevision": 0, "manifoldRevisionId": "investigation-aggregate:0",
        "searchSessionId": session, "resultId": result_id, "operationId": "capture-1",
        "idempotencyKey": key, "researcherConfirmation": True,
        "researcherNote": "Selected after human review.",
    }
    value.update(changes)
    return value


@pytest.fixture
def capture_session(tmp_path):
    candidates = SQLiteCandidateEvidenceRepository(tmp_path / "candidates.sqlite3")
    clock = Clock()
    runtime = WebDiscoverySearchRuntime(
        clock=clock, lifetime_seconds=60,
        adapter=DeterministicWebDiscoveryFixture())
    app.dependency_overrides[repository] = lambda: candidates
    app.dependency_overrides[web_discovery_runtime] = lambda: runtime
    try:
        with authenticated_route_session(
            tmp_path / "route", investigation_ids=("investigation-a", "investigation-b")
        ) as session:
            yield session, candidates, runtime, clock
    finally:
        app.dependency_overrides.pop(repository, None)
        app.dependency_overrides.pop(web_discovery_runtime, None)


def post(session, url, body, headers=None):
    return session.client.post(url, json=body,
                               headers=session.csrf_headers if headers is None else headers)


def searched(capture_session, *, command=None):
    session, _, runtime, _ = capture_session
    before = runtime.adapter_execution_count
    response = post(session, SEARCH, command or search_command())
    assert response.status_code == 200
    assert runtime.adapter_execution_count == before + 1
    return response.json()


def test_search_alone_creates_zero_candidates_and_capture_before_search_fails(capture_session):
    session, candidates, _, _ = capture_session
    assert post(session, CAPTURE, capture_command()).status_code == 410
    result = searched(capture_session)
    assert result["resultCount"] == 3
    assert candidates.list(investigation_id="investigation-a", principal_id=session.account_id,
                           limit=10, cursor=None)[0] == []


def test_capture_requires_authentication_csrf_and_ownership(capture_session):
    session, _, runtime, _ = capture_session
    result_id = searched(capture_session)["results"][0]["resultId"]
    anonymous = TestClient(app)
    try:
        assert anonymous.post(CAPTURE, json=capture_command(result_id)).status_code == 401
        account = anonymous.post("/api/v1/auth/accounts", json={
            "email": f"other-{uuid4().hex}@example.test", "password": TEST_PASSWORD})
        assert account.status_code == 201
        headers = {"X-ISEES-CSRF": anonymous.cookies.get("isees_csrf")}
        assert anonymous.post(CAPTURE, json=capture_command(result_id), headers=headers).status_code == 404
    finally:
        anonymous.close()
    assert post(session, CAPTURE, capture_command(result_id), headers={}).status_code == 403
    assert runtime.adapter_execution_count == 1


def test_identity_revision_confirmation_and_extra_metadata_fail_closed(capture_session):
    session, candidates, runtime, _ = capture_session
    result_id = searched(capture_session)["results"][0]["resultId"]
    cases = [
        (capture_command(result_id, investigationId="investigation-b"), 412, "INVESTIGATION_MISMATCH"),
        (capture_command(result_id, expectedInvestigationRevision=1), 409, "REVISION_CONFLICT"),
        (capture_command(result_id, manifoldRevisionId="investigation-aggregate:1"), 409, "REVISION_CONFLICT"),
    ]
    for body, status, code in cases:
        response = post(session, CAPTURE, body)
        assert response.status_code == status and response.json()["error"]["code"] == code
    for changes in ({"researcherConfirmation": False}, {"researcherConfirmation": None},
                    {"title": "browser"}, {"url": "https://evil.test"}, {"snippet": "browser"},
                    {"providerMetadata": {}}, {"origin": "DISCOVERY"}, {"lifecycleState": "ADMITTED"}):
        assert post(session, CAPTURE, capture_command(result_id, **changes)).status_code == 422
    assert candidates.list(investigation_id="investigation-a", principal_id=session.account_id,
                           limit=10, cursor=None)[0] == []
    assert runtime.adapter_execution_count == 1


def test_missing_mismatched_cross_scope_and_expired_sessions(capture_session):
    session, candidates, runtime, clock = capture_session
    first = searched(capture_session)
    missing = post(session, CAPTURE, capture_command("missing"))
    assert missing.status_code == 409 and missing.json()["error"]["code"] == "WEB_DISCOVERY_RESULT_NOT_FOUND"
    second = searched(capture_session, command=search_command("session-2", "search-2", "search-key-2"))
    mismatch = post(session, CAPTURE, capture_command(first["results"][0]["resultId"], session="session-2"))
    assert mismatch.status_code == 409 and mismatch.json()["error"]["code"] == "WEB_DISCOVERY_RESULT_MISMATCH"
    cross = runtime.resolve_capture
    with pytest.raises(Exception) as principal_error:
        cross(principal_id="other", investigation_id="investigation-a", expected_investigation_revision=0,
              manifold_revision_id="investigation-aggregate:0", search_session_id="session-1",
              result_id=first["results"][0]["resultId"])
    assert principal_error.value.code == "WEB_DISCOVERY_PRINCIPAL_MISMATCH"
    with pytest.raises(Exception) as investigation_error:
        cross(principal_id=session.account_id, investigation_id="investigation-b", expected_investigation_revision=0,
              manifold_revision_id="investigation-aggregate:0", search_session_id="session-1",
              result_id=first["results"][0]["resultId"])
    assert investigation_error.value.code == "WEB_DISCOVERY_INVESTIGATION_MISMATCH"
    clock.value += timedelta(seconds=60)
    expired = post(session, CAPTURE, capture_command(second["results"][0]["resultId"], session="session-2"))
    assert expired.status_code == 410 and expired.json()["error"]["code"] == "WEB_DISCOVERY_SESSION_EXPIRED"
    assert candidates.list(investigation_id="investigation-a", principal_id=session.account_id,
                           limit=10, cursor=None)[0] == []


def test_capture_creates_one_review_only_candidate_without_provider_or_network(capture_session, monkeypatch):
    session, candidates, runtime, _ = capture_session
    search = searched(capture_session)
    result = search["results"][1]
    executions = runtime.adapter_execution_count
    monkeypatch.setattr(runtime._adapter, "search", lambda *args, **kwargs: pytest.fail("adapter attempted"))
    import socket
    monkeypatch.setattr(socket, "create_connection", lambda *args, **kwargs: pytest.fail("network attempted"))
    response = post(session, CAPTURE, capture_command(result["resultId"]))
    assert response.status_code == 201
    body = response.json()
    assert runtime.adapter_execution_count == executions
    assert (body["origin"], body["intakePathway"], body["visibleOrigin"]) == (
        "DISCOVERY", "WEB_DISCOVERY", "WEB_DISCOVERED")
    assert (body["lifecycleState"], body["acquisitionState"], body["publicationState"]) == (
        "DISCOVERED", "NOT_REQUESTED", "NOT_PUBLISHED")
    items, _ = candidates.list(investigation_id="investigation-a", principal_id=session.account_id,
                               limit=10, cursor=None)
    assert len(items) == 1 and items[0]["candidateId"] == body["candidateId"]
    assert runtime._sessions.project(search_session_id="session-1", principal_id=session.account_id,
        investigation_id="investigation-a", expected_investigation_revision=0,
        manifold_revision_id="investigation-aggregate:0").capture_count == 1


def test_lineage_receipt_survives_restart_and_all_effects_are_zero(capture_session):
    session, candidates, _, _ = capture_session
    before = session.investigations.get_empty_aggregate(
        investigation_id="investigation-a", owner_principal_id=session.account_id)
    with sqlite3.connect(session.investigations.path) as connection:
        inbox_before = connection.execute("SELECT count(*) FROM investigation_research_inbox").fetchone()[0]
    search = searched(capture_session)
    selected = search["results"][0]
    body = post(session, CAPTURE, capture_command(selected["resultId"])).json()
    restored = SQLiteCandidateEvidenceRepository(candidates.path).get(
        investigation_id="investigation-a", candidate_id=body["candidateId"], principal_id=session.account_id)
    assert restored["source"]["title"] == selected["title"]
    assert restored["lineage"]["intakeProvenance"]["exactSelectedResult"]["providerMetadata"] == selected["providerMetadata"]
    receipt = restored["lineage"]["captureReceipt"]
    assert receipt["normalizedQuery"] == search["normalizedQuery"]
    assert receipt["principalAuthority"] == session.account_id
    assert [receipt[key] for key in ("estimatedProviderCost", "actualProviderCost", "finalCharge")] == [0, 0, 0]
    assert {receipt[key] for key in ("aiAssistance", "rexExecution", "researchInboxEffect",
        "publicationEffect", "candidateKnowledgeEffect", "canonEffect", "graphEffect",
        "manifoldEffect", "resolveEffect")} == {"NONE"}
    after = session.investigations.get_empty_aggregate(
        investigation_id="investigation-a", owner_principal_id=session.account_id)
    assert after == before
    with sqlite3.connect(session.investigations.path) as connection:
        assert connection.execute("SELECT count(*) FROM investigation_research_inbox").fetchone()[0] == inbox_before


def test_idempotent_replay_and_changed_governed_input(capture_session):
    session, candidates, runtime, _ = capture_session
    search = searched(capture_session)
    first_id, second_id = search["results"][0]["resultId"], search["results"][1]["resultId"]
    first = post(session, CAPTURE, capture_command(first_id))
    replay = post(session, CAPTURE, capture_command(first_id))
    assert first.status_code == 201 and replay.status_code == 200
    assert first.json()["candidateId"] == replay.json()["candidateId"]
    assert replay.json()["idempotencyDisposition"] == replay.json()["receipt"]["idempotencyDisposition"] == "REPLAYED"
    conflict = post(session, CAPTURE, capture_command(second_id))
    assert conflict.status_code == 409 and conflict.json()["error"]["code"] == "IDEMPOTENCY_KEY_REUSE"
    duplicate = post(session, CAPTURE, capture_command(first_id, key="capture-key-2"))
    assert duplicate.status_code == 200 and duplicate.json()["candidateId"] == first.json()["candidateId"]
    origin_conflict = post(session, CAPTURE, capture_command(
        first_id, key="capture-key-3", operationId="different-capture-operation"))
    assert origin_conflict.status_code == 409
    assert origin_conflict.json()["error"]["code"] == "ORIGIN_IDENTITY_CONFLICT"
    assert len(candidates.list(investigation_id="investigation-a", principal_id=session.account_id,
                               limit=10, cursor=None)[0]) == 1
    assert runtime._sessions.project(search_session_id="session-1", principal_id=session.account_id,
        investigation_id="investigation-a", expected_investigation_revision=0,
        manifold_revision_id="investigation-aggregate:0").capture_count == 1


def test_repeated_search_duplicate_returns_stable_candidate_identity_without_other_effects(capture_session):
    session, candidates, runtime, _ = capture_session
    before = session.investigations.get_empty_aggregate(
        investigation_id="investigation-a", owner_principal_id=session.account_id)
    with sqlite3.connect(session.investigations.path) as connection:
        inbox_before = connection.execute(
            "SELECT count(*) FROM investigation_research_inbox").fetchone()[0]

    first_search = searched(capture_session)
    first = post(session, CAPTURE, capture_command(first_search["results"][0]["resultId"]))
    assert first.status_code == 201
    second_search = searched(capture_session, command=search_command(
        "session-2", "search-2", "search-key-2"))
    duplicate = post(session, CAPTURE, capture_command(
        second_search["results"][0]["resultId"], session="session-2",
        key="capture-key-2", operationId="capture-2"))

    assert duplicate.status_code == 409
    assert duplicate.json() == {"error": {
        "code": "WEB_DISCOVERY_ALREADY_CAPTURED",
        "message": "Web Discovery result is already captured",
        "existingCandidateId": first.json()["candidateId"],
    }}
    items, _ = candidates.list(investigation_id="investigation-a",
                               principal_id=session.account_id, limit=10, cursor=None)
    assert len(items) == 1 and items[0]["candidateId"] == first.json()["candidateId"]
    assert session.investigations.get_empty_aggregate(
        investigation_id="investigation-a", owner_principal_id=session.account_id) == before
    with sqlite3.connect(session.investigations.path) as connection:
        assert connection.execute(
            "SELECT count(*) FROM investigation_research_inbox").fetchone()[0] == inbox_before
    assert runtime._sessions.project(
        search_session_id="session-2", principal_id=session.account_id,
        investigation_id="investigation-a", expected_investigation_revision=0,
        manifold_revision_id="investigation-aggregate:0").capture_count == 0


def test_capture_candidate_uses_existing_review_lifecycle(capture_session):
    session, _, _, _ = capture_session
    result_id = searched(capture_session)["results"][0]["resultId"]
    candidate = post(session, CAPTURE, capture_command(result_id)).json()
    url = f"{BASE}/{candidate['candidateId']}/lifecycle-transitions"
    referenced = post(session, url, {
        "schemaVersion": "candidate-evidence-command/v1", "investigationId": "investigation-a",
        "expectedRevision": 0, "to": "REFERENCED", "idempotencyKey": "review-1"})
    assert referenced.status_code == 200 and referenced.json()["lifecycleState"] == "REFERENCED"
    transition = post(session, url, {
        "schemaVersion": "candidate-evidence-command/v1", "investigationId": "investigation-a",
        "expectedRevision": 1, "to": "IN_REVIEW", "idempotencyKey": "review-2"})
    assert transition.status_code == 200 and transition.json()["lifecycleState"] == "IN_REVIEW"
