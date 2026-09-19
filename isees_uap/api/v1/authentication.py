from __future__ import annotations

import hashlib
import logging
import uuid
from datetime import datetime
from functools import lru_cache

from fastapi import APIRouter, Depends, Request, Response
from fastapi.responses import JSONResponse
from pydantic import BaseModel, ConfigDict, Field, ValidationError

from isees_uap.authentication.candidate_access import normalize_email
from isees_uap.authentication.config import AuthenticationSettings
from isees_uap.authentication.errors import (
    AuthenticationError, AuthenticationRepositoryUnavailable, InvalidAccountInput,
)
from isees_uap.authentication.models import PasswordResetCommand, RecoveryRequestInput
from isees_uap.authentication.principal import (
    AuthenticatedPrincipal, authentication_repository,
    require_authenticated_principal, require_csrf_protected_principal, settings,
)
from isees_uap.authentication.service import AuthenticationService
from isees_uap.authentication.recovery_delivery import (
    RecoveryDelivery, RecoveryDeliveryError, recovery_delivery_from_settings,
)
from isees_uap.authentication.sqlite_repository import SQLiteAuthenticationRepository

router = APIRouter(prefix="/api/v1/auth", tags=["authentication"])
logger = logging.getLogger(__name__)

_RECOVERY_HEADERS = {
    "Cache-Control": "no-store",
    "Referrer-Policy": "no-referrer",
    "X-Content-Type-Options": "nosniff",
}
_REQUEST_ACCEPTED = {
    "schemaVersion": "isees-password-recovery-request/v1",
    "status": "ACCEPTED",
    "message": "If an account exists for that email, we sent recovery instructions.",
}
_RESET_COMPLETED = {
    "schemaVersion": "isees-password-reset/v1",
    "status": "COMPLETED",
    "message": "Your password has been reset. Sign in with your new password.",
}
_RESET_INVALID = {
    "schemaVersion": "isees-password-reset/v1",
    "status": "INVALID",
    "message": "This password reset link is invalid or has expired.",
}


class Credentials(BaseModel):
    model_config = ConfigDict(extra="forbid")
    email: str = Field(min_length=3, max_length=254)
    password: str = Field(min_length=1, max_length=1024)


class SafeResearcherIdentity(BaseModel):
    model_config = ConfigDict(extra="forbid")
    researcherId: str
    email: str
    sessionExpiresAt: datetime


class RecoveryRequestBody(BaseModel):
    model_config = ConfigDict(extra="forbid")
    email: str = Field(min_length=3, max_length=254, repr=False)


class PasswordResetBody(BaseModel):
    model_config = ConfigDict(extra="forbid")
    token: str = Field(repr=False)
    newPassword: str = Field(repr=False)


def _recovery_response(status_code: int, content: dict[str, object]) -> JSONResponse:
    return JSONResponse(status_code=status_code, content=content, headers=_RECOVERY_HEADERS)


def _safe_failure(status_code: int, code: str, message: str) -> JSONResponse:
    return _recovery_response(status_code, {"error": {"code": code, "message": message}})


async def _recovery_json(request: Request, model: type[BaseModel]) -> BaseModel | JSONResponse:
    content_type = request.headers.get("content-type", "").split(";", 1)[0].strip().lower()
    if content_type != "application/json":
        return _safe_failure(415, "JSON_REQUIRED", "A valid JSON request is required")
    try:
        payload = await request.json()
        return model.model_validate(payload)
    except (ValueError, TypeError, ValidationError):
        return _safe_failure(400, "INVALID_REQUEST", "The request is invalid")


def _authorize_recovery_request(
    request: Request, config: AuthenticationSettings,
) -> JSONResponse | bytes | None:
    if not config.password_recovery_enabled or config.public_app_origin is None:
        return _safe_failure(404, "NOT_FOUND", "The requested resource is unavailable")
    origin = request.headers.get("origin")
    if origin is None:
        return None
    if origin != config.public_app_origin:
        return _safe_failure(403, "ORIGIN_REJECTED", "The request origin is not permitted")
    return hashlib.sha256(origin.encode("ascii")).digest()


def configured_recovery_delivery(
    config: AuthenticationSettings = Depends(settings),
) -> RecoveryDelivery | None:
    return recovery_delivery_from_settings(config)


def service(
    repo: SQLiteAuthenticationRepository = Depends(authentication_repository),
    config: AuthenticationSettings = Depends(settings),
    recovery_delivery: RecoveryDelivery | None = Depends(configured_recovery_delivery),
) -> AuthenticationService:
    return AuthenticationService(
        repo,
        session_ttl_seconds=config.session_ttl_seconds,
        candidate_access=config.candidate_access,
        login_max_failures=config.login_max_failures,
        login_window_seconds=config.login_window_seconds,
        login_lockout_seconds=config.login_lockout_seconds,
        recovery_delivery=recovery_delivery,
        recovery_ttl_seconds=config.recovery_token_ttl_seconds,
    )


def _identity(account_id: str, email: str, expires_at: datetime) -> SafeResearcherIdentity:
    return SafeResearcherIdentity(
        researcherId=account_id, email=email, sessionExpiresAt=expires_at
    )


def _set_cookies(response: Response, bearer: str, csrf: str, expires_at: datetime,
                 config: AuthenticationSettings) -> None:
    common = dict(max_age=config.session_ttl_seconds, expires=expires_at,
                  path=config.cookie_path, secure=config.secure_cookies,
                  samesite=config.cookie_samesite)
    response.set_cookie(config.session_cookie_name, bearer, httponly=True, **common)
    response.set_cookie(config.csrf_cookie_name, csrf, httponly=False, **common)


