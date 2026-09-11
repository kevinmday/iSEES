"""Production-only static asset and strict SPA fallback adapter."""

from __future__ import annotations

from pathlib import Path, PurePosixPath
from urllib.parse import unquote

from fastapi import APIRouter, HTTPException, Request
from fastapi.responses import FileResponse, Response


DEFAULT_FRONTEND_DIRECTORY = Path("/app/frontend")
_BACKEND_PREFIXES = ("api", "run", "clusters", "health", "ready")


def _not_found() -> None:
    raise HTTPException(status_code=404, detail="Not Found")


def _safe_relative_path(request: Request, requested_path: str) -> Path:
    raw_path = unquote(request.scope.get("raw_path", b"").decode("latin-1"))
    parts = PurePosixPath(unquote(requested_path)).parts
    if ".." in parts or "\\" in requested_path or ".." in PurePosixPath(raw_path).parts:
        _not_found()
    return Path(*parts)


def create_frontend_router(frontend_directory: Path) -> APIRouter | None:
    """Return the last-registered frontend router, or nothing for local API development."""
    root = frontend_directory.resolve()
    index = root / "index.html"
    if not index.is_file():
        return None

    router = APIRouter(include_in_schema=False)

    @router.get("/{requested_path:path}", response_model=None)
    def serve_frontend(request: Request, requested_path: str) -> Response:
        relative = _safe_relative_path(request, requested_path)
        first = relative.parts[0].lower() if relative.parts else ""
        if first in _BACKEND_PREFIXES or (first == "report" and len(relative.parts) > 1):
            _not_found()

        candidate = (root / relative).resolve()
        if root != candidate and root not in candidate.parents:
            _not_found()
        if candidate.is_file():
            return FileResponse(candidate)

        # Asset-like requests fail closed. Browser routes are extensionless.
        if relative.suffix or first == "assets":
            _not_found()
        return FileResponse(index, media_type="text/html")

    return router


def create_frontend_root_router(frontend_directory: Path) -> APIRouter | None:
    """Create the production browser-root override ahead of the legacy API root."""
    index = frontend_directory.resolve() / "index.html"
    if not index.is_file():
        return None
    router = APIRouter(include_in_schema=False)

    @router.get("/", response_model=None)
    def serve_frontend_root() -> Response:
        return FileResponse(index, media_type="text/html")

    return router
