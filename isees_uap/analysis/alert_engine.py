# ============================================================
# alert_engine.py — ALERT ENGINE (V1)
# ============================================================

from typing import Dict, List
from datetime import datetime, UTC
import json
import os


# ------------------------------------------------------------
# CONFIG
# ------------------------------------------------------------

BASE_DIR = os.path.dirname(os.path.dirname(__file__))
ALERT_LOG = os.path.join(BASE_DIR, "alerts", "alerts.log")


# ------------------------------------------------------------
# CORE ALERT
# ------------------------------------------------------------

def trigger_alert(event: Dict):
    """
    Fire alert for HIGH priority events
    """

    scoring = event.get("scoring", {})
    priority = scoring.get("priority")

    if priority != "HIGH":
        return

    timestamp = datetime.now(UTC).isoformat()

    alert = {
        "timestamp": timestamp,
        "event_id": event.get("event_id"),
        "priority": priority,
        "score": scoring.get("event_score"),
        "location": event.get("event_center"),
        "report_count": event.get("report_count"),
        "action": scoring.get("recommended_action"),
        "contacts": event.get("routing", {}).get("actions", [])
    }

    # --------------------------------------------------------
    # PRINT ALERT (REAL-TIME)
    # --------------------------------------------------------

    print("\n🚨 HIGH PRIORITY EVENT DETECTED 🚨")
    print(json.dumps(alert, indent=2))

    # --------------------------------------------------------
    # LOG ALERT
    # --------------------------------------------------------

    _log_alert(alert)


# ------------------------------------------------------------
# LOGGING
# ------------------------------------------------------------

def _log_alert(alert: Dict):
    os.makedirs(os.path.dirname(ALERT_LOG), exist_ok=True)

    with open(ALERT_LOG, "a", encoding="utf-8") as f:
        f.write(json.dumps(alert) + "\n")


# ------------------------------------------------------------
# APPLY TO ALL EVENTS
# ------------------------------------------------------------

def process_alerts(events: List[Dict]) -> List[Dict]:
    """
    Scan events and trigger alerts where needed
    """

    for event in events:
        trigger_alert(event)

    return events