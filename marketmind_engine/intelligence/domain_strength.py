# ============================================================
# Domain Strength Index (DSI)
# Enhanced Version — Persistence + Ignition Aware
#
# SAFE MODULE — NO RUNTIME SIDE EFFECTS
# ============================================================

from collections import defaultdict


# ------------------------------------------------------------
# DOMAIN MAP (expand or replace later with auto-clustering)
# ------------------------------------------------------------

DOMAIN_MAP = {
    # Finance
    "TBBK": "finance",
    "MMT": "finance",
    "WBTN": "finance",

    # Biopharma
    "EOSE": "biopharma",
    "NVST": "biopharma",
    "ECCC": "biopharma",
    "CEE": "biopharma",
}


# ------------------------------------------------------------
# CORE SCORING FUNCTION
# ------------------------------------------------------------

def compute_domain_strength(symbol_states: dict):
    """
    symbol_states format:
    {
        "SYMBOL": {
            "prop": float,
            "drift": float,
            "persist": int,
            "stab": float
        }
    }
    """

    domain_scores = defaultdict(float)
    domain_counts = defaultdict(int)

    for symbol, data in symbol_states.items():

        domain = DOMAIN_MAP.get(symbol, "other")

        prop = data.get("prop", 0.0)
        drift = data.get("drift", 0.0)
        persist = data.get("persist", 0)
        stab = data.get("stab", 0.0)

        # ----------------------------------------------------
        # 🔥 CORE SIGNAL COMPONENTS
        # ----------------------------------------------------

        # 1. Persistence-weighted propagation (dominant signal)
        base_score = prop * persist

        # 2. Ignition boost (captures event-driven spikes)
        ignition_score = abs(drift) * 10

        # 3. Stability amplification (optional but useful)
        stability_factor = 1 + min(abs(stab), 100) / 100  # capped to avoid explosion

        # ----------------------------------------------------
        # FINAL SCORE
        # ----------------------------------------------------
        score = (base_score + ignition_score) * stability_factor

        domain_scores[domain] += score
        domain_counts[domain] += 1

    return dict(domain_scores), dict(domain_counts)


# ------------------------------------------------------------
# DOMAIN CLASSIFICATION
# ------------------------------------------------------------

def classify_domains(domain_scores: dict):
    """
    Produces ranked and labeled domain structure
    """

    if not domain_scores:
        return {}

    sorted_domains = sorted(
        domain_scores.items(),
        key=lambda x: x[1],
        reverse=True
    )

    result = {}

    for i, (domain, score) in enumerate(sorted_domains):

        # --------------------------------------------
        # Rank-based classification
        # --------------------------------------------
        if i == 0:
            label = "DOMINANT_FIELD"
        elif i == 1:
            label = "SECONDARY_FIELD"
        else:
            label = "BACKGROUND"

        # --------------------------------------------
        # Magnitude-based classification (overlay)
        # --------------------------------------------
        if score > 100:
            strength = "MACRO_DOMINANT"
        elif score > 10:
            strength = "ACTIVE_DOMAIN"
        else:
            strength = "IGNITION_ONLY"

        result[domain] = {
            "score": round(score, 4),
            "rank_class": label,
            "strength_class": strength
        }

    return result


# ------------------------------------------------------------
# DEBUG / HUMAN-READABLE OUTPUT
# ------------------------------------------------------------

def debug_print(domain_scores: dict, domain_labels: dict):
    print("\n[DOMAIN FIELD]\n")

    sorted_domains = sorted(
        domain_scores.items(),
        key=lambda x: x[1],
        reverse=True
    )

    for domain, score in sorted_domains:

        label = domain_labels.get(domain, {})
        rank_class = label.get("rank_class", "UNKNOWN")
        strength_class = label.get("strength_class", "UNKNOWN")

        print(
            f"{domain.upper():<12} "
            f"score={score:.4f} "
            f"→ {rank_class} | {strength_class}"
        )