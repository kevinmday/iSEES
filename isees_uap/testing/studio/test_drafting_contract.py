from __future__ import annotations

from datetime import datetime, timezone

import pytest
from fastapi.testclient import TestClient

from isees_uap.api import app
from isees_uap.api.v1.studio import service
from isees_uap.studio.drafting import ProviderFailureError, ProviderTimeoutError
from isees_uap.studio.errors import (
    DraftingProviderFailure, DraftingProviderTimeout, DraftingProviderUnavailable,
    InvalidDraftingContext, InvalidDraftingProviderResponse, OwnershipAccessFailure,
)
from isees_uap.studio.hashing import canonical_hash
from isees_uap.studio.ports import AccessResult, SourceResolutionResult
from isees_uap.studio.schemas import GenerateDraftProposal
from pydantic import ValidationError
from isees_uap.studio.service import StudioService

NOW = datetime(2026, 1, 2, tzinfo=timezone.utc)


class Repo:
    def __init__(self): self.calls = 0
    def __getattr__(self, _):
        def call(**__): self.calls += 1
        return call


class Access:
    def __init__(self, allowed=True): self.allowed = allowed
    def resolve_access(self, **_): return AccessResult(self.allowed)


class Sources:
    def resolve_source(self, **_): return SourceResolutionResult(True, {})


class Downstream:
    def publish_candidate(self, **_): raise AssertionError("candidate boundary touched")
    def accept_candidate(self, **_): raise AssertionError("knowledge boundary touched")


def context(**changes):
    value = {
        "contextContractVersion": "studio-drafting-context/v1", "investigationId": "i1",
        "documentId": "d1", "baseIdentity": {"documentRuntimeRevision": 4, "artifactId": None,
            "artifactVersionId": None, "artifactRevision": None}, "sourceSelectionMode": "SUBSET",
        "selectedSourceAnchorIds": ["anchor:1"], "selectedResearcherNoteNodeIds": [],
        "artifactDesign": {"designId": "report", "designVersion": "1"},
        "draftingInstruction": "Draft a bounded paragraph.",
        "sources": [{"anchorId": "anchor:1", "investigationId": "i1", "sourceWorkspace": "EVIDENCE",
            "sourceIdentity": "evidence:1", "sourceKind": "EVIDENCE_RECORD", "classification": "CANONICAL",
            "insertionState": "INSERTABLE", "insertionReason": "Qualified.", "displayTitle": "Evidence",
            "displaySummary": "Exact", "sourceRevisionId": "r1", "sourceExecutionId": None,
            "sourceProjectionId": None, "graphIdentity": None, "graphRevision": None,
            "captureSchemaVersion": "evidence/v1", "captureMediaType": "application/json",
            "capturedRepresentation": {"a": 1}, "collectedAt": "2026-01-02T00:00:00Z",
            "createdAt": "2026-01-02T00:00:00Z", "immutableSourceHash": "sha256:" + "a" * 64}],
        "researcherNotes": [], "excludedSources": []}
    value.update(changes)
    for source in value["sources"]:
        unhashed = {key: item for key, item in source.items() if key != "immutableSourceHash"}
        source["immutableSourceHash"] = canonical_hash(unhashed)
    return value


def command(**context_changes):
    parsed = GenerateDraftProposal.model_validate({"requestContractVersion": "studio-drafting-request/v1",
        "investigationId": "i1", "principalId": "p1", "contextHash": "sha256:" + "0" * 64,
        "context": context(**context_changes)})
    return parsed.model_copy(update={"contextHash": canonical_hash(parsed.context.model_dump(mode="json"))})


class Provider:
    provider_id = "test-provider"; model_id = "test-model"
    def __init__(self, behavior="ok"): self.behavior = behavior; self.calls = 0
    def generate_proposal(self, *, request):
        self.calls += 1
        if self.behavior == "timeout": raise ProviderTimeoutError("secret payload")
        if self.behavior == "failure": raise ProviderFailureError("secret payload")
        proposal = {"proposalId": "proposal:deterministic", "proposalContractVersion": "studio-draft-proposal/v1",
            "contextContractVersion": request.context.contextContractVersion,
            "investigationId": request.investigationId, "documentId": request.context.documentId,
            "baseIdentity": request.context.baseIdentity.model_dump(mode="json"), "contextHash": request.contextHash,
            "artifactDesign": request.context.artifactDesign.model_dump(mode="json"), "providerId": self.provider_id,
            "modelId": self.model_id, "outcome": "GENERATED", "blocks": [{"blockId": "block:1",
                "blockType": "PARAGRAPH", "text": "Drafted text.", "section": "Findings",
                "sourceReferences": [{"anchorId": "anchor:1", "relationship": "SUPPORTS"}]}],
            "warnings": [], "unsupportedClaimDisclosures": [], "contradictionDisclosures": [],
            "uncertaintyDisclosures": [], "generatedAt": NOW.isoformat()}
        if self.behavior == "citation": proposal["blocks"][0]["sourceReferences"][0]["anchorId"] = "invented"
        if self.behavior == "malformed": proposal["blocks"][0]["blockType"] = "PATCH"
        return proposal


def make_service(provider=None, access=None):
    repo = Repo()
    return StudioService(repo, access or Access(), Sources(), Downstream(), Downstream(), provider,
                         clock=lambda: NOW), repo


def test_generation_is_deterministic_and_non_mutating():
    provider = Provider(); svc, repo = make_service(provider); request = command()
    first = svc.generate_draft_proposal("i1", request); second = svc.generate_draft_proposal("i1", request)
    assert first == second and first.contextHash == request.contextHash
    assert repo.calls == 0 and provider.calls == 2


