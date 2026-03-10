# marketmind_engine/data/alpaca_provider.py

from typing import Dict
import os

from alpaca.data.historical import StockHistoricalDataClient
from alpaca.data.requests import StockLatestTradeRequest


class AlpacaProvider:
    """
    Live Alpaca market data provider.

    Provides real-time price data for the MarketMind engine.
    """

    name = "alpaca"
    mode = "live"

    capabilities = {
        "quotes": True,
        "bars": True,
        "volume": True,
        "historical": True,
        "orders": False,
        "streaming": False,
    }

    def __init__(self, config: Dict | None = None):

        self.config = config or {}

        api_key = os.getenv("ALPACA_API_KEY")
        secret_key = os.getenv("ALPACA_SECRET_KEY")

        if not api_key or not secret_key:
            raise RuntimeError(
                "ALPACA_API_KEY and ALPACA_SECRET_KEY must be set in environment"
            )

        self.client = StockHistoricalDataClient(api_key, secret_key)

    def get_price(self, symbol: str) -> float:
        """
        Returns latest trade price.
        """

        try:

            request = StockLatestTradeRequest(symbol_or_symbols=symbol)

            trade = self.client.get_stock_latest_trade(request)

            if symbol in trade:
                return float(trade[symbol].price)

        except Exception as e:
            print(f"[AlpacaProvider] price fetch error {symbol}: {e}")

        return 0.0

    def get_symbol_data(self, symbol: str) -> Dict:
        """
        Returns structured symbol snapshot used by the engine.
        """

        price = self.get_price(symbol)

        return {
            "symbol": symbol,
            "price": price,
            "provider": "alpaca"
        }