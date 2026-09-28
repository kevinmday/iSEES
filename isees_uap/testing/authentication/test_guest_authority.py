from __future__ import annotations

import hashlib
import sqlite3
from concurrent.futures import ThreadPoolExecutor
from datetime import datetime, timedelta, timezone

import pytest
from fastapi.testclient import TestClient

from isees_uap.api import app
from isees_uap.api.v1.authentication import settings
from isees_uap.authentication.config import AuthenticationSettings, authentication_settings
from isees_uap.authentication.guest import GuestAuthority
from isees_uap.authentication.models import GuestSearchOperationState
from isees_uap.authentication.principal import authentication_repository
from isees_uap.authentication.sqlite_repository import SQLiteAuthenticationRepository


ORIGIN = "https://app.example.test"


def config(path, **changes):
    values = dict(database_path=path, secure_cookies=False,
                  guest_credentials_enabled=True, public_app_origin=ORIGIN,
                  guest_credential_ttl_seconds=3600, guest_issuance_max_requests=10,
                  guest_provider_dispatch_enabled=True, guest_search_allowance=2,
                  guest_global_budget_units=2)
    values.update(changes)
    return AuthenticationSettings(**values)


@pytest.fixture
def guest_api(tmp_path):
    repo = SQLiteAuthenticationRepository(tmp_path / "auth.db")
    cfg = config(repo.path)
    app.dependency_overrides[authentication_repository] = lambda: repo
    app.dependency_overrides[settings] = lambda: cfg
    with TestClient(app) as client:
        yield client, repo, cfg
    app.dependency_overrides.clear()


def issue(client):
    return client.post("/api/v1/auth/guest-sessions", headers={
        "Origin": ORIGIN, "Sec-Fetch-Site": "same-origin",
    })


def test_issuance_is_server_held_protected_and_host_only(guest_api):
    client, repo, _ = guest_api
    response = issue(client)
    assert response.status_code == 201
    cookie = client.cookies.get("isees_guest")
    raw_secret = cookie.split(".", 1)[1]
    assert set(response.json()) == {"status", "sessionExpiresAt"}
    assert response.json()["status"] == "ACTIVE"
    assert "guestId" not in response.text and cookie not in response.text and raw_secret not in response.text
    set_cookie = next(x for x in response.headers.get_list("set-cookie") if x.startswith("isees_guest="))
    assert "HttpOnly" in set_cookie and "SameSite=strict" in set_cookie and "Domain=" not in set_cookie
    with sqlite3.connect(repo.path) as db:
        stored = db.execute("SELECT secret_digest FROM guest_credential").fetchone()[0]
        dump = "\n".join(db.iterdump())
    assert stored == hashlib.sha256(raw_secret.encode("ascii")).digest()
    assert raw_secret not in dump
    restored = client.get("/api/v1/auth/guest-session",
                          headers={"X-ISEES-Principal-Id": "guest:forged"})
    assert restored.status_code == 200
    assert restored.json() == response.json()
    assert "guestId" not in restored.text and cookie not in restored.text and raw_secret not in restored.text


def test_issuance_origin_csrf_rotation_expiry_and_revocation(guest_api):
    client, repo, cfg = guest_api
    assert client.post("/api/v1/auth/guest-sessions").status_code == 403
    assert client.post("/api/v1/auth/guest-sessions", headers={"Origin": "https://evil.test"}).status_code == 403
    first = issue(client); old_cookie = client.cookies.get("isees_guest")
    assert issue(client).status_code == 403
    csrf = client.cookies.get("isees_csrf")
    rotated = client.post("/api/v1/auth/guest-sessions", headers={
        "Origin": ORIGIN, "Sec-Fetch-Site": "same-origin", "X-ISEES-CSRF": csrf,
    })
    rotated_cookie = client.cookies.get("isees_guest")
    assert rotated.status_code == 201 and rotated_cookie != old_cookie
    client.cookies.set("isees_guest", old_cookie)
    assert client.get("/api/v1/auth/guest-session").status_code == 401
    current, _ = GuestAuthority(repo, cfg).resolve(rotated_cookie)
    repo.revoke_guest(guest_id=current.guest_id, revoked_at=datetime.now(timezone.utc))
    client.cookies.set("isees_guest", rotated.headers.get_list("set-cookie")[0].split(";", 1)[0].split("=", 1)[1])
    assert client.get("/api/v1/auth/guest-session").status_code == 401

    now = datetime.now(timezone.utc)
    authority = GuestAuthority(repo, cfg, clock=lambda: now)
    issued = authority.issue(scope_digest=b"expiry")
    expired = GuestAuthority(repo, cfg, clock=lambda: now + timedelta(hours=2))
    with pytest.raises(Exception):
        expired.resolve(issued.bearer)


