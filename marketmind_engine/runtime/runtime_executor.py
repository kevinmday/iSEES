from typing import Optional, Dict, Any

from marketmind_engine.runtime.trade_coordinator import TradeCoordinator
from marketmind_engine.execution.execution_service import ExecutionService
from marketmind_engine.execution.execution_receipt import ExecutionReceipt
from marketmind_engine.execution.execution_input import ExecutionInput
from marketmind_engine.execution.execution_types import OrderIntent

# ✅ NEW
from marketmind_engine.intelligence.ignition_detector import IgnitionDetector

# ✅ NEW (critical)
from marketmind_engine.narrative.narrative_adapter import NarrativeAdapter


class RuntimeExecutor:
    """
    Thin runtime bridge.

    Responsibilities:
        • Invoke TradeCoordinator
        • Submit OrderIntent via ExecutionService
        • Derive explicit decision
        • Return structured result

    No intelligence.
    No mutation.
    No lifecycle authority.
    """

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

        # ✅ ignition detector
        self._ignition = IgnitionDetector()

        # ✅ narrative adapter
        self._narrative = narrative_adapter or NarrativeAdapter()

        # ✅ STEP 5 — price memory
        self._last_price = {}

    # --------------------------------------------------
    # Runtime Logging Helper
    # --------------------------------------------------

    def _log_msg(self, msg: str):
        if self._log:
            try:
                self._log(msg)
            except Exception:
                pass

    # --------------------------------------------------
    # Runtime Execution Cycle
    # --------------------------------------------------

    def run_cycle(
        self,
        execution_input: ExecutionInput,
        market_context_map: Optional[dict] = None,
    ) -> Dict[str, Any]:

        # --------------------------------------------------
        # Coordinator Execution
        # --------------------------------------------------

        try:

            result = self._coordinator.run(
                execution_input,
                market_context_map=market_context_map,
            )

            if not result:
                self._log_msg("Coordinator returned empty result")
                return {
                    "decision": "NO_ACTION",
                    "regime": None,
                    "authority": None,
                    "order_intent": None,
                    "execution_receipt": None,
                    "engine_time": execution_input.engine_time,
                }

        except Exception as e:

            self._log_msg(f"Coordinator error: {e}")

            return {
                "decision": "ERROR",
                "regime": None,
                "authority": None,
                "order_intent": None,
                "execution_receipt": None,
                "engine_time": execution_input.engine_time,
                "error": str(e),
            }

        # --------------------------------------------------
        # Order Evaluation
        # --------------------------------------------------

        order_intent: Optional[OrderIntent] = result.get("order_intent")
        receipt: Optional[ExecutionReceipt] = None

        decision = "NO_ACTION"

        if order_intent:

            decision = f"ALLOW_{order_intent.side.upper()}"

            score = getattr(order_intent, "score", None)

            trigger_msg = (
                "\n\n========== TRADE TRIGGER ==========\n"
                f"{order_intent.symbol} {order_intent.side.upper()}\n"
                f"ΨQ={score if score is not None else 'NA'}\n"
                "===================================\n"
            )

            print(trigger_msg)

            self._log_msg(
                f"🚨 TRADE TRIGGER: {order_intent.symbol} {order_intent.side.upper()} ΨQ={score if score is not None else 'NA'}"
            )

            try:

                receipt = self._execution_service.submit_intent(order_intent)

                if receipt:
                    self._log_msg(
                        f"ExecutionReceipt received: {order_intent.symbol}"
                    )

            except Exception as e:

                self._log_msg(
                    f"ExecutionService error: {order_intent.symbol} {e}"
                )

        # --------------------------------------------------
        # Decision Visibility
        # --------------------------------------------------

        self._log_msg(f"[DECISION] {execution_input.symbol} -> {decision}")

        # --------------------------------------------------
        # 🔥 PRICE → IGNITION → NARRATIVE (FIXED)
        # --------------------------------------------------

        if self._price_service and execution_input.symbol:

            try:

                symbol = execution_input.symbol

                raw_price = self._price_service.get_price(symbol)

                # ✅ FIX — normalize price
                price = None

                if isinstance(raw_price, dict):
                    price = raw_price.get("ap") or raw_price.get("bp")
                else:
                    price = raw_price

                if price:

                    self._log_msg(f"[PRICE] {symbol} {price}")

                    # ----------------------------------------
                    # 🔥 STEP 5 — RELATIVE VOLUME PROXY
                    # ----------------------------------------

                    prev_price = self._last_price.get(symbol)
                    self._last_price[symbol] = price

                    volume = 1.0

                    if prev_price and prev_price > 0:
                        change_pct = abs(price - prev_price) / prev_price
                        volume = 1.0 + (change_pct * 100)

                    volume = min(volume, 10.0)

                    price_data = {
                        symbol: {
                            "price": price,
                            "volume": volume
                        }
                    }

                    # ----------------------------------------
                    # 🔥 IGNITION DETECTION
                    # ----------------------------------------

                    events = self._ignition.process_batch(price_data)

                    self._log_msg(
                        f"[IGNITION_CHECK] {symbol} price={price} vol={volume:.2f}"
                    )

                    if events:
                        for e in events:
                            self._log_msg(
                                f"[IGNITION_FIRE] {e.symbol} Δ={e.price_change_pct:.3f} vol={e.volume_ratio:.2f}"
                            )

                    # ----------------------------------------
                    # 🔥 SEND TO NARRATIVE SYSTEM
                    # ----------------------------------------

                    self._narrative.ingest_price_data(price_data)

            except Exception:
                pass

        # --------------------------------------------------
        # Structured Runtime Result
        # --------------------------------------------------

        return {
            "decision": decision,
            "regime": result.get("regime"),
            "authority": result.get("authority"),
            "order_intent": order_intent,
            "execution_receipt": receipt,
            "engine_time": execution_input.engine_time,
        }