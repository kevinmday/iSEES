"""
MarketMind — Real Symbol Discovery Engine

RSS feeds
→ ticker extraction
→ ticker validation
→ publisher diversity
→ early candidate detection
"""

import re
import requests
import xml.etree.ElementTree as ET
from collections import defaultdict
from pathlib import Path


RSS_FEEDS = {

    "yahoo": "https://finance.yahoo.com/news/rssindex",
    "marketwatch": "https://feeds.marketwatch.com/marketwatch/topstories/",
    "nasdaq": "https://www.nasdaq.com/feed/rssoutbound?category=Stocks",
    "benzinga": "https://www.benzinga.com/feed",
    "investing": "https://www.investing.com/rss/news_25.rss",

}


HEADERS = {
    "User-Agent": "Mozilla/5.0 (MarketMind Discovery Engine)"
}


TICKER_PATTERN = r"\b[A-Z]{2,5}\b"


STOP_WORDS = {
    "THE","AND","FOR","WITH","THIS","THAT","FROM","WILL","HAVE","ARE",
    "YOU","YOUR","ABOUT","AFTER","BEFORE","WHILE","WHERE","WHEN",
    "CEO","USD","US","FED","GDP","AI","IPO","ETF","SEC"
}


# --------------------------------------------------
# Load ticker universe
# --------------------------------------------------

def load_tickers():

    path = Path("marketmind_engine/data/tickers.txt")

    if not path.exists():
        return set()

    with open(path) as f:
        return {line.strip().upper() for line in f if line.strip()}


TICKERS = load_tickers()


# --------------------------------------------------
# Fetch RSS feed
# --------------------------------------------------

def fetch_feed(url):

    try:

        r = requests.get(url, headers=HEADERS, timeout=10)
        r.raise_for_status()

        return r.text

    except Exception:

        print(f"Feed error: {url}")
        return None


# --------------------------------------------------
# Parse RSS / Atom
# --------------------------------------------------

def parse_feed(xml):

    items = []

    try:
        root = ET.fromstring(xml)
    except Exception:
        return items


    # RSS format
    for item in root.iter("item"):

        title = item.findtext("title") or ""
        desc = item.findtext("description") or ""

        items.append(title + " " + desc)


    # Atom format
    for entry in root.iter("{http://www.w3.org/2005/Atom}entry"):

        title = entry.findtext("{http://www.w3.org/2005/Atom}title") or ""
        summary = entry.findtext("{http://www.w3.org/2005/Atom}summary") or ""

        items.append(title + " " + summary)


    return items


# --------------------------------------------------
# Extract ticker symbols
# --------------------------------------------------

def extract_symbols(text):

    matches = re.findall(TICKER_PATTERN, text)

    symbols = []

    for m in matches:

        if m in STOP_WORDS:
            continue

        if TICKERS and m not in TICKERS:
            continue

        symbols.append(m)

    return symbols


# --------------------------------------------------
# Discovery Engine
# --------------------------------------------------

def discover(return_symbols=False):

    print("\n=== MARKETMIND REAL DISCOVERY ===\n")

    symbol_publishers = defaultdict(set)
    symbol_mentions = defaultdict(int)

    for publisher, feed in RSS_FEEDS.items():

        print(f"Scanning {publisher}")

        xml = fetch_feed(feed)

        if not xml:
            continue

        items = parse_feed(xml)

        for text in items:

            symbols = extract_symbols(text)

            for sym in symbols:

                symbol_publishers[sym].add(publisher)
                symbol_mentions[sym] += 1


    ranked = []

    for sym in symbol_mentions:

        pubs = symbol_publishers[sym]
        mentions = symbol_mentions[sym]

        ranked.append((sym, mentions, len(pubs), pubs))


    ranked.sort(key=lambda x: x[1], reverse=True)


    confirmed = []
    early = []


    print("\n--- Publisher Confirmed ---\n")

    for sym, mentions, pubcount, pubs in ranked:

        if pubcount >= 2:

            publist = ",".join(sorted(pubs))

            print(f"{sym:<6} mentions={mentions}  publishers={pubcount}  [{publist}]")

            confirmed.append(sym)


    print("\n--- Early Candidates ---\n")

    for sym, mentions, pubcount, pubs in ranked:

        if pubcount == 1:

            print(f"{sym:<6} mentions={mentions}")

            early.append(sym)


    print("\n=== DISCOVERY COMPLETE ===\n")


    if return_symbols:

        return confirmed + early


# --------------------------------------------------
# Runner
# --------------------------------------------------

def run():

    discover()


if __name__ == "__main__":
    run()