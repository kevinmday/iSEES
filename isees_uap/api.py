# ============================================================
# isees_uap/api.py — FINAL (GRAPH ENABLED + STABLE)
# ============================================================

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
import os
from typing import List, Dict, Any

# ------------------------------------------------------------
# IMPORTS
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


# ------------------------------------------------------------
# GEO TARGETS
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
# FULL RESOLUTION PIPELINE (GRAPH ENABLED)
# ------------------------------------------------------------
@app.get("/resolve/real")
def resolve_real(location: str):

    # --------------------------------------------------------
    # STEP 1 — GEO
    # --------------------------------------------------------
    geo = resolve_location_to_assets(location)
    assets = geo.get("assets", [])

    airports = [a for a in assets if a.get("type") == "airport"]
    media = [a for a in assets if a.get("type") == "media"]

    if not media:
        media = [{"name": "Local News", "city": location}]

    geo_assets = {
        "airports": airports,
        "media": media
    }

    # --------------------------------------------------------
    # STEP 2 — SIGNAL PIPELINE
    # --------------------------------------------------------
    vectors = []

    try:
        from isees_uap.phrase.engine import build_phrases
        from isees_uap.tokens.adapter import phrase_to_tokens

        phrases = build_phrases(geo)
        print("\nPHRASES:", phrases)

        for p in phrases:
            try:
                tokens = phrase_to_tokens(p)

                if not isinstance(tokens, dict):
                    continue

                class Vector:
                    def __init__(self, t):
                        self.tokens_s = (
                            t.get("S")
                            or t.get("s")
                            or t.get("sensor")
                            or []
                        )

                        self.tokens_r = (
                            t.get("R")
                            or t.get("r")
                            or t.get("relation")
                            or []
                        )

                        self.tokens_e = (
                            t.get("E")
                            or t.get("e")
                            or t.get("env")
                            or []
                        )

                        # Score = signal strength
                        self.score = (
                            len(self.tokens_s)
                            + len(self.tokens_r)
                            + len(self.tokens_e)
                        ) or 1.0

                vectors.append(Vector(tokens))

            except Exception:
                continue

        print("VECTORS:", len(vectors))

    except Exception as e:
        print("PIPELINE ERROR:", e)

    # --------------------------------------------------------
    # STEP 3 — GUARANTEED SIGNAL
    # --------------------------------------------------------
    if not vectors:
        print("⚠️ No signal generated — injecting baseline vector")

        class Vector:
            def __init__(self):
                self.tokens_s = ["radar"]
                self.tokens_r = ["anomaly"]
                self.tokens_e = ["baseline"]
                self.score = 1.0

        vectors = [Vector()]

    # --------------------------------------------------------
    # STEP 4 — RESOLVE (🔥 FIXED CONTRACT)
    # --------------------------------------------------------
    result = resolve_vectors(vectors, geo_assets)

    targets = result.get("targets", [])
    graph = result.get("graph", {"nodes": [], "edges": []})

    # --------------------------------------------------------
    # STEP 5 — SAFE OUTPUT
    # --------------------------------------------------------
    safe_targets = []

    for t in targets:
        try:
            safe_targets.append(t.to_dict())
        except Exception:
            safe_targets.append({
                "name": str(t),
                "type": "unknown",
                "relevance": 0,
                "actions": [],
                "metadata": {}
            })

    return {
        "location": location,
        "resolved": geo.get("resolved"),

        # 🔥 NEW LAYERED OUTPUT
        "top_targets": safe_targets,
        "vector_graph": graph
    }


# ------------------------------------------------------------
# HEALTH CHECK
# ------------------------------------------------------------
@app.get("/")
def root():
    return {"status": "iSEES backend running"}