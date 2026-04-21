# ============================================================
# testing/test_cases.py
# iSEES-UAP — Phase 1 Test Harness
# ============================================================

import numpy as np
from isees_uap_v0_baseline import SensorData, ReportData, EnvironmentData


def tic_tac_case():
    return (
        SensorData(values=np.array([0.92, 0.90, 0.91]), delta=0.6, noise=0.1),
        ReportData(values=np.array([0.88, 0.90]), delta=0.55, confidence=0.9),
        EnvironmentData(values=np.array([0.95]), stability=0.9),
        "HIGH_CONFIDENCE"
    )


def omaha_case():
    return (
        SensorData(values=np.array([0.7, 0.65]), delta=0.3, noise=0.25),
        ReportData(values=np.array([0.5, 0.45]), delta=0.35, confidence=0.6),
        EnvironmentData(values=np.array([0.8]), stability=0.7),
        "PARTIAL"
    )


def noise_case():
    return (
        SensorData(values=np.array([0.2, 0.8]), delta=0.9, noise=0.6),
        ReportData(values=np.array([0.1, 0.9]), delta=0.1, confidence=0.3),
        EnvironmentData(values=np.array([0.5]), stability=0.4),
        "NOISE"
    )


def get_all_tests():
    return {
        "tic_tac": tic_tac_case(),
        "omaha": omaha_case(),
        "noise": noise_case()
    }