from __future__ import annotations

from dataclasses import replace
from datetime import datetime

from .canonical import canonical_hash
from .contracts import (FrontierAssignmentRevision, FrontierAssignmentRevisionId,
                        Lifecycle, ManifoldRevisionReference, SuspensionReason, _text, _time)
from .errors import InvalidLifecycleTransition


PERMITTED_TRANSITIONS = frozenset({
    (Lifecycle.SLEEPING, Lifecycle.ELIGIBLE),
    (Lifecycle.ELIGIBLE, Lifecycle.EXECUTING),
    (Lifecycle.EXECUTING, Lifecycle.SLEEPING),
    (Lifecycle.SLEEPING, Lifecycle.SUSPENDED),
    (Lifecycle.ELIGIBLE, Lifecycle.SUSPENDED),
    (Lifecycle.EXECUTING, Lifecycle.SUSPENDED),
    (Lifecycle.BUDGET_EXHAUSTED, Lifecycle.SUSPENDED),
    (Lifecycle.SUSPENDED, Lifecycle.SLEEPING),
    (Lifecycle.BUDGET_EXHAUSTED, Lifecycle.SLEEPING),
    *{(state, Lifecycle.BUDGET_EXHAUSTED) for state in (Lifecycle.SLEEPING, Lifecycle.ELIGIBLE, Lifecycle.EXECUTING)},
    *{(state, Lifecycle.EXPIRED) for state in (Lifecycle.SLEEPING, Lifecycle.ELIGIBLE, Lifecycle.EXECUTING, Lifecycle.SUSPENDED, Lifecycle.BUDGET_EXHAUSTED)},
    *{(state, Lifecycle.REVOKED) for state in (Lifecycle.SLEEPING, Lifecycle.ELIGIBLE, Lifecycle.EXECUTING, Lifecycle.SUSPENDED, Lifecycle.BUDGET_EXHAUSTED)},
})


def transition_assignment(previous: FrontierAssignmentRevision, *,
                          revision_id: FrontierAssignmentRevisionId, target: Lifecycle,
                          effective_at: datetime, actor_id: str, reason: str,
                          suspension_reason: SuspensionReason | None = None,
                          resumed_manifold_revision: ManifoldRevisionReference | None = None,
                          entitlement_revalidated: bool = False,
                          authorization_revalidated: bool = False) -> FrontierAssignmentRevision:
    if (previous.lifecycle, target) not in PERMITTED_TRANSITIONS:
        raise InvalidLifecycleTransition(f"{previous.lifecycle.value} -> {target.value} is not permitted")
    _time(effective_at,"effective_at"); _text(actor_id,"actor_id"); _text(reason,"reason")
    if target is Lifecycle.SUSPENDED and suspension_reason is None:
        raise InvalidLifecycleTransition("suspension requires an attributable reason")
    if target is not Lifecycle.SUSPENDED and suspension_reason is not None:
        raise InvalidLifecycleTransition("suspension reason is valid only for SUSPENDED")
    if previous.lifecycle in (Lifecycle.SUSPENDED, Lifecycle.BUDGET_EXHAUSTED) and target is Lifecycle.SLEEPING:
        if not (resumed_manifold_revision and entitlement_revalidated and authorization_revalidated):
            raise InvalidLifecycleTransition("governed resumption requires fresh manifold, entitlement, and authorization")
        if resumed_manifold_revision.investigation_id != previous.investigation_id:
            raise InvalidLifecycleTransition("resumption manifold belongs to another investigation")
    values = previous.hash_fields() | {
        "revision_id": revision_id, "revision_number": previous.revision_number + 1,
        "parent_revision_id": previous.revision_id, "lifecycle": target,
        "effective_at": effective_at, "created_by": actor_id,
        "transition_reason": reason, "suspension_reason": suspension_reason,
    }
    return replace(previous, **values, content_hash=canonical_hash(values))
