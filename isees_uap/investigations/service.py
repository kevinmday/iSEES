from __future__ import annotations

import hashlib
import json
import uuid
from datetime import datetime
from copy import deepcopy
from collections.abc import Callable

from .errors import (
    DuplicateInvestigationId, InvestigationNotFound, RepositoryUnavailable,
)
from .models import (Investigation, InvestigationActivation, InvestigationAggregate,
                     InvestigationSummary, OperationalGraphRevision, summarize,
                     ManifoldArtifactAdmissionReceipt)
from .manifold_artifact_admission import plan_admission, admitted_node_identity
from .repository import InvestigationRepository
from .sqlite_repository import GRAPH_SCHEMA_VERSION


class InvestigationLibraryService:
    """Application service for authenticated, owner-scoped Investigations."""

    def __init__(
        self, repository: InvestigationRepository,
        *, id_generator: Callable[[], str] | None = None,
        collision_limit: int = 8,
    ):
        self.repository = repository
        self.id_generator = id_generator or (lambda: f"inv_{uuid.uuid4().hex}")
        self.collision_limit = collision_limit

    def list_owned(self, principal_id: str) -> list[InvestigationSummary]:
        return [summarize(item) for item in self.repository.list_owned(
            owner_principal_id=principal_id
        )]

    def get_owned(self, investigation_id: str, principal_id: str) -> Investigation:
        investigation = self.repository.get_owned(
            investigation_id=investigation_id, owner_principal_id=principal_id
        )
        if investigation is None:
            # Deliberately non-disclosing: absence and another owner's record agree.
            raise InvestigationNotFound("Investigation was not found")
        return investigation

    def get_owned_detail(
        self, investigation_id: str, principal_id: str
    ) -> tuple[Investigation, InvestigationAggregate]:
        investigation = self.get_owned(investigation_id, principal_id)
        aggregate = self.repository.get_empty_aggregate(
            investigation_id=investigation_id, owner_principal_id=principal_id
        )
        if aggregate is None:
            raise RepositoryUnavailable("Investigation aggregate is unavailable")
        return investigation, aggregate

    def get_owned_activation(self, investigation_id: str,
                             principal_id: str) -> InvestigationActivation:
        investigation, aggregate = self.get_owned_detail(investigation_id, principal_id)
        lineage = self.repository.get_operational_revision_lineage(
            investigation_id=investigation_id, owner_principal_id=principal_id)
        if lineage is None and aggregate.state == "ADOPTED":
            lineage = self.repository.materialize_compatibility_baseline_owned(
                investigation_id=investigation_id, owner_principal_id=principal_id)
        return InvestigationActivation(investigation, aggregate, lineage)

    def admit_manifold_artifact(self, *, investigation_id, principal_id, verified_projection,
            expected_operational_head_id, selected_relationship_declaration_ids, idempotency_key):
        authority=self.get_owned_activation(investigation_id,principal_id)
        investigation,aggregate,lineage=authority.investigation,authority.aggregate,authority.operational_lineage
        current=lineage.revisions[-1] if lineage else None
        graph=deepcopy(current.graph_snapshot) if current else {"nodes":[],"edges":[],"statistics":{"nodeCount":0,"edgeCount":0,"eventCount":0,"facilityCount":0,"artifactCount":0,"personCount":0,"organizationCount":0,"locationCount":0,"narrativeCount":0,"hypothesisCount":0}}
        node_id=admitted_node_identity(verified_projection.record.projection_id,verified_projection.output_hash)
        command={"investigationId":investigation_id,"expectedOperationalHead":expected_operational_head_id,
          "projectionId":verified_projection.record.projection_id,"verifiedProjectionOutputHash":verified_projection.output_hash,
          "artifactNodeId":node_id,"selectedRelationshipDeclarationIds":sorted(selected_relationship_declaration_ids)}
        command_hash="sha256:"+hashlib.sha256(json.dumps(command,sort_keys=True,separators=(",",":")).encode()).hexdigest()
        replay=self.repository.get_manifold_admission_replay(owner_principal_id=principal_id,
          investigation_id=investigation_id,idempotency_key=idempotency_key,command_hash=command_hash)
        if replay is not None: return replay,True,self.get_owned_activation(investigation_id,principal_id)
        plan=plan_admission(verified_projection.manifest,verified_projection.record.projection_id,
                            verified_projection.output_hash,tuple(selected_relationship_declaration_ids),graph)
        token=hashlib.sha256(command_hash.encode()).hexdigest()
        revision_id="REV-MANIFOLD-"+token[:24]
        admitted_metadata=next(node["metadata"] for node in plan.graph_snapshot["nodes"] if node["id"]==plan.node_id)
        admitted_metadata.update({"admissionReceiptId":"admission-"+token,
          "resultingOperationalRevisionId":revision_id,"admittedRelationshipCount":len(plan.relationship_ids),
          "canonEffect":"NONE","epistemicStatus":"DECLARATIONS_NOT_AUTOMATICALLY_ESTABLISHED_FACTS",
          "lineage":{"sourceStudioArtifactId":verified_projection.manifest.source.artifactId,
            "sourceAuthorRevisionId":verified_projection.manifest.source.revisionId,
            "sourceProjectionId":verified_projection.record.projection_id}})
        revision=OperationalGraphRevision(investigation_id,revision_id,
          1 if current is None else current.revision_number+1,expected_operational_head_id,plan.graph_snapshot,
          json.dumps({"nodes":sorted(plan.graph_snapshot["nodes"],key=lambda x:x["id"]),"edges":sorted(plan.graph_snapshot["edges"],key=lambda x:x["id"])},sort_keys=True,separators=(",",":")),
          GRAPH_SCHEMA_VERSION,"MANIFOLD_ARTIFACT_ADMISSION_V1","AUTHENTICATED_RESEARCHER",datetime.now().astimezone(),
          "ADMIT_MANIFOLD_ARTIFACT",verified_projection.record.projection_id)
        from .sqlite_repository import operational_graph_fingerprint
        revision=OperationalGraphRevision(**{**revision.__dict__,"graph_fingerprint":operational_graph_fingerprint(plan.graph_snapshot)})
        receipt=ManifoldArtifactAdmissionReceipt("admission-"+token,principal_id,investigation_id,
          verified_projection.manifest.source.artifactId,verified_projection.manifest.source.revisionId,
          verified_projection.record.projection_id,verified_projection.output_hash,plan.node_id,
          tuple(sorted(selected_relationship_declaration_ids)),plan.relationship_ids,expected_operational_head_id,
          revision_id,command_hash,idempotency_key,datetime.now().astimezone())
        aggregate_payload=deepcopy(aggregate.payload) if aggregate.payload else {
          "schemaVersion":"canon-event-import/v1",
          "source":{"kind":"SYSTEM_CANON","eventId":verified_projection.record.projection_id,
                    "importedAt":receipt.admitted_at.isoformat()},
          "title":investigation.title,"objective":investigation.objective,
          "workspace":{"sourceWorkspaceId":f"workspace:{investigation_id}","nodes":[],"edges":[]},
          "researchInbox":[],"artifacts":[],
          "viewState":{"activeMode":"MANIFOLD","focusedEventId":None,"activeLayers":[],
                       "temporalContext":None,"investigativeScale":None}}
        stored,replayed=self.repository.admit_manifold_artifact_owned(owner_principal_id=principal_id,
          investigation_id=investigation_id,expected_operational_head_id=expected_operational_head_id,
          expected_aggregate_revision=aggregate.revision,revision=revision,aggregate_payload=aggregate_payload,receipt=receipt)
        return stored,replayed,self.get_owned_activation(investigation_id,principal_id)

    def create_empty_owned(
        self, *, principal_id: str, title: str, objective: str | None,
        idempotency_key: str,
    ) -> tuple[Investigation, InvestigationAggregate, bool]:
        canonical = json.dumps(
            {"objective": objective, "title": title},
            ensure_ascii=False, sort_keys=True, separators=(",", ":"),
        )
        command_hash = hashlib.sha256(canonical.encode("utf-8")).hexdigest()
        for _ in range(self.collision_limit):
            try:
                return self.repository.create_empty_owned(
                    investigation_id=self.id_generator(),
                    owner_principal_id=principal_id, title=title, objective=objective,
                    idempotency_key=idempotency_key, command_hash=command_hash,
                )
            except DuplicateInvestigationId:
                continue
        raise RepositoryUnavailable("Investigation identity generation is unavailable")

    def adopt_guest_owned(self, *, principal_id: str, title: str, objective: str | None,
                          idempotency_key: str, payload: dict, operational: dict):
        canonical = json.dumps({"payload": payload, "operational": operational}, ensure_ascii=False, sort_keys=True, separators=(",", ":"), default=lambda value: value.isoformat() if isinstance(value, datetime) else TypeError())
        command_hash = hashlib.sha256(canonical.encode("utf-8")).hexdigest()
        for _ in range(self.collision_limit):
            try:
                investigation_id = self.id_generator()
                revision = OperationalGraphRevision(
                    investigation_id=investigation_id, operational_revision_id="REV-0001",
                    revision_number=1, parent_operational_revision_id=None,
                    graph_snapshot=operational["graph"], graph_fingerprint=operational["fingerprint"],
                    graph_schema_version=GRAPH_SCHEMA_VERSION,
                    algorithm_version=operational["algorithmVersion"], actor_authority="GUEST_ADOPTION",
                    recorded_at=operational["recordedAt"], mutation_kind="GUEST_ADOPTION_INITIAL",
                    source_identity=payload["source"]["guestInvestigationId"])
                return self.repository.adopt_guest_owned(
                    investigation_id=investigation_id, owner_principal_id=principal_id,
                    title=title, objective=objective, idempotency_key=idempotency_key,
                    command_hash=command_hash, payload=payload, operational_revision=revision)
            except DuplicateInvestigationId:
                continue
        raise RepositoryUnavailable("Investigation identity generation is unavailable")

    def get_active_owned(self, principal_id: str):
        return self.repository.get_active_owned(owner_principal_id=principal_id)

    def import_canon_event_owned(self, *, investigation_id: str, principal_id: str,
                                 expected_revision: int, idempotency_key: str, payload: dict,
                                 operational: dict, expected_operational_head_id: str | None):
        command_domain = deepcopy({"payload": payload, "operational": operational,
                                   "expectedOperationalHeadId": expected_operational_head_id})
        command_domain["payload"]["source"].pop("importedAt", None)
        command_domain["operational"].pop("recordedAt", None)
        canonical = json.dumps(command_domain, ensure_ascii=False, sort_keys=True, separators=(",", ":"), default=lambda value: value.isoformat() if isinstance(value, datetime) else TypeError())
        lineage = self.repository.get_operational_revision_lineage(
            investigation_id=investigation_id, owner_principal_id=principal_id)
        number = len(lineage.revisions) + 1 if lineage else 1
        revision = OperationalGraphRevision(
            investigation_id=investigation_id,
            operational_revision_id=f"REV-{number:04d}", revision_number=number,
            parent_operational_revision_id=expected_operational_head_id,
            graph_snapshot=operational["graph"], graph_fingerprint=operational["fingerprint"],
            graph_schema_version=GRAPH_SCHEMA_VERSION,
            algorithm_version=operational["algorithmVersion"], actor_authority="AUTHENTICATED_RESEARCHER",
            recorded_at=operational["recordedAt"], mutation_kind="CANON_EVENT_IMPORT",
            source_identity=payload["source"]["eventId"])
        return self.repository.import_canon_event_owned(
            investigation_id=investigation_id, owner_principal_id=principal_id,
            expected_revision=expected_revision, idempotency_key=idempotency_key,
            command_hash=hashlib.sha256(canonical.encode("utf-8")).hexdigest(), payload=payload,
            operational_revision=revision,
            expected_operational_head_id=expected_operational_head_id)
