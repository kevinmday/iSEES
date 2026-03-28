from typing import Dict, Any
import time
import hashlib
import math

# 🔥 FIXED IMPORT (was relative, now absolute)
from marketmind_engine.intelligence.relative_signal_layer import RelativeSignalLayer

# 🔥 SIGNAL LAYER
from marketmind_engine.signals.signal_interpreter import classify_signal, classify_pattern

# 🔥 VALIDATION LOGGER
from marketmind_engine.utils.validation_logger import log_signal


STRUCTURAL_SYMBOLS = [
    "SPY","QQQ","DIA","IWM","XLF","XLE","XLV","SMH","ITA",
]


class PropagationEngine:

    def __init__(self, provider, engine_controller, rss_service):
        self.provider = provider
        self.engine_controller = engine_controller
        self.rss_service = rss_service
        self.relative_layer = RelativeSignalLayer()

        self._symbol_state: Dict[str, Dict[str, Any]] = {}
        self._invalid_symbols = set()

        # 🔥 SYMBOL CONTINUITY MEMORY
        self._last_symbols = []

    # ==========================================================
    # 🔧 SYMBOL FILTER
    # ==========================================================
    def _valid_symbol(self, symbol: str):

        if not symbol:
            return False

        if len(symbol) < 2 or len(symbol) > 5:
            return False

        if "-" in symbol or "." in symbol:
            return False

        if not symbol.isalpha():
            return False

        if symbol.endswith(("W", "WS", "WT", "U", "R")):
            return False

        if symbol.endswith(("F", "Y", "Q")):
            return False

        # 🔥 NEW: reject preferred shares
        if symbol.endswith(("P",)):
            return False

        # 🔥 NEW: reject synthetic prefixes
        if symbol.startswith(("X", "Z")):
            return False

        if symbol in {"THE", "AND", "FOR", "ARE"}:
            return False

        return True

    # ==========================================================
    # 🔥 MAIN UPDATE LOOP
    # ==========================================================
    def update(self, symbols):

        input_count = len(symbols) if symbols else 0

        if symbols:
            self._last_symbols = symbols
        else:
            symbols = self._last_symbols

        effective_count = len(symbols)

        if not symbols:
            print(f"[FIELD] input=0 active=0 effective=0")
            return

        active_count = len(self._last_symbols)

        print(f"[FIELD] input={input_count} active={active_count} effective={effective_count}")

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

                # 🔥 INVALID SYMBOL LEARNING
                if price_now is None:
                    self._invalid_symbols.add(symbol)
                    print(f"[INVALID_SYMBOL] {symbol} added_to_blacklist")
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
                    "drift": 0.0,
                })

                dt = max(now - prev["timestamp"], 1.0)

                # TIME DECAY
                decay = 0.98 ** dt

                fils = prev["fils"] * decay
                ucip = prev["ucip"] * decay

                # NARRATIVE REINFORCEMENT
                fils += 0.002
                ucip = min(ucip + 0.01, 1.0)

                # INTERNAL FIELD DYNAMICS
                seed = self._stable_hash(symbol)

                fils += 0.0002 * seed
                ucip = min(ucip + 0.0005 * (seed / 10), 1.0)

                # MICRO DELTA
                price_prev = prev.get("price_prev", price_now)

                if price_prev == 0:
                    delta_micro = 0.0
                else:
                    delta_micro = (price_now - price_prev) / price_prev

                # DRIFT
                prev_delta = prev.get("delta_micro", 0.0)
                drift = delta_micro - prev_delta

                # DRIFT SLOPE
                prev_drift = prev.get("drift", 0.0)
                drift_slope = drift - prev_drift

                # BUFFER
                buffer = prev.get("buffer", [])
                buffer.append(delta_micro)

                if len(buffer) > 12:
                    buffer.pop(0)

                bias = sum(buffer)

                total = len(buffer)
                positive = len([d for d in buffer if d > 0])
                directional_ratio = positive / total if total > 0 else 0.0

                # LIFESPAN
                lifespan = prev.get("lifespan", 0) + 1

                # PROPAGATION SCORE
                propagation_score = bias * directional_ratio * math.log(1 + lifespan)

                # STORE STATE
                state = {
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
                    "drift": drift,
                    "drift_slope": drift_slope,
                }

                self._symbol_state[symbol] = state

                # SIGNAL + PATTERN
                signal = classify_signal(symbol, state)
                pattern = classify_pattern(state)

                print(
                    f"[STATE] {symbol} Δ={delta_micro:.5f} drift={drift:.5f} "
                    f"slope={drift_slope:.5f} bias={bias:.5f} "
                    f"ratio={directional_ratio:.2f} life={lifespan} "
                    f"prop={propagation_score:.5f} pattern={pattern}"
                )

                print(
                    f"[SIGNAL] {symbol} → {signal} | pattern={pattern} "
                    f"Δ={delta_micro:.5f} d={drift:.5f} "
                    f"s={drift_slope:.5f} p={propagation_score:.5f} "
                    f"life={lifespan}"
                )

                log_signal(
                    symbol=symbol,
                    signal=signal,
                    state=state,
                    price=price_now
                )

            except Exception:
                pass

        # FIELD TOP VISIBILITY
        try:
            if self._symbol_state:
                sym, data = max(
                    self._symbol_state.items(),
                    key=lambda x: x[1].get("propagation_score", 0)
                )

                print(
                    f"[FIELD_TOP] {sym} "
                    f"prop={data.get('propagation_score', 0):.5f} "
                    f"life={data.get('lifespan', 0)}"
                )
        except Exception:
            pass

    # ==========================================================
    # HELPERS
    # ==========================================================
    def _stable_hash(self, symbol: str) -> int:
        h = hashlib.md5(symbol.encode()).hexdigest()
        return int(h[:4], 16) % 10

    def get_symbol_state(self, symbol: str) -> Dict[str, float]:
        return self._symbol_state.get(symbol, {
            "fils": 0.0,
            "ucip": 0.0,
            "timestamp": 0
        })