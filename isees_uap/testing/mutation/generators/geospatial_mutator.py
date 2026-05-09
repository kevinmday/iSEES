# ============================================================
# geospatial_mutator.py
# Observer Location Drift Engine
# ============================================================

import random


# ------------------------------------------------------------
# LOCATION PRECISION DRIFT (KM)
# ------------------------------------------------------------

PRECISION_DRIFT = {

    "high": {
        "min_km": 0.01,
        "max_km": 0.5
    },

    "medium": {
        "min_km": 0.25,
        "max_km": 3.0
    },

    "low": {
        "min_km": 1.0,
        "max_km": 12.0
    }
}


# ------------------------------------------------------------
# SIMPLE GEO DRIFT
# ------------------------------------------------------------

def mutate_geospatial_position(
    observer,
    base_lat,
    base_lon
):

    location_precision = observer.get(
        "location_precision",
        "medium"
    )

    profile = PRECISION_DRIFT.get(
        location_precision,
        PRECISION_DRIFT["medium"]
    )

    drift_km = random.uniform(
        profile["min_km"],
        profile["max_km"]
    )

    # --------------------------------------------------------
    # VERY SIMPLE LAT/LON DRIFT
    # (GOOD ENOUGH FOR SYNTHETIC TESTING)
    # --------------------------------------------------------

    lat_offset = random.uniform(-1, 1) * (drift_km / 111)
    lon_offset = random.uniform(-1, 1) * (drift_km / 111)

    mutated_lat = base_lat + lat_offset
    mutated_lon = base_lon + lon_offset

    return {
        "base_lat": base_lat,
        "base_lon": base_lon,

        "mutated_lat": round(mutated_lat, 6),
        "mutated_lon": round(mutated_lon, 6),

        "drift_km": round(drift_km, 3),

        "location_precision": location_precision
    }


# ------------------------------------------------------------
# QUICK TEST
# ------------------------------------------------------------

if __name__ == "__main__":

    base_lat = 42.3265
    base_lon = -122.8756

    test_observers = [
        {"location_precision": "high"},
        {"location_precision": "medium"},
        {"location_precision": "low"}
    ]

    for observer in test_observers:
        print(
            mutate_geospatial_position(
                observer,
                base_lat,
                base_lon
            )
        )