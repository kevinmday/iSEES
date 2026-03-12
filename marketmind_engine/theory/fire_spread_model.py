"""
Fire Spread Model
-----------------

Implements a contagion-style propagation model for narrative-driven
asset movement.

Inspired by wildfire spread models from ecology.

Narratives propagate through asset networks similar to fire spreading
across terrain.

Ignition probability:

    P_ignite = exposure × UCIP × drift × (1 − TTCF)

Where:

    exposure = network proximity between assets
    UCIP     = narrative intention force
    drift    = capital movement indicator
    TTCF     = chaos suppression factor

This module is pure mathematical logic and safe for the theory layer.
"""

from typing import Dict, List
import math


# ---------------------------------------------------------
# Exposure Model
# ---------------------------------------------------------

def compute_asset_exposure(
    asset: str,
    narrative_assets: List[str],
    asset_graph: Dict[str, List[str]],
) -> float:
    """
    Computes exposure of an asset to a narrative.

    Exposure is based on proximity to assets already affected
    by the narrative.

    asset_graph example:

        {
            "NVDA": ["SMCI", "AMD", "TSM"],
            "SMCI": ["NVDA", "VRT"]
        }
    """

    if asset not in asset_graph:
        return 0.0

    neighbors = asset_graph.get(asset, [])

    if not neighbors:
        return 0.0

    exposure_count = 0

    for neighbor in neighbors:
        if neighbor in narrative_assets:
            exposure_count += 1

    exposure = exposure_count / len(neighbors)

    return min(exposure, 1.0)


# ---------------------------------------------------------
# Ignition Probability
# ---------------------------------------------------------

def compute_ignition_probability(
    exposure: float,
    ucip: float,
    drift: float,
    ttcf: float,
) -> float:
    """
    Computes probability that a new asset ignites.

    P_ignite = exposure × UCIP × drift × (1 − TTCF)
    """

    exposure = max(0.0, min(exposure, 1.0))
    ucip = max(0.0, ucip)
    drift = max(0.0, drift)
    ttcf = max(0.0, min(ttcf, 1.0))

    probability = exposure * ucip * drift * (1 - ttcf)

    return min(probability, 1.0)


# ---------------------------------------------------------
# Spread Score
# ---------------------------------------------------------

def compute_spread_score(
    asset: str,
    narrative_assets: List[str],
    asset_graph: Dict[str, List[str]],
    ucip: float,
    drift: float,
    ttcf: float,
) -> float:
    """
    Computes spread likelihood for an asset.

    Combines exposure with ignition probability.
    """

    exposure = compute_asset_exposure(
        asset,
        narrative_assets,
        asset_graph,
    )

    probability = compute_ignition_probability(
        exposure,
        ucip,
        drift,
        ttcf,
    )

    return probability


# ---------------------------------------------------------
# Downstream Asset Ranking
# ---------------------------------------------------------

def rank_candidate_assets(
    candidate_assets: List[str],
    narrative_assets: List[str],
    asset_graph: Dict[str, List[str]],
    ucip: float,
    drift: float,
    ttcf: float,
) -> List[tuple]:
    """
    Ranks candidate assets by propagation likelihood.

    Returns list of:

        (asset, score)

    sorted by descending score.
    """

    scores = []

    for asset in candidate_assets:

        score = compute_spread_score(
            asset,
            narrative_assets,
            asset_graph,
            ucip,
            drift,
            ttcf,
        )

        scores.append((asset, score))

    scores.sort(key=lambda x: x[1], reverse=True)

    return scores


# ---------------------------------------------------------
# Propagation Threshold
# ---------------------------------------------------------

def select_ignition_candidates(
    ranked_assets: List[tuple],
    threshold: float = 0.05,
) -> List[str]:
    """
    Selects assets likely to ignite.

    Only returns assets whose score exceeds threshold.
    """

    selected = []

    for asset, score in ranked_assets:

        if score >= threshold:
            selected.append(asset)

    return selected