# ============================================================
# overlap.py — CANDIDATE OVERLAP TOPOLOGY ENGINE (V1)
# ============================================================

from typing import List, Dict, Set

from isees_uap.kod.topology.topology_models import (
    OverlapRegion,
)

from isees_uap.kod.topology.topology_types import (
    OverlapRegionType,
)


# ============================================================
# FEATURE NORMALIZATION
# ============================================================

def _normalize_features(features: List[str]) -> Set[str]:

    normalized = set()

    for feature in features:

        if not feature:
            continue

        normalized.add(
            str(feature).strip().lower()
        )

    return normalized


# ============================================================
# OVERLAP SCORE
# ============================================================

def compute_overlap_score(
    features_a: List[str],
    features_b: List[str],
) -> float:

    set_a = _normalize_features(features_a)
    set_b = _normalize_features(features_b)

    if not set_a or not set_b:
        return 0.0

    shared = set_a.intersection(set_b)
    total = set_a.union(set_b)

    return round(
        len(shared) / max(len(total), 1),
        4,
    )


# ============================================================
# BUILD OVERLAP REGION
# ============================================================

def build_overlap_region(
    candidate_a: Dict,
    candidate_b: Dict,
    region_type: OverlapRegionType,
) -> OverlapRegion:

    features_a = candidate_a.get(
        "explained_features",
        [],
    )

    features_b = candidate_b.get(
        "explained_features",
        [],
    )

    set_a = _normalize_features(features_a)
    set_b = _normalize_features(features_b)

    shared_features = sorted(
        list(set_a.intersection(set_b))
    )

    overlap_score = compute_overlap_score(
        features_a,
        features_b,
    )

    return OverlapRegion(
        region_type=region_type,
        shared_features=shared_features,
        overlap_score=overlap_score,
        contributing_candidates=[
            candidate_a.get("candidate_id", "unknown"),
            candidate_b.get("candidate_id", "unknown"),
        ],
    )


# ============================================================
# MULTI-CANDIDATE OVERLAP ANALYSIS
# ============================================================

def analyze_candidate_overlap(
    candidates: List[Dict],
    region_type: OverlapRegionType = (
        OverlapRegionType.UNKNOWN
    ),
) -> List[OverlapRegion]:

    overlap_regions = []

    total_candidates = len(candidates)

    if total_candidates < 2:
        return overlap_regions

    for i in range(total_candidates):

        for j in range(i + 1, total_candidates):

            candidate_a = candidates[i]
            candidate_b = candidates[j]

            region = build_overlap_region(
                candidate_a=candidate_a,
                candidate_b=candidate_b,
                region_type=region_type,
            )

            overlap_regions.append(region)

    return overlap_regions


# ============================================================
# GLOBAL OVERLAP SCORE
# ============================================================

def compute_global_overlap_score(
    overlap_regions: List[OverlapRegion],
) -> float:

    if not overlap_regions:
        return 0.0

    scores = [
        region.overlap_score
        for region in overlap_regions
    ]

    return round(
        sum(scores) / len(scores),
        4,
    )