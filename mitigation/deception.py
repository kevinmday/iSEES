# ============================================================
# mitigation/deception.py
# iSEES-UAP — Phase 8 Deception Detection (FINAL LOCKED)
# ============================================================

import numpy as np


def curvature(values: np.ndarray) -> float:
    if len(values) < 3:
        return 0.0
    diffs = np.diff(values)
    return np.mean(np.abs(np.diff(diffs)))


def smoothness(values: np.ndarray) -> float:
    return np.var(values)


def persistence(values: np.ndarray) -> float:
    """
    Measures how constant the signal is across time
    """
    if len(values) < 2:
        return 0.0
    return 1.0 - (np.std(values) / (np.mean(values) + 1e-6))


def deception_score(sensor_values: np.ndarray,
                    report_values: np.ndarray,
                    original_coherence: float,
                    entropy: float) -> float:
    """
    Detect deception using ORIGINAL signal strength (pre-penalty)
    AND entropy gating (structure must exist to fake)
    """

    # --- GATE: must be strong + structured ---
    if original_coherence < 0.3 or entropy > 0.6:
        return 0.0

    # --- NEW: cross-consistency filter (fixes sensor gap issue) ---
    sensor_mean = np.mean(sensor_values)
    report_mean = np.mean(report_values)

    if abs(sensor_mean - report_mean) > 0.4:
        return 0.0

    mean_val = sensor_mean
    var_val = np.var(sensor_values)

    # weak signal → ignore
    if mean_val < 0.6:
        return 0.0

    # low variance → contributes to suspicion (not rejection)
    low_variance_flag = var_val < 0.01

    s_curv = curvature(sensor_values)
    s_smooth = smoothness(sensor_values)
    s_persist = persistence(sensor_values)

    r_curv = curvature(report_values)
    r_smooth = smoothness(report_values)
    r_persist = persistence(report_values)

    flags = 0

    # variance contributes to suspicion
    if low_variance_flag:
        flags += 1

    # Sensor suspicious structure
    if s_smooth < 0.002 and s_persist > 0.9:
        flags += 1

    if s_curv < 0.002:
        flags += 1

    # Report suspicious structure
    if r_smooth < 0.002 and r_persist > 0.9:
        flags += 1

    if r_curv < 0.002:
        flags += 1

    # Normalize to [0,1]
    return flags / 5.0


def apply_deception_penalty(C: float,
                           sensor_values: np.ndarray,
                           report_values: np.ndarray,
                           original_coherence: float,
                           entropy: float) -> float:

    d_score = deception_score(sensor_values, report_values,
                              original_coherence, entropy)

    # Strong penalty
    if d_score > 0.6:
        return round(C * 0.5, 4)

    # Moderate penalty
    if d_score > 0.3:
        return round(C * 0.75, 4)

    return C


def generate_deception_flags(sensor_values: np.ndarray,
                             report_values: np.ndarray,
                             original_coherence: float,
                             entropy: float) -> dict:

    d_score = deception_score(sensor_values, report_values,
                              original_coherence, entropy)

    flags = {}

    if d_score > 0.6:
        flags["high_deception"] = True
    elif d_score > 0.3:
        flags["moderate_deception"] = True

    return flags