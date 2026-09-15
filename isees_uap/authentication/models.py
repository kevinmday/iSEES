from __future__ import annotations

from dataclasses import dataclass, field
from datetime import datetime
from enum import Enum
from typing import Mapping


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


class AuthenticationAuditEventType(str, Enum):
    PASSWORD_RECOVERY_REQUEST_ACCEPTED = "PASSWORD_RECOVERY_REQUEST_ACCEPTED"
    PASSWORD_RECOVERY_DELIVERY_REQUESTED = "PASSWORD_RECOVERY_DELIVERY_REQUESTED"
    PASSWORD_RECOVERY_RATE_LIMITED = "PASSWORD_RECOVERY_RATE_LIMITED"
    PASSWORD_RESET_REJECTED = "PASSWORD_RESET_REJECTED"
    PASSWORD_RESET_COMPLETED = "PASSWORD_RESET_COMPLETED"


class RecoveryThrottleScope(str, Enum):
    ACCOUNT = "ACCOUNT"
    ORIGIN = "ORIGIN"
    GLOBAL = "GLOBAL"


@dataclass(frozen=True)
class RecoveryRequestInput:
    email: str
    request_id: str | None = None
    origin_digest: bytes | None = None


@dataclass(frozen=True, repr=False)
class IssuedRecoveryCapability:
    token_id: str
    account_id: str
    raw_token: str = field(repr=False)
    expires_at: datetime

    def __repr__(self) -> str:
        return "IssuedRecoveryCapability(<redacted>)"


@dataclass(frozen=True)
class PasswordResetCommand:
    token: str = field(repr=False)
    new_password: str = field(repr=False)
    request_id: str | None = None
    origin_digest: bytes | None = None


@dataclass(frozen=True)
class PasswordResetOutcome:
    completed: bool


@dataclass(frozen=True)
class RecoveryRequestOutcome:
    accepted: bool = True


@dataclass(frozen=True)
class RecoveryTokenRecord:
    token_id: str
    account_id: str
    token_digest: bytes = field(repr=False)
    created_at: datetime
    expires_at: datetime
    used_at: datetime | None
    invalidated_at: datetime | None
    requested_origin_digest: bytes | None = field(default=None, repr=False)


@dataclass(frozen=True)
class AuthenticationAuditEvent:
    event_id: str
    event_type: AuthenticationAuditEventType
    occurred_at: datetime
    outcome: str
    account_id: str | None = None
    request_id: str | None = None
    origin_digest: bytes | None = field(default=None, repr=False)
    metadata: Mapping[str, object] = field(default_factory=dict)


@dataclass(frozen=True, repr=False)
class RecoveryDeliveryRecord:
    account_id: str
    destination: str
    capability: IssuedRecoveryCapability = field(repr=False)

    def __repr__(self) -> str:
        return "RecoveryDeliveryRecord(<redacted>)"
