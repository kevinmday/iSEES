# ============================================================
# submit_report.py
# CANONICAL OBSERVATION INTAKE + KOD INTEGRATION (V4)
# build_report CONTRACT RESTORED
# FULL DROP-IN REPLACEMENT
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
    # NORMALIZE PUBLIC INTAKE PAYLOAD
    # ========================================================

    normalized_payload = {

        # ----------------------------------------------------
        # ROOT
        # ----------------------------------------------------

        "report_type":
            payload.get(
                "report_type",
                "ROR"
            ),

        "submission_channel":
            "web_form",

        # ----------------------------------------------------
        # LOCATION
        # ----------------------------------------------------

        "location_text":
            payload.get(
                "location",
                ""
            ),

        # ----------------------------------------------------
        # TIME
        # ----------------------------------------------------

        "time_raw":
            (
                payload.get(
                    "event",
                    {}
                ).get(
                    "time_local",
                    ""
                )
            ),

        "duration_raw":
            str(
                payload.get(
                    "event",
                    {}
                ).get(
                    "duration_seconds",
                    ""
                )
            ),

        # ----------------------------------------------------
        # ENVIRONMENT
        # ----------------------------------------------------

        "weather_raw":
            (
                payload.get(
                    "environment",
                    {}
                ).get(
                    "notes",
                    ""
                )
            ),

        # ----------------------------------------------------
        # NARRATIVE
        # ----------------------------------------------------

        "narrative_raw":
            payload.get(
                "description",
                ""
            ),

        # ----------------------------------------------------
        # PROVENANCE
        # ----------------------------------------------------

        "environment":
            "development",

        "trust_domain":
            "public_ror",

        "observer_mode":
            "civilian_submission",

        "synthetic":
            False,

        "fixture":
            False,

        "replay":
            False,
    }

    # ========================================================
    # CANONICAL OBSERVATION
    # ========================================================

    observation = {

        "schema_version": "4.0",

        "generated_utc":
            datetime.now(UTC).isoformat(),

        "observation": {

            # ------------------------------------------------
            # CORE
            # ------------------------------------------------

            "observation_id":
                observation_id,

            "report_type":
                normalized_payload.get(
                    "report_type",
                    "ROR"
                ),

            # ------------------------------------------------
            # SUBMISSION
            # ------------------------------------------------

            "submission": {

                "submission_time_utc":

                    datetime.now(
                        UTC
                    ).isoformat(),

                "submission_channel":

                    normalized_payload.get(
                        "submission_channel",
                        "web_form"
                    ),
            },

            # ------------------------------------------------
            # TIME
            # ------------------------------------------------

            "observation_time": {

                "time_raw":

                    normalized_payload.get(
                        "time_raw",
                        ""
                    ),

                "duration_raw":

                    normalized_payload.get(
                        "duration_raw",
                        ""
                    ),
            },

            # ------------------------------------------------
            # GEO
            # ------------------------------------------------

            "raw_geo": {

                "location_text":

                    normalized_payload.get(
                        "location_text",
                        ""
                    )
            },

            # ------------------------------------------------
            # ENVIRONMENT
            # ------------------------------------------------

            "environment": {

                "weather_raw":

                    normalized_payload.get(
                        "weather_raw",
                        ""
                    )
            },

            # ------------------------------------------------
            # CONTENT
            # ------------------------------------------------

            "content": {

                "narrative_raw":

                    normalized_payload.get(
                        "narrative_raw",
                        ""
                    )
            },

            # ------------------------------------------------
            # PROVENANCE
            # ------------------------------------------------

            "provenance": {

                "environment":

                    normalized_payload.get(
                        "environment",
                        "development"
                    ),

                "trust_domain":

                    normalized_payload.get(
                        "trust_domain",
                        "internal_dev"
                    ),

                "observer_mode":

                    normalized_payload.get(
                        "observer_mode",
                        "tester"
                    ),

                "synthetic":

                    normalized_payload.get(
                        "synthetic",
                        False
                    ),

                "fixture":

                    normalized_payload.get(
                        "fixture",
                        False
                    ),

                "replay":

                    normalized_payload.get(
                        "replay",
                        False
                    )
            }
        }
    }

    # ========================================================
    # KOD EXECUTION
    # ========================================================

    try:

        kod_observation = (
            _build_kod_observation_context(
                normalized_payload
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
    # PERSIST
    # ========================================================

    _write_observation_log(
        observation
    )

    return observation

# ============================================================
# 🔥 RESTORE OLD CONTRACT
# REQUIRED FOR API IMPORT COMPATIBILITY
# ============================================================

def build_report(
    payload: Dict[str, Any]
) -> Dict[str, Any]:

    return build_observation(
        payload
    )