# ============================================================
# search/search_vector_engine.py
# iSEES-UAP — Phase 7 Search Vector Intelligence
# ============================================================

from dataclasses import dataclass
from typing import List, Dict


@dataclass
class RankedVector:
    phrase: str
    score: float
    tier: str
    source: Dict


def compute_score(C: float, H: float) -> float:
    return round(C * (1 - H), 4)


def assign_tier(score: float) -> str:
    if score >= 0.6:
        return "priority"
    elif score >= 0.3:
        return "secondary"
    return "background"


def deduplicate_phrases(phrases: List[str]) -> List[str]:
    return list(set(phrases))


def build_phrases(sensor_tokens, report_tokens, env_tokens):

    phrases = []

    # SENSOR + REPORT
    for s in sensor_tokens:
        for r in report_tokens:
            phrases.append(f"{s} {r}")

    # SENSOR + ENV
    for s in sensor_tokens:
        for e in env_tokens:
            phrases.append(f"{s} {e}")

    # FULL COMBINATION
    for s in sensor_tokens:
        for r in report_tokens:
            for e in env_tokens:
                phrases.append(f"{s} {r} {e}")

    # MISMATCH PATTERNS
    for r in report_tokens:
        phrases.append(f"{r} not on radar")

    for s in sensor_tokens:
        for r in report_tokens:
            phrases.append(f"{s} inconsistent with {r}")

    return deduplicate_phrases(phrases)


def rank_vectors(sensor_tokens,
                 report_tokens,
                 env_tokens,
                 C: float,
                 H: float):

    phrases = build_phrases(sensor_tokens, report_tokens, env_tokens)
    score = compute_score(C, H)

    ranked = []

    for p in phrases:
        tier = assign_tier(score)

        ranked.append(RankedVector(
            phrase=p,
            score=score,
            tier=tier,
            source={
                "coherence": C,
                "entropy": H
            }
        ))

    # Sort by score (all same now, but future-proof)
    ranked = sorted(ranked, key=lambda x: x.score, reverse=True)

    return ranked


def group_by_tier(vectors: List[RankedVector]):

    grouped = {
        "priority": [],
        "secondary": [],
        "background": []
    }

    for v in vectors:
        grouped[v.tier].append(v)

    return grouped