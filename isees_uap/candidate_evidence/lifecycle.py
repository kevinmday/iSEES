from __future__ import annotations

from .errors import ProhibitedTransition

ALLOWED: dict[str, frozenset[str]] = {
    "DISCOVERED": frozenset({"REFERENCED"}),
    "SUBMITTED": frozenset({"REFERENCED"}),
    "REFERENCED": frozenset({"IN_REVIEW"}),
    "ACQUIRED": frozenset({"IN_REVIEW"}),
    "IN_REVIEW": frozenset({"DEFERRED", "EXCLUDED"}),
    "DEFERRED": frozenset({"IN_REVIEW"}),
    "ADMITTED": frozenset(),
    "EXCLUDED": frozenset(),
}


def require_transition(current: str, target: str) -> None:
    if target not in ALLOWED.get(current, frozenset()):
        raise ProhibitedTransition(f"Transition {current} -> {target} is prohibited")
