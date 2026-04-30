# ============================================================
# geo/resolver.py — Location Resolution Orchestrator (iSEES)
# (WITH DOMAIN + ACTION + FACILITY + CONTACT PRIORITY LAYER)
# ============================================================

from typing import Dict, List

from .geocoder import geocode_location
from .assets import get_nearby_assets
from .ranker import rank_assets

# Domain layer
from isees_uap.intelligence.domain_resolver import resolve_domain_targets

# Action layer
from isees_uap.intelligence.action_resolver import resolve_actions

# NEW: Facility + Contact Layers
from .facility_resolver import resolve_all_facilities
from .contact_prioritizer import prioritize_contacts


def resolve_location_to_assets(location: str) -> Dict:
    """
    End-to-end resolution:

    Input:
        "Medford, OR"

    Output:
        {
            location,
            resolved,
            lat,
            lon,
            assets (ranked + actionable),
            facilities (geo contacts),
            ranked_contacts (prioritized),
            primary_contact
        }
    """

    coords = geocode_location(location)

    if not coords:
        return {
            "location": location,
            "resolved": False,
            "assets": [],
            "facilities": [],
            "ranked_contacts": [],
            "primary_contact": None
        }

    lat, lon = coords

    # --------------------------------------------------------
    # GEO LAYER (physical assets)
    # --------------------------------------------------------
    assets = get_nearby_assets(lat, lon)

    # --------------------------------------------------------
    # DOMAIN LAYER (semantic targets)
    # --------------------------------------------------------
    tokens: List[str] = location.lower().split()
    domain_targets = resolve_domain_targets(tokens, location)

    # --------------------------------------------------------
    # MERGE GEO + DOMAIN (GRAPH SAFE)
    # --------------------------------------------------------
    existing_names = {a.get("name") for a in assets}

    for d in domain_targets:
        name = d.get("name")
        if name and name not in existing_names:
            assets.append({
                **d,
                "lat": lat,
                "lon": lon,
                "distance": 0
            })

    # --------------------------------------------------------
    # RANKING (ASSETS)
    # --------------------------------------------------------
    ranked_assets = rank_assets(lat, lon, assets)

    # --------------------------------------------------------
    # ACTION LAYER (ATTACH PER NODE)
    # --------------------------------------------------------
    for a in ranked_assets:
        node_type = (a.get("type") or "").lower()
        name = (a.get("name") or "").lower()

        action_type = None

        # --- NEWS ---
        if node_type == "news" or "news" in name:
            action_type = "news"

        # --- TOWER / AIRSPACE ---
        elif (
            "tower" in name
            or "airspace" in name
            or node_type in ["airport", "airspace"]
        ):
            action_type = "tower"

        # --- ATTACH ---
        if action_type:
            a["actions"] = resolve_actions(action_type, location)
        else:
            a["actions"] = {}

    # ========================================================
    # NEW LAYER — FACILITY RESOLUTION
    # ========================================================
    facilities = resolve_all_facilities(lat, lon)

    # ========================================================
    # NEW LAYER — CONTACT PRIORITIZATION
    # ========================================================
    ranked_contacts = prioritize_contacts(facilities)

    primary_contact = ranked_contacts[0] if ranked_contacts else None

    # ========================================================
    # FINAL OUTPUT
    # ========================================================
    return {
        "location": location,
        "resolved": True,
        "lat": lat,
        "lon": lon,
        "assets": ranked_assets,

        # NEW OUTPUTS
        "facilities": facilities,
        "ranked_contacts": ranked_contacts,
        "primary_contact": primary_contact
    }