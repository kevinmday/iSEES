# ============================================================
# hotspot_intelligence.py — LOCATION INTELLIGENCE (V2 DECAY)
# ============================================================

from typing import Dict
from math import log


# ------------------------------------------------------------
# CORE HOTSPOT LOGIC
# ------------------------------------------------------------

def compute_hotspot(memory: Dict) -> Dict:

    total_events = memory.get("total_events", 0)
    recurrence_score = memory.get("recurrence_score", 0.0)
    decay_factor = memory.get("decay_factor", 1.0)

    if total_events <= 0:
        return {
            "hotspot_score": 0.0,
            "activity_trend": "none",
            "classification": "none"
        }

    # --------------------------------------------------------
    # SCORE (WITH DECAY)
    # --------------------------------------------------------

    base_score = recurrence_score + (log(total_events + 1) / 3)

    hotspot_score = base_score * decay_factor
    hotspot_score = min(1.0, hotspot_score)

    # --------------------------------------------------------
    # TREND (NOW TIME-AWARE)
    # --------------------------------------------------------

    if decay_factor > 0.85:
        trend = "rising"
    elif decay_factor > 0.6:
        trend = "stable"
    elif decay_factor > 0.3:
        trend = "decaying"
    else:
        trend = "dormant"

    # --------------------------------------------------------
    # CLASSIFICATION
    # --------------------------------------------------------

    if hotspot_score >= 0.85:
        classification = "critical_hotspot"
    elif hotspot_score >= 0.6:
        classification = "persistent_hotspot"
    elif hotspot_score >= 0.3:
        classification = "active_zone"
    else:
        classification = "emerging_zone"

    return {
        "hotspot_score": round(hotspot_score, 3),
        "activity_trend": trend,
        "classification": classification
    }