def test_scope_hash_selection_and_bounds_fail_before_provider():
    provider = Provider(); svc, _ = make_service(provider)
    with pytest.raises(InvalidDraftingContext): svc.generate_draft_proposal("i1", command(investigationId="i2"))
    with pytest.raises(InvalidDraftingContext): svc.generate_draft_proposal("i1", command(sources=[]))
    bad_hash = command().model_copy(update={"contextHash": "sha256:" + "f" * 64})
    with pytest.raises(InvalidDraftingContext): svc.generate_draft_proposal("i1", bad_hash)
    oversized = command(draftingInstruction="x" * 8_000, researcherNotes=[{"nodeId": "n1", "nodeType": "PARAGRAPH", "section": None, "text": "x" * 32_001, "documentOrder": 0}], selectedResearcherNoteNodeIds=["n1"])
    with pytest.raises(InvalidDraftingContext): svc.generate_draft_proposal("i1", oversized)
    assert provider.calls == 0


def test_instruction_source_context_and_proposal_bounds_reject_without_truncation():
    with pytest.raises(ValidationError):
        command(draftingInstruction="x" * 8_001)
    provider = Provider(); svc, _ = make_service(provider)
    large_source = context()["sources"][0]
    large_source["capturedRepresentation"] = {"text": "x" * 128_000}
    with pytest.raises(InvalidDraftingContext):
        svc.generate_draft_proposal("i1", command(sources=[large_source]))

    aggregate_sources = []
    for index in range(10):
        item = dict(context()["sources"][0])
        item.update(anchorId=f"anchor:{index:02}", sourceIdentity=f"evidence:{index:02}",
                    capturedRepresentation={"text": "x" * 105_000})
        aggregate_sources.append(item)
    with pytest.raises(InvalidDraftingContext):
        svc.generate_draft_proposal("i1", command(sources=aggregate_sources,
            selectedSourceAnchorIds=[item["anchorId"] for item in aggregate_sources]))

    class Oversized(Provider):
        def generate_proposal(self, *, request):
            result = super().generate_proposal(request=request)
            result["blocks"][0]["text"] = "x" * 256_001
            return result
    oversized, _ = make_service(Oversized())
    with pytest.raises(InvalidDraftingProviderResponse):
        oversized.generate_draft_proposal("i1", command())


@pytest.mark.parametrize("behavior,error", [("timeout", DraftingProviderTimeout), ("failure", DraftingProviderFailure),
    ("citation", InvalidDraftingProviderResponse), ("malformed", InvalidDraftingProviderResponse)])
def test_provider_failures_are_explicit_and_sanitized(behavior, error):
    svc, _ = make_service(Provider(behavior))
    with pytest.raises(error) as caught: svc.generate_draft_proposal("i1", command())
    assert "secret" not in str(caught.value) and "evidence" not in str(caught.value)


def test_unavailable_provider_and_unauthorized_scope_fail_closed():
    svc, repo = make_service()
    with pytest.raises(DraftingProviderUnavailable): svc.generate_draft_proposal("i1", command())
    denied, _ = make_service(Provider(), Access(False))
    with pytest.raises(OwnershipAccessFailure): denied.generate_draft_proposal("i1", command())
    assert repo.calls == 0


def test_frontend_artifact_design_wire_parity_is_strict_and_reaches_provider_boundary():
    wire = {"designId": "investigation-report", "designVersion": "1"}
    request = command(artifactDesign=wire)
    assert request.context.artifactDesign.model_dump(mode="json") == wire
    svc, repo = make_service()
    with pytest.raises(DraftingProviderUnavailable):
        svc.generate_draft_proposal("i1", request)
    assert repo.calls == 0
    with pytest.raises(ValidationError):
        GenerateDraftProposal.model_validate({
            **request.model_dump(mode="json"),
            "context": {**request.context.model_dump(mode="json"),
                "artifactDesign": {**wire, "label": "presentation only"}},
        })


def test_api_route_path_body_owner_and_safe_errors():
    svc, _ = make_service(Provider())
    app.dependency_overrides[service] = lambda: svc
    body = command().model_dump(mode="json")
    client = TestClient(app); url = "/api/v1/investigations/i1/studio-artifacts/drafting-proposals"
    try:
        assert client.post(url, json=body, headers={"X-ISEES-Principal-Id": "p1"}).status_code == 200
        mismatch = client.post(url.replace("/i1/", "/i2/"), json=body, headers={"X-ISEES-Principal-Id": "p1"})
        assert mismatch.status_code == 412
        denied = client.post(url, json={**body, "principalId": "other"}, headers={"X-ISEES-Principal-Id": "p1"})
        assert denied.status_code == 404
    finally: app.dependency_overrides.clear()


def test_api_unavailable_error_leaks_no_credentials_or_source_payload():
    svc, _ = make_service()
    app.dependency_overrides[service] = lambda: svc
    body = command().model_dump(mode="json")
    try:
        response = TestClient(app).post("/api/v1/investigations/i1/studio-artifacts/drafting-proposals",
            json=body, headers={"X-ISEES-Principal-Id": "p1", "X-Request-Id": "draft-1"})
        assert response.status_code == 503 and response.json()["error"]["code"] == "DRAFTING_PROVIDER_UNAVAILABLE"
        assert "evidence:1" not in response.text and "credential" not in response.text.lower()
    finally: app.dependency_overrides.clear()
