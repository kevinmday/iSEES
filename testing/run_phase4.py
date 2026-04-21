# ============================================================
# testing/run_phase4.py
# iSEES-UAP — Phase 4 Integration Runner
# ============================================================

from isees_uap_v0_baseline import ISEES_UAP
from testing.adversarial_generator import get_adversarial_tests
from mitigation.false_coherence import apply_false_coherence_penalty
from mitigation.temporal_alignment import temporal_entropy_adjustment


def post_penalty_classification(engine, C, H):

    if C < 0.85:
        if C >= engine.coherence_threshold:
            return "PARTIAL"
        return "NOISE"

    return engine.classify(C, H)


def run_phase4():

    engine = ISEES_UAP()
    tests = get_adversarial_tests()

    for name, (s, r, e, expected) in tests.items():

        base_result = engine.run(s, r, e)

        # Phase 3
        adjusted_C = apply_false_coherence_penalty(
            base_result.coherence,
            s.values
        )

        # Phase 4
        adjusted_H = temporal_entropy_adjustment(
            s.values,
            r.values,
            base_result.entropy
        )

        classification = post_penalty_classification(
            engine,
            adjusted_C,
            adjusted_H
        )

        print(f"\n{name.upper()}")
        print(f"EXPECTED: {expected}")
        print(f"BASE:     {base_result.classification}")
        print(f"ADJUSTED: {classification}")
        print(f"C: {base_result.coherence} → {adjusted_C}")
        print(f"H: {base_result.entropy} → {adjusted_H}")


if __name__ == "__main__":
    run_phase4()