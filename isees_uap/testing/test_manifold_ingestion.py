# ============================================================
# test_manifold_ingestion.py — MANIFOLD VALIDATION HARNESS
# ============================================================

import os
import json
import shutil

from datetime import datetime, UTC, timedelta

from isees_uap.api.submit_report import (
    build_observation
)

from isees_uap.analysis.cluster_engine import (
    run_cluster_engine
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


# ============================================================
# RESET LOGS
# ============================================================

def reset_logs():

    if not os.path.exists(LOG_DIR):
        return

    for file in os.listdir(LOG_DIR):

        if file.endswith(".json"):

            try:

                os.remove(
                    os.path.join(
                        LOG_DIR,
                        file
                    )
                )

            except Exception as e:

                print(
                    f"[LOG_DELETE_ERROR] {e}"
                )


# ============================================================
# TEST OBSERVATIONS
# ============================================================

def generate_test_observations():

    now = datetime.now(UTC)

    # --------------------------------------------------------
    # OBSERVATION 1
    # --------------------------------------------------------
    build_observation({

        "report_type":
            "ROR",

        "submission_channel":
            "test_harness",

        "time_raw":
            now.isoformat(),

        "timezone_raw":
            "UTC",

        "location_text":
            "Near Medford Oregon",

        "lat":
            42.3265,

        "lon":
            -122.8756,

        "geo_source":
            "manual",

        "location_accuracy":
            "approximate",

        "observer_type":
            "civilian",

        "observer_count":
            2,

        "language_raw":
            "en",

        "weather_raw":
            "clear skies",

        "visibility_raw":
            "excellent",

        "terrain_raw":
            "mountainous",

        "light_conditions_raw":
            "night",

        "shape_raw":
            "orb",

        "movement_raw":
            "hovered silently",

        "lights_raw":
            "bright white",

        "sound_raw":
            "none",

        "narrative_raw":

            "A bright orb hovered silently "
            "above the hills near Medford. "
            "It suddenly accelerated upward "
            "with no sound."
    })

    # --------------------------------------------------------
    # OBSERVATION 2
    # --------------------------------------------------------
    build_observation({

        "report_type":
            "ROR",

        "submission_channel":
            "test_harness",

        "time_raw":

            (
                now

                +

                timedelta(minutes=12)
            ).isoformat(),

        "timezone_raw":
            "UTC",

        "location_text":
            "Outside Medford",

        "lat":
            42.3290,

        "lon":
            -122.8701,

        "geo_source":
            "manual",

        "location_accuracy":
            "approximate",

        "observer_type":
            "civilian",

        "observer_count":
            1,

        "language_raw":
            "en",

        "weather_raw":
            "clear",

        "visibility_raw":
            "good",

        "terrain_raw":
            "hills",

        "light_conditions_raw":
            "night",

        "shape_raw":
            "sphere",

        "movement_raw":
            "instant acceleration",

        "lights_raw":
            "glowing",

        "sound_raw":
            "silent",

        "narrative_raw":

            "A glowing sphere appeared "
            "over the hills outside Medford. "
            "It hovered briefly before "
            "accelerating instantly upward."
    })

    # --------------------------------------------------------
    # OBSERVATION 3 (SPANISH)
    # --------------------------------------------------------
    build_observation({

        "report_type":
            "ROR",

        "submission_channel":
            "test_harness",

        "time_raw":

            (
                now

                +

                timedelta(minutes=20)
            ).isoformat(),

        "timezone_raw":
            "UTC",

        "location_text":
            "South of Medford",

        "lat":
            42.3200,

        "lon":
            -122.8800,

        "geo_source":
            "manual",

        "location_accuracy":
            "approximate",

        "observer_type":
            "civilian",

        "observer_count":
            3,

        "language_raw":
            "es",

        "weather_raw":
            "despejado",

        "visibility_raw":
            "alta",

        "terrain_raw":
            "montañas",

        "light_conditions_raw":
            "noche",

        "shape_raw":
            "orbe",

        "movement_raw":
            "movimiento extraño",

        "lights_raw":
            "muy brillante",

        "sound_raw":
            "ninguno",

        "narrative_raw":

            "Un objeto brillante flotaba "
            "silenciosamente sobre las colinas. "
            "Luego aceleró rápidamente hacia arriba."
    })

    # --------------------------------------------------------
    # OBSERVATION 4 (UNRELATED)
    # --------------------------------------------------------
    build_observation({

        "report_type":
            "ROR",

        "submission_channel":
            "test_harness",

        "time_raw":

            (
                now

                +

                timedelta(hours=8)
            ).isoformat(),

        "timezone_raw":
            "UTC",

        "location_text":
            "Portland Oregon",

        "lat":
            45.5152,

        "lon":
            -122.6784,

        "geo_source":
            "manual",

        "location_accuracy":
            "high",

        "observer_type":
            "pilot",

        "observer_count":
            1,

        "language_raw":
            "en",

        "weather_raw":
            "cloudy",

        "visibility_raw":
            "moderate",

        "terrain_raw":
            "urban",

        "light_conditions_raw":
            "dusk",

        "shape_raw":
            "triangle",

        "movement_raw":
            "zig zag",

        "lights_raw":
            "red lights",

        "sound_raw":
            "low hum",

        "narrative_raw":

            "A triangular craft with red "
            "lights moved in a zig zag pattern "
            "above Portland during dusk."
    })


# ============================================================
# MAIN TEST
# ============================================================

def main():

    print(
        "\n=== RESETTING LOGS ==="
    )

    reset_logs()

    print(
        "\n=== GENERATING TEST OBSERVATIONS ==="
    )

    generate_test_observations()

    print(
        "\n=== RUNNING MANIFOLD ENGINE ==="
    )

    result = run_cluster_engine()

    print(
        "\n=== FINAL RESULT ==="
    )

    print(
        json.dumps(
            result,
            indent=2
        )
    )


# ============================================================
# ENTRY
# ============================================================

if __name__ == "__main__":
    main()