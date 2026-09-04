"""Canonical STUDIO domain and lifecycle contract."""

from .lifecycle import StudioLifecycle
from .service import StudioService

__all__ = ["StudioLifecycle", "StudioService"]
