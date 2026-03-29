# ============================================================
# MarketMind — Dynamic Flow Mapper (Discovery-First, v2)
# File: marketmind_engine/intelligence/flow_mapper.py
# ============================================================

from typing import Dict, List, Any


class FlowMapper:
    """
    Discovery-first mapper:
    Converts propagated symbol state into ranked trade candidates.

    v2 CHANGES:
    - REMOVED bias dependency (system not producing reliable bias yet)
    - PURE emergence scoring (drift + propagation + persistence)
    - Direction deferred to later phase

    Design Principles:
    - NO hardcoded sectors
    - NO predefined tickers
    - PURE emergence
    - STRONG filtering to control noise
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
        """
        Converts symbol_states into ranked candidates.

        Input:
            symbol_states = {
                "XOM": {
                    "drift": float,
                    "bias": float (optional / ignored in v2),
                    "persist": int,
                    "propagation_score": float,
                    "lifespan": int
                },
                ...
            }

        Output:
            {
                "long": [...],
                "short": [],
                "all_ranked": [...],
                "debug": {...}
            }
        """

        candidates: List[Dict[str, Any]] = []

        for symbol, state in symbol_states.items():
            score = self._score_symbol(state)

            if score is None:
                continue

            candidates.append({
                "symbol": symbol,
                "score": score,
                "drift": state.get("drift", 0.0),
                "bias": state.get("bias", 0.0),  # kept for future use
                "persist": state.get("persist", 0),
                "propagation": state.get("propagation_score", 0.0),
                "lifespan": state.get("lifespan", 0),
            })

        # ----------------------------------------------------
        # GLOBAL RANKING (PURE EMERGENCE)
        # ----------------------------------------------------
        ranked = sorted(candidates, key=lambda x: x["score"], reverse=True)

        # ----------------------------------------------------
        # v2: NO DIRECTION SPLIT YET
        # ----------------------------------------------------
        long_candidates = ranked
        short_candidates: List[Dict[str, Any]] = []

        return {
            "long": long_candidates[: self.max_candidates],
            "short": short_candidates,
            "all_ranked": ranked[: self.max_candidates],
            "debug": {
                "total_symbols_seen": len(symbol_states),
                "qualified_candidates": len(candidates),
                "long_count": len(long_candidates),
                "short_count": 0,
            },
        }

    # --------------------------------------------------------
    # CORE SCORING ENGINE (EMERGENCE-ONLY)
    # --------------------------------------------------------
    def _score_symbol(self, state: Dict[str, Any]) -> float | None:
        """
        Produces a normalized emergence score.

        v2:
        - NO bias filtering
        - NO direction assumption
        """

        drift = state.get("drift", 0.0)
        persist = state.get("persist", 0)
        propagation = state.get("propagation_score", 0.0)
        lifespan = state.get("lifespan", 0)

        # ----------------------------------------------------
        # HARD FILTERS (ANTI-NOISE)
        # ----------------------------------------------------
        if persist < self.min_persist:
            return None

        if abs(drift) < self.min_drift:
            return None

        # ----------------------------------------------------
        # NORMALIZATION
        # ----------------------------------------------------
        drift_n = min(abs(drift), 1.0)
        prop_n = min(propagation, 1.0)
        persist_n = min(persist / 10.0, 1.0)
        life_n = min(lifespan / 20.0, 1.0)

        # ----------------------------------------------------
        # SCORE COMPOSITION (EMERGENCE)
        # ----------------------------------------------------
        score = (
            drift_n * 0.4 +
            prop_n * 0.3 +
            persist_n * 0.2 +
            life_n * 0.1
        )

        return score

    # --------------------------------------------------------
    # DEBUG / EXPLAIN (VERY USEFUL)
    # --------------------------------------------------------
    def explain(self, symbol_states: Dict[str, Any]) -> List[Dict[str, Any]]:
        """
        Returns detailed breakdown for inspection / debugging.
        """

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

        return sorted(
            output,
            key=lambda x: (x["score"] or 0),
            reverse=True
        )


# ============================================================
# OPTIONAL: METADATA HOOK (DO NOT USE FOR FILTERING)
# ============================================================

def attach_metadata(symbol: str) -> Dict[str, Any]:
    """
    Placeholder for enrichment layer.

    Future:
    - sector tagging
    - liquidity classification
    - beta / volatility

    RULE:
    Never affect ranking — context only.
    """

    return {
        "sector": None,
        "beta": None,
        "liquidity": None,
    }