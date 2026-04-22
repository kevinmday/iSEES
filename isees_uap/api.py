# ============================================================
# isees_uap/api.py
# Flexible API — supports raw JSON + future report JSON
# ============================================================

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
import os
import json

app = FastAPI()

# allow React dev server
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

OUTPUT_DIR = os.path.join(os.path.dirname(__file__), "output")


# ------------------------------------------------------------
# LIST AVAILABLE CASES
# ------------------------------------------------------------
@app.get("/cases")
def list_cases():
    files = os.listdir(OUTPUT_DIR)

    case_names = set()

    for f in files:
        if f.endswith(".json"):
            # strip _report if present
            name = f.replace("_report.json", "").replace(".json", "")
            case_names.add(name)

    return sorted(case_names)


# ------------------------------------------------------------
# GET REPORT (SMART LOADER)
# ------------------------------------------------------------
@app.get("/report/{case_name}")
def get_report(case_name: str):

    case_name = case_name.lower()

    # 1. Prefer structured report if it exists
    report_path = os.path.join(OUTPUT_DIR, f"{case_name}_report.json")

    if os.path.exists(report_path):
        with open(report_path, "r") as f:
            return json.load(f)

    # 2. Fallback to raw JSON (current state)
    raw_path = os.path.join(OUTPUT_DIR, f"{case_name}.json")

    if os.path.exists(raw_path):
        with open(raw_path, "r") as f:
            data = json.load(f)

        # Wrap into UI-friendly structure (minimal bridge)
        return {
            "event": case_name.upper(),
            "mode": "INVESTIGATION_REQUIRED",
            "gap_type": "INCOMPLETE_SIGNAL",
            "recommended_actions": [
                "Expand time window",
                "Query nearby assets",
                "Check environmental interference"
            ],
            "top_vectors": data.get("top_vectors", []),
            "raw": data
        }

    # 3. Not found
    return {"error": "not found"}