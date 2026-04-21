# ============================================================
# tokens/token_extractor.py
# iSEES-UAP — Phase 6 Token Extraction Engine
# ============================================================

import numpy as np
from tokens.token_library import SENSOR_TOKENS, REPORT_TOKENS, ENV_TOKENS


def expand_tokens(token_dict, key):
    return token_dict.get(key, [])


def extract_sensor_tokens(values: np.ndarray, delta: float, noise: float):
    tokens = []

    if np.mean(values) > 0.7:
        tokens += expand_tokens(SENSOR_TOKENS, "high_signal")

    if noise < 0.3:
        tokens += expand_tokens(SENSOR_TOKENS, "low_noise")

    if delta > 0.5:
        tokens += expand_tokens(SENSOR_TOKENS, "persistence")

    tokens += expand_tokens(SENSOR_TOKENS, "anomaly")

    return list(set(tokens))


def extract_report_tokens(values: np.ndarray, delta: float, confidence: float):
    tokens = []

    if confidence > 0.7:
        tokens += expand_tokens(REPORT_TOKENS, "visual")

    if delta > 0.4:
        tokens += expand_tokens(REPORT_TOKENS, "motion")

    tokens += expand_tokens(REPORT_TOKENS, "propulsion")

    return list(set(tokens))


def extract_env_tokens(values: np.ndarray, stability: float):
    tokens = []

    if stability > 0.7:
        tokens += expand_tokens(ENV_TOKENS, "clear")

    tokens += expand_tokens(ENV_TOKENS, "stable")

    return list(set(tokens))


def extract_all_tokens(s, r, e):
    s_tokens = extract_sensor_tokens(s.values, s.delta, s.noise)
    r_tokens = extract_report_tokens(r.values, r.delta, r.confidence)
    e_tokens = extract_env_tokens(e.values, e.stability)

    return s_tokens, r_tokens, e_tokens