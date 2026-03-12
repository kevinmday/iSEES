"""
Narrative Diffusion Model
-------------------------

Implements network-based narrative propagation.

Diffusion equation:

    dN_i/dt = Σ (w_ij * N_j) − γ N_i

Where:

    N_i  = narrative force at asset i
    N_j  = narrative force of neighboring assets
    w_ij = connection weight between assets
    γ    = decay factor

This allows narrative energy to spread across connected assets
even before direct news reaches them.

This module contains pure mathematical logic and is safe for the
MarketMind theory layer.
"""

from typing import Dict, List
import math


# ---------------------------------------------------------
# Neighbor Influence
# ---------------------------------------------------------

def compute_neighbor_influence(
    asset: str,
    neighbor_forces: Dict[str, float],
    weight_matrix: Dict[str, Dict[str, float]],
) -> float:
    """
    Computes total influence from neighboring assets.

    neighbor_forces example:

        {
            "NVDA": 0.9,
            "SMCI": 0.7
        }

    weight_matrix example:

        {
            "VRT": {"NVDA": 0.6, "SMCI": 0.4}
        }
    """

    if asset not in weight_matrix:
        return 0.0

    weights = weight_matrix[asset]

    influence = 0.0

    for neighbor, weight in weights.items():

        force = neighbor_forces.get(neighbor, 0.0)

        influence += weight * force

    return influence


# ---------------------------------------------------------
# Diffusion Equation
# ---------------------------------------------------------

def diffuse_narrative_intensity(
    asset_force: float,
    neighbor_influence: float,
    decay: float,
    timestep: float = 1.0,
) -> float:
    """
    Applies diffusion update to an asset.

    N_i(t+1) = N_i + (neighbor_influence − γ N_i) * timestep
    """

    delta = (neighbor_influence - decay * asset_force) * timestep

    new_force = asset_force + delta

    return max(new_force, 0.0)


# ---------------------------------------------------------
# Diffusion Step
# ---------------------------------------------------------

def diffusion_step(
    asset_forces: Dict[str, float],
    weight_matrix: Dict[str, Dict[str, float]],
    decay: float,
    timestep: float = 1.0,
) -> Dict[str, float]:
    """
    Executes one diffusion iteration across all assets.
    """

    updated_forces = {}

    for asset, force in asset_forces.items():

        neighbor_influence = compute_neighbor_influence(
            asset,
            asset_forces,
            weight_matrix,
        )

        new_force = diffuse_narrative_intensity(
            force,
            neighbor_influence,
            decay,
            timestep,
        )

        updated_forces[asset] = new_force

    return updated_forces


# ---------------------------------------------------------
# Multi-Step Diffusion
# ---------------------------------------------------------

def run_diffusion(
    asset_forces: Dict[str, float],
    weight_matrix: Dict[str, Dict[str, float]],
    decay: float,
    steps: int = 3,
    timestep: float = 1.0,
) -> Dict[str, float]:
    """
    Runs multiple diffusion iterations.

    Useful for predicting downstream narrative propagation.
    """

    current_forces = dict(asset_forces)

    for _ in range(steps):

        current_forces = diffusion_step(
            current_forces,
            weight_matrix,
            decay,
            timestep,
        )

    return current_forces


# ---------------------------------------------------------
# Rank Diffusion Outcomes
# ---------------------------------------------------------

def rank_diffusion_targets(
    asset_forces: Dict[str, float],
) -> List[tuple]:
    """
    Ranks assets by diffusion intensity.

    Returns:

        [(asset, force), ...]

    sorted descending.
    """

    ranked = list(asset_forces.items())

    ranked.sort(key=lambda x: x[1], reverse=True)

    return ranked