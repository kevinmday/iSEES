# ============================================================
# Ignition Tracker Test — Full Simulation
# ============================================================

from marketmind_engine.intelligence.field_stress import (
    analyze_field_stress,
    debug_print as stress_debug_print,
    summarize_stress
)

from marketmind_engine.intelligence.ignition_tracker import (
    detect_transitions,
    detect_new_ignitions,
    debug_print as tracker_debug_print
)


# ------------------------------------------------------------
# STEP 1 — INITIAL STATE (IGNITION)
# ------------------------------------------------------------

print("\n--- TICK 1: INITIAL IGNITION ---\n")

symbol_states_tick1 = {
    "EOSE": {"prop": 0.02, "persist": 50, "drift": 0.012},   # ignition
    "AGM": {"prop": 0.17, "persist": 3705, "drift": -0.0035}, # distribution
}

results_1 = analyze_field_stress(symbol_states_tick1)
summary_1 = summarize_stress(results_1)

stress_debug_print(results_1, summary_1)

# Detect NEW ignition events
new_ignitions = detect_new_ignitions(results_1)
tracker_debug_print(new_ignitions)

# Initialize state tracking
detect_transitions(results_1)


# ------------------------------------------------------------
# STEP 2 — TRANSITION (IGNITION → CONFIRMED_TREND)
# ------------------------------------------------------------

print("\n--- TICK 2: CONFIRMATION ---\n")

symbol_states_tick2 = {
    "EOSE": {"prop": 0.15, "persist": 150, "drift": 0.02},   # now confirmed
    "AGM": {"prop": 0.17, "persist": 3705, "drift": -0.0035}, # still distribution
}

results_2 = analyze_field_stress(symbol_states_tick2)
summary_2 = summarize_stress(results_2)

stress_debug_print(results_2, summary_2)

# Detect transitions
alerts = detect_transitions(results_2)
tracker_debug_print(alerts)


# ------------------------------------------------------------
# STEP 3 — NO CHANGE (STABILITY CHECK)
# ------------------------------------------------------------

print("\n--- TICK 3: STABLE STATE ---\n")

symbol_states_tick3 = {
    "EOSE": {"prop": 0.16, "persist": 200, "drift": 0.018},  # still confirmed
    "AGM": {"prop": 0.17, "persist": 3705, "drift": -0.004}, # still distribution
}

results_3 = analyze_field_stress(symbol_states_tick3)
summary_3 = summarize_stress(results_3)

stress_debug_print(results_3, summary_3)

alerts = detect_transitions(results_3)
tracker_debug_print(alerts)