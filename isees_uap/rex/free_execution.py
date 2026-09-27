from __future__ import annotations

from dataclasses import dataclass
from typing import Mapping
import os


@dataclass(frozen=True, slots=True)
class FreeRexSettings:
    enabled: bool
    maximum_jobs_per_account: int
    maximum_jobs_per_investigation: int
    maximum_queries: int
    maximum_results_per_query: int
    timeout_seconds: int

    @classmethod
    def from_environment(cls, environment: Mapping[str, str] | None = None) -> "FreeRexSettings":
        values = os.environ if environment is None else environment
        enabled = values.get("ISEES_REX_FREE_ENABLED") == "true"
        names = {
            "maximum_jobs_per_account": "ISEES_REX_FREE_MAX_ACCOUNT_JOBS",
            "maximum_jobs_per_investigation": "ISEES_REX_FREE_MAX_INVESTIGATION_JOBS",
            "maximum_queries": "ISEES_REX_FREE_MAX_QUERIES",
            "maximum_results_per_query": "ISEES_REX_FREE_MAX_RESULTS_PER_QUERY",
            "timeout_seconds": "ISEES_REX_FREE_TIMEOUT_SECONDS",
        }
        if all(values.get(name) is None for name in names.values()):
            return cls(False, 1, 1, 1, 1, 10)
        parsed: dict[str, int] = {}
        try:
            for field, name in names.items():
                raw = values.get(name)
                if raw is None or int(raw) <= 0:
                    raise ValueError(name)
                parsed[field] = int(raw)
        except ValueError as error:
            raise RuntimeError("Free REX configuration is incomplete or invalid") from error
        if (parsed["maximum_queries"] > 4 or parsed["maximum_results_per_query"] > 10
                or parsed["timeout_seconds"] > 10):
            raise RuntimeError("Free REX configuration exceeds hard safety ceilings")
        return cls(enabled=enabled, **parsed)
