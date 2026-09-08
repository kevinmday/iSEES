from __future__ import annotations

from contextlib import contextmanager
from dataclasses import dataclass
from pathlib import Path
from uuid import uuid4
from typing import Any

from fastapi.testclient import TestClient

from isees_uap.api import app
from isees_uap.api.v1.authentication import settings
from isees_uap.api.v1.investigations import repository as investigation_repository
from isees_uap.authentication.config import AuthenticationSettings
from isees_uap.authentication.principal import authentication_repository
from isees_uap.authentication.sqlite_repository import SQLiteAuthenticationRepository
from isees_uap.investigations.sqlite_repository import SQLiteInvestigationRepository

TEST_PASSWORD = "correct horse battery staple"


@dataclass(frozen=True)
class AuthenticatedRouteSession:
    client: TestClient
    account_id: str
    authentication: SQLiteAuthenticationRepository
    investigations: SQLiteInvestigationRepository

    @property
    def csrf_headers(self) -> dict[str, str]:
        return {"X-ISEES-CSRF": self.client.cookies.get("isees_csrf")}

    def command(self, value: dict) -> dict:
        return {**value, "principalId": self.account_id}

    def post(self, url: str, *, json: dict | None = None,
             headers: dict[str, str] | None = None, **kwargs: Any):
        body = self.command(json) if json is not None and "principalId" in json else json
        merged = {**self.csrf_headers, **(headers or {})}
        return self.client.post(url, json=body, headers=merged, **kwargs)

    def get(self, url: str, *, headers: dict[str, str] | None = None, **kwargs: Any):
        return self.client.get(url, headers=headers, **kwargs)


@contextmanager
def authenticated_route_session(
    root: Path, *, investigation_ids: tuple[str, ...] = ("i1",)
):
    authentication = SQLiteAuthenticationRepository(root / "authentication.sqlite3")
    investigations = SQLiteInvestigationRepository(root / "investigations.sqlite3")
    config = AuthenticationSettings(
        database_path=authentication.path,
        secure_cookies=False,
        session_ttl_seconds=3600,
    )
    owned_overrides = {
        authentication_repository: lambda: authentication,
        settings: lambda: config,
        investigation_repository: lambda: investigations,
    }
    prior = {key: app.dependency_overrides.get(key) for key in owned_overrides}
    app.dependency_overrides.update(owned_overrides)
    client = TestClient(app)
    try:
        response = client.post(
            "/api/v1/auth/accounts",
            json={
                "email": f"route-{uuid4().hex}@example.test",
                "password": TEST_PASSWORD,
            },
        )
        assert response.status_code == 201, response.text
        account_id = response.json()["researcherId"]
        for investigation_id in investigation_ids:
            investigations.create(
                investigation_id=investigation_id,
                owner_principal_id=account_id,
                title=f"Test {investigation_id}",
            )
        yield AuthenticatedRouteSession(
            client, account_id, authentication, investigations
        )
    finally:
        client.close()
        for key, value in prior.items():
            if value is None:
                app.dependency_overrides.pop(key, None)
            else:
                app.dependency_overrides[key] = value
