# ============================================================
# snapshot_store.py
# IMMUTABLE SNAPSHOT STORAGE
# ============================================================

"""
Append-only snapshot persistence layer.

This module defines the canonical persistence rules for:

    immutable cognition snapshots

Snapshots are NEVER mutated after creation.

Replay systems may reconstruct cognition evolution,
but replay-generated cognition does NOT automatically
become canonical historical truth.

Allowed operations:

    append_snapshot()
    get_snapshot()
    get_latest_snapshot()
    get_event_lineage()
    verify_snapshot_integrity()

Disallowed operations:

    update_snapshot()
    overwrite_snapshot()
    delete_snapshot()
"""

from __future__ import annotations

import hashlib
import json
import os

from dataclasses import asdict
from typing import Dict, List, Optional

from isees_uap.epistemic.models.snapshot_models import (
    EpistemicSnapshot
)


# ============================================================
# STORAGE PATH
# ============================================================

STORE_PATH = (
    "isees_uap/epistemic/storage/data/snapshots.json"
)


# ============================================================
# INTERNAL HELPERS
# ============================================================

def _ensure_store_exists() -> None:
    """
    Ensures snapshot store exists.
    """

    directory = os.path.dirname(STORE_PATH)

    os.makedirs(directory, exist_ok=True)

    if not os.path.exists(STORE_PATH):
        with open(STORE_PATH, "w", encoding="utf-8") as f:
            json.dump({"snapshots": []}, f, indent=2)


def _load_store() -> Dict:
    """
    Loads snapshot store.
    """

    _ensure_store_exists()

    with open(STORE_PATH, "r", encoding="utf-8") as f:
        return json.load(f)


def _save_store(data: Dict) -> None:
    """
    Persists snapshot store.
    """

    with open(STORE_PATH, "w", encoding="utf-8") as f:
        json.dump(data, f, indent=2)


def _compute_snapshot_hash(snapshot: EpistemicSnapshot) -> str:
    """
    Computes immutable integrity hash.
    """

    payload = asdict(snapshot)

    payload["immutability_hash"] = None

    encoded = json.dumps(
        payload,
        sort_keys=True,
        default=str
    ).encode("utf-8")

    return hashlib.sha256(encoded).hexdigest()


# ============================================================
# APPEND SNAPSHOT
# ============================================================

def append_snapshot(
    snapshot: EpistemicSnapshot
) -> EpistemicSnapshot:
    """
    Appends immutable snapshot to store.

    No overwrite behavior allowed.
    """

    store = _load_store()

    existing = get_snapshot(snapshot.snapshot_id)

    if existing is not None:
        raise ValueError(
            f"Snapshot already exists: "
            f"{snapshot.snapshot_id}"
        )

    snapshot_hash = _compute_snapshot_hash(snapshot)

    finalized_snapshot = EpistemicSnapshot(
        **{
            **asdict(snapshot),
            "immutability_hash": snapshot_hash
        }
    )

    store["snapshots"].append(
        asdict(finalized_snapshot)
    )

    _save_store(store)

    return finalized_snapshot


# ============================================================
# GET SNAPSHOT
# ============================================================

def get_snapshot(
    snapshot_id: str
) -> Optional[Dict]:
    """
    Retrieves snapshot by ID.
    """

    store = _load_store()

    for snapshot in store["snapshots"]:
        if snapshot["snapshot_id"] == snapshot_id:
            return snapshot

    return None


# ============================================================
# GET LATEST SNAPSHOT
# ============================================================

def get_latest_snapshot(
    event_id: str
) -> Optional[Dict]:
    """
    Retrieves latest temporal layer snapshot.
    """

    store = _load_store()

    candidates = [
        s
        for s in store["snapshots"]
        if s["event_id"] == event_id
    ]

    if not candidates:
        return None

    return sorted(
        candidates,
        key=lambda x: x.get("temporal_layer", 0)
    )[-1]


# ============================================================
# GET EVENT LINEAGE
# ============================================================

def get_event_lineage(
    event_id: str
) -> List[Dict]:
    """
    Retrieves ordered cognition lineage.
    """

    store = _load_store()

    lineage = [
        s
        for s in store["snapshots"]
        if s["event_id"] == event_id
    ]

    return sorted(
        lineage,
        key=lambda x: x.get("temporal_layer", 0)
    )


# ============================================================
# VERIFY INTEGRITY
# ============================================================

def verify_snapshot_integrity(
    snapshot_id: str
) -> bool:
    """
    Verifies immutable snapshot integrity.
    """

    snapshot = get_snapshot(snapshot_id)

    if snapshot is None:
        return False

    stored_hash = snapshot.get(
        "immutability_hash"
    )

    payload = dict(snapshot)

    payload["immutability_hash"] = None

    encoded = json.dumps(
        payload,
        sort_keys=True,
        default=str
    ).encode("utf-8")

    computed_hash = hashlib.sha256(
        encoded
    ).hexdigest()

    return stored_hash == computed_hash