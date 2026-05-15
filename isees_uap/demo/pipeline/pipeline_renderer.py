# ============================================================
# pipeline_renderer.py
# iSEES-UAP — DEMO PIPELINE RENDERER
# MANIFOLD EXECUTION TRACE RENDERING
# FULL DROP-IN REPLACEMENT
# ============================================================

import json

from pathlib import Path
from typing import Dict
from typing import List

from isees_uap.demo.pipeline.pipeline_trace import (
    PipelineTrace,
    run_pipeline_trace,
)


# ============================================================
# ANSI COLORS
# ============================================================

ANSI_RESET = "\033[0m"

ANSI_BLUE = "\033[94m"
ANSI_GREEN = "\033[92m"
ANSI_YELLOW = "\033[93m"
ANSI_RED = "\033[91m"
ANSI_GRAY = "\033[90m"

ANSI_BOLD = "\033[1m"


# ============================================================
# SEVERITY COLOR
# ============================================================

def severity_color(
    severity: str
) -> str:

    severity = severity.upper()

    if severity == "SUCCESS":
        return ANSI_GREEN

    if severity == "WARNING":
        return ANSI_YELLOW

    if severity == "ERROR":
        return ANSI_RED

    return ANSI_BLUE


# ============================================================
# STAGE RENDER
# ============================================================

def render_stage(
    entry: Dict
):

    color = severity_color(
        entry["severity"]
    )

    print()

    print(
        f"{ANSI_BOLD}"
        f"{color}"
        f"[{entry['category']}] "
        f"{entry['title']}"
        f"{ANSI_RESET}"
    )

    print(
        f"{ANSI_GRAY}"
        f"STATUS:"
        f"{ANSI_RESET} "
        f"{entry['status_text']}"
    )

    print()

    for line in entry["detail_lines"]:

        print(
            f"  {color}•{ANSI_RESET} "
            f"{line}"
        )

    print()

    print(
        f"{ANSI_GRAY}"
        f"DURATION:"
        f"{ANSI_RESET} "
        f"{entry['duration_ms']}ms"
    )

    print(
        f"{ANSI_GRAY}"
        f"STARTED:"
        f"{ANSI_RESET} "
        f"{entry['started_at']}"
    )

    print(
        f"{ANSI_GRAY}"
        f"COMPLETED:"
        f"{ANSI_RESET} "
        f"{entry['completed_at']}"
    )


# ============================================================
# TRACE RENDER
# ============================================================

def render_trace(
    trace: PipelineTrace
):

    payload = trace.to_dict()

    print()

    print(
        f"{ANSI_BOLD}"
        f"{ANSI_GREEN}"
        f"============================================================"
        f"{ANSI_RESET}"
    )

    print(
        f"{ANSI_BOLD}"
        f"{ANSI_GREEN}"
        f"iSEES MANIFOLD EXECUTION TRACE"
        f"{ANSI_RESET}"
    )

    print(
        f"{ANSI_BOLD}"
        f"{ANSI_GREEN}"
        f"============================================================"
        f"{ANSI_RESET}"
    )

    print()

    print(
        f"{ANSI_GRAY}"
        f"TRACE ID:"
        f"{ANSI_RESET} "
        f"{payload['trace_id']}"
    )

    print(
        f"{ANSI_GRAY}"
        f"OBSERVATION:"
        f"{ANSI_RESET} "
        f"{payload['observation_id']}"
    )

    print(
        f"{ANSI_GRAY}"
        f"CREATED:"
        f"{ANSI_RESET} "
        f"{payload['created_at']}"
    )

    print()

    for entry in payload["entries"]:

        render_stage(entry)

    print()

    print(
        f"{ANSI_BOLD}"
        f"{ANSI_GREEN}"
        f"============================================================"
        f"{ANSI_RESET}"
    )

    print(
        f"{ANSI_BOLD}"
        f"{ANSI_GREEN}"
        f"PIPELINE COMPLETE"
        f"{ANSI_RESET}"
    )

    print(
        f"{ANSI_BOLD}"
        f"{ANSI_GREEN}"
        f"============================================================"
        f"{ANSI_RESET}"
    )

    print()


# ============================================================
# SAVE RENDER
# ============================================================

def save_rendered_trace(
    trace: PipelineTrace,
    output_path: str,
):

    payload = trace.to_dict()

    path = Path(output_path)

    path.parent.mkdir(
        parents=True,
        exist_ok=True,
    )

    with open(
        path,
        "w",
        encoding="utf-8",
    ) as f:

        json.dump(
            payload,
            f,
            indent=2,
        )

    return str(path)


# ============================================================
# TRACE SUMMARY
# ============================================================

def render_summary(
    trace: PipelineTrace
):

    summary = trace.build_summary()

    print()

    print(
        f"{ANSI_BOLD}"
        f"{ANSI_BLUE}"
        f"TRACE SUMMARY"
        f"{ANSI_RESET}"
    )

    print()

    print(
        json.dumps(
            summary,
            indent=2,
        )
    )

    print()


# ============================================================
# DEMO RUNNER
# ============================================================

def run_demo_render(
    observation_id: str = "OBS-DEMO-001"
):

    trace = run_pipeline_trace(
        observation_id=
            observation_id
    )

    render_trace(trace)

    render_summary(trace)

    saved_path = trace.save()

    print(
        f"{ANSI_GRAY}"
        f"TRACE SAVED:"
        f"{ANSI_RESET} "
        f"{saved_path}"
    )

    print()

    return trace


# ============================================================
# CLI
# ============================================================

if __name__ == "__main__":

    run_demo_render()