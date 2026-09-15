from __future__ import annotations

import logging
import sqlite3
from datetime import datetime, timedelta, timezone

import pytest
from fastapi.testclient import TestClient

from isees_uap.api import app
from isees_uap.api.v1.authentication import service, settings
from isees_uap.authentication.candidate_access import CandidateAccessPolicy
from isees_uap.authentication.config import AuthenticationSettings
from isees_uap.authentication.errors import InvalidCredentials
from isees_uap.authentication.models import AccountStatus
from isees_uap.authentication.recovery_delivery import (
    RecordingRecoveryDelivery, RecoveryDeliveryError,
)
from isees_uap.authentication.service import AuthenticationService
from isees_uap.authentication.sqlite_repository import SQLiteAuthenticationRepository

OLD_PASSWORD = "correct horse battery staple"
NEW_PASSWORD = "a newly chosen secure password"
ORIGIN = "https://research.example.test"
REQUEST_PATH = "/api/v1/auth/password-recovery/request"
RESET_PATH = "/api/v1/auth/password-recovery/reset"
ACCEPTED = {
    "schemaVersion": "isees-password-recovery-request/v1",
    "status": "ACCEPTED",
    "message": "If an account exists for that email, we sent recovery instructions.",
}
COMPLETED = {
    "schemaVersion": "isees-password-reset/v1",
    "status": "COMPLETED",
    "message": "Your password has been reset. Sign in with your new password.",
}
INVALID = {
    "schemaVersion": "isees-password-reset/v1",
    "status": "INVALID",
    "message": "This password reset link is invalid or has expired.",
}


class Clock:
    def __init__(self) -> None:
        self.now = datetime(2026, 9, 15, 12, tzinfo=timezone.utc)

    def __call__(self) -> datetime:
        return self.now


class FailingDelivery:
    def deliver(self, record) -> None:
        del record
        raise RecoveryDeliveryError("provider-secret-detail")


@pytest.fixture
def recovery_api(tmp_path):
    clock = Clock()
    repository = SQLiteAuthenticationRepository(tmp_path / "authentication.db", clock=clock)
    delivery = RecordingRecoveryDelivery()
    svc = AuthenticationService(
        repository, session_ttl_seconds=3600, clock=clock,
        recovery_delivery=delivery,
        recovery_entropy=lambda size: bytes([len(delivery.records) + 1]) * size,
        recovery_max_requests=3,
    )
    config = AuthenticationSettings(
        database_path=repository.path, secure_cookies=False,
        password_recovery_enabled=True, public_app_origin=ORIGIN,
    )
    app.dependency_overrides[settings] = lambda: config
    app.dependency_overrides[service] = lambda: svc
    with TestClient(app) as client:
        yield client, svc, repository, delivery, clock, config
    app.dependency_overrides.clear()


def _headers(origin=ORIGIN):
    return {"Origin": origin} if origin is not None else {}


def _request(client, email="researcher@example.test", **kwargs):
    return client.post(REQUEST_PATH, json={"email": email}, headers=_headers(), **kwargs)


def _assert_safe_headers(response):
    assert response.headers["cache-control"] == "no-store"
    assert response.headers["referrer-policy"] == "no-referrer"
    assert response.headers["x-content-type-options"] == "nosniff"


def test_request_exact_neutral_contract_for_all_identity_states(recovery_api):
    client, svc, repository, delivery, _, _ = recovery_api
    active = svc.create_account(email="researcher@example.test", password=OLD_PASSWORD)
    disabled = svc.create_account(email="disabled@example.test", password=OLD_PASSWORD)
    repository.set_account_status(
        account_id=disabled.account_id, status=AccountStatus.DISABLED,
        occurred_at=datetime.now(timezone.utc),
    )
    excluded = svc.create_account(email="excluded@example.test", password=OLD_PASSWORD)
    del active, excluded
    responses = [
        _request(client), _request(client, "missing@example.test"),
        _request(client, "disabled@example.test"),
    ]
    svc.candidate_access = CandidateAccessPolicy(
        enabled=True, approved_emails=frozenset({"researcher@example.test"}),
    )
    responses.append(_request(client, "excluded@example.test"))
    responses.extend(_request(client) for _ in range(4))
    assert all(response.status_code == 202 and response.json() == ACCEPTED
               for response in responses)
    assert all("token" not in response.text.lower() and "http" not in response.text.lower()
               for response in responses)
    assert len(delivery.records) == 3
    _assert_safe_headers(responses[-1])


def test_delivery_failure_is_neutral_and_logs_only_fixed_text(recovery_api, caplog):
    client, svc, _, _, _, _ = recovery_api
    secret_email = "sensitive@example.test"
    svc.create_account(email=secret_email, password=OLD_PASSWORD)
    svc.recovery_delivery = FailingDelivery()
    with caplog.at_level(logging.ERROR):
        response = _request(client, secret_email)
    assert response.status_code == 202 and response.json() == ACCEPTED
    logs = caplog.text
    assert "Password recovery delivery was not completed" in logs
    assert "category=internal_adapter_contract" in logs
    assert secret_email not in logs and "provider-secret-detail" not in logs
    _assert_safe_headers(response)


