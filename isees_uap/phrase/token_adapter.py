# ============================================================
# phrase/token_adapter.py — Phrase → Token Bridge (Phase 4 FIXED)
# ============================================================

from typing import List, Tuple
import re


# ------------------------------------------------------------
# TOKEN MAPS (CONTROLLED ONTOLOGY)
# ------------------------------------------------------------

SENSOR_MAP = {
    "radar": "radar",
    "communications": "comms",
    "atc": "comms",
    "flight": "flight",
}

INTENT_MAP = {
    "logs": "logs",
    "activity": "activity",
    "anomaly": "anomaly",
}

DOMAIN_MAP = {
    "faa": "FAA",
    "dod": "DoD",
    "military": "DoD",
}


# ------------------------------------------------------------
# MAIN ADAPTER
# ------------------------------------------------------------

def phrase_to_tokens(phrases: List[str]) -> Tuple[List[str], List[str], List[str]]:
    """
    Convert phrases into:
    S = sensor tokens
    R = relational/domain tokens
    E = environmental tokens

    FIXES:
    - Deduplication
    - Clean separation of token roles
    """

    s_tokens = set()
    r_tokens = set()
    e_tokens = set()

    for p in phrases:

        p_lower = p.lower()

        # ----------------------------------------
        # SENSOR TOKENS (S)
        # ----------------------------------------
        for key, val in SENSOR_MAP.items():
            if key in p_lower:
                s_tokens.add(val)

        # ----------------------------------------
        # DOMAIN TOKENS (R)
        # ----------------------------------------
        for key, val in DOMAIN_MAP.items():
            if key in p_lower:
                r_tokens.add(val)

        # ----------------------------------------
        # INTENT TOKENS (R)
        # ----------------------------------------
        for key, val in INTENT_MAP.items():
            if key in p_lower:
                r_tokens.add(val)

        # ----------------------------------------
        # ENVIRONMENT (E)
        # ----------------------------------------

        # distance extraction (only once per unique value)
        dist_match = re.search(r"\(([\d\.]+)\s?km\)", p_lower)
        if dist_match:
            dist = float(dist_match.group(1))
            e_tokens.add(f"distance_{round(dist,1)}")

        # location context
        if "airport" in p_lower:
            e_tokens.add("airport")

    return sorted(s_tokens), sorted(r_tokens), sorted(e_tokens)