def _clear_cookies(response: Response, config: AuthenticationSettings) -> None:
    response.delete_cookie(config.session_cookie_name, path=config.cookie_path,
                           secure=config.secure_cookies, httponly=True,
                           samesite=config.cookie_samesite)
    response.delete_cookie(config.csrf_cookie_name, path=config.cookie_path,
                           secure=config.secure_cookies, httponly=False,
                           samesite=config.cookie_samesite)


@router.post("/accounts", response_model=SafeResearcherIdentity, status_code=201)
def create_account(credentials: Credentials, response: Response,
                   svc: AuthenticationService = Depends(service),
                   config: AuthenticationSettings = Depends(settings)) -> SafeResearcherIdentity:
    account = svc.create_account(email=credentials.email, password=credentials.password)
    account, issued = svc.login(email=credentials.email, password=credentials.password)
    _set_cookies(response, issued.bearer_secret, issued.csrf_secret,
                 issued.session.expires_at, config)
    return _identity(account.account_id, account.email, issued.session.expires_at)


@router.post("/sessions", response_model=SafeResearcherIdentity)
def login(credentials: Credentials, response: Response,
          svc: AuthenticationService = Depends(service),
          config: AuthenticationSettings = Depends(settings)) -> SafeResearcherIdentity:
    account, issued = svc.login(email=credentials.email, password=credentials.password)
    _set_cookies(response, issued.bearer_secret, issued.csrf_secret,
                 issued.session.expires_at, config)
    return _identity(account.account_id, account.email, issued.session.expires_at)


@router.get("/session", response_model=SafeResearcherIdentity)
def restore_session(
    principal: AuthenticatedPrincipal = Depends(require_authenticated_principal),
) -> SafeResearcherIdentity:
    return _identity(principal.account_id, principal.email, principal.session_expires_at)


@router.post("/logout", status_code=200)
def logout(response: Response,
           principal: AuthenticatedPrincipal = Depends(require_csrf_protected_principal),
           repo: SQLiteAuthenticationRepository = Depends(authentication_repository),
           config: AuthenticationSettings = Depends(settings)) -> dict[str, str]:
    from datetime import timezone
    repo.revoke_session(session_id=principal.session_id, revoked_at=datetime.now(timezone.utc))
    _clear_cookies(response, config)
    return {"status": "logged_out"}


@router.post("/password-recovery/request", status_code=202)
async def request_password_recovery(
    request: Request,
    config: AuthenticationSettings = Depends(settings),
    svc: AuthenticationService = Depends(service),
) -> JSONResponse:
    origin = _authorize_recovery_request(request, config)
    if isinstance(origin, JSONResponse):
        return origin
    body = await _recovery_json(request, RecoveryRequestBody)
    if isinstance(body, JSONResponse):
        return body
    assert isinstance(body, RecoveryRequestBody)
    try:
        normalize_email(body.email)
    except InvalidAccountInput:
        return _safe_failure(400, "INVALID_REQUEST", "The request is invalid")
    try:
        svc.request_password_recovery(RecoveryRequestInput(
            email=body.email, request_id=str(uuid.uuid4()), origin_digest=origin,
        ))
    except RecoveryDeliveryError as error:
        rejected = (error.category == "http_rejection"
                    and error.http_status is not None and error.http_status < 500)
        operational_status = "DELIVERY_REJECTED" if rejected else "PROVIDER_UNAVAILABLE"
        logger.error(
            "Password recovery operational status=%s category=%s provider_http_status=%s "
            "provider_error_code=%s",
            operational_status, error.category,
            error.http_status if error.http_status is not None else "unavailable",
            error.provider_error_code or "unavailable",
        )
    except AuthenticationRepositoryUnavailable:
        logger.error("Password recovery repository operation failed")
        return _safe_failure(503, "AUTHENTICATION_UNAVAILABLE", "Service is temporarily unavailable")
    return _recovery_response(202, _REQUEST_ACCEPTED)


@router.post("/password-recovery/reset")
async def reset_password(
    request: Request,
    config: AuthenticationSettings = Depends(settings),
    svc: AuthenticationService = Depends(service),
) -> JSONResponse:
    origin = _authorize_recovery_request(request, config)
    if isinstance(origin, JSONResponse):
        return origin
    body = await _recovery_json(request, PasswordResetBody)
    if isinstance(body, JSONResponse):
        return body
    assert isinstance(body, PasswordResetBody)
    if not 12 <= len(body.newPassword) <= 1024:
        return _safe_failure(
            400, "PASSWORD_POLICY", "Password must be between 12 and 1024 characters",
        )
    try:
        outcome = svc.reset_password(PasswordResetCommand(
            token=body.token, new_password=body.newPassword,
            request_id=str(uuid.uuid4()), origin_digest=origin,
        ))
    except InvalidAccountInput:
        return _safe_failure(
            400, "PASSWORD_POLICY", "Password must be between 12 and 1024 characters",
        )
    except AuthenticationRepositoryUnavailable:
        logger.error("Password reset repository operation failed")
        return _safe_failure(503, "AUTHENTICATION_UNAVAILABLE", "Service is temporarily unavailable")
    return _recovery_response(200 if outcome.completed else 400,
                              _RESET_COMPLETED if outcome.completed else _RESET_INVALID)


def authentication_error_handler(request: Request, error: AuthenticationError) -> JSONResponse:
    request_id = request.headers.get("X-Request-Id", str(uuid.uuid4()))
    message = (
        "Account registration is unavailable"
        if error.code == "ACCOUNT_UNAVAILABLE" else str(error)
    )
    return JSONResponse(status_code=error.status_code, content={"error": {
        "code": error.code, "message": message, "requestId": request_id,
    }})
