# ============================================================
# runtime_state.py
# CANONICAL RUNTIME COGNITION STATE
# ============================================================

"""
Defines mutable runtime cognition structures.

Unlike immutable epistemic snapshots,
runtime cognition states are LIVE and MUTABLE.

These objects represent:
- active operator cognition
- current overlays
- active domains
- replay/runtime execution state
- active artifact surfaces
- cognition routing state

Runtime states may generate immutable snapshots,
but snapshots MUST NEVER mutate runtime lineage retroactively.
"""

from __future__ import annotations

from dataclasses import dataclass, field
from datetime import datetime, UTC
from enum import Enum
from typing import Dict, List, Optional


# ============================================================
# COGNITION DOMAIN
# ============================================================

class CognitionDomain(str, Enum):

    LIVE = "LIVE"

    REPLAY = "REPLAY"

    TRAINING = "TRAINING"

    ENTANGLEMENT = "ENTANGLEMENT"

    RED_TEAM = "RED_TEAM"

    INVESTIGATION = "INVESTIGATION"

    DEMO = "DEMO"

    EXTERNAL_INTELLIGENCE = (
        "EXTERNAL_INTELLIGENCE"
    )


# ============================================================
# RUNTIME MODE
# ============================================================

class RuntimeMode(str, Enum):

    ACTIVE = "ACTIVE"

    PAUSED = "PAUSED"

    IDLE = "IDLE"

    LOCKED = "LOCKED"

    RECONSTRUCTION = "RECONSTRUCTION"


# ============================================================
# OVERLAY VISIBILITY
# ============================================================

@dataclass
class OverlayVisibility:

    topology_visible: bool = True

    observability_visible: bool = True

    contradiction_visible: bool = True

    ontology_visible: bool = True

    provenance_visible: bool = True

    infrastructure_visible: bool = True

    vector_visible: bool = True


# ============================================================
# CONTAMINATION STATE
# ============================================================

@dataclass
class ContaminationState:

    contamination_detected: bool = False

    contamination_score: float = 0.0

    contamination_sources: List[str] = field(
        default_factory=list
    )

    boundary_violations: List[str] = field(
        default_factory=list
    )

    replay_leakage_detected: bool = False

    unresolved_cross_domain_imports: List[str] = (
        field(default_factory=list)
    )


# ============================================================
# ARTIFACT SURFACE
# ============================================================

@dataclass
class ArtifactSurface:

    active_sources: List[str] = field(
        default_factory=list
    )

    imported_artifacts: List[str] = field(
        default_factory=list
    )

    referenced_notebooks: List[str] = field(
        default_factory=list
    )

    retrieval_vectors: List[str] = field(
        default_factory=list
    )

    dynamic_fetch_enabled: bool = True


# ============================================================
# DOMAIN TRANSFER
# ============================================================

@dataclass
class DomainTransfer:

    source_domain: str

    target_domain: str

    approved: bool = False

    transferred_by: str = ""

    transfer_reason: str = ""

    transferred_at: datetime = field(
        default_factory=lambda: datetime.now(UTC)
    )


# ============================================================
# RUNTIME COGNITION STATE
# ============================================================

@dataclass
class RuntimeCognitionState:
    """
    Mutable runtime cognition state.

    Represents:
    what cognition surfaces are currently active,
    which domain the operator occupies,
    what artifact-space is exposed,
    and what cognition routing state exists
    at runtime.
    """

    runtime_id: str

    operator_id: str

    created_at: datetime = field(
        default_factory=lambda: datetime.now(UTC)
    )

    updated_at: datetime = field(
        default_factory=lambda: datetime.now(UTC)
    )

    active_domain: CognitionDomain = (
        CognitionDomain.LIVE
    )

    runtime_mode: RuntimeMode = (
        RuntimeMode.ACTIVE
    )

    active_event_id: Optional[str] = None

    active_snapshot_id: Optional[str] = None

    active_temporal_layer: int = 0

    active_overlays: List[str] = field(
        default_factory=list
    )

    active_focus_vectors: List[str] = field(
        default_factory=list
    )

    overlay_visibility: OverlayVisibility = field(
        default_factory=OverlayVisibility
    )

    contamination_state: ContaminationState = field(
        default_factory=ContaminationState
    )

    artifact_surface: ArtifactSurface = field(
        default_factory=ArtifactSurface
    )

    imported_contexts: List[str] = field(
        default_factory=list
    )

    domain_transfers: List[DomainTransfer] = field(
        default_factory=list
    )

    replay_running: bool = False

    replay_paused: bool = False

    replay_speed: float = 1.0

    immutable_mode: bool = False

    historical_mode: bool = False

    operator_notes: List[str] = field(
        default_factory=list
    )

    runtime_flags: Dict[str, bool] = field(
        default_factory=dict
    )

    runtime_metadata: Dict[str, str] = field(
        default_factory=dict
    )


# ============================================================
# DEVELOPMENT TEST
# ============================================================

if __name__ == "__main__":

    runtime = RuntimeCognitionState(

        runtime_id="runtime-001",

        operator_id="kday",

        active_domain=CognitionDomain.REPLAY,

        active_event_id="UAP-TICTAC-2004",

        replay_running=True,

        historical_mode=True,
    )

    print("\n================================================")
    print("RUNTIME COGNITION STATE TEST")
    print("================================================\n")

    print(runtime)