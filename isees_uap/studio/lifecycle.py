from __future__ import annotations

from enum import Enum


class StudioLifecycle(str, Enum):
    DRAFT = "DRAFT"
    CANDIDATE_KNOWLEDGE_ARTIFACT = "CANDIDATE_KNOWLEDGE_ARTIFACT"
    MANIFOLD_CANDIDATE_NODE = "MANIFOLD_CANDIDATE_NODE"
    REVIEW_TEST = "REVIEW_TEST"
    ACCEPTED_KNOWLEDGE = "ACCEPTED_KNOWLEDGE"
    RETURNED = "RETURNED"
    REJECTED = "REJECTED"


ALLOWED_TRANSITIONS = {
    StudioLifecycle.DRAFT: {StudioLifecycle.CANDIDATE_KNOWLEDGE_ARTIFACT},
    StudioLifecycle.CANDIDATE_KNOWLEDGE_ARTIFACT: {StudioLifecycle.MANIFOLD_CANDIDATE_NODE},
    StudioLifecycle.MANIFOLD_CANDIDATE_NODE: {StudioLifecycle.REVIEW_TEST},
    StudioLifecycle.REVIEW_TEST: {
        StudioLifecycle.ACCEPTED_KNOWLEDGE, StudioLifecycle.RETURNED,
        StudioLifecycle.REJECTED,
    },
    StudioLifecycle.RETURNED: {StudioLifecycle.DRAFT},
    StudioLifecycle.ACCEPTED_KNOWLEDGE: set(),
    StudioLifecycle.REJECTED: set(),
}


def can_transition(current: StudioLifecycle, target: StudioLifecycle) -> bool:
    return target in ALLOWED_TRANSITIONS[current]


def require_transition(current: StudioLifecycle, target: StudioLifecycle) -> None:
    if not can_transition(current, target):
        from .errors import InvalidLifecycleTransition
        raise InvalidLifecycleTransition(f"Cannot transition from {current.value} to {target.value}")
