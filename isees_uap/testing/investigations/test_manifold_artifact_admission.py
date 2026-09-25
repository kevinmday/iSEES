from types import SimpleNamespace
import pytest
from isees_uap.investigations.manifold_artifact_admission import admitted_node_identity, plan_admission
from isees_uap.investigations.errors import InvalidManifoldArtifactAdmission
from isees_uap.studio.v1.schemas import ManifoldArtifactManifest

HASH="sha256:"+"1"*64
def manifest():
    return ManifoldArtifactManifest.model_validate({"kind":"MANIFOLD_ARTIFACT","schemaVersion":"studio-manifold-artifact-manifest/v1",
      "source":{"artifactId":"a","documentId":"d","revisionId":"r","revisionNumber":1,"contentHash":HASH,"investigationId":"i"},
      "frozenSourceAnchors":[],"sourceKnowledgeIdentities":[],"evidenceReferences":[],"acceptedRelationshipReferences":[],"normalizedProvenance":[],
      "projectionConfiguration":{"configurationIdentity":"c","configurationVersion":"1","configurationHash":HASH},"canonEffect":"NONE",
      "declarations":[{"declarationId":"rel","declarationType":"PROPOSED_RELATIONSHIP","source":{"authorship":"RESEARCHER","sourceIdentity":"p"},"references":[],"subject":{"kind":"KNOWLEDGE_OBJECT","identity":"n1"},"predicate":"RELATES_TO","object":{"kind":"ARTIFACT","identity":"$ADMITTED_ARTIFACT"},"proposalState":"PROPOSED"},
      {"declarationId":"vector","declarationType":"RESEARCH_VECTOR","source":{"authorship":"RESEARCHER","sourceIdentity":"p"},"references":[],"researchQuestion":"What next?","targetReferences":[{"kind":"KNOWLEDGE_OBJECT","identity":"n1"}]}]})

def graph(): return {"nodes":[{"id":"n1","label":"one","type":"EVENT","metadata":{}}],"edges":[],"statistics":{"nodeCount":1,"edgeCount":0,"artifactCount":0}}

def test_default_is_one_deterministic_artifact_and_metadata_only():
    first=plan_admission(manifest(),"projection",HASH,(),graph()); second=plan_admission(manifest(),"projection",HASH,(),graph())
    assert first.node_id==second.node_id==admitted_node_identity("projection",HASH)
    assert len(first.graph_snapshot["nodes"])==2 and first.relationship_ids==() and first.graph_snapshot["edges"]==[]
    assert first.graph_snapshot["nodes"][-1]["type"]=="ARTIFACT"
    assert first.graph_snapshot["nodes"][-1]["metadata"]["subtype"]=="MANIFOLD_ARTIFACT"
    assert first.graph_snapshot["nodes"][-1]["metadata"]["declarationCounts"]["RESEARCH_VECTOR"]==1

def test_only_explicit_relationship_materializes_and_invalid_selection_fails():
    result=plan_admission(manifest(),"projection",HASH,("rel",),graph())
    assert len(result.relationship_ids)==1 and result.graph_snapshot["edges"][0]["target"]==result.node_id
    with pytest.raises(InvalidManifoldArtifactAdmission): plan_admission(manifest(),"projection",HASH,("vector",),graph())

def test_unresolved_endpoint_rejects_entire_artifact_even_when_edge_is_unselected():
    raw=manifest().model_dump(mode="json")
    raw["declarations"][0]["subject"]["identity"]="missing-node"
    value=ManifoldArtifactManifest.model_validate(raw)
    original=graph()
    with pytest.raises(InvalidManifoldArtifactAdmission, match="rel.*unresolved"):
        plan_admission(value,"projection",HASH,(),original)
    assert original==graph()

def test_new_node_reference_is_one_canonical_fail_closed_form():
    raw=manifest().model_dump(mode="json")
    raw["declarations"][0]["object"]={"kind":"KNOWLEDGE_OBJECT","identity":"$ADMITTED_ARTIFACT"}
    with pytest.raises(Exception): ManifoldArtifactManifest.model_validate(raw)
    raw["declarations"][0]["object"]={"kind":"ARTIFACT","identity":"unknown-artifact"}
    with pytest.raises(Exception): ManifoldArtifactManifest.model_validate(raw)
