from datetime import datetime, timezone

import pytest

from isees_uap.studio.hashing import canonical_hash
from isees_uap.studio.models import (
    ResolutionStatus, SourceClassification, SourceKind, StudioSourceSnapshot,
)


def snapshot() -> StudioSourceSnapshot:
    return StudioSourceSnapshot(
        "s1", "node:1", "source-investigation", "MANIFOLD", SourceKind.EVENT_NODE,
        SourceClassification.CANONICAL, datetime(2026, 1, 1, tzinfo=timezone.utc),
        "source/v1", "application/json", {"b": 2, "a": 1},
        source_revision_id="revision:1")


def test_canonical_hash_orders_objects_but_preserves_arrays():
    assert canonical_hash({"b": 2, "a": {"y": 2, "x": 1}}) == canonical_hash(
        {"a": {"x": 1, "y": 2}, "b": 2})
    assert canonical_hash([1, 2]) != canonical_hash([2, 1])


def test_snapshot_resolution_is_excluded_from_hash():
    original = snapshot()
    changed = original.with_resolution(ResolutionStatus.STALE, {"checked": True})
    assert changed.snapshot_hash == original.snapshot_hash
    assert changed.captured_representation == original.captured_representation


@pytest.mark.parametrize("value", [float("nan"), float("inf"), float("-inf")])
def test_non_finite_values_are_rejected(value):
    with pytest.raises(ValueError):
        canonical_hash({"value": value})


def test_utc_instants_have_one_hash_representation():
    from datetime import timedelta
    assert canonical_hash(datetime(2026, 1, 1, tzinfo=timezone.utc)) == canonical_hash(
        datetime(2025, 12, 31, 16, tzinfo=timezone(timedelta(hours=-8))))
