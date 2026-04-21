# ============================================================
# testing/run_phase3.py
# iSEES-UAP — Phase 3 Integration Runner (FINAL)
# ============================================================

from isees_uap_v0_baseline import ISEES_UAP
from testing.adversarial_generator import get_adversarial_tests
from mitigation.false_coherence import apply_false_coherence_penalty


def post_penalty_classification(engine, C, H):
    """
    Enforces stricter interpretation after coherence penalty
    WITHOUT modifying baseline classifier
    """

    # Hard gate: penalized coherence cannot claim HIGH_CONFIDENCE
    if C < 0.85:
        if C >= engine.coherence_threshold:
            return "PARTIAL"
        return "NOISE"

    # Otherwise use baseline logic
    return engine.classify(C, H)


def run_phase3():

    engine = ISEES_UAP()
    tests = get_adversarial_tests()

    for name, (s, r, e, expected) in tests.items():

        base_result = engine.run(s, r, e)

        adjusted_C = apply_false_coherence_penalty(
            base_result.coherence,
            s.values
        )

        classification = post_penalty_classification(
            engine,
            adjusted_C,
            base_result.entropy
        )

        print(f"\n{name.upper()}")
        print(f"EXPECTED: {expected}")
        print(f"BASE:     {base_result.classification}")
        print(f"ADJUSTED: {classification}")
        print(f"C: {base_result.coherence} → {adjusted_C} | H: {base_result.entropy}")


if __name__ == "__main__":
    run_phase3()