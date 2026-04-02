# ============================================================
# Ignition → Confirmation Tracker (ICT)
# Tracks state transitions across ticks
#
# SAFE MODULE — NO RUNTIME SIDE EFFECTS
# ============================================================

import json
from pathlib import Path
from typing import Dict


STATE_FILE = Path("logs/ignition_tracker_state.json")


# ------------------------------------------------------------
# LOAD / SAVE STATE
# ------------------------------------------------------------

def _load_state():
    if not STATE_FILE.exists():
        return {}
    try:
        with open(STATE_FILE, "r") as f:
            return json.load(f)
    except Exception:
        return {}


def _save_state(state):
    STATE_FILE.parent.mkdir(exist_ok=True)
    with open(STATE_FILE, "w") as f:
        json.dump(state, f, indent=2)


# ------------------------------------------------------------
# CORE TRANSITION DETECTION
# ------------------------------------------------------------

def detect_transitions(current_results: Dict[str, dict]) -> Dict[str, dict]:
    """
    current_results format:
    {
        "SYMBOL": {
            "regime": "IGNITION" | "CONFIRMED_TREND" | ...
            ...
        }
    }
    """

    previous_state = _load_state()
    alerts = {}

    for symbol, data in current_results.items():
        current_regime = data.get("regime", "UNKNOWN")
        prev_regime = previous_state.get(symbol)

        # ----------------------------------------------------
        # 🔥 DETECT TRANSITION
        # ----------------------------------------------------
        if prev_regime == "IGNITION" and current_regime == "CONFIRMED_TREND":
            alerts[symbol] = {
                "event": "IGNITION_CONFIRMED",
                "from": prev_regime,
                "to": current_regime
            }

        # update state
        previous_state[symbol] = current_regime

    _save_state(previous_state)

    return alerts


# ------------------------------------------------------------
# OPTIONAL: WEAK IGNITION DETECTION (early signal)
# ------------------------------------------------------------

def detect_new_ignitions(current_results: Dict[str, dict]) -> Dict[str, dict]:
    previous_state = _load_state()
    alerts = {}

    for symbol, data in current_results.items():
        current_regime = data.get("regime", "UNKNOWN")
        prev_regime = previous_state.get(symbol)

        if prev_regime not in ("IGNITION", "CONFIRMED_TREND") and current_regime == "IGNITION":
            alerts[symbol] = {
                "event": "NEW_IGNITION",
                "to": current_regime
            }

    return alerts


# ------------------------------------------------------------
# DEBUG PRINT
# ------------------------------------------------------------

def debug_print(alerts: Dict[str, dict]):
    if not alerts:
        return

    print("\n[IGNITION TRANSITIONS]\n")

    for symbol, info in alerts.items():
        print(
            f"{symbol:<6} {info['event']} "
            f"{info.get('from','')} → {info.get('to','')}"
        )