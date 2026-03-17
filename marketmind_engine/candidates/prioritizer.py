"""
Phase-6B Candidate Prioritizer

Deterministically ranks TradeCandidate objects based on intention strength
and eligibility/permission state.

This module performs:
- NO mutation
- NO side effects
- NO randomness

It is a pure function layer between candidate emission and execution.
"""

from typing import List

from marketmind_engine.candidates.contract import TradeCandidate


# -----------------------------------------------------------------------------
# Internal scoring function (deterministic)
# -----------------------------------------------------------------------------

def _score_candidate(c: TradeCandidate) -> float:
    """
    Compute intention-weighted score for a candidate.

    Formula:
        score = FILS × UCIP × (1 - TTCF)

    Notes:
        - TTCF acts as a chaos/uncertainty dampener
        - Higher score = stronger aligned intention signal
    """
    return c.fils * c.ucip * (1.0 - c.ttcf)


# -----------------------------------------------------------------------------
# Public prioritization API
# -----------------------------------------------------------------------------

def prioritize_candidates(
    candidates: List[TradeCandidate],
    limit: int = 5,
) -> List[TradeCandidate]:
    """
    Deterministically prioritize candidates.

    Parameters
    ----------
    candidates : List[TradeCandidate]
        Raw emitted candidates from emitter (unfiltered, ordered)

    limit : int
        Maximum number of candidates to return

    Returns
    -------
    List[TradeCandidate]
        Top-N prioritized candidates, sorted by descending score

    Behavior
    --------
    1. Applies strict eligibility + market confirmation gating
    2. Requires decision == "ALLOW"
    3. Sorts deterministically by:
        - primary: score (descending)
        - secondary: symbol (lexical, stable tie-breaker)
    """

    # -------------------------------------------------------------------------
    # Step 1: Permission gating (STRICT)
    # -------------------------------------------------------------------------

    permitted = [
        c for c in candidates
        if c.eligibility_status
        and c.market_confirmation_status
        and c.decision == "ALLOW"
    ]

    # Early exit if nothing qualifies
    if not permitted:
        return []

    # -------------------------------------------------------------------------
    # Step 2: Deterministic ranking
    # -------------------------------------------------------------------------

    ranked = sorted(
        permitted,
        key=lambda c: (
            -_score_candidate(c),  # descending score
            c.symbol              # stable tie-breaker
        )
    )

    # -------------------------------------------------------------------------
    # Step 3: Return top-N slice
    # -------------------------------------------------------------------------

    return ranked[:limit]


# -----------------------------------------------------------------------------
# Optional: diagnostic helper (pure, safe)
# -----------------------------------------------------------------------------

def summarize_candidates(candidates: List[TradeCandidate]) -> List[dict]:
    """
    Convert candidates into a lightweight, log-friendly structure.

    This is safe for:
        - logging
        - debugging
        - CLI output
        - future UI consumption

    Returns
    -------
    List[dict]
    """

    summary = []

    for c in candidates:
        score = _score_candidate(c)

        summary.append({
            "symbol": c.symbol,
            "domain": c.domain,
            "score": round(score, 6),
            "fils": c.fils,
            "ucip": c.ucip,
            "ttcf": c.ttcf,
            "decision": c.decision,
            "eligible": c.eligibility_status,
            "confirmed": c.market_confirmation_status,
            "engine_tick": c.engine_tick,
        })

    return summary