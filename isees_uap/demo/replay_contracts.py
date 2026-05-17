# ============================================================
# replay_contracts.py
# PHASE: CANONICAL EVENT LOADER + REPLAY CONTRACT NORMALIZATION
# ============================================================

from __future__ import annotations

from copy import deepcopy
from datetime import datetime, UTC
from typing import Dict, List


# ============================================================
# REPLAY CONTRACT FACTORY
# ============================================================

def build_replay_contract(event: Dict) -> Dict:
    """
    Build normalized replay cognition contract.

    This transforms raw canonical event fixtures into
    replay-safe immutable cognition structures.

    The replay contract becomes the ONLY structure
    consumed by future replay visualization systems.
    """

    contract = {
        "event_id": event.get("event_id", ""),
        "event_name": event.get("event_name", ""),
        "classification": event.get("classification", ""),

        # ----------------------------------------------------
        # IMMUTABLE EPISTEMIC STATE
        # ----------------------------------------------------

        "epistemic_state": {
            "current_layer": 0,
            "total_layers": 0,
            "state_version": 1,
            "immutable": True,
        },

        # ----------------------------------------------------
        # CORE EVENT STRUCTURE
        # ----------------------------------------------------

        "core_event": {
            "initial_timestamp":
                event.get("initial_timestamp", ""),

            "location":
                deepcopy(event.get("location", {})),

            "observer_topology":
                deepcopy(event.get("observer_topology", {})),

            "observability_profile":
                deepcopy(event.get("observability_profile", {})),

            "semantic_signature":
                deepcopy(event.get("semantic_signature", {})),

            "infrastructure_context":
                deepcopy(event.get("infrastructure_context", {})),

            "sensor_domains":
                deepcopy(event.get("sensor_domains", [])),
        },

        # ----------------------------------------------------
        # TOPOLOGY STATE
        # ----------------------------------------------------

        "topology": {
            "contradiction_load":
                deepcopy(event.get("contradiction_load", {})),

            "topology_state":
                deepcopy(event.get("topology_state", {})),
        },

        # ----------------------------------------------------
        # TEMPORAL REPLAY STRUCTURE
        # ----------------------------------------------------

        "temporal_replay": {
            "layers": [],
            "timeline_initialized": False,
            "immutable_progression": True,
        },

        # ----------------------------------------------------
        # REPLAY METADATA
        # ----------------------------------------------------

        "replay_metadata": {
            "generated_utc":
                datetime.now(UTC).isoformat(),

            "source_event":
                event.get("event_id", ""),

            "replay_ready": True,

            "contract_version": 1,
        }
    }

    # --------------------------------------------------------
    # BUILD TEMPORAL LAYERS
    # --------------------------------------------------------

    temporal_layers = event.get("temporal_layers", [])

    for idx, layer in enumerate(temporal_layers):

        normalized_layer = build_temporal_layer(
            layer_index=idx,
            layer_data=layer
        )

        contract["temporal_replay"]["layers"].append(
            normalized_layer
        )

    contract["epistemic_state"]["total_layers"] = len(
        contract["temporal_replay"]["layers"]
    )

    if contract["epistemic_state"]["total_layers"] > 0:
        contract["temporal_replay"]["timeline_initialized"] = True

    return contract


# ============================================================
# TEMPORAL LAYER CONTRACT
# ============================================================

def build_temporal_layer(
    layer_index: int,
    layer_data: Dict,
) -> Dict:
    """
    Build immutable T-layer replay structure.
    """

    layer = {
        "layer_id": f"T{layer_index}",

        "layer_index": layer_index,

        "timestamp":
            layer_data.get("timestamp", ""),

        "title":
            layer_data.get(
                "title",
                f"Temporal Layer {layer_index}"
            ),

        "summary":
            layer_data.get("summary", ""),

        "epistemic_delta":
            deepcopy(layer_data.get("epistemic_delta", {})),

        "topology_changes":
            deepcopy(layer_data.get("topology_changes", {})),

        "contradictions":
            deepcopy(layer_data.get("contradictions", [])),

        "supporting_vectors":
            deepcopy(layer_data.get("supporting_vectors", [])),

        "observability_shift":
            deepcopy(layer_data.get("observability_shift", {})),

        "immutable": True,
    }

    return layer


# ============================================================
# REPLAY VALIDATION
# ============================================================

def validate_replay_contract(contract: Dict) -> List[str]:
    """
    Validate replay cognition contract integrity.
    """

    errors = []

    required_fields = [
        "event_id",
        "event_name",
        "classification",
        "epistemic_state",
        "core_event",
        "topology",
        "temporal_replay",
        "replay_metadata",
    ]

    for field in required_fields:

        if field not in contract:
            errors.append(
                f"Missing required replay field: {field}"
            )

    # --------------------------------------------------------
    # TEMPORAL VALIDATION
    # --------------------------------------------------------

    temporal_replay = contract.get("temporal_replay", {})

    layers = temporal_replay.get("layers", [])

    if not isinstance(layers, list):
        errors.append(
            "Temporal replay layers must be a list"
        )

    for idx, layer in enumerate(layers):

        if "layer_id" not in layer:
            errors.append(
                f"Layer {idx} missing layer_id"
            )

        if "immutable" not in layer:
            errors.append(
                f"Layer {idx} missing immutable flag"
            )

    return errors


# ============================================================
# REPLAY SUMMARY
# ============================================================

def build_replay_summary(contract: Dict) -> Dict:
    """
    Generate replay cognition summary.
    """

    layers = contract.get(
        "temporal_replay",
        {}
    ).get("layers", [])

    summary = {
        "event_id":
            contract.get("event_id", ""),

        "event_name":
            contract.get("event_name", ""),

        "classification":
            contract.get("classification", ""),

        "layer_count":
            len(layers),

        "timeline_initialized":
            contract.get(
                "temporal_replay",
                {}
            ).get(
                "timeline_initialized",
                False
            ),

        "immutable_progression":
            contract.get(
                "temporal_replay",
                {}
            ).get(
                "immutable_progression",
                False
            ),
    }

    return summary


# ============================================================
# DEVELOPMENT TEST
# ============================================================

if __name__ == "__main__":

    test_event = {
        "event_id": "TEST-001",
        "event_name": "Replay Test Event",
        "classification": "test_emergence",
        "temporal_layers": [
            {
                "timestamp": "2026-05-17T00:00:00Z",
                "title": "Initial Emergence",
                "summary": "Initial witness report"
            },
            {
                "timestamp": "2026-05-17T01:00:00Z",
                "title": "Sensor Corroboration",
                "summary": "Additional sensor confirmation"
            }
        ]
    }

    contract = build_replay_contract(test_event)

    print("\n================================================")
    print("REPLAY CONTRACT TEST")
    print("================================================\n")

    print(contract)

    print("\n================================================")
    print("VALIDATION")
    print("================================================\n")

    print(validate_replay_contract(contract))

    print("\n================================================")
    print("SUMMARY")
    print("================================================\n")

    print(build_replay_summary(contract))