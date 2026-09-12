from __future__ import annotations

import os
from dataclasses import dataclass, field
from pathlib import Path
from typing import Mapping

from isees_uap.persistence import database_path
from .candidate_access import CandidateAccessPolicy


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


def authentication_settings(
    environment: Mapping[str, str] | None = None,
) -> AuthenticationSettings:
    values = os.environ if environment is None else environment
    environment_name = values.get("ISEES_AUTH_ENV", "production").strip().lower()
    if environment_name not in {"production", "development", "test"}:
        raise RuntimeError("ISEES_AUTH_ENV must be production, development, or test")
    path = database_path("ISEES_AUTH_DB_PATH", "authentication.sqlite3",
                         "runtime/authentication.sqlite3")
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
    )
