# ============================================================
# isees_uap/api.py — STEP 3 (CONTRACT + GAP ENFORCEMENT)
# ============================================================

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
import os
import json
from typing import List, Dict, Any

app = FastAPI()

# ------------------------------------------------------------
# CORS (React dev)
# ------------------------------------------------------------
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

BASE_DIR = os.path.dirname(__file__)
OUTPUT_DIR = os.path.join(BASE_DIR, "output")


# ------------------------------------------------------------
# SAFE FILE LIST
# ------------------------------------------------------------
def safe_listdir(path: str) -> List[str]:
    if not os.path.exists(path):
        return []
    return os.listdir(path)


# ------------------------------------------------------------
# NORMALIZE REPORT (ENFORCE CONTRACT + GAP RULE)
# ------------------------------------------------------------
def normalize_report(data: Dict[str, Any], case_name: str) -> Dict[str, Any]:
    """
    Ensures every response matches frontend contract exactly
    and enforces deterministic gap logic.
    """

    gap_type = data.get("gap_type")

    # --------------------------------------------------------
    # CONTRACT FIELDS
    # --------------------------------------------------------
    data_complete = data.get("data_complete")
    actions_remaining = data.get("actions_remaining")

    # --------------------------------------------------------
    # GAP ENFORCEMENT (NEW)
    # --------------------------------------------------------
    # If data is incomplete, we MUST have a gap type
    if not gap_type and data_complete is False:
        gap_type = "UNKNOWN_GAP"

    # --------------------------------------------------------
    # FALLBACK LOGIC
    # --------------------------------------------------------
    if data_complete is None:
        data_complete = False if gap_type else True

    if actions_remaining is None:
        actions_remaining = True if not data_complete else False

    # --------------------------------------------------------
    # FINAL CONTRACT OUTPUT
    # --------------------------------------------------------
    return {
        "event": data.get("event", case_name.upper()),
        "gap_type": gap_type,
        "data_complete": data_complete,
        "actions_remaining": actions_remaining,
        "recommended_actions": data.get("recommended_actions", []),
        "top_vectors": data.get("top_vectors", []),
    }


# ------------------------------------------------------------
# LIST AVAILABLE CASES
# ------------------------------------------------------------
@app.get("/cases")
def list_cases():
    files = safe_listdir(OUTPUT_DIR)

    case_names = set()

    for f in files:
        if f.endswith(".json"):
            name = f.replace("_report.json", "").replace(".json", "")
            case_names.add(name)

    return sorted(case_names)


# ------------------------------------------------------------
# GET REPORT (SMART LOADER + CONTRACT ENFORCER)
# ------------------------------------------------------------
@app.get("/report/{case_name}")
def get_report(case_name: str):

    case_name = case_name.lower()

    # --------------------------------------------------------
    # 1. STRUCTURED REPORT (PREFERRED)
    # --------------------------------------------------------
    report_path = os.path.join(OUTPUT_DIR, f"{case_name}_report.json")

    if os.path.exists(report_path):
        with open(report_path, "r") as f:
            data = json.load(f)

        return normalize_report(data, case_name)

    # --------------------------------------------------------
    # 2. RAW DATA (FALLBACK BRIDGE)
    # --------------------------------------------------------
    raw_path = os.path.join(OUTPUT_DIR, f"{case_name}.json")

    if os.path.exists(raw_path):
        with open(raw_path, "r") as f:
            raw = json.load(f)

        bridge = {
            "event": case_name.upper(),
            "gap_type": "INCOMPLETE_SIGNAL",
            "data_complete": False,
            "actions_remaining": True,
            "recommended_actions": [
                "Expand time window",
                "Query nearby assets",
                "Check environmental interference"
            ],
            "top_vectors": raw.get("top_vectors", []),
        }

        return normalize_report(bridge, case_name)

    # --------------------------------------------------------
    # 3. NOT FOUND (SAFE RESPONSE)
    # --------------------------------------------------------
    fallback = {
        "event": case_name.upper(),
        "gap_type": None,
        "data_complete": False,
        "actions_remaining": True,
        "recommended_actions": [],
        "top_vectors": [],
    }

    return normalize_report(fallback, case_name)


# ------------------------------------------------------------
# HEALTH CHECK
# ------------------------------------------------------------
@app.get("/")
def root():
    return {"status": "iSEES backend running"}