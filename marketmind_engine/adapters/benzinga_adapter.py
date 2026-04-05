"""
Benzinga Adapter
----------------
Fetches real-time news from Benzinga API and normalizes it into
MarketMind event format.

SAFE DESIGN:
- Fails gracefully (never crashes engine)
- Works even if API key missing (returns empty list)
- Deduplicates events per cycle
"""

import os
import time
import requests
from datetime import datetime

# ============================================================
# CONFIG
# ============================================================

BENZINGA_API_KEY = os.getenv("BENZINGA_API_KEY", "")
BENZINGA_ENDPOINT = "https://api.benzinga.com/api/v2/news"

# How far back to pull (minutes)
LOOKBACK_MINUTES = 5

# Request timeout
REQUEST_TIMEOUT = 5

# ============================================================
# INTERNAL STATE (DEDUP)
# ============================================================

_seen_ids = set()


# ============================================================
# HELPERS
# ============================================================

def _get_time_window():
    """Return ISO8601 time window for Benzinga query"""
    now = datetime.utcnow()
    start = now.timestamp() - (LOOKBACK_MINUTES * 60)

    return int(start), int(now.timestamp())


def _safe_get(d, key, default=None):
    """Safe dict access"""
    try:
        return d.get(key, default)
    except Exception:
        return default


def _normalize_symbols(item):
    """Extract tickers safely"""
    symbols = []

    stocks = _safe_get(item, "stocks", [])
    for s in stocks:
        ticker = _safe_get(s, "name")
        if ticker:
            symbols.append(ticker.upper())

    return list(set(symbols))


def _normalize_sentiment(item):
    """Convert Benzinga sentiment to numeric"""
    sentiment = _safe_get(item, "sentiment", None)

    if sentiment is None:
        return 0.0

    if isinstance(sentiment, (int, float)):
        return float(sentiment)

    sentiment_map = {
        "bullish": 0.7,
        "positive": 0.6,
        "neutral": 0.0,
        "negative": -0.6,
        "bearish": -0.7,
    }

    return sentiment_map.get(str(sentiment).lower(), 0.0)


def _normalize_timestamp(item):
    """Convert timestamp safely"""
    ts = _safe_get(item, "created", None)

    if not ts:
        return time.time()

    try:
        # Benzinga format: ISO string
        dt = datetime.fromisoformat(ts.replace("Z", "+00:00"))
        return dt.timestamp()
    except Exception:
        return time.time()


def _normalize_domain(item):
    """Basic domain classification"""
    channels = _safe_get(item, "channels", [])

    if not channels:
        return "general"

    ch = str(channels[0]).lower()

    if "tech" in ch:
        return "technology"
    if "energy" in ch:
        return "energy"
    if "crypto" in ch:
        return "crypto"
    if "macro" in ch or "economy" in ch:
        return "macro"

    return ch


def _normalize_event(item):
    """Convert Benzinga item to MarketMind event"""

    event_id = _safe_get(item, "id")

    # Dedup check
    if event_id in _seen_ids:
        return None

    _seen_ids.add(event_id)

    headline = _safe_get(item, "title", "")
    summary = _safe_get(item, "description", "")

    symbols = _normalize_symbols(item)
    sentiment = _normalize_sentiment(item)
    timestamp = _normalize_timestamp(item)
    domain = _normalize_domain(item)

    if not headline:
        return None

    return {
        "type": "news_event",
        "source": "benzinga",
        "id": event_id,
        "headline": headline,
        "summary": summary,
        "symbols": symbols,
        "sentiment": sentiment,
        "timestamp": timestamp,
        "domain": domain,
    }


# ============================================================
# MAIN FETCH FUNCTION
# ============================================================

def fetch_benzinga_news():
    """
    Main entry point for MarketMind ingestion

    Returns:
        List of normalized events
    """

    if not BENZINGA_API_KEY:
        print("[BENZINGA] No API key found. Skipping.")
        return []

    start_ts, end_ts = _get_time_window()

    params = {
        "token": BENZINGA_API_KEY,
        "pageSize": 50,
        "displayOutput": "full",
        "sort": "updated:desc",
    }

    try:
        response = requests.get(
            BENZINGA_ENDPOINT,
            params=params,
            timeout=REQUEST_TIMEOUT
        )

        if response.status_code != 200:
            print(f"[BENZINGA] HTTP {response.status_code}")
            return []

        data = response.json()

        # Benzinga response structure may vary
        items = data.get("data") or data.get("news") or []

        events = []

        for item in items:
            event = _normalize_event(item)
            if event:
                events.append(event)

        if events:
            print(f"[BENZINGA] fetched {len(events)} events")

        return events

    except Exception as e:
        print(f"[BENZINGA] ERROR: {e}")
        return []


# ============================================================
# TEST MODE
# ============================================================

if __name__ == "__main__":
    print("Running Benzinga adapter test...\n")
    events = fetch_benzinga_news()

    for e in events[:5]:
        print(e)