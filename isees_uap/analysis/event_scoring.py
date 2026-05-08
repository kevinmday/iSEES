# ============================================================
# event_scoring.py
# EVENT SCORING LAYER
# V4 — EMERGENCE + MEMORY WEIGHTED SCORING
# ============================================================

from typing import Dict


# ============================================================
# CORE SCORING
# ============================================================

def score_event(
    event: Dict,
    clusters: list
) -> Dict:

    report_count = event.get(
        "report_count",
        0
    )

    cluster_count = event.get(
        "cluster_count",
        1
    )

    duration = max(

        event.get(
            "event_duration_seconds",
            1
        ),

        1
    )

    # --------------------------------------------------------
    # 1. EFFECTIVE DENSITY
    # --------------------------------------------------------

    density = (
        report_count
        /
        max(cluster_count, 1)
    )

    density_score = min(
        1.0,
        density / 5.0
    )

    # --------------------------------------------------------
    # 2. CORROBORATION
    # --------------------------------------------------------

    if clusters:

        corr = sum(

            c.get(
                "corroboration_score",
                0
            )

            for c in clusters

        ) / len(clusters)

    else:

        corr = 0

    # --------------------------------------------------------
    # 3. EVENT PATTERN
    # --------------------------------------------------------

    event_pattern = (

        event.get(
            "event_pattern",
            {}
        ).get(
            "event_pattern_type",
            ""
        )
    )

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

        spreads = [

            c.get(
                "spread_km",
                1
            )

            for c in clusters
        ]

        avg_spread = (
            sum(spreads)
            /
            len(spreads)
        )

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

    # ========================================================
    # BASE SCORE
    # ========================================================

    base_score = (

        (density_score * 0.25)
        +
        (corr * 0.15)
        +
        (pattern_score * 0.15)
        +
        (spatial_score * 0.10)
        +
        (temporal_score * 0.10)

    )

    # ========================================================
    # MEMORY BOOST FACTOR
    # ========================================================

    memory = event.get(
        "memory",
        {}
    )

    recurrence_score = memory.get(
        "recurrence_score",
        0.0
    )

    memory_factor = (
        1 + recurrence_score
    )

    memory_factor = min(
        memory_factor,
        2.5
    )

    # ========================================================
    # KOD EMERGENCE WEIGHTING
    # ========================================================

    emergence_clusters = []

    for cluster in clusters:

        emergence = cluster.get(
            "kod_emergence",
            {}
        )

        if emergence:

            emergence_clusters.append(
                emergence
            )

    # --------------------------------------------------------
    # DEFAULTS
    # --------------------------------------------------------

    avg_residual = 0.0

    avg_anomaly = 0.0

    unresolved_overlap = 0

    emergence_confidence = 0.0

    # --------------------------------------------------------
    # EXTRACTION
    # --------------------------------------------------------

    if emergence_clusters:

        avg_residual = sum(

            e.get(
                "avg_residual_strength",
                0.0
            )

            for e in emergence_clusters

        ) / len(emergence_clusters)

        avg_anomaly = sum(

            e.get(
                "avg_anomaly_probability",
                0.0
            )

            for e in emergence_clusters

        ) / len(emergence_clusters)

        emergence_confidence = sum(

            e.get(
                "emergence_confidence",
                0.0
            )

            for e in emergence_clusters

        ) / len(emergence_clusters)

        unresolved = []

        for e in emergence_clusters:

            unresolved.extend(

                e.get(
                    "unresolved_feature_overlap",
                    []
                )
            )

        unresolved_overlap = len(
            set(unresolved)
        )

    # ========================================================
    # EMERGENCE COMPONENTS
    # ========================================================

    residual_component = (
        avg_residual * 0.25
    )

    anomaly_component = (
        avg_anomaly * 0.20
    )

    emergence_component = (
        emergence_confidence * 0.20
    )

    contradiction_component = min(

        0.20,

        unresolved_overlap * 0.05
    )

    # ========================================================
    # FINAL SCORE
    # ========================================================

    emergence_boost = (

        residual_component
        +
        anomaly_component
        +
        emergence_component
        +
        contradiction_component
    )

    boosted_score = (

        (
            base_score
            +
            emergence_boost
        )

        * memory_factor
    )

    final_score = round(

        min(
            boosted_score,
            1.0
        ),

        3
    )

    # ========================================================
    # PRIORITY CLASSIFICATION
    # ========================================================

    if final_score >= 0.80:

        priority = "CRITICAL"

        action = (
            "immediate_operator_review"
        )

    elif final_score >= 0.65:

        priority = "HIGH"

        action = (
            "investigate_immediately"
        )

    elif final_score >= 0.45:

        priority = "MEDIUM"

        action = (
            "monitor_closely"
        )

    else:

        priority = "LOW"

        action = (
            "log_and_watch"
        )

    # ========================================================
    # RETURN
    # ========================================================

    return {

        "event_score":
            final_score,

        "memory_factor":
            round(memory_factor, 3),

        "priority":
            priority,

        "recommended_action":
            action,

        # ----------------------------------------------------
        # EMERGENCE
        # ----------------------------------------------------
        "emergence": {

            "avg_residual_strength":
                round(avg_residual, 3),

            "avg_anomaly_probability":
                round(avg_anomaly, 3),

            "emergence_confidence":
                round(
                    emergence_confidence,
                    3
                ),

            "unresolved_overlap_count":
                unresolved_overlap,

            "emergence_boost":
                round(
                    emergence_boost,
                    3
                )
        },

        # ----------------------------------------------------
        # COMPONENTS
        # ----------------------------------------------------
        "components": {

            "density":
                round(
                    density_score,
                    3
                ),

            "corroboration":
                round(
                    corr,
                    3
                ),

            "pattern":
                round(
                    pattern_score,
                    3
                ),

            "spatial":
                round(
                    spatial_score,
                    3
                ),

            "temporal":
                round(
                    temporal_score,
                    3
                ),

            "cluster_count":
                cluster_count,

            "report_count":
                report_count,

            "base_score":
                round(
                    base_score,
                    3
                ),

            "residual_component":
                round(
                    residual_component,
                    3
                ),

            "anomaly_component":
                round(
                    anomaly_component,
                    3
                ),

            "emergence_component":
                round(
                    emergence_component,
                    3
                ),

            "contradiction_component":
                round(
                    contradiction_component,
                    3
                )
        }
    }


# ============================================================
# APPLY TO ALL EVENTS
# ============================================================

def score_events(
    events: list,
    cluster_intel: list
) -> list:

    results = []

    for event in events:

        related_clusters = [

            c for c in cluster_intel

            if c["cluster_id"]
            in event.get(
                "clusters",
                []
            )
        ]

        score = score_event(
            event,
            related_clusters
        )

        event["scoring"] = score

        results.append(event)

    return results