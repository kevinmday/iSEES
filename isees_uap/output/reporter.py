# ============================================================
# output/reporter.py
# iSEES-UAP — Phase 9 Output & Reporting Engine (FINAL — INVESTIGATION MODE)
# ============================================================

import json
from datetime import datetime


# ============================================================
# GAP TYPE INFERENCE (NEW)
# ============================================================
def infer_gap_type(C: float, H: float, flags: dict) -> str:

    if "sparse_sensor" in flags or "sensor_imbalance" in flags:
        return "SENSOR_GAP"

    if "high_deception" in flags:
        return "STRUCTURAL_CONFLICT"

    if H > 0.4:
        return "TEMPORAL_MISALIGNMENT"

    if C < 0.5:
        return "INCOMPLETE_SIGNAL"

    return "RESOLVED_OR_STRONG"


GAP_ACTIONS = {
    "SENSOR_GAP": [
        "Request additional radar tracks from adjacent platforms",
        "Check IR / EO / ESM sensor data",
        "Pull sensor uptime / maintenance logs",
        "Search for reacquisition events in time window"
    ],
    "TEMPORAL_MISALIGNMENT": [
        "Align timestamps across radar, pilot, and comms logs",
        "Check GPS/NTP synchronization",
        "Review comms/audio sequencing"
    ],
    "STRUCTURAL_CONFLICT": [
        "Cross-check pilot reports vs sensor logs",
        "Investigate contradictory tracks",
        "Check for spoofing or decoy indicators"
    ],
    "INCOMPLETE_SIGNAL": [
        "Expand time window (±10–30 minutes)",
        "Query nearby assets for corroboration",
        "Check environmental interference (weather/clutter)"
    ],
    "RESOLVED_OR_STRONG": [
        "Prioritize full data extraction",
        "Correlate across domains for confirmation"
    ]
}


# ============================================================
# BUILD REPORT
# ============================================================
def build_report(event_name: str,
                 C_values: list,
                 H_values: list,
                 classification: str,
                 flags: dict,
                 vectors: list) -> dict:

    C_final = C_values[-1]
    H_final = H_values[-1]

    gap_type = infer_gap_type(C_final, H_final, flags)

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

        # NEW: investigation framing
        "mode": "INVESTIGATION_REQUIRED" if C_final < 0.5 else "RESOLVED",

        "gap_type": gap_type,
        "recommended_actions": GAP_ACTIONS.get(gap_type, []),

        "flags": flags,

        "top_vectors": [
            {"phrase": v.phrase, "score": v.score}
            for v in vectors[:5]
        ],

        "vector_count": len(vectors)
    }


# ============================================================
# EXPLANATION (REWRITTEN — MISSION ALIGNED)
# ============================================================
def explain_classification(C: float, H: float, flags: dict) -> str:

    parts = []

    # Core interpretation shift
    if C < 0.5:
        parts.append("Signal incomplete — additional data likely exists but is missing or uncorrelated")
    else:
        parts.append("Structured signal detected")

    # Entropy meaning
    if H < 0.3:
        parts.append("Low entropy (consistent structure present)")
    else:
        parts.append("High entropy (inconsistent or degraded signal)")

    # Flags meaning
    if "high_deception" in flags and C > 0.2:
        parts.append("Structural conflict detected — investigate discrepancies")
    elif "moderate_deception" in flags and C > 0.2:
        parts.append("Potential inconsistencies present")

    if "sparse_sensor" in flags or "sensor_imbalance" in flags:
        parts.append("Sensor coverage gaps detected")

    return " | ".join(parts)


# ============================================================
# EXPORT JSON
# ============================================================
def export_json(report: dict, filename: str):

    with open(filename, "w") as f:
        json.dump(report, f, indent=2)


# ============================================================
# EXPORT TEXT
# ============================================================
def export_text(report: dict, filename: str):

    lines = []

    lines.append(f"EVENT: {report['event']}")
    lines.append(f"TIME: {report['timestamp']}")
    lines.append("")

    lines.append("MODE:")
    lines.append(f"  {report['mode']}")
    lines.append("")

    lines.append("GAP TYPE:")
    lines.append(f"  {report['gap_type']}")
    lines.append("")

    lines.append("RECOMMENDED ACTIONS:")
    for action in report["recommended_actions"]:
        lines.append(f"  - {action}")

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