@pytest.mark.parametrize("body", ["{", "[]", '{"email":"invalid"}', '{"email":"x@y.z","extra":1}'])
def test_malformed_json_and_structure_fail_safely(recovery_api, body):
    client, *_ = recovery_api
    response = client.post(
        REQUEST_PATH, content=body, headers={"Content-Type": "application/json", "Origin": ORIGIN},
    )
    assert response.status_code == 400
    assert response.json()["error"]["message"] == "The request is invalid"
    assert "x@y.z" not in response.text
    _assert_safe_headers(response)


def test_non_json_and_disabled_recovery_fail_closed(recovery_api):
    client, _, _, _, _, config = recovery_api
    non_json = client.post(REQUEST_PATH, content="email=x", headers=_headers())
    assert non_json.status_code == 415
    _assert_safe_headers(non_json)
    app.dependency_overrides[settings] = lambda: AuthenticationSettings(
        database_path=config.database_path, secure_cookies=False,
    )
    disabled = client.post(REQUEST_PATH, json={"email": "missing@example.test"})
    assert disabled.status_code == 404
    assert disabled.json()["error"]["code"] == "NOT_FOUND"
    _assert_safe_headers(disabled)


@pytest.mark.parametrize("origin", ["https://attacker.test", "null", "*", "not an origin"])
def test_untrusted_origins_are_rejected(recovery_api, origin):
    client, *_ = recovery_api
    response = client.post(REQUEST_PATH, json={"email": "missing@example.test"},
                           headers=_headers(origin))
    assert response.status_code == 403
    _assert_safe_headers(response)


def test_matching_or_absent_origin_is_accepted_and_host_metadata_is_ignored(recovery_api):
    client, svc, _, delivery, _, _ = recovery_api
    svc.create_account(email="researcher@example.test", password=OLD_PASSWORD)
    matching = _request(client)
    absent = client.post(REQUEST_PATH, json={"email": "missing@example.test"})
    hostile_forwarded = client.post(
        REQUEST_PATH, json={"email": "researcher@example.test"},
        headers={"Origin": ORIGIN, "X-Forwarded-Host": "attacker.test", "Referer": "https://attacker.test"},
    )
    assert [response.status_code for response in (matching, absent, hostile_forwarded)] == [202] * 3
    assert len(delivery.records) == 2


def test_reset_success_changes_password_revokes_only_target_sessions(recovery_api):
    client, svc, repository, delivery, _, _ = recovery_api
    account = svc.create_account(email="researcher@example.test", password=OLD_PASSWORD)
    other = svc.create_account(email="other@example.test", password=OLD_PASSWORD)
    svc.login(email=account.email, password=OLD_PASSWORD)
    svc.login(email=account.email, password=OLD_PASSWORD)
    svc.login(email=other.email, password=OLD_PASSWORD)
    _request(client)
    token = delivery.records[-1].capability.raw_token
    response = client.post(RESET_PATH, json={"token": token, "newPassword": NEW_PASSWORD},
                           headers=_headers())
    assert response.status_code == 200 and response.json() == COMPLETED
    assert not response.headers.get_list("set-cookie")
    _assert_safe_headers(response)
    with pytest.raises(InvalidCredentials):
        svc.login(email=account.email, password=OLD_PASSWORD)
    svc.login(email=account.email, password=NEW_PASSWORD)
    with sqlite3.connect(repository.path) as connection:
        assert connection.execute(
            "SELECT count(*) FROM authenticated_session WHERE account_id=? AND revoked_at IS NULL",
            (other.account_id,),
        ).fetchone()[0] == 1


def test_all_unusable_tokens_share_exact_contract(recovery_api):
    client, svc, _, delivery, clock, _ = recovery_api
    svc.create_account(email="researcher@example.test", password=OLD_PASSWORD)
    tokens = {}
    _request(client)
    tokens["superseded"] = delivery.records[-1].capability.raw_token
    clock.now += timedelta(seconds=1)
    _request(client)
    tokens["used"] = delivery.records[-1].capability.raw_token
    assert client.post(RESET_PATH, json={"token": tokens["used"], "newPassword": NEW_PASSWORD},
                       headers=_headers()).status_code == 200
    clock.now += timedelta(seconds=1)
    _request(client)
    tokens["expired"] = delivery.records[-1].capability.raw_token
    clock.now += timedelta(minutes=31)
    candidates = ["", "malformed", "A" * 300, tokens["superseded"],
                  tokens["used"], tokens["expired"]]
    responses = [client.post(RESET_PATH, json={"token": token, "newPassword": NEW_PASSWORD},
                             headers=_headers()) for token in candidates]
    assert all(response.status_code == 400 and response.json() == INVALID
               for response in responses)
    assert all(not response.headers.get_list("set-cookie") for response in responses)
    _assert_safe_headers(responses[0])


def test_password_policy_and_redirect_input_fail_without_echo(recovery_api):
    client, svc, _, delivery, _, _ = recovery_api
    svc.create_account(email="researcher@example.test", password=OLD_PASSWORD)
    _request(client)
    token = delivery.records[-1].capability.raw_token
    weak = "too-short"
    response = client.post(RESET_PATH, json={"token": token, "newPassword": weak},
                           headers=_headers())
    assert response.status_code == 400
    assert response.json()["error"]["code"] == "PASSWORD_POLICY"
    assert weak not in response.text and token not in response.text
    redirect = client.post(RESET_PATH, json={
        "token": token, "newPassword": NEW_PASSWORD, "redirect": "https://attacker.test",
    }, headers=_headers())
    assert redirect.status_code == 400
    assert "attacker" not in redirect.text
    _assert_safe_headers(redirect)
