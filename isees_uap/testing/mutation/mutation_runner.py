# ============================================================
# mutation_runner.py
# Synthetic Mutation Injection Runner
#
# IMPORTANT:
# TEST INPUT ONLY
# DOES NOT MODIFY PRODUCTION PIPELINE LOGIC
# ============================================================

import json
import requests

from isees_uap.testing.mutation.scenarios.single_event_semantic_drift import (
    generate_scenario
)


# ------------------------------------------------------------
# CONFIG
# ------------------------------------------------------------

API_ENDPOINT = "http://127.0.0.1:8001/submit-report"


# ------------------------------------------------------------
# BUILD PAYLOAD
# ------------------------------------------------------------

def build_payload(report):

    observer = report.get("observer", {})
    report_data = report.get("report", {})

    payload = {

        "source": "synthetic_mutation_harness",

        "observer_type":
            observer.get("observer_type"),

        "description":
            report_data.get("description"),

        "location":
            report_data.get("location", {}).get("name"),

        "lat":
            report_data.get("location", {}).get("lat"),

        "lon":
            report_data.get("location", {}).get("lon"),

        "timestamp_utc":
            report_data.get("timestamp_utc"),

        "mutation_metadata":
            report.get("mutation_metadata", {})
    }

    return payload


# ------------------------------------------------------------
# POST REPORT
# ------------------------------------------------------------

def submit_report(payload):

    response = requests.post(
        API_ENDPOINT,
        json=payload,
        timeout=10
    )

    return response


# ------------------------------------------------------------
# RUN SCENARIO
# ------------------------------------------------------------

def run():

    print()
    print("=" * 60)
    print("SYNTHETIC MUTATION HARNESS")
    print("=" * 60)

    reports = generate_scenario()

    for idx, report in enumerate(reports, start=1):

        payload = build_payload(report)

        print()
        print("-" * 60)
        print(f"Submitting synthetic report {idx}")
        print("-" * 60)

        print(json.dumps(payload, indent=2))

        try:

            response = submit_report(payload)

            print()
            print(f"HTTP STATUS: {response.status_code}")

            try:
                print(response.json())
            except Exception:
                print(response.text)

        except Exception as e:

            print()
            print("SUBMISSION FAILED")
            print(str(e))


# ------------------------------------------------------------
# ENTRY
# ------------------------------------------------------------

if __name__ == "__main__":
    run()