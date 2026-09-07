from __future__ import annotations

import hashlib
import re
import secrets
import uuid
from dataclasses import dataclass
from datetime import datetime, timedelta, timezone
from typing import Callable

from .errors import InvalidAccountInput, InvalidCredentials
from .models import AccountStatus, AuthenticatedSession, ResearcherAccount
from .passwords import hash_password, verify_password
from .sqlite_repository import SQLiteAuthenticationRepository, session_secret_digest

_EMAIL = re.compile(r"^[^\s@]+@[^\s@]+\.[^\s@]+$")
_DUMMY_HASH = hash_password("not-a-real-password")


def _utc_now() -> datetime:
    return datetime.now(timezone.utc)


def normalize_email(email: str) -> str:
    normalized = email.strip().casefold()
    if len(normalized) > 254 or not _EMAIL.fullmatch(normalized):
        raise InvalidAccountInput("Account details are invalid")
    return normalized


@dataclass(frozen=True)
class IssuedSession:
    session: AuthenticatedSession
    bearer_secret: str
    csrf_secret: str


class AuthenticationService:
    def __init__(self, repository: SQLiteAuthenticationRepository, *,
                 session_ttl_seconds: int,
                 clock: Callable[[], datetime] = _utc_now):
        self.repository = repository
        self.session_ttl_seconds = session_ttl_seconds
        self.clock = clock

    def create_account(self, *, email: str, password: str) -> ResearcherAccount:
        normalized = normalize_email(email)
        return self.repository.create_account(
            account_id=f"acct_{uuid.uuid4().hex}", email=email.strip(),
            normalized_email=normalized, password_hash=hash_password(password),
        )

    def login(self, *, email: str, password: str) -> tuple[ResearcherAccount, IssuedSession]:
        try:
            normalized = normalize_email(email)
        except InvalidAccountInput:
            normalized = "invalid@example.invalid"
        account = self.repository.find_account_by_normalized_email(normalized)
        password_hash = account.password_hash if account else _DUMMY_HASH
        valid = verify_password(password, password_hash)
        if not valid or account is None or account.status is not AccountStatus.ACTIVE:
            raise InvalidCredentials("Email or password is invalid")
        return account, self._issue(account.account_id)

    def _issue(self, account_id: str) -> IssuedSession:
        now = self.clock()
        session_id = f"ses_{uuid.uuid4().hex}"
        bearer_secret = secrets.token_urlsafe(32)
        csrf_secret = secrets.token_urlsafe(32)
        session = self.repository.create_session(
            session_id=session_id, account_id=account_id,
            secret_digest=session_secret_digest(bearer_secret),
            csrf_digest=hashlib.sha256(csrf_secret.encode("ascii")).digest(),
            expires_at=now + timedelta(seconds=self.session_ttl_seconds),
        )
        return IssuedSession(session, f"{session_id}.{bearer_secret}", csrf_secret)
