"""
PsiQuanta Fusion Scoring Module

Combines intention propagation metrics with domain state metrics
to produce a unified confidence score.

Design constraints:
- deterministic
- no randomness
- pure computation
- replay safe
"""

from dataclasses import dataclass
import math


# --------------------------------------------------
# Data Structures
# --------------------------------------------------

@dataclass
class IntentionMetrics:
    fils: float
    ucip: float
    drift: float
    ttcf: float


@dataclass
class QuantMetrics:
    quant_drift: float
    momentum_alignment: float
    liquidity: float
    volatility: float


@dataclass
class PsiQuantResult:
    psiquant_score: float
    narrative_force: float
    capital_force: float
    chaos_filter: float
    propagation_strength: float
    latency_signal: float


# --------------------------------------------------
# Internal Utilities
# --------------------------------------------------

def _safe(value: float, default: float = 0.0) -> float:
    """
    Ensures deterministic numeric input.
    Converts None, NaN, or invalid values into safe floats.
    """

    try:
        if value is None:
            return default

        v = float(value)

        if math.isnan(v) or math.isinf(v):
            return default

        return v

    except Exception:
        return default


def _clamp(value: float, low: float = -10.0, high: float = 10.0) -> float:
    """
    Prevent runaway values in replay environments.
    """
    return max(low, min(high, value))


# --------------------------------------------------
# PsiQuanta Core
# --------------------------------------------------

def compute_psiquant(intention: IntentionMetrics, quant: QuantMetrics) -> PsiQuantResult:
    """
    Core PsiQuanta fusion calculation.

    Combines narrative propagation force with capital alignment.
    Adds Narrative-Price Latency detection.
    """

    # --------------------------------------------------
    # sanitize inputs
    # --------------------------------------------------

    fils = _safe(intention.fils)
    ucip = _safe(intention.ucip)
    drift = _safe(intention.drift)
    ttcf = _safe(intention.ttcf)

    quant_drift = _safe(quant.quant_drift)
    momentum_alignment = _safe(quant.momentum_alignment)
    liquidity = _safe(quant.liquidity, 1.0)
    volatility = _safe(quant.volatility, 1.0)

    # --------------------------------------------------
    # Narrative Force (corrected model)
    # --------------------------------------------------
    # Base signal exists even without acceleration
    # DRIFT now amplifies rather than gates

    base_signal = fils * ucip
    narrative_force = _clamp(base_signal * (1.0 + drift))

    # --------------------------------------------------
    # Chaos Suppression
    # --------------------------------------------------

    chaos_filter = _clamp(1.0 - ttcf, 0.0, 1.0)

    # --------------------------------------------------
    # Capital Alignment
    # --------------------------------------------------

    capital_force = _clamp(
        quant_drift *
        momentum_alignment *
        liquidity *
        volatility
    )

    # --------------------------------------------------
    # Propagation Strength
    # --------------------------------------------------

    propagation_strength = _clamp(
        narrative_force *
        chaos_filter
    )

    # --------------------------------------------------
    # Narrative-Price Latency Detection
    # --------------------------------------------------

    latency_signal = _clamp(
        narrative_force - capital_force,
        -1.0,
        1.0
    )

    # --------------------------------------------------
    # Final PsiQuant Score
    # --------------------------------------------------

    psiquant_score = _clamp(
        propagation_strength *
        capital_force
    )

    return PsiQuantResult(
        psiquant_score=psiquant_score,
        narrative_force=narrative_force,
        capital_force=capital_force,
        chaos_filter=chaos_filter,
        propagation_strength=propagation_strength,
        latency_signal=latency_signal,
    )