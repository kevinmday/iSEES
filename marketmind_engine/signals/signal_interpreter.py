# marketmind_engine/signals/signal_interpreter.py


def classify_signal(symbol: str, state: dict) -> str:
    """
    Signal classification layer (Phase 6G.1)

    Inputs:
        state = {
            delta_micro,
            drift,
            drift_slope,
            propagation_score,
            lifespan
        }

    Output:
        signal_type:
            WATCH_PMAS
            ENTER_TREND
            ENTER_VOLATILITY
            EXIT
            IGNORE
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
    # 🟡 PMAS (Pre-Move Accumulation)
    # ==========================================================
    if (
        abs(delta) < 0.002
        and prop > 0
        and slope >= 0
        and life > 5
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
    # ⚡ VOLATILITY (Non-directional spike)
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

    # ==========================================================
    # 🧠 DEBUG PRINT (ALWAYS ON FOR NOW)
    # ==========================================================
    print(
        f"[SIGNAL] {symbol} "
        f"→ {signal} | "
        f"Δ={delta:.5f} "
        f"d={drift:.5f} "
        f"s={slope:.5f} "
        f"p={prop:.5f} "
        f"life={life}"
    )

    return signal