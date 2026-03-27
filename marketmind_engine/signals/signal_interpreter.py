# marketmind_engine/signals/signal_interpreter.py


def classify_signal(symbol: str, state: dict) -> str:
    """
    Signal classification layer (Phase 6G.3)

    Determines ACTION (what to do)
    """

    # -------------------------
    # EXTRACT STATE
    # -------------------------
    delta = state.get("delta_micro", 0.0)
    drift = state.get("drift", 0.0)
    slope = state.get("drift_slope", 0.0)
    prop = state.get("propagation_score", 0.0)
    life = state.get("lifespan", 0)

    signal = "IGNORE"

    # ==========================================================
    # 🔥 PMAS (EARLY ACCUMULATION — PRIMARY TRIGGER)
    # ==========================================================
    if (
        life >= 5 and
        abs(prop) > 0.0001
    ):
        signal = "WATCH_PMAS"

    # ==========================================================
    # 🟢 IGNITION (Trend)
    # ==========================================================
    elif (
        delta > 0
        and drift > 0
        and slope > 0
    ):
        signal = "ENTER_TREND"

    # ==========================================================
    # ⚡ VOLATILITY
    # ==========================================================
    elif (
        abs(delta) > 0.002
        and slope <= 0
    ):
        signal = "ENTER_VOLATILITY"

    # ==========================================================
    # 🔴 DECAY / EXIT
    # ==========================================================
    elif (
        drift < 0
        and slope < 0
    ):
        signal = "EXIT"

    return signal


# ==========================================================
# 🧠 PATTERN CLASSIFICATION (NEW — CLEAN LAYER)
# ==========================================================
def classify_pattern(state: dict) -> str:
    """
    Pattern classification layer (orthogonal to signal)

    Determines STRUCTURE (what it is)
    """

    delta = state.get("delta_micro", 0.0)
    drift = state.get("drift", 0.0)
    slope = state.get("drift_slope", 0.0)
    prop = state.get("propagation_score", 0.0)

    # 🔴 FAILURE CASCADE
    if slope < -0.02 and drift < 0:
        return "FAILURE_CASCADE"

    # 🟢 CLEAN TREND
    if delta > 0 and drift > 0 and slope > 0 and prop > 0:
        return "CLEAN_TREND"

    # 🧬 CONSOLIDATION
    if prop > 0 and drift < 0 and slope > -0.02:
        return "CONSOLIDATION"

    # ⚡ IGNITION (early formation)
    if delta > 0 and drift > 0 and slope > 0:
        return "IGNITION"

    return "NOISE"