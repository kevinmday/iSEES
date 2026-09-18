from __future__ import annotations

import sqlite3
from uuid import uuid4

import pytest
from fastapi.testclient import TestClient

from isees_uap.api import app
from isees_uap.api.v1.candidate_evidence import (
    repository, web_discovery_runtime,
)
from isees_uap.candidate_evidence.sqlite_repository import SQLiteCandidateEvidenceRepository
from isees_uap.candidate_evidence.web_discovery_fixture import (
    FIXTURE_ADAPTER_ID, FIXTURE_ADAPTER_VERSION,
)
from isees_uap.candidate_evidence.web_discovery_runtime import WebDiscoverySearchRuntime
from isees_uap.testing.authenticated_route_support import (
    TEST_PASSWORD, authenticated_route_session,
)


ENDPOINT = "/api/v1/investigations/investigation-a/candidate-evidence/web-discovery/searches"


def command(query="one", **changes):
    value = {
        "schemaVersion": "web-discovery-search/v1",
        "investigationId": "investigation-a",
        "expectedInvestigationRevision": 0,
        "manifoldRevisionId": "investigation-aggregate:0",
        "searchSessionId": "search-session-1",
        "operationId": "search-operation-1",
        "query": query,
        "resultLimit": 10,
        "adapterId": FIXTURE_ADAPTER_ID,
        "adapterVersion": FIXTURE_ADAPTER_VERSION,
        "idempotencyKey": "search-key-1",
        "executionPolicy": {
            "metadataOnly": True, "aiAssistance": "NONE",
            "rexExecution": "NONE", "authorizedSpend": 0,
        },
    }
    value.update(changes)
    return value


@pytest.fixture
def search_session(tmp_path):
    candidates = SQLiteCandidateEvidenceRepository(tmp_path / "candidates.sqlite3")
    runtime = WebDiscoverySearchRuntime()
    app.dependency_overrides[repository] = lambda: candidates
    app.dependency_overrides[web_discovery_runtime] = lambda: runtime
    try:
        with authenticated_route_session(
            tmp_path / "route", investigation_ids=("investigation-a",)
        ) as session:
            yield session, candidates, runtime
    finally:
        app.dependency_overrides.pop(repository, None)
        app.dependency_overrides.pop(web_discovery_runtime, None)


def post(session, body, headers=None):
    return session.client.post(
        ENDPOINT, json=body, headers=headers if headers is not None else session.csrf_headers)


def test_authenticated_search_projects_ephemeral_metadata_and_zero_effects(search_session):
    session, candidates, runtime = search_session
    aggregate_before = session.investigations.get_empty_aggregate(
        investigation_id="investigation-a", owner_principal_id=session.account_id)
    with sqlite3.connect(session.investigations.path) as connection:
        inbox_before = connection.execute("SELECT count(*) FROM investigation_research_inbox").fetchone()[0]
    response = post(session, command())
    assert response.status_code == 200
    body = response.json()
    assert body["status"] == "COMPLETED" and body["resultCount"] == 1
    assert set(body["results"][0]) == {
        "resultId", "providerResultId", "rank", "title", "providerReturnedUrl",
        "normalizedUrl", "displayUrl", "displayDomain", "snippet", "mediaType",
        "attribution", "retentionRestrictions", "providerMetadata",
    }
    assert "canonicalUrl" not in body["results"][0]
    assert "<" not in body["results"][0]["title"]
    receipt = body["receipt"]
    assert receipt["aiAssistance"] == receipt["rexExecution"] == "NONE"
    assert {receipt[name] for name in (
        "researchInboxEffect", "publicationEffect", "candidateKnowledgeEffect",
        "canonEffect", "graphEffect", "manifoldEffect", "resolveEffect",
    )} == {"NONE"}
    assert [receipt[name] for name in (
        "estimatedProviderCost", "actualProviderCost", "finalCharge",
    )] == [0, 0, 0]
    assert receipt["providerCreditsConsumed"] == 0
    assert receipt["providerCreditUsage"] == "ZERO"
    assert receipt["monetaryCost"] == receipt["researcherCharge"] == "0.00"
    assert receipt["billingTriggered"] is False
    assert candidates.list(
        investigation_id="investigation-a", principal_id=session.account_id,
        limit=10, cursor=None,
    )[0] == []
    aggregate_after = session.investigations.get_empty_aggregate(
        investigation_id="investigation-a", owner_principal_id=session.account_id)
    assert aggregate_after == aggregate_before
    with sqlite3.connect(session.investigations.path) as connection:
        assert connection.execute("SELECT count(*) FROM investigation_research_inbox").fetchone()[0] == inbox_before
    assert runtime.session_count == runtime.adapter_execution_count == 1


