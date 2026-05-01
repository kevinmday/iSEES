# ============================================================
# cluster_engine.py — REPORT CLUSTERING ENGINE (V11 + ROUTING)
# ============================================================

import os
import json
from math import radians, sin, cos, sqrt, atan2
from datetime import datetime, UTC
from typing import List, Dict

# 🔥 INTELLIGENCE + EVENT + SCORING + ROUTING
from isees_uap.analysis.cluster_intelligence import build_cluster_intelligence
from isees_uap.analysis.event_inference import build_events
from isees_uap.analysis.event_scoring import score_events
from isees_uap.analysis.escalation_router import route_events


# ------------------------------------------------------------
# CONFIG
# ------------------------------------------------------------

BASE_DIR = os.path.dirname(os.path.dirname(__file__))
LOG_DIR = os.path.join(BASE_DIR, "logs")

DISTANCE_THRESHOLD_KM = 100


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
# ADAPTIVE TIME WINDOW
# ------------------------------------------------------------

def _adaptive_time_window(dist_km: float, report_count: int) -> float:

    if report_count >= 3 and dist_km < 2:
        return 36 * 3600

    if dist_km < 5:
        return 12 * 3600

    return 6 * 3600


# ------------------------------------------------------------
# LOAD REPORTS
# ------------------------------------------------------------

def load_reports() -> List[Dict]:
    reports = []

    if not os.path.exists(LOG_DIR):
        return reports

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

        reports.append({
            "report_id": log.get("report_id"),
            "timestamp": timestamp,
            "lat": lat,
            "lon": lon,
            "raw": log
        })

    return reports


# ------------------------------------------------------------
# BFS CLUSTERING
# ------------------------------------------------------------

def cluster_reports(reports: List[Dict]) -> List[List[Dict]]:
    clusters = []
    visited = set()

    for r in reports:
        if r["report_id"] in visited:
            continue

        cluster = []
        queue = [r]
        visited.add(r["report_id"])

        while queue:
            current = queue.pop(0)
            cluster.append(current)

            for candidate in reports:
                if candidate["report_id"] in visited:
                    continue

                try:
                    dist = _haversine_km(
                        current["lat"], current["lon"],
                        candidate["lat"], candidate["lon"]
                    )

                    t1 = _parse_time(current["timestamp"])
                    t2 = _parse_time(candidate["timestamp"])
                    dt = abs((t1 - t2).total_seconds())

                    time_window = _adaptive_time_window(
                        dist_km=dist,
                        report_count=len(cluster)
                    )

                except Exception:
                    continue

                if dist <= DISTANCE_THRESHOLD_KM and dt <= time_window:
                    visited.add(candidate["report_id"])
                    queue.append(candidate)

        clusters.append(cluster)

    return clusters


# ------------------------------------------------------------
# MERGE PASS
# ------------------------------------------------------------

def merge_clusters(clusters: List[List[Dict]]) -> List[List[Dict]]:
    merged = []

    while clusters:
        base = clusters.pop(0)
        changed = True

        while changed:
            changed = False

            for other in clusters[:]:
                try:
                    lat1 = sum(r["lat"] for r in base) / len(base)
                    lon1 = sum(r["lon"] for r in base) / len(base)

                    lat2 = sum(r["lat"] for r in other) / len(other)
                    lon2 = sum(r["lon"] for r in other) / len(other)

                    dist = _haversine_km(lat1, lon1, lat2, lon2)

                    times1 = [_parse_time(r["timestamp"]) for r in base]
                    times2 = [_parse_time(r["timestamp"]) for r in other]

                    t1_min, t1_max = min(times1), max(times1)
                    t2_min = min(times2)

                    dt = abs((t2_min - t1_max).total_seconds())

                    if dist < 2 and dt <= 36 * 3600:
                        base.extend(other)
                        clusters.remove(other)
                        changed = True
                        break

                except Exception:
                    continue

        merged.append(base)

    return merged


# ------------------------------------------------------------
# BUILD CLUSTER OBJECTS
# ------------------------------------------------------------

def build_cluster_objects(clusters: List[List[Dict]]) -> List[Dict]:
    output = []

    for idx, cluster in enumerate(clusters, start=1):
        full_reports = [r["raw"] for r in cluster]

        confidence = round(min(1.0, len(cluster) / 5), 2)

        output.append({
            "cluster_id": f"CLUSTER-{idx:03}",
            "report_count": len(cluster),
            "reports": full_reports,
            "confidence": confidence
        })

    return output


# ------------------------------------------------------------
# INTELLIGENCE
# ------------------------------------------------------------

def apply_cluster_intelligence(cluster_objects: List[Dict]) -> List[Dict]:
    results = []

    for cluster in cluster_objects:
        try:
            intel = build_cluster_intelligence(cluster)

            # 🔥 propagate reports forward
            intel["reports"] = cluster.get("reports", [])

            results.append(intel)

        except Exception as e:
            results.append({
                "cluster_id": cluster.get("cluster_id"),
                "error": str(e),
                "fallback": cluster
            })

    print(f"[CLUSTER_INTEL] generated={len(results)}")

    return results


# ------------------------------------------------------------
# ENTRY POINT (FINAL)
# ------------------------------------------------------------

def run_cluster_engine() -> Dict:
    reports = load_reports()

    if not reports:
        return {}

    clusters = cluster_reports(reports)
    clusters = merge_clusters(clusters)

    cluster_objects = build_cluster_objects(clusters)
    cluster_intel = apply_cluster_intelligence(cluster_objects)

    # 🔥 EVENT INFERENCE
    events = build_events(cluster_intel)

    # 🔥 EVENT SCORING
    events = score_events(events, cluster_intel)

    # 🔥 AUTO ROUTING (NEW)
    events = route_events(events, cluster_intel)

    print(f"[EVENTS] generated={len(events)}")

    return {
        "clusters": cluster_intel,
        "events": events
    }


# ------------------------------------------------------------
# TEST
# ------------------------------------------------------------

if __name__ == "__main__":
    result = run_cluster_engine()

    print("\n=== CLUSTER + EVENT INTELLIGENCE ===")
    print(json.dumps(result, indent=2))