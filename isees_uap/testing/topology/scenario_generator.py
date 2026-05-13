# ============================================================
# scenario_generator.py
# iSEES-UAP — TOPOLOGY VALIDATION SCENARIO GENERATOR
# ============================================================

import json
import os

from datetime import datetime, UTC
from typing import Dict, List

from isees_uap.testing.topology.report_factory import (
    generate_scenario,
)

from isees_uap.emergence.attribute_extractor import (
    extract_attributes,
)

from isees_uap.emergence.signature_engine import (
    build_signature,
)

from isees_uap.emergence.entanglement_engine import (
    compute_entanglement,
)


# ============================================================
# PATHS
# ============================================================

BASE_DIR = os.path.dirname(__file__)

LOG_DIR = os.path.join(
    BASE_DIR,
    "logs"
)

SCENARIO_DIR = os.path.join(
    BASE_DIR,
    "scenarios"
)

os.makedirs(
    LOG_DIR,
    exist_ok=True
)


# ============================================================
# SCENARIO EXECUTION
# ============================================================

def execute_scenario(
    scenario_name: str
) -> Dict:

    reports = generate_scenario(
        scenario_name
    )

    processed_reports = []

    # --------------------------------------------------------
    # PROCESS REPORTS
    # --------------------------------------------------------

    for report in reports:

        combined_text = build_text_payload(
            report
        )

        attributes = extract_attributes(
            combined_text
        )

        signature = build_signature(
            attributes
        )

        signature["attributes"] = (
            attributes
        )

        report["emergence"] = {

            "attributes":
                attributes,

            "signature":
                signature
        }

        processed_reports.append(
            report
        )

    # --------------------------------------------------------
    # PAIRWISE ENTANGLEMENT
    # --------------------------------------------------------

    entanglements = []

    for idx_a in range(
        len(processed_reports)
    ):

        for idx_b in range(
            idx_a + 1,
            len(processed_reports)
        ):

            report_a = processed_reports[
                idx_a
            ]

            report_b = processed_reports[
                idx_b
            ]

            signature_a = report_a[
                "emergence"
            ]["signature"]

            signature_b = report_b[
                "emergence"
            ]["signature"]

            geo_distance = estimate_geo_distance(
                report_a,
                report_b
            )

            time_delta = estimate_time_delta(
                report_a,
                report_b
            )

            result = compute_entanglement(

                signature_a=signature_a,

                signature_b=signature_b,

                geo_distance_km=
                    geo_distance,

                time_delta_hours=
                    time_delta
            )

            entanglements.append({

                "observation_a":
                    report_a[
                        "observation_id"
                    ],

                "observation_b":
                    report_b[
                        "observation_id"
                    ],

                "geo_distance_km":
                    geo_distance,

                "time_delta_hours":
                    time_delta,

                "result":
                    result
            })

    # --------------------------------------------------------
    # BUILD SUMMARY
    # --------------------------------------------------------

    summary = build_summary(
        processed_reports,
        entanglements
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

        "reports":
            processed_reports,

        "entanglements":
            entanglements
    }

    # --------------------------------------------------------
    # SAVE LOG
    # --------------------------------------------------------

    save_log(
        scenario_name,
        output
    )

    return output


# ============================================================
# TEXT PAYLOAD
# ============================================================

def build_text_payload(
    report: Dict
) -> str:

    parts = []

    for key in [
        "summary",
        "description",
        "narrative",
    ]:

        value = report.get(key)

        if value:
            parts.append(
                str(value)
            )

    return " ".join(parts)


# ============================================================
# GEO DISTANCE
# ============================================================

def estimate_geo_distance(
    report_a: Dict,
    report_b: Dict
) -> float:

    lat_a = report_a.get("lat")
    lon_a = report_a.get("lon")

    lat_b = report_b.get("lat")
    lon_b = report_b.get("lon")

    if None in [
        lat_a,
        lon_a,
        lat_b,
        lon_b,
    ]:

        return 0.0

    # --------------------------------------------------------
    # SIMPLE APPROXIMATION
    # --------------------------------------------------------

    dx = abs(lat_a - lat_b)

    dy = abs(lon_a - lon_b)

    return round(
        ((dx ** 2 + dy ** 2) ** 0.5)
        * 111,
        2,
    )


