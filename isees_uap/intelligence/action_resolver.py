# ============================================================
# intelligence/action_resolver.py — ACTION LAYER (v5 STABLE)
# ============================================================

from typing import Dict
import os

# 🔥 PROVE THIS FILE IS LOADED
print("🔥 ACTION RESOLVER (V5 STABLE) LOADED FROM:", os.path.abspath(__file__))

# 🔥 DYNAMIC SOURCE ENGINE
from isees_uap.intelligence.source_resolver import (
    resolve_sources,
    build_actions_from_sources
)


# ------------------------------------------------------------
# PUBLIC ENTRY
# ------------------------------------------------------------
def resolve_actions(node_type: str, location: str) -> Dict:
    node_type = (node_type or "").lower()

    # 🔥 TRACE
    print(f"🧠 resolve_actions → TYPE: '{node_type}' LOCATION: '{location}'")

    # --------------------------------------------------------
    # NEWS — FULLY DYNAMIC ENGINE (V3 WIRED)
    # --------------------------------------------------------
    if node_type == "news":
        try:
            sources = resolve_sources(location)

            print(f"🟢 SOURCE COUNT: {len(sources)}")

            actions = build_actions_from_sources(sources, location)

            return {
                "type": "news",
                "location": location,
                **actions
            }

        except Exception as e:
            print(f"❌ SOURCE RESOLVER ERROR: {e}")
            return fallback_news(location)

    # --------------------------------------------------------
    # TOWER / AIRSPACE (TEMP GENERIC)
    # --------------------------------------------------------
    if node_type == "tower":
        return {
            "type": "tower",
            "location": location,
            "next_steps": [
                "Search LiveATC for nearest airport",
                "Check tower and approach frequencies",
                "Review timeframe of sighting"
            ],
            "contacts": []
        }

    # --------------------------------------------------------
    # DEFAULT
    # --------------------------------------------------------
    return {
        "type": node_type,
        "location": location,
        "next_steps": [
            f"Investigate '{location}' related activity",
            "Search supporting evidence"
        ],
        "contacts": []
    }


# ------------------------------------------------------------
# FALLBACK (ONLY IF ENGINE FAILS)
# ------------------------------------------------------------
def fallback_news(location: str) -> Dict:
    return {
        "type": "news",
        "location": location,
        "next_steps": [
            f"Search local sources for '{location}'",
            "Check regional activity reports"
        ],
        "contacts": []
    }