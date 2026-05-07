# ============================================================
# event_inference.py — MANIFOLD EVENT RECONSTRUCTION ENGINE
# ============================================================

from typing import List, Dict
from datetime import datetime


# ============================================================
# HELPERS
# ============================================================

def _parse_time(ts: str):

    if not ts:
        return None

    return datetime.fromisoformat(
        ts.replace("Z", "+00:00")
    )


def _haversine_km(
    lat1,
    lon1,
    lat2,
    lon2
):

    from math import (
        radians,
        sin,
        cos,
        sqrt,
        atan2
    )

    R = 6371.0

    dlat = radians(lat2 - lat1)
    dlon = radians(lon2 - lon1)

    a = (

        sin(dlat / 2)**2

        +

        cos(radians(lat1))

        *

        cos(radians(lat2))

        *

        sin(dlon / 2)**2
    )

    c = 2 * atan2(
        sqrt(a),
        sqrt(1 - a)
    )

    return R * c


# ============================================================
# CLUSTER TIME EXTRACTION
# ============================================================

def _extract_cluster_times(
    cluster: Dict
):

    timestamps = []

    for report in cluster.get(
        "reports",
        []
    ):

        try:

            normalized_time = report.get(
                "normalized_time",
                {}
            )

            utc_time = normalized_time.get(
                "utc_time"
            )

            parsed = _parse_time(
                utc_time
            )

            if parsed:
                timestamps.append(parsed)

        except Exception:
            continue

    if not timestamps:
        return None, None

    return (
        min(timestamps),
        max(timestamps)
    )


# ============================================================
# MATCH LOGIC
# ============================================================

def _clusters_related(
    c1: Dict,
    c2: Dict
) -> bool:

    try:

        # ----------------------------------------------------
        # SPATIAL PROXIMITY
        # ----------------------------------------------------
        lat1 = c1["cluster_center"]["lat"]
        lon1 = c1["cluster_center"]["lon"]

        lat2 = c2["cluster_center"]["lat"]
        lon2 = c2["cluster_center"]["lon"]

        if None in [
            lat1,
            lon1,
            lat2,
            lon2
        ]:
            return False

        dist = _haversine_km(
            lat1,
            lon1,
            lat2,
            lon2
        )

        # ----------------------------------------------------
        # MANIFOLD TIME EXTRACTION
        # ----------------------------------------------------
        t1_start, t1_end = (
            _extract_cluster_times(c1)
        )

        t2_start, t2_end = (
            _extract_cluster_times(c2)
        )

        if not all([
            t1_start,
            t1_end,
            t2_start,
            t2_end
        ]):
            return False

        # ----------------------------------------------------
        # BIDIRECTIONAL GAP
        # ----------------------------------------------------
        gap = min(

            abs(
                (
                    t2_start - t1_end
                ).total_seconds()
            ),

            abs(
                (
                    t1_start - t2_end
                ).total_seconds()
            )
        )

        # ----------------------------------------------------
        # RELATION RULES
        # ----------------------------------------------------
        if (
            dist < 2

            and

            gap <= 36 * 3600
        ):

            return True

    except Exception:
        pass

    return False


# ============================================================
# EVENT GROUPING (BFS)
# ============================================================

def build_events(
    clusters: List[Dict]
) -> List[Dict]:

    events = []

    visited = set()

    for i, cluster in enumerate(clusters):

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

                if _clusters_related(
                    base,
                    other
                ):

                    visited.add(j)

                    queue.append(j)

        events.append(
            _build_event_object(
                event_clusters
            )
        )

    return events


# ============================================================
# BUILD EVENT OBJECT
# ============================================================

def _build_event_object(
    clusters: List[Dict]
) -> Dict:

    all_times = []

    all_lats = []

    all_lons = []

    total_reports = 0

    cluster_ids = []

    # --------------------------------------------------------
    # AGGREGATE CLUSTER DATA
    # --------------------------------------------------------
    for cluster in clusters:

        cluster_ids.append(
            cluster.get(
                "cluster_id"
            )
        )

        reports = cluster.get(
            "reports",
            []
        )

        total_reports += len(reports)

        # ----------------------------------------------------
        # EXTRACT TIMES
        # ----------------------------------------------------
        for report in reports:

            try:

                normalized_time = report.get(
                    "normalized_time",
                    {}
                )

                utc_time = normalized_time.get(
                    "utc_time"
                )

                parsed = _parse_time(
                    utc_time
                )

                if parsed:
                    all_times.append(parsed)

            except Exception:
                continue

        # ----------------------------------------------------
        # EXTRACT GEO
        # ----------------------------------------------------
        center = cluster.get(
            "cluster_center",
            {}
        )

        lat = center.get("lat")
        lon = center.get("lon")

        if lat is not None:
            all_lats.append(lat)

        if lon is not None:
            all_lons.append(lon)

    # --------------------------------------------------------
    # SAFETY
    # --------------------------------------------------------
    if not all_times:

        now = datetime.utcnow()

        all_times = [now]

    # --------------------------------------------------------
    # TIME WINDOW
    # --------------------------------------------------------
    t_start = min(all_times)

    t_end = max(all_times)

    duration = (
        t_end - t_start
    ).total_seconds()

    midpoint = (
        t_start

        +

        (
            t_end - t_start
        ) / 2
    )

    # --------------------------------------------------------
    # GEO CENTER
    # --------------------------------------------------------
    lat = (

        sum(all_lats) / len(all_lats)

        if all_lats else None
    )

    lon = (

        sum(all_lons) / len(all_lons)

        if all_lons else None
    )

    # --------------------------------------------------------
    # EVENT OBJECT
    # --------------------------------------------------------
    return {

        "event_id":

            f"EVENT-{
                abs(hash(midpoint))
                % 100000
            }",

        "cluster_count":
            len(clusters),

        "report_count":
            total_reports,

        # ----------------------------------------------------
        # TEMPORAL GEOMETRY
        # ----------------------------------------------------
        "inferred_event_time":
            midpoint.isoformat(),

        "event_time_window_start":
            t_start.isoformat(),

        "event_time_window_end":
            t_end.isoformat(),

        "event_duration_seconds":
            int(duration),

        # ----------------------------------------------------
        # SPATIAL GEOMETRY
        # ----------------------------------------------------
        "event_center": {

            "lat":

                round(lat, 6)

                if lat is not None
                else None,

            "lon":

                round(lon, 6)

                if lon is not None
                else None
        },

        # ----------------------------------------------------
        # BASIC CONFIDENCE
        # ----------------------------------------------------
        "confidence":

            round(

                min(
                    1.0,
                    total_reports / 6
                ),

                2
            ),

        # ----------------------------------------------------
        # CLUSTER LINEAGE
        # ----------------------------------------------------
        "clusters":
            cluster_ids
    }