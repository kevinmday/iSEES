# ============================================================
# report_factory.py
# iSEES-UAP — DETERMINISTIC TOPOLOGY REPORT FACTORY
# ============================================================

import uuid
import random

from copy import deepcopy
from datetime import datetime, UTC, timedelta

from typing import Dict, List


# ============================================================
# RNG
# ============================================================

DEFAULT_SEED = 42


# ============================================================
# BASE OBSERVATION TEMPLATES
# ============================================================

BASE_REPORTS = {

    # --------------------------------------------------------
    # PIPE / TIC TAC FAMILY
    # --------------------------------------------------------

    "pipe_swarm": {

        "summary":
            "Multiple elongated white objects observed moving silently with coordinated sphere-like objects nearby.",

        "description":
            (
                "Four elongated pipe-shaped objects were observed "
                "surrounded by numerous smaller spheres. "
                "The objects maneuvered silently and appeared "
                "to move in coordinated patterns before "
                "disappearing instantaneously."
            ),

        "narrative":
            (
                "The objects appeared playful in behavior. "
                "No sound was heard. "
                "The departure was instantaneous."
            ),

        "location_name":
            "Medford, Oregon",

        "source":
            "synthetic",

        "observer":
            "civilian_driver",
    },

    # --------------------------------------------------------
    # ORB FAMILY
    # --------------------------------------------------------

    "orb_cluster": {

        "summary":
            "Several luminous spheres observed hovering silently over rural terrain.",

        "description":
            (
                "Bright spherical objects hovered motionless "
                "for several minutes before ascending rapidly "
                "without visible propulsion."
            ),

        "narrative":
            (
                "Witnesses described the objects as silent "
                "and unnaturally stable."
            ),

        "location_name":
            "Yucca Valley, California",

        "source":
            "synthetic",

        "observer":
            "night_hiker",
    },

    # --------------------------------------------------------
    # RANDOM NOISE
    # --------------------------------------------------------

    "noise": {

        "summary":
            "Unknown aerial object observed briefly.",

        "description":
            (
                "A fast-moving light crossed the sky "
                "for several seconds."
            ),

        "narrative":
            (
                "Witness uncertain about object identity."
            ),

        "location_name":
            "Unknown",

        "source":
            "synthetic",

        "observer":
            "unknown_observer",
    }
}


# ============================================================
# GEO FIXTURES
# ============================================================

GEO_FIXTURES = {

    "medford": {
        "lat": 42.3265,
        "lon": -122.8756,
        "location_name": "Medford, Oregon",
    },

    "honolulu": {
        "lat": 21.3069,
        "lon": -157.8583,
        "location_name": "Honolulu, Hawaii",
    },

    "yucca": {
        "lat": 34.1142,
        "lon": -116.4322,
        "location_name": "Yucca Valley, California",
    },

    "london": {
        "lat": 51.5072,
        "lon": -0.1276,
        "location_name": "London, United Kingdom",
    },
}


# ============================================================
# SEMANTIC VARIATIONS
# ============================================================

SEMANTIC_VARIATIONS = {

    "pipe_swarm": [

        (
            "Long white objects maneuvered silently "
            "among smaller luminous spheres."
        ),

        (
            "Elongated aerial objects appeared "
            "to coordinate with glowing orbs."
        ),

        (
            "Several tic tac shaped objects moved "
            "with smaller circular lights nearby."
        ),
    ],

    "orb_cluster": [

        (
            "Bright circular lights hovered "
            "motionless in formation."
        ),

        (
            "Multiple glowing spheres remained "
            "silent while suspended in the sky."
        ),

        (
            "Luminous orb-like objects maintained "
            "stable hovering behavior."
        ),
    ],
}


# ============================================================
# FACTORY
# ============================================================

def create_report(

    template: str,

    seed: int = DEFAULT_SEED,

    geo_fixture: str = "medford",

    hours_offset: int = 0,

    semantic_variation: bool = False,

    observer_id: str = None,

    trust_domain: str = "synthetic",

) -> Dict:

    rng = random.Random(seed)

    if template not in BASE_REPORTS:

        raise ValueError(
            f"Unknown template: {template}"
        )

    report = deepcopy(
        BASE_REPORTS[template]
    )

    # --------------------------------------------------------
    # OBSERVATION ID
    # --------------------------------------------------------

    report["observation_id"] = (
        f"OBS-TEST-{uuid.uuid4().hex[:8]}"
    )

    # --------------------------------------------------------
    # TIMESTAMP
    # --------------------------------------------------------

    timestamp = (
        datetime.now(UTC)
        +
        timedelta(hours=hours_offset)
    )

    report["timestamp_utc"] = (
        timestamp.isoformat()
    )

    # --------------------------------------------------------
    # GEO FIXTURE
    # --------------------------------------------------------

    geo = GEO_FIXTURES.get(
        geo_fixture,
        GEO_FIXTURES["medford"]
    )

    report["lat"] = geo["lat"]

    report["lon"] = geo["lon"]

    report["location_name"] = (
        geo["location_name"]
    )

    # --------------------------------------------------------
    # SEMANTIC VARIATION
    # --------------------------------------------------------

    if semantic_variation:

        variations = SEMANTIC_VARIATIONS.get(
            template,
            []
        )

        if variations:

            report["description"] = (
                rng.choice(variations)
            )

    # --------------------------------------------------------
    # PROVENANCE
    # --------------------------------------------------------

    report["provenance"] = {

        "synthetic": True,

        "fixture": True,

        "replay": False,

        "trust_domain":
            trust_domain,

        "observer_id":
            observer_id
            or
            f"observer-{seed}",

        "observer_mode":
            "topology_validation",

        "environment":
            "topology_harness",
    }

    return report


