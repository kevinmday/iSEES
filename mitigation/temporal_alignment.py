# ============================================================
# mitigation/temporal_alignment.py
# iSEES-UAP — Phase 4 Temporal Alignment (FINAL CLEAN)
# ============================================================

import numpy as np


def normalize_series(values: np.ndarray) -> np.ndarray:
    if len(values) == 0:
        return values

    min_v = np.min(values)
    max_v = np.max(values)

    if max_v - min_v == 0:
        return values

    return (values - min_v) / (max_v - min_v)


def sliding_correlation(a: np.ndarray, b: np.ndarray) -> float:

    if len(a) == 0 or len(b) == 0:
        return 0.0

    a = normalize_series(a)
    b = normalize_series(b)

    min_len = min(len(a), len(b))
    max_corr = 0.0

    for shift in range(-min_len + 1, min_len):

        if shift < 0:
            a_slice = a[:shift]
            b_slice = b[-shift:]
        else:
            a_slice = a[shift:]
            b_slice = b[:len(a_slice)]

        # Enforce equal lengths
        L = min(len(a_slice), len(b_slice))
        if L < 2:
            continue

        a_slice = a_slice[:L]
        b_slice = b_slice[:L]

        # --- FINAL FIX: skip zero-variance slices ---
        if np.std(a_slice) < 1e-6 or np.std(b_slice) < 1e-6:
            continue

        corr = np.corrcoef(a_slice, b_slice)[0, 1]

        if not np.isnan(corr):
            max_corr = max(max_corr, corr)

    return max_corr


def temporal_entropy_adjustment(sensor_values: np.ndarray,
                                 report_values: np.ndarray,
                                 base_entropy: float) -> float:

    corr = sliding_correlation(sensor_values, report_values)

    if corr > 0.8:
        return round(base_entropy * 0.5, 4)

    if corr > 0.5:
        return round(base_entropy * 0.75, 4)

    if corr < 0.2:
        return round(min(1.0, base_entropy * 1.5), 4)

    return base_entropy