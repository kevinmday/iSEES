# ============================================================
# submit_report.py — REPORT INTAKE PIPELINE (V3)
# (WITH GEO + CONTACT + INVESTIGATION LOG + GEO PERSISTENCE)
# ============================================================

import uuid
from datetime import datetime, UTC
from typing import Dict

from isees_uap.geo.resolver import resolve_location_to_assets
from isees_uap.investigation.investigation_log import (
    create_log,
    add_entry,
    get_log,
)


def _generate_report_id() -> str:
    return f"UAP-{datetime.now(UTC).strftime('%Y%m%d')}-{str(uuid.uuid4())[:6]}"


def build_report(payload: Dict) -> Dict:
    """
    Main report builder (entry point)
    """

    location = payload.get("location", "UNKNOWN")

    report_id = _generate_report_id()

    # --------------------------------------------------------
    # BASE REPORT STRUCTURE
    # --------------------------------------------------------
    report = {
        "report_id": report_id,
        "timestamp_utc": datetime.now(UTC).isoformat(),
        "event": {
            "location": {
                "name": location
            }
        }
    }

    # ========================================================
    # AUTO-INJECT: GEO + CONTACT
    # ========================================================

    geo = resolve_location_to_assets(location)

    report["geo_context"] = {
        "facilities": geo.get("facilities", []),
        "ranked_contacts": geo.get("ranked_contacts", []),
        "primary_contact": geo.get("primary_contact"),

        # REAL GEO CENTER (used by cluster engine)
        "center": {
            "lat": geo.get("lat"),
            "lon": geo.get("lon")
        }
    }

    # --------------------------------------------------------
    # INVESTIGATION LOG AUTO-INIT (WITH GEO PERSISTENCE)
    # --------------------------------------------------------

    create_log(
        report_id,
        geo_context=report["geo_context"]  # 🔥 critical fix
    )

    primary = geo.get("primary_contact")

    if primary:
        add_entry(
            report_id=report_id,
            action="contacted_atc" if primary.get("type") == "ATC" else "initial_contact",
            target=primary.get("name"),
            result="pending",
            notes="Auto-seeded from report intake"
        )

    # ========================================================
    # EMBED INVESTIGATION LOG INTO REPORT OUTPUT
    # ========================================================

    report["investigation_log"] = get_log(report_id)

    return report


# ------------------------------------------------------------
# TEST ENTRY POINT
# ------------------------------------------------------------

if __name__ == "__main__":
    test_payload = {
        "location": "Medford, OR"
    }

    report = build_report(test_payload)

    import json
    print(json.dumps(report, indent=2))