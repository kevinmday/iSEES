# ============================================================
# testing/run_phase6.py
# iSEES-UAP — Phase 6 Token Engine Runner
# ============================================================

from isees_uap_v0_baseline import ISEES_UAP
from testing.adversarial_generator import get_adversarial_tests

from mitigation.false_coherence import apply_false_coherence_penalty
from mitigation.temporal_alignment import temporal_entropy_adjustment
from mitigation.sparse_data import sparse_penalty

from tokens.token_extractor import extract_all_tokens


def run_phase6():

    engine = ISEES_UAP()
    tests = get_adversarial_tests()

    for name, (s, r, e, _) in tests.items():

        base_result = engine.run(s, r, e)

        # Coherence adjustments
        C1 = apply_false_coherence_penalty(base_result.coherence, s.values)
        C2 = sparse_penalty(C1, s.values, r.values, e.values)

        # Entropy adjustment
        H2 = temporal_entropy_adjustment(s.values, r.values, base_result.entropy)

        # Token extraction
        s_tokens, r_tokens, e_tokens = extract_all_tokens(s, r, e)

        print(f"\n{name.upper()}")
        print(f"C: {base_result.coherence} → {C2}")
        print(f"H: {base_result.entropy} → {H2}")
        print(f"SENSOR TOKENS: {s_tokens}")
        print(f"REPORT TOKENS: {r_tokens}")
        print(f"ENV TOKENS: {e_tokens}")


if __name__ == "__main__":
    run_phase6()