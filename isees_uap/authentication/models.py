from __future__ import annotations

from dataclasses import dataclass
from datetime import datetime
from enum import Enum


class AccountStatus(str, Enum):
    ACTIVE = "ACTIVE"
    DISABLED = "DISABLED"


@dataclass(frozen=True)
class ResearcherAccount:
    account_id: str
    email: str
    normalized_email: str
    password_hash: str
    status: AccountStatus
    created_at: datetime
    updated_at: datetime


@dataclass(frozen=True)
class AuthenticatedSession:
    session_id: str
    account_id: str
    created_at: datetime
    expires_at: datetime
    revoked_at: datetime | None
    last_used_at: datetime


@dataclass(frozen=True)
class LoginThrottle:
    normalized_email: str
    failure_count: int
    window_started_at: datetime
    locked_until: datetime | None
    updated_at: datetime
