# ============================================================
# monitor_loop.py — REALTIME MONITOR LOOP (V10 CUSTOM VOICE)
# ============================================================

import os
import json
import time
import urllib.parse
import urllib.request
from datetime import datetime, UTC
from typing import Dict, List

# ------------------------------------------------------------
# CONFIG
# ------------------------------------------------------------

INTERVAL_SECONDS = 30

BASE_DIR = os.path.dirname(os.path.dirname(__file__))
STATE_FILE = os.path.join(BASE_DIR, "runtime", "monitor_state.json")

WEBHOOK_URL = "http://localhost:5001/alert"
ENABLE_WEBHOOK = True

# ------------------------------------------------------------
# SMS + VOICE CONFIG (TWILIO)
# ------------------------------------------------------------

ENABLE_SMS = True
ENABLE_VOICE = True

TWILIO_ACCOUNT_SID = "ACxxxxxxxxxxxxxxxxxxxxxxxx"
TWILIO_AUTH_TOKEN = "your_auth_token_here"
TWILIO_FROM_PHONE = "+1234567890"

CONTACT_PHONE_MAP = {
    "CONTACT_ATC": "+1XXXXXXXXXX",
    "CONTACT_NWS": "+1XXXXXXXXXX",
    "CONTACT_AIRPORT_OPS": "+1XXXXXXXXXX"
}

DEFAULT_PHONE = "+1XXXXXXXXXX"

# 🔥 YOUR LOCAL VOICE SERVER
VOICE_URL = "http://localhost:5002"


# ------------------------------------------------------------
# STATE
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
# EVENT KEY
# ------------------------------------------------------------

def build_event_key(event: Dict) -> str:
    lat = round(event.get("lat", 0), 2)
    lon = round(event.get("lon", 0), 2)

    timestamp = event.get("timestamp")
    if isinstance(timestamp, str):
        dt = datetime.fromisoformat(timestamp.replace("Z", "+00:00"))
    else:
        dt = datetime.now(UTC)

    time_bucket = dt.strftime("%Y%m%d%H%M")[:-1]
    event_type = event.get("type", "unknown")

    return f"{lat}_{lon}_{time_bucket}_{event_type}"


# ------------------------------------------------------------
# OUTPUT CHANNELS
# ------------------------------------------------------------

def send_webhook(event: Dict, alert_type: str):
    if not ENABLE_WEBHOOK:
        return

    payload = {
        "timestamp": datetime.now(UTC).isoformat(),
        "alert_type": alert_type,
        "event": event
    }

    try:
        req = urllib.request.Request(
            WEBHOOK_URL,
            data=json.dumps(payload).encode(),
            headers={"Content-Type": "application/json"},
            method="POST"
        )
        urllib.request.urlopen(req, timeout=3)
    except Exception as e:
        print(f"[WEBHOOK ERROR] {e}")


def send_sms(event: Dict, to_phone: str, target: str = ""):
    if not ENABLE_SMS:
        return

    try:
        from twilio.rest import Client
        client = Client(TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN)

        message = (
            f"High priority event near {event.get('lat')}, {event.get('lon')}."
            f" Reports: {event.get('report_count')}. Target: {target}."
        )

        msg = client.messages.create(
            body=message,
            from_=TWILIO_FROM_PHONE,
            to=to_phone
        )

        print(f"📱 SMS → {to_phone} | SID: {msg.sid}")

    except Exception as e:
        print(f"[SMS ERROR] {e}")


# ------------------------------------------------------------
# 🔥 CUSTOM VOICE CALL (DYNAMIC MESSAGE)
# ------------------------------------------------------------

