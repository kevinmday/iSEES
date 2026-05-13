# ============================================================
# signature_validator.py
# iSEES-UAP — SIGNATURE VALIDATION ENGINE
# ============================================================

import json

from datetime import datetime, UTC
from typing import Dict, List

from isees_uap.testing.topology.scenario_generator import (
    execute_scenario,
)


# ============================================================
# VALIDATION THRESHOLDS
# ============================================================

THRESHOLDS = {

    "identical_topology": {

        "min_overlap": 0.60,

        "min_entanglement": 0.55,

        "expected_relation":
            "local_relation",
    },

    "cross_region_resonance": {

        "min_overlap": 0.45,

        "min_entanglement": 0.50,

        "expected_relation":
            "entangled_relation",
    },

    "semantic_collision": {

        "max_overlap": 0.35,

        "max_entanglement": 0.40,
    },

    "random_noise": {

        "max_overlap": 0.20,

        "max_entanglement": 0.25,
    },

    "scale_persistence": {

        "min_overlap": 0.50,

        "min_entanglement": 0.50,
    }
}


# ============================================================
# PRIMARY VALIDATION
# ============================================================

def validate_scenario(
    scenario_name: str
) -> Dict:

    payload = execute_scenario(
        scenario_name
    )

    entanglements = payload.get(
        "entanglements",
        []
    )

    scenario_rules = THRESHOLDS.get(
        scenario_name,
        {}
    )

    validations = []

    # --------------------------------------------------------
    # PAIR VALIDATION
    # --------------------------------------------------------

    for item in entanglements:

        result = item.get(
            "result",
            {}
        )

        overlap = result.get(
            "overlap_ratio",
            0.0
        )

        entanglement = result.get(
            "entanglement_score",
            0.0
        )

        relation_type = result.get(
            "relation_type"
        )

        passed = True

        reasons = []

        # ----------------------------------------------------
        # MIN OVERLAP
        # ----------------------------------------------------

        min_overlap = scenario_rules.get(
            "min_overlap"
        )

        if min_overlap is not None:

            if overlap < min_overlap:

                passed = False

                reasons.append(

                    f"overlap<{min_overlap}"
                )

        # ----------------------------------------------------
        # MAX OVERLAP
        # ----------------------------------------------------

        max_overlap = scenario_rules.get(
            "max_overlap"
        )

        if max_overlap is not None:

            if overlap > max_overlap:

                passed = False

                reasons.append(

                    f"overlap>{max_overlap}"
                )

        # ----------------------------------------------------
        # MIN ENTANGLEMENT
        # ----------------------------------------------------

        min_entanglement = scenario_rules.get(
            "min_entanglement"
        )

        if min_entanglement is not None:

            if entanglement < min_entanglement:

                passed = False

                reasons.append(

                    f"entanglement<{min_entanglement}"
                )

        # ----------------------------------------------------
        # MAX ENTANGLEMENT
        # ----------------------------------------------------

        max_entanglement = scenario_rules.get(
            "max_entanglement"
        )

        if max_entanglement is not None:

            if entanglement > max_entanglement:

                passed = False

                reasons.append(

                    f"entanglement>{max_entanglement}"
                )

        # ----------------------------------------------------
        # RELATION TYPE
        # ----------------------------------------------------

        expected_relation = scenario_rules.get(
            "expected_relation"
        )

        if expected_relation:

            if relation_type != expected_relation:

                passed = False

                reasons.append(

                    f"relation!={expected_relation}"
                )

        validations.append({

            "observation_a":
                item["observation_a"],

            "observation_b":
                item["observation_b"],

            "overlap_ratio":
                overlap,

            "entanglement_score":
                entanglement,

            "relation_type":
                relation_type,

            "passed":
                passed,

            "reasons":
                reasons
        })

    # --------------------------------------------------------
    # BUILD SUMMARY
    # --------------------------------------------------------

    summary = build_validation_summary(
        scenario_name,
        validations
    )

    output = {

        "scenario":
            scenario_name,

        "generated_at":
            datetime.now(
                UTC
            ).isoformat(),

        "summary":
            summary,

        "validations":
            validations
    }

    return output


# ============================================================
# SUMMARY
# ============================================================

def build_validation_summary(
    scenario_name: str,
    validations: List[Dict]
) -> Dict:

    total = len(validations)

    passed = len([
        v for v in validations
        if v["passed"]
    ])

    failed = total - passed

    overlap_values = [

        v["overlap_ratio"]
        for v in validations
    ]

    entanglement_values = [

        v["entanglement_score"]
        for v in validations
    ]

    relation_types = sorted(
        list(
            set([
                v["relation_type"]
                for v in validations
            ])
        )
    )

    return {

        "scenario":
            scenario_name,

        "total_pairs":
            total,

        "passed":
            passed,

        "failed":
            failed,

        "pass_rate":
            percentage(
                passed,
                total
            ),

        "avg_overlap":
            average(
                overlap_values
            ),

        "avg_entanglement":
            average(
                entanglement_values
            ),

        "relation_types":
            relation_types
    }


# ============================================================
# HELPERS
# ============================================================

def average(
    values: List[float]
) -> float:

    if not values:
        return 0.0

    return round(
        sum(values)
        / len(values),
        3,
    )


def percentage(
    value: int,
    total: int
) -> float:

    if total <= 0:
        return 0.0

    return round(
        (value / total) * 100,
        2,
    )


# ============================================================
# MULTI-SCENARIO VALIDATION
# ============================================================

def validate_all() -> Dict:

    scenarios = [

        "identical_topology",

        "semantic_collision",

        "cross_region_resonance",

        "random_noise",

        "scale_persistence",
    ]

    results = []

    for scenario in scenarios:

        print(
            f"\n=== VALIDATING: {scenario} ==="
        )

        result = validate_scenario(
            scenario
        )

        results.append(result)

        print(
            json.dumps(
                result["summary"],
                indent=2
            )
        )

    return {

        "generated_at":
            datetime.now(
                UTC
            ).isoformat(),

        "results":
            results
    }


# ============================================================
# CLI
# ============================================================

if __name__ == "__main__":

    output = validate_all()

    print(
        "\n=== VALIDATION COMPLETE ==="
    )

    print(
        json.dumps(
            output,
            indent=2
        )
    )