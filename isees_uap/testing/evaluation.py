# ============================================================
# testing/evaluation.py
# iSEES-UAP — Phase 1 Test Runner
# ============================================================

from isees_uap_v0_baseline import ISEES_UAP
from testing.test_cases import get_all_tests


def run_all_tests():

    engine = ISEES_UAP()

    tests = get_all_tests()

    results = {}

    for name, (s, r, e, expected) in tests.items():

        result = engine.run(s, r, e)

        passed = result.classification == expected

        results[name] = {
            "expected": expected,
            "actual": result.classification,
            "coherence": result.coherence,
            "entropy": result.entropy,
            "pass": passed
        }

        print(f"\n{name.upper()}")
        print(f"EXPECTED: {expected}")
        print(f"ACTUAL:   {result.classification}")
        print(f"C: {result.coherence} | H: {result.entropy}")
        print(f"PASS: {passed}")

    return results


if __name__ == "__main__":
    run_all_tests()