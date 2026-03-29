# ============================================================
# MarketMind — Dynamic Flow Mapper (Discovery + Direction v3)
# File: marketmind_engine/intelligence/flow_mapper.py
# ============================================================

from typing import Dict, List, Any


# ============================================================
# CORE FLOW MAPPER (UNCHANGED FOUNDATION)
# ============================================================

class FlowMapper:
    """
    Discovery-first mapper:
    Converts propagated symbol state into ranked trade candidates.

    v3:
    - Keeps emergence scoring
    - Direction handled separately (non-invasive)

    Design Principles:
    - NO hardcoded sectors
    - PURE emergence
    - STRONG filtering
    """

    def __init__(
        self,
        min_persist: int = 3,
        min_drift: float = 0.01,
        max_candidates: int = 15,
    ):
        self.min_persist = min_persist
        self.min_drift = min_drift
        self.max_candidates = max_candidates

    # --------------------------------------------------------
    # ENTRY POINT
    # --------------------------------------------------------
    def map(self, symbol_states: Dict[str, Any]) -> Dict[str, Any]:

        candidates: List[Dict[str, Any]] = []

        for symbol, state in symbol_states.items():
            score = self._score_symbol(state)

            if score is None:
                continue

            candidates.append({
                "symbol": symbol,
                "score": score,
                "drift": state.get("drift", 0.0),
                "bias": state.get("bias", 0.0),  # used by direction layer
                "persist": state.get("persist", 0),
                "propagation": state.get("propagation_score", 0.0),
                "lifespan": state.get("lifespan", 0),
            })

        ranked = sorted(candidates, key=lambda x: x["score"], reverse=True)

        return {
            "long": ranked[: self.max_candidates],
            "short": [],
            "all_ranked": ranked[: self.max_candidates],
            "debug": {
                "total_symbols_seen": len(symbol_states),
                "qualified_candidates": len(candidates),
                "long_count": len(ranked),
                "short_count": 0,
            },
        }

    # --------------------------------------------------------
    # SCORING ENGINE
    # --------------------------------------------------------
    def _score_symbol(self, state: Dict[str, Any]) -> float | None:

        drift = state.get("drift", 0.0)
        persist = state.get("persist", 0)
        propagation = state.get("propagation_score", 0.0)
        lifespan = state.get("lifespan", 0)

        if persist < self.min_persist:
            return None

        if abs(drift) < self.min_drift:
            return None

        drift_n = min(abs(drift), 1.0)
        prop_n = min(propagation, 1.0)
        persist_n = min(persist / 10.0, 1.0)
        life_n = min(lifespan / 20.0, 1.0)

        score = (
            drift_n * 0.4 +
            prop_n * 0.3 +
            persist_n * 0.2 +
            life_n * 0.1
        )

        return score

    # --------------------------------------------------------
    # DEBUG
    # --------------------------------------------------------
    def explain(self, symbol_states: Dict[str, Any]) -> List[Dict[str, Any]]:

        output = []

        for symbol, state in symbol_states.items():
            score = self._score_symbol(state)

            output.append({
                "symbol": symbol,
                "score": score,
                "drift": state.get("drift"),
                "bias": state.get("bias"),
                "persist": state.get("persist"),
                "propagation": state.get("propagation_score"),
                "lifespan": state.get("lifespan"),
                "qualified": score is not None,
            })

        return sorted(output, key=lambda x: (x["score"] or 0), reverse=True)


# ============================================================
# 🔥 DIRECTION LAYER (NEW — NON-DESTRUCTIVE)
# ============================================================

class DirectionalAnalyzer:
    """
    Computes directional bias using Δ (change over time)

    Key idea:
    Direction = change, not value
    """

    def __init__(self):
        self._history = {}

    def update(self, symbol_states: Dict[str, Any]) -> Dict[str, Any]:

        directional = {}

        for symbol, state in symbol_states.items():

            prev = self._history.get(symbol)

            current = {
                "FILS": state.get("bias", 0.0),
                "DRIFT": state.get("drift", 0.0),
                "PROP": state.get("propagation_score", 0.0),
            }

            if prev:
                delta_fils = current["FILS"] - prev["FILS"]
                delta_drift = current["DRIFT"] - prev["DRIFT"]
                delta_prop = current["PROP"] - prev["PROP"]

                direction = self._classify(
                    delta_fils,
                    delta_drift,
                    delta_prop
                )
            else:
                delta_fils = delta_drift = delta_prop = 0.0
                direction = "NEUTRAL"

            directional[symbol] = {
                "direction": direction,
                "delta_fils": delta_fils,
                "delta_drift": delta_drift,
                "delta_prop": delta_prop,
            }

            self._history[symbol] = current

        return directional

    def _classify(self, df, dd, dp):

        # STRONG LONG
        if df > 0 and dp > 0:
            return "LONG"

        # STRONG SHORT
        if df < 0 and dp < 0:
            return "SHORT"

        return "NEUTRAL"


# ============================================================
# OPTIONAL METADATA
# ============================================================

def attach_metadata(symbol: str) -> Dict[str, Any]:

    return {
        "sector": None,
        "beta": None,
        "liquidity": None,
    }