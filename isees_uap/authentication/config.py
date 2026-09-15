from __future__ import annotations

import os
from ipaddress import ip_address
import re
from dataclasses import dataclass, field
from pathlib import Path
from typing import Mapping
from urllib.parse import urlsplit, urlunsplit

from isees_uap.persistence import database_path
from .candidate_access import CandidateAccessPolicy

_ORIGIN_HOST_PATTERN = re.compile(
    r"^(?=.{1,253}$)(?:[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?\.)*"
    r"[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?$"
)
_SENDER_EMAIL_PATTERN = re.compile(
    r"^[A-Za-z0-9.!#$%&'*+/=?^_`{|}~-]+@"
    r"(?:[A-Za-z0-9](?:[A-Za-z0-9-]{0,61}[A-Za-z0-9])?\.)+"
    r"[A-Za-z0-9](?:[A-Za-z0-9-]{0,61}[A-Za-z0-9])?$"
)


class RedactedSecret:
    """Minimal secret holder whose diagnostics and dataclass copies stay redacted."""

    __slots__ = ("__value",)

    def __init__(self, value: str):
        self.__value = value

    def get_secret_value(self) -> str:
        return self.__value

    def __repr__(self) -> str:
        return "RedactedSecret(<redacted>)"

    __str__ = __repr__

    def __deepcopy__(self, memo):
        return self


@dataclass(frozen=True)
class AuthenticationSettings:
    database_path: Path
    secure_cookies: bool
    session_ttl_seconds: int = 60 * 60 * 24 * 14
    session_cookie_name: str = "isees_session"
    csrf_cookie_name: str = "isees_csrf"
    cookie_path: str = "/"
    cookie_samesite: str = "strict"
    candidate_access: CandidateAccessPolicy = field(default_factory=CandidateAccessPolicy)
    login_max_failures: int = 5
    login_window_seconds: int = 15 * 60
    login_lockout_seconds: int = 15 * 60
    password_recovery_enabled: bool = False
    public_app_origin: str | None = None
    recovery_delivery_mode: str | None = None
    recovery_token_ttl_seconds: int = 30 * 60
    recovery_from_email: str | None = None
    recovery_from_name: str = "iSEES"
    resend_api_key: RedactedSecret | None = field(default=None, repr=False)


def _bounded_integer(values: Mapping[str, str], name: str, default: int,
                     minimum: int, maximum: int) -> int:
    raw = values.get(name, str(default)).strip()
    try:
        value = int(raw)
    except ValueError as error:
        raise RuntimeError(f"{name} must be an integer") from error
    if not minimum <= value <= maximum:
        raise RuntimeError(f"{name} must be between {minimum} and {maximum}")
    return value


def _boolean(values: Mapping[str, str], name: str, default: bool) -> bool:
    raw = values.get(name, "true" if default else "false").strip().lower()
    if raw not in {"true", "false"}:
        raise RuntimeError(f"{name} must be true or false")
    return raw == "true"


def _public_origin(raw: str, *, development: bool) -> str:
    try:
        parsed = urlsplit(raw)
        port = parsed.port
    except ValueError as error:
        raise RuntimeError("ISEES_PUBLIC_APP_ORIGIN must be a valid origin") from error
    if (not raw or raw != raw.strip() or not raw.isascii() or "*" in raw
            or parsed.scheme not in {"http", "https"}
            or not parsed.hostname or parsed.username is not None or parsed.password is not None
            or parsed.path not in {"", "/"} or parsed.query or parsed.fragment):
        raise RuntimeError("ISEES_PUBLIC_APP_ORIGIN must be a safe origin")
    hostname = parsed.hostname.lower()
    try:
        valid_host = ip_address(hostname) is not None
    except ValueError:
        valid_host = _ORIGIN_HOST_PATTERN.fullmatch(hostname) is not None
    if not valid_host:
        raise RuntimeError("ISEES_PUBLIC_APP_ORIGIN must be a valid origin")
    local_http = development and hostname in {"localhost", "127.0.0.1"}
    if parsed.scheme != "https" and not local_http:
        raise RuntimeError("ISEES_PUBLIC_APP_ORIGIN must use HTTPS")
    host = f"[{hostname}]" if ":" in hostname else hostname
    netloc = host if port is None else f"{host}:{port}"
    return urlunsplit((parsed.scheme, netloc, "", "", ""))


def authentication_settings(
    environment: Mapping[str, str] | None = None,
) -> AuthenticationSettings:
    values = os.environ if environment is None else environment
    environment_name = values.get("ISEES_AUTH_ENV", "production").strip().lower()
    if environment_name not in {"production", "development", "test"}:
        raise RuntimeError("ISEES_AUTH_ENV must be production, development, or test")
    recovery_enabled = _boolean(values, "ISEES_PASSWORD_RECOVERY_ENABLED", False)
    recovery_ttl = _bounded_integer(
        values, "ISEES_RECOVERY_TOKEN_TTL_SECONDS", 30 * 60, 5 * 60, 24 * 60 * 60,
    )
    public_origin = None
    delivery_mode = None
    from_email = None
    from_name = values.get("ISEES_RECOVERY_FROM_NAME", "iSEES").strip()
    resend_api_key = None
    if recovery_enabled:
        origin_value = values.get("ISEES_PUBLIC_APP_ORIGIN", "")
        if not origin_value.strip():
            raise RuntimeError("Enabled password recovery requires ISEES_PUBLIC_APP_ORIGIN")
        public_origin = _public_origin(
            origin_value, development=environment_name == "development",
        )
        delivery_mode = values.get("ISEES_RECOVERY_DELIVERY_MODE", "").strip().lower()
        if delivery_mode != "resend":
            raise RuntimeError("ISEES_RECOVERY_DELIVERY_MODE must be a supported value")
        api_key = values.get("ISEES_RESEND_API_KEY", "")
        from_email = values.get("ISEES_RECOVERY_FROM_EMAIL", "").strip()
        if not api_key.strip():
            raise RuntimeError("Resend recovery delivery requires an API key")
        if not _SENDER_EMAIL_PATTERN.fullmatch(from_email):
            raise RuntimeError("Resend recovery delivery requires a valid sender email")
        if not from_name or any(c in from_name for c in "\r\n<>"):
            raise RuntimeError("ISEES_RECOVERY_FROM_NAME is invalid")
        resend_api_key = RedactedSecret(api_key)
    path = database_path("ISEES_AUTH_DB_PATH", "authentication.sqlite3",
                         "runtime/authentication.sqlite3", values)
    return AuthenticationSettings(
        database_path=path,
        secure_cookies=environment_name == "production",
        candidate_access=CandidateAccessPolicy.from_environment(values),
        login_max_failures=_bounded_integer(
            values, "ISEES_LOGIN_MAX_FAILURES", 5, 3, 20),
        login_window_seconds=_bounded_integer(
            values, "ISEES_LOGIN_WINDOW_SECONDS", 15 * 60, 60, 60 * 60),
        login_lockout_seconds=_bounded_integer(
            values, "ISEES_LOGIN_LOCKOUT_SECONDS", 15 * 60, 60, 24 * 60 * 60),
        password_recovery_enabled=recovery_enabled,
        public_app_origin=public_origin,
        recovery_delivery_mode=delivery_mode,
        recovery_token_ttl_seconds=recovery_ttl,
        recovery_from_email=from_email,
        recovery_from_name=from_name,
        resend_api_key=resend_api_key,
    )
