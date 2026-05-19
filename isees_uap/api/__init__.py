# ============================================================
# iSEES UAP API — CORE ENDPOINTS
# LIVE INGESTION + REPORT BRIDGE ENABLED
# LIVE CLUSTER PROPAGATION ENABLED
# FULL DROP-IN REPLACEMENT
# ============================================================

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from typing import Dict, List, Optional

from isees_uap.analysis.cluster_engine import run_cluster_engine
from isees_uap.api.submit_report import build_report

# ------------------------------------------------------------
# APP INIT
# ------------------------------------------------------------

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

# ------------------------------------------------------------
# GLOBAL STORES
# ------------------------------------------------------------

clusters_store: List[Dict] = []

report_store: Dict[str, Dict] = {}

# ============================================================
# ROOT
# ============================================================

@app.get("/")
def root():

    return {
        "status": "iSEES UAP API LIVE"
    }

# ============================================================
# MANUAL CLUSTER ENGINE RUN
# ============================================================

@app.get("/run")
def run() -> Dict:
    """
    Trigger cluster engine manually.
    """

    result = run_cluster_engine()

    clusters = (
        result.get("clusters")
        if isinstance(result, dict)
        else result
    )

    if isinstance(clusters, list):

        clusters_store.clear()

        clusters_store.extend(clusters)

        # ----------------------------------------------------
        # BUILD REPORT STORE
        # ----------------------------------------------------

        report_store.clear()

        for c in clusters:

            event_id = (
                c.get("event_id")
                or c.get("id")
                or "UNKNOWN"
            )

            report_store[event_id] = {
                "event_id": event_id,

                "cluster_size": c.get(
                    "cluster_size",
                    len(c.get("reports", []))
                ),

                "reportsData": c.get(
                    "reports",
                    []
                ),

                "raw": c,

                "top_vectors": c.get(
                    "top_vectors",
                    []
                ),

                "gap_type": c.get(
                    "gap_type",
                    "UNKNOWN"
                ),
            }

    return {
        "status": "cluster_engine_executed",

        "cluster_count": len(clusters_store),

        "clusters": clusters_store,
    }

# ============================================================
# CLUSTERS
# ============================================================

@app.get("/clusters")
def get_clusters() -> List[Dict]:

    return clusters_store

# ============================================================
# 🔥 LIVE REPORT INGESTION
# ============================================================

@app.post("/report")
def submit_report(payload: Dict):
    """
    Primary public ROR ingestion endpoint.
    """

    report = build_report(payload)

    report_id = report.get("report_id")

    # --------------------------------------------------------
    # STORE REPORT
    # --------------------------------------------------------

    report_store[report_id] = {
        "event_id": report_id,

        "cluster_size": 1,

        "reportsData": [report],

        "raw": report,

        "top_vectors": [],

        "gap_type": "INITIAL_INGEST",
    }

    # --------------------------------------------------------
    # LIVE CLUSTER INSERTION
    # --------------------------------------------------------

    live_cluster = {

        "event_id": report_id,

        "cluster_size": 1,

        "reports": [report],

        "reportsData": [report],

        "top_vectors": [],

        "gap_type": "LIVE_ROR",

        "location": report.get(
            "location",
            "UNKNOWN"
        ),

        "confidence": 0.72,

        "reports_count": 1,

        "active": True,
    }

    # --------------------------------------------------------
    # INSERT AT TOP OF ACTIVE RADAR
    # --------------------------------------------------------

    clusters_store.insert(
        0,
        live_cluster
    )

    return {
        "status": "report_ingested",

        "report_id": report_id,

        "report": report,

        "live_cluster_inserted": True,

        "cluster_count": len(clusters_store),
    }

# ============================================================
# REPORT RETRIEVAL
# ============================================================

@app.get("/report/{event_id}")
def get_report(event_id: str) -> Optional[Dict]:
    """
    Retrieve operational report package.
    """

    report = report_store.get(event_id)

    if not report:

        return {
            "event_id": event_id,

            "cluster_size": 0,

            "reportsData": [],

            "raw": {},

            "top_vectors": [],

            "gap_type": "NO_DATA",
        }

    return report