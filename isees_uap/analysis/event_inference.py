# ============================================================
# event_inference.py — EVENT RECONSTRUCTION LAYER (V2 FIXED)
# ============================================================

from typing import List, Dict
from datetime import datetime


# ------------------------------------------------------------
# HELPERS
# ------------------------------------------------------------

def _parse_time(ts: str):
    return datetime.fromisoformat(ts.replace("Z", "+00:00"))


def _haversine_km(lat1, lon1, lat2, lon2):
    from math import radians, sin, cos, sqrt, atan2

    R = 6371.0
    dlat = radians(lat2 - lat1)
    dlon = radians(lon2 - lon1)

    a = sin(dlat / 2)**2 + cos(radians(lat1)) * cos(radians(lat2)) * sin(dlon / 2)**2
    c = 2 * atan2(sqrt(a), sqrt(1 - a))

    return R * c


# ------------------------------------------------------------
# MATCH LOGIC
# ------------------------------------------------------------

def _clusters_related(c1: Dict, c2: Dict) -> bool:
    try:
        # spatial proximity
        lat1 = c1["cluster_center"]["lat"]
        lon1 = c1["cluster_center"]["lon"]

        lat2 = c2["cluster_center"]["lat"]
        lon2 = c2["cluster_center"]["lon"]

        dist = _haversine_km(lat1, lon1, lat2, lon2)

        # time windows
        t1_start = _parse_time(c1["time_start"])
        t1_end   = _parse_time(c1["time_end"])

        t2_start = _parse_time(c2["time_start"])
        t2_end   = _parse_time(c2["time_end"])

        # 🔥 FIXED: bidirectional gap calculation
        gap = min(
            abs((t2_start - t1_end).total_seconds()),
            abs((t1_start - t2_end).total_seconds())
        )

        # 🔥 RELATION RULES
        if dist < 2 and gap <= 36 * 3600:
            return True

    except Exception:
        pass

    return False


# ------------------------------------------------------------
# EVENT GROUPING (BFS)
# ------------------------------------------------------------

def build_events(clusters: List[Dict]) -> List[Dict]:
    events = []
    visited = set()

    for i, c in enumerate(clusters):
        if i in visited:
            continue

        event_clusters = []
        queue = [i]
        visited.add(i)

        while queue:
            idx = queue.pop(0)
            base = clusters[idx]
            event_clusters.append(base)

            for j, other in enumerate(clusters):
                if j in visited:
                    continue

                if _clusters_related(base, other):
                    visited.add(j)
                    queue.append(j)

        events.append(_build_event_object(event_clusters))

    return events


# ------------------------------------------------------------
# BUILD EVENT OBJECT
# ------------------------------------------------------------

def _build_event_object(clusters: List[Dict]) -> Dict:
    all_times = []
    all_lats = []
    all_lons = []

    total_reports = 0

    for c in clusters:
        # 🔥 FIXED: use actual reports list
        total_reports += len(c.get("reports", []))

        all_times.append(_parse_time(c["time_start"]))
        all_times.append(_parse_time(c["time_end"]))

        all_lats.append(c["cluster_center"]["lat"])
        all_lons.append(c["cluster_center"]["lon"])

    t_start = min(all_times)
    t_end = max(all_times)

    lat = sum(all_lats) / len(all_lats)
    lon = sum(all_lons) / len(all_lons)

    duration = (t_end - t_start).total_seconds()

    # midpoint inference
    midpoint = t_start + (t_end - t_start) / 2

    return {
        "event_id": f"EVENT-{abs(hash(midpoint)) % 100000}",
        "cluster_count": len(clusters),
        "report_count": total_reports,

        "inferred_event_time": midpoint.isoformat(),
        "event_time_window_start": t_start.isoformat(),
        "event_time_window_end": t_end.isoformat(),
        "event_duration_seconds": int(duration),

        "event_center": {
            "lat": round(lat, 6),
            "lon": round(lon, 6)
        },

        "confidence": round(min(1.0, total_reports / 6), 2),

        "clusters": [c["cluster_id"] for c in clusters]
    }