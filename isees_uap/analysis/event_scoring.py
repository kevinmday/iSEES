# ============================================================
# event_scoring.py — EVENT SCORING LAYER (V3 — MEMORY BOOST)
# ============================================================

from typing import Dict


# ------------------------------------------------------------
# CORE SCORING
# ------------------------------------------------------------

def score_event(event: Dict, clusters: list) -> Dict:

    report_count = event.get("report_count", 0)
    cluster_count = event.get("cluster_count", 1)
    duration = max(event.get("event_duration_seconds", 1), 1)

    # --------------------------------------------------------
    # 1. EFFECTIVE DENSITY
    # --------------------------------------------------------

    density = report_count / max(cluster_count, 1)
    density_score = min(1.0, density / 5.0)

    # --------------------------------------------------------
    # 2. CORROBORATION
    # --------------------------------------------------------

    if clusters:
        corr = sum(c.get("corroboration_score", 0) for c in clusters) / len(clusters)
    else:
        corr = 0

    # --------------------------------------------------------
    # 3. EVENT PATTERN
    # --------------------------------------------------------

    event_pattern = event.get("event_pattern", {}).get("event_pattern_type", "")

    if event_pattern == "persistent_event":
        pattern_score = 1.0
    elif event_pattern == "recurring_event":
        pattern_score = 0.8
    elif event_pattern == "repeat_event":
        pattern_score = 0.5
    else:
        pattern_score = 0.2

    # --------------------------------------------------------
    # 4. SPATIAL CONFIDENCE
    # --------------------------------------------------------

    if clusters:
        spreads = [c.get("spread_km", 1) for c in clusters]
        avg_spread = sum(spreads) / len(spreads)

        if avg_spread < 0.1:
            spatial_score = 1.0
        elif avg_spread < 1:
            spatial_score = 0.7
        else:
            spatial_score = 0.4
    else:
        spatial_score = 0.3

    # --------------------------------------------------------
    # 5. TEMPORAL CONFIDENCE
    # --------------------------------------------------------

    if cluster_count >= 2:
        temporal_score = 0.9
    elif duration < 3600:
        temporal_score = 1.0
    elif duration < 86400:
        temporal_score = 0.7
    else:
        temporal_score = 0.5

    # --------------------------------------------------------
    # BASE SCORE
    # --------------------------------------------------------

    base_score = (
        (density_score * 0.30) +
        (corr * 0.20) +
        (pattern_score * 0.20) +
        (spatial_score * 0.15) +
        (temporal_score * 0.15)
    )

    # --------------------------------------------------------
    # 🧠 MEMORY BOOST FACTOR (MBF)
    # --------------------------------------------------------

    memory = event.get("memory", {})
    recurrence_score = memory.get("recurrence_score", 0.0)

    # base multiplier
    memory_factor = 1 + recurrence_score

    # safety cap to prevent runaway amplification
    memory_factor = min(memory_factor, 2.5)

    boosted_score = base_score * memory_factor

    final_score = round(boosted_score, 3)

    # --------------------------------------------------------
    # CLASSIFICATION
    # --------------------------------------------------------

    if final_score >= 0.7:
        priority = "HIGH"
        action = "investigate_immediately"
    elif final_score >= 0.5:
        priority = "MEDIUM"
        action = "monitor_closely"
    else:
        priority = "LOW"
        action = "log_and_watch"

    return {
        "event_score": final_score,
        "memory_factor": round(memory_factor, 3),
        "priority": priority,
        "recommended_action": action,
        "components": {
            "density": round(density_score, 3),
            "corroboration": round(corr, 3),
            "pattern": round(pattern_score, 3),
            "spatial": round(spatial_score, 3),
            "temporal": round(temporal_score, 3),
            "cluster_count": cluster_count,
            "report_count": report_count,
            "base_score": round(base_score, 3)
        }
    }


# ------------------------------------------------------------
# APPLY TO ALL EVENTS
# ------------------------------------------------------------

def score_events(events: list, cluster_intel: list) -> list:

    results = []

    for event in events:
        related_clusters = [
            c for c in cluster_intel
            if c["cluster_id"] in event.get("clusters", [])
        ]

        score = score_event(event, related_clusters)

        event["scoring"] = score

        results.append(event)

    return results