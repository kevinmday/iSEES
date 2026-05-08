# ============================================================
# cluster_engine.py
# MANIFOLD CLUSTER ENGINE + KOD RESIDUAL INTELLIGENCE (V2)
# ============================================================

import os
import json

from datetime import datetime, UTC
from typing import List, Dict

# ------------------------------------------------------------
# NORMALIZATION
# ------------------------------------------------------------

from isees_uap.normalization.normalize_observation import (
    normalize_observation
)

# ------------------------------------------------------------
# DISTANCE METRICS
# ------------------------------------------------------------

from isees_uap.analysis.distance_metrics import (
    calculate_distance
)

# ------------------------------------------------------------
# PIPELINE
# ------------------------------------------------------------

from isees_uap.analysis.cluster_intelligence import (
    build_cluster_intelligence
)

from isees_uap.analysis.event_inference import (
    build_events
)

from isees_uap.analysis.event_pattern_memory import (
    apply_event_pattern_memory
)

from isees_uap.analysis.event_scoring import (
    score_events
)

from isees_uap.analysis.escalation_router import (
    route_events
)

# ------------------------------------------------------------
# MEMORY
# ------------------------------------------------------------

from isees_uap.memory.event_intelligence_store import (

    update_from_event,

    get_location_intelligence
)

# ------------------------------------------------------------
# HOTSPOT
# ------------------------------------------------------------

from isees_uap.analysis.hotspot_intelligence import (
    compute_hotspot
)


# ============================================================
# CONFIG
# ============================================================

BASE_DIR = os.path.dirname(
    os.path.dirname(__file__)
)

LOG_DIR = os.path.join(
    BASE_DIR,
    "logs"
)

# ------------------------------------------------------------
# MANIFOLD DISTANCE THRESHOLD
# ------------------------------------------------------------

CLUSTER_DISTANCE_THRESHOLD = 3.5

# ------------------------------------------------------------
# KOD RESIDUAL WEIGHTING
# ------------------------------------------------------------

KOD_RESIDUAL_WEIGHT = 1.5

KOD_ANOMALY_WEIGHT = 1.2


# ============================================================
# LOAD REPORTS
# ============================================================

def load_reports() -> List[Dict]:

    reports = []

    if not os.path.exists(LOG_DIR):
        return reports

    for file in os.listdir(LOG_DIR):

        if not file.endswith(".json"):
            continue

        path = os.path.join(
            LOG_DIR,
            file
        )

        try:

            with open(
                path,
                "r",
                encoding="utf-8"
            ) as f:

                report = json.load(f)

        except Exception:
            continue

        reports.append(report)

    return reports


# ============================================================
# NORMALIZE REPORTS
# ============================================================

def normalize_reports(
    reports: List[Dict]
) -> List[Dict]:

    normalized_reports = []

    for report in reports:

        try:

            normalized = normalize_observation(
                report
            )

            normalized_observation = (
                normalized[
                    "normalized_observation"
                ]
            )

            # ------------------------------------------------
            # ATTACH KOD
            # ------------------------------------------------

            if "kod" in report:

                normalized_observation["kod"] = (
                    report["kod"]
                )

            normalized_reports.append(
                normalized_observation
            )

        except Exception as e:

            print(
                f"[NORMALIZATION_ERROR] {e}"
            )

    return normalized_reports


# ============================================================
# KOD RESIDUAL DISTANCE
# ============================================================

def calculate_kod_distance(
    report_a: Dict,
    report_b: Dict
) -> float:

    """
    Residual emergence similarity.

    Lower score = stronger similarity.
    """

    kod_a = report_a.get("kod", {})
    kod_b = report_b.get("kod", {})

    pipeline_a = kod_a.get(
        "pipeline_result",
        {}
    )

    pipeline_b = kod_b.get(
        "pipeline_result",
        {}
    )

    residual_a = pipeline_a.get(
        "residual",
        {}
    )

    residual_b = pipeline_b.get(
        "residual",
        {}
    )

    strength_a = residual_a.get(
        "residual_strength",
        0.0
    )

    strength_b = residual_b.get(
        "residual_strength",
        0.0
    )

    delta = abs(
        strength_a - strength_b
    )

    return round(delta, 3)


# ============================================================
# MANIFOLD CLUSTERING
# ============================================================