def test_cross_guest_isolation_concurrent_reservation_and_global_exhaustion(tmp_path):
    repo = SQLiteAuthenticationRepository(tmp_path / "auth.db")
    cfg = config(repo.path, guest_search_allowance=1, guest_global_budget_units=1)
    authority = GuestAuthority(repo, cfg)
    one = authority.issue(scope_digest=b"one")
    two = authority.issue(scope_digest=b"two")
    fingerprint = hashlib.sha256(b"governed request").digest()
    def reserve(issued, suffix):
        return authority.reserve(guest_id=issued.identity.guest_id,
                                 operation_id="op_" + suffix, idempotency_key="key_" + suffix,
                                 request_fingerprint=fingerprint)
    with ThreadPoolExecutor(max_workers=2) as pool:
        futures = [pool.submit(reserve, one, "one"), pool.submit(reserve, two, "two")]
    results, errors = [], []
    for future in futures:
        try: results.append(future.result())
        except ValueError as error: errors.append(str(error))
    assert len(results) == 1 and errors == ["GLOBAL_BUDGET_EXHAUSTED"]
    loser = two if results[0].guest_id == one.identity.guest_id else one
    with pytest.raises(ValueError, match="OPERATION_NOT_FOUND"):
        authority.mark_dispatching(results[0].operation_id, loser.identity.guest_id)


def test_replay_conflict_definite_release_and_unknown_are_conservative(tmp_path):
    repo = SQLiteAuthenticationRepository(tmp_path / "auth.db")
    cfg = config(repo.path, guest_search_allowance=2, guest_global_budget_units=2)
    authority = GuestAuthority(repo, cfg)
    guest = authority.issue(scope_digest=b"scope")
    gid = guest.identity.guest_id
    fp = hashlib.sha256(b"request-a").digest()
    original = authority.reserve(guest_id=gid, operation_id="op_a", idempotency_key="key-a",
                                 request_fingerprint=fp)
    replay = authority.reserve(guest_id=gid, operation_id="op_other", idempotency_key="key-a",
                               request_fingerprint=fp)
    alternate_key = authority.reserve(guest_id=gid, operation_id="op_other", idempotency_key="key-b",
                                      request_fingerprint=fp)
    assert replay.operation_id == alternate_key.operation_id == original.operation_id
    with pytest.raises(ValueError, match="IDEMPOTENCY_CONFLICT"):
        authority.reserve(guest_id=gid, operation_id="op_x", idempotency_key="key-a",
                          request_fingerprint=hashlib.sha256(b"changed").digest())
    authority.mark_definitely_undispatched("op_a", gid)
    released = authority.reserve(guest_id=gid, operation_id="op_new", idempotency_key="key-new",
                                 request_fingerprint=fp)
    assert released.state is GuestSearchOperationState.DEFINITELY_UNDISPATCHED

    second = authority.reserve(guest_id=gid, operation_id="op_b", idempotency_key="key-c",
                               request_fingerprint=hashlib.sha256(b"request-b").digest())
    authority.mark_dispatching(second.operation_id, gid)
    unknown = authority.mark_unknown(second.operation_id, gid)
    assert unknown.state is GuestSearchOperationState.UNKNOWN
    assert authority.reserve(guest_id=gid, operation_id="op_retry", idempotency_key="new-key",
                             request_fingerprint=hashlib.sha256(b"request-b").digest()).operation_id == "op_b"
    with sqlite3.connect(repo.path) as db:
        assert db.execute("SELECT reserved_units,charged_units FROM guest_search_budget").fetchone() == (0, 1)


def test_defaults_disable_guest_dispatch_and_account_session_regression(guest_api):
    defaults = authentication_settings({"ISEES_AUTH_ENV": "test",
                                        "ISEES_AUTH_DB_PATH": str(guest_api[1].path)})
    assert not defaults.guest_credentials_enabled and not defaults.guest_provider_dispatch_enabled
    assert defaults.guest_search_allowance == 5
    assert authentication_settings({
        "ISEES_AUTH_ENV": "test", "ISEES_AUTH_DB_PATH": str(guest_api[1].path),
        "ISEES_GUEST_SEARCH_ALLOWANCE": "3",
    }).guest_search_allowance == 3
    client, _, _ = guest_api
    issued = issue(client); assert issued.status_code == 201
    response = client.post("/api/v1/auth/accounts", json={
        "email": "owner@example.test", "password": "correct horse battery staple",
    })
    assert response.status_code == 201 and client.get("/api/v1/auth/session").status_code == 200
    account_csrf = client.cookies.get("isees_csrf")
    assert client.post("/api/v1/auth/logout", headers={"X-ISEES-CSRF": account_csrf}).status_code == 200
    client.cookies.set("isees_guest", issued.headers.get_list("set-cookie")[0].split(";", 1)[0].split("=", 1)[1])
    assert client.get("/api/v1/auth/guest-session").status_code == 401
