# ============================================================
# cluster_intelligence.py — CLUSTER INTELLIGENCE LAYER (V4 + WHY)
# ============================================================

from math import log
from datetime import datetime, UTC
from typing import Dict, List, Tuple


# ------------------------------------------------------------
# HELPERS (REAL LOG STRUCTURE)
# ------------------------------------------------------------

def _safe_get_lat_lon(report: Dict) -> Tuple[float, float]:
    try:
        geo = report.get("geo_context", {}).get("center", {})
        lat = geo.get("lat")
        lon = geo.get("lon")

        if lat is None or lon is None:
            return None, None

        return float(lat), float(lon)
    except:
        return None, None


def _safe_get_timestamp(report: Dict):
    try:
        ts = report.get("created_at")
        if ts:
            dt = datetime.fromisoformat(ts.replace("Z", "+00:00"))
            if dt.tzinfo is None:
                dt = dt.replace(tzinfo=UTC)
            return dt
    except:
        pass
    return None


def _haversine_km(lat1, lon1, lat2, lon2):
    from math import radians, sin, cos, sqrt, atan2

    if None in (lat1, lon1, lat2, lon2):
        return 0.0

    R = 6371.0
    dlat = radians(lat2 - lat1)
    dlon = radians(lon2 - lon1)

    a = sin(dlat / 2)**2 + cos(radians(lat1)) * cos(radians(lat2)) * sin(dlon / 2)**2
    c = 2 * atan2(sqrt(a), sqrt(1 - a))

    return R * c


# ------------------------------------------------------------
# 1. CLUSTER GEOMETRY
# ------------------------------------------------------------

def compute_cluster_geometry(cluster: Dict) -> Dict:
    reports = cluster.get("reports", [])

    coords = []
    for r in reports:
        lat, lon = _safe_get_lat_lon(r)
        if lat is not None and lon is not None:
            coords.append((lat, lon))

    if not coords:
        return {
            "cluster_center": {"lat": None, "lon": None},
            "spread_km": 0.0,
            "bounding_radius_km": 0.0
        }

    lat_mean = sum(c[0] for c in coords) / len(coords)
    lon_mean = sum(c[1] for c in coords) / len(coords)

    distances = [
        _haversine_km(lat_mean, lon_mean, lat, lon)
        for lat, lon in coords
    ]

    spread = sum(distances) / len(distances) if distances else 0.0
    radius = max(distances) if distances else 0.0

    return {
        "cluster_center": {
            "lat": round(lat_mean, 6),
            "lon": round(lon_mean, 6)
        },
        "spread_km": round(spread, 4),
        "bounding_radius_km": round(radius, 4)
    }


# ------------------------------------------------------------
# 2. TEMPORAL STRUCTURE
# ------------------------------------------------------------

def compute_temporal_structure(cluster: Dict) -> Dict:
    reports = cluster.get("reports", [])

    timestamps = []
    for r in reports:
        ts = _safe_get_timestamp(r)
        if ts:
            timestamps.append(ts)

    if not timestamps:
        return {
            "time_start": None,
            "time_end": None,
            "duration_seconds": 0
        }

    t_start = min(timestamps)
    t_end = max(timestamps)

    duration = max((t_end - t_start).total_seconds(), 1)

    return {
        "time_start": t_start.isoformat(),
        "time_end": t_end.isoformat(),
        "duration_seconds": int(duration)
    }


# ------------------------------------------------------------
# 3. INTENSITY SCORE (STABLE)
# ------------------------------------------------------------

def compute_intensity(cluster: Dict, geometry: Dict, temporal: Dict) -> float:
    N = cluster.get("report_count", 0)

    duration = max(temporal.get("duration_seconds", 1), 60)
    spread = max(geometry.get("spread_km", 0.0), 0.1)

    report_weight = log(1 + N)
    time_density = log(1 + (N / duration))
    spatial_tightness = 1 / (1 + spread)

    raw_intensity = report_weight * time_density * spatial_tightness

    normalized = min(raw_intensity * 2, 1.0)

    return round(normalized, 4)


# ------------------------------------------------------------
# 4. CORROBORATION SCORE
# ------------------------------------------------------------

