from __future__ import annotations
from copy import deepcopy
import json
from pathlib import Path
import pytest
from pydantic import ValidationError
from isees_uap.studio.v1.contracts import ARTIFACT_PROFILES, ASSISTANCE_MODES, CITATION_STYLES, GOVERNED_CONCLUSIONS, PROJECTION_FORMATS, PROJECTION_STATES, SEMANTIC_NODE_TYPES
from isees_uap.studio.v1.hashing import canonical_serialize, canonical_sha256
from isees_uap.studio.v1.schemas import SemanticDocument, SensitiveSourceDirectives
from isees_uap.studio.v1.validation import effective_sensitivity, validate_inference, validate_projection, validate_projection_transition, validate_proposal, validate_revision, validate_snapshot

FIXTURES = json.loads((Path(__file__).parents[3] / "contracts/studio-v1/fixtures/studio-v1-contract-fixtures.json").read_text(encoding="utf-8"))

def test_source_backed_author_ingestion_payload_validates_with_python_contract():
    frozen = {"schemaVersion":"studio-author-reference/v1","nodeId":"research-reference:anchor-1","targetType":"NODE","targetId":"NODE:event-7","title":"Event seven","summary":"Exact governed event representation.","section":"Analysis","sourceIdentity":"NODE:event-7","sourceKind":"GRAPH","sourceWorkspace":"MANIFOLD","sourceRevisionId":"graph-revision-12","collectedAt":"2026-09-11T18:00:00.000Z","locator":"graph-revision-12","classification":"CANONICAL","capturedRepresentation":{"schemaVersion":"research-graph/v1","mediaType":"application/json","value":{"graph":{"type":"NODE","id":"event-7"},"graphRevision":12}}}
    content = canonical_serialize(frozen)
    source = {"anchorId":"anchor-1","classification":"CANONICAL","availability":"AVAILABLE","provenance":"MANIFOLD:GRAPH:NODE:event-7","sensitivity":{"includeInAnalysis":True,"includeInArtifact":True,"citePublicly":False,"anonymize":False,"restrictedAppendix":False,"excludeFromAiProcessing":True},"representations":[{"representationId":"anchor-1:representation","mediaType":"application/json","schemaVersion":"studio-author-reference/v1","content":content,"contentHash":canonical_sha256(content)}]}
    domain = {"snapshotId":"artifact.snapshot-r4:anchor-1","investigationId":"inv:i10","capturedAt":"2026-09-11T18:00:00.000Z","selectionScope":"EXPLICIT_SELECTION","selectedAnchorIds":["anchor-1"],"inboxMembershipBasis":"EXPLICIT_STABLE_IDENTITIES","sources":[source],"immutableStatus":"FROZEN"}
    snapshot = validate_snapshot({**domain,"snapshotHash":canonical_sha256(domain)})
    semantic = SemanticDocument.model_validate({"documentId":"author:i10","schemaVersion":"studio-author-semantic/v1","title":"I10 report","nodeOrder":["research-reference:anchor-1"],"nodes":[{"id":"research-reference:anchor-1","type":"CLAIM","text":"Exact governed event representation.","sourceSnapshotIds":[snapshot.snapshotId],"supportState":"SUPPORTED"}],"citations":[{"citationId":"citation:research-reference:anchor-1","institutionalAuthor":"MANIFOLD","title":"Event seven","pagesOrLocator":"graph-revision-12","sourceSnapshotId":snapshot.snapshotId,"completeness":"COMPLETE","missingRequiredFields":[]}],"citationStyle":{"style":"APA","styleVersion":"studio-v1-apa/1","locale":"en-US"}})
    assert semantic.nodes[0].sourceSnapshotIds == (snapshot.snapshotId,)
    assert semantic.citations[0].sourceSnapshotId == snapshot.snapshotId

