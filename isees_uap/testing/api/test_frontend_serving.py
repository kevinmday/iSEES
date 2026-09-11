from pathlib import Path

from fastapi.testclient import TestClient

from isees_uap.api import create_application


def frontend_fixture(tmp_path: Path) -> Path:
    (tmp_path / "assets").mkdir()
    (tmp_path / "index.html").write_text("<html>iSEES SPA</html>", encoding="utf-8")
    (tmp_path / "assets" / "app-a1b2c3.js").write_text("export {};", encoding="utf-8")
    return tmp_path


def test_frontend_root_nested_route_and_asset(tmp_path: Path) -> None:
    client = TestClient(create_application({}, frontend_fixture(tmp_path)))
    assert client.get("/").headers["content-type"].startswith("text/html")
    assert "iSEES SPA" in client.get("/workspace/investigation-1").text
    asset = client.get("/assets/app-a1b2c3.js")
    assert asset.status_code == 200
    assert "javascript" in asset.headers["content-type"]


def test_missing_asset_and_backend_misses_never_fall_through(tmp_path: Path) -> None:
    client = TestClient(create_application({}, frontend_fixture(tmp_path)))
    for path in ("/assets/missing.js", "/favicon.ico", "/api/missing", "/run/missing", "/clusters/missing", "/report/missing/extra"):
        response = client.get(path)
        assert response.status_code == 404, path
        assert "iSEES SPA" not in response.text, path


def test_legacy_routes_win_and_exact_report_is_a_browser_route(tmp_path: Path) -> None:
    application = create_application({}, frontend_fixture(tmp_path))
    client = TestClient(application)
    route_methods = {(route.path, frozenset(route.methods or set())) for route in application.routes}
    assert ("/run", frozenset({"GET"})) in route_methods
    assert ("/clusters", frozenset({"GET"})) in route_methods
    assert ("/report", frozenset({"POST"})) in route_methods
    assert ("/report/{event_id}", frozenset({"GET"})) in route_methods
    assert isinstance(client.get("/clusters").json(), list)
    assert client.get("/report/unknown").json()["event_id"] == "unknown"
    assert "iSEES SPA" in client.get("/report").text
    assert "iSEES SPA" in client.get("/briefing").text
    assert "iSEES SPA" in client.get("/capture").text


def test_traversal_is_rejected(tmp_path: Path) -> None:
    client = TestClient(create_application({}, frontend_fixture(tmp_path)))
    response = client.get("/%2e%2e/secret.txt", follow_redirects=False)
    assert response.status_code == 404
    assert "iSEES SPA" not in response.text


def test_backend_composes_without_frontend_artifacts(tmp_path: Path) -> None:
    client = TestClient(create_application({}, tmp_path / "absent"))
    assert client.get("/").json() == {"status": "iSEES UAP API LIVE"}
    assert client.get("/api/missing").status_code == 404
