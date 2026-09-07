from __future__ import annotations

import uuid
from datetime import datetime
from functools import lru_cache

from fastapi import APIRouter, Depends, Request, Response
from fastapi.responses import JSONResponse
from pydantic import BaseModel, ConfigDict, Field

from isees_uap.authentication.config import AuthenticationSettings, authentication_settings
from isees_uap.authentication.errors import AuthenticationError
from isees_uap.authentication.principal import (
    AuthenticatedPrincipal, authentication_repository,
    require_authenticated_principal, require_csrf_protected_principal,
)
from isees_uap.authentication.service import AuthenticationService
from isees_uap.authentication.sqlite_repository import SQLiteAuthenticationRepository

router = APIRouter(prefix="/api/v1/auth", tags=["authentication"])


class Credentials(BaseModel):
    model_config = ConfigDict(extra="forbid")
    email: str = Field(min_length=3, max_length=254)
    password: str = Field(min_length=1, max_length=1024)


class SafeResearcherIdentity(BaseModel):
    model_config = ConfigDict(extra="forbid")
    researcherId: str
    email: str
    sessionExpiresAt: datetime


def settings() -> AuthenticationSettings:
    return authentication_settings()


def service(
    repo: SQLiteAuthenticationRepository = Depends(authentication_repository),
    config: AuthenticationSettings = Depends(settings),
) -> AuthenticationService:
    return AuthenticationService(repo, session_ttl_seconds=config.session_ttl_seconds)


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


def authentication_error_handler(request: Request, error: AuthenticationError) -> JSONResponse:
    request_id = request.headers.get("X-Request-Id", str(uuid.uuid4()))
    return JSONResponse(status_code=error.status_code, content={"error": {
        "code": error.code, "message": str(error), "requestId": request_id,
    }})
