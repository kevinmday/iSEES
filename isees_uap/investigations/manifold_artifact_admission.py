from __future__ import annotations
import hashlib, json
from copy import deepcopy
from dataclasses import dataclass
from .errors import InvalidManifoldArtifactAdmission

def _digest(value: object) -> str:
    encoded=json.dumps(value,sort_keys=True,separators=(",",":"),ensure_ascii=False).encode()
    return hashlib.sha256(encoded).hexdigest()

@dataclass(frozen=True)
class AdmissionPlan:
    node_id: str
    graph_snapshot: dict
    relationship_ids: tuple[str, ...]

def admitted_node_identity(projection_id: str, output_hash: str) -> str:
    return "artifact:manifold:"+_digest({"projectionId":projection_id,"outputHash":output_hash})

def plan_admission(manifest, projection_id: str, output_hash: str,
                   selected_declaration_ids: tuple[str, ...], current_graph: dict) -> AdmissionPlan:
    selected=tuple(sorted(selected_declaration_ids))
    if len(selected)!=len(set(selected)):
        raise InvalidManifoldArtifactAdmission("Relationship selection contains duplicates")
    declarations={item.declarationId:item for item in manifest.declarations}
    chosen=[]
    for identity in selected:
        declaration=declarations.get(identity)
        if declaration is None or declaration.declarationType != "PROPOSED_RELATIONSHIP":
            raise InvalidManifoldArtifactAdmission("Relationship selection is invalid")
        chosen.append(declaration)
    graph=deepcopy(current_graph)
    node_id=admitted_node_identity(projection_id, output_hash)
    if any(node["id"]==node_id for node in graph["nodes"]):
        raise InvalidManifoldArtifactAdmission("Projection has already been admitted")
    metadata={"subtype":"MANIFOLD_ARTIFACT","studioArtifactId":manifest.source.artifactId,
      "documentId":manifest.source.documentId,"authorRevisionId":manifest.source.revisionId,
      "authorRevisionNumber":manifest.source.revisionNumber,"authorRevisionContentHash":manifest.source.contentHash,
      "projectionId":projection_id,"projectionOutputHash":output_hash,"schemaVersion":manifest.schemaVersion,
      "projectionConfiguration":manifest.projectionConfiguration.model_dump(mode="json"),
      "frozenSourceAnchors":[x.model_dump(mode="json") for x in manifest.frozenSourceAnchors],
      "normalizedProvenance":[x.model_dump(mode="json") for x in manifest.normalizedProvenance],
      "declarations":[x.model_dump(mode="json") for x in manifest.declarations],
      "declarationCounts":{kind:sum(x.declarationType==kind for x in manifest.declarations) for kind in
        ("RESEARCHER_ASSERTION","DECLARED_UNKNOWN","DECLARED_CONTRADICTION","PROPOSED_RELATIONSHIP","RESEARCH_VECTOR","SCOPE_CONSTRAINT","EXCLUSION")}}
    graph["nodes"].append({"id":node_id,"label":manifest.source.documentId,"type":"ARTIFACT",
                           "iconType":"ARTIFACT","metadata":metadata})
    eligible={node["id"] for node in graph["nodes"]}
    # Eligibility is an artifact-level invariant, not a browser-selection
    # convenience.  A malformed or dangling unselected proposal must not ride
    # into canonical metadata beside otherwise admissible declarations.
    for declaration in manifest.declarations:
        if declaration.declarationType != "PROPOSED_RELATIONSHIP":
            continue
        endpoints=[]
        for reference in (declaration.subject,declaration.object):
            endpoint=(node_id if reference.kind == "ARTIFACT"
                      and reference.identity == "$ADMITTED_ARTIFACT"
                      else reference.identity)
            endpoints.append(endpoint)
        if endpoints[0] not in eligible or endpoints[1] not in eligible or endpoints[0] == endpoints[1]:
            raise InvalidManifoldArtifactAdmission(
                f"Proposed relationship {declaration.declarationId} has an unresolved or invalid endpoint")
    existing={(edge["source"],edge["target"],edge["relationship"]) for edge in graph["edges"]}
    relationship_ids=[]
    for declaration in chosen:
        source, target=declaration.subject.identity, declaration.object.identity
        if declaration.subject.kind == "ARTIFACT" and source == "$ADMITTED_ARTIFACT": source=node_id
        if declaration.object.kind == "ARTIFACT" and target == "$ADMITTED_ARTIFACT": target=node_id
        key=(source,target,declaration.predicate)
        if source not in eligible or target not in eligible or source==target or key in existing:
            raise InvalidManifoldArtifactAdmission("Selected relationship is dangling, self-invalid, or conflicting")
        edge_id="relationship:manifold:"+_digest({"nodeId":node_id,"declarationId":declaration.declarationId})
        graph["edges"].append({"id":edge_id,"source":source,"target":target,
          "relationship":declaration.predicate,"weight":1,"rationale":["Explicitly admitted Studio relationship declaration."],
          "metrics":{"epistemicStatus":"PROPOSED_RELATIONSHIP","declarationId":declaration.declarationId}})
        existing.add(key); relationship_ids.append(edge_id)
    stats=graph.get("statistics")
    if isinstance(stats,dict):
        stats["nodeCount"]=len(graph["nodes"]); stats["edgeCount"]=len(graph["edges"])
        stats["artifactCount"]=sum(node["type"]=="ARTIFACT" for node in graph["nodes"])
    return AdmissionPlan(node_id,graph,tuple(relationship_ids))
