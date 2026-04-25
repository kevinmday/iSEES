# ============================================================
# source_resolver.py — GRAPH-ENABLED + CONSOLIDATED + WEIGHTED
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

def resolve_vector(vector, geo_assets: Dict[str, Any]):

    targets = []
    graph_nodes = []
    graph_edges = []

    S = getattr(vector, "tokens_s", [])
    R = getattr(vector, "tokens_r", [])
    score = getattr(vector, "score", 0.0)

    # --------------------------------------------------------
    # SIGNAL NODES
    # --------------------------------------------------------
    for s in S:
        graph_nodes.append({
            "id": f"S:{s}",
            "type": "signal",
            "label": s
        })

    for r in R:
        graph_nodes.append({
            "id": f"R:{r}",
            "type": "relation",
            "label": r
        })

    # --------------------------------------------------------
    # AVIATION
    # --------------------------------------------------------
    if "radar" in S or "flight" in S:
        for airport in geo_assets.get("airports", []):

            name = airport.get("name", "Unknown Airport")
            icao = airport.get("icao") or extract_icao(name)
            distance = airport.get("distance")

            target = ResolvedTarget(
                name=name,
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

            targets.append(target)

            graph_nodes.append({
                "id": name,
                "type": "target",
                "label": name
            })

            for s in S:
                graph_edges.append({
                    "from": f"S:{s}",
                    "to": name
                })

    # --------------------------------------------------------
    # COMMS
    # --------------------------------------------------------
    if "comms" in S:
        for airport in geo_assets.get("airports", []):

            base_name = airport.get("name", "Unknown Airport")
            name = f"{base_name} Tower"
            icao = airport.get("icao") or extract_icao(base_name)
            distance = airport.get("distance")

            target = ResolvedTarget(
                name=name,
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

            targets.append(target)

            graph_nodes.append({
                "id": name,
                "type": "target",
                "label": name
            })

            for s in S:
                graph_edges.append({
                    "from": f"S:{s}",
                    "to": name
                })

    # --------------------------------------------------------
    # MEDIA
    # --------------------------------------------------------
    if "anomaly" in R or "report" in R or "news" in R:
        for outlet in geo_assets.get("media", []):

            name = outlet.get("name", "Local Media")

            target = ResolvedTarget(
                name=name,
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

            targets.append(target)

            graph_nodes.append({
                "id": name,
                "type": "target",
                "label": name
            })

            for r in R:
                graph_edges.append({
                    "from": f"R:{r}",
                    "to": name
                })

    # --------------------------------------------------------
    # FALLBACK
    # --------------------------------------------------------
    if not targets:
        name = "General Area Investigation"

        targets.append(
            ResolvedTarget(
                name=name,
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

        graph_nodes.append({
            "id": name,
            "type": "target",
            "label": name
        })

    return targets, graph_nodes, graph_edges


# ------------------------------------------------------------
# CONSOLIDATE TARGETS
# ------------------------------------------------------------

def consolidate_targets(targets: List[ResolvedTarget]) -> List[ResolvedTarget]:

    merged = {}

    for t in targets:
        key = (t.name, t.type)

        if key not in merged:
            merged[key] = t
        else:
            merged[key].relevance += t.relevance

    return list(merged.values())


# ------------------------------------------------------------
# CONSOLIDATE EDGES (🔥 NEW)
# ------------------------------------------------------------

def consolidate_edges(edges: List[Dict[str, Any]]) -> List[Dict[str, Any]]:

    edge_map = {}

    for e in edges:
        key = (e["from"], e["to"])

        if key not in edge_map:
            edge_map[key] = {
                "from": e["from"],
                "to": e["to"],
                "weight": 1
            }
        else:
            edge_map[key]["weight"] += 1

    return list(edge_map.values())


# ------------------------------------------------------------
# MAIN ENTRY
# ------------------------------------------------------------

def resolve_vectors(vectors: List[Any], geo_assets: Dict[str, Any]):

    all_targets = []
    all_nodes = []
    all_edges = []

    for v in vectors:
        t, n, e = resolve_vector(v, geo_assets)
        all_targets.extend(t)
        all_nodes.extend(n)
        all_edges.extend(e)

    # Targets
    consolidated_targets_list = consolidate_targets(all_targets)

    # Nodes
    unique_nodes = {n["id"]: n for n in all_nodes}.values()

    # 🔥 NEW — EDGE CONSOLIDATION
    consolidated_edges = consolidate_edges(all_edges)

    return {
        "targets": consolidated_targets_list,
        "graph": {
            "nodes": list(unique_nodes),
            "edges": consolidated_edges
        }
    }


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