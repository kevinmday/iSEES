# ============================================================
# operational_enrichment.py
# OPERATIONAL INTELLIGENCE ENRICHMENT LAYER
# V1.0 — CANONICAL OPERATIONAL HYDRATION
# ============================================================

from typing import Dict, List


# ============================================================
# DOMAIN INFERENCE
# ============================================================

def infer_domains(
    observation: Dict
) -> List[str]:

    domains = set()

    text_fragments = []

    narrative = observation.get(
        "narrative",
        ""
    )

    summary = observation.get(
        "summary",
        ""
    )

    description = observation.get(
        "description",
        ""
    )

    if narrative:
        text_fragments.append(
            str(narrative).lower()
        )

    if summary:
        text_fragments.append(
            str(summary).lower()
        )

    if description:
        text_fragments.append(
            str(description).lower()
        )

    combined = " ".join(
        text_fragments
    )

    # --------------------------------------------------------
    # AVIATION
    # --------------------------------------------------------

    aviation_terms = [

        "aircraft",
        "plane",
        "jet",
        "helicopter",
        "faa",
        "tower",
        "atc",
        "flight",
        "pilot",
        "runway",
        "airport"
    ]

    if any(
        term in combined
        for term in aviation_terms
    ):

        domains.add(
            "AVIATION"
        )

    # --------------------------------------------------------
    # RADAR
    # --------------------------------------------------------

    radar_terms = [

        "radar",
        "tracked",
        "tracking",
        "blip",
        "scope",
        "sensor"
    ]

    if any(
        term in combined
        for term in radar_terms
    ):

        domains.add(
            "RADAR"
        )

    # --------------------------------------------------------
    # WEATHER
    # --------------------------------------------------------

    weather_terms = [

        "storm",
        "cloud",
        "lightning",
        "rain",
        "fog",
        "weather"
    ]

    if any(
        term in combined
        for term in weather_terms
    ):

        domains.add(
            "WEATHER"
        )

    # --------------------------------------------------------
    # MARITIME
    # --------------------------------------------------------

    maritime_terms = [

        "ocean",
        "ship",
        "vessel",
        "water",
        "coast",
        "navy"
    ]

    if any(
        term in combined
        for term in maritime_terms
    ):

        domains.add(
            "MARITIME"
        )

    return sorted(
        list(domains)
    )


# ============================================================
# FACILITY RESOLUTION
# ============================================================

def resolve_facilities(
    observation: Dict,
    domains: List[str]
) -> List[Dict]:

    facilities = []

    geo = observation.get(
        "normalized_geo",
        {}
    )

    location_name = geo.get(
        "resolved_place_name",
        ""
    )

    lat = geo.get(
        "resolved_lat"
    )

    lon = geo.get(
        "resolved_lon"
    )

    # --------------------------------------------------------
    # AVIATION FACILITIES
    # --------------------------------------------------------

    if "AVIATION" in domains:

        facilities.append({

            "name":
                "Nearest ATC Tower",

            "facility_type":
                "ATC_TOWER",

            "domain":
                "AVIATION",

            "geo_context":
                location_name,

            "lat":
                lat,

            "lon":
                lon
        })

    # --------------------------------------------------------
    # RADAR FACILITIES
    # --------------------------------------------------------

    if "RADAR" in domains:

        facilities.append({

            "name":
                "Regional Radar Infrastructure",

            "facility_type":
                "RADAR",

            "domain":
                "RADAR",

            "geo_context":
                location_name,

            "lat":
                lat,

            "lon":
                lon
        })

    # --------------------------------------------------------
    # WEATHER FACILITIES
    # --------------------------------------------------------

    if "WEATHER" in domains:

        facilities.append({

            "name":
                "Weather Monitoring Infrastructure",

            "facility_type":
                "WEATHER",

            "domain":
                "WEATHER",

            "geo_context":
                location_name,

            "lat":
                lat,

            "lon":
                lon
        })

    # --------------------------------------------------------
    # MARITIME FACILITIES
    # --------------------------------------------------------

    if "MARITIME" in domains:

        facilities.append({

            "name":
                "Maritime Operations Infrastructure",

            "facility_type":
                "MARITIME",

            "domain":
                "MARITIME",

            "geo_context":
                location_name,

            "lat":
                lat,

            "lon":
                lon
        })

    return facilities


# ============================================================
# RECOMMENDED ACTIONS
# ============================================================

def build_recommended_actions(
    domains: List[str]
) -> List[str]:

    actions = []

    if "AVIATION" in domains:

        actions.extend([

            "Request ATC tower logs",

            "Check FAA flight activity",

            "Cross-reference ADS-B traffic"
        ])

    if "RADAR" in domains:

        actions.extend([

            "Request radar playback",

            "Check sensor anomalies",

            "Review radar coverage gaps"
        ])

    if "WEATHER" in domains:

        actions.extend([

            "Check weather conditions",

            "Review atmospheric anomalies",

            "Cross-reference meteorological data"
        ])

    if "MARITIME" in domains:

        actions.extend([

            "Review vessel activity",

            "Check maritime radar logs",

            "Cross-reference coastal operations"
        ])

    return sorted(
        list(set(actions))
    )


# ============================================================
# INVESTIGATION VECTORS
# ============================================================

def build_investigation_vectors(
    observation: Dict,
    domains: List[str]
) -> List[str]:

    vectors = []

    geo = observation.get(
        "normalized_geo",
        {}
    )

    location_name = geo.get(
        "resolved_place_name",
        "UNKNOWN_REGION"
    )

    for domain in domains:

        vectors.append(

            f"{domain}:{location_name}"
        )

    return sorted(
        list(set(vectors))
    )


# ============================================================
# MAIN ENRICHMENT ENTRY
# ============================================================

def enrich_operational_intelligence(
    observation: Dict
) -> Dict:

    try:

        domains = infer_domains(
            observation
        )

        facilities = resolve_facilities(
            observation,
            domains
        )

        recommended_actions = (
            build_recommended_actions(
                domains
            )
        )

        investigation_vectors = (
            build_investigation_vectors(
                observation,
                domains
            )
        )

        observation[
            "operational_intelligence"
        ] = {

            "domains":
                domains,

            "facilities":
                facilities,

            "recommended_actions":
                recommended_actions,

            "investigation_vectors":
                investigation_vectors,

            "operationally_resolved":
                len(facilities) > 0
        }

        return observation

    except Exception as e:

        print(
            f"[OPERATIONAL_ENRICHMENT_ERROR] {e}"
        )

        observation[
            "operational_intelligence"
        ] = {

            "domains": [],

            "facilities": [],

            "recommended_actions": [],

            "investigation_vectors": [],

            "operationally_resolved":
                False
        }

        return observation