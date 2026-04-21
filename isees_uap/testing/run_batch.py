# ============================================================
# testing/run_batch.py
# iSEES-UAP — Phase 10 Batch Runner
# ============================================================

import os

from isees_uap_v0_baseline import ISEES_UAP

from input.case_loader import load_case

from mitigation.false_coherence import apply_false_coherence_penalty
from mitigation.temporal_alignment import temporal_entropy_adjustment
from mitigation.sparse_data import sparse_penalty
from mitigation.deception import apply_deception_penalty, generate_deception_flags

from tokens.token_extractor import extract_all_tokens
from search.search_vector_engine import rank_vectors

from output.reporter import build_report, explain_classification, export_json, export_text


def run_batch(case_dir="cases"):

    engine = ISEES_UAP()

    for file in os.listdir(case_dir):

        if not file.endswith(".json"):
            continue

        path = os.path.join(case_dir, file)
        name = file.replace(".json", "")

        s, r, e = load_case(path)

        base = engine.run(s, r, e)

        C1 = apply_false_coherence_penalty(base.coherence, s.values)
        C2 = sparse_penalty(C1, s.values, r.values, e.values)

        C3 = apply_deception_penalty(
            C2, s.values, r.values,
            base.coherence, base.entropy
        )

        H2 = temporal_entropy_adjustment(s.values, r.values, base.entropy)

        flags = generate_deception_flags(
            s.values, r.values,
            base.coherence, base.entropy
        )

        classification = engine.classify(C3, H2)

        s_tokens, r_tokens, e_tokens = extract_all_tokens(s, r, e)
        vectors = rank_vectors(s_tokens, r_tokens, e_tokens, C3, H2)

        report = build_report(
            name,
            [base.coherence, C1, C2, C3],
            [base.entropy, H2],
            classification,
            flags,
            vectors
        )

        explanation = explain_classification(C3, H2, flags)

        print(f"\n{name.upper()}")
        print(f"CLASS: {classification}")
        print(f"EXPLAIN: {explanation}")

        export_json(report, f"output/{name}.json")
        export_text(report, f"output/{name}.txt")