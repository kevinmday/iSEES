# ============================================================
# event_loader.py
# PHASE: CANONICAL EVENT LOADER + REPLAY CONTRACT NORMALIZATION
# ============================================================

from __future__ import annotations

import json
from pathlib import Path
from typing import Dict, List, Optional


# ============================================================
# PATHS
# ============================================================

BASE_DIR = Path(__file__).resolve().parent

EVENTS_DIR = BASE_DIR / "events"
TOPOLOGY_DIR = EVENTS_DIR / "topology_profiles"


# ============================================================
# EVENT LOADER
# ============================================================

class EventLoader:
    """
    Canonical multi-event manifold fixture loader.

    Responsibilities:
    - Load canonical event fixtures
    - Load topology profiles
    - Normalize replay structures
    - Provide replay-safe cognition payloads
    """

    def __init__(self) -> None:
        self.events_dir = EVENTS_DIR
        self.topology_dir = TOPOLOGY_DIR

    # --------------------------------------------------------
    # PUBLIC API
    # --------------------------------------------------------

    def list_events(self) -> List[str]:
        """
        Return all canonical event fixture names.
        """

        events = []

        for file in self.events_dir.glob("*_case.json"):
            events.append(file.stem)

        return sorted(events)

    def load_event(self, event_name: str) -> Dict:
        """
        Load canonical event fixture.
        """

        path = self.events_dir / f"{event_name}.json"

        if not path.exists():
            raise FileNotFoundError(
                f"[EVENT LOADER] Event fixture not found: {path}"
            )

        with open(path, "r", encoding="utf-8") as f:
            data = json.load(f)

        return self._normalize_event(data)

    def load_topology_profile(self, profile_name: str) -> Dict:
        """
        Load topology profile fixture.
        """

        path = self.topology_dir / f"{profile_name}.json"

        if not path.exists():
            raise FileNotFoundError(
                f"[EVENT LOADER] Topology profile not found: {path}"
            )

        with open(path, "r", encoding="utf-8") as f:
            data = json.load(f)

        return self._normalize_topology_profile(data)

    def load_event_bundle(self, event_name: str) -> Dict:
        """
        Load event + topology profile bundle.

        Example:
            medford_case
            -> medford_profile
        """

        event = self.load_event(event_name)

        profile_name = event_name.replace("_case", "_profile")

        topology_profile = self.load_topology_profile(profile_name)

        return {
            "event": event,
            "topology_profile": topology_profile,
            "bundle_metadata": {
                "source_event": event_name,
                "profile": profile_name,
            }
        }

    # --------------------------------------------------------
    # NORMALIZATION
    # --------------------------------------------------------

    def _normalize_event(self, data: Dict) -> Dict:
        """
        Normalize canonical replay event contract.

        Ensures:
        - required fields exist
        - replay structures are initialized
        - temporal layer safety exists
        """

        normalized = {
            "event_id": data.get("event_id", ""),
            "event_name": data.get("event_name", ""),
            "classification": data.get("classification", ""),
            "initial_timestamp": data.get("initial_timestamp", ""),
            "location": data.get("location", {}),
            "observer_topology": data.get("observer_topology", {}),
            "observability_profile": data.get("observability_profile", {}),
            "semantic_signature": data.get("semantic_signature", {}),
            "infrastructure_context": data.get("infrastructure_context", {}),
            "sensor_domains": data.get("sensor_domains", []),
            "contradiction_load": data.get("contradiction_load", {}),
            "topology_state": data.get("topology_state", {}),
            "temporal_layers": data.get("temporal_layers", []),
            "replay_metadata": data.get("replay_metadata", {}),
        }

        # ----------------------------------------------------
        # REPLAY SAFETY
        # ----------------------------------------------------

        if not isinstance(normalized["temporal_layers"], list):
            normalized["temporal_layers"] = []

        if not isinstance(normalized["sensor_domains"], list):
            normalized["sensor_domains"] = []

        return normalized

    def _normalize_topology_profile(self, data: Dict) -> Dict:
        """
        Normalize topology replay profile contract.
        """

        normalized = {
            "observability_density":
                data.get("observability_density", 0.0),

            "infrastructure_saturation":
                data.get("infrastructure_saturation", 0.0),

            "semantic_cohesion":
                data.get("semantic_cohesion", 0.0),

            "contradiction_pressure":
                data.get("contradiction_pressure", 0.0),

            "sensor_participation":
                data.get("sensor_participation", 0.0),

            "environmental_visibility":
                data.get("environmental_visibility", 0.0),

            "witness_distribution":
                data.get("witness_distribution", 0.0),

            "temporal_dispersion":
                data.get("temporal_dispersion", 0.0),
        }

        return normalized


# ============================================================
# SINGLETON
# ============================================================

event_loader = EventLoader()


# ============================================================
# DEVELOPMENT TEST
# ============================================================

if __name__ == "__main__":

    print("\n================================================")
    print("iSEES EVENT LOADER")
    print("================================================\n")

    print("[AVAILABLE EVENTS]")
    print(event_loader.list_events())

    print("\n[LOAD TIC TAC BUNDLE]\n")

    bundle = event_loader.load_event_bundle("tic_tac_case")

    print(json.dumps(bundle, indent=2))