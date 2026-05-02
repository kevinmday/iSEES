# ============================================================
# monitor_loop.py — REALTIME MONITOR LOOP (V2 LIVE PIPELINE)
# ============================================================

import os
import json
import time
from datetime import datetime, UTC
from typing import Dict, List

# ------------------------------------------------------------
# CONFIG
# ------------------------------------------------------------

INTERVAL_SECONDS = 30

BASE_DIR = os.path.dirname(os.path.dirname(__file__))
STATE_FILE = os.path.join(BASE_DIR, "runtime", "monitor_state.json")


# ------------------------------------------------------------
# STATE HANDLING
# ------------------------------------------------------------

def load_state() -> Dict:
    if not os.path.exists(STATE_FILE):
        return {"events": {}}
    try:
        with open(STATE_FILE, "r") as f:
            return json.load(f)
    except Exception:
        return {"events": {}}


def save_state(state: Dict):
    with open(STATE_FILE, "w") as f:
        json.dump(state, f, indent=2)


# ------------------------------------------------------------
# EVENT KEY (STABLE FINGERPRINT)
# ------------------------------------------------------------

def build_event_key(event: Dict) -> str:
    """
    Stable identity for real-world events across loop cycles
    """

    lat = round(event.get("lat", 0), 2)
    lon = round(event.get("lon", 0), 2)

    timestamp = event.get("timestamp")
    if isinstance(timestamp, str):
        dt = datetime.fromisoformat(timestamp.replace("Z", "+00:00"))
    else:
        dt = datetime.now(UTC)

    # ~10-minute bucket
    time_bucket = dt.strftime("%Y%m%d%H%M")[:-1]

    event_type = event.get("type", "unknown")

    return f"{lat}_{lon}_{time_bucket}_{event_type}"


# ------------------------------------------------------------
# ALERT ENGINE (MONITOR LEVEL)
# ------------------------------------------------------------

def trigger_alert(event: Dict):
    print("\n⚠️ MONITOR ALERT — HIGH PRIORITY EVENT")
    print("--------------------------------------------------")
    print(f"Type: {event.get('type')}")
    print(f"Location: {event.get('lat')}, {event.get('lon')}")
    print(f"Reports: {event.get('report_count')}")
    print(f"Pattern: {event.get('pattern')}")
    print("--------------------------------------------------\n")


# ------------------------------------------------------------
# REAL PIPELINE ADAPTER
# ------------------------------------------------------------

def run_pipeline() -> List[Dict]:
    """
    Calls full cluster_engine pipeline and normalizes output
    """

    try:
        from isees_uap.analysis.cluster_engine import run_cluster_engine

        result = run_cluster_engine()

        raw_events = result.get("events", [])
        events = []

        for e in raw_events:

            center = e.get("event_center", {})
            lat = center.get("lat")
            lon = center.get("lon")

            timestamp = e.get("inferred_event_time")

            pattern = e.get("event_pattern", {}).get(
                "event_pattern_type", "single_event"
            )

            scoring = e.get("scoring", {})
            score = scoring.get("event_score", 0)

            # --------------------------------------------------------
            # SCORE → LEVEL
            # --------------------------------------------------------
            if score >= 70:
                level = "HIGH"
            elif score >= 40:
                level = "MEDIUM"
            else:
                level = "LOW"

            events.append({
                "lat": lat,
                "lon": lon,
                "timestamp": timestamp,
                "type": "uap_event",
                "level": level,
                "report_count": e.get("report_count", 0),
                "pattern": pattern
            })

        print(f"[PIPELINE] events={len(events)}")

        return events

    except Exception as e:
        print(f"[PIPELINE ERROR] {e}")
        return []


# ------------------------------------------------------------
# MAIN LOOP
# ------------------------------------------------------------

def monitor_loop():
    print(f"[MONITOR START] interval={INTERVAL_SECONDS}s")

    state = load_state()

    while True:
        try:
            print("\n[LOOP] scanning...")

            events = run_pipeline()

            for event in events:
                key = build_event_key(event)
                current_level = event.get("level", "LOW")

                previous = state["events"].get(key)
                previous_level = previous["level"] if previous else None

                # ----------------------------------------------------
                # EDGE TRIGGER ALERT
                # ----------------------------------------------------
                if previous_level != "HIGH" and current_level == "HIGH":
                    trigger_alert(event)

                # ----------------------------------------------------
                # STATE UPDATE
                # ----------------------------------------------------
                state["events"][key] = {
                    "level": current_level,
                    "last_seen": datetime.now(UTC).isoformat()
                }

            save_state(state)

            print("[LOOP COMPLETE]")
            time.sleep(INTERVAL_SECONDS)

        except KeyboardInterrupt:
            print("\n[MONITOR STOPPED BY USER]")
            break

        except Exception as e:
            print(f"[ERROR] {e}")
            time.sleep(5)


# ------------------------------------------------------------
# ENTRY POINT
# ------------------------------------------------------------

if __name__ == "__main__":
    monitor_loop()