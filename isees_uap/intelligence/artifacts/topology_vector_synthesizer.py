# ============================================================
# topology_vector_synthesizer.py
# iSEES-UAP — TOPOLOGY RESPONSIVE VECTOR SYNTHESIS
# ============================================================

"""
Synthesizes retrieval vectors directly from
topology instability and cognition pressure.

This subsystem converts:
- contradiction density
- ambiguity pressure
- residual emergence
- ontology instability
- observability asymmetry

into:

deterministic artifact retrieval vectors.

IMPORTANT:
This subsystem does NOT:
- determine truth
- mutate topology authority
- rewrite event lineage

It ONLY generates:
retrieval pressure vectors
for artifact manifold traversal.
"""

from __future__ import annotations

from dataclasses import dataclass, field
from datetime import UTC, datetime
from enum import Enum
from typing import Dict, List, Optional
from uuid import uuid4

from isees_uap.intelligence.artifacts.artifact_types import (
    ArtifactDomain,
    RetrievalMode,
    SemanticClass,
)
from isees_uap.intelligence.artifacts.retrieval_vectors import (
    RetrievalPriority,
    RetrievalVector,
    RetrievalVectorOrigin,
    TopologyPressure,
)


# ============================================================
# SYNTHESIS DOMAIN
# ============================================================

class SynthesisDomain(str, Enum):

    CONTRADICTION = "CONTRADICTION"

    AMBIGUITY = "AMBIGUITY"

    RESIDUAL = "RESIDUAL"

    OBSERVABILITY = "OBSERVABILITY"

    ONTOLOGY = "ONTOLOGY"

    ENTANGLEMENT = "ENTANGLEMENT"

    REPLAY = "REPLAY"

    CONTEXTUAL = "CONTEXTUAL"


# ============================================================
# SYNTHESIS CONFIG
# ============================================================

@dataclass
class VectorSynthesisConfig:

    contradiction_threshold: float = 0.35

    ambiguity_threshold: float = 0.40

    residual_threshold: float = 0.30

    observability_threshold: float = 0.45

    ontology_threshold: float = 0.35

    max_vectors_per_cycle: int = 10

    replay_vector_generation: bool = True

    cross_temporal_enabled: bool = True


# ============================================================
# TOPOLOGY INPUT
# ============================================================

@dataclass(frozen=True)
class TopologyInput:

    ambiguity_score: float = 0.0

    contradiction_density: float = 0.0

    residual_score: float = 0.0

    observability_score: float = 0.0

    ontology_instability: float = 0.0

    entanglement_score: float = 0.0

    event_id: Optional[str] = None

    cluster_id: Optional[str] = None

    replay_context: bool = False

    active_domains: List[str] = field(
        default_factory=list
    )


# ============================================================
# SYNTHESIS RESULT
# ============================================================

@dataclass
class VectorSynthesisResult:

    success: bool

    vectors: List[RetrievalVector] = field(
        default_factory=list
    )

    synthesis_domains: List[
        SynthesisDomain
    ] = field(default_factory=list)

    generated_at: datetime = field(
        default_factory=lambda: datetime.now(UTC)
    )

    errors: List[str] = field(
        default_factory=list
    )


# ============================================================
# TOPOLOGY VECTOR SYNTHESIZER
# ============================================================

