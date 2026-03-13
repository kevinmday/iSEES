"""
Narrative Identity Resolver
---------------------------

Creates deterministic narrative identities (fingerprints)
for incoming ProjectionEvents and maintains a registry
of active narratives.

Responsibilities
----------------
• generate narrative fingerprints
• maintain narrative registry
• attach events to existing narratives
• merge similar narratives

Design Constraints
------------------
deterministic
replay safe
no randomness
fast
"""

import re
from typing import Dict, List, Set

from marketmind_engine.narrative.narrative_state import NarrativeState


# ---------------------------------------------------------
# Stop words removed from headlines
# ---------------------------------------------------------

STOP_WORDS = {
    "the", "a", "an", "and", "or", "but",
    "as", "for", "to", "of", "in", "on",
    "with", "by", "from", "at", "is", "are",
    "was", "were", "be", "been"
}


# ---------------------------------------------------------
# Tokenization
# ---------------------------------------------------------

def tokenize(text: str) -> List[str]:

    text = text.lower()

    text = re.sub(r"[^a-z0-9\s]", " ", text)

    tokens = text.split()

    tokens = [t for t in tokens if t not in STOP_WORDS]

    return tokens


# ---------------------------------------------------------
# Fingerprint Generation
# ---------------------------------------------------------

def generate_fingerprint(headline: str, max_tokens: int = 4) -> str:
    """
    Generates deterministic narrative fingerprint.
    """

    tokens = tokenize(headline)

    tokens = tokens[:max_tokens]

    tokens = sorted(tokens)

    fingerprint = "_".join(tokens)

    return fingerprint


# ---------------------------------------------------------
# Token Overlap
# ---------------------------------------------------------

def token_overlap(a: str, b: str) -> float:
    """
    Computes token overlap similarity between fingerprints.
    """

    a_tokens = set(a.split("_"))
    b_tokens = set(b.split("_"))

    if not a_tokens or not b_tokens:
        return 0.0

    overlap = a_tokens.intersection(b_tokens)

    return len(overlap) / max(len(a_tokens), len(b_tokens))


# ---------------------------------------------------------
# Narrative Identity Resolver
# ---------------------------------------------------------

class NarrativeIdentityResolver:

    def __init__(self):

        self.registry: Dict[str, NarrativeState] = {}

    # -----------------------------------------------------
    # Resolve Narrative
    # -----------------------------------------------------

    def resolve(self, headline: str) -> NarrativeState:
        """
        Finds or creates narrative for headline.
        """

        fingerprint = generate_fingerprint(headline)

        # Exact match
        if fingerprint in self.registry:
            return self.registry[fingerprint]

        # Similar match
        for existing_fp, narrative in self.registry.items():

            similarity = token_overlap(fingerprint, existing_fp)

            if similarity >= 0.5:
                return narrative

        # Create new narrative
        narrative = NarrativeState(id=fingerprint)

        self.registry[fingerprint] = narrative

        return narrative

    # -----------------------------------------------------
    # Merge Narratives
    # -----------------------------------------------------

    def merge_similar(self):
        """
        Merge narratives with high similarity.
        """

        fingerprints = list(self.registry.keys())

        merged = set()

        for i, fp1 in enumerate(fingerprints):

            if fp1 in merged:
                continue

            for fp2 in fingerprints[i + 1:]:

                if fp2 in merged:
                    continue

                similarity = token_overlap(fp1, fp2)

                if similarity >= 0.6:

                    n1 = self.registry[fp1]
                    n2 = self.registry[fp2]

                    self._merge(n1, n2)

                    merged.add(fp2)

        for fp in merged:
            del self.registry[fp]

    # -----------------------------------------------------
    # Merge Helper
    # -----------------------------------------------------

    def _merge(self, target: NarrativeState, source: NarrativeState):

        target.assets.update(source.assets)

        target.force += source.force

        target.reinforcement_score += source.reinforcement_score

        target.discovery_count += source.discovery_count