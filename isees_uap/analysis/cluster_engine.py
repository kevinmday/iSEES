# ============================================================
# cluster_engine.py — REPORT CLUSTERING ENGINE (V2 - REAL GEO)
# ============================================================
# Purpose:
# Group reports into clusters based on:
# - geographic proximity (REAL GEO from logs)
# - time window
#
# Characteristics:
# - File-based (reads from /logs)
# - Deterministic (no ML)
# - Handles mixed timestamp formats (naive + UTC-aware)
# - Skips bad/missing data safely
# - Zero external dependencies
# ============================================================

import os
import json
from math import radians, sin, cos, sqrt, atan2
from datetime import datetime, UTC
from typing import List, Dict

# ------------------------------------------------------------
# CONFIG
# ------------------------------------------------------------

BASE_DIR = os.path.dirname(os.path.dirname(__file__))
LOG_DIR = os.path.join(BASE_DIR, "logs")

DISTANCE_THRESHOLD_KM = 100      # cluster radius
TIME_WINDOW_SECONDS = 86400      # 24 hours

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
    """
    Normalize timestamps to timezone-aware UTC.
    Handles both:
    - naive timestamps (old logs)
    - UTC-aware timestamps (new logs)
    """
    dt = datetime.fromisoformat(ts.replace("Z", "+00:00"))

    if dt.tzinfo is None:
        dt = dt.replace(tzinfo=UTC)

    return dt


# ------------------------------------------------------------
# LOAD REPORTS FROM LOGS (REAL GEO)
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
            continue  # skip corrupted logs safely

        # 🔥 REAL GEO EXTRACTION
        geo = log.get("geo_context", {}).get("center", {})

        lat = geo.get("lat")
        lon = geo.get("lon")

        # Skip if geo missing
        if lat is None or lon is None:
            continue

        timestamp = log.get("created_at")

        # Skip if timestamp missing
        if not timestamp:
            continue

        reports.append({
            "report_id": log.get("report_id"),
            "timestamp": timestamp,
            "lat": lat,
            "lon": lon
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
                continue  # skip bad records safely

            if dist <= DISTANCE_THRESHOLD_KM and dt <= TIME_WINDOW_SECONDS:
                cluster.append(r2)
                visited.add(r2["report_id"])

        clusters.append(cluster)

    return clusters


# ------------------------------------------------------------
# FORMAT OUTPUT
# ------------------------------------------------------------

def build_cluster_output(clusters: List[List[Dict]]) -> List[Dict]:
    output = []

    for idx, cluster in enumerate(clusters, start=1):
        ids = [r["report_id"] for r in cluster]

        confidence = round(min(1.0, len(cluster) / 5), 2)

        output.append({
            "cluster_id": f"CLUSTER-{idx:03}",
            "report_count": len(cluster),
            "reports": ids,
            "confidence": confidence,
            "recommended_action": "multi-source correlation" if len(cluster) > 1 else "monitor"
        })

    return output


# ------------------------------------------------------------
# ENTRY POINT
# ------------------------------------------------------------

def run_cluster_engine() -> List[Dict]:
    reports = load_reports()

    if not reports:
        return []

    clusters = cluster_reports(reports)
    return build_cluster_output(clusters)


# ------------------------------------------------------------
# TEST
# ------------------------------------------------------------

if __name__ == "__main__":
    result = run_cluster_engine()

    print("\n=== CLUSTERS (REAL GEO) ===")
    print(json.dumps(result, indent=2))