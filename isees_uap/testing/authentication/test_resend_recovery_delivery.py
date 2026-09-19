from __future__ import annotations

import dataclasses
import json
import socket
import ssl
import threading
from datetime import datetime, timedelta, timezone
from http.server import BaseHTTPRequestHandler, ThreadingHTTPServer
from urllib.error import URLError

import pytest

from isees_uap.api import create_application
from isees_uap.api.v1.authentication import configured_recovery_delivery, settings
from isees_uap.authentication.config import authentication_settings
from isees_uap.authentication.models import IssuedRecoveryCapability, RecoveryDeliveryRecord
from isees_uap.authentication.recovery_delivery import (
    RESEND_EMAIL_ENDPOINT,
    RESEND_TIMEOUT_SECONDS,
    RESEND_USER_AGENT,
    RecoveryDeliveryError,
    ResendRecoveryDelivery,
    build_reset_url,
)

SYNTHETIC_KEY = "synthetic-sending-key"
SYNTHETIC_TOKEN = "capability+/with unsafe characters"
DESTINATION = "researcher@example.test"


def enabled(**overrides: str) -> dict[str, str]:
    values = {
        "ISEES_AUTH_ENV": "production",
        "ISEES_PASSWORD_RECOVERY_ENABLED": "true",
        "ISEES_PUBLIC_APP_ORIGIN": "https://app.example.test",
        "ISEES_RECOVERY_DELIVERY_MODE": "resend",
        "ISEES_RECOVERY_FROM_EMAIL": "onboarding@resend.dev",
        "ISEES_RECOVERY_FROM_NAME": "iSEES Research",
        "ISEES_RESEND_API_KEY": SYNTHETIC_KEY,
    }
    values.update(overrides)
    return values


class FakeTransport:
    def __init__(self, response=(200, b'{"id":"synthetic-message"}'), failure=None):
        self.response = response
        self.failure = failure
        self.calls = []

    def request(self, **call):
        self.calls.append(call)
        if self.failure is not None:
            raise self.failure
        return self.response


def record() -> RecoveryDeliveryRecord:
    issued = datetime(2026, 1, 1, tzinfo=timezone.utc)
    return RecoveryDeliveryRecord(
        account_id="acct_synthetic", destination=DESTINATION,
        capability=IssuedRecoveryCapability(
            token_id="rtok_synthetic", account_id="acct_synthetic",
            raw_token=SYNTHETIC_TOKEN, expires_at=issued + timedelta(minutes=30),
        ),
    )


def adapter(transport: FakeTransport) -> ResendRecoveryDelivery:
    return ResendRecoveryDelivery(
        api_key=SYNTHETIC_KEY, public_app_origin="https://app.example.test",
        from_email="onboarding@resend.dev", from_name="iSEES Research",
        token_ttl_seconds=1800, transport=transport,
    )


@pytest.fixture
def loopback_resend(monkeypatch):
    exchanges = []
    responses = []

    class Handler(BaseHTTPRequestHandler):
        protocol_version = "HTTP/1.1"

        def do_POST(self):
            length = int(self.headers["Content-Length"])
            exchanges.append({
                "method": self.command, "path": self.path,
                "authorization_present": bool(self.headers.get("Authorization")),
                "accept": self.headers.get("Accept"),
                "content_type": self.headers.get("Content-Type"),
                "user_agent": self.headers.get("User-Agent"),
                "content_length": length, "body": self.rfile.read(length),
            })
            status, body = responses.pop(0)
            self.send_response(status)
            self.send_header("Content-Type", "application/json")
            self.send_header("Content-Length", str(len(body)))
            self.end_headers()
            self.wfile.write(body)

        def log_message(self, format, *args):
            del format, args

    server = ThreadingHTTPServer(("127.0.0.1", 0), Handler)
    thread = threading.Thread(target=server.serve_forever, daemon=True)
    thread.start()
    monkeypatch.setattr(
        "isees_uap.authentication.recovery_delivery.RESEND_EMAIL_ENDPOINT",
        f"http://127.0.0.1:{server.server_port}/emails",
    )
    try:
        yield responses, exchanges
    finally:
        server.shutdown()
        server.server_close()
        thread.join(timeout=2)


def test_recovery_is_disabled_by_default_and_requires_no_provider_configuration():
    config = authentication_settings({"ISEES_AUTH_ENV": "test"})
    assert config.password_recovery_enabled is False
    assert config.public_app_origin is config.resend_api_key is None
    assert config.recovery_token_ttl_seconds == 1800


@pytest.mark.parametrize("missing", [
    "ISEES_PUBLIC_APP_ORIGIN", "ISEES_RECOVERY_DELIVERY_MODE",
    "ISEES_RECOVERY_FROM_EMAIL", "ISEES_RESEND_API_KEY",
])
def test_enabled_configuration_fails_closed_when_incomplete(missing):
    values = enabled()
    values.pop(missing)
    with pytest.raises(RuntimeError) as failure:
        authentication_settings(values)
    assert SYNTHETIC_KEY not in str(failure.value)


