# ============================================================
# submit_report.py
# CANONICAL OBSERVATION INTAKE + KOD INTEGRATION (V3)
# ============================================================

import os
import json
import uuid

from datetime import datetime, UTC
from typing import Dict, Any

from isees_uap.kod.models.observation_context import (
    ObservationContext,
)

from isees_uap.kod.kod_manager import (
    KODManager,
    KODExecutionPolicy,
)


# ============================================================
# PATHS
# ============================================================

BASE_DIR = os.path.dirname(
    os.path.dirname(__file__)
)

LOG_DIR = os.path.join(
    BASE_DIR,
    "logs"
)

os.makedirs(
    LOG_DIR,
    exist_ok=True
)


# ============================================================
# GLOBAL KOD MANAGER
# ============================================================

KOD_MANAGER = KODManager()


# ============================================================
# ID GENERATION
# ============================================================

def _generate_observation_id() -> str:

    return (

        f"OBS-"

        f"{datetime.now(UTC).strftime('%Y%m%d')}-"

        f"{str(uuid.uuid4())[:8]}"
    )


# ============================================================
# LOG WRITER
# ============================================================

def _write_observation_log(
    observation: Dict[str, Any]
):

    try:

        obs = observation.get(
            "observation",
            {}
        )

        observation_id = obs.get(
            "observation_id",
            str(uuid.uuid4())
        )

        path = os.path.join(

            LOG_DIR,

            f"{observation_id}.json"
        )

        with open(
            path,
            "w",
            encoding="utf-8"
        ) as f:

            json.dump(
                observation,
                f,
                indent=2
            )

    except Exception as e:

        print(
            f"[OBSERVATION_LOG_ERROR] {e}"
        )


# ============================================================
# KOD OBSERVATION BUILDER
# ============================================================

def _build_kod_observation_context(
    payload: Dict[str, Any]
) -> ObservationContext:

    """
    Convert canonical intake payload into
    KOD observation context.
    """

    observation = ObservationContext()

    # --------------------------------------------------------
    # GEO
    # --------------------------------------------------------

    observation.geo.latitude = (
        payload.get("lat") or 0.0
    )

    observation.geo.longitude = (
        payload.get("lon") or 0.0
    )

    observation.geo.city = (
        payload.get("city")
    )

    observation.geo.state = (
        payload.get("state")
    )

    # --------------------------------------------------------
    # OBSERVATION DETAILS
    # --------------------------------------------------------

    observation.object_shape = (
        payload.get("shape_raw")
    )

    observation.movement_description = (
        payload.get("movement_raw")
    )

    observation.sound_description = (
        payload.get("sound_raw")
    )

    observation.raw_description = (
        payload.get("narrative_raw")
    )

    observation.object_color = (
        payload.get("lights_raw")
    )

    # --------------------------------------------------------
    # ESTIMATES
    # --------------------------------------------------------

    observation.estimated_altitude_ft = (
        payload.get("estimated_altitude_ft")
    )

    observation.estimated_speed_kts = (
        payload.get("estimated_speed_kts")
    )

    # --------------------------------------------------------
    # OBSERVER
    # --------------------------------------------------------

    observation.observer.observer_type = (
        payload.get("observer_type")
        or "civilian"
    )

    # --------------------------------------------------------
    # PROVENANCE
    # --------------------------------------------------------

    observation.provenance.environment = (
        payload.get(
            "environment",
            "development"
        )
    )

    observation.provenance.trust_domain = (
        payload.get(
            "trust_domain",
            "internal_dev"
        )
    )

    observation.provenance.observer_mode = (
        payload.get(
            "observer_mode",
            "tester"
        )
    )

    observation.provenance.synthetic = (
        payload.get(
            "synthetic",
            False
        )
    )

    observation.provenance.fixture = (
        payload.get(
            "fixture",
            False
        )
    )

    observation.provenance.replay = (
        payload.get(
            "replay",
            False
        )
    )

    observation.provenance.ingestion_channel = (
        payload.get(
            "submission_channel",
            "web_form"
        )
    )

    observation.provenance.observer_id = (
        payload.get(
            "observer_id"
        )
    )

    observation.provenance.session_id = (
        payload.get(
            "session_id"
        )
    )

    return observation


