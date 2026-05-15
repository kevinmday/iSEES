# ============================================================
# pipeline_trace.py
# iSEES-UAP — DEMO PIPELINE TRACE ENGINE
# MANIFOLD EXECUTION TRACE
# FULL DROP-IN REPLACEMENT
# ============================================================

import json
import time

from datetime import datetime, UTC
from pathlib import Path
from typing import Dict
from typing import List
from typing import Optional

from isees_uap.demo.pipeline.pipeline_stages import (
    PipelineStage,
    get_pipeline_sequence,
)


# ============================================================
# TRACE ENTRY
# ============================================================

class TraceEntry:

    def __init__(
        self,
        stage: PipelineStage,
        started_at: str,
        completed_at: str,
        duration_ms: int,
    ):

        self.stage = stage

        self.started_at = started_at

        self.completed_at = completed_at

        self.duration_ms = duration_ms

    # --------------------------------------------------------
    # SERIALIZATION
    # --------------------------------------------------------

    def to_dict(self) -> Dict:

        return {

            "id":
                self.stage.id,

            "title":
                self.stage.title,

            "category":
                self.stage.category,

            "severity":
                self.stage.severity,

            "status_text":
                self.stage.status_text,

            "detail_lines":
                self.stage.detail_lines,

            "started_at":
                self.started_at,

            "completed_at":
                self.completed_at,

            "duration_ms":
                self.duration_ms,
        }


# ============================================================
# TRACE ENGINE
# ============================================================

class PipelineTrace:

    def __init__(
        self,
        observation_id: str,
    ):

        self.observation_id = observation_id

        self.trace_id = (
            f"TRACE-{observation_id}"
        )

        self.created_at = utc_now()

        self.entries: List[
            TraceEntry
        ] = []

    # --------------------------------------------------------
    # EXECUTE PIPELINE
    # --------------------------------------------------------

    def execute(
        self,
        simulate_latency: bool = True,
    ) -> List[TraceEntry]:

        stages = get_pipeline_sequence()

        for stage in stages:

            started = utc_now()

            if simulate_latency:

                time.sleep(
                    stage.duration_ms / 1000
                )

            completed = utc_now()

            entry = TraceEntry(

                stage=stage,

                started_at=started,

                completed_at=completed,

                duration_ms=stage.duration_ms,
            )

            self.entries.append(entry)

            self.emit_console(entry)

        return self.entries

    # --------------------------------------------------------
    # CONSOLE TRACE
    # --------------------------------------------------------

    def emit_console(
        self,
        entry: TraceEntry,
    ):

        print()

        print(
            f"[{entry.stage.category}] "
            f"{entry.stage.title}"
        )

        print(
            f"STATUS: "
            f"{entry.stage.status_text}"
        )

        for line in entry.stage.detail_lines:

            print(f"  • {line}")

        print(
            f"DURATION: "
            f"{entry.duration_ms}ms"
        )

    # --------------------------------------------------------
    # EXPORT
    # --------------------------------------------------------

    def to_dict(self) -> Dict:

        return {

            "trace_id":
                self.trace_id,

            "observation_id":
                self.observation_id,

            "created_at":
                self.created_at,

            "entries": [

                entry.to_dict()
                for entry in self.entries
            ],
        }

    # --------------------------------------------------------
    # SAVE
    # --------------------------------------------------------

    def save(
        self,
        output_path: Optional[str] = None,
    ) -> str:

        if output_path is None:

            output_path = (
                f"isees_uap/demo/logs/"
                f"{self.trace_id}.json"
            )

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

                self.to_dict(),

                f,

                indent=2,
            )

        return str(path)

    # --------------------------------------------------------
    # SUMMARY
    # --------------------------------------------------------

    def build_summary(self) -> Dict:

        total_duration = sum(
            e.duration_ms
            for e in self.entries
        )

        return {

            "trace_id":
                self.trace_id,

            "observation_id":
                self.observation_id,

            "stage_count":
                len(self.entries),

            "total_duration_ms":
                total_duration,

            "completed":
                len(self.entries) > 0,
        }


# ============================================================
# HELPERS
# ============================================================

def utc_now() -> str:

    return datetime.now(
        UTC
    ).isoformat()


# ============================================================
# FACTORY
# ============================================================

def run_pipeline_trace(
    observation_id: str,
    simulate_latency: bool = True,
) -> PipelineTrace:

    trace = PipelineTrace(
        observation_id=observation_id
    )

    trace.execute(
        simulate_latency=
            simulate_latency
    )

    return trace


# ============================================================
# CLI TEST
# ============================================================

if __name__ == "__main__":

    print(
        "\n=== iSEES MANIFOLD EXECUTION TRACE ==="
    )

    trace = run_pipeline_trace(
        observation_id=
            "OBS-DEMO-001"
    )

    print()

    print(
        "=== TRACE SUMMARY ==="
    )

    print(
        json.dumps(
            trace.build_summary(),
            indent=2,
        )
    )

    saved_path = trace.save()

    print()

    print(
        f"Trace saved to: {saved_path}"
    )