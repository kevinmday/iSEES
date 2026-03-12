"""
Narrative Decay Models
----------------------

Implements deterministic decay mechanics for narrative force.

Narratives behave like energy fields that naturally decay over time,
but decay can be modified by:

• domain characteristics
• asset characteristics
• reinforcement from new mentions
• discovery expansion

Baseline decay model:

    F(t) = F0 * exp(-λ t)

Effective decay adjusts λ dynamically.

This module contains pure mathematical logic and should not depend
on runtime engine components.
"""

import math
from typing import Optional


# ---------------------------------------------------------
# Default Domain Decay Rates
# ---------------------------------------------------------

DOMAIN_DECAY = {
    "macro": 0.01,
    "geopolitics": 0.015,
    "energy": 0.02,
    "defense": 0.02,
    "ai": 0.03,
    "technology": 0.035,
    "earnings": 0.05,
    "rumor": 0.07,
    "default": 0.04,
}


# ---------------------------------------------------------
# Asset Personality Modifiers
# ---------------------------------------------------------

ASSET_DECAY_MODIFIERS = {
    "mega_cap": 0.9,
    "large_cap": 1.0,
    "mid_cap": 1.1,
    "small_cap": 1.2,
    "meme": 1.5,
    "commodity": 0.95,
    "defense": 0.9,
    "energy": 0.95,
    "ai_infrastructure": 0.9,
    "default": 1.0,
}


# ---------------------------------------------------------
# Domain Decay
# ---------------------------------------------------------

def compute_base_decay(domain: Optional[str]) -> float:
    """
    Returns baseline decay rate for a narrative domain.
    """

    if not domain:
        return DOMAIN_DECAY["default"]

    return DOMAIN_DECAY.get(domain.lower(), DOMAIN_DECAY["default"])


# ---------------------------------------------------------
# Asset Modifier
# ---------------------------------------------------------

def compute_asset_modifier(asset_type: Optional[str]) -> float:
    """
    Returns decay modifier based on asset personality.
    """

    if not asset_type:
        return ASSET_DECAY_MODIFIERS["default"]

    return ASSET_DECAY_MODIFIERS.get(
        asset_type.lower(),
        ASSET_DECAY_MODIFIERS["default"],
    )


# ---------------------------------------------------------
# Effective Decay
# ---------------------------------------------------------

def compute_effective_decay(
    domain_decay: float,
    asset_modifier: float,
    reinforcement_factor: float,
    discovery_count: int,
) -> float:
    """
    Computes effective decay rate.

    λ_eff =
        λ_domain
        × λ_asset
        × (1 − reinforcement)
        ÷ (1 + log(1 + discoveries))
    """

    reinforcement_factor = max(0.0, min(reinforcement_factor, 0.95))
    discovery_count = max(discovery_count, 0)

    discovery_term = 1 + math.log(1 + discovery_count)

    effective_lambda = (
        domain_decay
        * asset_modifier
        * (1 - reinforcement_factor)
        / discovery_term
    )

    return max(effective_lambda, 1e-6)


# ---------------------------------------------------------
# Narrative Force Decay
# ---------------------------------------------------------

def decay_force(
    initial_force: float,
    decay_rate: float,
    elapsed_time: float,
) -> float:
    """
    Applies exponential decay to narrative force.

        F(t) = F0 * exp(-λ t)
    """

    if initial_force <= 0:
        return 0.0

    return initial_force * math.exp(-decay_rate * elapsed_time)


# ---------------------------------------------------------
# Convenience Helper
# ---------------------------------------------------------

def compute_decayed_force(
    initial_force: float,
    domain: Optional[str],
    asset_type: Optional[str],
    reinforcement_factor: float,
    discovery_count: int,
    elapsed_time: float,
) -> float:
    """
    Full decay pipeline.

    Computes effective decay then applies decay function.
    """

    domain_decay = compute_base_decay(domain)

    asset_modifier = compute_asset_modifier(asset_type)

    effective_decay = compute_effective_decay(
        domain_decay,
        asset_modifier,
        reinforcement_factor,
        discovery_count,
    )

    return decay_force(
        initial_force,
        effective_decay,
        elapsed_time,
    )