def compute_corroboration(cluster: Dict) -> float:
    reports = cluster.get("reports", [])

    if not reports:
        return 0.0

    unique_sources = set()
    facility_hits = 0

    for r in reports:
        src = r.get("report_source", {}).get("user_id")
        if src:
            unique_sources.add(src)

        geo = r.get("geo_context", {})
        facilities = geo.get("facilities", [])
        if facilities:
            facility_hits += 1

    source_diversity = len(unique_sources) / max(len(reports), 1)
    facility_factor = facility_hits / max(len(reports), 1)

    score = (source_diversity * 0.6) + (facility_factor * 0.4)

    return round(min(score, 1.0), 4)


# ------------------------------------------------------------
# 5. ESCALATION LOGIC
# ------------------------------------------------------------

def determine_escalation(cluster: Dict, intensity: float, corroboration: float) -> Dict:
    N = cluster.get("report_count", 0)

    escalate = (
        N >= 3 and
        intensity >= 0.5 and
        corroboration >= 0.4
    )

    if not escalate:
        return {
            "level": "none",
            "reason": "threshold_not_met",
            "recommended_contacts": []
        }

    return {
        "level": "regional_alert",
        "reason": "multi-source spatial-temporal convergence",
        "recommended_contacts": ["ATC", "NWS", "Local Media"]
    }


# ------------------------------------------------------------
# 6. ACTIONS
# ------------------------------------------------------------

def build_recommended_actions(escalation: Dict) -> List[str]:
    if escalation.get("level") == "none":
        return ["monitor cluster for changes"]

    return [
        "request ATC radar logs",
        "cross-check NWS radar returns",
        "query local media reports",
        "scan social signals for corroboration"
    ]


# ------------------------------------------------------------
# 7. WHY LAYER (EXPLAINABILITY)
# ------------------------------------------------------------

def build_why(cluster: Dict, geometry: Dict, temporal: Dict, intensity: float, corroboration: float) -> List[str]:
    reasons = []

    N = cluster.get("report_count", 0)
    duration = temporal.get("duration_seconds", 0)
    spread = geometry.get("spread_km", 0.0)

    # Report count
    reasons.append(f"cluster formed from {N} report(s)")

    # Temporal
    if duration <= 10:
        reasons.append(f"reports occurred within {duration} seconds (rapid burst)")
    elif duration <= 300:
        reasons.append(f"reports occurred within {duration} seconds (short duration)")
    else:
        reasons.append(f"reports span {duration} seconds (sustained activity)")

    # Spatial
    if spread == 0:
        reasons.append("zero spatial spread (identical coordinates)")
    elif spread < 1:
        reasons.append(f"tight spatial grouping ({spread} km spread)")
    elif spread < 10:
        reasons.append(f"moderate spatial spread ({spread} km)")
    else:
        reasons.append(f"wide spatial distribution ({spread} km)")

    # Corroboration
    if corroboration < 0.3:
        reasons.append("low corroboration (limited independent sources)")
    elif corroboration < 0.6:
        reasons.append("moderate corroboration across sources")
    else:
        reasons.append("strong corroboration across multiple sources")

    # Intensity
    if intensity < 0.2:
        reasons.append(f"low intensity signal ({intensity})")
    elif intensity < 0.5:
        reasons.append(f"moderate intensity signal ({intensity})")
    else:
        reasons.append(f"high intensity signal ({intensity})")

    return reasons


# ------------------------------------------------------------
# MAIN BUILDER
# ------------------------------------------------------------

def build_cluster_intelligence(cluster: Dict) -> Dict:
    geometry = compute_cluster_geometry(cluster)
    temporal = compute_temporal_structure(cluster)

    intensity = compute_intensity(cluster, geometry, temporal)
    corroboration = compute_corroboration(cluster)

    escalation = determine_escalation(cluster, intensity, corroboration)
    actions = build_recommended_actions(escalation)

    # 🔥 WHY layer
    why = build_why(cluster, geometry, temporal, intensity, corroboration)

    return {
        "cluster_id": cluster.get("cluster_id"),
        "cluster_center": geometry["cluster_center"],
        "spread_km": geometry["spread_km"],
        "bounding_radius_km": geometry["bounding_radius_km"],
        "time_start": temporal["time_start"],
        "time_end": temporal["time_end"],
        "duration_seconds": temporal["duration_seconds"],
        "intensity": intensity,
        "corroboration_score": corroboration,
        "escalation": escalation,
        "recommended_actions": actions,
        "why": why
    }