def cluster_reports(
    reports: List[Dict]
) -> List[List[Dict]]:

    clusters = []

    visited = set()

    for idx, report in enumerate(reports):

        observation_id = report.get(
            "observation_id",
            f"obs-{idx}"
        )

        if observation_id in visited:
            continue

        cluster = []

        queue = [report]

        visited.add(observation_id)

        while queue:

            current = queue.pop(0)

            cluster.append(current)

            for candidate in reports:

                candidate_id = candidate.get(
                    "observation_id",
                    ""
                )

                if candidate_id in visited:
                    continue

                try:

                    manifold_distance = (
                        calculate_distance(
                            current,
                            candidate
                        )
                    )

                    total_distance = (
                        manifold_distance.get(
                            "total_distance",
                            999.0
                        )
                    )

                except Exception:
                    continue

                # --------------------------------------------
                # KOD RESIDUAL DISTANCE
                # --------------------------------------------

                kod_distance = (
                    calculate_kod_distance(
                        current,
                        candidate
                    )
                )

                # --------------------------------------------
                # COMBINED EMERGENCE DISTANCE
                # --------------------------------------------

                emergence_distance = (
                    total_distance
                    +
                    (
                        kod_distance
                        *
                        KOD_RESIDUAL_WEIGHT
                    )
                )

                # --------------------------------------------
                # MANIFOLD PROXIMITY TEST
                # --------------------------------------------

                if (
                    emergence_distance
                    <=
                    CLUSTER_DISTANCE_THRESHOLD
                ):

                    visited.add(candidate_id)

                    queue.append(candidate)

        clusters.append(cluster)

    return clusters


# ============================================================
# BUILD CLUSTER OBJECTS
# ============================================================

def build_cluster_objects(
    clusters: List[List[Dict]]
) -> List[Dict]:

    output = []

    for idx, cluster in enumerate(
        clusters,
        start=1
    ):

        # ----------------------------------------------------
        # BASIC CONFIDENCE
        # ----------------------------------------------------

        confidence = round(

            min(
                1.0,
                len(cluster) / 5
            ),

            2
        )

        # ----------------------------------------------------
        # CLUSTER CENTER
        # ----------------------------------------------------

        lats = []
        lons = []

        residuals = []

        anomaly_probs = []

        unresolved_features = []

        for observation in cluster:

            geo = observation.get(
                "normalized_geo",
                {}
            )

            lat = geo.get("resolved_lat")
            lon = geo.get("resolved_lon")

            if lat is not None:
                lats.append(lat)

            if lon is not None:
                lons.append(lon)

            # ------------------------------------------------
            # KOD EXTRACTION
            # ------------------------------------------------

            kod = observation.get(
                "kod",
                {}
            )

            pipeline = kod.get(
                "pipeline_result",
                {}
            )

            residual = pipeline.get(
                "residual",
                {}
            )

            residual_strength = residual.get(
                "residual_strength",
                0.0
            )

            anomaly_probability = residual.get(
                "anomaly_probability",
                0.0
            )

            residuals.append(
                residual_strength
            )

            anomaly_probs.append(
                anomaly_probability
            )

            unresolved = residual.get(
                "unresolved_features",
                []
            )

            unresolved_features.extend(
                unresolved
            )

        cluster_center = {

            "lat":

                sum(lats) / len(lats)

                if lats else None,

            "lon":

                sum(lons) / len(lons)

                if lons else None
        }

        # ----------------------------------------------------
        # EMERGENCE METRICS
        # ----------------------------------------------------

        avg_residual = round(

            sum(residuals) / len(residuals),

            3

        ) if residuals else 0.0

        avg_anomaly = round(

            sum(anomaly_probs)
            / len(anomaly_probs),

            3

        ) if anomaly_probs else 0.0

        unique_features = list(
            sorted(
                set(unresolved_features)
            )
        )

        # ----------------------------------------------------
        # EMERGENCE WEIGHTED CONFIDENCE
        # ----------------------------------------------------

        emergence_confidence = round(

            min(

                1.0,

                confidence
                +
                (
                    avg_residual
                    *
                    KOD_RESIDUAL_WEIGHT
                )
                +
                (
                    avg_anomaly
                    *
                    KOD_ANOMALY_WEIGHT
                )
            ),

            3
        )

        # ----------------------------------------------------
        # BUILD OBJECT
        # ----------------------------------------------------

        output.append({

            "cluster_id":
                f"CLUSTER-{idx:03}",

            "report_count":
                len(cluster),

            "cluster_center":
                cluster_center,

            "confidence":
                confidence,

            # ------------------------------------------------
            # KOD EMERGENCE
            # ------------------------------------------------
            "kod_emergence": {

                "avg_residual_strength":
                    avg_residual,

                "avg_anomaly_probability":
                    avg_anomaly,

                "unresolved_feature_overlap":
                    unique_features,

                "emergence_confidence":
                    emergence_confidence,
            },

            "reports":
                cluster
        })

    return output


