from __future__ import annotations

import hashlib
import hmac
from dataclasses import dataclass
from datetime import datetime, timezone
from functools import lru_cache

from fastapi import Cookie, Depends, Header

from .config import AuthenticationSettings, authentication_settings
from .errors import AuthenticationRequired, CsrfRejected
from .models import AccountStatus, AuthenticatedSession, ResearcherAccount
from .sqlite_repository import SQLiteAuthenticationRepository, session_secret_digest


@dataclass(frozen=True)
class AuthenticatedPrincipal:
    account_id: str
    email: str
    session_id: str
    session_expires_at: datetime
    csrf_digest: bytes


@lru_cache(maxsize=1)
def authentication_repository() -> SQLiteAuthenticationRepository:
    return SQLiteAuthenticationRepository(authentication_settings().database_path)


def settings() -> AuthenticationSettings:
    return authentication_settings()


def _parse_bearer(value: str | None) -> tuple[str, str]:
    if not value or value.count(".") != 1:
        raise AuthenticationRequired("Authentication is required")
    session_id, secret = value.split(".", 1)
    if not session_id.startswith("ses_") or not secret:
        raise AuthenticationRequired("Authentication is required")
    return session_id, secret


def require_authenticated_principal(
    session_cookie: str | None = Cookie(default=None, alias="isees_session"),
    repository: SQLiteAuthenticationRepository = Depends(authentication_repository),
    config: AuthenticationSettings = Depends(settings),
) -> AuthenticatedPrincipal:
    session_id, secret = _parse_bearer(session_cookie)
    resolved = repository.resolve_session(
        session_id=session_id, secret_digest=session_secret_digest(secret),
        used_at=datetime.now(timezone.utc),
    )
    if resolved is None:
        raise AuthenticationRequired("Authentication is required")
    session, account, csrf_digest = resolved
    eligible = (
        account.status is AccountStatus.ACTIVE
        and config.candidate_access.permits_authentication(account.normalized_email)
    )
    if not eligible:
        repository.revoke_all_sessions(
            account_id=account.account_id, revoked_at=datetime.now(timezone.utc)
        )
        raise AuthenticationRequired("Authentication is required")
    return AuthenticatedPrincipal(
        account_id=account.account_id, email=account.email,
        session_id=session.session_id, session_expires_at=session.expires_at,
        csrf_digest=csrf_digest,
    )


def require_csrf_protected_principal(
    principal: AuthenticatedPrincipal = Depends(require_authenticated_principal),
    csrf_cookie: str | None = Cookie(default=None, alias="isees_csrf"),
    csrf_header: str | None = Header(default=None, alias="X-ISEES-CSRF"),
) -> AuthenticatedPrincipal:
    if not csrf_cookie or not csrf_header or not hmac.compare_digest(csrf_cookie, csrf_header):
        raise CsrfRejected("Request could not be authorized")
    supplied = hashlib.sha256(csrf_header.encode("utf-8")).digest()
    if not hmac.compare_digest(supplied, principal.csrf_digest):
        raise CsrfRejected("Request could not be authorized")
    return principal
