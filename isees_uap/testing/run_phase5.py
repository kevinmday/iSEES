# ============================================================
# testing/run_phase5.py
# iSEES-UAP — Phase 5 Integration Runner
# ============================================================

from isees_uap_v0_baseline import ISEES_UAP
from testing.adversarial_generator import get_adversarial_tests

from mitigation.false_coherence import apply_false_coherence_penalty
from mitigation.temporal_alignment import temporal_entropy_adjustment
from mitigation.sparse_data import sparse_penalty, generate_sparse_flags


def post_penalty_classification(engine, C, H):

    if C < 0.85:
        if C >= engine.coherence_threshold:
            return "PARTIAL"
        return "NOISE"

    return engine.classify(C, H)


def run_phase5():

    engine = ISEES_UAP()
    tests = get_adversarial_tests()

    for name, (s, r, e, expected) in tests.items():

        base_result = engine.run(s, r, e)

        # Phase 3
        C1 = apply_false_coherence_penalty(base_result.coherence, s.values)

        # Phase 5 (coherence penalties)
        C2 = sparse_penalty(C1, s.values, r.values, e.values)

        # Phase 4
        H2 = temporal_entropy_adjustment(s.values, r.values, base_result.entropy)

        classification = post_penalty_classification(engine, C2, H2)

        flags = generate_sparse_flags(s.values, r.values, e.values)

        print(f"\n{name.upper()}")
        print(f"EXPECTED: {expected}")
        print(f"BASE:     {base_result.classification}")
        print(f"ADJUSTED: {classification}")
        print(f"C: {base_result.coherence} → {C1} → {C2}")
        print(f"H: {base_result.entropy} → {H2}")
        print(f"FLAGS: {flags}")


if __name__ == "__main__":
    run_phase5()