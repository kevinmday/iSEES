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
    ):
        self._coordinator = coordinator
        self._execution_service = execution_service

        # Optional runtime price provider (AlpacaQuoteProvider)
        # Passed through build_engine assembly
        self._price_service = price_service

    def run_cycle(
        self,
        execution_input: ExecutionInput,
        market_context_map: Optional[dict] = None,
    ) -> Dict[str, Any]:

        # --------------------------------------------------
        # Coordinator Execution
        # --------------------------------------------------

        result = self._coordinator.run(
            execution_input,
            market_context_map=market_context_map,
        )

        # --------------------------------------------------
        # Order Evaluation
        # --------------------------------------------------

        order_intent: Optional[OrderIntent] = result.get("order_intent")
        receipt: Optional[ExecutionReceipt] = None

        decision = "NO_ACTION"

        if order_intent:

            decision = f"ALLOW_{order_intent.side.upper()}"

            receipt = self._execution_service.submit_intent(order_intent)

        # --------------------------------------------------
        # Structured Runtime Result
        # --------------------------------------------------

        return {
            "decision": decision,
            "regime": result.get("regime"),
            "authority": result.get("authority"),
            "order_intent": order_intent,
            "execution_receipt": receipt,
            "engine_time": execution_input.engine_time,  # Engine owns monotonic time
        }