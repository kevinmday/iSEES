from marketmind_engine.intelligence.field_stress import (
    analyze_field_stress,
    summarize_stress,
    debug_print
)

# ------------------------------------------------------------
# MOCK DATA (mirrors your live patterns)
# ------------------------------------------------------------

symbol_states = {
    # Finance (persistent)
    "TBBK": {"prop": 0.69, "persist": 190, "drift": 0.017, "stab": 134},
    "MMT": {"prop": 0.57, "persist": 185, "drift": 0.012, "stab": 107},

    # Your AGM case
    "AGM": {"prop": 0.174, "persist": 3705, "drift": -0.0035, "stab": 0.0},

    # Biopharma ignition
    "EOSE": {"prop": 0.02, "persist": 50, "drift": 0.012, "stab": 0.01},

    # Noise
    "XYZ": {"prop": 0.01, "persist": 5, "drift": 0.0001, "stab": 0.0},
}

results = analyze_field_stress(symbol_states)
summary = summarize_stress(results)

debug_print(results, summary)