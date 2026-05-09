# ============================================================
# topology_models.py — KOD TOPOLOGY STATE MODELS (V1)
# ============================================================

from dataclasses import dataclass, field
from typing import List, Dict, Optional

from isees_uap.kod.topology.topology_types import (
    TopologyClusterType,
    ContradictionNodeType,
    ResidualVectorType,
    DomainLinkType,
    OverlapRegionType,
    TopologyStabilityState,
    AmbiguityState,
    EntanglementState,
)


# ============================================================
# OVERLAP REGION
# ============================================================

@dataclass
class OverlapRegion:

    region_type: OverlapRegionType
    shared_features: List[str] = field(default_factory=list)

    overlap_score: float = 0.0

    contributing_candidates: List[str] = field(default_factory=list)


# ============================================================
# CONTRADICTION NODE
# ============================================================

@dataclass
class ContradictionNode:

    node_type: ContradictionNodeType

    description: str = ""

    severity: float = 0.0

    affected_domains: List[str] = field(default_factory=list)

    propagated: bool = False


# ============================================================
# RESIDUAL VECTOR
# ============================================================

@dataclass
class ResidualVector:

    vector_type: ResidualVectorType

    unresolved_features: List[str] = field(default_factory=list)

    residual_strength: float = 0.0

    propagation_targets: List[str] = field(default_factory=list)


# ============================================================
# DOMAIN LINK
# ============================================================

@dataclass
class DomainLink:

    source_domain: str

    target_domain: str

    link_type: DomainLinkType

    dependency_strength: float = 0.0

    collapse_gain: float = 0.0


# ============================================================
# TOPOLOGY CLUSTER
# ============================================================

@dataclass
class TopologyCluster:

    cluster_id: str

    cluster_type: TopologyClusterType

    candidates: List[str] = field(default_factory=list)

    cluster_score: float = 0.0

    stability_state: TopologyStabilityState = (
        TopologyStabilityState.PARTIAL
    )


# ============================================================
# ENTANGLEMENT STATE
# ============================================================

@dataclass
class DomainEntanglement:

    domains: List[str] = field(default_factory=list)

    entanglement_state: EntanglementState = (
        EntanglementState.WEAK
    )

    entanglement_score: float = 0.0

    shared_residuals: List[str] = field(default_factory=list)


# ============================================================
# GENERALIZED TOPOLOGY STATE
# ============================================================

@dataclass
class TopologyState:

    # --------------------------------------------------------
    # CORE TOPOLOGY SCORES
    # --------------------------------------------------------

    overlap_score: float = 0.0

    contradiction_density: float = 0.0

    residual_instability: float = 0.0

    cluster_fragmentation: float = 0.0

    entanglement_score: float = 0.0

    ambiguity_score: float = 0.0

    # --------------------------------------------------------
    # STABILITY / AMBIGUITY
    # --------------------------------------------------------

    stability_state: TopologyStabilityState = (
        TopologyStabilityState.PARTIAL
    )

    ambiguity_state: AmbiguityState = (
        AmbiguityState.MODERATE
    )

    # --------------------------------------------------------
    # TOPOLOGICAL STRUCTURES
    # --------------------------------------------------------

    overlap_regions: List[OverlapRegion] = field(
        default_factory=list
    )

    contradiction_nodes: List[ContradictionNode] = field(
        default_factory=list
    )

    residual_vectors: List[ResidualVector] = field(
        default_factory=list
    )

    topology_clusters: List[TopologyCluster] = field(
        default_factory=list
    )

    domain_links: List[DomainLink] = field(
        default_factory=list
    )

    entanglements: List[DomainEntanglement] = field(
        default_factory=list
    )

    # --------------------------------------------------------
    # RAW SUPPORT DATA
    # --------------------------------------------------------

    metadata: Dict = field(default_factory=dict)

    notes: List[str] = field(default_factory=list)

    # --------------------------------------------------------
    # STATUS HELPERS
    # --------------------------------------------------------

    def is_stable(self) -> bool:

        return (
            self.stability_state
            == TopologyStabilityState.STABLE
        )

    def is_fragmented(self) -> bool:

        return (
            self.stability_state
            == TopologyStabilityState.FRAGMENTED
        )

    def is_high_ambiguity(self) -> bool:

        return self.ambiguity_state in [
            AmbiguityState.HIGH,
            AmbiguityState.SEVERE,
            AmbiguityState.EXTREME,
        ]