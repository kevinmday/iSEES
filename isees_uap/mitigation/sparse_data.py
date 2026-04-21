# ============================================================
# mitigation/sparse_data.py
# iSEES-UAP — Phase 5 Sensor Blind Spot Handling
# ============================================================

import numpy as np


def detect_sensor_imbalance(sensor_values: np.ndarray) -> bool:
    """
    Detect extreme imbalance within sensor readings
    """
    if len(sensor_values) < 2:
        return True

    spread = np.max(sensor_values) - np.min(sensor_values)
    return spread > 0.6


def detect_sparse_sensor(sensor_values: np.ndarray) -> bool:
    """
    Detect insufficient sensor coverage
    """
    return len(sensor_values) < 2


def detect_expected_missing(sensor_values: np.ndarray,
                            report_values: np.ndarray,
                            env_values: np.ndarray) -> bool:
    """
    Detect when strong report/environment exists but sensor support is weak
    """
    sensor_strength = np.mean(sensor_values) if len(sensor_values) > 0 else 0
    report_strength = np.mean(report_values) if len(report_values) > 0 else 0
    env_strength = np.mean(env_values) if len(env_values) > 0 else 0

    if report_strength > 0.7 and env_strength > 0.7 and sensor_strength < 0.4:
        return True

    return False


def sparse_penalty(C: float,
                   sensor_values: np.ndarray,
                   report_values: np.ndarray,
                   env_values: np.ndarray) -> float:
    """
    Apply penalty to coherence when sensor blind spots detected
    """

    penalty = 1.0

    if detect_sparse_sensor(sensor_values):
        penalty *= 0.5

    if detect_sensor_imbalance(sensor_values):
        penalty *= 0.6

    if detect_expected_missing(sensor_values, report_values, env_values):
        penalty *= 0.4

    return round(C * penalty, 4)


def generate_sparse_flags(sensor_values: np.ndarray,
                          report_values: np.ndarray,
                          env_values: np.ndarray) -> dict:
    """
    Output diagnostic flags
    """

    flags = {}

    if detect_sparse_sensor(sensor_values):
        flags["sparse_sensor"] = True

    if detect_sensor_imbalance(sensor_values):
        flags["sensor_imbalance"] = True

    if detect_expected_missing(sensor_values, report_values, env_values):
        flags["missing_sensor_expected"] = True

    return flags