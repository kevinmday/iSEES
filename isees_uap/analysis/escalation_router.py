# ============================================================
# escalation_router.py — AUTO ESCALATION + CONTACT ROUTING
# ============================================================

from typing import Dict, List


def route_event(event: Dict, clusters: List[Dict]) -> Dict:

    scoring = event.get("scoring", {})
    priority = scoring.get("priority", "LOW")

    if priority != "HIGH":
        return {
            "escalated": False,
            "reason": "priority_not_high",
            "actions": []
        }

    contacts = []
    seen = set()

    for c in clusters:
        for r in c.get("reports", []):
            geo = r.get("geo_context", {})

            if geo.get("primary_contact"):
                contacts.append(geo["primary_contact"])

            for rc in geo.get("ranked_contacts", []):
                contacts.append(rc)

            for f in geo.get("facilities", []):
                contacts.append(f)

    unique = []
    for c in contacts:
        key = (c.get("type"), c.get("name"))
        if key not in seen:
            seen.add(key)
            unique.append(c)

    actions = []

    for c in unique:
        ctype = c.get("type")

        if ctype == "ATC":
            actions.append({
                "type": "CONTACT_ATC",
                "target": c.get("name"),
                "phone": c.get("contact", {}).get("phone"),
                "priority": "PRIMARY",
                "instruction": "Request radar logs"
            })

        elif ctype == "WEATHER_RADAR":
            actions.append({
                "type": "CONTACT_NWS",
                "target": c.get("name"),
                "phone": c.get("contact", {}).get("phone"),
                "priority": "SECONDARY",
                "instruction": "Check radar returns"
            })

    return {
        "escalated": True,
        "contact_count": len(actions),
        "actions": actions
    }


def route_events(events: List[Dict], cluster_intel: List[Dict]) -> List[Dict]:

    results = []

    for event in events:
        related_clusters = [
            c for c in cluster_intel
            if c["cluster_id"] in event.get("clusters", [])
        ]

        event["routing"] = route_event(event, related_clusters)

        results.append(event)

    return results