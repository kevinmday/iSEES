from typing import Set

import yfinance as yf


class SymbolValidator:
    """
    Symbol validation layer for MarketMind.

    Design Goals
    ------------
    • deterministic
    • fast
    • discovery-friendly
    • prevents obvious garbage tickers
    • allows dynamic narrative discovery
    """

    def __init__(self):

        # dynamic validated universe
        self.valid_symbols: Set[str] = set()

        # core liquidity anchors (always allowed)
        self._seed_universe()

    # --------------------------------------------------
    # SEED UNIVERSE
    # --------------------------------------------------

    def _seed_universe(self):

        seed = [
            "SPY", "QQQ", "DIA", "IWM",
            "NVDA", "AMD", "TSLA", "AAPL", "MSFT",
            "META", "AMZN", "GOOGL",
            "LMT", "RTX", "NOC",
            "LLY", "ILMN",
            "ROKU", "PINS",
            "RKLB"
        ]

        for s in seed:
            self.valid_symbols.add(s)

    # --------------------------------------------------
    # BASIC SANITY FILTER
    # --------------------------------------------------

    def _passes_basic_rules(self, symbol: str) -> bool:

        if not symbol:
            return False

        symbol = symbol.upper()

        # reject long garbage tickers
        if len(symbol) > 5:
            return False

        # reject mixed characters
        if not symbol.isalpha():
            return False

        return True

    # --------------------------------------------------
    # YAHOO VALIDATION
    # --------------------------------------------------

    def _validate_with_yahoo(self, symbol: str) -> bool:
        """
        Optional validation using Yahoo Finance.
        Used only for new symbols not already cached.
        """

        try:

            ticker = yf.Ticker(symbol)
            info = ticker.fast_info

            if info and "lastPrice" in info:
                return True

        except Exception:
            pass

        return False

    # --------------------------------------------------
    # PUBLIC VALIDATION API
    # --------------------------------------------------

    def is_valid(self, symbol: str) -> bool:

        if not self._passes_basic_rules(symbol):
            return False

        symbol = symbol.upper()

        # already validated
        if symbol in self.valid_symbols:
            return True

        # attempt external validation once
        if self._validate_with_yahoo(symbol):

            # cache successful symbol
            self.valid_symbols.add(symbol)

            return True

        return False