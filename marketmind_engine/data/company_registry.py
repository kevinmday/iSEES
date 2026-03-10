import requests
import re


class CompanyRegistry:
    """
    MarketMind Security Master

    Loads company name → ticker mapping from SEC dataset
    and builds a token index for fast symbol lookup.
    """

    DATA_URL = "https://www.sec.gov/files/company_tickers.json"

    def __init__(self):

        self.name_to_ticker = {}
        self.token_index = {}

        self._load()

    # -------------------------------------------------
    # Load SEC Company List
    # -------------------------------------------------

    def _normalize(self, name: str) -> str:

        name = name.lower()

        name = name.replace(",", "").replace(".", "")

        name = name.replace(" inc", "")
        name = name.replace(" corp", "")
        name = name.replace(" corporation", "")
        name = name.replace(" ltd", "")
        name = name.replace(" plc", "")
        name = name.replace(" holdings", "")
        name = name.replace(" group", "")

        return name.strip()

    def _load(self):

        headers = {
            "User-Agent": "MarketMind Research Engine"
        }

        r = requests.get(self.DATA_URL, headers=headers)

        r.raise_for_status()

        data = r.json()

        for entry in data.values():

            ticker = entry["ticker"]

            raw_name = entry["title"]

            name = self._normalize(raw_name)

            self.name_to_ticker[name] = ticker

            tokens = name.split()

            for token in tokens:

                if len(token) < 3:  # ignore useless tokens like "ai"
                    continue

                if token not in self.token_index:
                    self.token_index[token] = set()

                self.token_index[token].add(ticker)

    # -------------------------------------------------
    # Fast Symbol Lookup
    # -------------------------------------------------

    def find(self, text):

        text = text.lower()

        # fast exact match check
        for name, ticker in self.name_to_ticker.items():
            if name in text:
                return [ticker]

        tokens = re.findall(r"[a-z]+", text)

        matches = set()

        for token in tokens:

            if len(token) < 3:
                continue

            if token in self.token_index:
                matches.update(self.token_index[token])

        # safety limit
        if len(matches) > 10:
            matches = set(list(matches)[:10])

        return sorted(matches)