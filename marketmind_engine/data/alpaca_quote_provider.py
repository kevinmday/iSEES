import os
import requests


class AlpacaQuoteProvider:
    """
    Live quote provider using Alpaca market data API.

    Runtime compatibility:
        - get_price(symbol) → float
        - get_quote(symbol) → dict (expected by runtime)

    """

    def __init__(self):
        self.base_url = "https://data.alpaca.markets/v2/stocks"
        self.headers = {
            "APCA-API-KEY-ID": os.getenv("APCA_API_KEY_ID"),
            "APCA-API-SECRET-KEY": os.getenv("APCA_API_SECRET_KEY"),
        }

    # ---------------------------------------------------------
    # Primary API
    # ---------------------------------------------------------

    def get_price(self, symbol: str):

        try:
            url = f"{self.base_url}/{symbol}/quotes/latest"

            r = requests.get(url, headers=self.headers, timeout=5)

            if r.status_code != 200:
                print(f"[PRICE] Alpaca request failed {symbol}: {r.status_code}")
                return None

            data = r.json()
            quote = data.get("quote")

            if not quote:
                print(f"[PRICE] No quote returned for {symbol}")
                return None

            ask = quote.get("ap")
            bid = quote.get("bp")

            if ask:
                return float(ask)

            if bid:
                return float(bid)

            return None

        except Exception as e:
            print(f"[PRICE] fetch failure {symbol}: {e}")
            return None

    # ---------------------------------------------------------
    # Runtime Compatibility Layer
    # ---------------------------------------------------------

    def get_quote(self, symbol: str):
        """
        RuntimeExecutor compatibility.

        Runtime expects a quote dictionary:
            quote.get("ap")
            quote.get("bp")
        """

        price = self.get_price(symbol)

        if price is None:
            return None

        print(f"[PRICE] {symbol} {price}")

        # return quote structure expected by runtime
        return {
            "ap": price,
            "bp": price,
        }