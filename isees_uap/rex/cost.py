from __future__ import annotations

from typing import Any, Protocol

from .contracts import CostEstimate


class CostEstimator(Protocol):
    def estimate(self, proposal: Any) -> CostEstimate: ...


class ZeroCostEstimator:
    def estimate(self, proposal: Any) -> CostEstimate:
        return CostEstimate(compute_micros=0, ai_micros=0, source_micros=0,
                            storage_micros=0, network_micros=0, total_micros=0,
                            estimator_version="rex-zero-cost/v1")
