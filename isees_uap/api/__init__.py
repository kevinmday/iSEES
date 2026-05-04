# ============================================================
# iSEES UAP API — CORE ENDPOINTS (CLUSTER ENABLED)
# FULL DROP-IN REPLACEMENT
# ============================================================

from fastapi import FastAPI
from typing import Dict, List

from isees_uap.analysis.cluster_engine import run_cluster_engine

# ------------------------------------------------------------
# APP INIT
# ------------------------------------------------------------

app = FastAPI()

# ------------------------------------------------------------
# GLOBAL CLUSTER STORE (RUNTIME MEMORY)
# ------------------------------------------------------------

clusters_store: List[Dict] = []

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
    Stores result into global cluster store.
    """

    result = run_cluster_engine()

    # Expecting either:
    # - {"clusters": [...]} OR
    # - direct list of clusters
    clusters = result.get("clusters") if isinstance(result, dict) else result

    if isinstance(clusters, list):
        clusters_store.clear()
        clusters_store.extend(clusters)

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
    """
    Returns latest clusters for UI consumption.
    """
    return clusters_store