# ============================================================
# CLUSTER INTELLIGENCE
# ============================================================

def apply_cluster_intelligence(
    cluster_objects: List[Dict]
) -> List[Dict]:

    results = []

    for cluster in cluster_objects:

        try:

            intel = build_cluster_intelligence(
                cluster
            )

            intel["reports"] = cluster.get(
                "reports",
                []
            )

            # ------------------------------------------------
            # PRESERVE KOD EMERGENCE
            # ------------------------------------------------

            intel["kod_emergence"] = (
                cluster.get(
                    "kod_emergence",
                    {}
                )
            )

            results.append(intel)

        except Exception as e:

            results.append({

                "cluster_id":
                    cluster.get("cluster_id"),

                "error":
                    str(e),

                "fallback":
                    cluster
            })

    print(
        f"[CLUSTER_INTEL] generated={len(results)}"
    )

    return results


# ============================================================
# EVENT MEMORY
# ============================================================

def apply_event_memory(
    events: List[Dict]
) -> List[Dict]:

    for event in events:

        center = event.get(
            "event_center",
            {}
        )

        lat = center.get("lat")
        lon = center.get("lon")

        if lat is not None and lon is not None:

            lat_norm = round(lat, 3)
            lon_norm = round(lon, 3)

            update_from_event({

                "geo_context": {

                    "center": {

                        "lat": lat_norm,
                        "lon": lon_norm
                    }
                }
            })

            event["memory"] = (
                get_location_intelligence(
                    lat_norm,
                    lon_norm
                )
            )

        else:

            event["memory"] = {

                "known": False,

                "total_events": 0,

                "recurrence_score": 0.0
            }

    return events


# ============================================================
# HOTSPOT INTELLIGENCE
# ============================================================

def apply_hotspot_intelligence(
    events: List[Dict]
) -> List[Dict]:

    for event in events:

        memory = event.get(
            "memory",
            {}
        )

        event["hotspot"] = (
            compute_hotspot(memory)
        )

    return events


# ============================================================
# ENTRY POINT
# ============================================================

def run_cluster_engine() -> Dict:

    # --------------------------------------------------------
    # LOAD RAW REPORTS
    # --------------------------------------------------------

    raw_reports = load_reports()

    if not raw_reports:
        return {}

    # --------------------------------------------------------
    # NORMALIZATION PIPELINE
    # --------------------------------------------------------

    normalized_reports = normalize_reports(
        raw_reports
    )

    print(
        f"[NORMALIZED] count={len(normalized_reports)}"
    )

    # --------------------------------------------------------
    # MANIFOLD CLUSTERING
    # --------------------------------------------------------

    clusters = cluster_reports(
        normalized_reports
    )

    print(
        f"[CLUSTERS] generated={len(clusters)}"
    )

    # --------------------------------------------------------
    # BUILD CLUSTER OBJECTS
    # --------------------------------------------------------

    cluster_objects = build_cluster_objects(
        clusters
    )

    # --------------------------------------------------------
    # INTELLIGENCE LAYERS
    # --------------------------------------------------------

    cluster_intel = apply_cluster_intelligence(
        cluster_objects
    )

    events = build_events(
        cluster_intel
    )

    events = apply_event_memory(
        events
    )

    events = apply_hotspot_intelligence(
        events
    )

    events = apply_event_pattern_memory(
        events
    )

    events = score_events(
        events,
        cluster_intel
    )

    events = route_events(
        events,
        cluster_intel
    )

    print(
        f"[EVENTS] generated={len(events)}"
    )

    # --------------------------------------------------------
    # FINAL OUTPUT
    # --------------------------------------------------------

    return {

        "clusters":
            cluster_intel,

        "events":
            events
    }


# ============================================================
# TEST
# ============================================================

if __name__ == "__main__":

    result = run_cluster_engine()

    print(
        "\n=== MANIFOLD CLUSTER ENGINE + KOD ==="
    )

    print(
        json.dumps(
            result,
            indent=2
        )
    )