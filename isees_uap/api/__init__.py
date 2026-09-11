# ============================================================
# iSEES UAP API — CORE ENDPOINTS
# LIVE INGESTION + REPORT BRIDGE ENABLED
# LIVE CLUSTER PROPAGATION ENABLED
# FULL DROP-IN REPLACEMENT
# ============================================================

from fastapi import APIRouter, FastAPI
from fastapi.middleware.cors import CORSMiddleware
import os

from typing import Dict, List, Mapping, Optional

from isees_uap.analysis.cluster_engine import run_cluster_engine
from isees_uap.api.submit_report import build_report
from isees_uap.api.v1.candidate_evidence import (
    candidate_error_handler, native_case_router, router as candidate_evidence_router,
)
from isees_uap.candidate_evidence.errors import CandidateEvidenceError
from isees_uap.api.v1.studio import router as studio_router, studio_error_handler
from isees_uap.studio.errors import StudioError
from isees_uap.api.v1.research_sources import router as research_sources_router
from isees_uap.api.v1.investigations import (
    investigation_error_handler,
    router as investigations_router,
)
from isees_uap.investigations.errors import InvestigationLibraryError
from isees_uap.api.v1.authentication import (
    authentication_error_handler,
    router as authentication_router,
)
from isees_uap.authentication.errors import AuthenticationError
from isees_uap.api.application import (
    process_studio_v1_configuration,
    studio_v1_application_lifespan,
)
from isees_uap.studio.v1.lifecycle import StudioV1LifecycleConfiguration
from isees_uap.api.v1.studio_v1 import (
    router as studio_v1_router, StudioV1ApiError, studio_v1_error_handler,
)
from isees_uap.studio.v1.persistence import StudioV1Failure

# ------------------------------------------------------------
# APP INIT
# ------------------------------------------------------------

core_router = APIRouter()

# ------------------------------------------------------------
# CORS
# ------------------------------------------------------------

# ------------------------------------------------------------
# GLOBAL STORES
# ------------------------------------------------------------

clusters_store: List[Dict] = []

report_store: Dict[str, Dict] = {}

# ============================================================
# ROOT
# ============================================================

@core_router.get("/")
def root():

    return {
        "status": "iSEES UAP API LIVE"
    }

# ============================================================
# MANUAL CLUSTER ENGINE RUN
# ============================================================

@core_router.get("/run")
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

@core_router.get("/clusters")
def get_clusters() -> List[Dict]:

    return clusters_store

# ============================================================
# 🔥 LIVE REPORT INGESTION
# ============================================================

@core_router.post("/report")
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

@core_router.get("/report/{event_id}")
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


def create_application(
    studio_v1_configuration: StudioV1LifecycleConfiguration | Mapping[str, str] | None = None,
) -> FastAPI:
    """Construct the production API with injectable STUDIO deployment configuration."""
    if studio_v1_configuration is None:
        configuration = process_studio_v1_configuration()
    elif isinstance(studio_v1_configuration, StudioV1LifecycleConfiguration):
        configuration = studio_v1_configuration
    else:
        from isees_uap.api.application import studio_v1_deployment_configuration
        configuration = studio_v1_deployment_configuration(studio_v1_configuration)
    application = FastAPI(lifespan=studio_v1_application_lifespan(configuration))
    application.include_router(authentication_router)
    application.add_exception_handler(AuthenticationError, authentication_error_handler)
    application.include_router(candidate_evidence_router)
    application.include_router(native_case_router)
    application.include_router(research_sources_router)
    application.add_exception_handler(CandidateEvidenceError, candidate_error_handler)
    application.include_router(studio_router)
    application.add_exception_handler(StudioError, studio_error_handler)
    application.include_router(investigations_router)
    application.add_exception_handler(InvestigationLibraryError, investigation_error_handler)
    application.include_router(studio_v1_router)
    application.add_exception_handler(StudioV1ApiError, studio_v1_error_handler)
    application.add_exception_handler(StudioV1Failure, studio_v1_error_handler)
    application.add_middleware(
        CORSMiddleware,
        allow_origins=[
            origin.strip()
            for origin in os.environ.get(
                "ISEES_CORS_ORIGINS", "http://localhost:5173,http://127.0.0.1:5173"
            ).split(",")
            if origin.strip()
        ],
        allow_credentials=True,
        allow_methods=["GET", "POST", "PUT", "OPTIONS"],
        allow_headers=[
            "Content-Type",
            "X-ISEES-CSRF",
            "X-ISEES-Principal-Id",
            "X-Request-Id",
        ],
    )
    application.include_router(core_router)
    return application


app = create_application()