# ============================================================
# MAIN BUILDER
# ============================================================

def build_observation(
    payload: Dict[str, Any]
) -> Dict[str, Any]:
    """
    Canonical observation intake layer.

    Layer 0 preserves observer truth.

    KOD performs deterministic contextual
    collapse AFTER canonical intake creation.
    """

    observation_id = (
        _generate_observation_id()
    )

    # ========================================================
    # CANONICAL OBSERVATION
    # ========================================================

    observation = {

        # ----------------------------------------------------
        # SCHEMA METADATA
        # ----------------------------------------------------
        "schema_version": "3.0",

        "generated_utc":
            datetime.now(UTC).isoformat(),

        # ----------------------------------------------------
        # ROOT OBSERVATION OBJECT
        # ----------------------------------------------------
        "observation": {

            # ------------------------------------------------
            # CORE IDENTITY
            # ------------------------------------------------
            "observation_id":
                observation_id,

            "report_type":
                payload.get(
                    "report_type",
                    "ROR"
                ),

            # ------------------------------------------------
            # SUBMISSION METADATA
            # ------------------------------------------------
            "submission": {

                "submission_time_utc":

                    datetime.now(
                        UTC
                    ).isoformat(),

                "submission_channel":

                    payload.get(
                        "submission_channel",
                        "web_form"
                    ),

                "client_version":

                    payload.get(
                        "client_version",
                        "unknown"
                    ),

                "session_id":

                    payload.get(
                        "session_id",
                        ""
                    )
            },

            # ------------------------------------------------
            # OBSERVATION TIME
            # ------------------------------------------------
            "observation_time": {

                "time_raw":

                    payload.get(
                        "time_raw",
                        ""
                    ),

                "timezone_raw":

                    payload.get(
                        "timezone_raw",
                        ""
                    ),

                "time_accuracy":

                    payload.get(
                        "time_accuracy",
                        ""
                    ),

                "duration_raw":

                    payload.get(
                        "duration_raw",
                        ""
                    )
            },

            # ------------------------------------------------
            # RAW GEO
            # ------------------------------------------------
            "raw_geo": {

                "location_text":

                    payload.get(
                        "location_text",
                        ""
                    ),

                "lat":
                    payload.get("lat"),

                "lon":
                    payload.get("lon"),

                "altitude_raw":

                    payload.get(
                        "altitude_raw"
                    ),

                "geo_source":

                    payload.get(
                        "geo_source",
                        ""
                    ),

                "location_accuracy":

                    payload.get(
                        "location_accuracy",
                        ""
                    )
            },

            # ------------------------------------------------
            # OBSERVER
            # ------------------------------------------------
            "observer": {

                "observer_type":

                    payload.get(
                        "observer_type",
                        ""
                    ),

                "observer_count":

                    payload.get(
                        "observer_count"
                    ),

                "language_raw":

                    payload.get(
                        "language_raw",
                        ""
                    ),

                "experience_level":

                    payload.get(
                        "experience_level",
                        ""
                    ),

                "contact_permitted":

                    payload.get(
                        "contact_permitted",
                        False
                    )
            },

            # ------------------------------------------------
            # PROVENANCE
            # ------------------------------------------------
            "provenance": {

                "environment":

                    payload.get(
                        "environment",
                        "development"
                    ),

                "trust_domain":

                    payload.get(
                        "trust_domain",
                        "internal_dev"
                    ),

                "observer_mode":

                    payload.get(
                        "observer_mode",
                        "tester"
                    ),

                "synthetic":

                    payload.get(
                        "synthetic",
                        False
                    ),

                "fixture":

                    payload.get(
                        "fixture",
                        False
                    ),

                "replay":

                    payload.get(
                        "replay",
                        False
                    ),

                "observer_id":

                    payload.get(
                        "observer_id"
                    ),

                "session_id":

                    payload.get(
                        "session_id"
                    )
            },

            # ------------------------------------------------
            # ENVIRONMENT
            # ------------------------------------------------
            "environment": {

                "weather_raw":

                    payload.get(
                        "weather_raw",
                        ""
                    ),

                "visibility_raw":

                    payload.get(
                        "visibility_raw",
                        ""
                    ),

                "terrain_raw":

                    payload.get(
                        "terrain_raw",
                        ""
                    ),

                "light_conditions_raw":

                    payload.get(
                        "light_conditions_raw",
                        ""
                    )
            },

            # ------------------------------------------------
            # OBJECT DESCRIPTION
            # ------------------------------------------------
            "object_description": {

                "shape_raw":

                    payload.get(
                        "shape_raw",
                        ""
                    ),

                "movement_raw":

                    payload.get(
                        "movement_raw",
                        ""
                    ),

                "lights_raw":

                    payload.get(
                        "lights_raw",
                        ""
                    ),

                "sound_raw":

                    payload.get(
                        "sound_raw",
                        ""
                    ),

                "object_count_raw":

                    payload.get(
                        "object_count_raw"
                    ),

                "additional_characteristics_raw":

                    payload.get(
                        "additional_characteristics_raw",
                        ""
                    )
            },

            # ------------------------------------------------
            # CONTENT
            # ------------------------------------------------
            "content": {

                "narrative_raw":

                    payload.get(
                        "narrative_raw",
                        ""
                    ),

                "media_raw":

                    payload.get(
                        "media_raw",
                        []
                    )
            },

            # ------------------------------------------------
            # CLIENT METADATA
            # ------------------------------------------------
            "client_metadata": {

                "device_type":

                    payload.get(
                        "device_type",
                        ""
                    ),

                "platform":

                    payload.get(
                        "platform",
                        ""
                    ),

                "app_language":

                    payload.get(
                        "app_language",
                        ""
                    ),

                "network_type":

                    payload.get(
                        "network_type",
                        ""
                    )
            },

            # ------------------------------------------------
            # INTEGRITY PLACEHOLDERS
            # ------------------------------------------------
            "integrity": {

                "hash": "",

                "signature": ""
            }
        }
    }

    # ========================================================
    # KOD EXECUTION
    # ========================================================

    try:

        kod_observation = (
            _build_kod_observation_context(
                payload
            )
        )

        policy = KODExecutionPolicy()

        policy.mode = "deep_analysis"

        kod_result = (
            KOD_MANAGER.execute(
                kod_observation,
                policy,
            )
        )

        observation["kod"] = (
            kod_result.to_dict()
        )

    except Exception as e:

        observation["kod_error"] = {
            "error": str(e)
        }

        print(
            f"[KOD_EXECUTION_ERROR] {e}"
        )

    # ========================================================
    # PERSIST CANONICAL OBSERVATION
    # ========================================================

    _write_observation_log(
        observation
    )

    return observation


# ============================================================
# TEST HARNESS
# ============================================================

if __name__ == "__main__":

    from pprint import pprint

    payload = {

        "report_type":
            "ROR",

        "submission_channel":
            "web_form",

        "location_text":
            "Medford Oregon",

        "lat":
            42.374,

        "lon":
            -122.871,

        "observer_type":
            "civilian",

        "shape_raw":
            "bright_white_light",

        "movement_raw":
            "instant vertical maneuvering",

        "lights_raw":
            "bright white",

        "sound_raw":
            "silent",

        "narrative_raw":
            (
                "Bright white object moved "
                "instantly across the sky "
                "with no sound."
            ),

        "estimated_altitude_ft":
            30000,

        "estimated_speed_kts":
            420,

        # ----------------------------------------------------
        # PROVENANCE TESTING
        # ----------------------------------------------------

        "environment":
            "development",

        "trust_domain":
            "internal_dev",

        "observer_mode":
            "tester",

        "synthetic":
            False,

        "fixture":
            False,

        "replay":
            False,

        "observer_id":
            "DEV-001",
    }

    result = build_observation(
        payload
    )

    print()
    print("================================================")
    print("CANONICAL OBSERVATION + KOD")
    print("================================================")
    print()

    pprint(result)

    print()