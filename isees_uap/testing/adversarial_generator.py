# ============================================================
# testing/adversarial_generator.py
# iSEES-UAP — Phase 2 Failure Mode Injection
# ============================================================

import numpy as np
from isees_uap_v0_baseline import SensorData, ReportData, EnvironmentData


# ------------------------------------------------------------
# FALSE COHERENCE CASES
# Smooth, aligned signals that SHOULD NOT be trusted
# ------------------------------------------------------------

def false_coherence_case_1():
    return (
        SensorData(values=np.array([0.85, 0.86, 0.85]), delta=0.05, noise=0.05),
        ReportData(values=np.array([0.84, 0.85]), delta=0.05, confidence=0.6),
        EnvironmentData(values=np.array([0.9]), stability=0.9),
        "SHOULD_DEGRADE"
    )


def false_coherence_case_2():
    return (
        SensorData(values=np.array([0.9, 0.9, 0.9]), delta=0.01, noise=0.01),
        ReportData(values=np.array([0.9, 0.9]), delta=0.01, confidence=0.5),
        EnvironmentData(values=np.array([0.95]), stability=0.95),
        "SHOULD_DEGRADE"
    )


# ------------------------------------------------------------
# DECEPTION CASES
# Structured but misleading inputs
# ------------------------------------------------------------

def deception_case_1():
    return (
        SensorData(values=np.array([0.8, 0.82, 0.81]), delta=0.7, noise=0.1),
        ReportData(values=np.array([0.2, 0.25]), delta=0.1, confidence=0.8),
        EnvironmentData(values=np.array([0.85]), stability=0.8),
        "SHOULD_FLAG"
    )


def deception_case_2():
    return (
        SensorData(values=np.array([0.7, 0.72, 0.71]), delta=0.6, noise=0.1),
        ReportData(values=np.array([0.3, 0.35]), delta=0.2, confidence=0.9),
        EnvironmentData(values=np.array([0.9]), stability=0.85),
        "SHOULD_FLAG"
    )


# ------------------------------------------------------------
# SENSOR GAP / MISMATCH CASES
# Missing or inconsistent modalities
# ------------------------------------------------------------

def sensor_gap_case_1():
    return (
        SensorData(values=np.array([0.9]), delta=0.5, noise=0.1),  # single sensor
        ReportData(values=np.array([0.4, 0.45]), delta=0.2, confidence=0.6),
        EnvironmentData(values=np.array([0.7]), stability=0.6),
        "SHOULD_FLAG"
    )


def sensor_gap_case_2():
    return (
        SensorData(values=np.array([0.8, 0.2]), delta=0.9, noise=0.7),
        ReportData(values=np.array([0.85, 0.9]), delta=0.05, confidence=0.8),
        EnvironmentData(values=np.array([0.6]), stability=0.5),
        "SHOULD_FLAG"
    )


# ------------------------------------------------------------
# COLLECT ALL ADVERSARIAL CASES
# ------------------------------------------------------------

def get_adversarial_tests():
    return {
        "false_coherence_1": false_coherence_case_1(),
        "false_coherence_2": false_coherence_case_2(),
        "deception_1": deception_case_1(),
        "deception_2": deception_case_2(),
        "sensor_gap_1": sensor_gap_case_1(),
        "sensor_gap_2": sensor_gap_case_2(),
    }