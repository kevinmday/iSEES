# ============================================================
# test_topology_v1.py — KOD V4 TOPOLOGY TEST HARNESS (V1)
# ============================================================

from pprint import pprint

from isees_uap.kod.topology.overlap import (
    analyze_candidate_overlap,
    compute_global_overlap_score,
)

from isees_uap.kod.topology.contradiction_density import (
    build_contradiction_node,
    build_contradiction_summary,
)

from isees_uap.kod.topology.residual_propagation import (
    build_residual_vector,
    build_residual_summary,
)

from isees_uap.kod.topology.collapse_clustering import (
    build_collapse_clusters,
    build_cluster_summary,
)

from isees_uap.kod.topology.domain_entanglement import (
    build_entanglement,
    build_entanglement_summary,
)

from isees_uap.kod.topology.ambiguity_index import (
    build_topology_state,
    build_topology_summary,
)

from isees_uap.kod.topology.topology_types import (
    OverlapRegionType,
    ContradictionNodeType,
    ResidualVectorType,
)


# ============================================================
# SYNTHETIC CANDIDATES
# ============================================================

SYNTHETIC_CANDIDATES = [

    {
        "candidate_id": "aviation_1",

        "domain": "aviation",

        "collapse_score": 0.78,

        "explained_features": [

            "trajectory continuity",

            "structured maneuvering",

            "altitude consistency",

            "speed profile",
        ],
    },

    {
        "candidate_id": "aviation_2",

        "domain": "aviation",

        "collapse_score": 0.72,

        "explained_features": [

            "trajectory continuity",

            "speed profile",

            "visual lighting",

            "banking behavior",
        ],
    },

    {
        "candidate_id": "weather_1",

        "domain": "weather",

        "collapse_score": 0.51,

        "explained_features": [

            "visual lighting",

            "light scatter",

            "temperature inversion",
        ],
    },

    {
        "candidate_id": "sensor_1",

        "domain": "sensor_artifact",

        "collapse_score": 0.43,

        "explained_features": [

            "radar inconsistency",

            "signal distortion",

            "visual lighting",
        ],
    },
]


# ============================================================
# SYNTHETIC CONTRADICTIONS
# ============================================================

SYNTHETIC_CONTRADICTIONS = [

    build_contradiction_node(

        node_type=
            ContradictionNodeType.SILENCE,

        description=
            "Observed silent maneuvering",

        affected_domains=[
            "aviation",
        ],
    ),

    build_contradiction_node(

        node_type=
            ContradictionNodeType.ACCELERATION,

        description=
            "Instant acceleration observed",

        affected_domains=[
            "aviation",
            "weather",
        ],
    ),

    build_contradiction_node(

        node_type=
            ContradictionNodeType.RADAR_INCONSISTENCY,

        description=
            "Intermittent radar return",

        affected_domains=[
            "sensor",
        ],
    ),
]


# ============================================================
# SYNTHETIC RESIDUALS
# ============================================================

SYNTHETIC_RESIDUALS = [

    build_residual_vector(

        vector_type=
            ResidualVectorType.MOTION,

        unresolved_features=[

            "instant acceleration",

            "trajectory discontinuity",
        ],

        residual_strength=0.82,

        propagation_targets=[

            "aviation",

            "weather",
        ],
    ),

    build_residual_vector(

        vector_type=
            ResidualVectorType.SENSOR,

        unresolved_features=[

            "radar instability",
        ],

        residual_strength=0.55,

        propagation_targets=[

            "sensor",
        ],
    ),
]


# ============================================================
# SYNTHETIC ENTANGLEMENTS
# ============================================================

SYNTHETIC_ENTANGLEMENTS = [

    build_entanglement(

        domain_a="aviation",

        domain_b="weather",

        shared_residuals=[

            "instant acceleration",
        ],
    ),

    build_entanglement(

        domain_a="aviation",

        domain_b="sensor",

        shared_residuals=[

            "radar inconsistency",
        ],
    ),
]


# ============================================================
# MAIN TEST
# ============================================================

def run_topology_test():

    print()
    print("=" * 60)
    print("KOD V4 — TOPOLOGY TEST HARNESS")
    print("=" * 60)

    # --------------------------------------------------------
    # OVERLAP
    # --------------------------------------------------------

    overlap_regions = analyze_candidate_overlap(

        candidates=SYNTHETIC_CANDIDATES,

        region_type=
            OverlapRegionType.UNKNOWN,
    )

    overlap_score = (
        compute_global_overlap_score(
            overlap_regions
        )
    )

    print()
    print("[OVERLAP]")
    print("-" * 60)

    pprint(overlap_score)

    # --------------------------------------------------------
    # CONTRADICTIONS
    # --------------------------------------------------------

    contradiction_summary = (
        build_contradiction_summary(
            SYNTHETIC_CONTRADICTIONS
        )
    )

    print()
    print("[CONTRADICTION DENSITY]")
    print("-" * 60)

    pprint(contradiction_summary)

    # --------------------------------------------------------
    # RESIDUALS
    # --------------------------------------------------------

    residual_summary = (
        build_residual_summary(
            SYNTHETIC_RESIDUALS
        )
    )

    print()
    print("[RESIDUAL PROPAGATION]")
    print("-" * 60)

    pprint(residual_summary)

    # --------------------------------------------------------
    # CLUSTERS
    # --------------------------------------------------------

    clusters = build_collapse_clusters(
        SYNTHETIC_CANDIDATES
    )

    cluster_summary = (
        build_cluster_summary(
            clusters
        )
    )

    print()
    print("[COLLAPSE CLUSTERS]")
    print("-" * 60)

    pprint(cluster_summary)

    # --------------------------------------------------------
    # ENTANGLEMENT
    # --------------------------------------------------------

    entanglement_summary = (
        build_entanglement_summary(
            SYNTHETIC_ENTANGLEMENTS
        )
    )

    print()
    print("[DOMAIN ENTANGLEMENT]")
    print("-" * 60)

    pprint(entanglement_summary)

    # --------------------------------------------------------
    # TOPOLOGY STATE
    # --------------------------------------------------------

    topology_state = build_topology_state(

        overlap_score=overlap_score,

        contradiction_density=
            contradiction_summary[
                "contradiction_density"
            ],

        residual_instability=
            residual_summary[
                "global_residual_instability"
            ],

        cluster_fragmentation=
            cluster_summary[
                "cluster_fragmentation"
            ],

        entanglement_score=
            entanglement_summary[
                "global_entanglement_score"
            ],
    )

    topology_summary = (
        build_topology_summary(
            topology_state
        )
    )

    print()
    print("[GENERALIZED TOPOLOGY STATE]")
    print("-" * 60)

    pprint(topology_summary)

    print()
    print("=" * 60)
    print("TOPOLOGY TEST COMPLETE")
    print("=" * 60)
    print()


# ============================================================
# ENTRYPOINT
# ============================================================

if __name__ == "__main__":

    run_topology_test()