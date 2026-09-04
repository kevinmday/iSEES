import pytest

from isees_uap.studio.errors import InvalidLifecycleTransition
from isees_uap.studio.lifecycle import StudioLifecycle, require_transition


def test_only_canonical_principal_transitions_are_allowed():
    allowed = {
        ("DRAFT", "CANDIDATE_KNOWLEDGE_ARTIFACT"),
        ("CANDIDATE_KNOWLEDGE_ARTIFACT", "MANIFOLD_CANDIDATE_NODE"),
        ("MANIFOLD_CANDIDATE_NODE", "REVIEW_TEST"),
        ("REVIEW_TEST", "ACCEPTED_KNOWLEDGE"),
        ("REVIEW_TEST", "RETURNED"),
        ("REVIEW_TEST", "REJECTED"),
        ("RETURNED", "DRAFT"),
    }
    for current in StudioLifecycle:
        for target in StudioLifecycle:
            if (current.value, target.value) in allowed:
                require_transition(current, target)
            else:
                with pytest.raises(InvalidLifecycleTransition):
                    require_transition(current, target)


def test_acceptance_cannot_bypass_review():
    with pytest.raises(InvalidLifecycleTransition):
        require_transition(StudioLifecycle.MANIFOLD_CANDIDATE_NODE,
                           StudioLifecycle.ACCEPTED_KNOWLEDGE)
