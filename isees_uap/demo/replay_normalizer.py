# ============================================================
# replay_normalizer.py
# PHASE: CANONICAL EVENT LOADER + REPLAY CONTRACT NORMALIZATION
# ============================================================

from __future__ import annotations

from copy import deepcopy
from typing import Dict, List

from isees_uap.demo.event_loader import event_loader
from isees_uap.demo.replay_contracts import (
    build_replay_contract,
    validate_replay_contract,
)
from isees_uap.demo.replay_types import (
    ReplayContract,
    EpistemicState,
    CoreEvent,
    TopologyState,
    TemporalReplay,
    ReplayMetadata,
    TemporalLayer,
)


# ============================================================
# REPLAY NORMALIZER
# ============================================================

class ReplayNormalizer:
    """
    Replay cognition normalization engine.

    Responsibilities:
    - Convert raw event fixtures into replay contracts
    - Normalize immutable replay structures
    - Validate cognition integrity
    - Generate replay-safe manifold payloads
    """

    # --------------------------------------------------------
    # PUBLIC API
    # --------------------------------------------------------

    def normalize_event_bundle(
        self,
        event_name: str,
    ) -> Dict:
        """
        Load + normalize canonical event bundle.
        """

        bundle = event_loader.load_event_bundle(
            event_name
        )

        replay_contract = build_replay_contract(
            bundle["event"]
        )

        validation_errors = validate_replay_contract(
            replay_contract
        )

        return {
            "bundle": bundle,
            "replay_contract": replay_contract,
            "validation_errors": validation_errors,
            "valid": len(validation_errors) == 0,
        }

    def build_runtime_contract(
        self,
        event_name: str,
    ) -> ReplayContract:
        """
        Build strongly-typed replay runtime contract.
        """

        normalized = self.normalize_event_bundle(
            event_name
        )

        contract_data = normalized["replay_contract"]

        return self._to_runtime_contract(
            contract_data
        )

    def list_available_events(self) -> List[str]:
        """
        Return all available canonical fixtures.
        """

        return event_loader.list_events()

    # --------------------------------------------------------
    # RUNTIME CONVERSION
    # --------------------------------------------------------

    def _to_runtime_contract(
        self,
        data: Dict,
    ) -> ReplayContract:
        """
        Convert normalized dictionary contract into
        strongly-typed replay runtime structure.
        """

        # ----------------------------------------------------
        # EPISTEMIC STATE
        # ----------------------------------------------------

        epistemic_state = EpistemicState(
            current_layer=data["epistemic_state"].get(
                "current_layer",
                0
            ),

            total_layers=data["epistemic_state"].get(
                "total_layers",
                0
            ),

            state_version=data["epistemic_state"].get(
                "state_version",
                1
            ),

            immutable=data["epistemic_state"].get(
                "immutable",
                True
            ),
        )

        # ----------------------------------------------------
        # CORE EVENT
        # ----------------------------------------------------

        core_data = data["core_event"]

        core_event = CoreEvent(
            event_id=data.get("event_id", ""),
            event_name=data.get("event_name", ""),
            classification=data.get("classification", ""),

            initial_timestamp=core_data.get(
                "initial_timestamp",
                ""
            ),

            location=deepcopy(
                core_data.get("location", {})
            ),

            observer_topology=deepcopy(
                core_data.get(
                    "observer_topology",
                    {}
                )
            ),

            observability_profile=deepcopy(
                core_data.get(
                    "observability_profile",
                    {}
                )
            ),

            semantic_signature=deepcopy(
                core_data.get(
                    "semantic_signature",
                    {}
                )
            ),

            infrastructure_context=deepcopy(
                core_data.get(
                    "infrastructure_context",
                    {}
                )
            ),

            sensor_domains=deepcopy(
                core_data.get(
                    "sensor_domains",
                    []
                )
            ),
        )

        # ----------------------------------------------------
        # TOPOLOGY STATE
        # ----------------------------------------------------

        topology_data = data["topology"]

        topology = TopologyState(
            contradiction_load=deepcopy(
                topology_data.get(
                    "contradiction_load",
                    {}
                )
            ),

            topology_state=deepcopy(
                topology_data.get(
                    "topology_state",
                    {}
                )
            ),
        )

        # ----------------------------------------------------
        # TEMPORAL REPLAY
        # ----------------------------------------------------

        temporal_data = data["temporal_replay"]

        layers = []

        for layer_data in temporal_data.get(
            "layers",
            []
        ):

            layer = TemporalLayer(
                layer_id=layer_data.get(
                    "layer_id",
                    ""
                ),

                layer_index=layer_data.get(
                    "layer_index",
                    0
                ),

                timestamp=layer_data.get(
                    "timestamp",
                    ""
                ),

                title=layer_data.get(
                    "title",
                    ""
                ),

                summary=layer_data.get(
                    "summary",
                    ""
                ),

                epistemic_delta=deepcopy(
                    layer_data.get(
                        "epistemic_delta",
                        {}
                    )
                ),

                topology_changes=deepcopy(
                    layer_data.get(
                        "topology_changes",
                        {}
                    )
                ),

                contradictions=deepcopy(
                    layer_data.get(
                        "contradictions",
                        []
                    )
                ),

                supporting_vectors=deepcopy(
                    layer_data.get(
                        "supporting_vectors",
                        []
                    )
                ),

                observability_shift=deepcopy(
                    layer_data.get(
                        "observability_shift",
                        {}
                    )
                ),

                immutable=layer_data.get(
                    "immutable",
                    True
                ),
            )

            layers.append(layer)

        temporal_replay = TemporalReplay(
            layers=layers,

            timeline_initialized=temporal_data.get(
                "timeline_initialized",
                False
            ),

            immutable_progression=temporal_data.get(
                "immutable_progression",
                True
            ),
        )

        # ----------------------------------------------------
        # REPLAY METADATA
        # ----------------------------------------------------

        metadata_data = data["replay_metadata"]

        replay_metadata = ReplayMetadata(
            generated_utc=metadata_data.get(
                "generated_utc",
                ""
            ),

            source_event=metadata_data.get(
                "source_event",
                ""
            ),

            replay_ready=metadata_data.get(
                "replay_ready",
                True
            ),

            contract_version=metadata_data.get(
                "contract_version",
                1
            ),
        )

        # ----------------------------------------------------
        # FINAL CONTRACT
        # ----------------------------------------------------

        contract = ReplayContract(
            event_id=data.get("event_id", ""),

            event_name=data.get("event_name", ""),

            classification=data.get(
                "classification",
                ""
            ),

            epistemic_state=epistemic_state,

            core_event=core_event,

            topology=topology,

            temporal_replay=temporal_replay,

            replay_metadata=replay_metadata,
        )

        return contract


# ============================================================
# SINGLETON
# ============================================================

replay_normalizer = ReplayNormalizer()


# ============================================================
# DEVELOPMENT TEST
# ============================================================

if __name__ == "__main__":

    print("\n================================================")
    print("REPLAY NORMALIZER TEST")
    print("================================================\n")

    print("[AVAILABLE EVENTS]\n")

    print(
        replay_normalizer.list_available_events()
    )

    print("\n================================================")
    print("NORMALIZE TIC TAC")
    print("================================================\n")

    result = replay_normalizer.normalize_event_bundle(
        "tic_tac_case"
    )

    print("[VALID]")
    print(result["valid"])

    print("\n[VALIDATION ERRORS]")
    print(result["validation_errors"])

    print("\n================================================")
    print("RUNTIME CONTRACT")
    print("================================================\n")

    runtime_contract = (
        replay_normalizer.build_runtime_contract(
            "tic_tac_case"
        )
    )

    print(runtime_contract)