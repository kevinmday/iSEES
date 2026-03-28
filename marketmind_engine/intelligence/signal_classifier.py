# ============================================================
# MarketMind — Signal Classifier (Phase 6G Safe Layer)
#
# PURPOSE:
# - Interpret propagation state into human-readable pattern types
# - ZERO impact to core engine logic
# - Logging + visibility ONLY (no trading decisions yet)
# ============================================================

from typing import Dict


def classify_signal(state: Dict) -> str:
    """
    Classify signal pattern based on propagation state.

    Expected keys in state:
    - delta
    - drift
    - slope
    - prop
    - prev_drift (optional)
    """

    delta = state.get("delta", 0.0)
    drift = state.get("drift", 0.0)
    slope = state.get("slope", 0.0)
    prop = state.get("prop", 0.0)
    prev_drift = state.get("prev_drift", drift)

    # --------------------------------------------------------
    # FAILURE CASCADE
    # --------------------------------------------------------
    if slope < -0.02 and drift < 0:
        return "FAILURE_CASCADE"

    # --------------------------------------------------------
    # CLEAN TREND
    # --------------------------------------------------------
    if delta > 0 and drift > 0 and slope > 0 and prop > 0:
        return "CLEAN_TREND"

    # --------------------------------------------------------
    # CONSOLIDATION (early detection)
    # --------------------------------------------------------
    if prop > 0 and drift < prev_drift and slope > -0.02:
        return "CONSOLIDATION"

    # --------------------------------------------------------
    # IGNITION (early move forming)
    # --------------------------------------------------------
    if delta > 0 and drift > 0 and slope > 0:
        return "IGNITION"

    # --------------------------------------------------------
    # NOISE / DEFAULT
    # --------------------------------------------------------
    return "NOISE"