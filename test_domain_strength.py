# ============================================================
# Domain Strength Test — Enhanced (Persistence + Ignition)
# ============================================================

from marketmind_engine.intelligence.domain_strength import (
    compute_domain_strength,
    classify_domains,
    debug_print
)


# ------------------------------------------------------------
# MOCK STATE (based on your live run characteristics)
# ------------------------------------------------------------

symbol_states = {
    "TBBK": {"prop": 0.6986, "persist": 190, "drift": 0.0172, "stab": 134.0},
    "MMT": {"prop": 0.5774, "persist": 185, "drift": 0.0120, "stab": 107.0},
    "WBTN": {"prop": 0.5774, "persist": 180, "drift": 0.0120, "stab": 103.0},

    # Biopharma ignition-style signals
    "EOSE": {"prop": 0.02, "persist": 180, "drift": 0.0090, "stab": 0.01},
    "NVST": {"prop": 0.02, "persist": 3600, "drift": 0.0105, "stab": 0.02},
}


# ------------------------------------------------------------
# COMPUTE DOMAIN STRENGTH
# ------------------------------------------------------------

domain_scores, domain_counts = compute_domain_strength(symbol_states)
domain_labels = classify_domains(domain_scores)


# ------------------------------------------------------------
# OUTPUT (structured + readable)
# ------------------------------------------------------------

print("\nDOMAIN FIELD\n")

for domain, info in domain_labels.items():
    print(f"{domain} → {info}")


# ------------------------------------------------------------
# OPTIONAL: FORMATTED DEBUG VIEW
# ------------------------------------------------------------

debug_print(domain_scores, domain_labels)