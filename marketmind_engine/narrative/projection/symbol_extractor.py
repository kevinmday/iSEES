import re

from marketmind_engine.data.company_registry import CompanyRegistry


class SymbolExtractor:

    TICKER_PATTERN = re.compile(r"\b[A-Z]{2,5}\b")

    # common English tokens that are also tickers
    TICKER_STOPWORDS = {
        "AI",
        "ON",
        "IT",
        "SO",
        "GO",
        "ALL",
        "CAN",
        "FOR",
        "ARE",
    }

    def __init__(self):

        self.registry = CompanyRegistry()

        # fast lookup set
        self.valid_tickers = set(self.registry.name_to_ticker.values())

    def extract(self, text):

        symbols = set()

        # -------------------------------------------------
        # company name lookup
        # -------------------------------------------------

        company_matches = self.registry.find(text)

        symbols.update(company_matches)

        # -------------------------------------------------
        # explicit ticker detection
        # -------------------------------------------------

        tickers = self.TICKER_PATTERN.findall(text)

        for ticker in tickers:

            if ticker in self.TICKER_STOPWORDS:
                continue

            if ticker in self.valid_tickers:
                symbols.add(ticker)

        return sorted(symbols)