def test_exact_vocabulary_and_cross_language_golden_hashes():
    vocabulary = FIXTURES["vocabulary"]
    assert vocabulary == {"artifactProfiles": list(ARTIFACT_PROFILES), "citationStyles": list(CITATION_STYLES), "semanticNodeTypes": list(SEMANTIC_NODE_TYPES), "projectionFormats": list(PROJECTION_FORMATS), "projectionStates": list(PROJECTION_STATES), "assistanceModes": list(ASSISTANCE_MODES), "governedConclusions": list(GOVERNED_CONCLUSIONS)}
    revision = validate_revision(FIXTURES["scientificRevision"])
    snapshot = validate_snapshot(FIXTURES["entireInboxSnapshot"])
    assert canonical_sha256(FIXTURES["scientificRevision"]["semanticContent"]) == revision.contentHash
    domain = deepcopy(FIXTURES["entireInboxSnapshot"]); domain.pop("snapshotHash")
    assert canonical_sha256(domain) == snapshot.snapshotHash
    assert canonical_serialize({"z": 1, "a": ["é", True]}) == '{"a":["é",true],"z":1}'
    assert {x["id"] for x in FIXTURES["invalidFixtures"]} == {"fabricated-incomplete-citation-presented-complete", "duplicate-semantic-ids", "blank-identity", "unsupported-conclusion", "h0-rejection-without-declared-test", "inference-input-not-completed-immutable", "projection-mismatched-parent-hash", "proposal-stale-base", "unknown-field", "unsupported-probability-confidence-field"}

def test_valid_proposal_projection_and_inference_contracts():
    validate_proposal(FIXTURES["proposal"])
    validate_inference(FIXTURES["inferenceAssessment"])
    validate_projection(FIXTURES["projections"][0], FIXTURES["scientificRevision"]["contentHash"])
    validate_projection(FIXTURES["projections"][1], FIXTURES["projections"][1]["parentContentHash"])
    failed = validate_projection(FIXTURES["projections"][2], FIXTURES["scientificRevision"]["contentHash"])
    assert failed.priorSuccessfulProjectionId and failed.outputHash is None
    validate_projection_transition("CURRENT", "STALE")
    validate_projection_transition("FAILED", "QUEUED")
    with pytest.raises(ValueError): validate_projection_transition("PUBLISHED", "CURRENT")

@pytest.mark.parametrize("mutation", [
    lambda v: v.update(artifactId=" "),
    lambda v: v.update(unknownField=True),
    lambda v: (v["semanticContent"]["nodes"][1].update(id="heading-1"), v["semanticContent"]["nodeOrder"].__setitem__(1, "heading-1")),
    lambda v: v["semanticContent"]["citations"][0].update(completeness="COMPLETE", missingRequiredFields=["publisher"]),
])
def test_revision_strict_rejections(mutation):
    value = deepcopy(FIXTURES["scientificRevision"]); mutation(value)
    with pytest.raises((ValidationError, ValueError)): validate_revision(value)

def test_inference_fail_closed_rejections():
    mutations = [
        lambda v: v["governedConclusion"].update(conclusion="PROVEN"),
        lambda v: v["governedConclusion"].update(conclusion="H0_REJECTED_UNDER_DECLARED_TEST"),
        lambda v: v["intentionResults"][0].update(completionStatus="RUNNING"),
        lambda v: v.update(confidence=0.9),
    ]
    for index, mutation in enumerate(mutations):
        value = deepcopy(FIXTURES["inferenceAssessment"])
        if index == 1: value["governedConclusion"].pop("declaredTest", None)
        mutation(value)
        with pytest.raises((ValidationError, ValueError)): validate_inference(value)

def test_sensitivity_stale_proposal_and_lineage_fail_closed():
    policies = [SensitiveSourceDirectives.model_validate(x["sensitivity"]) for x in FIXTURES["entireInboxSnapshot"]["sources"]]
    effective = effective_sensitivity(policies)
    assert effective.excludeFromAiProcessing and effective.restrictedAppendix and not effective.includeInAnalysis and not effective.citePublicly
    with pytest.raises(ValueError): validate_proposal(FIXTURES["proposal"], "artifact-paper-1.r2", FIXTURES["scientificRevision"]["contentHash"])
    with pytest.raises(ValueError): validate_projection(FIXTURES["projections"][0], "sha256:" + "a" * 64)
