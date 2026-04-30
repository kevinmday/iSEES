# ============================================================
# contact_prioritizer.py — FACILITY PRIORITIZATION ENGINE (V1)
# ============================================================
# Purpose:
# Rank resolved facilities to determine investigation order.
#
# Input:
#   List of facilities (from facility_resolver)
#
# Output:
#   Ordered list with priority scores + labels
#
# Characteristics:
# - Deterministic scoring
# - Type-weighted prioritization
# - Distance-aware ranking
# - Drop-in safe, no dependencies
# ============================================================

from typing import List, Dict

# ------------------------------------------------------------
# TYPE PRIORITY WEIGHTS (TUNEABLE)
# ------------------------------------------------------------

TYPE_WEIGHTS = {
    "ATC": 1.0,
    "WEATHER_RADAR": 0.9,
    "RADAR": 0.9,
    "AIRPORT": 0.7,
    "MILITARY": 0.85,
    "LAW_ENFORCEMENT": 0.6,
    "MEDIA": 0.4,
}

DEFAULT_WEIGHT = 0.5


# ------------------------------------------------------------
# CORE SCORING FUNCTION
# ------------------------------------------------------------

def compute_priority_score(facility: Dict) -> float:
    """
    Compute priority score based on type + distance.

    score = type_weight / (1 + distance_km)
    """

    f_type = facility.get("type", "")
    distance = facility.get("distance_km", 9999)

    weight = TYPE_WEIGHTS.get(f_type, DEFAULT_WEIGHT)

    score = weight / (1 + distance)

    return round(score, 6)


# ------------------------------------------------------------
# PRIORITIZATION ENGINE
# ------------------------------------------------------------

def prioritize_contacts(facilities: List[Dict]) -> List[Dict]:
    """
    Rank facilities and assign priority labels.
    """

    enriched = []

    for f in facilities:
        item = dict(f)  # safe copy

        score = compute_priority_score(item)
        item["priority_score"] = score

        enriched.append(item)

    # sort descending by score
    enriched.sort(key=lambda x: x["priority_score"], reverse=True)

    # assign priority labels
    for idx, f in enumerate(enriched):
        if idx == 0:
            f["priority_label"] = "PRIMARY"
        elif idx <= 2:
            f["priority_label"] = "SECONDARY"
        else:
            f["priority_label"] = "SUPPORT"

    return enriched


# ------------------------------------------------------------
# OPTIONAL: HUMAN-READABLE OUTPUT
# ------------------------------------------------------------

def format_priority_output(facilities: List[Dict]) -> List[str]:
    """
    Convert prioritized facilities into readable lines.
    """

    lines = []

    for idx, f in enumerate(facilities, start=1):
        name = f.get("name", "Unknown")
        ftype = f.get("type", "UNKNOWN")
        dist = f.get("distance_km", "?")
        label = f.get("priority_label", "")
        score = f.get("priority_score", 0)

        line = f"{idx}. [{label}] {name} ({ftype}) - {dist} km | score={score}"
        lines.append(line)

    return lines


# ------------------------------------------------------------
# QUICK TEST (LOCAL DEBUG)
# ------------------------------------------------------------

if __name__ == "__main__":
    # sample input (simulate resolver output)
    sample = [
        {
            "type": "AIRPORT",
            "name": "Rogue Valley International Airport",
            "distance_km": 5.31,
        },
        {
            "type": "ATC",
            "name": "Medford Air Traffic Control Tower",
            "distance_km": 5.31,
        },
        {
            "type": "WEATHER_RADAR",
            "name": "KMAX NEXRAD Radar Site",
            "distance_km": 30.24,
        },
    ]

    ranked = prioritize_contacts(sample)

    for line in format_priority_output(ranked):
        print(line)