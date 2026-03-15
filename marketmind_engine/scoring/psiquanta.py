"""
PsiQuanta Fusion Scoring Module

Combines intention propagation metrics with capital propagation metrics
to produce a unified confidence score.

Updated model:

Signal = NarrativeForce + CapitalForce + Interaction

This removes the previous hard gate where both fields were required.

Design constraints:
- deterministic
- no randomness
- pure computation
- replay safe
"""

from dataclasses import dataclass
import math


# --------------------------------------------------
# Tunable Constants
# --------------------------------------------------

# Drift amplification so narrative slope meaningfully influences signal
DRIFT_GAIN = 50.0


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

    Updated fusion model allows either field to activate signal.
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
    # Narrative Force
    # --------------------------------------------------

    # Prevent narrative collapse by preserving FILS magnitude
    base_signal = fils * (1.0 + ucip)

    # amplify drift so narrative slope has visible influence
    drift_effect = drift * DRIFT_GAIN

    narrative_force = _clamp(
        base_signal * (1.0 + drift_effect)
    )

    # --------------------------------------------------
    # Chaos Suppression
    # --------------------------------------------------

    chaos_filter = _clamp(
        1.0 - ttcf,
        0.0,
        1.0
    )

    # --------------------------------------------------
    # Capital Force
    # --------------------------------------------------

    capital_force = _clamp(
        quant_drift *
        momentum_alignment *
        liquidity *
        volatility
    )

    # --------------------------------------------------
    # Propagation Strength (Narrative field stability)
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
    # Dual-Field Fusion Model
    # --------------------------------------------------

    interaction = narrative_force * capital_force

    psiquant_score = _clamp(
        narrative_force
        + capital_force
        + interaction
    )

    return PsiQuantResult(
        psiquant_score=psiquant_score,
        narrative_force=narrative_force,
        capital_force=capital_force,
        chaos_filter=chaos_filter,
        propagation_strength=propagation_strength,
        latency_signal=latency_signal,
    )