# ============================================================
# intelligence/domain_resolver.py — DOMAIN INTELLIGENCE LAYER
# ============================================================

from typing import List, Dict


# ------------------------------------------------------------
# PUBLIC ENTRY
# ------------------------------------------------------------

def resolve_domain_targets(tokens: List[str], location: str) -> List[Dict]:
    """
    Deterministic semantic → domain target mapping

    This layer injects HIGH-VALUE investigation targets
    that do NOT exist in map data (FAA, radar, authority, etc)
    """

    t = normalize(tokens)
    targets = []

    # --------------------------------------------------------
    # AIRPORT / FLIGHT DOMAIN
    # --------------------------------------------------------
    if any(k in t for k in ["airport", "flight", "aircraft"]):
        targets.append({
            "name": f"{location} Major Airport",
            "type": "airport",
            "source": "domain"
        })

    # --------------------------------------------------------
    # RADAR / TRACKING
    # --------------------------------------------------------
    if any(k in t for k in ["radar", "tracked", "tracking"]):
        targets.append({
            "name": f"{location} Radar Data / FAA Tracking",
            "type": "radar",
            "source": "domain"
        })

    # --------------------------------------------------------
    # FAA / AUTHORITY
    # --------------------------------------------------------
    if any(k in t for k in ["faa", "flight", "airspace"]):
        targets.append({
            "name": f"{location} FAA Regional Authority",
            "type": "authority",
            "source": "domain"
        })

    # --------------------------------------------------------
    # MILITARY / DEFENSE
    # --------------------------------------------------------
    if any(k in t for k in ["military", "fast", "intercept"]):
        targets.append({
            "name": f"{location} Military Airspace / AFB",
            "type": "military",
            "source": "domain"
        })

    # --------------------------------------------------------
    # NEWS / MEDIA
    # --------------------------------------------------------
    targets.append({
        "name": f"{location} Local News",
        "type": "news",
        "source": "domain"
    })

    return targets


# ------------------------------------------------------------
# NORMALIZER
# ------------------------------------------------------------

def normalize(tokens: List[str]) -> List[str]:
    return [t.lower().strip() for t in tokens]