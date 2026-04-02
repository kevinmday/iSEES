# ============================================================
# MarketMind — Signal Classifier (Phase 6H Tuned — Stable)
#
# PURPOSE:
# - Interpret propagation field into lifecycle phases
# - Uses real field metrics (Δ, drift, slope, propagation, life)
# - ZERO impact to core engine logic
#
# NOTE:
# - Order of rules is CRITICAL (priority-based)
# ============================================================

from typing import Dict


def classify_signal(symbol: str, state: Dict) -> str:
    """
    Classify signal pattern based on propagation state.

    Expected keys in state:
    - delta_field
    - drift
    - drift_slope
    - propagation_score
    - lifespan
    """

    delta = state.get("delta_field", 0.0)
    drift = state.get("drift", 0.0)
    slope = state.get("drift_slope", 0.0)
    prop = state.get("propagation_score", 0.0)
    life = state.get("lifespan", 0)

    # --------------------------------------------------------
    # 🔴 FAILURE CASCADE (hard breakdown)
    # --------------------------------------------------------
    if slope < -0.02 and drift < 0:
        return "FAILURE_CASCADE"

    # --------------------------------------------------------
    # 🔴 EXHAUSTION (fully extended, no more delta)
    # --------------------------------------------------------
    if prop > 0.6 and abs(delta) < 0.01:
        return "EXHAUSTION"

    # --------------------------------------------------------
    # 🟠 SATURATION (strong field, momentum fading)
    # IMPORTANT: must come BEFORE BUILD
    # --------------------------------------------------------
    if prop > 0.25 and slope < 0:
        return "SATURATION"

    # --------------------------------------------------------
    # 🟢 IGNITION (early impulse)
    # --------------------------------------------------------
    if delta > 0.045 and life <= 2:
        return "IGNITION"

    # --------------------------------------------------------
    # 🟢 BUILD (continuation phase)
    # --------------------------------------------------------
    if delta > 0.015:
        return "BUILD"

    # --------------------------------------------------------
    # 🔴 DECAY (losing structure)
    # --------------------------------------------------------
    if delta < 0:
        return "DECAY"

    # --------------------------------------------------------
    # ⚪ DEFAULT
    # --------------------------------------------------------
    return "NOISE"