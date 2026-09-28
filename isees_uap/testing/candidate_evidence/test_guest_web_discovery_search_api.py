from __future__ import annotations

import sqlite3
from concurrent.futures import ThreadPoolExecutor
from threading import Event

import pytest
from fastapi.testclient import TestClient

from isees_uap.api import app
from isees_uap.api.v1.authentication import settings
from isees_uap.api.v1.candidate_evidence import web_discovery_runtime
from isees_uap.authentication.config import AuthenticationSettings
from isees_uap.authentication.guest import GuestAuthority
from isees_uap.authentication.principal import authentication_repository
from isees_uap.authentication.sqlite_repository import SQLiteAuthenticationRepository
from isees_uap.candidate_evidence.web_discovery_fixture import DeterministicWebDiscoveryFixture
from isees_uap.candidate_evidence.web_discovery_runtime import WebDiscoverySearchRuntime


ORIGIN = "https://app.example.test"
ENDPOINT = "/api/v1/guest/web-discovery/searches"


def _config(path, **changes):
    values = dict(database_path=path, secure_cookies=False,
                  guest_credentials_enabled=True, public_app_origin=ORIGIN,
                  guest_credential_ttl_seconds=3600, guest_issuance_max_requests=20,
                  guest_provider_dispatch_enabled=True, guest_search_allowance=2,
                  guest_global_budget_units=10)
    values.update(changes)
    return AuthenticationSettings(**values)


def _command(query="one", **changes):
    value = {
        "schemaVersion": "guest-web-discovery-search/v1",
        "operationId": "guest-operation-1", "query": query, "resultLimit": 3,
        "idempotencyKey": "guest-key-1",
        "executionPolicy": {"metadataOnly": True, "aiAssistance": "NONE",
                            "rexExecution": "NONE", "authorizedSpend": 0},
    }
    value.update(changes)
    return value


def _issue(client):
    assert client.post("/api/v1/auth/guest-sessions", headers={
        "Origin": ORIGIN, "Sec-Fetch-Site": "same-origin"}).status_code == 201


def _post(client, body=None, **headers):
    request_headers = {"Origin": ORIGIN, **headers}
    csrf = client.cookies.get("isees_csrf")
    if csrf is not None:
        request_headers["X-ISEES-CSRF"] = csrf
    return client.post(ENDPOINT, json=body or _command(), headers=request_headers)


@pytest.fixture
def guest_search(tmp_path):
    repo = SQLiteAuthenticationRepository(tmp_path / "auth.sqlite3")
    fixture = DeterministicWebDiscoveryFixture()
    runtime = WebDiscoverySearchRuntime(adapter=fixture)
    cfg = _config(repo.path)
    app.dependency_overrides[authentication_repository] = lambda: repo
    app.dependency_overrides[settings] = lambda: cfg
    app.dependency_overrides[web_discovery_runtime] = lambda: runtime
    try:
        with TestClient(app) as client:
            yield client, repo, runtime, cfg
    finally:
        app.dependency_overrides.clear()


def test_first_signed_out_search_is_metadata_only_and_has_zero_durable_effects(guest_search):
    client, repo, runtime, _ = guest_search
    _issue(client)
    response = _post(client)
    assert response.status_code == 200
    body = response.json()
    assert body["schemaVersion"] == "guest-web-discovery-outcome/v1"
    assert body["status"] == body["operationState"] == "COMPLETED"
    assert body["resultCount"] == 1 and body["researcherCharge"] == "0.00"
    assert set(body["effects"].values()) == {"NONE"}
    assert "investigationId" not in body and "manifoldRevisionId" not in body
    assert runtime.adapter_execution_count == 1
    with sqlite3.connect(repo.path) as db:
        assert db.execute("SELECT count(*) FROM researcher_account").fetchone()[0] == 0
        assert db.execute("SELECT count(*) FROM guest_search_operation").fetchone()[0] == 1


