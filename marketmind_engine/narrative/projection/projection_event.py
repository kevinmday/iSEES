from dataclasses import dataclass
from typing import Optional


@dataclass(frozen=True)
class ProjectionEvent:
    """
    Deterministic projection event emitted by NarrativeAdapter.

    🔥 UPGRADE:
    - Carries narrative content (title)
    - Carries optional timestamp
    - Enables true narrative-level normalization and analysis
    """

    symbol: str
    engine_time: int
    source: str
    sentiment: float
    weight: float

    # 🔥 NEW FIELDS (SAFE ADDITIONS)
    title: Optional[str] = None
    timestamp: Optional[str] = None