# ============================================================
# FAMILY GENERATORS
# ============================================================

def create_identical_topology_family(
    count: int = 5
) -> List[Dict]:

    reports = []

    for idx in range(count):

        reports.append(

            create_report(

                template="pipe_swarm",

                seed=100 + idx,

                semantic_variation=True,

                geo_fixture="medford",

                hours_offset=idx,
            )
        )

    return reports


# ============================================================
# CROSS REGION FAMILY
# ============================================================

def create_cross_region_family() -> List[Dict]:

    fixtures = [
        "medford",
        "honolulu",
        "yucca",
        "london",
    ]

    reports = []

    for idx, fixture in enumerate(fixtures):

        reports.append(

            create_report(

                template="pipe_swarm",

                seed=200 + idx,

                semantic_variation=True,

                geo_fixture=fixture,

                hours_offset=idx * 24,
            )
        )

    return reports


# ============================================================
# SEMANTIC COLLISION FAMILY
# ============================================================

def create_semantic_collision_family() -> List[Dict]:

    report_a = create_report(

        template="noise",

        seed=300,

        semantic_variation=False,

        geo_fixture="medford",
    )

    report_b = create_report(

        template="pipe_swarm",

        seed=301,

        semantic_variation=True,

        geo_fixture="medford",
    )

    # --------------------------------------------------------
    # FORCE SEMANTIC OVERLAP
    # --------------------------------------------------------

    report_a["description"] = (
        "Silent silver aerial object observed."
    )

    report_b["description"] = (
        "Silent silver elongated object observed "
        "with coordinated sphere activity."
    )

    return [
        report_a,
        report_b,
    ]


# ============================================================
# RANDOM NOISE FAMILY
# ============================================================

def create_noise_family(
    count: int = 10
) -> List[Dict]:

    fixtures = list(
        GEO_FIXTURES.keys()
    )

    reports = []

    for idx in range(count):

        reports.append(

            create_report(

                template="noise",

                seed=400 + idx,

                semantic_variation=False,

                geo_fixture=random.choice(
                    fixtures
                ),

                hours_offset=random.randint(
                    -240,
                    240
                ),
            )
        )

    return reports


# ============================================================
# SCALE PERSISTENCE FAMILY
# ============================================================

def create_scale_persistence_family() -> List[Dict]:

    reports = []

    # --------------------------------------------------------
    # LOCAL CLUSTER
    # --------------------------------------------------------

    for idx in range(3):

        reports.append(

            create_report(

                template="pipe_swarm",

                seed=500 + idx,

                geo_fixture="medford",

                semantic_variation=True,

                hours_offset=idx,
            )
        )

    # --------------------------------------------------------
    # REGIONAL RECURRENCE
    # --------------------------------------------------------

    for idx in range(3):

        reports.append(

            create_report(

                template="pipe_swarm",

                seed=600 + idx,

                geo_fixture="yucca",

                semantic_variation=True,

                hours_offset=48 + idx,
            )
        )

    # --------------------------------------------------------
    # GLOBAL RECURRENCE
    # --------------------------------------------------------

    reports.append(

        create_report(

            template="pipe_swarm",

            seed=700,

            geo_fixture="honolulu",

            semantic_variation=True,

            hours_offset=240,
        )
    )

    return reports


# ============================================================
# SCENARIO DISPATCH
# ============================================================

def generate_scenario(
    scenario_name: str
) -> List[Dict]:

    if scenario_name == "identical_topology":

        return create_identical_topology_family()

    if scenario_name == "cross_region_resonance":

        return create_cross_region_family()

    if scenario_name == "semantic_collision":

        return create_semantic_collision_family()

    if scenario_name == "random_noise":

        return create_noise_family()

    if scenario_name == "scale_persistence":

        return create_scale_persistence_family()

    raise ValueError(
        f"Unknown scenario: {scenario_name}"
    )


# ============================================================
# DEBUG
# ============================================================

if __name__ == "__main__":

    reports = generate_scenario(
        "identical_topology"
    )

    print(
        f"\nGenerated {len(reports)} reports\n"
    )

    for report in reports:

        print(
            report["observation_id"],
            report["location_name"],
        )