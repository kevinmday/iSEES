# ============================================================
# append_only_log.py
# APPEND-ONLY EPISTEMIC LOG
# ============================================================

"""
Maintains immutable cognition append history.

This log is NOT the canonical snapshot store.

Instead, it represents the chronological
transaction history of epistemic evolution.

The purpose of this ledger is to preserve:

    what happened
    when it happened
    why it happened
    what systems triggered it
    what cognition objects were affected

This creates a fully auditable cognition lineage.

No mutation.
No deletion.
Append-only.
"""

from __future__ import annotations

import json
import os

from dataclasses import asdict, dataclass, field
from datetime import datetime, UTC
from enum import Enum
from typing import Any, Dict, List, Optional


# ============================================================
# LOG PATH
# ============================================================

LOG_PATH = (
    "isees_uap/epistemic/storage/data/"
    "epistemic_append_log.json"
)


# ============================================================
# LOG EVENT TYPE
# ============================================================

class LogEventType(str, Enum):
    SNAPSHOT_CREATED = "SNAPSHOT_CREATED"
    DELTA_CREATED = "DELTA_CREATED"

    TOPOLOGY_COLLAPSE = "TOPOLOGY_COLLAPSE"
    CONTRADICTION_PROPAGATION = (
        "CONTRADICTION_PROPAGATION"
    )

    INVESTIGATION_ACTION = (
        "INVESTIGATION_ACTION"
    )

    ESCALATION_TRIGGERED = (
        "ESCALATION_TRIGGERED"
    )

    REPLAY_GENERATED = "REPLAY_GENERATED"

    REPLAY_PROMOTION_ATTEMPT = (
        "REPLAY_PROMOTION_ATTEMPT"
    )

    MANUAL_INTERVENTION = (
        "MANUAL_INTERVENTION"
    )


# ============================================================
# LOG ENTRY
# ============================================================

@dataclass(frozen=True)
class EpistemicLogEntry:
    """
    Immutable cognition transaction log entry.
    """

    log_id: str

    event_id: str

    event_type: LogEventType

    created_at: datetime = field(
        default_factory=lambda: datetime.now(UTC)
    )

    snapshot_id: Optional[str] = None

    delta_id: Optional[str] = None

    triggered_by: List[str] = field(
        default_factory=list
    )

    summary: str = ""

    rationale: str = ""

    affected_objects: List[str] = field(
        default_factory=list
    )

    metadata: Dict[str, Any] = field(
        default_factory=dict
    )


# ============================================================
# INTERNAL HELPERS
# ============================================================

def _ensure_log_exists() -> None:
    """
    Ensures append log exists.
    """

    directory = os.path.dirname(LOG_PATH)

    os.makedirs(directory, exist_ok=True)

    if not os.path.exists(LOG_PATH):
        with open(
            LOG_PATH,
            "w",
            encoding="utf-8"
        ) as f:
            json.dump(
                {"entries": []},
                f,
                indent=2
            )


def _load_log() -> Dict:
    """
    Loads append-only log.
    """

    _ensure_log_exists()

    with open(
        LOG_PATH,
        "r",
        encoding="utf-8"
    ) as f:
        return json.load(f)


def _save_log(data: Dict) -> None:
    """
    Persists append-only log.
    """

    with open(
        LOG_PATH,
        "w",
        encoding="utf-8"
    ) as f:
        json.dump(
            data,
            f,
            indent=2
        )


# ============================================================
# APPEND LOG ENTRY
# ============================================================

def append_log_entry(
    entry: EpistemicLogEntry
) -> Dict:
    """
    Appends immutable cognition log entry.
    """

    log = _load_log()

    log["entries"].append(
        asdict(entry)
    )

    _save_log(log)

    return asdict(entry)


# ============================================================
# GET EVENT LOG
# ============================================================

def get_event_log(
    event_id: str
) -> List[Dict]:
    """
    Retrieves chronological cognition history
    for an event.
    """

    log = _load_log()

    entries = [
        e
        for e in log["entries"]
        if e["event_id"] == event_id
    ]

    return sorted(
        entries,
        key=lambda x: x["created_at"]
    )


# ============================================================
# GET LOG ENTRY
# ============================================================

def get_log_entry(
    log_id: str
) -> Optional[Dict]:
    """
    Retrieves single log entry.
    """

    log = _load_log()

    for entry in log["entries"]:
        if entry["log_id"] == log_id:
            return entry

    return None


# ============================================================
# GET RECENT ENTRIES
# ============================================================

def get_recent_entries(
    limit: int = 50
) -> List[Dict]:
    """
    Retrieves recent cognition transactions.
    """

    log = _load_log()

    entries = sorted(
        log["entries"],
        key=lambda x: x["created_at"],
        reverse=True
    )

    return entries[:limit]