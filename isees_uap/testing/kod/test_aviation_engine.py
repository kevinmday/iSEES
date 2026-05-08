# ============================================================
# test_aviation_engine.py
# KOD — AVIATION ENGINE SANITY TEST
# ============================================================

from pprint import pprint

from isees_uap.kod.models.observation_context import (
    ObservationContext,
)

from isees_uap.kod.engines.aviation_engine import (
    reconstruct_aviation_candidates,
)


# ============================================================
# TEST OBSERVATION
# ============================================================

def build_test_observation() -> ObservationContext:

    observation = ObservationContext()

    # --------------------------------------------------------
    # GEO
    # --------------------------------------------------------

    observation.geo.latitude = 42.374
    observation.geo.longitude = -122.871

    observation.geo.city = "Medford"
    observation.geo.state = "Oregon"

    # --------------------------------------------------------
    # OBSERVATION DETAILS
    # --------------------------------------------------------

    observation.object_shape = "bright_light"

    observation.object_color = "white"

    observation.movement_description = (
        "moving southbound rapidly"
    )

    observation.raw_description = (
        "Bright white object moving southbound "
        "at high altitude with no visible sound."
    )

    # --------------------------------------------------------
    # ESTIMATES
    # --------------------------------------------------------

    observation.estimated_altitude_ft = 30000

    observation.estimated_speed_kts = 420

    observation.azimuth_deg = 190

    observation.confidence = 0.72

    return observation


# ============================================================
# MAIN TEST
# ============================================================

def run_test():

    print()
    print("================================================")
    print("KOD AVIATION ENGINE SANITY TEST")
    print("================================================")
    print()

    # --------------------------------------------------------
    # BUILD TEST OBSERVATION
    # --------------------------------------------------------

    observation = build_test_observation()

    print("OBSERVATION CONTEXT")
    print("-------------------")

    pprint(observation.summary())

    print()
    print("RUNNING AVIATION RECONSTRUCTION...")
    print()

    # --------------------------------------------------------
    # RUN ENGINE
    # --------------------------------------------------------

    candidates = reconstruct_aviation_candidates(
        observation
    )

    # --------------------------------------------------------
    # RESULTS
    # --------------------------------------------------------

    print("AVIATION CANDIDATES")
    print("-------------------")
    print()

    for index, candidate in enumerate(candidates):

        print(f"CANDIDATE #{index + 1}")
        print()

        pprint(candidate.summary())

        print()

        print("MATCH SCORES")
        print("------------")

        pprint(candidate.match_scores)

        print()

        print("STATUS")
        print("------")

        pprint(candidate.status)

        print()

        print("EXPLANATION")
        print("-----------")

        print(candidate.explanation)

        print()
        print("================================================")
        print()

    # --------------------------------------------------------
    # FINAL SUMMARY
    # --------------------------------------------------------

    if candidates:

        best = candidates[0]

        print("TOP MATCH")
        print("---------")
        print()

        pprint(best.summary())

        print()

        print(
            f"Best alignment: "
            f"{round(best.match_scores.overall_alignment * 100, 1)}%"
        )

        print()

    else:

        print("No aviation candidates generated.")
        print()


# ============================================================
# ENTRYPOINT
# ============================================================

if __name__ == "__main__":

    run_test()