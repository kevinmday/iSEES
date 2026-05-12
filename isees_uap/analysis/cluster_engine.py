# ============================================================
# cluster_engine.py
# MANIFOLD CLUSTER ENGINE + OBSERVABILITY MANIFOLD INTEGRATION
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
# OBSERVABILITY
# ------------------------------------------------------------

from isees_uap.observability.observability_models import (
    ObservabilityContext
)

from isees_uap.observability.observability_engine import (
    resolve_observability,
    compute_normalized_emergence,
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
# OBSERVABILITY ATTACHMENT
# ============================================================

def attach_observability(
    observation: Dict
) -> Dict:

    try:

        geo = observation.get(
            "normalized_geo",
            {}
        )

        lat = geo.get(
            "resolved_lat"
        )

        lon = geo.get(
            "resolved_lon"
        )

        if (
            lat is None
            or
            lon is None
        ):

            return observation

        timestamp_utc = observation.get(
            "timestamp_utc"
        )

        context = ObservabilityContext(

            latitude=lat,

            longitude=lon,

            timestamp_utc=
                timestamp_utc
        )

        field = resolve_observability(
            context
        )

        emergence = (
            compute_normalized_emergence(

                report_density=1.0,

                context=context
            )
        )

        normalization = emergence.get(
            "normalization",
            {}
        )

        observation[
            "observability"
        ] = {

            "field_id":
                field.field_id,

            "snapshot":
                field.summary(),

            "normalized_emergence":
                normalization.get(
                    "normalized_emergence",
                    0.0
                ),

            "observability_score":
                field.observability_score,

            "observer_probability":
                field.observer_probability,

            "confidence":
                field.confidence
        }

        return observation

    except Exception as e:

        print(
            f"[OBSERVABILITY_ATTACH_ERROR] {e}"
        )

        return observation


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

            # ------------------------------------------------
            # ATTACH OBSERVABILITY
            # ------------------------------------------------

            normalized_observation = (
                attach_observability(
                    normalized_observation
                )
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

        # ----------------------------------------------------
        # OBSERVABILITY
        # ----------------------------------------------------

        observability_scores = []

        observer_probabilities = []

        normalized_emergence_values = []

        observability_confidence = []

        observability_field_ids = []

        # ----------------------------------------------------
        # TOPOLOGY AGGREGATION
        # ----------------------------------------------------

        topology_stability = []

        topology_ambiguity = []

        topology_contradiction_density = []

        topology_residual_instability = []

        topology_entanglement = []

        topology_fragmentation = []

        # ----------------------------------------------------
        # PROVENANCE AGGREGATION
        # ----------------------------------------------------

        trust_domains = set()

        observer_ids = set()

        synthetic_present = False

        replay_present = False

        fixture_present = False

        environments = set()

        observer_modes = set()

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
            # OBSERVABILITY EXTRACTION
            # ------------------------------------------------

            observability = observation.get(
                "observability",
                {}
            )

            obs_score = observability.get(
                "observability_score"
            )

            obs_probability = observability.get(
                "observer_probability"
            )

            obs_emergence = observability.get(
                "normalized_emergence"
            )

            obs_confidence = observability.get(
                "confidence"
            )

            field_id = observability.get(
                "field_id"
            )

            if obs_score is not None:
                observability_scores.append(
                    obs_score
                )

            if obs_probability is not None:
                observer_probabilities.append(
                    obs_probability
                )

            if obs_emergence is not None:
                normalized_emergence_values.append(
                    obs_emergence
                )

            if obs_confidence is not None:
                observability_confidence.append(
                    obs_confidence
                )

            if field_id:
                observability_field_ids.append(
                    field_id
                )

            # ------------------------------------------------
            # PROVENANCE EXTRACTION
            # ------------------------------------------------

            provenance = observation.get(
                "provenance",
                {}
            )

            trust_domain = provenance.get(
                "trust_domain"
            )

            observer_id = provenance.get(
                "observer_id"
            )

            environment_name = provenance.get(
                "environment"
            )

            observer_mode = provenance.get(
                "observer_mode"
            )

            if trust_domain:
                trust_domains.add(
                    trust_domain
                )

            if observer_id:
                observer_ids.add(
                    observer_id
                )

            if environment_name:
                environments.add(
                    environment_name
                )

            if observer_mode:
                observer_modes.add(
                    observer_mode
                )

            if provenance.get(
                "synthetic",
                False
            ):
                synthetic_present = True

            if provenance.get(
                "replay",
                False
            ):
                replay_present = True

            if provenance.get(
                "fixture",
                False
            ):
                fixture_present = True

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

            # ------------------------------------------------
            # TOPOLOGY EXTRACTION
            # ------------------------------------------------

            fusion = pipeline.get(
                "fusion",
                {}
            )

            topology = fusion.get(
                "topology_state",
                {}
            )

            # ------------------------------------------------
            # RESIDUALS
            # ------------------------------------------------

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

            # ------------------------------------------------
            # TOPOLOGY STATE
            # ------------------------------------------------

            topology_stability.append(

                topology.get(
                    "stability",
                    0.0
                )
            )

            topology_ambiguity.append(

                topology.get(
                    "ambiguity",
                    0.0
                )
            )

            topology_contradiction_density.append(

                topology.get(
                    "contradiction_density",
                    0.0
                )
            )

            topology_residual_instability.append(

                topology.get(
                    "residual_instability",
                    0.0
                )
            )

            topology_entanglement.append(

                topology.get(
                    "entanglement",
                    0.0
                )
            )

            topology_fragmentation.append(

                topology.get(
                    "fragmentation",
                    0.0
                )
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
        # OBSERVABILITY METRICS
        # ----------------------------------------------------

        avg_observability = round(

            sum(observability_scores)
            / len(observability_scores),

            3

        ) if observability_scores else 0.0

        avg_observer_probability = round(

            sum(observer_probabilities)
            / len(observer_probabilities),

            3

        ) if observer_probabilities else 0.0

        avg_normalized_emergence = round(

            sum(normalized_emergence_values)
            / len(normalized_emergence_values),

            3

        ) if normalized_emergence_values else 0.0

        avg_observability_confidence = round(

            sum(observability_confidence)
            / len(observability_confidence),

            3

        ) if observability_confidence else 0.0

        # ----------------------------------------------------
        # TOPOLOGY METRICS
        # ----------------------------------------------------

        avg_stability = round(

            sum(topology_stability)
            / len(topology_stability),

            3

        ) if topology_stability else 0.0

        avg_ambiguity = round(

            sum(topology_ambiguity)
            / len(topology_ambiguity),

            3

        ) if topology_ambiguity else 0.0

        avg_contradiction_density = round(

            sum(topology_contradiction_density)
            / len(topology_contradiction_density),

            3

        ) if topology_contradiction_density else 0.0

        avg_residual_instability = round(

            sum(topology_residual_instability)
            / len(topology_residual_instability),

            3

        ) if topology_residual_instability else 0.0

        avg_entanglement = round(

            sum(topology_entanglement)
            / len(topology_entanglement),

            3

        ) if topology_entanglement else 0.0

        avg_fragmentation = round(

            sum(topology_fragmentation)
            / len(topology_fragmentation),

            3

        ) if topology_fragmentation else 0.0

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
        # PROVENANCE SUMMARY
        # ----------------------------------------------------

        provenance_summary = {

            "trust_domains":
                sorted(
                    list(trust_domains)
                ),

            "observer_ids":
                sorted(
                    list(observer_ids)
                ),

            "environments":
                sorted(
                    list(environments)
                ),

            "observer_modes":
                sorted(
                    list(observer_modes)
                ),

            "mixed_domain_cluster":
                len(trust_domains) > 1,

            "synthetic_present":
                synthetic_present,

            "fixture_present":
                fixture_present,

            "replay_present":
                replay_present
        }

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
            # OBSERVABILITY
            # ------------------------------------------------

            "observability": {

                "avg_observability_score":
                    avg_observability,

                "avg_observer_probability":
                    avg_observer_probability,

                "avg_normalized_emergence":
                    avg_normalized_emergence,

                "avg_observability_confidence":
                    avg_observability_confidence,

                "field_ids":
                    sorted(
                        list(
                            set(
                                observability_field_ids
                            )
                        )
                    ),

                "observability_attached":
                    len(
                        observability_field_ids
                    ) > 0,
            },

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

            # ------------------------------------------------
            # KOD TOPOLOGY
            # ------------------------------------------------

            "kod_topology": {

                "avg_stability":
                    avg_stability,

                "avg_ambiguity":
                    avg_ambiguity,

                "avg_contradiction_density":
                    avg_contradiction_density,

                "avg_residual_instability":
                    avg_residual_instability,

                "avg_entanglement":
                    avg_entanglement,

                "avg_fragmentation":
                    avg_fragmentation
            },

            # ------------------------------------------------
            # PROVENANCE VISIBILITY
            # ------------------------------------------------

            "provenance_summary":
                provenance_summary,

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
            # PRESERVE OBSERVABILITY
            # ------------------------------------------------

            intel["observability"] = (
                cluster.get(
                    "observability",
                    {}
                )
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

            # ------------------------------------------------
            # PRESERVE KOD TOPOLOGY
            # ------------------------------------------------

            intel["kod_topology"] = (
                cluster.get(
                    "kod_topology",
                    {}
                )
            )

            # ------------------------------------------------
            # PRESERVE PROVENANCE
            # ------------------------------------------------

            intel["provenance_summary"] = (
                cluster.get(
                    "provenance_summary",
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
        "\n=== MANIFOLD CLUSTER ENGINE + OBSERVABILITY ==="
    )

    print(
        json.dumps(
            result,
            indent=2
        )
    )