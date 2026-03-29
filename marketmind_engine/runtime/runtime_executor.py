# ============================================================
# MarketMind — Runtime Executor (Flow-Mapped FINAL + VISIBLE)
# ============================================================

from typing import Optional, Dict, Any

from marketmind_engine.runtime.trade_coordinator import TradeCoordinator
from marketmind_engine.execution.execution_service import ExecutionService
from marketmind_engine.execution.execution_receipt import ExecutionReceipt
from marketmind_engine.execution.execution_input import ExecutionInput
from marketmind_engine.execution.execution_types import OrderIntent

from marketmind_engine.intelligence.ignition_detector import IgnitionDetector
from marketmind_engine.intelligence.flow_mapper import FlowMapper
from marketmind_engine.narrative.narrative_adapter import NarrativeAdapter


class RuntimeExecutor:
    def __init__(
        self,
        coordinator: TradeCoordinator,
        execution_service: ExecutionService,
        price_service=None,
        telemetry_logger=None,
        narrative_adapter: Optional[NarrativeAdapter] = None,
    ):
        self._coordinator = coordinator
        self._execution_service = execution_service
        self._price_service = price_service
        self._log = telemetry_logger

        self._ignition = IgnitionDetector()
        self._flow_mapper = FlowMapper()

        if narrative_adapter is None:
            raise ValueError(
                "RuntimeExecutor requires a shared NarrativeAdapter instance"
            )

        self._narrative = narrative_adapter
        self._last_price = {}

        self._last_flow_map = None

    # --------------------------------------------------

    def _log_msg(self, msg: str):
        if self._log:
            try:
                self._log(msg)
            except Exception:
                pass

    # --------------------------------------------------

    def run_cycle(
        self,
        execution_input: ExecutionInput,
        market_context_map: Optional[dict] = None,
    ) -> Dict[str, Any]:

        # --------------------------------------------------
        # COORDINATOR
        # --------------------------------------------------

        try:
            result = self._coordinator.run(
                execution_input,
                market_context_map=market_context_map,
            )

            if not result:
                return {
                    "decision": "NO_ACTION",
                    "regime": None,
                    "authority": None,
                    "order_intent": None,
                    "execution_receipt": None,
                    "engine_time": execution_input.engine_time,
                }

        except Exception as e:
            return {
                "decision": "ERROR",
                "error": str(e),
                "engine_time": execution_input.engine_time,
            }

        # --------------------------------------------------
        # ORDER EXECUTION
        # --------------------------------------------------

        order_intent: Optional[OrderIntent] = result.get("order_intent")
        receipt: Optional[ExecutionReceipt] = None

        decision = "NO_ACTION"

        if order_intent:
            decision = f"ALLOW_{order_intent.side.upper()}"

            print(
                "\n\n========== TRADE TRIGGER ==========\n"
                f"{order_intent.symbol} {order_intent.side.upper()}\n"
                "===================================\n"
            )

            try:
                receipt = self._execution_service.submit_intent(order_intent)
            except Exception as e:
                self._log_msg(f"Execution error: {e}")

        # --------------------------------------------------
        # SYMBOL (OPTIONAL)
        # --------------------------------------------------

        symbol = execution_input.symbol

        if not symbol:
            self._log_msg("[INFO] No symbol provided — field-only cycle")
        else:
            self._log_msg(f"[SYMBOL] {symbol}")

        # --------------------------------------------------
        # PRICE ENGINE
        # --------------------------------------------------

        price = None
        prev = None

        if symbol:
            try:
                raw = None

                if self._price_service:
                    raw = self._price_service.get_price(symbol)

                if isinstance(raw, dict):
                    candidate = raw.get("ap") or raw.get("bp")
                else:
                    candidate = raw

                if isinstance(candidate, (int, float)) and candidate > 0:
                    price = candidate

            except Exception:
                price = None

            if price is None:
                prev = self._last_price.get(symbol, 100.0)
                price = prev * 1.002
                self._log_msg(f"[SYNTHETIC_PRICE] {symbol} {price:.4f}")

            self._log_msg(f"[PRICE] {symbol} {price}")

            prev = self._last_price.get(symbol)
            self._last_price[symbol] = price

            volume = 1.0
            if prev:
                change = abs(price - prev) / prev
                volume = min(1.0 + change * 100, 10.0)

            price_data = {
                symbol: {
                    "price": price,
                    "volume": volume,
                }
            }

            try:
                events = self._ignition.process_batch(price_data)

                self._log_msg(
                    f"[IGNITION_CHECK] {symbol} price={price} vol={volume:.2f}"
                )

                if events:
                    for e in events:
                        self._log_msg(
                            f"[IGNITION_FIRE] {e.symbol} Δ={e.price_change_pct:.3f}"
                        )

                self._narrative.ingest_price_data(price_data)

            except Exception as e:
                self._log_msg(f"[PRICE_ENGINE_ERROR] {e}")

        # --------------------------------------------------
        # 🔥 GLOBAL FLOW MAPPING (ALWAYS RUNS)
        # --------------------------------------------------

        flow_output = None

        try:
            snap = self._narrative.get_propagation_snapshot()

            if isinstance(snap, dict) and len(snap) > 0:

                adapted_states = {}

                for symbol_key, data in snap.items():
                    adapted_states[symbol_key] = {
                        "drift": data.get("DRIFT", 0.0),
                        "bias": data.get("FILS", 0.0),
                        "persist": data.get("LIFE", 0),
                        "propagation_score": data.get("PROP", 0.0),
                        "lifespan": data.get("LIFE", 0),
                    }

                flow_output = self._flow_mapper.map(adapted_states)
                self._last_flow_map = flow_output

                long_syms = [x["symbol"] for x in flow_output["long"][:5]]

                print("\n" + "=" * 50)
                print("[FLOW MAP — ACTIVE]")
                print(f"Top Long → {long_syms}")
                print(f"Qualified → {flow_output['debug']['qualified_candidates']}")
                print(f"[FLOW FULL] {flow_output['all_ranked'][:3]}")
                print("=" * 50 + "\n")

            else:
                print("\n[FLOW MAP] No data")

        except Exception as e:
            self._log_msg(f"[FLOW_ERROR] {e}")

        # --------------------------------------------------
        # DRIFT (PER SYMBOL)
        # --------------------------------------------------

        drift_value = 0.0

        try:
            if symbol and flow_output:
                drift_value = next(
                    (
                        x["drift"]
                        for x in flow_output["all_ranked"]
                        if x["symbol"] == symbol
                    ),
                    0.0,
                )
        except Exception:
            drift_value = 0.0

        # --------------------------------------------------
        # SYMBOL BLOCK
        # --------------------------------------------------

        symbol_block = {}

        if symbol:
            symbol_block = {
                symbol: {
                    "price": price,
                    "last_price": prev,
                    "drift": drift_value,
                }
            }

        # --------------------------------------------------

        return {
            "decision": decision,
            "regime": result.get("regime"),
            "authority": result.get("authority"),
            "order_intent": order_intent,
            "execution_receipt": receipt,
            "engine_time": execution_input.engine_time,
            "symbols": symbol_block,
            "flow_map": self._last_flow_map,
        }