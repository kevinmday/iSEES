from __future__ import annotations

import html
import json
from email.utils import formataddr
from typing import Mapping, Protocol
from urllib.parse import quote
from urllib.request import Request, urlopen

from .config import AuthenticationSettings
from .models import RecoveryDeliveryRecord

RESEND_EMAIL_ENDPOINT = "https://api.resend.com/emails"
RESEND_TIMEOUT_SECONDS = 10.0


class RecoveryDeliveryError(RuntimeError):
    """Sanitized provider-independent delivery failure."""


class HttpTransport(Protocol):
    def request(self, *, method: str, url: str, headers: Mapping[str, str],
                body: bytes, timeout: float) -> tuple[int, bytes]: ...


class UrllibHttpTransport:
    def request(self, *, method: str, url: str, headers: Mapping[str, str],
                body: bytes, timeout: float) -> tuple[int, bytes]:
        request = Request(url, data=body, headers=dict(headers), method=method)
        with urlopen(request, timeout=timeout) as response:
            return response.status, response.read()


def build_reset_url(public_app_origin: str, raw_token: str,
                    request_metadata: Mapping[str, str] | None = None) -> str:
    """Build solely from validated configuration; request metadata is ignored."""
    del request_metadata
    # Revalidate at this trust boundary. Configuration stores an origin without `/`.
    from .config import _public_origin
    origin = _public_origin(public_app_origin, development=True)
    return f"{origin}/reset-password#token={quote(raw_token, safe='')}"


class ResendRecoveryDelivery:
    def __init__(self, *, api_key: str, public_app_origin: str, from_email: str,
                 from_name: str, token_ttl_seconds: int,
                 transport: HttpTransport | None = None,
                 timeout: float = RESEND_TIMEOUT_SECONDS):
        self.__api_key = api_key
        self.public_app_origin = public_app_origin
        self.from_email = from_email
        self.from_name = from_name
        self.token_ttl_seconds = token_ttl_seconds
        self.transport = transport or UrllibHttpTransport()
        self.timeout = timeout

    def __repr__(self) -> str:
        return "ResendRecoveryDelivery(<redacted>)"

    def deliver(self, record: RecoveryDeliveryRecord) -> None:
        reset_url = build_reset_url(
            self.public_app_origin, record.capability.raw_token,
        )
        if self.token_ttl_seconds % 60 == 0:
            expiry = f"{self.token_ttl_seconds // 60} minutes"
        else:
            expiry = f"{self.token_ttl_seconds} seconds"
        text_body = (
            "A password reset was requested for your iSEES researcher account.\n\n"
            f"Reset your password: {reset_url}\n\n"
            f"This link expires in {expiry} and works once. If you did not request "
            "this reset, you can ignore this message. iSEES will never email your password."
        )
        escaped_url = html.escape(reset_url, quote=True)
        html_body = (
            "<p>A password reset was requested for your iSEES researcher account.</p>"
            f'<p><a href="{escaped_url}">Reset your password</a></p>'
            f"<p>This link expires in {expiry} and works once.</p>"
            "<p>If you did not request this reset, you can ignore this message.</p>"
            "<p>iSEES will never email your password.</p>"
        )
        payload = json.dumps({
            "from": formataddr((self.from_name, self.from_email)),
            "to": [record.destination],
            "subject": "Reset your iSEES password",
            "text": text_body,
            "html": html_body,
        }, separators=(",", ":")).encode("utf-8")
        valid_response = False
        try:
            status, response_body = self.transport.request(
                method="POST", url=RESEND_EMAIL_ENDPOINT,
                headers={
                    "Authorization": f"Bearer {self.__api_key}",
                    "Content-Type": "application/json",
                },
                body=payload, timeout=self.timeout,
            )
            response = json.loads(response_body.decode("utf-8"))
            valid_response = (
                200 <= status < 300 and isinstance(response, dict)
                and isinstance(response.get("id"), str) and bool(response["id"])
            )
        except Exception:
            pass
        if not valid_response:
            raise RecoveryDeliveryError("Password recovery delivery failed")


def recovery_delivery_from_settings(
    settings: AuthenticationSettings, *, transport: HttpTransport | None = None,
) -> RecoveryDelivery | None:
    if not settings.password_recovery_enabled:
        return None
    if (settings.recovery_delivery_mode != "resend" or settings.resend_api_key is None
            or settings.public_app_origin is None or settings.recovery_from_email is None):
        raise RuntimeError("Password recovery configuration is incomplete")
    return ResendRecoveryDelivery(
        api_key=settings.resend_api_key.get_secret_value(),
        public_app_origin=settings.public_app_origin,
        from_email=settings.recovery_from_email,
        from_name=settings.recovery_from_name,
        token_ttl_seconds=settings.recovery_token_ttl_seconds,
        transport=transport,
    )

# `onboarding@resend.dev` may be supplied through ISEES_RECOVERY_FROM_EMAIL during
# Resend test delivery. Resend restricts that sender to the account owner, so it is
# replaceable configuration and is not sufficient for public tester recovery.


class RecoveryDelivery(Protocol):
    def deliver(self, record: RecoveryDeliveryRecord) -> None: ...


class RecordingRecoveryDelivery:
    """Deterministic test adapter. Never configure this as production delivery."""

    def __init__(self) -> None:
        self.records: list[RecoveryDeliveryRecord] = []

    def deliver(self, record: RecoveryDeliveryRecord) -> None:
        self.records.append(record)
