# ============================================================
# Field Stress Detector (FSD)
# Detects: Distribution / Absorption / Confirmed Trend / Ignition
#
# SAFE MODULE — NO RUNTIME SIDE EFFECTS
# ============================================================

from typing import Dict, Tuple


# ------------------------------------------------------------
# THRESHOLDS (tune later from data)
# ------------------------------------------------------------

PERSIST_HIGH = 100        # long-lived signal
PROP_ACTIVE = 0.10        # meaningful propagation
DRIFT_POS = 0.001         # positive slope threshold
DRIFT_NEG = -0.001        # negative slope threshold
DRIFT_SPIKE = 0.01        # ignition spike threshold


# ------------------------------------------------------------
# CORE CLASSIFICATION
# ------------------------------------------------------------

def classify_symbol_state(data: dict) -> dict:
    """
    data format:
    {
        "prop": float,
        "drift": float,
        "persist": int,
        "stab": float (optional)
    }
    """

    prop = data.get("prop", 0.0)
    drift = data.get("drift", 0.0)
    persist = data.get("persist", 0)
    stab = data.get("stab", 0.0)

    high_persist = persist >= PERSIST_HIGH
    active_prop = prop >= PROP_ACTIVE

    # --------------------------------------------------------
    # REGIME CLASSIFICATION
    # --------------------------------------------------------

    if high_persist and active_prop:
        if drift <= DRIFT_NEG:
            regime = "DISTRIBUTION"      # pressure but failing
        elif drift >= DRIFT_POS:
            regime = "CONFIRMED_TREND"  # pressure + follow-through
        else:
            regime = "ABSORPTION"       # pressure but flat
    else:
        # lower persistence / early phase
        if abs(drift) >= DRIFT_SPIKE:
            regime = "IGNITION"         # event-driven spike
        else:
            regime = "NOISE"

    # --------------------------------------------------------
    # STRESS SCORE (quantifies tension)
    # --------------------------------------------------------

    # higher when: persistent + strong + negative drift
    stress_score = persist * prop * max(0.0, -drift)

    # normalize (optional clamp)
    stress_score = round(stress_score, 6)

    return {
        "regime": regime,
        "stress_score": stress_score,
        "prop": prop,
        "drift": drift,
        "persist": persist,
        "stab": stab
    }


# ------------------------------------------------------------
# BATCH ANALYSIS
# ------------------------------------------------------------

def analyze_field_stress(symbol_states: Dict[str, dict]) -> Dict[str, dict]:
    """
    Returns per-symbol stress classification
    """

    results = {}

    for symbol, data in symbol_states.items():
        results[symbol] = classify_symbol_state(data)

    return results


# ------------------------------------------------------------
# SUMMARY VIEW (group by regime)
# ------------------------------------------------------------

def summarize_stress(results: Dict[str, dict]) -> Dict[str, list]:
    """
    Groups symbols by regime type
    """

    summary = {
        "DISTRIBUTION": [],
        "ABSORPTION": [],
        "CONFIRMED_TREND": [],
        "IGNITION": [],
        "NOISE": []
    }

    for symbol, info in results.items():
        regime = info["regime"]
        summary.setdefault(regime, []).append(symbol)

    return summary


# ------------------------------------------------------------
# DEBUG PRINT
# ------------------------------------------------------------

def debug_print(results: Dict[str, dict], summary: Dict[str, list]):
    print("\n[FIELD STRESS]\n")

    for symbol, info in results.items():
        print(
            f"{symbol:<6} "
            f"{info['regime']:<16} "
            f"stress={info['stress_score']:.6f} "
            f"d={info['drift']:.5f} "
            f"p={info['prop']:.4f} "
            f"life={info['persist']}"
        )

    print("\n[SUMMARY]\n")

    for regime, symbols in summary.items():
        if symbols:
            print(f"{regime:<16} → {', '.join(symbols)}")