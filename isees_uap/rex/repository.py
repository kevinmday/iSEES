from __future__ import annotations

from typing import Protocol


class RexRepository(Protocol):
    """Durable REX authority. Implementations require explicit initialization."""

    def initialize(self) -> None: ...
    def schema_version(self) -> int: ...
