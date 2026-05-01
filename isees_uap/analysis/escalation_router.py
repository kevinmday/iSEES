# ============================================================
# escalation_router.py — AUTO ESCALATION + INTELLIGENT ROUTING (V2)
# ============================================================

from typing import Dict, List


# ------------------------------------------------------------
# ROUTE SINGLE EVENT
# ------------------------------------------------------------

def route_event(event: Dict, clusters: List[Dict]) -> Dict:

    scoring = event.get("scoring", {})
    priority = scoring.get("priority", "LOW")
    score = scoring.get("event_score", 0)

    pattern = event.get("event_pattern", {}).get("event_pattern_type", "")
    cluster_count = event.get("cluster_count", 1)

    # --------------------------------------------------------
    # ESCALATION LOGIC (UPGRADED)
    # --------------------------------------------------------

    escalate = False
    level = "none"
    reason = ""

    # HARD HIGH
    if priority == "HIGH":
        escalate = True
        level = "high_priority"
        reason = "high_score"

    # MEDIUM + STRUCTURE BOOST
    elif priority == "MEDIUM":

        if cluster_count >= 2 and score >= 0.55:
            escalate = True
            level = "structured_event"
            reason = "multi_cluster_support"

        elif pattern in ["recurring_event", "persistent_event"]:
            escalate = True
            level = "pattern_detected"
            reason = "pattern_memory_trigger"

    # LOW NEVER ESCALATES
    else:
        return {
            "escalated": False,
            "level": "none",
            "reason": "low_priority",
            "actions": []
        }

    # --------------------------------------------------------
    # COLLECT CONTACTS
    # --------------------------------------------------------

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

    # dedupe
    unique = []
    for c in contacts:
        key = (c.get("type"), c.get("name"))
        if key not in seen:
            seen.add(key)
            unique.append(c)

    # --------------------------------------------------------
    # BUILD ACTIONS (SMART)
    # --------------------------------------------------------

    actions = []

    for c in unique:
        ctype = c.get("type")

        if ctype == "ATC":
            actions.append({
                "type": "CONTACT_ATC",
                "target": c.get("name"),
                "phone": c.get("contact", {}).get("phone"),
                "priority": "PRIMARY",
                "instruction": "Request radar logs and traffic anomalies"
            })

        elif ctype == "WEATHER_RADAR":
            actions.append({
                "type": "CONTACT_NWS",
                "target": c.get("name"),
                "phone": c.get("contact", {}).get("phone"),
                "priority": "SECONDARY",
                "instruction": "Check radar returns and atmospheric anomalies"
            })

        elif ctype == "AIRPORT":
            actions.append({
                "type": "CONTACT_AIRPORT_OPS",
                "target": c.get("name"),
                "phone": c.get("contact", {}).get("phone"),
                "priority": "SECONDARY",
                "instruction": "Request incident or anomaly reports"
            })

    # --------------------------------------------------------
    # FINAL ROUTING OBJECT
    # --------------------------------------------------------

    return {
        "escalated": escalate,
        "level": level,
        "reason": reason,
        "contact_count": len(actions),
        "actions": actions
    }


# ------------------------------------------------------------
# ROUTE ALL EVENTS
# ------------------------------------------------------------

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