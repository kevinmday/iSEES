from __future__ import annotations

from typing import Any

from .errors import InvestigationMismatch, NotFound, RevisionConflict
from .repository import CandidateEvidenceRepository


class CandidateEvidenceService:
    def __init__(self, repository: CandidateEvidenceRepository):
        self.repository = repository

    @staticmethod
    def require_investigation(path_id: str, body_id: str) -> None:
        if path_id != body_id:
            raise InvestigationMismatch("Path and body Investigation identities must agree")

    def create(self, path_id: str, command: dict[str, Any], principal_id: str, origin: str):
        self.require_investigation(path_id, command["investigationId"])
        if origin == "DISCOVERY" and command["querySpecification"]["investigationId"] != path_id:
            raise InvestigationMismatch("Query and command Investigation identities must agree")
        return self.repository.create(command=command, principal_id=principal_id, origin=origin)

    def intake(self, path_id: str, command: dict[str, Any], principal_id: str,
               active_investigation_revision: int):
        self.require_investigation(path_id, command["investigationId"])
        if command["expectedInvestigationRevision"] != active_investigation_revision:
            raise RevisionConflict("Active Investigation revision changed before intake")
        expected_manifold_revision = f"investigation-aggregate:{active_investigation_revision}"
        if command["manifoldRevisionId"] != expected_manifold_revision:
            raise RevisionConflict("Active Manifold revision changed before intake")
        pathway = command["pathway"]
        origin = "DISCOVERY" if pathway == "WEB_DISCOVERY" else "SUBMISSION"
        locator = command.get("submittedUrl")
        normalized = command.get("normalizedUrl")
        source = ({"originalLocator": locator, "normalizedUrl": normalized,
                   "sourceDomain": command.get("sourceDomain"), **({"title": command["title"]} if command.get("title") else {})}
                  if locator else {"title": command.get("title") or "Researcher-authored note"})
        internal = {
            "schemaVersion": "candidate-evidence-command/v1", "investigationId": path_id,
            "source": source, "association": None, "idempotencyKey": command["idempotencyKey"],
            "submissionIdentity": "intake:" + command["operationId"],
            "submittedLocator": locator, "manifoldRevisionId": command["manifoldRevisionId"],
            "intakePathway": pathway, "operationId": command["operationId"],
            "normalizationVersion": "url-normalization/v1" if locator else None,
            "intakeProvenance": {"kind": pathway, "researcherAuthored": pathway == "RESEARCHER_NOTE",
                                  "noteText": command.get("noteText"), "zeroExternalFetch": True},
        }
        if origin == "DISCOVERY":
            internal.update({
                "querySpecification": {"schemaVersion": "candidate-evidence-query/v1",
                    "investigationId": path_id, "targetConnector": "LOCAL_FIXTURE",
                    "query": normalized, "clauses": [],
                    "lineage": {"pathway": pathway, "zeroLiveProvider": True}},
                "connector": "LOCAL_FIXTURE", "connectorVersion": "1",
                "providerResultId": "web-discovery:" + command["operationId"],
                "providerResultVersion": None,
            })
        return self.repository.create(command=internal, principal_id=principal_id, origin=origin)

    def direct_upload(self, path_id: str, command: dict[str, Any], principal_id: str,
                      active_investigation_revision: int):
        self.require_investigation(path_id, command["investigationId"])
        if command["expectedInvestigationRevision"] != active_investigation_revision:
            raise RevisionConflict("Active Investigation revision changed before upload")
        expected_manifold_revision = f"investigation-aggregate:{active_investigation_revision}"
        if command["manifoldRevisionId"] != expected_manifold_revision:
            raise RevisionConflict("Active Manifold revision changed before upload")
        internal = {
            "schemaVersion": "candidate-evidence-command/v1",
            "investigationId": path_id,
            "submissionIdentity": "upload:" + command["operationId"],
            "source": {"title": command.get("title") or command["displayFilename"]},
            "association": None,
            "idempotencyKey": command["idempotencyKey"],
            "manifoldRevisionId": command["manifoldRevisionId"],
            "investigationAggregateRevision": active_investigation_revision,
            "intakePathway": "DIRECT_UPLOAD",
            "operationId": command["operationId"],
            "acquisitionState": "ACQUIRED",
            "availability": "AVAILABLE",
            "originalFilename": command["originalFilename"],
            "displayFilename": command["displayFilename"],
            "byteSize": command["byteSize"],
            "detectedMediaType": command["detectedMediaType"],
            "mediaCategory": command["mediaCategory"],
            "contentSha256": command["contentSha256"],
            "storageIdentity": command["storageIdentity"],
            "objectReference": command["objectReference"],
            "intakeProvenance": {
                "kind": "DIRECT_UPLOAD", "researcherAuthored": True,
                "noteText": command.get("noteText"), "zeroExternalFetch": True,
                "contentHashAlgorithm": "SHA-256", "aiAssistance": "NONE",
            },
        }
        return self.repository.create(command=internal, principal_id=principal_id, origin="SUBMISSION")

    def capture_web_discovery(self, command: dict[str, Any], principal_id: str):
        return self.repository.create(command=command, principal_id=principal_id, origin="DISCOVERY")

    def get(self, investigation_id: str, candidate_id: str, principal_id: str) -> dict[str, Any]:
        candidate = self.repository.get(investigation_id=investigation_id, candidate_id=candidate_id, principal_id=principal_id)
        if candidate is None:
            raise NotFound("Candidate was not found in this Investigation")
        return candidate

    def list(self, investigation_id: str, principal_id: str, limit: int, cursor: str | None):
        return self.repository.list(
            investigation_id=investigation_id,
            principal_id=principal_id,
            limit=limit,
            cursor=cursor,
        )

    def transition(self, path_id: str, candidate_id: str, command: dict[str, Any], principal_id: str):
        self.require_investigation(path_id, command["investigationId"])
        candidate, replayed = self.repository.transition(
            investigation_id=path_id, candidate_id=candidate_id, principal_id=principal_id, command=command
        )
        if not candidate:
            raise NotFound("Candidate was not found in this Investigation")
        return candidate, replayed
