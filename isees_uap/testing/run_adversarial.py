# ============================================================
# testing/run_adversarial.py
# iSEES-UAP — Phase 2 Runner
# ============================================================

from isees_uap_v0_baseline import ISEES_UAP
from testing.adversarial_generator import get_adversarial_tests


def run_adversarial():

    engine = ISEES_UAP()
    tests = get_adversarial_tests()

    for name, (s, r, e, expected) in tests.items():

        result = engine.run(s, r, e)

        print(f"\n{name.upper()}")
        print(f"EXPECTED: {expected}")
        print(f"ACTUAL:   {result.classification}")
        print(f"C: {result.coherence} | H: {result.entropy}")
        print(f"FLAGS: {result.search_vectors[0].source if result.search_vectors else {}}")


if __name__ == "__main__":
    run_adversarial()