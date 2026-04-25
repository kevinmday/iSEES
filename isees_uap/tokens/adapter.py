# ============================================================
# tokens/adapter.py — SIGNAL-AWARE TOKEN ADAPTER
# ============================================================

from typing import Dict, List


SENSOR_KEYWORDS = {
    "radar": ["radar", "signal"],
    "flight": ["flight", "aircraft"],
    "comms": ["atc", "communications", "tower"],
}

RELATION_KEYWORDS = {
    "anomaly": ["anomaly", "irregularity", "unknown"],
    "authority": ["faa", "dod", "military"],
}

ENV_KEYWORDS = {
    "airport": ["airport"],
    "airspace": ["airspace"],
}


def phrase_to_tokens(phrase: str) -> Dict[str, List[str]]:

    phrase_lower = phrase.lower()

    S = []
    R = []
    E = []

    # SENSOR
    for key, words in SENSOR_KEYWORDS.items():
        for w in words:
            if w in phrase_lower:
                S.append(key)
                break

    # RELATION
    for key, words in RELATION_KEYWORDS.items():
        for w in words:
            if w in phrase_lower:
                R.append(key)
                break

    # ENV
    for key, words in ENV_KEYWORDS.items():
        for w in words:
            if w in phrase_lower:
                E.append(key)
                break

    return {
        "S": list(set(S)),
        "R": list(set(R)),
        "E": list(set(E))
    }