def test_secret_is_redacted_in_repr_errors_and_dataclass_serialization():
    config = authentication_settings(enabled())
    diagnostics = repr(config) + repr(config.resend_api_key) + repr(dataclasses.asdict(config))
    assert SYNTHETIC_KEY not in diagnostics
    assert "redacted" in diagnostics.lower()


@pytest.mark.parametrize("origin", [
    "http://app.example.test", "https://user:pass@app.example.test",
    "https://app.example.test/path", "https://app.example.test/?query=yes",
    "https://app.example.test/#fragment", "https://*.example.test", "not-an-origin",
    "https://bad host.example.test", " https://app.example.test",
])
def test_unsafe_or_non_https_production_origins_are_rejected(origin):
    with pytest.raises(RuntimeError):
        authentication_settings(enabled(ISEES_PUBLIC_APP_ORIGIN=origin))


@pytest.mark.parametrize("host", ["localhost", "127.0.0.1"])
def test_local_http_requires_explicit_development_environment(host):
    values = enabled(ISEES_AUTH_ENV="development", ISEES_PUBLIC_APP_ORIGIN=f"http://{host}:5173")
    assert authentication_settings(values).public_app_origin == f"http://{host}:5173"
    with pytest.raises(RuntimeError):
        authentication_settings({**values, "ISEES_AUTH_ENV": "test"})


def test_reset_url_uses_only_configured_origin_and_fragment_with_encoding():
    url = build_reset_url(
        "https://app.example.test", SYNTHETIC_TOKEN,
        {"host": "attacker.invalid", "origin": "https://attacker.invalid",
         "x-forwarded-host": "attacker.invalid"},
    )
    assert url.startswith("https://app.example.test/reset-password#token=")
    assert "?" not in url and "attacker" not in url and SYNTHETIC_TOKEN not in url


def test_resend_request_contract_and_safe_content():
    transport = FakeTransport()
    delivery = adapter(transport)
    delivery.deliver(record())
    assert len(transport.calls) == 1
    call = transport.calls[0]
    assert (call["method"], call["url"], call["timeout"]) == (
        "POST", RESEND_EMAIL_ENDPOINT, RESEND_TIMEOUT_SECONDS,
    )
    assert call["headers"] == {
        "Authorization": f"Bearer {SYNTHETIC_KEY}",
        "Accept": "application/json",
        "Content-Type": "application/json",
        "User-Agent": RESEND_USER_AGENT,
    }
    assert RESEND_USER_AGENT == "iSEES-UAP/0.9"
    for sensitive in (SYNTHETIC_KEY, DESTINATION, SYNTHETIC_TOKEN):
        assert sensitive not in call["headers"]["User-Agent"]
    payload = json.loads(call["body"])
    assert payload["from"] == "iSEES Research <onboarding@resend.dev>"
    assert payload["to"] == [DESTINATION]
    assert payload["subject"] == "Reset your iSEES password"
    for body_name in ("text", "html"):
        body = payload[body_name]
        assert "iSEES researcher account" in body
        assert "expires in 30 minutes" in body
        assert "works once" in body and "ignore" in body
        assert "never email your password" in body
        assert "utm_" not in body


@pytest.mark.parametrize("status", [200, 201, 202, 299])
def test_default_transport_serializes_and_reads_every_2xx(status, loopback_resend):
    responses, exchanges = loopback_resend
    responses.append((status, b'{"id":"loopback-message"}'))
    adapter(None).deliver(record())
    assert len(exchanges) == 1
    exchange = exchanges[0]
    assert exchange["method"] == "POST" and exchange["path"] == "/emails"
    assert exchange["authorization_present"] is True
    assert exchange["accept"] == "application/json"
    assert exchange["content_type"] == "application/json"
    assert exchange["user_agent"] == "iSEES-UAP/0.9"
    assert exchange["content_length"] == len(exchange["body"])
    payload = json.loads(exchange["body"])
    assert payload["from"] == "iSEES Research <onboarding@resend.dev>"
    assert payload["to"] == [DESTINATION]
    assert payload["subject"] == "Reset your iSEES password"
    assert "Reset your password:" in payload["text"]
    assert '<a href="https://app.example.test/reset-password#token=' in payload["html"]


@pytest.mark.parametrize("status", [400, 429, 500])
def test_default_transport_normalizes_http_error_contract(status, loopback_resend):
    responses, exchanges = loopback_resend
    responses.append((status, b'{"message":"provider secret body"}'))
    with pytest.raises(RecoveryDeliveryError) as raised:
        adapter(None).deliver(record())
    assert raised.value.category == "http_rejection"
    assert raised.value.http_status == status
    assert raised.value.provider_error_code is None
    assert "provider secret body" not in str(raised.value)
    assert len(exchanges) == 1


