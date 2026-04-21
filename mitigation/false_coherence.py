# ============================================================
# mitigation/false_coherence.py
# iSEES-UAP — Phase 3 False Coherence Defense (FINAL FIXED)
# ============================================================

import numpy as np


def curvature_estimate(values: np.ndarray) -> float:
    if len(values) < 3:
        return 0.0
    diffs = np.diff(values)
    return np.mean(np.abs(np.diff(diffs)))


def smoothness_score(values: np.ndarray) -> float:
    return np.var(values)


def normalized_smoothness(values: np.ndarray) -> float:
    mean_val = np.mean(values) + 1e-6
    return smoothness_score(values) / mean_val


def normalized_curvature(values: np.ndarray) -> float:
    mean_val = np.mean(values) + 1e-6
    return curvature_estimate(values) / mean_val


def range_compression(values: np.ndarray) -> float:
    mean_val = np.mean(values) + 1e-6
    return (np.max(values) - np.min(values)) / mean_val


def coherence_penalty(sensor_values: np.ndarray) -> float:

    var_n = normalized_smoothness(sensor_values)
    curv_n = normalized_curvature(sensor_values)
    range_n = range_compression(sensor_values)

    # Count how many "suspicious" conditions are met
    flags = 0

    if var_n < 0.003:
        flags += 1

    if curv_n < 0.006:
        flags += 1

    if range_n < 0.05:
        flags += 1

    # --- STRONG PENALTY ---
    if flags >= 3:
        return 0.2

    # --- MODERATE PENALTY ---
    if flags == 2:
        return 0.5

    return 1.0


def apply_false_coherence_penalty(C: float, sensor_values: np.ndarray) -> float:
    penalty = coherence_penalty(sensor_values)
    return round(C * penalty, 4)