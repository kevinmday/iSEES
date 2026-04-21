# ============================================================
# output/reporter.py
# iSEES-UAP — Phase 9 Output & Reporting Engine (FINAL)
# ============================================================

import json
from datetime import datetime


def build_report(event_name: str,
                 C_values: list,
                 H_values: list,
                 classification: str,
                 flags: dict,
                 vectors: list) -> dict:

    return {
        "event": event_name,
        "timestamp": datetime.utcnow().isoformat(),
        "coherence_flow": {
            "base": C_values[0],
            "phase3": C_values[1],
            "phase5": C_values[2],
            "phase8": C_values[3]
        },
        "entropy_flow": {
            "base": H_values[0],
            "adjusted": H_values[1]
        },
        "classification": classification,
        "flags": flags,
        "top_vectors": [
            {"phrase": v.phrase, "score": v.score}
            for v in vectors[:5]
        ],
        "vector_count": len(vectors)
    }


def explain_classification(C: float, H: float, flags: dict) -> str:

    explanation = []

    # Coherence interpretation
    if C >= 0.5:
        explanation.append("Strong signal coherence detected")
    else:
        explanation.append("Weak signal coherence")

    # Entropy interpretation
    if H < 0.3:
        explanation.append("Low entropy (consistent structure)")
    else:
        explanation.append("High entropy (inconsistent or noisy)")

    # Deception interpretation (FIXED: requires meaningful coherence)
    if "high_deception" in flags and C > 0.2:
        explanation.append("Deception patterns detected")
    elif "moderate_deception" in flags and C > 0.2:
        explanation.append("Possible deception patterns")

    return " | ".join(explanation)


def export_json(report: dict, filename: str):

    with open(filename, "w") as f:
        json.dump(report, f, indent=2)


def export_text(report: dict, filename: str):

    lines = []

    lines.append(f"EVENT: {report['event']}")
    lines.append(f"TIME: {report['timestamp']}")
    lines.append("")

    lines.append("COHERENCE FLOW:")
    for k, v in report["coherence_flow"].items():
        lines.append(f"  {k}: {v}")

    lines.append("")
    lines.append("ENTROPY FLOW:")
    for k, v in report["entropy_flow"].items():
        lines.append(f"  {k}: {v}")

    lines.append("")
    lines.append(f"CLASSIFICATION: {report['classification']}")
    lines.append(f"FLAGS: {report['flags']}")

    lines.append("")
    lines.append("TOP SEARCH VECTORS:")
    for v in report["top_vectors"]:
        lines.append(f"  {v['phrase']} | {v['score']}")

    lines.append("")
    lines.append(f"TOTAL VECTORS: {report['vector_count']}")

    with open(filename, "w") as f:
        f.write("\n".join(lines))