from __future__ import annotations

from dataclasses import dataclass
from typing import Any


PLANNER_VERSION = "rex-expansion-proposal-planner/v1"
PROFILE_VERSION = "rex-general-selection-profile/v1"
OBJECTIVE_PACK_VERSION = "rex-general-evidence-objectives/v1"
MAX_QUERY_GUIDANCE = 4
MAX_ACQUIRED_SOURCES = 8


class ExpansionPlanUnavailable(ValueError):
    """The governed selection does not contain enough inspectable context to plan."""


@dataclass(frozen=True, slots=True)
class ExpansionPlan:
    profile_id: str
    query_guidance: tuple[str, ...]
    governed_context: tuple[str, ...]

    def as_dict(self) -> dict[str, Any]:
        return {
            "plannerVersion": PLANNER_VERSION,
            "profile": {"id": self.profile_id, "version": PROFILE_VERSION},
            "objectivePacks": [{"id": "GENERAL_EVIDENCE", "version": OBJECTIVE_PACK_VERSION}],
            "queryGuidance": list(self.query_guidance),
            "governedContext": list(self.governed_context),
            "limits": [
                f"Acquire at most {MAX_ACQUIRED_SOURCES} sources after separate approval",
                f"Use at most {MAX_QUERY_GUIDANCE} generated query-guidance items",
                "Remain within the selected object and its governed one-hop context",
            ],
            "stopRules": [
                f"Stop after {MAX_ACQUIRED_SOURCES} acquired sources",
                "Stop when every generated guidance item has been attempted",
                "Stop on authorization, provider, acquisition, or provenance failure",
                "Stop when further inspection would require facts absent from governed context",
            ],
        }


def _text(value: object) -> str | None:
    if not isinstance(value, str):
        return None
    normalized = " ".join(value.split())
    return normalized if normalized else None


def build_expansion_plan(*, graph: dict[str, Any], target_kind: str, target_id: str) -> ExpansionPlan:
    collection = "nodes" if target_kind == "NODE" else "edges"
    selected = next((item for item in graph.get(collection, ())
                     if isinstance(item, dict) and item.get("id") == target_id), None)
    if selected is None:
        raise ExpansionPlanUnavailable("the governed selection is unavailable")

    label = _text(selected.get("label"))
    nodes = {item.get("id"): item for item in graph.get("nodes", ())
             if isinstance(item, dict) and isinstance(item.get("id"), str)}
    context: list[str] = []
    guidance: list[str] = []
    if target_kind == "NODE":
        if label is None:
            raise ExpansionPlanUnavailable("the selected node has no governed label")
        node_type = _text(selected.get("type")) or "node"
        context.extend((f"Selected node: {label}", f"Governed type: {node_type}"))
        guidance.extend((
            f'Clarify the identity and documented attributes of "{label}"',
            f'Find independent evidence that supports or challenges claims about "{label}"',
        ))
        adjacent: list[str] = []
        for edge in graph.get("edges", ()):
            if not isinstance(edge, dict) or target_id not in (edge.get("source"), edge.get("target")):
                continue
            other_id = edge.get("target") if edge.get("source") == target_id else edge.get("source")
            other = nodes.get(other_id)
            other_label = _text(other.get("label")) if other else None
            relationship = _text(edge.get("relationship")) or _text(edge.get("label"))
            if other_label:
                adjacent.append(other_label)
                context.append(f"Adjacent governed node: {other_label}")
                relation_lens = f" under the governed {relationship} relationship" if relationship else ""
                guidance.append(f'Inspect evidence connecting "{label}" and "{other_label}"{relation_lens}')
        if adjacent:
            guidance.append(f'Look for contradictions among governed context involving "{label}"')
        profile_id = "GENERAL_NODE"
    else:
        source = nodes.get(selected.get("source")); target = nodes.get(selected.get("target"))
        source_label = _text(source.get("label")) if source else None
        target_label = _text(target.get("label")) if target else None
        if source_label is None or target_label is None:
            raise ExpansionPlanUnavailable("the selected edge has no governed endpoint labels")
        relationship = _text(selected.get("relationship")) or label or "relationship"
        context.extend((f"Governed source: {source_label}", f"Governed target: {target_label}",
                        f"Governed relationship: {relationship}"))
        guidance.extend((
            f'Find evidence supporting the "{relationship}" relationship between "{source_label}" and "{target_label}"',
            f'Find evidence challenging the "{relationship}" relationship between "{source_label}" and "{target_label}"',
            f'Clarify direction, timing, and uncertainty for the relationship between "{source_label}" and "{target_label}"',
        ))
        profile_id = "GENERAL_EDGE"

    unique_guidance = tuple(dict.fromkeys(guidance))[:MAX_QUERY_GUIDANCE]
    if len(unique_guidance) < 2:
        raise ExpansionPlanUnavailable("the governed selection cannot produce bounded query guidance")
    return ExpansionPlan(profile_id, unique_guidance, tuple(dict.fromkeys(context)))
