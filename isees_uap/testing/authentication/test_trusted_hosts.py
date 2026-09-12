from __future__ import annotations

import pytest
from fastapi.testclient import TestClient

from isees_uap.api import create_application
from isees_uap.api.application import trusted_hosts_from_environment


def test_permitted_and_rejected_production_host(tmp_path):
    values = {
        "ISEES_AUTH_ENV": "production",
        "ISEES_TRUSTED_HOSTS": "kevinmday-isees-cloud.hf.space",
    }
    app = create_application(values, tmp_path / "absent")
    with TestClient(app, base_url="https://kevinmday-isees-cloud.hf.space") as client:
        assert client.get("/health").status_code == 200
    with TestClient(app, base_url="https://attacker.example") as client:
        assert client.get("/health").status_code == 400


@pytest.mark.parametrize("raw", [None, "", "good.example, bad.example", "bad host"])
def test_missing_empty_and_malformed_production_configuration(raw):
    values = {"ISEES_AUTH_ENV": "production"}
    if raw is not None:
        values["ISEES_TRUSTED_HOSTS"] = raw
    with pytest.raises(RuntimeError):
        trusted_hosts_from_environment(values)


@pytest.mark.parametrize("raw", [
    "*", "*.hf.space", "localhost", "127.0.0.1", "127.0.0.2", "testserver",
])
def test_unsafe_production_configuration_is_rejected(raw):
    with pytest.raises(RuntimeError):
        trusted_hosts_from_environment({
            "ISEES_AUTH_ENV": "production", "ISEES_TRUSTED_HOSTS": raw})


def test_development_and_test_defaults_remain_usable(tmp_path):
    for environment in ("development", "test"):
        values = {"ISEES_AUTH_ENV": environment}
        assert "localhost" in trusted_hosts_from_environment(values)
        with TestClient(create_application(values, tmp_path / environment)) as client:
            assert client.get("/health").status_code == 200
