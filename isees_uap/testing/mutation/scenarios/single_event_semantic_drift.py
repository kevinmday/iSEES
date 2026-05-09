# ============================================================
# single_event_semantic_drift.py
# Full Synthetic Event Scenario
# (TEST INPUT ONLY — NO PIPELINE MODIFICATION)
# ============================================================

from datetime import datetime, UTC

from isees_uap.testing.mutation.generators.observer_generator import (
    generate_observer
)

from isees_uap.testing.mutation.generators.semantic_mutator import (
    mutate_semantics
)

from isees_uap.testing.mutation.generators.temporal_mutator import (
    mutate_timestamp
)

from isees_uap.testing.mutation.generators.geospatial_mutator import (
    mutate_geospatial_position
)


# ------------------------------------------------------------
# BASE EVENT
# ------------------------------------------------------------

BASE_EVENT = {
    "event_id": "TEST-EVENT-001",

    "base_time":
        datetime.now(UTC),

    "base_lat":
        42.3265,

    "base_lon":
        -122.8756,

    "location_name":
        "Medford, Oregon"
}


# ------------------------------------------------------------
# OBSERVER TYPES
# ------------------------------------------------------------

OBSERVER_TYPES = [
    "pilot",
    "civilian_observer",
    "air_traffic_controller",
    "casual_witness"
]


# ------------------------------------------------------------
# BUILD SYNTHETIC REPORT
# ------------------------------------------------------------

def build_report(profile_type):

    observer = generate_observer(profile_type)

    semantic_description = mutate_semantics(observer)

    temporal_data = mutate_timestamp(
        observer,
        BASE_EVENT["base_time"]
    )

    geo_data = mutate_geospatial_position(
        observer,
        BASE_EVENT["base_lat"],
        BASE_EVENT["base_lon"]
    )

    report = {

        "event_id":
            BASE_EVENT["event_id"],

        "observer":
            observer,

        "report": {

            "description":
                semantic_description,

            "timestamp_utc":
                temporal_data["mutated_time_utc"],

            "location": {
                "name":
                    BASE_EVENT["location_name"],

                "lat":
                    geo_data["mutated_lat"],

                "lon":
                    geo_data["mutated_lon"]
            }
        },

        "mutation_metadata": {

            "delay_seconds":
                temporal_data["delay_seconds"],

            "drift_km":
                geo_data["drift_km"]
        }
    }

    return report


# ------------------------------------------------------------
# GENERATE SCENARIO
# ------------------------------------------------------------

def generate_scenario():

    reports = []

    for profile_type in OBSERVER_TYPES:
        reports.append(
            build_report(profile_type)
        )

    return reports


# ------------------------------------------------------------
# QUICK TEST
# ------------------------------------------------------------

if __name__ == "__main__":

    scenario = generate_scenario()

    for report in scenario:
        print()
        print("=" * 60)
        print(report)