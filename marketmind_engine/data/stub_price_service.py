"""
Stub price provider for MarketMind.

Provides deterministic placeholder prices so the engine
can run without a live market data provider.
"""


class StubPriceService:

    name = "stub_price"

    def get_price(self, symbol: str) -> float:
        """
        Return a deterministic placeholder price.

        The engine only needs a numeric value to allow
        PsiQuanta and policy evaluation to run.
        """
        return 100.0