# ============================================================
# candidate_fusion.py
# KOD — CANDIDATE FUSION ENGINE (V5)
# TOPOLOGY OBSERVABILITY ENABLED
# ============================================================

from dataclasses import dataclass, field
from typing import List, Optional, Dict, Any

from isees_uap.kod.models.candidate import (
    Candidate,
)

# ============================================================
# TOPOLOGY IMPORTS
# ============================================================

from isees_uap.kod.topology.overlap import (
    analyze_candidate_overlap,
    compute_global_overlap_score,
)

from isees_uap.kod.topology.collapse_clustering import (
    build_collapse_clusters,
    build_cluster_summary,
)

from isees_uap.kod.topology.residual_propagation import (
    build_residual_vector,
    build_residual_summary,
)

from isees_uap.kod.topology.domain_entanglement import (
    build_entanglement,
    build_entanglement_summary,
)

from isees_uap.kod.topology.contradiction_density import (
    build_contradiction_node,
    build_contradiction_summary,
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
# FUSION RESULT
# ============================================================

@dataclass
class FusionResult:
    """
    Final fused interpretation of all candidates.
    """

    dominant_candidate: Optional[
        Candidate
    ] = None

    ranked_candidates: List[
        Candidate
    ] = field(
        default_factory=list
    )

    ambiguity_score: float = 0.0

    residual_confidence: float = 0.0

    confidence_spread: float = 0.0

    unresolved: bool = True

    fusion_summary: str = ""

    topology_state: Optional[
        Dict[str, Any]
    ] = None

    metadata: Dict[str, Any] = field(
        default_factory=dict
    )

    # --------------------------------------------------------
    # TOPOLOGY OBSERVABILITY
    # --------------------------------------------------------

    topology_observability: Dict[
        str,
        Any
    ] = field(
        default_factory=dict
    )

    # ========================================================
    # SERIALIZATION
    # ========================================================

    def to_dict(self) -> Dict[str, Any]:

        return {

            "dominant_candidate":
                self.dominant_candidate.summary()
                if self.dominant_candidate
                else None,

            "ranked_candidates":
                [
                    c.summary()
                    for c in self.ranked_candidates
                ],

            "ambiguity_score":
                self.ambiguity_score,

            "residual_confidence":
                self.residual_confidence,

            "confidence_spread":
                self.confidence_spread,

            "unresolved":
                self.unresolved,

            "fusion_summary":
                self.fusion_summary,

            "topology_state":
                self.topology_state,

            "topology_observability":
                self.topology_observability,

            "metadata":
                self.metadata,
        }


# ============================================================
# COLLAPSE SCORING
# ============================================================

def calculate_collapse_score(
    candidate: Candidate,
) -> float:

    """
    Generalized manifold collapse score.
    """

    alignment = (
        candidate.match_scores
        .overall_alignment
    )

    completeness = (
        candidate.match_scores
        .explanatory_completeness
    )

    contradiction = (
        candidate.match_scores
        .contradiction_pressure
    )

    residual = (
        candidate.match_scores
        .residual_pressure
    )

    score = (
        (alignment * 0.40)
        +
        (completeness * 0.35)
        -
        (contradiction * 0.15)
        -
        (residual * 0.10)
    )

    score = max(
        0.0,
        min(1.0, score),
    )

    return round(score, 3)


# ============================================================
# HELPERS
# ============================================================

def calculate_confidence_spread(
    candidates: List[Candidate],
) -> float:

    if len(candidates) < 2:

        return 1.0

    top = (
        calculate_collapse_score(
            candidates[0]
        )
    )

    second = (
        calculate_collapse_score(
            candidates[1]
        )
    )

    spread = abs(top - second)

    return round(spread, 3)


def calculate_ambiguity_score(
    spread: float,
) -> float:

    ambiguity = 1.0 - spread

    ambiguity = max(
        0.0,
        min(1.0, ambiguity),
    )

    return round(ambiguity, 3)


def calculate_residual_confidence(
    dominant_candidate: Candidate,
) -> float:

    return round(
        dominant_candidate
        .match_scores
        .residual_pressure,
        3,
    )


# ============================================================
# TOPOLOGY BUILDERS
# ============================================================

def build_topology_candidates(
    candidates: List[Candidate],
) -> List[Dict]:

    topology_candidates = []

    for candidate in candidates:

        topology_candidates.append(
            candidate.to_topology_dict()
        )

    return topology_candidates


def build_topology_contradictions(
    candidates: List[Candidate],
):

    contradiction_nodes = []

    for candidate in candidates:

        for contradiction in (
            candidate.get_contradictions()
        ):

            contradiction_nodes.append(

                build_contradiction_node(

                    node_type=
                        ContradictionNodeType.UNKNOWN,

                    description=
                        contradiction,

                    affected_domains=[

                        candidate
                        .get_primary_domain()
                    ],
                )
            )

    return contradiction_nodes


def build_topology_residuals(
    candidates: List[Candidate],
):

    residual_vectors = []

    for candidate in candidates:

        unresolved = (
            candidate.get_unresolved_features()
        )

        if not unresolved:
            continue

        residual_vectors.append(

            build_residual_vector(

                vector_type=
                    ResidualVectorType.UNKNOWN,

                unresolved_features=
                    unresolved,

                residual_strength=(
                    candidate
                    .match_scores
                    .residual_pressure
                ),

                propagation_targets=[

                    candidate
                    .get_primary_domain()
                ],
            )
        )

    return residual_vectors


def build_topology_entanglements(
    candidates: List[Candidate],
):

    entanglements = []

    seen_pairs = set()

    for candidate_a in candidates:

        for candidate_b in candidates:

            if (
                candidate_a.candidate_id
                ==
                candidate_b.candidate_id
            ):
                continue

            domain_a = (
                candidate_a
                .get_primary_domain()
            )

            domain_b = (
                candidate_b
                .get_primary_domain()
            )

            if domain_a == domain_b:
                continue

            pair = tuple(
                sorted([
                    domain_a,
                    domain_b,
                ])
            )

            if pair in seen_pairs:
                continue

            seen_pairs.add(pair)

            shared = list(

                set(
                    candidate_a
                    .get_unresolved_features()
                ).intersection(

                    candidate_b
                    .get_unresolved_features()
                )
            )

            entanglements.append(

                build_entanglement(

                    domain_a=domain_a,

                    domain_b=domain_b,

                    shared_residuals=shared,
                )
            )

    return entanglements


# ============================================================
# MAIN FUSION ENGINE
# ============================================================

def fuse_candidates(
    candidates: List[Candidate],
) -> FusionResult:

    result = FusionResult()

    # --------------------------------------------------------
    # EMPTY CASE
    # --------------------------------------------------------

    if not candidates:

        result.unresolved = True

        result.fusion_summary = (
            "No reconstruction candidates "
            "available."
        )

        result.residual_confidence = 1.0

        return result

    # --------------------------------------------------------
    # SORT BY COLLAPSE SCORE
    # --------------------------------------------------------

    ranked = sorted(
        candidates,
        key=lambda c:
        calculate_collapse_score(c),
        reverse=True,
    )

    result.ranked_candidates = ranked

    # --------------------------------------------------------
    # DOMINANT CANDIDATE
    # --------------------------------------------------------

    dominant = ranked[0]

    result.dominant_candidate = dominant

    dominant_collapse = (
        calculate_collapse_score(
            dominant
        )
    )

    # --------------------------------------------------------
    # CONFIDENCE SPREAD
    # --------------------------------------------------------

    spread = calculate_confidence_spread(
        ranked
    )

    result.confidence_spread = spread

    # --------------------------------------------------------
    # LEGACY AMBIGUITY
    # --------------------------------------------------------

    ambiguity = calculate_ambiguity_score(
        spread
    )

    result.ambiguity_score = ambiguity

    # --------------------------------------------------------
    # RESIDUAL EMERGENCE
    # --------------------------------------------------------

    residual = (
        calculate_residual_confidence(
            dominant
        )
    )

    result.residual_confidence = residual

    # --------------------------------------------------------
    # TOPOLOGY INTEGRATION
    # --------------------------------------------------------

    topology_candidates = (
        build_topology_candidates(
            ranked
        )
    )

    overlap_regions = (
        analyze_candidate_overlap(
            topology_candidates,
            region_type=
                OverlapRegionType.UNKNOWN,
        )
    )

    overlap_score = (
        compute_global_overlap_score(
            overlap_regions
        )
    )

    contradiction_nodes = (
        build_topology_contradictions(
            ranked
        )
    )

    contradiction_summary = (
        build_contradiction_summary(
            contradiction_nodes
        )
    )

    residual_vectors = (
        build_topology_residuals(
            ranked
        )
    )

    residual_summary = (
        build_residual_summary(
            residual_vectors
        )
    )

    clusters = build_collapse_clusters(
        topology_candidates
    )

    cluster_summary = (
        build_cluster_summary(
            clusters
        )
    )

    entanglements = (
        build_topology_entanglements(
            ranked
        )
    )

    entanglement_summary = (
        build_entanglement_summary(
            entanglements
        )
    )

    topology_state = build_topology_state(

        overlap_score=
            overlap_score,

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

    result.topology_state = (
        build_topology_summary(
            topology_state
        )
    )

    # --------------------------------------------------------
    # TOPOLOGY OBSERVABILITY
    # --------------------------------------------------------

    result.topology_observability = {

        "topology_candidates":
            topology_candidates,

        "overlap_regions": [

            {
                "shared_features":
                    region.shared_features,

                "overlap_score":
                    region.overlap_score,

                "contributing_candidates":
                    region.contributing_candidates,
            }

            for region in overlap_regions
        ],

        "contradiction_nodes":
            contradiction_summary,

        "residual_vectors":
            residual_summary,

        "collapse_clusters":
            cluster_summary,

        "entanglements":
            entanglement_summary,
    }

    # --------------------------------------------------------
    # RESOLUTION STATE
    # --------------------------------------------------------

    if dominant_collapse >= 0.50:

        result.unresolved = False

    else:

        result.unresolved = True

    # --------------------------------------------------------
    # SUMMARY
    # --------------------------------------------------------

    topology_ambiguity = (
        result.topology_state[
            "ambiguity_state"
        ]
    )

    topology_stability = (
        result.topology_state[
            "stability_state"
        ]
    )

    if result.unresolved:

        result.fusion_summary = (
            f"No dominant deterministic "
            f"collapse fully resolved the "
            f"observation. "
            f"Top candidate: "
            f"{dominant.candidate_type} "
            f"(collapse score "
            f"{round(dominant_collapse, 3)}). "
            f"Topology state: "
            f"{topology_stability} / "
            f"{topology_ambiguity} ambiguity."
        )

    else:

        result.fusion_summary = (
            f"Dominant manifold collapse "
            f"resolved as "
            f"{dominant.candidate_type} "
            f"with collapse score "
            f"{round(dominant_collapse, 3)}. "
            f"Topology state: "
            f"{topology_stability} / "
            f"{topology_ambiguity} ambiguity."
        )

    # --------------------------------------------------------
    # METADATA
    # --------------------------------------------------------

    result.metadata = {

        "candidate_count":
            len(ranked),

        "dominant_candidate_id":
            dominant.candidate_id,

        "dominant_collapse_score":
            dominant_collapse,

        "topology_enabled":
            True,

        "topology_observability":
            True,

        "fusion_version":
            "V5_TOPOLOGY_OBSERVABILITY",
    }

    return result


# ============================================================
# TEST HARNESS
# ============================================================

if __name__ == "__main__":

    from pprint import pprint

    from isees_uap.kod.models.observation_context import (
        ObservationContext,
    )

    from isees_uap.kod.kaod.engines.aviation_engine import (
        reconstruct_aviation_candidates,
    )

    from isees_uap.kod.kaod.engines.weather_engine import (
        reconstruct_weather_candidates,
    )

    # --------------------------------------------------------
    # TEST OBSERVATION
    # --------------------------------------------------------

    observation = ObservationContext()

    observation.geo.latitude = 42.374
    observation.geo.longitude = -122.871

    observation.object_shape = (
        "bright_white_light"
    )

    observation.sound_description = (
        "silent"
    )

    observation.movement_description = (
        "instant vertical maneuvering"
    )

    observation.estimated_altitude_ft = (
        30000
    )

    observation.estimated_speed_kts = (
        420
    )

    # --------------------------------------------------------
    # GENERATE CANDIDATES
    # --------------------------------------------------------

    candidates = []

    candidates.extend(
        reconstruct_aviation_candidates(
            observation
        )
    )

    candidates.extend(
        reconstruct_weather_candidates(
            observation
        )
    )

    # --------------------------------------------------------
    # RUN FUSION
    # --------------------------------------------------------

    fusion = fuse_candidates(
        candidates
    )

    # --------------------------------------------------------
    # OUTPUT
    # --------------------------------------------------------

    print()
    print("================================================")
    print("KOD CANDIDATE FUSION V5")
    print("================================================")
    print()

    pprint(fusion.to_dict())

    print()