# ============================================================
# iSEES UAP API — CORE ENDPOINTS (CORS + REPORT ENABLED)
# FULL DROP-IN REPLACEMENT
# ============================================================

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from typing import Dict, List, Optional

from isees_uap.analysis.cluster_engine import run_cluster_engine

# ------------------------------------------------------------
# APP INIT
# ------------------------------------------------------------

app = FastAPI()

# ------------------------------------------------------------
# 🔥 CORS FIX (REQUIRED FOR UI)
# ------------------------------------------------------------

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # dev mode (lock down later)
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ------------------------------------------------------------
# GLOBAL STORES (RUNTIME MEMORY)
# ------------------------------------------------------------

clusters_store: List[Dict] = []
report_store: Dict[str, Dict] = {}  # keyed by event_id

# ------------------------------------------------------------
# ROOT
# ------------------------------------------------------------

@app.get("/")
def root():
    return {"status": "iSEES UAP API LIVE"}

# ------------------------------------------------------------
# MANUAL RUN (TRIGGERS CLUSTER ENGINE)
# ------------------------------------------------------------

@app.get("/run")
def run() -> Dict:
    """
    Manually trigger cluster engine.
    Stores clusters AND builds report store.
    """

    result = run_cluster_engine()

    clusters = result.get("clusters") if isinstance(result, dict) else result

    if isinstance(clusters, list):
        clusters_store.clear()
        clusters_store.extend(clusters)

        # ----------------------------------------------------
        # 🔥 BUILD REPORT STORE FROM CLUSTERS
        # ----------------------------------------------------
        report_store.clear()

        for c in clusters:
            event_id = c.get("event_id") or c.get("id") or "UNKNOWN"

            report_store[event_id] = {
                "event_id": event_id,
                "cluster_size": c.get("cluster_size", len(c.get("reports", []))),
                "reportsData": c.get("reports", []),
                "raw": c,
                "top_vectors": c.get("top_vectors", []),
                "gap_type": c.get("gap_type", "UNKNOWN"),
            }

    return {
        "status": "cluster_engine_executed",
        "cluster_count": len(clusters_store),
        "clusters": clusters_store
    }

# ------------------------------------------------------------
# CLUSTERS (PRIMARY UI ENDPOINT)
# ------------------------------------------------------------

@app.get("/clusters")
def get_clusters() -> List[Dict]:
    return clusters_store

# ------------------------------------------------------------
# 🔥 REPORT ENDPOINT (UI CLICK HANDLER DEPENDS ON THIS)
# ------------------------------------------------------------

@app.get("/report/{event_id}")
def get_report(event_id: str) -> Optional[Dict]:
    """
    Returns report for selected event.
    This FIXES the RightPanel + CenterPanel bridge.
    """

    report = report_store.get(event_id)

    if not report:
        return {
            "event_id": event_id,
            "cluster_size": 0,
            "reportsData": [],
            "raw": {},
            "top_vectors": [],
            "gap_type": "NO_DATA"
        }

    return report