# ============================================================
# investigation_log.py — INVESTIGATION TRACKING LAYER (V2)
# ============================================================
# Purpose:
# Track real-world actions taken on a report (calls, emails, etc.)
#
# Characteristics:
# - File-based (JSON)
# - Append-only entries
# - Timezone-aware UTC timestamps
# - 🔥 NEW: persists geo_context for clustering engine
# ============================================================

import os
import json
from datetime import datetime, UTC
from typing import Dict, List

# ------------------------------------------------------------
# CONFIG
# ------------------------------------------------------------

BASE_DIR = os.path.dirname(os.path.dirname(__file__))
LOG_DIR = os.path.join(BASE_DIR, "logs")

os.makedirs(LOG_DIR, exist_ok=True)


# ------------------------------------------------------------
# INTERNAL HELPERS
# ------------------------------------------------------------

def _get_log_path(report_id: str) -> str:
    safe_id = report_id.replace(":", "_").replace("/", "_")
    return os.path.join(LOG_DIR, f"{safe_id}.json")


def _utc_now_iso() -> str:
    return datetime.now(UTC).isoformat()


def _load_log(report_id: str) -> Dict:
    path = _get_log_path(report_id)

    if not os.path.exists(path):
        return {
            "report_id": report_id,
            "created_at": _utc_now_iso(),
            "entries": []
        }

    try:
        with open(path, "r", encoding="utf-8") as f:
            return json.load(f)
    except Exception:
        return {
            "report_id": report_id,
            "created_at": _utc_now_iso(),
            "entries": [],
            "error": "log_corrupted_reinitialized"
        }


def _save_log(report_id: str, data: Dict):
    path = _get_log_path(report_id)

    with open(path, "w", encoding="utf-8") as f:
        json.dump(data, f, indent=2)


# ------------------------------------------------------------
# PUBLIC API
# ------------------------------------------------------------

def create_log(report_id: str, geo_context: Dict = None) -> Dict:
    """
    Ensure a log exists for a report.
    🔥 NEW: store geo_context for clustering
    """

    log = _load_log(report_id)

    # 🔥 Persist geo if provided
    if geo_context:
        log["geo_context"] = geo_context

    _save_log(report_id, log)
    return log


def add_entry(
    report_id: str,
    action: str,
    target: str,
    result: str,
    notes: str = ""
) -> Dict:

    log = _load_log(report_id)

    timestamp = _utc_now_iso()

    entry = {
        "timestamp": timestamp,
        "action": action,
        "target": target,
        "result": result,
        "notes": notes
    }

    log["entries"].append(entry)
    log["last_updated"] = timestamp

    _save_log(report_id, log)

    return entry


def get_log(report_id: str) -> Dict:
    return _load_log(report_id)


def list_logs() -> List[str]:
    files = os.listdir(LOG_DIR)
    return [f.replace(".json", "") for f in files if f.endswith(".json")]


# ------------------------------------------------------------
# OPTIONAL UTILITIES
# ------------------------------------------------------------

def clear_log(report_id: str):
    path = _get_log_path(report_id)

    if os.path.exists(path):
        os.remove(path)


# ------------------------------------------------------------
# QUICK TEST
# ------------------------------------------------------------

if __name__ == "__main__":
    test_id = "UAP-TEST-0001"

    print("\n=== CREATE LOG ===")
    create_log(
        test_id,
        geo_context={
            "center": {
                "lat": 42.3264,
                "lon": -122.8718
            }
        }
    )

    print("\n=== ADD ENTRY ===")
    add_entry(
        report_id=test_id,
        action="contacted_atc",
        target="Medford Air Traffic Control Tower",
        result="pending",
        notes="Initial outreach via phone"
    )

    print("\n=== CURRENT LOG ===")
    log = get_log(test_id)
    print(json.dumps(log, indent=2))