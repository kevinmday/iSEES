# ============================================================
# test_injector.py — SYNTHETIC REPORT GENERATOR (V1)
# ============================================================

import os
import json
import uuid
from datetime import datetime, timedelta, UTC
import random

# ------------------------------------------------------------
# CONFIG
# ------------------------------------------------------------

BASE_DIR = os.path.dirname(os.path.dirname(__file__))
LOG_DIR = os.path.join(BASE_DIR, "logs")

BASE_LAT = 42.326418
BASE_LON = -122.87186

# ------------------------------------------------------------
# UTIL
# ------------------------------------------------------------

def _now():
    return datetime.now(UTC)


def _rand_offset_km(max_km=0.2):
    """
    Small geo jitter to simulate different observers
    """
    return (
        BASE_LAT + random.uniform(-0.001, 0.001),
        BASE_LON + random.uniform(-0.001, 0.001)
    )


def _write_log(report):
    os.makedirs(LOG_DIR, exist_ok=True)

    filename = f"{report['report_id']}.json"
    path = os.path.join(LOG_DIR, filename)

    with open(path, "w", encoding="utf-8") as f:
        json.dump(report, f, indent=2)


# ------------------------------------------------------------
# CORE GENERATOR
# ------------------------------------------------------------

def generate_delayed_reports(
    num_reports=4,
    delay_hours_range=(0, 36)
):
    """
    Simulate a single event with delayed reporting
    """

    event_time = _now()

    print(f"\n[TEST] Simulated event time: {event_time.isoformat()}")

    for i in range(num_reports):

        delay_hours = random.uniform(*delay_hours_range)
        report_time = event_time + timedelta(hours=delay_hours)

        lat, lon = _rand_offset_km()

        report = {
            "report_id": f"TEST-{uuid.uuid4().hex[:8]}",
            "created_at": report_time.isoformat(),

            "geo_context": {
                "center": {
                    "lat": round(lat, 6),
                    "lon": round(lon, 6)
                },
                "facilities": []
            },

            "report_source": {
                "user_id": f"user_{i+1}"
            }
        }

        _write_log(report)

        print(f"[TEST] Report {i+1}: delay={round(delay_hours,2)}h → {report_time.isoformat()}")

    print("\n[TEST] Injection complete.\n")


# ------------------------------------------------------------
# MULTI-EVENT GENERATOR
# ------------------------------------------------------------

def generate_multiple_events():
    """
    Simulate multiple distinct events across time
    """

    print("\n[TEST] Generating multiple events...\n")

    # Event 1 (tight cluster)
    generate_delayed_reports(num_reports=3, delay_hours_range=(0, 2))

    # Event 2 (delayed reporting cluster)
    generate_delayed_reports(num_reports=4, delay_hours_range=(2, 24))

    # Event 3 (separate event next day)
    future_shift = timedelta(days=1)

    global BASE_LAT, BASE_LON
    BASE_LAT += 0.01  # slight location shift

    generate_delayed_reports(num_reports=3, delay_hours_range=(0, 3))


# ------------------------------------------------------------
# ENTRY
# ------------------------------------------------------------

if __name__ == "__main__":
    print("\n=== TEST INJECTOR ===")

    mode = input("Mode (1=single event, 2=multi event): ").strip()

    if mode == "2":
        generate_multiple_events()
    else:
        generate_delayed_reports()