# ============================================================
# event_scoring.py — EVENT SCORING LAYER (FINAL STABLE)
# ============================================================

from typing import Dict


# ------------------------------------------------------------
# CORE SCORING
# ------------------------------------------------------------

def score_event(event: Dict, clusters: list) -> Dict:
    """
    Deterministic event scoring (FINAL — burst-aware, human-delay safe)
    """

    report_count = event.get("report_count", 0)
    cluster_count = len(clusters)

    # --------------------------------------------------------
    # 1. 🔥 BURST-BASED DENSITY (CORRECT MODEL)
    # --------------------------------------------------------

    best_density = 0.0

    for c in clusters:
        c_reports = len(c.get("reports", []))
        c_duration = max(c.get("duration_seconds", 1), 1)

        c_density = c_reports / c_duration

        if c_density > best_density:
            best_density = c_density

    # normalize burst intensity (strong weight)
    density_score = min(1.0, best_density * 1000)


    # --------------------------------------------------------
    # 2. CORROBORATION
    # --------------------------------------------------------

    if clusters:
        corr = sum(c.get("corroboration_score", 0) for c in clusters) / cluster_count
    else:
        corr = 0.0


    # --------------------------------------------------------
    # 3. PATTERN MEMORY
    # --------------------------------------------------------

    pattern_weight = 0.0

    for c in clusters:
        pattern = c.get("pattern", {}).get("pattern_type", "")

        if pattern == "persistent_hotspot":
            pattern_weight += 1.0
        elif pattern == "recurring_hotspot":
            pattern_weight += 0.7
        elif pattern == "repeat_activity":
            pattern_weight += 0.4
        else:
            pattern_weight += 0.1

    pattern_score = pattern_weight / max(cluster_count, 1)


    # --------------------------------------------------------
    # 4. TEMPORAL COMPRESSION (SECONDARY NOW)
    # --------------------------------------------------------

    duration = event.get("event_duration_seconds", 1)

    if duration < 60:
        compression = 1.0
    elif duration < 3600:
        compression = 0.7
    elif duration < 86400:
        compression = 0.4
    else:
        compression = 0.2


    # --------------------------------------------------------
    # BASE SCORE (REBALANCED)
    # --------------------------------------------------------

    final_score = (
        (density_score * 0.40) +     # ↑ dominant signal
        (corr * 0.25) +
        (pattern_score * 0.15) +
        (compression * 0.10)
    )


    # --------------------------------------------------------
    # 🔥 BOOSTS (REAL-WORLD SIGNAL LOGIC)
    # --------------------------------------------------------

    # multiple clusters = stronger confirmation
    if cluster_count > 1:
        final_score += 0.15

    # strong witness count
    if report_count >= 5:
        final_score += 0.15

    # very tight spatial cluster bonus
    tight_clusters = [
        c for c in clusters if c.get("spread_km", 1) < 0.1
    ]
    if len(tight_clusters) >= 1:
        final_score += 0.05


    # clamp
    final_score = round(min(1.0, final_score), 3)


    # --------------------------------------------------------
    # CLASSIFICATION (TUNED)
    # --------------------------------------------------------

    if final_score >= 0.70:
        priority = "HIGH"
        action = "investigate_immediately"
    elif final_score >= 0.45:
        priority = "MEDIUM"
        action = "monitor_closely"
    else:
        priority = "LOW"
        action = "log_and_watch"


    return {
        "event_score": final_score,
        "priority": priority,
        "recommended_action": action,

        "components": {
            "density": round(density_score, 3),
            "corroboration": round(corr, 3),
            "pattern": round(pattern_score, 3),
            "compression": round(compression, 3),
            "cluster_count": cluster_count,
            "report_count": report_count
        }
    }


# ------------------------------------------------------------
# APPLY TO ALL EVENTS
# ------------------------------------------------------------

def score_events(events: list, cluster_intel: list) -> list:
    """
    Attach scoring to each event
    """

    results = []

    for event in events:
        related_clusters = [
            c for c in cluster_intel
            if c["cluster_id"] in event.get("clusters", [])
        ]

        event["scoring"] = score_event(event, related_clusters)

        results.append(event)

    return results