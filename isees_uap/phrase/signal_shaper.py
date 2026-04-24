# ============================================================
# phrase/signal_shaper.py — Deterministic Signal Shaper (Phase 4B)
# ============================================================

from typing import List, Tuple


# ------------------------------------------------------------
# PRIORITY (domain knowledge, deterministic)
# ------------------------------------------------------------

SENSOR_PRIORITY = ["radar", "comms", "flight"]

INTENT_PRIORITY = ["anomaly", "logs", "activity"]

DOMAIN_PRIORITY = ["FAA", "DoD"]


# ------------------------------------------------------------
# HELPERS
# ------------------------------------------------------------

def pick_first(available: List[str], priority: List[str]) -> List[str]:
    for p in priority:
        if p in available:
            return [p]
    return available[:1] if available else []


def pick_domain(r_tokens: List[str]) -> List[str]:
    for d in DOMAIN_PRIORITY:
        if d in r_tokens:
            return [d]
    return []


def pick_intent(r_tokens: List[str]) -> List[str]:
    for i in INTENT_PRIORITY:
        if i in r_tokens:
            return [i]
    return []


# ------------------------------------------------------------
# MAIN SHAPER
# ------------------------------------------------------------

def shape_signals(
    s_tokens: List[str],
    r_tokens: List[str],
    e_tokens: List[str]
) -> List[Tuple[List[str], List[str], List[str]]]:
    """
    Produce a list of focused (S, R, E) configurations.
    Each configuration = one hypothesis.
    """

    shaped = []

    # --------------------------------------------------------
    # 1. Primary hypothesis (highest priority)
    # --------------------------------------------------------
    s_main = pick_first(s_tokens, SENSOR_PRIORITY)
    r_domain = pick_domain(r_tokens)
    r_intent = pick_intent(r_tokens)

    r_main = r_domain + r_intent

    if s_main and r_main:
        shaped.append((s_main, r_main, e_tokens))

    # --------------------------------------------------------
    # 2. Alternate hypotheses (each sensor emphasized)
    # --------------------------------------------------------
    for s in s_tokens:
        r_domain = pick_domain(r_tokens)
        r_intent = pick_intent(r_tokens)

        r_alt = r_domain + r_intent

        if [s] != s_main:
            shaped.append(([s], r_alt, e_tokens))

    # --------------------------------------------------------
    # 3. Deduplicate
    # --------------------------------------------------------
    unique = []
    seen = set()

    for s, r, e in shaped:
        key = (tuple(sorted(s)), tuple(sorted(r)), tuple(sorted(e)))
        if key not in seen:
            seen.add(key)
            unique.append((s, r, e))

    return unique