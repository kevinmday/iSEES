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


# --------------------------------------------------
# Internal Utilities
# --------------------------------------------------

def _safe(value: float, default: float = 0.0) -> float:
    """
    Ensures deterministic numeric input.
    Converts None or invalid values into a safe float.
    """
    try:
        if value is None:
            return default
        return float(value)
    except Exception:
        return default


# --------------------------------------------------
# PsiQuanta Core
# --------------------------------------------------

def compute_psiquant(intention: IntentionMetrics, quant: QuantMetrics) -> PsiQuantResult:
    """
    Core PsiQuanta fusion calculation.
    """

    # --- sanitize inputs ---
    fils = _safe(intention.fils)
    ucip = _safe(intention.ucip)
    drift = _safe(intention.drift)
    ttcf = _safe(intention.ttcf)

    quant_drift = _safe(quant.quant_drift)
    momentum_alignment = _safe(quant.momentum_alignment)
    liquidity = _safe(quant.liquidity, 1.0)
    volatility = _safe(quant.volatility, 1.0)

    # --- Narrative Force ---
    narrative_force = fils * ucip * drift

    # --- Chaos Suppression ---
    chaos_filter = max(0.0, 1.0 - ttcf)

    # --- Capital Alignment ---
    capital_force = (
        quant_drift *
        momentum_alignment *
        liquidity *
        volatility
    )

    # --- Final PsiQuant Score ---
    psiquant_score = narrative_force * chaos_filter * capital_force

    propagation_strength = narrative_force * chaos_filter

    return PsiQuantResult(
        psiquant_score=psiquant_score,
        narrative_force=narrative_force,
        capital_force=capital_force,
        chaos_filter=chaos_filter,
        propagation_strength=propagation_strength,
    )