class TopologyVectorSynthesizer:

    """
    Converts topology pressure
    into retrieval vectors.

    This is the bridge between:
    cognition instability
    and
    artifact manifold traversal.
    """

    def __init__(
        self,
        config: Optional[
            VectorSynthesisConfig
        ] = None
    ) -> None:

        self.config = (
            config
            if config is not None
            else VectorSynthesisConfig()
        )

    # ========================================================
    # SYNTHESIZE
    # ========================================================

    def synthesize(
        self,
        topology: TopologyInput
    ) -> VectorSynthesisResult:

        result = VectorSynthesisResult(
            success=True
        )

        vectors: List[RetrievalVector] = []

        # ----------------------------------------------------
        # CONTRADICTION PRESSURE
        # ----------------------------------------------------

        if (
            topology.contradiction_density
            >= self.config
            .contradiction_threshold
        ):

            result.synthesis_domains.append(
                SynthesisDomain.CONTRADICTION
            )

            vectors.extend(

                self._contradiction_vectors(
                    topology
                )
            )

        # ----------------------------------------------------
        # AMBIGUITY PRESSURE
        # ----------------------------------------------------

        if (
            topology.ambiguity_score
            >= self.config
            .ambiguity_threshold
        ):

            result.synthesis_domains.append(
                SynthesisDomain.AMBIGUITY
            )

            vectors.extend(

                self._ambiguity_vectors(
                    topology
                )
            )

        # ----------------------------------------------------
        # RESIDUAL PRESSURE
        # ----------------------------------------------------

        if (
            topology.residual_score
            >= self.config
            .residual_threshold
        ):

            result.synthesis_domains.append(
                SynthesisDomain.RESIDUAL
            )

            vectors.extend(

                self._residual_vectors(
                    topology
                )
            )

        # ----------------------------------------------------
        # OBSERVABILITY PRESSURE
        # ----------------------------------------------------

        if (
            topology.observability_score
            >= self.config
            .observability_threshold
        ):

            result.synthesis_domains.append(
                SynthesisDomain.OBSERVABILITY
            )

            vectors.extend(

                self._observability_vectors(
                    topology
                )
            )

        # ----------------------------------------------------
        # ONTOLOGY INSTABILITY
        # ----------------------------------------------------

        if (
            topology.ontology_instability
            >= self.config
            .ontology_threshold
        ):

            result.synthesis_domains.append(
                SynthesisDomain.ONTOLOGY
            )

            vectors.extend(

                self._ontology_vectors(
                    topology
                )
            )

        # ----------------------------------------------------
        # LIMIT
        # ----------------------------------------------------

        result.vectors = vectors[
            : self.config.max_vectors_per_cycle
        ]

        return result

    # ========================================================
    # CONTRADICTION VECTORS
    # ========================================================

    def _contradiction_vectors(
        self,
        topology: TopologyInput
    ) -> List[RetrievalVector]:

        phrases = [

            "FAA radar anomaly reports",

            "sensor contradiction aviation event",

            "ADS-B absence witness convergence",

            "military radar ambiguity incident",
        ]

        return [

            self._build_vector(

                phrase=phrase,

                topology=topology,

                priority=(
                    RetrievalPriority.HIGH
                ),

                semantic_classes=[

                    SemanticClass
                    .SENSOR,

                    SemanticClass
                    .CONTEXTUAL,
                ],
            )

            for phrase in phrases
        ]

    # ========================================================
    # AMBIGUITY VECTORS
    # ========================================================

    def _ambiguity_vectors(
        self,
        topology: TopologyInput
    ) -> List[RetrievalVector]:

        phrases = [

            "historical aerial ambiguity",

            "cross-era anomalous emergence",

            "structured unknown object reports",

            "high ambiguity witness cluster",
        ]

        return [

            self._build_vector(

                phrase=phrase,

                topology=topology,

                priority=(
                    RetrievalPriority.MEDIUM
                ),

                semantic_classes=[

                    SemanticClass
                    .HISTORICAL,

                    SemanticClass
                    .CONTEXTUAL,
                ],
            )

            for phrase in phrases
        ]

    # ========================================================
    # RESIDUAL VECTORS
    # ========================================================

    def _residual_vectors(
        self,
        topology: TopologyInput
    ) -> List[RetrievalVector]:

        phrases = [

            "persistent unresolved aerial case",

            "historical unresolved emergence",

            "high residual topology event",

            "cross-temporal emergence resonance",
        ]

        return [

            self._build_vector(

                phrase=phrase,

                topology=topology,

                priority=(
                    RetrievalPriority.CRITICAL
                ),

                semantic_classes=[

                    SemanticClass
                    .HISTORICAL,

                    SemanticClass
                    .BEHAVIORAL,
                ],
            )

            for phrase in phrases
        ]

    # ========================================================
    # OBSERVABILITY VECTORS
    # ========================================================

    def _observability_vectors(
        self,
        topology: TopologyInput
    ) -> List[RetrievalVector]:

        phrases = [

            "weather suppression conditions",

            "low observability aerial event",

            "terrain masking radar limitations",

            "visual confirmation without sensor lock",
        ]

        return [

            self._build_vector(

                phrase=phrase,

                topology=topology,

                priority=(
                    RetrievalPriority.HIGH
                ),

                semantic_classes=[

                    SemanticClass
                    .ENVIRONMENTAL,

                    SemanticClass
                    .SENSOR,
                ],
            )

            for phrase in phrases
        ]

    # ========================================================
    # ONTOLOGY VECTORS
    # ========================================================

    def _ontology_vectors(
        self,
        topology: TopologyInput
    ) -> List[RetrievalVector]:

        phrases = [

            "cross-cultural aerial archetype",

            "nonstandard emergence morphology",

            "historical structured sky object",

            "semantic mismatch aerial report",
        ]

        return [

            self._build_vector(

                phrase=phrase,

                topology=topology,

                priority=(
                    RetrievalPriority.MEDIUM
                ),

                semantic_classes=[

                    SemanticClass
                    .ONTOLOGICAL,

                    SemanticClass
                    .HISTORICAL,
                ],
            )

            for phrase in phrases
        ]

    # ========================================================
    # BUILD VECTOR
    # ========================================================

    def _build_vector(
        self,
        phrase: str,
        topology: TopologyInput,
        priority: RetrievalPriority,
        semantic_classes: List[
            SemanticClass
        ],
    ) -> RetrievalVector:

        pressure = TopologyPressure(

            ambiguity_pressure=(
                topology.ambiguity_score
            ),

            contradiction_pressure=(
                topology
                .contradiction_density
            ),

            residual_pressure=(
                topology.residual_score
            ),

            topology_weight=(
                (
                    topology.ambiguity_score
                    +
                    topology
                    .contradiction_density
                    +
                    topology.residual_score
                ) / 3
            ),
        )

        return RetrievalVector(

            vector_id=str(uuid4()),

            vector_phrase=phrase,

            origin=(
                RetrievalVectorOrigin
                .TOPOLOGY
            ),

            retrieval_mode=(
                RetrievalMode
                .VECTOR_RETRIEVAL
            ),

            priority=priority,

            event_id=topology.event_id,

            cluster_id=topology.cluster_id,

            target_domains=[

                ArtifactDomain
                .NOTEBOOKLM
            ],

            semantic_classes=semantic_classes,

            contextual_domains=(
                topology.active_domains
            ),

            topology_pressure=pressure,

            vector_weight=(
                pressure.topology_weight
            ),

            replay_generated=(
                topology.replay_context
            ),

            metadata={

                "synthesized_by":
                    "TopologyVectorSynthesizer",

                "cross_temporal":
                    str(
                        self.config
                        .cross_temporal_enabled
                    ),
            },
        )


# ============================================================
# GLOBAL SYNTHESIZER
# ============================================================

topology_vector_synthesizer = (
    TopologyVectorSynthesizer()
)


# ============================================================
# EXPORTS
# ============================================================

__all__ = [

    "SynthesisDomain",

    "VectorSynthesisConfig",

    "TopologyInput",

    "VectorSynthesisResult",

    "TopologyVectorSynthesizer",

    "topology_vector_synthesizer",
]