def make_voice_call(to_phone: str, event: Dict, target: str = ""):
    if not ENABLE_VOICE:
        return

    try:
        from twilio.rest import Client
        client = Client(TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN)

        # 🔥 Build dynamic message
        message = (
            f"Alert. High priority aerial event detected. "
            f"{event.get('report_count')} reports near "
            f"{event.get('lat')}, {event.get('lon')}. "
            f"Pattern {event.get('pattern')}. "
            f"Target {target}. Please investigate immediately."
        )

        encoded = urllib.parse.urlencode({"message": message})

        call = client.calls.create(
            to=to_phone,
            from_=TWILIO_FROM_PHONE,
            url=f"{VOICE_URL}?{encoded}"
        )

        print(f"📞 CALL → {to_phone} | SID: {call.sid}")

    except Exception as e:
        print(f"[VOICE ERROR] {e}")


# ------------------------------------------------------------
# CONTACT ROUTING
# ------------------------------------------------------------

def route_contacts(event: Dict):
    contacts = event.get("contacts", [])

    for c in contacts:
        ctype = c.get("type")
        target = c.get("target", "UNKNOWN")

        print(f"📡 Routing to {ctype}: {target}")

        to_phone = CONTACT_PHONE_MAP.get(ctype, DEFAULT_PHONE)

        if event.get("level") == "HIGH":
            send_sms(event, to_phone, target)
            make_voice_call(to_phone, event, target)


# ------------------------------------------------------------
# PRIORITY ROUTING
# ------------------------------------------------------------

def route_alert(event: Dict, alert_type: str):
    level = event.get("level")

    if level == "LOW":
        return

    if level == "MEDIUM":
        send_webhook(event, alert_type)

    elif level == "HIGH":
        send_webhook(event, alert_type)

        # fallback to you
        send_sms(event, DEFAULT_PHONE)
        make_voice_call(DEFAULT_PHONE, event)

        route_contacts(event)


# ------------------------------------------------------------
# ALERT ENGINE
# ------------------------------------------------------------

def alert_new(event: Dict):
    print("\n🟢 NEW EVENT DETECTED")
    route_alert(event, "NEW_EVENT")


def alert_escalated(event: Dict, prev_level: str):
    print("\n🔺 EVENT ESCALATED")
    route_alert(event, "ESCALATED")


def alert_high(event: Dict):
    print("\n🚨 HIGH PRIORITY EVENT")
    route_alert(event, "HIGH")


# ------------------------------------------------------------
# PIPELINE
# ------------------------------------------------------------

def run_pipeline() -> List[Dict]:
    try:
        from isees_uap.analysis.cluster_engine import run_cluster_engine

        result = run_cluster_engine()
        raw_events = result.get("events", [])

        events = []

        for e in raw_events:
            center = e.get("event_center", {})

            score = e.get("scoring", {}).get("event_score", 0)

            if score >= 70:
                level = "HIGH"
            elif score >= 40:
                level = "MEDIUM"
            else:
                level = "LOW"

            events.append({
                "lat": center.get("lat"),
                "lon": center.get("lon"),
                "timestamp": e.get("inferred_event_time"),
                "type": "uap_event",
                "level": level,
                "report_count": e.get("report_count", 0),
                "pattern": e.get("event_pattern", {}).get("event_pattern_type"),
                "contacts": e.get("contacts", [])
            })

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
            events = run_pipeline()

            for event in events:
                key = build_event_key(event)

                prev = state["events"].get(key)
                prev_level = prev["level"] if prev else None
                current_level = event.get("level")

                if prev is None:
                    alert_new(event)

                elif prev_level != current_level:
                    alert_escalated(event, prev_level)

                if prev_level != "HIGH" and current_level == "HIGH":
                    alert_high(event)

                state["events"][key] = {
                    "level": current_level,
                    "first_seen": prev.get("first_seen") if prev else datetime.now(UTC).isoformat(),
                    "last_seen": datetime.now(UTC).isoformat()
                }

            save_state(state)
            time.sleep(INTERVAL_SECONDS)

        except KeyboardInterrupt:
            print("\n[MONITOR STOPPED]")
            break

        except Exception as e:
            print(f"[ERROR] {e}")
            time.sleep(5)


if __name__ == "__main__":
    monitor_loop()