def test_zero_results_are_successful_and_idempotent_replay_does_not_execute(search_session):
    session, _, runtime = search_session
    first = post(session, command("zero"))
    replay = post(session, command("zero"))
    assert first.status_code == replay.status_code == 200
    assert first.json() == replay.json()
    assert first.json()["status"] == "ZERO_RESULTS"
    assert first.json()["results"] == []
    assert runtime.session_count == runtime.adapter_execution_count == 1
    conflict = post(session, command("different"))
    assert conflict.status_code == 409
    assert conflict.json()["error"]["code"] == "IDEMPOTENCY_CONFLICT"
    assert runtime.adapter_execution_count == 1


@pytest.mark.parametrize("query,status,http_status,code", [
    ("unavailable", "UNAVAILABLE", 503, "WEB_DISCOVERY_UNAVAILABLE"),
    ("rate limited", "RATE_LIMITED", 429, "WEB_DISCOVERY_RATE_LIMITED"),
    ("provider failure", "FAILED", 502, "WEB_DISCOVERY_PROVIDER_FAILURE"),
    ("cancelled", "CANCELLED", 409, "WEB_DISCOVERY_CANCELLED"),
])
def test_stable_terminal_outcomes(search_session, query, status, http_status, code):
    session, _, _ = search_session
    response = post(session, command(query))
    assert response.status_code == http_status
    assert response.json()["status"] == status
    assert response.json()["error"]["code"] == code


def test_identity_revision_adapter_csrf_and_validation_fail_before_search(search_session):
    session, _, runtime = search_session
    cases = [
        (command(investigationId="other"), 412, "INVESTIGATION_MISMATCH"),
        (command(expectedInvestigationRevision=9), 409, "REVISION_CONFLICT"),
        (command(manifoldRevisionId="investigation-aggregate:9"), 409, "REVISION_CONFLICT"),
        (command(adapterId="live-provider"), 422, "WEB_DISCOVERY_UNSUPPORTED_ADAPTER"),
        (command(adapterVersion="2.0.0"), 422, "WEB_DISCOVERY_UNSUPPORTED_ADAPTER"),
    ]
    for body, status, code in cases:
        response = post(session, body)
        assert response.status_code == status
        assert response.json()["error"]["code"] == code
    assert post(session, command(), headers={}).status_code == 403
    assert post(session, {**command(), "principalId": "browser-authority"}).status_code == 422
    assert post(session, command(query="x" * 2001)).status_code == 422
    assert post(session, command(resultLimit=51)).status_code == 422
    assert runtime.adapter_execution_count == runtime.session_count == 0


def test_unauthenticated_and_authenticated_non_owner_are_rejected(search_session):
    session, _, runtime = search_session
    unauthenticated = TestClient(app)
    try:
        assert unauthenticated.post(ENDPOINT, json=command()).status_code == 401
        account = unauthenticated.post("/api/v1/auth/accounts", json={
            "email": f"other-{uuid4().hex}@example.test", "password": TEST_PASSWORD,
        })
        assert account.status_code == 201
        csrf = {"X-ISEES-CSRF": unauthenticated.cookies.get("isees_csrf")}
        assert unauthenticated.post(ENDPOINT, json=command(), headers=csrf).status_code == 404
    finally:
        unauthenticated.close()
    assert runtime.adapter_execution_count == runtime.session_count == 0


def test_selected_context_is_bounded_and_execution_policy_is_exact(search_session):
    session, _, _ = search_session
    oversized = command(selectedObjectContext={"objectType": "NODE", "objectId": "x" * 201})
    assert post(session, oversized).status_code == 422
    policy = command()
    policy["executionPolicy"] = {**policy["executionPolicy"], "authorizedSpend": 1}
    assert post(session, policy).status_code == 422


@pytest.mark.parametrize("name,value", [
    ("ISEES_WEB_DISCOVERY_SESSION_LIFETIME_SECONDS", "0"),
    ("ISEES_WEB_DISCOVERY_SESSION_LIFETIME_SECONDS", "invalid"),
    ("ISEES_WEB_DISCOVERY_SESSION_CAPACITY", "-1"),
])
def test_invalid_server_owned_session_configuration_fails_closed(monkeypatch, name, value):
    monkeypatch.setenv(name, value)
    with pytest.raises(RuntimeError):
        WebDiscoverySearchRuntime()
