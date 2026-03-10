import os
import requests


class AlpacaQuoteProvider:

    def __init__(self):
        self.base_url = "https://data.alpaca.markets/v2/stocks"
        self.headers = {
            "APCA-API-KEY-ID": os.getenv("APCA_API_KEY_ID"),
            "APCA-API-SECRET-KEY": os.getenv("APCA_API_SECRET_KEY"),
        }

    def get_price(self, symbol: str) -> float:

        try:
            url = f"{self.base_url}/{symbol}/quotes/latest"

            r = requests.get(url, headers=self.headers, timeout=5)

            if r.status_code != 200:
                return None

            data = r.json()

            quote = data.get("quote")

            if not quote:
                return None

            ask = quote.get("ap")
            bid = quote.get("bp")

            if ask:
                return float(ask)

            if bid:
                return float(bid)

            return None

        except Exception:
            return None