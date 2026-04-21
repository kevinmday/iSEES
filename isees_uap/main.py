# ============================================================
# isees_uap/main.py
# iSEES-UAP — CLI Entry Point (FINAL — INVESTIGATION MODE)
# ============================================================

import argparse
import os

from isees_uap_v0_baseline import ISEES_UAP
from input.case_loader import load_case

from output.reporter import build_report, explain_classification, export_text


# ============================================================
# SINGLE CASE RUN
# ============================================================
def run_single(case_path):

    engine = ISEES_UAP()

    s, r, e = load_case(case_path)
    result = engine.run(s, r, e)

    event_name = os.path.basename(case_path).replace(".json", "").upper()

    # Build report (simple flow — no mitigation layers here)
    report = build_report(
        event_name=event_name,
        C_values=[result.coherence, result.coherence, result.coherence, result.coherence],
        H_values=[result.entropy, result.entropy],
        classification=result.classification,
        flags={},  # mitigation not wired here yet
        vectors=result.search_vectors
    )

    explanation = explain_classification(
        result.coherence,
        result.entropy,
        {}
    )

    # ===== OUTPUT =====
    print(f"\nEVENT: {report['event']}")

    print("\nMODE:")
    print(f"  {report['mode']}")

    print("\nGAP TYPE:")
    print(f"  {report['gap_type']}")

    print("\nRECOMMENDED ACTIONS:")
    for action in report["recommended_actions"]:
        print(f"  - {action}")

    print("\nCOHERENCE / ENTROPY:")
    print(f"  C: {result.coherence}")
    print(f"  H: {result.entropy}")

    print("\nCLASSIFICATION:")
    print(f"  {report['classification']}")

    print("\nEXPLANATION:")
    print(f"  {explanation}")

    print("\nTOP SEARCH VECTORS:")
    for v in report["top_vectors"]:
        print(f"  - {v['phrase']} | {v['score']}")

    # Save report
    output_path = f"output/{event_name.lower()}_report.txt"
    export_text(report, output_path)

    print(f"\nReport saved to: {output_path}")


# ============================================================
# BATCH RUN
# ============================================================
def run_batch_dir(directory):

    for filename in os.listdir(directory):
        if filename.endswith(".json"):
            run_single(os.path.join(directory, filename))


# ============================================================
# CLI ENTRY
# ============================================================
if __name__ == "__main__":

    parser = argparse.ArgumentParser()

    parser.add_argument("--case", help="Run single case file")
    parser.add_argument("--batch", help="Run batch directory")

    args = parser.parse_args()

    if args.case:
        run_single(args.case)

    elif args.batch:
        run_batch_dir(args.batch)

    else:
        print("Use --case or --batch")