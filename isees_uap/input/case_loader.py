# ============================================================
# input/case_loader.py
# iSEES-UAP — Phase 10 Case Loader
# ============================================================

import json
import numpy as np

from isees_uap_v0_baseline import SensorData, ReportData, EnvironmentData


def load_case(filepath: str):

    with open(filepath, "r") as f:
        data = json.load(f)

    s = SensorData(
        values=np.array(data["sensor"]["values"]),
        delta=data["sensor"]["delta"],
        noise=data["sensor"]["noise"]
    )

    r = ReportData(
        values=np.array(data["report"]["values"]),
        delta=data["report"]["delta"],
        confidence=data["report"]["confidence"]
    )

    e = EnvironmentData(
        values=np.array(data["environment"]["values"]),
        stability=data["environment"]["stability"]
    )

    return s, r, e