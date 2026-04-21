# ============================================================
# testing/run_phase8.py
# iSEES-UAP — Phase 8 Runner (FINAL LOCKED)
# ============================================================

from isees_uap_v0_baseline import ISEES_UAP
from testing.adversarial_generator import get_adversarial_tests

from mitigation.false_coherence import apply_false_coherence_penalty
from mitigation.temporal_alignment import temporal_entropy_adjustment
from mitigation.sparse_data import sparse_penalty
from mitigation.deception import apply_deception_penalty, generate_deception_flags

from tokens.token_extractor import extract_all_tokens
from search.search_vector_engine import rank_vectors, group_by_tier


def post_penalty_classification(engine, C, H):

    if C < 0.85:
        if C >= engine.coherence_threshold:
            return "PARTIAL"
        return "NOISE"

    return engine.classify(C, H)


def run_phase8():

    engine = ISEES_UAP()
    tests = get_adversarial_tests()

    for name, (s, r, e, _) in tests.items():

        base = engine.run(s, r, e)

        # Phase 3
        C1 = apply_false_coherence_penalty(base.coherence, s.values)

        # Phase 5
        C2 = sparse_penalty(C1, s.values, r.values, e.values)

        # Phase 8 — use ORIGINAL coherence + entropy
        C3 = apply_deception_penalty(
            C2,
            s.values,
            r.values,
            base.coherence,
            base.entropy
        )

        # Phase 4
        H2 = temporal_entropy_adjustment(s.values, r.values, base.entropy)

        classification = post_penalty_classification(engine, C3, H2)

        # Flags — also use original coherence + entropy
        flags = generate_deception_flags(
            s.values,
            r.values,
            base.coherence,
            base.entropy
        )

        # Tokens + vectors
        s_tokens, r_tokens, e_tokens = extract_all_tokens(s, r, e)
        vectors = rank_vectors(s_tokens, r_tokens, e_tokens, C3, H2)
        grouped = group_by_tier(vectors)

        print(f"\n{name.upper()}")
        print(f"C: {base.coherence} → {C1} → {C2} → {C3}")
        print(f"H: {base.entropy} → {H2}")
        print(f"CLASS: {classification}")
        print(f"FLAGS: {flags}")

        print("\nTOP PRIORITY:")
        for v in grouped["priority"][:3]:
            print(f"{v.phrase} | {v.score}")

        print("\nBACKGROUND COUNT:", len(grouped["background"]))


if __name__ == "__main__":
    run_phase8()