def test_missing_forged_revoked_credentials_and_csrf_origin_never_dispatch(guest_search):
    client, repo, runtime, cfg = guest_search
    assert _post(client).status_code == 401
    client.cookies.set("isees_guest", "gcr_forged.secret")
    assert _post(client).status_code == 401
    client.cookies.clear(); _issue(client)
    assert client.post(ENDPOINT, json=_command(), headers={"Origin": ORIGIN}).status_code == 403
    assert _post(client, Origin="https://evil.test").status_code == 403
    guest, _ = GuestAuthority(repo, cfg).resolve(client.cookies.get("isees_guest"))
    from datetime import datetime, timezone
    repo.revoke_guest(guest_id=guest.guest_id, revoked_at=datetime.now(timezone.utc))
    assert _post(client).status_code == 401
    assert runtime.adapter_execution_count == 0


def test_disabled_guest_provider_setting_fails_before_dispatch(guest_search):
    client, repo, runtime, cfg = guest_search
    app.dependency_overrides[settings] = lambda: _config(
        repo.path, guest_provider_dispatch_enabled=False)
    _issue(client)
    response = _post(client)
    assert response.status_code == 503
    assert response.json()["error"]["code"] == "GUEST_SEARCH_UNAVAILABLE"
    assert runtime.adapter_execution_count == 0


def test_guest_runtime_uses_no_fabricated_durable_bindings(guest_search):
    client, _, runtime, _ = guest_search
    _issue(client)
    response = _post(client)
    assert response.status_code == 200
    body = response.json()
    assert not ({"principalId", "investigationId", "expectedInvestigationRevision",
                 "manifoldRevisionId"} & body.keys())
    record = next(iter(runtime._sessions._sessions.values()))
    assert record.request.guest_id.startswith("gst_")
    assert record.request.principal_id is record.request.investigation_id is None
    assert record.request.expected_investigation_revision is None
    assert record.request.manifold_revision_id is None


@pytest.mark.parametrize("allowance,budget,first_ok,code", [
    (1, 10, True, "GUEST_ALLOWANCE_EXHAUSTED"),
    (2, 0, False, "GUEST_GLOBAL_BUDGET_EXHAUSTED"),
])
def test_allowance_and_global_exhaustion_have_zero_extra_provider_calls(
    tmp_path, allowance, budget, first_ok, code,
):
    repo = SQLiteAuthenticationRepository(tmp_path / "auth.sqlite3")
    runtime = WebDiscoverySearchRuntime(adapter=DeterministicWebDiscoveryFixture())
    cfg = _config(repo.path, guest_search_allowance=allowance, guest_global_budget_units=budget)
    app.dependency_overrides.update({authentication_repository: lambda: repo,
                                     settings: lambda: cfg,
                                     web_discovery_runtime: lambda: runtime})
    try:
        with TestClient(app) as client:
            _issue(client)
            if first_ok:
                assert _post(client).status_code == 200
            response = _post(client, _command(query="two", operationId="op-2",
                                              idempotencyKey="key-2"))
            assert response.json()["error"]["code"] == code
            assert runtime.adapter_execution_count == (1 if first_ok else 0)
    finally:
        app.dependency_overrides.clear()


def test_exact_replay_and_different_key_equivalent_request_dispatch_once(guest_search):
    client, _, runtime, _ = guest_search
    _issue(client)
    first = _post(client)
    replay = _post(client)
    alternate = _post(client, _command(operationId="different-operation",
                                       idempotencyKey="different-key"))
    assert first.status_code == replay.status_code == alternate.status_code == 200
    assert first.json()["results"] == replay.json()["results"] == alternate.json()["results"]
    assert alternate.json()["operationId"] == first.json()["operationId"]
    assert runtime.adapter_execution_count == 1


def test_default_five_search_allowance_rejects_sixth_distinct_search_and_replay_is_free(
    tmp_path,
):
    repo = SQLiteAuthenticationRepository(tmp_path / "auth.sqlite3")
    runtime = WebDiscoverySearchRuntime(adapter=DeterministicWebDiscoveryFixture())
    cfg = _config(
        repo.path,
        guest_search_allowance=AuthenticationSettings(
            database_path=repo.path, secure_cookies=False).guest_search_allowance,
        guest_global_budget_units=10,
    )
    app.dependency_overrides.update({authentication_repository: lambda: repo,
                                     settings: lambda: cfg,
                                     web_discovery_runtime: lambda: runtime})
    try:
        with TestClient(app) as client:
            _issue(client)
            responses = [
                _post(client, _command(query=f"distinct {index}",
                                       operationId=f"op-{index}",
                                       idempotencyKey=f"key-{index}"))
                for index in range(1, 6)
            ]
            replay = _post(client, _command(query="distinct 1", operationId="op-1",
                                             idempotencyKey="key-1"))
            sixth = _post(client, _command(query="distinct 6", operationId="op-6",
                                            idempotencyKey="key-6"))
        assert [response.status_code for response in responses] == [200] * 5
        assert replay.status_code == 200
        assert replay.json()["operationId"] == responses[0].json()["operationId"]
        assert sixth.status_code == 429
        assert sixth.json()["error"]["code"] == "GUEST_ALLOWANCE_EXHAUSTED"
        assert runtime.adapter_execution_count == 5
    finally:
        app.dependency_overrides.clear()


