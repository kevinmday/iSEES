# ============================================================
# testing/run_phase7.py
# iSEES-UAP — Phase 7 Runner
# ============================================================

from isees_uap_v0_baseline import ISEES_UAP
from testing.adversarial_generator import get_adversarial_tests

from mitigation.false_coherence import apply_false_coherence_penalty
from mitigation.temporal_alignment import temporal_entropy_adjustment
from mitigation.sparse_data import sparse_penalty

from tokens.token_extractor import extract_all_tokens
from search.search_vector_engine import rank_vectors, group_by_tier


def run_phase7():

    engine = ISEES_UAP()
    tests = get_adversarial_tests()

    for name, (s, r, e, _) in tests.items():

        base_result = engine.run(s, r, e)

        # Phase 3
        C1 = apply_false_coherence_penalty(base_result.coherence, s.values)

        # Phase 5
        C2 = sparse_penalty(C1, s.values, r.values, e.values)

        # Phase 4
        H2 = temporal_entropy_adjustment(s.values, r.values, base_result.entropy)

        # Tokens
        s_tokens, r_tokens, e_tokens = extract_all_tokens(s, r, e)

        # Ranking
        vectors = rank_vectors(s_tokens, r_tokens, e_tokens, C2, H2)
        grouped = group_by_tier(vectors)

        print(f"\n{name.upper()}")
        print(f"C: {base_result.coherence} → {C2}")
        print(f"H: {base_result.entropy} → {H2}")

        print("\nTOP PRIORITY:")
        for v in grouped["priority"][:5]:
            print(f"{v.phrase} | {v.score}")

        print("\nSECONDARY:")
        for v in grouped["secondary"][:5]:
            print(f"{v.phrase} | {v.score}")

        print("\nBACKGROUND COUNT:", len(grouped["background"]))


if __name__ == "__main__":
    run_phase7()