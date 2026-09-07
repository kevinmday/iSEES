from __future__ import annotations

import os
from dataclasses import dataclass
from pathlib import Path


@dataclass(frozen=True)
class AuthenticationSettings:
    database_path: Path
    secure_cookies: bool
    session_ttl_seconds: int = 60 * 60 * 24 * 14
    session_cookie_name: str = "isees_session"
    csrf_cookie_name: str = "isees_csrf"
    cookie_path: str = "/"
    cookie_samesite: str = "strict"


def authentication_settings() -> AuthenticationSettings:
    environment = os.environ.get("ISEES_AUTH_ENV", "production").strip().lower()
    if environment not in {"production", "development", "test"}:
        raise RuntimeError("ISEES_AUTH_ENV must be production, development, or test")
    configured = os.environ.get("ISEES_AUTH_DB_PATH")
    path = Path(configured) if configured else Path("runtime/authentication.sqlite3")
    return AuthenticationSettings(
        database_path=path.expanduser().resolve(),
        secure_cookies=environment == "production",
    )