# ============================================================
# TIME DELTA
# ============================================================

def estimate_time_delta(
    report_a: Dict,
    report_b: Dict
) -> float:

    try:

        ts_a = datetime.fromisoformat(
            report_a[
                "timestamp_utc"
            ]
        )

        ts_b = datetime.fromisoformat(
            report_b[
                "timestamp_utc"
            ]
        )

        delta = abs(
            (ts_a - ts_b)
            .total_seconds()
        )

        return round(
            delta / 3600,
            2,
        )

    except Exception:

        return 0.0


# ============================================================
# SUMMARY
# ============================================================

def build_summary(
    reports: List[Dict],
    entanglements: List[Dict]
) -> Dict:

    all_attributes = []

    uniqueness_scores = []

    rarity_scores = []

    specificity_scores = []

    entanglement_scores = []

    relation_types = []

    # --------------------------------------------------------
    # REPORT ANALYSIS
    # --------------------------------------------------------

    for report in reports:

        emergence = report.get(
            "emergence",
            {}
        )

        attributes = emergence.get(
            "attributes",
            []
        )

        signature = emergence.get(
            "signature",
            {}
        )

        for attribute in attributes:

            attribute_id = attribute.get(
                "attribute_id"
            )

            if attribute_id:

                all_attributes.append(
                    attribute_id
                )

        uniqueness_scores.append(

            signature.get(
                "signature_uniqueness",
                0.0
            )
        )

        rarity_scores.append(

            signature.get(
                "signature_rarity",
                0.0
            )
        )

        specificity_scores.append(

            signature.get(
                "signature_specificity",
                0.0
            )
        )

    # --------------------------------------------------------
    # ENTANGLEMENT ANALYSIS
    # --------------------------------------------------------

    for item in entanglements:

        result = item["result"]

        entanglement_scores.append(

            result.get(
                "entanglement_score",
                0.0
            )
        )

        relation_types.append(

            result.get(
                "relation_type",
                "unknown"
            )
        )

    # --------------------------------------------------------
    # BUILD SUMMARY
    # --------------------------------------------------------

    return {

        "report_count":
            len(reports),

        "entanglement_count":
            len(entanglements),

        "unique_attributes":
            sorted(
                list(
                    set(all_attributes)
                )
            ),

        "attribute_count":
            len(
                set(all_attributes)
            ),

        "avg_signature_uniqueness":
            average(
                uniqueness_scores
            ),

        "avg_signature_rarity":
            average(
                rarity_scores
            ),

        "avg_signature_specificity":
            average(
                specificity_scores
            ),

        "avg_entanglement_score":
            average(
                entanglement_scores
            ),

        "relation_types":
            sorted(
                list(
                    set(
                        relation_types
                    )
                )
            )
    }


# ============================================================
# SAVE LOG
# ============================================================

def save_log(
    scenario_name: str,
    payload: Dict
) -> None:

    timestamp = datetime.now(
        UTC
    ).strftime(
        "%Y%m%d_%H%M%S"
    )

    filename = (
        f"{scenario_name}_{timestamp}.json"
    )

    path = os.path.join(
        LOG_DIR,
        filename
    )

    with open(
        path,
        "w",
        encoding="utf-8"
    ) as f:

        json.dump(
            payload,
            f,
            indent=2
        )

    print(
        f"[SCENARIO_LOGGED] {path}"
    )


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


# ============================================================
# CLI
# ============================================================

if __name__ == "__main__":

    scenarios = [

        "identical_topology",

        "semantic_collision",

        "cross_region_resonance",

        "random_noise",

        "scale_persistence",
    ]

    for scenario in scenarios:

        print(
            f"\n=== RUNNING: {scenario} ==="
        )

        result = execute_scenario(
            scenario
        )

        print(
            json.dumps(
                result["summary"],
                indent=2
            )
        )