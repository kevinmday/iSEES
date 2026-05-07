# ============================================================
# submit_report.py — CANONICAL OBSERVATION INTAKE (LAYER 0)
# ============================================================

import uuid
from datetime import datetime, UTC
from typing import Dict, Any


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
# MAIN BUILDER
# ============================================================

def build_observation(payload: Dict[str, Any]) -> Dict[str, Any]:
    """
    Layer 0 Canonical Observation Builder

    IMPORTANT:
    This layer preserves ONLY observer truth.

    No enrichment.
    No inference.
    No clustering.
    No semantic processing.

    This object is immutable observational truth.
    """

    observation_id = _generate_observation_id()

    observation = {

        # ----------------------------------------------------
        # SCHEMA METADATA
        # ----------------------------------------------------
        "schema_version": "1.0",

        # ----------------------------------------------------
        # ROOT OBSERVATION OBJECT
        # ----------------------------------------------------
        "observation": {

            # ------------------------------------------------
            # CORE IDENTITY
            # ------------------------------------------------
            "observation_id": observation_id,

            "report_type": payload.get(
                "report_type",
                "ROR"
            ),

            # ------------------------------------------------
            # SUBMISSION METADATA
            # ------------------------------------------------
            "submission": {

                "submission_time_utc":
                    datetime.now(UTC).isoformat(),

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
                    payload.get("altitude_raw"),

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

    return observation