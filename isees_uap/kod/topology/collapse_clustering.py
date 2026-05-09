# ============================================================
# collapse_clustering.py — COLLAPSE CLUSTERING ENGINE (V1)
# ============================================================

from typing import List, Dict

from isees_uap.kod.topology.topology_models import (
    TopologyCluster,
)

from isees_uap.kod.topology.topology_types import (
    TopologyClusterType,
    TopologyStabilityState,
)


# ============================================================
# CLUSTER TYPE RESOLUTION
# ============================================================

def resolve_cluster_type(
    domain: str,
) -> TopologyClusterType:

    normalized = str(domain).strip().lower()

    if normalized == "aviation":
        return TopologyClusterType.AVIATION

    if normalized == "weather":
        return TopologyClusterType.WEATHER

    if normalized == "sensor_artifact":
        return TopologyClusterType.SENSOR_ARTIFACT

    if normalized == "astronomical":
        return TopologyClusterType.ASTRONOMICAL

    return TopologyClusterType.UNKNOWN


# ============================================================
# CLUSTER STABILITY
# ============================================================

def resolve_cluster_stability(
    cluster_score: float,
) -> TopologyStabilityState:

    if cluster_score >= 0.85:
        return TopologyStabilityState.STABLE

    if cluster_score >= 0.65:
        return TopologyStabilityState.PARTIAL

    if cluster_score >= 0.40:
        return TopologyStabilityState.FRAGMENTED

    if cluster_score >= 0.20:
        return TopologyStabilityState.UNSTABLE

    return TopologyStabilityState.COLLAPSING


# ============================================================
# BUILD CLUSTER
# ============================================================

def build_cluster(
    cluster_id: str,
    domain: str,
    candidates: List[Dict],
) -> TopologyCluster:

    scores = []

    candidate_ids = []

    for candidate in candidates:

        candidate_ids.append(
            candidate.get(
                "candidate_id",
                "unknown",
            )
        )

        scores.append(
            float(
                candidate.get(
                    "collapse_score",
                    0.0,
                )
            )
        )

    if scores:

        cluster_score = round(
            sum(scores) / len(scores),
            4,
        )

    else:

        cluster_score = 0.0

    stability = resolve_cluster_stability(
        cluster_score
    )

    return TopologyCluster(

        cluster_id=cluster_id,

        cluster_type=resolve_cluster_type(
            domain
        ),

        candidates=candidate_ids,

        cluster_score=cluster_score,

        stability_state=stability,
    )


# ============================================================
# GROUP CANDIDATES BY DOMAIN
# ============================================================

def group_candidates_by_domain(
    candidates: List[Dict],
) -> Dict[str, List[Dict]]:

    grouped = {}

    for candidate in candidates:

        domain = candidate.get(
            "domain",
            "unknown",
        )

        if domain not in grouped:

            grouped[domain] = []

        grouped[domain].append(candidate)

    return grouped


# ============================================================
# BUILD COLLAPSE CLUSTERS
# ============================================================

def build_collapse_clusters(
    candidates: List[Dict],
) -> List[TopologyCluster]:

    clusters = []

    grouped = group_candidates_by_domain(
        candidates
    )

    cluster_index = 1

    for domain, domain_candidates in grouped.items():

        cluster = build_cluster(

            cluster_id=f"cluster_{cluster_index}",

            domain=domain,

            candidates=domain_candidates,
        )

        clusters.append(cluster)

        cluster_index += 1

    return clusters


# ============================================================
# CLUSTER FRAGMENTATION SCORE
# ============================================================

def compute_cluster_fragmentation(
    clusters: List[TopologyCluster],
) -> float:

    if not clusters:
        return 1.0

    unstable_count = 0

    for cluster in clusters:

        if cluster.stability_state in [

            TopologyStabilityState.FRAGMENTED,

            TopologyStabilityState.UNSTABLE,

            TopologyStabilityState.COLLAPSING,
        ]:

            unstable_count += 1

    fragmentation = (
        unstable_count / len(clusters)
    )

    return round(fragmentation, 4)


# ============================================================
# CLUSTER SUMMARY
# ============================================================

def build_cluster_summary(
    clusters: List[TopologyCluster],
) -> Dict:

    fragmentation = (
        compute_cluster_fragmentation(
            clusters
        )
    )

    return {

        "cluster_count":
            len(clusters),

        "cluster_fragmentation":
            fragmentation,

        "cluster_types": [

            cluster.cluster_type.value

            for cluster in clusters
        ],

        "cluster_scores": {

            cluster.cluster_id:
                cluster.cluster_score

            for cluster in clusters
        },
    }