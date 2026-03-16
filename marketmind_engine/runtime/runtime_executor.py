from typing import Optional, Dict, Any

from marketmind_engine.runtime.trade_coordinator import TradeCoordinator
from marketmind_engine.execution.execution_service import ExecutionService
from marketmind_engine.execution.execution_receipt import ExecutionReceipt
from marketmind_engine.execution.execution_input import ExecutionInput
from marketmind_engine.execution.execution_types import OrderIntent


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
    ):
        self._coordinator = coordinator
        self._execution_service = execution_service

        # Optional runtime price provider (AlpacaQuoteProvider)
        self._price_service = price_service

        # Optional UI telemetry logger (provided by server)
        self._log = telemetry_logger

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

            # --------------------------------------------------
            # TERMINAL TRADE TRIGGER (UI-independent signal)
            # --------------------------------------------------

            print("\n\n========== TRADE TRIGGER ==========")
            print(f"{order_intent.symbol} {order_intent.side.upper()}")
            print("===================================\n\n")

            self._log_msg(
                f"OrderIntent detected: {order_intent.symbol} {order_intent.side}"
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
        # Optional Runtime Price Visibility
        # --------------------------------------------------

        if self._price_service and execution_input.symbol:

            try:

                price = self._price_service.get_price(execution_input.symbol)

                if price:
                    self._log_msg(
                        f"[PRICE] {execution_input.symbol} {price}"
                    )

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