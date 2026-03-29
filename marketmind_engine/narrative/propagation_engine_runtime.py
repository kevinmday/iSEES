from typing import Dict, Any
import time
import hashlib
import math

from marketmind_engine.intelligence.relative_signal_layer import RelativeSignalLayer
from marketmind_engine.signals.signal_interpreter import classify_signal, classify_pattern
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
        self._last_symbols = []

    # ==========================================================
    # SYMBOL FILTER
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

        if symbol.endswith(("P",)):
            return False

        if symbol.startswith(("X", "Z")):
            return False

        if symbol in {"THE", "AND", "FOR", "ARE"}:
            return False

        return True

    # ==========================================================
    # MAIN UPDATE LOOP
    # ==========================================================
    def update(self, symbols):

        input_count = len(symbols) if symbols else 0

        if symbols:
            self._last_symbols = symbols
        else:
            symbols = self._last_symbols

        effective_symbols = symbols

        if not effective_symbols:
            print(f"[FIELD] input=0 active=0 effective=0")
            return

        active_count = len(self._last_symbols)
        effective_count = len(effective_symbols)

        print(f"[FIELD] input={input_count} active={active_count} effective={effective_count}")
        print(f"[PROP] effective_symbols={effective_symbols}")

        now = time.time()

        for symbol in effective_symbols:

            try:

                if symbol in self._invalid_symbols:
                    continue

                if not self._valid_symbol(symbol):
                    continue

                price_now = None

                try:
                    if hasattr(self.provider, "get_price"):
                        price_now = self.provider.get_price(symbol)
                except Exception as e:
                    print(f"[PRICE_ERROR] {symbol} failed: {e}")
                    self._invalid_symbols.add(symbol)
                    continue

                if price_now is None:
                    print(f"[PRICE_ERROR] {symbol} returned None")
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
                    "drift": 0.0,
                })

                dt = max(now - prev["timestamp"], 1.0)

                # ==========================================
                # TIME DECAY
                # ==========================================
                decay = 0.98 ** dt

                fils = prev["fils"] * decay
                ucip = prev["ucip"] * decay

                # ==========================================
                # ASYMMETRIC ENERGY INJECTION
                # ==========================================
                seed = self._stable_hash(symbol)

                base_fils = 0.05
                base_ucip = 0.03

                asym = seed / 10.0

                fils += base_fils * (1 + 0.2 * asym)
                ucip = min(ucip + base_ucip * (1 + 0.2 * asym), 1.0)

                # INTERNAL FIELD DYNAMICS
                fils += 0.0002 * seed
                ucip = min(ucip + 0.0005 * (seed / 10), 1.0)

                # ==========================================
                # PRICE DELTA
                # ==========================================
                price_prev = prev.get("price_prev", price_now)

                if price_prev == 0:
                    delta_micro = 0.0
                else:
                    delta_micro = (price_now - price_prev) / price_prev

                # ==========================================
                # 🔥 CORRECT REGIME DETECTION (PRICE CHANGE)
                # ==========================================
                price_stale = abs(price_now - price_prev) < 1e-9

                # ==========================================
                # 🔥 REGIME-AWARE DRIFT
                # ==========================================
                prev_fils = prev.get("fils", 0.0)

                drift_field = fils - prev_fils
                drift_price = delta_micro

                if price_stale:
                    drift = drift_field
                    regime = "FIELD_ONLY"
                else:
                    drift = 0.7 * drift_field + 0.3 * drift_price
                    regime = "HYBRID"

                # DRIFT SLOPE
                prev_drift = prev.get("drift", 0.0)
                drift_slope = drift - prev_drift

                # BUFFER (NOW USING DRIFT — IMPORTANT)
                buffer = prev.get("buffer", [])
                buffer.append(drift)

                if len(buffer) > 12:
                    buffer.pop(0)

                bias = sum(buffer)

                total = len(buffer)
                positive = len([d for d in buffer if d > 0])
                directional_ratio = positive / total if total > 0 else 0.0

                lifespan = prev.get("lifespan", 0) + 1

                propagation_score = bias * directional_ratio * math.log(1 + lifespan)

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
                    "regime": regime,
                }

                self._symbol_state[symbol] = state

                print(
                    f"[STATE] {symbol} "
                    f"FILS={fils:.4f} "
                    f"UCIP={ucip:.4f} "
                    f"DRIFT={drift:.6f} "
                    f"LIFE={lifespan} "
                    f"PROP={propagation_score:.6f} "
                    f"REGIME={regime}"
                )

                signal = classify_signal(symbol, state)
                pattern = classify_pattern(state)

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

            except Exception as e:
                print(f"[ENGINE_ERROR] {symbol} {e}")
                continue

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

    def _stable_hash(self, symbol: str) -> int:
        h = hashlib.md5(symbol.encode()).hexdigest()
        return int(h[:4], 16) % 10

    def get_symbol_state(self, symbol: str) -> Dict[str, float]:
        return self._symbol_state.get(symbol, {
            "fils": 0.0,
            "ucip": 0.0,
            "timestamp": 0
        })