class _AmbiguousAdapter(DeterministicWebDiscoveryFixture):
    def search(self, request, cancellation):
        self.execution_count += 1
        raise TimeoutError("ambiguous provider timeout")


class _BlockingAdapter(DeterministicWebDiscoveryFixture):
    def __init__(self):
        super().__init__()
        self.entered, self.release = Event(), Event()

    def search(self, request, cancellation):
        self.entered.set()
        assert self.release.wait(5)
        return super().search(request, cancellation)


def test_different_key_cannot_duplicate_an_inflight_dispatch(guest_search):
    client, _, _, _ = guest_search
    adapter = _BlockingAdapter()
    runtime = WebDiscoverySearchRuntime(adapter=adapter)
    app.dependency_overrides[web_discovery_runtime] = lambda: runtime
    _issue(client)
    with ThreadPoolExecutor(max_workers=1) as pool:
        first = pool.submit(_post, client)
        assert adapter.entered.wait(5)
        duplicate = _post(client, _command(operationId="other-op", idempotencyKey="other-key"))
        assert duplicate.status_code == 202
        assert duplicate.json()["operationState"] == "DISPATCHING"
        adapter.release.set()
        assert first.result().status_code == 200
    assert runtime.adapter_execution_count == 1


def test_uncertain_outcome_is_conservative_and_equivalent_retry_does_not_dispatch(guest_search):
    client, repo, _, _ = guest_search
    runtime = WebDiscoverySearchRuntime(adapter=_AmbiguousAdapter())
    app.dependency_overrides[web_discovery_runtime] = lambda: runtime
    _issue(client)
    first = _post(client)
    retry = _post(client, _command(operationId="retry-op", idempotencyKey="retry-key"))
    assert first.status_code == 503 and first.json()["operationState"] == "UNKNOWN"
    assert retry.status_code == 503 and retry.json()["operationId"] == first.json()["operationId"]
    assert retry.json()["providerCreditUsage"] == "UNKNOWN"
    assert runtime.adapter_execution_count == 1
    with sqlite3.connect(repo.path) as db:
        assert db.execute("SELECT reserved_units,charged_units FROM guest_search_budget").fetchone() == (0, 1)


def test_cross_guest_results_and_duplicate_keys_are_isolated(guest_search):
    first, _, runtime, _ = guest_search
    _issue(first); one = _post(first).json()
    with TestClient(app) as second:
        _issue(second)
        two = _post(second).json()
    assert one["operationId"] != two["operationId"]
    assert "guest-session:" not in str(one) and "guest-session:" not in str(two)
    assert runtime.adapter_execution_count == runtime.session_count == 2


def test_concurrent_reservations_allow_only_one_global_dispatch(tmp_path):
    repo = SQLiteAuthenticationRepository(tmp_path / "auth.sqlite3")
    cfg = _config(repo.path, guest_search_allowance=1, guest_global_budget_units=1)
    runtime = WebDiscoverySearchRuntime(adapter=DeterministicWebDiscoveryFixture())
    app.dependency_overrides.update({authentication_repository: lambda: repo,
                                     settings: lambda: cfg,
                                     web_discovery_runtime: lambda: runtime})
    clients = [TestClient(app), TestClient(app)]
    try:
        for client in clients: _issue(client)
        with ThreadPoolExecutor(max_workers=2) as pool:
            responses = list(pool.map(lambda c: _post(c), clients))
        assert sorted(r.status_code for r in responses) == [200, 503]
        assert runtime.adapter_execution_count == 1
    finally:
        for client in clients: client.close()
        app.dependency_overrides.clear()