def test_provider_error_code_is_safely_extracted(loopback_resend):
    responses, _ = loopback_resend
    responses.append((403, b'{"name":"validation_error","message":"private detail"}'))
    with pytest.raises(RecoveryDeliveryError) as raised:
        adapter(None).deliver(record())
    assert raised.value.http_status == 403
    assert raised.value.provider_error_code == "validation_error"
    assert "private detail" not in str(raised.value)


def test_default_transport_rejects_malformed_success_and_closes_response(loopback_resend):
    responses, exchanges = loopback_resend
    responses.extend([(200, b'{"id":"  "}'), (200, b'{"id":"second"}')])
    with pytest.raises(RecoveryDeliveryError) as raised:
        adapter(None).deliver(record())
    assert raised.value.category == "malformed_response"
    adapter(None).deliver(record())
    assert len(exchanges) == 2


@pytest.mark.parametrize("response", [
    (400, b'{"message":"provider detail"}'),
    (500, b'{"message":"provider detail"}'),
    (200, b"not-json"), (200, b"{}"), (200, b'{"id":3}'),
])
def test_provider_and_malformed_responses_fail_safely(response):
    transport = FakeTransport(response=response)
    with pytest.raises(RecoveryDeliveryError) as failure:
        adapter(transport).deliver(record())
    diagnostic = str(failure.value) + repr(failure.value)
    assert failure.value.__cause__ is None and failure.value.__context__ is None
    assert "provider detail" not in diagnostic
    for sensitive in (SYNTHETIC_KEY, DESTINATION, SYNTHETIC_TOKEN, "https://app.example.test"):
        assert sensitive not in diagnostic


@pytest.mark.parametrize("failure", [TimeoutError("synthetic timeout"), OSError("synthetic network")])
def test_timeout_and_network_failures_are_sanitized(failure):
    with pytest.raises(RecoveryDeliveryError) as raised:
        adapter(FakeTransport(failure=failure)).deliver(record())
    diagnostic = str(raised.value) + repr(adapter(FakeTransport()))
    for sensitive in (SYNTHETIC_KEY, DESTINATION, SYNTHETIC_TOKEN, "https://app.example.test"):
        assert sensitive not in diagnostic


@pytest.mark.parametrize(("failure", "category"), [
    (URLError(ssl.SSLError("synthetic tls detail")), "tls"),
    (URLError(socket.gaierror("synthetic dns detail")), "dns"),
    (URLError(ConnectionRefusedError("synthetic connection detail")), "connection"),
    (URLError(TimeoutError("synthetic timeout detail")), "timeout"),
])
def test_transport_failure_categories_are_safe(failure, category):
    with pytest.raises(RecoveryDeliveryError) as raised:
        adapter(FakeTransport(failure=failure)).deliver(record())
    assert raised.value.category == category
    diagnostic = str(raised.value) + repr(raised.value)
    assert "synthetic" not in diagnostic


@pytest.mark.parametrize("response", [None, (200,), ("200", b'{}'), (200, "{}")])
def test_injected_transport_contract_failures_are_classified(response):
    with pytest.raises(RecoveryDeliveryError) as raised:
        adapter(FakeTransport(response=response)).deliver(record())
    assert raised.value.category == "internal_adapter_contract"


def test_test_sender_is_replaceable_and_never_redirects_recipient():
    transport = FakeTransport()
    delivery = adapter(transport)
    delivery.deliver(record())
    payload = json.loads(transport.calls[0]["body"])
    # Resend test delivery reaches only the account owner; it is not public recovery.
    assert payload["from"].endswith("<onboarding@resend.dev>")
    assert payload["to"] == [DESTINATION]


def test_application_constructs_delivery_without_provider_call(tmp_path, monkeypatch):
    calls = []
    monkeypatch.setattr(
        "isees_uap.authentication.recovery_delivery.UrllibHttpTransport.request",
        lambda self, **kwargs: calls.append(kwargs),
    )
    values = {
        **enabled(ISEES_AUTH_ENV="development", ISEES_PUBLIC_APP_ORIGIN="http://localhost:5173"),
        "ISEES_STUDIO_V1_ENABLED": "false",
    }
    application = create_application(values, tmp_path / "no-frontend")
    config = application.dependency_overrides[settings]()
    assert isinstance(configured_recovery_delivery(config), ResendRecoveryDelivery)
    assert calls == []


def test_disabled_application_construction_remains_compatible(tmp_path):
    application = create_application(
        {"ISEES_AUTH_ENV": "development", "ISEES_STUDIO_V1_ENABLED": "false"},
        tmp_path / "no-frontend",
    )
    assert application.dependency_overrides[settings]().password_recovery_enabled is False


def test_enabled_invalid_application_configuration_fails_closed(tmp_path):
    with pytest.raises(RuntimeError):
        create_application(
            {"ISEES_AUTH_ENV": "development", "ISEES_STUDIO_V1_ENABLED": "false",
             "ISEES_PASSWORD_RECOVERY_ENABLED": "true"},
            tmp_path / "no-frontend",
        )
