# ============================================================
# isees_uap/api.py — STABLE + PHASE 5A (CORRECT ASSET HANDLING)
# ============================================================

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
import os
import json
from typing import List, Dict, Any

# ------------------------------------------------------------
# IMPORTS (FIXED — ABSOLUTE)
# ------------------------------------------------------------
from isees_uap.geo.resolver import resolve_location_to_assets
from isees_uap.target.fusion import build_geo_targets
from isees_uap.resolution.source_resolver import resolve_vectors


app = FastAPI()

# ------------------------------------------------------------
# CORS
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
# NORMALIZE REPORT
# ------------------------------------------------------------
def normalize_report(data: Dict[str, Any], case_name: str) -> Dict[str, Any]:

    gap_type = data.get("gap_type")

    data_complete = data.get("data_complete")
    actions_remaining = data.get("actions_remaining")

    if not gap_type and data_complete is False:
        gap_type = "UNKNOWN_GAP"

    if data_complete is None:
        data_complete = False if gap_type else True

    if actions_remaining is None:
        actions_remaining = True if not data_complete else False

    return {
        "event": data.get("event", case_name.upper()),
        "gap_type": gap_type,
        "data_complete": data_complete,
        "actions_remaining": actions_remaining,
        "recommended_actions": data.get("recommended_actions", []),
        "top_vectors": data.get("top_vectors", []),
    }


# ------------------------------------------------------------
# CASE LIST
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
# REPORT
# ------------------------------------------------------------
@app.get("/report/{case_name}")
def get_report(case_name: str):

    case_name = case_name.lower()

    report_path = os.path.join(OUTPUT_DIR, f"{case_name}_report.json")

    if os.path.exists(report_path):
        with open(report_path, "r") as f:
            data = json.load(f)
        return normalize_report(data, case_name)

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
# GEO TARGETS (existing)
# ------------------------------------------------------------
@app.get("/geo/targets")
def geo_targets(location: str):
    resolved = resolve_location_to_assets(location)
    targets = build_geo_targets(resolved)

    return {
        "location": location,
        "resolved": resolved.get("resolved"),
        "targets": targets
    }


# ------------------------------------------------------------
# REAL RESOLUTION (PHASE 5A — CORRECTED)
# ------------------------------------------------------------
@app.get("/resolve/real")
def resolve_real(location: str):
    """
    Real pipeline using actual geo resolution + correct asset mapping
    """

    # --------------------------------------------------------
    # STEP 1 — GEO RESOLUTION
    # --------------------------------------------------------
    geo = resolve_location_to_assets(location)

    assets = geo.get("assets", [])

    # --------------------------------------------------------
    # STEP 2 — SPLIT FLAT LIST INTO TYPES
    # --------------------------------------------------------
    airports = [a for a in assets if a.get("type") == "airport"]
    media = [a for a in assets if a.get("type") == "media"]

    # fallback media (only if none returned)
    if not media:
        media = [{"name": "Local News", "city": location}]

    geo_assets = {
        "airports": airports,
        "media": media
    }

    # --------------------------------------------------------
    # STEP 3 — SIMPLE VECTOR (TEMP BRIDGE)
    # --------------------------------------------------------
    class SimpleVector:
        def __init__(self):
            self.tokens_s = ["radar"]
            self.tokens_r = ["FAA", "anomaly"]
            self.tokens_e = ["geo_context"]
            self.score = 1.0

    vectors = [SimpleVector()]

    # --------------------------------------------------------
    # STEP 4 — RESOLVE INTO TARGETS
    # --------------------------------------------------------
    targets = resolve_vectors(vectors, geo_assets)

    return {
        "location": location,
        "resolved": geo.get("resolved"),
        "targets": [t.to_dict() for t in targets]
    }


# ------------------------------------------------------------
# TEST ENDPOINT (kept for validation)
# ------------------------------------------------------------
@app.get("/resolve/test")
def resolve_test():

    class MockVector:
        def __init__(self):
            self.tokens_s = ["radar"]
            self.tokens_r = ["FAA", "anomaly"]
            self.tokens_e = ["airport", "distance_5.3"]
            self.score = 1.6

    vectors = [MockVector()]

    geo_assets = {
        "airports": [
            {
                "name": "Rogue Valley International Airport",
                "icao": "KMFR",
                "distance": 5.3
            }
        ],
        "media": [
            {"name": "KTVL News 10", "city": "Medford"},
        ]
    }

    targets = resolve_vectors(vectors, geo_assets)

    return {"targets": [t.to_dict() for t in targets]}


# ------------------------------------------------------------
# HEALTH CHECK
# ------------------------------------------------------------
@app.get("/")
def root():
    return {"status": "iSEES backend running"}