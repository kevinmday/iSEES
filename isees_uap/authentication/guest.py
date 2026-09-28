"""Server Guest credential and pre-dispatch reservation authority.

This module deliberately has no provider or Web Discovery route dependency.
"""
from __future__ import annotations

import hashlib
import hmac
import secrets
import uuid
from dataclasses import dataclass
from datetime import datetime, timedelta, timezone
from typing import Callable

from .config import AuthenticationSettings
from .errors import AuthenticationRequired, CsrfRejected, GuestIssuanceRejected
from .models import GuestCredential, GuestIdentity, GuestSearchOperation, GuestSearchOperationState
from .sqlite_repository import SQLiteAuthenticationRepository, session_secret_digest


def _now() -> datetime:
    return datetime.now(timezone.utc)


@dataclass(frozen=True, repr=False)
class IssuedGuestCredential:
    identity: GuestIdentity
    credential: GuestCredential
    bearer: str
    csrf: str

    def __repr__(self) -> str:
        return "IssuedGuestCredential(<redacted>)"


class GuestAuthority:
    def __init__(self, repository: SQLiteAuthenticationRepository,
                 config: AuthenticationSettings, *, clock: Callable[[], datetime] = _now):
        self.repository, self.config, self.clock = repository, config, clock

    def issue(self, *, scope_digest: bytes,
              revoke_guest_id: str | None = None) -> IssuedGuestCredential:
        if not self.config.guest_credentials_enabled:
            raise AuthenticationRequired("Guest access is unavailable")
        now = self.clock()
        if not self.repository.allow_guest_issuance(
            scope_digest=scope_digest, occurred_at=now,
            max_requests=self.config.guest_issuance_max_requests,
            window_seconds=self.config.guest_issuance_window_seconds,
            block_seconds=self.config.guest_issuance_block_seconds,
        ):
            raise GuestIssuanceRejected("Guest credential issuance is temporarily unavailable")
        guest_id, credential_id = f"gst_{uuid.uuid4().hex}", f"gcr_{uuid.uuid4().hex}"
        secret, csrf = secrets.token_urlsafe(32), secrets.token_urlsafe(32)
        identity, credential = self.repository.create_guest(
            guest_id=guest_id, credential_id=credential_id,
            secret_digest=session_secret_digest(secret),
            csrf_digest=hashlib.sha256(csrf.encode("ascii")).digest(), created_at=now,
            expires_at=now + timedelta(seconds=self.config.guest_credential_ttl_seconds),
            revoke_guest_id=revoke_guest_id,
        )
        return IssuedGuestCredential(identity, credential, f"{credential_id}.{secret}", csrf)

    def resolve(self, bearer: str | None) -> tuple[GuestIdentity, GuestCredential]:
        if not self.config.guest_credentials_enabled or not bearer or bearer.count(".") != 1:
            raise AuthenticationRequired("Guest authentication is required")
        credential_id, secret = bearer.split(".", 1)
        if not credential_id.startswith("gcr_") or not secret:
            raise AuthenticationRequired("Guest authentication is required")
        resolved = self.repository.resolve_guest(
            credential_id=credential_id, secret_digest=session_secret_digest(secret),
            used_at=self.clock(),
        )
        if resolved is None:
            raise AuthenticationRequired("Guest authentication is required")
        return resolved

    @staticmethod
    def require_csrf(credential: GuestCredential, cookie: str | None, header: str | None) -> None:
        if not cookie or not header or not hmac.compare_digest(cookie, header):
            raise CsrfRejected("Request could not be authorized")
        if not hmac.compare_digest(hashlib.sha256(header.encode()).digest(), credential.csrf_digest):
            raise CsrfRejected("Request could not be authorized")

    def reserve(self, *, guest_id: str, operation_id: str, idempotency_key: str,
                request_fingerprint: bytes, units: int = 1) -> GuestSearchOperation:
        if not self.config.guest_provider_dispatch_enabled:
            raise AuthenticationRequired("Guest provider dispatch is disabled")
        return self.repository.reserve_guest_search(
            operation_id=operation_id, guest_id=guest_id, idempotency_key=idempotency_key,
            request_fingerprint=request_fingerprint, occurred_at=self.clock(),
            guest_allowance=self.config.guest_search_allowance,
            global_budget=self.config.guest_global_budget_units, units=units,
        )

    def mark_dispatching(self, operation_id: str, guest_id: str) -> GuestSearchOperation:
        return self.repository.transition_guest_search(
            operation_id=operation_id, guest_id=guest_id,
            target=GuestSearchOperationState.DISPATCHING, occurred_at=self.clock())

    def mark_definitely_undispatched(self, operation_id: str, guest_id: str) -> GuestSearchOperation:
        return self.repository.transition_guest_search(
            operation_id=operation_id, guest_id=guest_id,
            target=GuestSearchOperationState.DEFINITELY_UNDISPATCHED, occurred_at=self.clock())

    def mark_unknown(self, operation_id: str, guest_id: str) -> GuestSearchOperation:
        return self.repository.transition_guest_search(
            operation_id=operation_id, guest_id=guest_id,
            target=GuestSearchOperationState.UNKNOWN, occurred_at=self.clock())

    def mark_completed(self, operation_id: str, guest_id: str) -> GuestSearchOperation:
        return self.repository.transition_guest_search(
            operation_id=operation_id, guest_id=guest_id,
            target=GuestSearchOperationState.COMPLETED, occurred_at=self.clock())
