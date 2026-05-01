# ============================================================
# pattern_memory.py — CLUSTER PATTERN MEMORY (V2 DEDUP STABLE)
# ============================================================

import os
import json
from datetime import datetime, UTC
from typing import Dict, List
from math import radians, sin, cos, sqrt, atan2

# ------------------------------------------------------------
# CONFIG
# ------------------------------------------------------------

BASE_DIR = os.path.dirname(os.path.dirname(__file__))
MEMORY_FILE = os.path.join(BASE_DIR, "memory", "cluster_memory.json")

MATCH_RADIUS_KM = 5.0


# ------------------------------------------------------------
# UTIL
# ------------------------------------------------------------

def _haversine_km(lat1, lon1, lat2, lon2):
    if None in (lat1, lon1, lat2, lon2):
        return 9999

    R = 6371.0
    dlat = radians(lat2 - lat1)
    dlon = radians(lon2 - lon1)

    a = sin(dlat / 2)**2 + cos(radians(lat1)) * cos(radians(lat2)) * sin(dlon / 2)**2
    c = 2 * atan2(sqrt(a), sqrt(1 - a))

    return R * c


def _now():
    return datetime.now(UTC).isoformat()


# ------------------------------------------------------------
# STORAGE
# ------------------------------------------------------------

def _load_memory() -> List[Dict]:
    if not os.path.exists(MEMORY_FILE):
        return []

    try:
        with open(MEMORY_FILE, "r", encoding="utf-8") as f:
            return json.load(f)
    except:
        return []


def _save_memory(memory: List[Dict]):
    os.makedirs(os.path.dirname(MEMORY_FILE), exist_ok=True)

    with open(MEMORY_FILE, "w", encoding="utf-8") as f:
        json.dump(memory, f, indent=2)


# ------------------------------------------------------------
# CORE LOGIC (DEDUP ENABLED)
# ------------------------------------------------------------

def update_pattern_memory(cluster_intel: Dict) -> Dict:
    """
    Update persistent memory and return pattern metadata
    Deduplicates repeated cluster replays using cluster_key
    """

    center = cluster_intel.get("cluster_center", {})
    cluster_key = cluster_intel.get("cluster_key")

    lat = center.get("lat")
    lon = center.get("lon")

    if lat is None or lon is None:
        return {
            "repeat_count": 0,
            "pattern_type": "unknown",
            "first_seen": None,
            "last_seen": None
        }

    memory = _load_memory()

    match = None

    # --------------------------------------------------------
    # FIND MATCH (SPATIAL)
    # --------------------------------------------------------

    for entry in memory:
        dist = _haversine_km(lat, lon, entry.get("lat"), entry.get("lon"))
        if dist <= MATCH_RADIUS_KM:
            match = entry
            break

    now = _now()

    # --------------------------------------------------------
    # UPDATE / CREATE
    # --------------------------------------------------------

    if match:
        # ensure seen_keys exists (backward compatible)
        if "seen_keys" not in match:
            match["seen_keys"] = []

        # 🔥 DEDUP CHECK
        if cluster_key and cluster_key not in match["seen_keys"]:
            match["repeat_count"] += 1
            match["last_seen"] = now
            match["seen_keys"].append(cluster_key)

    else:
        match = {
            "lat": lat,
            "lon": lon,
            "repeat_count": 1,
            "first_seen": now,
            "last_seen": now,
            "seen_keys": [cluster_key] if cluster_key else []
        }
        memory.append(match)

    _save_memory(memory)

    # --------------------------------------------------------
    # CLASSIFICATION
    # --------------------------------------------------------

    rc = match["repeat_count"]

    if rc >= 5:
        pattern_type = "persistent_hotspot"
    elif rc >= 3:
        pattern_type = "recurring_hotspot"
    elif rc >= 2:
        pattern_type = "repeat_activity"
    else:
        pattern_type = "single_event"

    return {
        "repeat_count": rc,
        "first_seen": match["first_seen"],
        "last_seen": match["last_seen"],
        "pattern_type": pattern_type
    }