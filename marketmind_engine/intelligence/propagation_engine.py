from typing import Dict, Any, List
from statistics import mean, pstdev
import time
import hashlib
import math

from .relative_signal_layer import RelativeSignalLayer


STRUCTURAL_SYMBOLS = [
    "SPY",
    "QQQ",
    "DIA",
    "IWM",
    "XLF",
    "XLE",
    "XLV",
    "SMH",
    "ITA",
]


class PropagationEngine:
    """
    Hybrid propagation engine (FINALIZED + DRIFT ENABLED)

    ✔ Clean symbol universe
    ✔ Provider-aware filtering
    ✔ Stateful propagation tracking
    ✔ Replay-safe deterministic behavior
    ✔ Drift (Δ change over time)
    """

    def __init__(self, provider, engine_controller, rss_service):
        self.provider = provider
        self.engine_controller = engine_controller
        self.rss_service = rss_service
        self.relative_layer = RelativeSignalLayer()

        self._symbol_state: Dict[str, Dict[str, Any]] = {}
        self._invalid_symbols = set()

    # ==========================================================
    # 🔒 SYMBOL FILTER
    # ==========================================================

    def _valid_symbol(self, symbol: str) -> bool:

        if not symbol:
            return False

        if len(symbol) > 5:
            return False

        if "-" in symbol or "." in symbol:
            return False

        if symbol.endswith(("W", "WS", "WT", "U", "R")):
            return False

        if symbol.endswith(("F", "Y", "Q")):
            return False

        if not symbol.isalpha():
            return False

        return True

    # ==========================================================
    # 🔥 STATEFUL PROPAGATION ENTRY POINT
    # ==========================================================

    def update(self, symbols):

        if not symbols:
            return

        now = time.time()

        for symbol in symbols:

            try:

                if symbol in self._invalid_symbols:
                    continue

                if not self._valid_symbol(symbol):
                    continue

                price_now = None

                if hasattr(self.provider, "get_price"):
                    price_now = self.provider.get_price(symbol)

                if price_now is None:
                    self._invalid_symbols.add(symbol)
                    continue

                if price_now < 2.0:
                    continue

                prev = self._symbol_state.get(symbol, {
                    "fils": 0.0,
                    "ucip": 0.0,
                    "timestamp": now,
                    "price_prev": price_now,
                    "buffer": [],
                    "lifespan": 0,
                    "propagation_score": 0.0,
                    "delta_micro": 0.0,
                })

                dt = max(now - prev["timestamp"], 1.0)

                # -----------------------------
                # TIME DECAY
                # -----------------------------
                decay = 0.98 ** dt

                fils = prev["fils"] * decay
                ucip = prev["ucip"] * decay

                # -----------------------------
                # NARRATIVE REINFORCEMENT
                # -----------------------------
                fils += 0.002
                ucip = min(ucip + 0.01, 1.0)

                # -----------------------------
                # INTERNAL FIELD DYNAMICS
                # -----------------------------
                seed = self._stable_hash(symbol)

                fils += 0.0002 * seed
                ucip = min(ucip + 0.0005 * (seed / 10), 1.0)

                # ==========================================================
                # 🔥 MICRO PRICE DELTA
                # ==========================================================
                price_prev = prev.get("price_prev", price_now)

                if price_prev == 0:
                    delta_micro = 0.0
                else:
                    delta_micro = (price_now - price_prev) / price_prev

                # ==========================================================
                # 🔥 DRIFT (KEY FIX)
                # ==========================================================
                prev_delta = prev.get("delta_micro", 0.0)
                drift = delta_micro - prev_delta

                # -----------------------------
                # BUFFER (N = 12)
                # -----------------------------
                buffer = prev.get("buffer", [])
                buffer.append(delta_micro)

                if len(buffer) > 12:
                    buffer.pop(0)

                # -----------------------------
                # DERIVED METRICS
                # -----------------------------
                bias = sum(buffer)

                total = len(buffer)
                positive = len([d for d in buffer if d > 0])

                directional_ratio = positive / total if total > 0 else 0.0

                # -----------------------------
                # LIFESPAN
                # -----------------------------
                lifespan = prev.get("lifespan", 0) + 1

                # -----------------------------
                # PROPAGATION SCORE
                # -----------------------------
                propagation_score = bias * directional_ratio * math.log(1 + lifespan)

                # -----------------------------
                # STORE STATE
                # -----------------------------
                self._symbol_state[symbol] = {
                    "fils": fils,
                    "ucip": ucip,
                    "timestamp": now,
                    "price_prev": price_now,
                    "buffer": buffer,
                    "lifespan": lifespan,
                    "propagation_score": propagation_score,
                    "bias": bias,
                    "directional_ratio": directional_ratio,
                    "delta_micro": delta_micro,
                    "drift": drift,  # 🔥 NEW
                }

                # -----------------------------
                # DEBUG LOG
                # -----------------------------
                print(
                    f"[STATE] {symbol} "
                    f"Δ={delta_micro:.5f} "
                    f"drift={drift:.5f} "
                    f"bias={bias:.5f} "
                    f"ratio={directional_ratio:.2f} "
                    f"life={lifespan} "
                    f"prop={propagation_score:.5f}"
                )

            except Exception:
                pass

    # ==========================================================
    # 🔒 STABLE HASH
    # ==========================================================

    def _stable_hash(self, symbol: str) -> int:
        h = hashlib.md5(symbol.encode()).hexdigest()
        return int(h[:4], 16) % 10

    # ==========================================================
    # ACCESSOR
    # ==========================================================

    def get_symbol_state(self, symbol: str) -> Dict[str, float]:
        return self._symbol_state.get(symbol, {
            "fils": 0.0,
            "ucip": 0.0,
            "timestamp": 0
        })

    # ==========================================================
    # SNAPSHOT
    # ==========================================================

    def snapshot(self) -> Dict[str, Any]:

        try:
            structural = self._structural_layer()
            narrative = self._narrative_layer()
            capital = self._capital_layer()

            composite = self._composite(structural, narrative, capital)

            relative_signals = self.relative_layer.evaluate(
                structural,
                narrative,
                capital,
            )

            return {
                "mode": "propagation_live",
                "timestamp": time.time(),
                "structural": structural,
                "narrative": narrative,
                "capital": capital,
                "composite": composite,
                "relative_signals": relative_signals,
            }

        except Exception as e:
            return {
                "mode": "propagation_error",
                "timestamp": time.time(),
                "error": str(e),
            }

    # ==========================================================
    # STRUCTURAL
    # ==========================================================

    def _structural_layer(self) -> Dict[str, float]:

        data = {}

        if hasattr(self.provider, "get_batch_data"):
            try:
                data = self.provider.get_batch_data(STRUCTURAL_SYMBOLS)
            except Exception:
                data = {}

        if not data:
            return {"bias": 0.0, "volatility": 0.0, "dispersion": 0.0}

        changes = []

        for v in data.values():

            change = v.get("percent_change") or v.get("pct_change")

            if change is None:
                continue

            try:
                changes.append(float(change))
            except Exception:
                continue

        if not changes:
            return {"bias": 0.0, "volatility": 0.0, "dispersion": 0.0}

        return {
            "bias": mean(changes),
            "volatility": pstdev(changes) if len(changes) > 1 else 0.0,
            "dispersion": max(changes) - min(changes),
        }

    # ==========================================================
    # NARRATIVE
    # ==========================================================

    def _narrative_layer(self) -> Dict[str, float]:

        symbols = list(self._symbol_state.keys())

        if not symbols:
            return {"bias": 0.0, "concentration": 0.0, "momentum": 0.0}

        fils_values = []
        ucip_values = []

        for s in symbols:
            state = self._symbol_state.get(s, {})
            fils_values.append(state.get("fils", 0.0))
            ucip_values.append(state.get("ucip", 0.0))

        return {
            "bias": mean(fils_values),
            "concentration": pstdev(fils_values) if len(fils_values) > 1 else 0.0,
            "momentum": mean(ucip_values),
        }

    # ==========================================================
    # CAPITAL
    # ==========================================================

    def _capital_layer(self) -> Dict[str, float]:

        positions = []

        if hasattr(self.engine_controller, "get_open_positions"):
            try:
                positions = self.engine_controller.get_open_positions()
            except Exception:
                positions = []

        if not positions:
            return {"exposure": 0.0, "unrealized_pct": 0.0, "alignment": 0.0}

        unrealized = []
        directions = []

        for p in positions:
            if not isinstance(p, dict):
                continue
            unrealized.append(p.get("unrealized_pct", 0.0))
            directions.append(p.get("direction", 0.0))

        exposure = mean(directions) if directions else 0.0
        unrealized_avg = mean(unrealized) if unrealized else 0.0

        return {
            "exposure": exposure,
            "unrealized_pct": unrealized_avg,
            "alignment": exposure * unrealized_avg,
        }

    # ==========================================================
    # COMPOSITE
    # ==========================================================

    def _composite(self, structural, narrative, capital) -> Dict[str, Any]:

        stress_score = (
            abs(structural["volatility"])
            + abs(narrative["concentration"])
            + abs(capital["unrealized_pct"])
        )

        alignment_score = (
            structural["bias"]
            * narrative["bias"]
            * (1 if capital["exposure"] >= 0 else -1)
        )

        regime_hint = "neutral"

        if stress_score > 2:
            regime_hint = "elevated"

        if stress_score > 4:
            regime_hint = "unstable"

        return {
            "stress_score": round(stress_score, 4),
            "alignment_score": round(alignment_score, 4),
            "regime_hint": regime_hint,
        }