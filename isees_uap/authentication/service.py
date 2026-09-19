from __future__ import annotations

import base64
import hashlib
import logging
import secrets
import uuid
from dataclasses import dataclass
from datetime import datetime, timedelta, timezone
from typing import Callable

from .candidate_access import CandidateAccessPolicy, normalize_email
from .errors import DuplicateAccount, InvalidAccountInput, InvalidCredentials
from .models import (
    AccountStatus, AuthenticatedSession, AuthenticationAuditEvent,
    AuthenticationAuditEventType, IssuedRecoveryCapability, PasswordResetCommand,
    PasswordResetOutcome, RecoveryDeliveryRecord, RecoveryRequestInput,
    RecoveryRequestOutcome, RecoveryThrottleScope, ResearcherAccount,
)
from .passwords import hash_password, verify_password
from .recovery_delivery import RecoveryDelivery
from .sqlite_repository import SQLiteAuthenticationRepository, session_secret_digest

_DUMMY_HASH = hash_password("not-a-real-password")
_UNKNOWN_IDENTITY_THROTTLE_KEY = "__unknown_identity__"
_UNKNOWN_RECOVERY_SCOPE_DIGEST = hashlib.sha256(b"recovery:unknown:global").digest()
RECOVERY_TOKEN_BYTES = 32
RECOVERY_TOKEN_TTL_SECONDS = 30 * 60
logger = logging.getLogger(__name__)


def _utc_now() -> datetime:
    return datetime.now(timezone.utc)


@dataclass(frozen=True)
class IssuedSession:
    session: AuthenticatedSession
    bearer_secret: str
    csrf_secret: str


