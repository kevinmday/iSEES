from __future__ import annotations

from datetime import datetime, timezone

import pytest

from isees_uap.research_sources.sqlite_repository import SQLiteResearchSourceRepository
from isees_uap.studio.errors import IdempotencyConflict, InvalidSourceSnapshot
from isees_uap.studio.errors import UnavailableExternalAuthority
from isees_uap.studio.ports import AcceptanceReceipt, AccessResult, PublicationReceipt
from isees_uap.studio.schemas import CreateStudioDraft, SaveStudioArtifactVersion, ValidateStudioProjection
from isees_uap.studio.service import StudioService
from isees_uap.studio.source_resolution import CandidateEvidenceSourceResolution, ManifoldResearchSourceResolution, RoutedStudioSourceResolution
from isees_uap.studio.sqlite_repository import SQLiteStudioRepository

NOW = datetime(2026, 9, 5, tzinfo=timezone.utc)

class Access:
    def resolve_access(self, **_): return AccessResult(True)
class External:
    def publish_candidate(self, **_): return PublicationReceipt("r", "n", NOW.isoformat())
    def accept_candidate(self, **_): return AcceptanceReceipt("r", "k", NOW.isoformat())

def publication(kind="NODE", identity="system:entity:e2-hawkeye-sensor-grid", revision=1):
    graph_identity = f"{kind}:{identity}"
    value = {"schemaVersion": "research-source-publication/v1", "anchorId": f"research-v2:inv:GRAPH:{graph_identity}",
        "investigationId": "inv", "sourceWorkspace": "MANIFOLD", "sourceKind": "GRAPH",
        "sourceIdentity": graph_identity, "sourceRevisionId": str(revision), "graphIdentity": graph_identity,
        "graphType": kind, "graphId": identity, "graphRevision": revision, "classification": "CANONICAL",
        "insertionState": "INSERTABLE", "insertionReason": "Exact graph identity and revision are available.",
        "displayTitle": identity, "displaySummary": f"{kind} at graph revision {revision}",
        "representationSchemaVersion": "research-graph/v1", "mediaType": "application/json",
        "capturedRepresentation": {"graph": {"type": kind, "id": identity}, "graphRevision": revision},
        "collectedAt": "2026-09-05T00:00:00.000Z", "createdAt": "2026-09-05T00:00:00.000Z"}
    value["immutableSourceHash"] = SQLiteResearchSourceRepository.canonical_hash(value)
    return value

def snapshot(pub):
    return {"snapshotId": f'studio-source:{pub["anchorId"]}', "anchorId": pub["anchorId"],
        "sourceIdentity": pub["sourceIdentity"], "sourceInvestigationId": pub["investigationId"],
        "sourceWorkspace": pub["sourceWorkspace"], "sourceKind": "EVENT_NODE" if pub["graphType"] == "NODE" else "CORRESPONDENCE_EDGE",
        "classification": pub["classification"], "sourceRevisionId": pub["sourceRevisionId"],
        "capturedAt": pub["collectedAt"], "representationSchemaVersion": pub["representationSchemaVersion"],
        "mediaType": pub["mediaType"], "capturedRepresentation": pub["capturedRepresentation"],
        "graphIdentity": pub["graphIdentity"], "graphRevision": pub["graphRevision"],
        "insertionState": pub["insertionState"], "insertionReason": pub["insertionReason"],
        "immutableSourceHash": pub["immutableSourceHash"]}

def service(studio_path, research_path):
    repo = SQLiteStudioRepository(studio_path)
    resolver = RoutedStudioSourceResolution(ManifoldResearchSourceResolution(
        SQLiteResearchSourceRepository(research_path)), CandidateEvidenceSourceResolution())
    return StudioService(repo, Access(), resolver, External(), External(), clock=lambda: NOW), repo

def draft(snapshots=None):
    return CreateStudioDraft(investigationId="inv", principalId="p", idempotencyKey="create", artifactId="a",
        versionId="v1", authorSchemaVersion="author/v1", document={"identity": {"id": "doc"}}, sourceSnapshots=snapshots or [])

@pytest.mark.parametrize("kind", ["NODE", "EDGE"])
def test_canonical_manifold_source_resolves_available_after_reconstruction(tmp_path, kind):
    path = tmp_path / "research.db"; pub = publication(kind=kind, identity=f"canonical:{kind.lower()}")
    SQLiteResearchSourceRepository(path).publish(pub, "p")
    _, replayed = SQLiteResearchSourceRepository(path).publish(pub, "p")
    assert replayed
    svc, repo = service(tmp_path / "studio.db", path)
    svc.create_draft("inv", draft([snapshot(pub)]))
    restored = SQLiteStudioRepository(tmp_path / "studio.db").get(artifact_id="a")
    assert restored.source_snapshots[0].resolution_status.value == "AVAILABLE"
    assert restored.source_snapshots[0].resolution_metadata["graphIdentity"] == pub["graphIdentity"]

