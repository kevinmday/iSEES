# ============================================================
# cluster_engine.py — REPORT CLUSTERING ENGINE (V3 + INTEL LAYER)
# ============================================================

import os
import json
from math import radians, sin, cos, sqrt, atan2
from datetime import datetime, UTC
from typing import List, Dict

# 🔥 NEW — INTELLIGENCE LAYER
from isees_uap.analysis.cluster_intelligence import build_cluster_intelligence


# ------------------------------------------------------------
# CONFIG
# ------------------------------------------------------------

BASE_DIR = os.path.dirname(os.path.dirname(__file__))
LOG_DIR = os.path.join(BASE_DIR, "logs")

DISTANCE_THRESHOLD_KM = 100
TIME_WINDOW_SECONDS = 86400


# ------------------------------------------------------------
# HELPERS
# ------------------------------------------------------------

def _haversine_km(lat1, lon1, lat2, lon2):
    R = 6371.0
    dlat = radians(lat2 - lat1)
    dlon = radians(lon2 - lon1)

    a = sin(dlat / 2)**2 + cos(radians(lat1)) * cos(radians(lat2)) * sin(dlon / 2)**2
    c = 2 * atan2(sqrt(a), sqrt(1 - a))

    return R * c


def _parse_time(ts: str):
    dt = datetime.fromisoformat(ts.replace("Z", "+00:00"))

    if dt.tzinfo is None:
        dt = dt.replace(tzinfo=UTC)

    return dt


# ------------------------------------------------------------
# LOAD REPORTS (FULL STRUCTURE PRESERVED)
# ------------------------------------------------------------

def load_reports() -> List[Dict]:
    reports = []

    for file in os.listdir(LOG_DIR):
        if not file.endswith(".json"):
            continue

        path = os.path.join(LOG_DIR, file)

        try:
            with open(path, "r", encoding="utf-8") as f:
                log = json.load(f)
        except Exception:
            continue

        geo = log.get("geo_context", {}).get("center", {})

        lat = geo.get("lat")
        lon = geo.get("lon")

        if lat is None or lon is None:
            continue

        timestamp = log.get("created_at")
        if not timestamp:
            continue

        # 🔥 IMPORTANT: KEEP FULL REPORT STRUCTURE
        reports.append({
            "report_id": log.get("report_id"),
            "timestamp": timestamp,
            "lat": lat,
            "lon": lon,
            "raw": log  # ← FULL ORIGINAL REPORT (critical for intelligence layer)
        })

    return reports


# ------------------------------------------------------------
# CLUSTERING LOGIC
# ------------------------------------------------------------

def cluster_reports(reports: List[Dict]) -> List[List[Dict]]:
    clusters = []
    visited = set()

    for i, r1 in enumerate(reports):
        if r1["report_id"] in visited:
            continue

        cluster = [r1]
        visited.add(r1["report_id"])

        for j, r2 in enumerate(reports):
            if i == j or r2["report_id"] in visited:
                continue

            try:
                dist = _haversine_km(r1["lat"], r1["lon"], r2["lat"], r2["lon"])

                t1 = _parse_time(r1["timestamp"])
                t2 = _parse_time(r2["timestamp"])

                dt = abs((t1 - t2).total_seconds())
            except Exception:
                continue

            if dist <= DISTANCE_THRESHOLD_KM and dt <= TIME_WINDOW_SECONDS:
                cluster.append(r2)
                visited.add(r2["report_id"])

        clusters.append(cluster)

    return clusters


# ------------------------------------------------------------
# BUILD CLUSTER OBJECTS (PRE-INTELLIGENCE)
# ------------------------------------------------------------

def build_cluster_objects(clusters: List[List[Dict]]) -> List[Dict]:
    output = []

    for idx, cluster in enumerate(clusters, start=1):
        full_reports = [r["raw"] for r in cluster]

        confidence = round(min(1.0, len(cluster) / 5), 2)

        output.append({
            "cluster_id": f"CLUSTER-{idx:03}",
            "report_count": len(cluster),
            "reports": full_reports,  # 🔥 FULL REPORTS (NOT JUST IDS)
            "confidence": confidence
        })

    return output


# ------------------------------------------------------------
# INTELLIGENCE TRANSFORMATION
# ------------------------------------------------------------

def apply_cluster_intelligence(cluster_objects: List[Dict]) -> List[Dict]:
    results = []

    for cluster in cluster_objects:
        try:
            intel = build_cluster_intelligence(cluster)
            results.append(intel)
        except Exception as e:
            # 🔥 FAIL-SAFE (never break pipeline)
            results.append({
                "cluster_id": cluster.get("cluster_id"),
                "error": str(e),
                "fallback": cluster
            })

    print(f"[CLUSTER_INTEL] generated={len(results)}")

    return results


# ------------------------------------------------------------
# ENTRY POINT
# ------------------------------------------------------------

def run_cluster_engine() -> List[Dict]:
    reports = load_reports()

    if not reports:
        return []

    clusters = cluster_reports(reports)

    # Step 1: build cluster objects
    cluster_objects = build_cluster_objects(clusters)

    # Step 2: apply intelligence layer
    return apply_cluster_intelligence(cluster_objects)


# ------------------------------------------------------------
# TEST
# ------------------------------------------------------------

if __name__ == "__main__":
    result = run_cluster_engine()

    print("\n=== CLUSTER INTELLIGENCE (REAL GEO) ===")
    print(json.dumps(result, indent=2))