class AuthenticationService:
    def __init__(self, repository: SQLiteAuthenticationRepository, *,
                 session_ttl_seconds: int,
                 candidate_access: CandidateAccessPolicy | None = None,
                 login_max_failures: int = 5,
                 login_window_seconds: int = 15 * 60,
                 login_lockout_seconds: int = 15 * 60,
                 clock: Callable[[], datetime] = _utc_now,
                 recovery_delivery: RecoveryDelivery | None = None,
                 recovery_entropy: Callable[[int], bytes] = secrets.token_bytes,
                 recovery_ttl_seconds: int = RECOVERY_TOKEN_TTL_SECONDS,
                 recovery_max_requests: int = 5,
                 recovery_window_seconds: int = 15 * 60,
                 recovery_block_seconds: int = 15 * 60):
        self.repository = repository
        self.session_ttl_seconds = session_ttl_seconds
        self.candidate_access = candidate_access or CandidateAccessPolicy()
        self.login_max_failures = login_max_failures
        self.login_window_seconds = login_window_seconds
        self.login_lockout_seconds = login_lockout_seconds
        self.clock = clock
        self.recovery_delivery = recovery_delivery
        self.recovery_entropy = recovery_entropy
        self.recovery_ttl_seconds = recovery_ttl_seconds
        self.recovery_max_requests = recovery_max_requests
        self.recovery_window_seconds = recovery_window_seconds
        self.recovery_block_seconds = recovery_block_seconds

    def create_account(self, *, email: str, password: str) -> ResearcherAccount:
        normalized = normalize_email(email)
        if not self.candidate_access.permits_registration(normalized):
            raise DuplicateAccount("Account registration is unavailable")
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
        now = self.clock()
        throttle_key = normalized if account is not None else _UNKNOWN_IDENTITY_THROTTLE_KEY
        throttle = self.repository.login_throttle(normalized_email=throttle_key)
        locked = throttle is not None and throttle.locked_until is not None \
            and throttle.locked_until > now
        eligible = (
            account is not None
            and account.status is AccountStatus.ACTIVE
            and self.candidate_access.permits_authentication(account.normalized_email)
        )
        if locked or not valid or not eligible:
            if not locked:
                self.repository.record_login_failure(
                    normalized_email=throttle_key, occurred_at=now,
                    max_failures=self.login_max_failures,
                    window_seconds=self.login_window_seconds,
                    lockout_seconds=self.login_lockout_seconds,
                )
            raise InvalidCredentials("Email or password is invalid")
        self.repository.clear_login_throttle(normalized_email=normalized)
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

    def _audit(self, event_type: AuthenticationAuditEventType, *, occurred_at: datetime,
               outcome: str, account_id: str | None = None,
               request_id: str | None = None,
               origin_digest: bytes | None = None) -> None:
        self.repository.record_authentication_audit_event(AuthenticationAuditEvent(
            event_id=f"aevt_{uuid.uuid4().hex}", event_type=event_type,
            occurred_at=occurred_at, outcome=outcome, account_id=account_id,
            request_id=request_id, origin_digest=origin_digest,
        ))

    def request_password_recovery(
        self, request: RecoveryRequestInput,
    ) -> RecoveryRequestOutcome:
        now = self.clock()
        try:
            normalized = normalize_email(request.email)
        except InvalidAccountInput:
            normalized = None
        account = (self.repository.find_account_by_normalized_email(normalized)
                   if normalized is not None else None)
        eligible = (
            account is not None and account.status is AccountStatus.ACTIVE
            and self.candidate_access.permits_authentication(account.normalized_email)
        )
        if account is not None:
            scope_type = RecoveryThrottleScope.ACCOUNT
            scope_digest = hashlib.sha256(
                ("recovery:account:" + account.account_id).encode("utf-8")
            ).digest()
        elif request.origin_digest is not None:
            scope_type = RecoveryThrottleScope.ORIGIN
            scope_digest = hashlib.sha256(
                b"recovery:origin:" + request.origin_digest
            ).digest()
        else:
            # Every unknown request without a trusted origin shares one bounded row.
            scope_type = RecoveryThrottleScope.GLOBAL
            scope_digest = _UNKNOWN_RECOVERY_SCOPE_DIGEST
        allowed = self.repository.allow_recovery_request(
            scope_type=scope_type, scope_digest=scope_digest, occurred_at=now,
            max_requests=self.recovery_max_requests,
            window_seconds=self.recovery_window_seconds,
            block_seconds=self.recovery_block_seconds,
        )
        if not allowed:
            self._audit(
                AuthenticationAuditEventType.PASSWORD_RECOVERY_RATE_LIMITED,
                occurred_at=now, outcome="RATE_LIMITED",
                account_id=account.account_id if eligible else None,
                request_id=request.request_id, origin_digest=request.origin_digest,
            )
            return RecoveryRequestOutcome()
        self._audit(
            AuthenticationAuditEventType.PASSWORD_RECOVERY_REQUEST_ACCEPTED,
            occurred_at=now, outcome="ACCEPTED",
            account_id=account.account_id if eligible else None,
            request_id=request.request_id, origin_digest=request.origin_digest,
        )
        if not eligible:
            logger.warning("Password recovery operational status=ACCOUNT_NOT_FOUND")
            return RecoveryRequestOutcome()
        entropy = self.recovery_entropy(RECOVERY_TOKEN_BYTES)
        if not isinstance(entropy, bytes) or len(entropy) < RECOVERY_TOKEN_BYTES:
            raise RuntimeError("Recovery entropy source failed closed")
        raw_token = base64.urlsafe_b64encode(entropy).rstrip(b"=").decode("ascii")
        capability = IssuedRecoveryCapability(
            token_id=f"rtok_{uuid.uuid4().hex}", account_id=account.account_id,
            raw_token=raw_token,
            expires_at=now + timedelta(seconds=self.recovery_ttl_seconds),
        )
        self.repository.issue_recovery_token(
            token_id=capability.token_id, account_id=account.account_id,
            token_digest=hashlib.sha256(raw_token.encode("ascii")).digest(),
            created_at=now, expires_at=capability.expires_at,
            requested_origin_digest=request.origin_digest,
        )
        logger.warning("Password recovery operational status=TOKEN_CREATED")
        if self.recovery_delivery is None:
            raise RuntimeError("Recovery delivery is unavailable")
        self._audit(
            AuthenticationAuditEventType.PASSWORD_RECOVERY_DELIVERY_REQUESTED,
            occurred_at=now, outcome="REQUESTED", account_id=account.account_id,
            request_id=request.request_id, origin_digest=request.origin_digest,
        )
        self.recovery_delivery.deliver(RecoveryDeliveryRecord(
            account_id=account.account_id, destination=account.email,
            capability=capability,
        ))
        logger.warning("Password recovery operational status=DELIVERY_ACCEPTED")
        return RecoveryRequestOutcome()

    @staticmethod
    def _recovery_digest(raw_token: str) -> bytes | None:
        try:
            if not isinstance(raw_token, str) or not raw_token or len(raw_token) > 256:
                return None
            padding = "=" * (-len(raw_token) % 4)
            decoded = base64.b64decode(
                raw_token + padding, altchars=b"-_", validate=True,
            )
            if len(decoded) != RECOVERY_TOKEN_BYTES:
                return None
            canonical = base64.urlsafe_b64encode(decoded).rstrip(b"=").decode("ascii")
            if not secrets.compare_digest(canonical, raw_token):
                return None
            return hashlib.sha256(raw_token.encode("ascii")).digest()
        except (ValueError, UnicodeEncodeError):
            return None

    def reset_password(self, command: PasswordResetCommand) -> PasswordResetOutcome:
        now = self.clock()
        digest = self._recovery_digest(command.token)
        if digest is None:
            self._audit(
                AuthenticationAuditEventType.PASSWORD_RESET_REJECTED,
                occurred_at=now, outcome="REJECTED", request_id=command.request_id,
                origin_digest=command.origin_digest,
            )
            return PasswordResetOutcome(completed=False)
        # Validation and hashing remain owned by the canonical password service.
        password_hash = hash_password(command.new_password)
        completed = self.repository.reset_password_atomically(
            token_digest=digest, password_hash=password_hash, occurred_at=now,
            request_id=command.request_id, origin_digest=command.origin_digest,
        )
        if not completed:
            self._audit(
                AuthenticationAuditEventType.PASSWORD_RESET_REJECTED,
                occurred_at=now, outcome="REJECTED", request_id=command.request_id,
                origin_digest=command.origin_digest,
            )
        return PasswordResetOutcome(completed=completed)
