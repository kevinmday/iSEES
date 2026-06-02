# ============================================================
# artifact_orchestrator.py
# iSEES-UAP — ARTIFACT MANIFOLD ORCHESTRATION ENGINE
# ============================================================

"""
Artifact-space orchestration engine.

This subsystem coordinates:
- retrieval vector routing
- adapter selection
- runtime cognition attachment
- provenance enforcement
- replay-safe retrieval
- artifact manifold traversal

IMPORTANT:
This layer does NOT determine truth.

The orchestrator governs:
artifact-space augmentation only.

This engine exists BETWEEN:
cognition manifold
and
artifact manifold.
"""

from __future__ import annotations

from dataclasses import dataclass, field
from datetime import UTC, datetime
from enum import Enum
from typing import Dict, List, Optional

from isees_uap.intelligence.adapters.notebooklm_adapter import (
    NotebookLMAdapter,
    NotebookLMResult,
    notebooklm_adapter,
)
from isees_uap.intelligence.artifacts.artifact_contracts import (
    ArtifactReference,
)
from isees_uap.intelligence.artifacts.artifact_registry import (
    artifact_registry,
)
from isees_uap.intelligence.artifacts.artifact_types import (
    ArtifactDomain,
)
from isees_uap.intelligence.artifacts.retrieval_vectors import (
    RetrievalPriority,
    RetrievalVector,
)


# ============================================================
# ORCHESTRATION STATE
# ============================================================

class OrchestrationState(str, Enum):

    IDLE = "IDLE"

    ROUTING = "ROUTING"

    RETRIEVING = "RETRIEVING"

    ATTACHING = "ATTACHING"

    COMPLETE = "COMPLETE"

    FAILED = "FAILED"


# ============================================================
# ADAPTER ROUTE
# ============================================================

@dataclass(frozen=True)
class AdapterRoute:

    adapter_name: str

    target_domain: ArtifactDomain

    priority_weight: float = 1.0

    enabled: bool = True


# ============================================================
# ORCHESTRATION RESULT
# ============================================================

@dataclass
class OrchestrationResult:

    success: bool

    state: OrchestrationState

    vectors_processed: int = 0

    artifacts_retrieved: int = 0

    adapters_used: List[str] = field(
        default_factory=list
    )

    attached_artifacts: List[
        ArtifactReference
    ] = field(default_factory=list)

    errors: List[str] = field(
        default_factory=list
    )

    generated_at: datetime = field(
        default_factory=lambda: datetime.now(UTC)
    )


# ============================================================
# ARTIFACT ORCHESTRATOR
# ============================================================

class ArtifactOrchestrator:

    """
    Canonical artifact manifold orchestration engine.

    Responsibilities:
    - vector routing
    - adapter coordination
    - provenance-safe retrieval
    - runtime cognition attachment
    - bounded artifact traversal

    Does NOT:
    - mutate topology truth
    - mutate event truth
    - mutate immutable lineage
    """

    def __init__(self) -> None:

        self.routes: Dict[
            ArtifactDomain,
            AdapterRoute
        ] = {

            ArtifactDomain.NOTEBOOKLM:

                AdapterRoute(

                    adapter_name="NotebookLMAdapter",

                    target_domain=(
                        ArtifactDomain
                        .NOTEBOOKLM
                    ),

                    priority_weight=1.0,
                )
        }

        self.notebooklm_adapter = (
            notebooklm_adapter
        )

    # ========================================================
    # ORCHESTRATE
    # ========================================================

    def orchestrate(
        self,
        vectors: List[RetrievalVector]
    ) -> OrchestrationResult:

        """
        Orchestrate artifact retrieval.

        CURRENT STATE:
        NotebookLM scaffold routing only.
        """

        result = OrchestrationResult(

            success=True,

            state=(
                OrchestrationState.ROUTING
            ),
        )

        for vector in vectors:

            try:

                adapter_results = (
                    self._route_vector(vector)
                )

                for adapter_result in (
                    adapter_results
                ):

                    result.artifacts_retrieved += (
                        len(
                            adapter_result
                            .artifacts
                        )
                    )

                    result.attached_artifacts.extend(
                        adapter_result.artifacts
                    )

                result.vectors_processed += 1

            except Exception as ex:

                result.success = False

                result.errors.append(str(ex))

        result.adapters_used = (
            self._collect_adapter_names()
        )

        result.state = (
            OrchestrationState.COMPLETE
        )

        return result

    # ========================================================
    # ROUTE VECTOR
    # ========================================================

    def _route_vector(
        self,
        vector: RetrievalVector
    ) -> List[NotebookLMResult]:

        """
        Route retrieval vector
        into artifact-space domains.
        """

        results = []

        domains = (
            vector.target_domains
            if vector.target_domains
            else [ArtifactDomain.NOTEBOOKLM]
        )

        for domain in domains:

            if domain == (
                ArtifactDomain.NOTEBOOKLM
            ):

                notebook_result = (
                    self.notebooklm_adapter
                    .retrieve(vector)
                )

                results.append(
                    notebook_result
                )

        return results

    # ========================================================
    # PRIORITIZE
    # ========================================================

    def prioritize_vectors(
        self,
        vectors: List[RetrievalVector]
    ) -> List[RetrievalVector]:

        """
        Prioritize vectors by:
        - priority class
        - topology pressure
        - vector weight
        """

        priority_order = {

            RetrievalPriority.CRITICAL: 5,

            RetrievalPriority.HIGH: 4,

            RetrievalPriority.MEDIUM: 3,

            RetrievalPriority.LOW: 2,

            RetrievalPriority.BACKGROUND: 1,
        }

        return sorted(

            vectors,

            key=lambda v: (

                priority_order.get(
                    v.priority,
                    0
                ),

                v.topology_pressure
                .topology_weight,

                v.vector_weight,
            ),

            reverse=True,
        )

    # ========================================================
    # ACTIVE REGISTRY STATE
    # ========================================================

    def registry_state(
        self
    ) -> dict:

        """
        Expose runtime artifact registry state.
        """

        return artifact_registry.snapshot()

    # ========================================================
    # ADAPTER HEALTH
    # ========================================================

    def adapter_health(
        self
    ) -> dict:

        """
        Adapter health aggregation.
        """

        return {

            "NotebookLMAdapter":
                self.notebooklm_adapter
                .health()
        }

    # ========================================================
    # COLLECT ADAPTERS
    # ========================================================

    def _collect_adapter_names(
        self
    ) -> List[str]:

        names = []

        for route in self.routes.values():

            names.append(
                route.adapter_name
            )

        return sorted(
            list(set(names))
        )


# ============================================================
# GLOBAL ORCHESTRATOR
# ============================================================

artifact_orchestrator = (
    ArtifactOrchestrator()
)


# ============================================================
# EXPORTS
# ============================================================

__all__ = [

    "OrchestrationState",

    "AdapterRoute",

    "OrchestrationResult",

    "ArtifactOrchestrator",

    "artifact_orchestrator",
]