def test_source_backed_v2_is_atomic_idempotent_and_preserves_v1_projection(tmp_path):
    research = tmp_path / "research.db"; pub = publication()
    SQLiteResearchSourceRepository(research).publish(pub, "p")
    svc, repo = service(tmp_path / "studio.db", research)
    svc.create_draft("inv", draft())
    svc.validate_projection("inv", ValidateStudioProjection(investigationId="inv", principalId="p", idempotencyKey="validate",
        artifactId="a", expectedRevision=0, artifactVersionId="v1", projectionId="pdf-v1", projectionFormat="PDF", validatorVersion="v"))
    command = SaveStudioArtifactVersion(investigationId="inv", principalId="p", idempotencyKey="save", artifactId="a",
        expectedRevision=1, versionId="v2", authorSchemaVersion="author/v1", document={"identity": {"id": "doc"}, "sourced": True}, sourceSnapshots=[snapshot(pub)])
    result = svc.save_version("inv", command); replay = svc.save_version("inv", command)
    record = repo.get(artifact_id="a")
    assert result.currentVersionId == "v2" and replay.replayed
    assert [(v.version_id, v.parent_version_id) for v in record.versions] == [("v1", None), ("v2", "v1")]
    assert record.versions[0].document == {"identity": {"id": "doc"}}
    assert record.versions[1].source_snapshot_ids == (snapshot(pub)["snapshotId"],)
    assert len(record.source_snapshots) == 1 and record.projections[0].artifact_version_id == "v1"
    assert not [p for p in record.projections if p.artifact_version_id == "v2"]
    with pytest.raises(IdempotencyConflict):
        svc.save_version("inv", command.model_copy(update={"document": {"changed": True}}))

@pytest.mark.parametrize("field,value", [("capturedRepresentation", {"graph": {"type": "NODE", "id": "tampered"}, "graphRevision": 1}), ("immutableSourceHash", "sha256:" + "0" * 64), ("graphRevision", 2)])
def test_tampered_or_stale_source_prevents_version_transaction(tmp_path, field, value):
    research = tmp_path / "research.db"; pub = publication(); SQLiteResearchSourceRepository(research).publish(pub, "p")
    svc, repo = service(tmp_path / "studio.db", research); svc.create_draft("inv", draft())
    bad = {**snapshot(pub), field: value}
    with pytest.raises(InvalidSourceSnapshot):
        svc.save_version("inv", SaveStudioArtifactVersion(investigationId="inv", principalId="p", idempotencyKey="bad",
            artifactId="a", expectedRevision=0, versionId="v2", authorSchemaVersion="author/v1", document={"bad": True}, sourceSnapshots=[bad]))
    record = repo.get(artifact_id="a")
    assert record.artifact.current_version_id == "v1" and record.artifact.revision == 0 and len(record.versions) == 1

def test_foreign_principal_and_missing_source_fail_closed(tmp_path):
    research = tmp_path / "research.db"; pub = publication(); SQLiteResearchSourceRepository(research).publish(pub, "other")
    svc, _ = service(tmp_path / "studio.db", research); svc.create_draft("inv", draft())
    with pytest.raises(InvalidSourceSnapshot):
        svc.save_version("inv", SaveStudioArtifactVersion(investigationId="inv", principalId="p", idempotencyKey="missing",
            artifactId="a", expectedRevision=0, versionId="v2", authorSchemaVersion="author/v1", document={}, sourceSnapshots=[snapshot(pub)]))

def test_candidate_evidence_route_retains_unavailable_fail_closed_semantics(tmp_path):
    svc, repo = service(tmp_path / "studio.db", tmp_path / "research.db"); svc.create_draft("inv", draft())
    evidence = {**snapshot(publication()), "snapshotId": "evidence", "anchorId": "research:evidence",
        "sourceIdentity": "evidence:1", "sourceWorkspace": "EVIDENCE", "sourceKind": "EVIDENCE",
        "graphIdentity": None, "graphRevision": None}
    with pytest.raises(UnavailableExternalAuthority):
        svc.save_version("inv", SaveStudioArtifactVersion(investigationId="inv", principalId="p", idempotencyKey="evidence",
            artifactId="a", expectedRevision=0, versionId="v2", authorSchemaVersion="author/v1", document={}, sourceSnapshots=[evidence]))
    assert repo.get(artifact_id="a").artifact.current_version_id == "v1"
