# ============================================================
# source_resolver.py — FINAL (CONSOLIDATED + ROBUST)
# ============================================================

from typing import List, Dict, Any
import re


# ------------------------------------------------------------
# MODEL
# ------------------------------------------------------------

class ResolvedTarget:
    def __init__(self, name: str, type: str, relevance: float, actions: List[str], metadata: Dict[str, Any]):
        self.name = name
        self.type = type
        self.relevance = relevance
        self.actions = actions
        self.metadata = metadata

    def to_dict(self):
        return {
            "name": self.name,
            "type": self.type,
            "relevance": round(self.relevance, 2),
            "actions": self.actions,
            "metadata": self.metadata,
        }


# ------------------------------------------------------------
# HELPER — ICAO EXTRACTION
# ------------------------------------------------------------

def extract_icao(name: str):
    match = re.search(r"\(([A-Z0-9]{3,4})\)", name or "")
    return match.group(1) if match else None


# ------------------------------------------------------------
# CORE RESOLVER
# ------------------------------------------------------------

def resolve_vector(vector, geo_assets: Dict[str, Any]) -> List[ResolvedTarget]:

    targets = []

    S = getattr(vector, "tokens_s", [])
    R = getattr(vector, "tokens_r", [])
    score = getattr(vector, "score", 0.0)

    # --------------------------------------------------------
    # RULE 1 — AVIATION / RADAR
    # --------------------------------------------------------
    if "radar" in S or "flight" in S:
        for airport in geo_assets.get("airports", []):

            icao = airport.get("icao") or extract_icao(airport.get("name"))
            distance = airport.get("distance")

            targets.append(
                ResolvedTarget(
                    name=airport.get("name", "Unknown Airport"),
                    type="aviation",
                    relevance=score,
                    actions=[
                        "Request FAA radar logs (FOIA)",
                        "Check tower communications (ATC recordings)",
                        "Cross-check ADS-B flight data"
                    ],
                    metadata={
                        "icao": icao,
                        "distance": distance if distance is not None else 0
                    }
                )
            )

    # --------------------------------------------------------
    # RULE 2 — COMMS
    # --------------------------------------------------------
    if "comms" in S:
        for airport in geo_assets.get("airports", []):

            icao = airport.get("icao") or extract_icao(airport.get("name"))
            distance = airport.get("distance")

            targets.append(
                ResolvedTarget(
                    name=f"{airport.get('name')} Tower",
                    type="aviation_comms",
                    relevance=score,
                    actions=[
                        "Review ATC frequency recordings",
                        "Check liveATC archives if available",
                        "Identify controller logs for timeframe"
                    ],
                    metadata={
                        "icao": icao,
                        "distance": distance if distance is not None else 0
                    }
                )
            )

    # --------------------------------------------------------
    # RULE 3 — MEDIA
    # --------------------------------------------------------
    if "anomaly" in R or "report" in R or "news" in R:
        for outlet in geo_assets.get("media", []):

            targets.append(
                ResolvedTarget(
                    name=outlet.get("name", "Local Media"),
                    type="media",
                    relevance=score * 0.9,
                    actions=[
                        "Search news archives for event timeframe",
                        "Review broadcast logs",
                        "Contact newsroom tip line"
                    ],
                    metadata={
                        "city": outlet.get("city")
                    }
                )
            )

    # --------------------------------------------------------
    # FALLBACK
    # --------------------------------------------------------
    if not targets:
        targets.append(
            ResolvedTarget(
                name="General Area Investigation",
                type="generic",
                relevance=score,
                actions=[
                    "Search regional reports",
                    "Check public sensor networks",
                    "Look for corroborating witnesses"
                ],
                metadata={}
            )
        )

    return targets


# ------------------------------------------------------------
# 🔥 CONSOLIDATION LAYER (NEW)
# ------------------------------------------------------------

def consolidate_targets(targets: List[ResolvedTarget]) -> List[ResolvedTarget]:

    merged = {}

    for t in targets:
        key = (t.name, t.type)

        if key not in merged:
            merged[key] = t
        else:
            # aggregate score
            merged[key].relevance += t.relevance

    return list(merged.values())


# ------------------------------------------------------------
# BATCH RESOLUTION
# ------------------------------------------------------------

def resolve_vectors(vectors: List[Any], geo_assets: Dict[str, Any]) -> List[ResolvedTarget]:

    all_targets = []

    for v in vectors:
        all_targets.extend(resolve_vector(v, geo_assets))

    # 🔥 APPLY CONSOLIDATION
    return consolidate_targets(all_targets)


# ------------------------------------------------------------
# FORMATTER
# ------------------------------------------------------------

def format_targets(targets: List[ResolvedTarget]) -> str:
    lines = []

    for t in targets:
        lines.append(f"\n[{t.type.upper()}] {t.name}")
        lines.append(f"Score: {round(t.relevance, 3)}")

        for action in t.actions:
            lines.append(f"→ {action}")

    return "\n".join(lines)