# ============================================================
# artifact_registry.py
# iSEES-UAP — RUNTIME ARTIFACT REGISTRY
# ============================================================

"""
Runtime artifact registry.

Responsibilities:
- maintain active artifact surfaces
- deduplicate imported artifacts
- attach artifacts to runtime cognition
- maintain retrieval lineage
- maintain notebook references
- expose bounded artifact-space state

IMPORTANT:
This registry does NOT determine truth.

This layer only manages:
runtime cognition attachment surfaces.
"""

from __future__ import annotations

from dataclasses import dataclass, field
from datetime import UTC, datetime
from typing import Dict, List, Optional

from isees_uap.intelligence.artifacts.artifact_contracts import (
    ArtifactCollection,
    ArtifactReference,
)


# ============================================================
# REGISTRY METRICS
# ============================================================

@dataclass
class ArtifactRegistryMetrics:

    total_artifacts: int = 0

    runtime_attached: int = 0

    replay_visible: int = 0

    operator_visible: int = 0

    notebook_refs: int = 0

    active_vectors: int = 0

    duplicate_rejections: int = 0

    last_updated: datetime = field(
        default_factory=lambda: datetime.now(UTC)
    )


# ============================================================
# ARTIFACT REGISTRY
# ============================================================

class ArtifactRegistry:

    """
    Canonical runtime artifact registry.

    Maintains:
    - runtime artifact surfaces
    - notebook references
    - retrieval lineage
    - active cognition attachments

    Does NOT:
    - mutate topology truth
    - mutate event truth
    - mutate epistemic lineage
    """

    def __init__(self) -> None:

        self._artifacts: Dict[
            str,
            ArtifactReference
        ] = {}

        self._collections: Dict[
            str,
            ArtifactCollection
        ] = {}

        self._metrics = ArtifactRegistryMetrics()

    # ========================================================
    # REGISTER ARTIFACT
    # ========================================================

    def register_artifact(
        self,
        artifact: ArtifactReference
    ) -> bool:

        """
        Register artifact into runtime registry.

        Duplicate artifact IDs are rejected.
        """

        if artifact.artifact_id in self._artifacts:

            self._metrics.duplicate_rejections += 1

            self._touch()

            return False

        self._artifacts[
            artifact.artifact_id
        ] = artifact

        self._recalculate_metrics()

        return True

    # ========================================================
    # GET ARTIFACT
    # ========================================================

    def get_artifact(
        self,
        artifact_id: str
    ) -> Optional[ArtifactReference]:

        return self._artifacts.get(
            artifact_id
        )

    # ========================================================
    # REMOVE ARTIFACT
    # ========================================================

    def remove_artifact(
        self,
        artifact_id: str
    ) -> bool:

        if artifact_id not in self._artifacts:
            return False

        del self._artifacts[artifact_id]

        self._recalculate_metrics()

        return True

    # ========================================================
    # LIST ARTIFACTS
    # ========================================================

    def list_artifacts(
        self
    ) -> List[ArtifactReference]:

        return list(
            self._artifacts.values()
        )

    # ========================================================
    # REGISTER COLLECTION
    # ========================================================

    def register_collection(
        self,
        collection: ArtifactCollection
    ) -> None:

        self._collections[
            collection.collection_id
        ] = collection

        self._recalculate_metrics()

    # ========================================================
    # GET COLLECTION
    # ========================================================

    def get_collection(
        self,
        collection_id: str
    ) -> Optional[ArtifactCollection]:

        return self._collections.get(
            collection_id
        )

    # ========================================================
    # LIST COLLECTIONS
    # ========================================================

    def list_collections(
        self
    ) -> List[ArtifactCollection]:

        return list(
            self._collections.values()
        )

    # ========================================================
    # ACTIVE NOTEBOOK REFERENCES
    # ========================================================

    def get_notebook_refs(
        self
    ) -> List[str]:

        refs = []

        for collection in (
            self._collections.values()
        ):

            refs.extend(
                collection.imported_notebooks
            )

        return sorted(
            list(set(refs))
        )

    # ========================================================
    # ACTIVE RETRIEVAL VECTORS
    # ========================================================

    def get_active_vectors(
        self
    ) -> List[str]:

        vectors = []

        for collection in (
            self._collections.values()
        ):

            vectors.extend(
                collection.active_vectors
            )

        return sorted(
            list(set(vectors))
        )

    # ========================================================
    # METRICS
    # ========================================================

    def metrics(
        self
    ) -> ArtifactRegistryMetrics:

        return self._metrics

    # ========================================================
    # REGISTRY SNAPSHOT
    # ========================================================

    def snapshot(self) -> dict:

        return {

            "artifact_count":
                len(self._artifacts),

            "collection_count":
                len(self._collections),

            "active_notebooks":
                self.get_notebook_refs(),

            "active_vectors":
                self.get_active_vectors(),

            "metrics":
                {
                    "total_artifacts":
                        self._metrics.total_artifacts,

                    "runtime_attached":
                        self._metrics.runtime_attached,

                    "replay_visible":
                        self._metrics.replay_visible,

                    "operator_visible":
                        self._metrics.operator_visible,

                    "notebook_refs":
                        self._metrics.notebook_refs,

                    "active_vectors":
                        self._metrics.active_vectors,

                    "duplicate_rejections":
                        self._metrics.duplicate_rejections,
                },

            "generated_at":
                datetime.now(UTC).isoformat(),
        }

    # ========================================================
    # RECALCULATE METRICS
    # ========================================================

    def _recalculate_metrics(
        self
    ) -> None:

        artifacts = list(
            self._artifacts.values()
        )

        self._metrics.total_artifacts = (
            len(artifacts)
        )

        self._metrics.runtime_attached = (
            len([
                a for a in artifacts
                if a.runtime_attached
            ])
        )

        self._metrics.replay_visible = (
            len([
                a for a in artifacts
                if a.replay_visible
            ])
        )

        self._metrics.operator_visible = (
            len([
                a for a in artifacts
                if a.operator_visible
            ])
        )

        self._metrics.notebook_refs = (
            len(self.get_notebook_refs())
        )

        self._metrics.active_vectors = (
            len(self.get_active_vectors())
        )

        self._touch()

    # ========================================================
    # TOUCH
    # ========================================================

    def _touch(self) -> None:

        self._metrics.last_updated = (
            datetime.now(UTC)
        )


# ============================================================
# GLOBAL REGISTRY
# ============================================================

artifact_registry = ArtifactRegistry()


# ============================================================
# EXPORTS
# ============================================================

__all__ = [

    "ArtifactRegistryMetrics",

    "ArtifactRegistry",

    "artifact_registry",
]