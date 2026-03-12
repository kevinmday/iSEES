"""
Reinforcement Engine
--------------------

Injects energy into NarrativeState objects when new mentions appear.

Narratives gain strength through reinforcement events such as:

    • news articles
    • repeated headlines
    • cross-source confirmation
    • social amplification

Mathematical model:

    dF/dt = -λF + Σ S_i

Where:

    F  = narrative force
    λ  = decay constant
    S_i = reinforcement strength from mentions

This module computes reinforcement strength and applies it
to NarrativeState objects.

Deterministic and engine-safe.
"""

from typing import Dict, Optional
from datetime import datetime

from marketmind_engine.narrative.narrative_state import NarrativeState


# ---------------------------------------------------------
# Source Weighting
# ---------------------------------------------------------

SOURCE_WEIGHTS = {
    "reuters": 1.0,
    "bloomberg": 1.0,
    "wsj": 0.95,
    "ft": 0.95,
    "cnbc": 0.85,
    "marketwatch": 0.8,
    "seekingalpha": 0.7,
    "blog": 0.6,
    "social": 0.5,
    "unknown": 0.6,
}


# ---------------------------------------------------------
# Mention Strength Calculation
# ---------------------------------------------------------

def compute_mention_strength(article: Dict) -> float:
    """
    Calculates reinforcement strength from an article.

    Expected article structure:

        {
            "source": "reuters",
            "headline": "...",
            "symbols": ["NVDA"],
            "timestamp": ...
        }
    """

    source = article.get("source", "unknown").lower()

    base_weight = SOURCE_WEIGHTS.get(source, SOURCE_WEIGHTS["unknown"])

    symbol_count = len(article.get("symbols", []))

    symbol_factor = 1.0 + min(symbol_count * 0.1, 0.5)

    headline = article.get("headline", "")
    headline_length_factor = min(len(headline) / 200.0, 1.0)

    strength = base_weight * symbol_factor * (0.5 + headline_length_factor)

    return max(strength, 0.05)


# ---------------------------------------------------------
# Reinforcement Application
# ---------------------------------------------------------

def apply_reinforcement(
    narrative_state: NarrativeState,
    mention_strength: float,
) -> None:
    """
    Applies reinforcement to a narrative.
    """

    if mention_strength <= 0:
        return

    narrative_state.apply_reinforcement(mention_strength)


# ---------------------------------------------------------
# Article Processing
# ---------------------------------------------------------

def reinforce_from_article(
    narrative_state: NarrativeState,
    article: Dict,
) -> float:
    """
    Processes an article and reinforces the narrative.

    Returns reinforcement strength applied.
    """

    strength = compute_mention_strength(article)

    apply_reinforcement(narrative_state, strength)

    return strength


# ---------------------------------------------------------
# Batch Reinforcement
# ---------------------------------------------------------

def reinforce_from_articles(
    narrative_state: NarrativeState,
    articles: list,
) -> float:
    """
    Applies reinforcement from multiple articles.

    Returns total reinforcement applied.
    """

    total_strength = 0.0

    for article in articles:

        strength = reinforce_from_article(narrative_state, article)

        total_strength += strength

    return total_strength


# ---------------------------------------------------------
# Reinforcement Decay Dampening
# ---------------------------------------------------------

def compute_reinforcement_factor(
    narrative_state: NarrativeState,
) -> float:
    """
    Computes reinforcement factor used by decay model.

    Returns value between 0 and 0.95.
    """

    reinforcement = narrative_state.reinforcement_score

    factor = reinforcement / (1 + reinforcement)

    return min(factor, 0.95)