# ============================================================
# search_provider.py — BING WEB SEARCH PROVIDER
# ============================================================

import os
import requests
from typing import List, Dict

BING_API_KEY = os.getenv("BING_API_KEY")
BING_ENDPOINT = "https://api.bing.microsoft.com/v7.0/search"


def search_web(query: str, max_results: int = 8) -> List[Dict]:
    if not BING_API_KEY:
        print("❌ Missing BING_API_KEY")
        return []

    headers = {
        "Ocp-Apim-Subscription-Key": BING_API_KEY
    }

    params = {
        "q": query,
        "count": max_results,
        "textDecorations": False,
        "textFormat": "Raw"
    }

    try:
        res = requests.get(BING_ENDPOINT, headers=headers, params=params, timeout=10)
        data = res.json()

        results = []

        for item in data.get("webPages", {}).get("value", []):
            results.append({
                "title": item.get("name"),
                "url": item.get("url")
            })

        print(f"📡 BING RESULTS: {len(results)} for '{query}'")

        return results

    except Exception as e:
        print("❌ BING SEARCH ERROR:", e)
        return []