from __future__ import annotations

from dataclasses import replace
from datetime import datetime, timezone
from typing import Any, Callable
from uuid import uuid4

from .errors import (
    AcceptanceFailure, ArtifactNotFound, IdempotencyConflict,
    InvalidClaimSourceMapping, InvalidLifecycleTransition, InvalidSourceSnapshot,
    InvestigationMismatch, OwnershipAccessFailure, PublicationFailure,
    RevisionConflict, UnavailableExternalAuthority, UnresolvedProjectionReadiness,
)
from .hashing import canonical_hash
from .lifecycle import StudioLifecycle, require_transition
from .models import (
    CandidateKnowledgeArtifact, ClaimReviewState, ContradictionOrigin, LineageState,
    MaterializationState, ProjectionFormat, ReadinessState, RelationshipType,
    ReviewDecisionType, ReviewTargetScope, SourceClassification, SourceKind,
    StudioArtifact, StudioArtifactVersion, StudioCitation, StudioClaim,
    StudioClaimSourceMapping, StudioProjectionRecord, StudioReviewDecision,
    StudioSourceSnapshot,
)
from .ports import (
    AcceptedKnowledgePort, InvestigationAccessPort,
    ManifoldCandidatePublicationPort, StudioDraftingProvider, StudioSourceResolutionPort,
)
from .repository import IdempotencyRecord, StudioAggregateRecord, StudioRepository
from .schemas import (
    AcceptStudioArtifact, CreateCandidateKnowledgeArtifact, CreateStudioDraft,
    RecordMaterializedProjection, RejectStudioArtifact, ReturnStudioArtifact,
    SaveStudioArtifactVersion, StudioCommandResult, SubmitStudioForReview,
    ValidateStudioProjection, PublishStudioCandidateNode,
    DraftProposal, GenerateDraftProposal,
)
from .drafting import ProviderUnavailableError, generate


class _UnavailableDraftingProvider:
    provider_id = "unavailable"
    model_id = "unavailable"

    def generate_proposal(self, *, request: Any) -> Any:
        raise ProviderUnavailableError()


def _now() -> datetime:
    return datetime.now(timezone.utc)


class StudioService:
    def __init__(self, repository: StudioRepository, access_port: InvestigationAccessPort,
                 source_resolution_port: StudioSourceResolutionPort,
                 publication_port: ManifoldCandidatePublicationPort,
                 accepted_knowledge_port: AcceptedKnowledgePort,
                 drafting_provider: StudioDraftingProvider | None = None,
                 *, clock: Callable[[], datetime] = _now):
        self.repository = repository
        self.access_port = access_port
        self.source_resolution_port = source_resolution_port
        self.publication_port = publication_port
        self.accepted_knowledge_port = accepted_knowledge_port
        self.drafting_provider = drafting_provider or _UnavailableDraftingProvider()
        self.clock = clock

    def generate_draft_proposal(self, path_id: str, command: GenerateDraftProposal) -> DraftProposal:
        self._path(path_id, command.investigationId)
        self._authorize(command.principalId, command.investigationId)
        return generate(self.drafting_provider, command)

    def _authorize(self, principal_id: str, investigation_id: str) -> None:
        try:
            result = self.access_port.resolve_access(
                principal_id=principal_id, investigation_id=investigation_id)
        except Exception as exc:
            raise UnavailableExternalAuthority("Investigation authority unavailable") from exc
        if not result.allowed:
            raise OwnershipAccessFailure("Studio artifact was not found")

    def authorize_read(self, principal_id: str, investigation_id: str) -> None:
        """Apply the same fail-closed Investigation boundary to repository reads."""
        self._authorize(principal_id, investigation_id)

    @staticmethod
    def _path(path_id: str, body_id: str) -> None:
        if path_id != body_id:
            raise InvestigationMismatch("Path and command Investigation identities must agree")

    def _load(self, command: Any) -> StudioAggregateRecord:
        record = self.repository.get(artifact_id=command.artifactId)
        if (record is None or record.artifact.investigation_id != command.investigationId
                or record.artifact.owner_principal_id != command.principalId):
            raise ArtifactNotFound("Studio artifact was not found")
        if record.artifact.revision != command.expectedRevision:
            raise RevisionConflict("Expected revision is stale")
        return record

    @staticmethod
    def _scope(command: Any, operation: str) -> tuple[str, str, str, str]:
        return command.principalId, command.investigationId, operation, command.idempotencyKey

    def _replay(self, command: Any, operation: str) -> StudioCommandResult | None:
        scope = self._scope(command, operation)
        existing = self.repository.get_idempotency(scope=scope)
        if existing is None:
            return None
        digest = canonical_hash(command.model_dump(mode="json"))
        if existing.command_hash != digest:
            raise IdempotencyConflict("Idempotency key was reused with different command content")
        return StudioCommandResult.model_validate({**existing.result, "replayed": True})

    def _remember(self, command: Any, operation: str, result: StudioCommandResult) -> StudioCommandResult:
        self.repository.put_idempotency(
            scope=self._scope(command, operation),
            record=IdempotencyRecord(canonical_hash(command.model_dump(mode="json")),
                                     result.model_dump(mode="json")),
        )
        return result

    def _persist(self, record: StudioAggregateRecord, command: Any, operation: str,
                 result: StudioCommandResult, expected_revision: int | None) -> StudioCommandResult:
        """Use the durable repository's atomic aggregate/idempotency boundary."""
        atomic = getattr(self.repository, "persist_command", None)
        if atomic is None:
            if expected_revision is None:
                self.repository.create(record=record)
            else:
                self.repository.replace(record=record, expected_revision=expected_revision)
            return self._remember(command, operation, result)
        atomic(record=record, expected_revision=expected_revision,
               scope=self._scope(command, operation),
               idempotency=IdempotencyRecord(
                   canonical_hash(command.model_dump(mode="json")),
                   result.model_dump(mode="json")))
        return result

    def _begin(self, path_id: str, command: Any, operation: str) -> StudioCommandResult | None:
        self._path(path_id, command.investigationId)
        self._authorize(command.principalId, command.investigationId)
        return self._replay(command, operation)

    @staticmethod
    def _result(record: StudioAggregateRecord, **extra: Any) -> StudioCommandResult:
        artifact = record.artifact
        return StudioCommandResult(
            artifactId=artifact.artifact_id, investigationId=artifact.investigation_id,
            revision=artifact.revision, lifecycleState=artifact.lifecycle_state.value,
            currentVersionId=artifact.current_version_id,
            candidateArtifactId=artifact.candidate_artifact_id,
            manifoldCandidateNodeId=artifact.manifold_candidate_node_id, **extra)

    def _build_version(self, command: Any, artifact_id: str, number: int,
                       parent_id: str | None) -> tuple[StudioArtifactVersion, tuple[StudioSourceSnapshot, ...]]:
        version_id = command.versionId or str(uuid4())
        snapshots = tuple(StudioSourceSnapshot(
            snapshot_id=item.snapshotId, source_identity=item.sourceIdentity,
            source_investigation_id=item.sourceInvestigationId,
            source_workspace=item.sourceWorkspace, source_kind=SourceKind(item.sourceKind),
            classification=SourceClassification(item.classification),
            source_revision_id=item.sourceRevisionId, source_execution_id=item.sourceExecutionId,
            source_projection_id=item.sourceProjectionId,
            captured_at=item.capturedAt,
            representation_schema_version=item.representationSchemaVersion,
            media_type=item.mediaType, captured_representation=item.capturedRepresentation,
        ) for item in command.sourceSnapshots)
        for snapshot in snapshots:
            if snapshot.classification == SourceClassification.CANONICAL:
                if not (snapshot.source_identity and snapshot.source_investigation_id
                        and snapshot.source_workspace and
                        (snapshot.source_revision_id or snapshot.source_execution_id
                         or snapshot.source_projection_id)):
                    raise InvalidSourceSnapshot("Canonical sources require complete stable and revision identity")
                try:
                    resolved = self.source_resolution_port.resolve_source(
                        source_identity=snapshot.source_identity,
                        source_investigation_id=snapshot.source_investigation_id,
                        source_workspace=snapshot.source_workspace,
                        source_kind=snapshot.source_kind.value)
                except Exception as exc:
                    raise UnavailableExternalAuthority("Source authority unavailable") from exc
                if not resolved.available:
                    raise InvalidSourceSnapshot("Canonical source identity could not be resolved")
        snapshot_ids = {item.snapshot_id for item in snapshots}
        if len(snapshot_ids) != len(snapshots):
            raise InvalidSourceSnapshot("Snapshot identities must be unique")
        citation_ids = {item.citationId for item in command.citations}
        if len(citation_ids) != len(command.citations):
            raise InvalidClaimSourceMapping("Citation identities must be unique")
        if any(item.sourceSnapshotId not in snapshot_ids for item in command.citations):
            raise InvalidClaimSourceMapping("Citations must reference an existing snapshot")
        claims_input = {item.claimId: item for item in command.claims}
        if len(claims_input) != len(command.claims):
            raise InvalidClaimSourceMapping("Claim identities must be unique")
        for mapping in command.claimSourceMappings:
            if mapping.claimId not in claims_input or mapping.sourceSnapshotId not in snapshot_ids:
                raise InvalidClaimSourceMapping("Mappings must reference an existing claim and snapshot")
            if mapping.citationId is not None and mapping.citationId not in citation_ids:
                raise InvalidClaimSourceMapping("Mapping citation does not exist")
            citation = next((c for c in command.citations if c.citationId == mapping.citationId), None)
            if citation is not None and citation.sourceSnapshotId != mapping.sourceSnapshotId:
                raise InvalidClaimSourceMapping("Mapping citation and snapshot disagree")
        mappings_by_claim: dict[str, list[Any]] = {key: [] for key in claims_input}
        for mapping in command.claimSourceMappings:
            mappings_by_claim[mapping.claimId].append(mapping)
        def lineage(items: list[Any]) -> LineageState:
            relationships = {item.relationshipType for item in items}
            if not items:
                return LineageState.ORPHANED
            if "CONTRADICTS" in relationships:
                return LineageState.CONTRADICTED
            if "REQUIRES_RESOLUTION" in relationships:
                return LineageState.UNRESOLVED
            if "SUPPORTS" in relationships:
                return LineageState.SUPPORTED
            return LineageState.UNRESOLVED
        claims = tuple(StudioClaim(
            claim_id=item.claimId, artifact_version_id=version_id,
            claim_text=item.claimText, span_identity=item.spanIdentity,
            review_state=ClaimReviewState(item.reviewState),
            lineage_state=lineage(mappings_by_claim[item.claimId])) for item in command.claims)
        citations = tuple(StudioCitation(
            citation_id=item.citationId, artifact_version_id=version_id,
            source_snapshot_id=item.sourceSnapshotId,
            locator_metadata=item.locatorMetadata) for item in command.citations)
        mappings = tuple(StudioClaimSourceMapping(
            mapping_id=item.mappingId, artifact_version_id=version_id,
            claim_id=item.claimId, source_snapshot_id=item.sourceSnapshotId,
            relationship_type=RelationshipType(item.relationshipType), citation_id=item.citationId,
            contradiction_origin=ContradictionOrigin(item.contradictionOrigin) if item.contradictionOrigin else None,
            attributed_actor_id=item.attributedActorId,
            attributed_process=item.attributedProcess) for item in command.claimSourceMappings)
        content = {
            "artifactId": artifact_id, "versionNumber": number, "parentVersionId": parent_id,
            "authorSchemaVersion": command.authorSchemaVersion, "document": command.document,
            "sourceSnapshotIds": [s.snapshot_id for s in snapshots],
            "claims": [c.model_dump(mode="json") for c in command.claims],
            "citations": [c.model_dump(mode="json") for c in command.citations],
            "claimSourceMappings": [m.model_dump(mode="json") for m in command.claimSourceMappings],
            "comparisonContext": command.comparisonContext,
        }
        return StudioArtifactVersion(
            version_id=version_id, artifact_id=artifact_id, version_number=number,
            parent_version_id=parent_id, author_schema_version=command.authorSchemaVersion,
            document=command.document, source_snapshot_ids=tuple(s.snapshot_id for s in snapshots),
            claims=claims, citations=citations, claim_source_mappings=mappings,
            comparison_context=command.comparisonContext, content_hash=canonical_hash(content),
            created_by_principal_id=command.principalId, created_at=self.clock()), snapshots

    def create_draft(self, path_id: str, command: CreateStudioDraft) -> StudioCommandResult:
        operation = "CREATE_DRAFT"
        replay = self._begin(path_id, command, operation)
        if replay: return replay
        artifact_id = command.artifactId or str(uuid4())
        if self.repository.get(artifact_id=artifact_id) is not None:
            raise RevisionConflict("Artifact identity already exists")
        version, snapshots = self._build_version(command, artifact_id, 1, None)
        now = self.clock()
        record = StudioAggregateRecord(StudioArtifact(
            artifact_id, command.investigationId, command.principalId, 0,
            StudioLifecycle.DRAFT, 1, version.version_id, now, now), (version,), snapshots)
        return self._persist(record, command, operation, self._result(record), None)

    def save_version(self, path_id: str, command: SaveStudioArtifactVersion) -> StudioCommandResult:
        operation = "SAVE_VERSION"
        replay = self._begin(path_id, command, operation)
        if replay: return replay
        record = self._load(command)
        if record.artifact.lifecycle_state not in (StudioLifecycle.DRAFT, StudioLifecycle.RETURNED):
            raise InvalidLifecycleTransition("Versions may be saved only in DRAFT or RETURNED")
        if command.versionId and any(item.version_id == command.versionId for item in record.versions):
            raise RevisionConflict("Artifact version identity already exists")
        version, snapshots = self._build_version(command, record.artifact.artifact_id,
                                                  record.artifact.current_version_number + 1,
                                                  record.artifact.current_version_id)
        lifecycle = StudioLifecycle.DRAFT
        artifact = replace(record.artifact, revision=record.artifact.revision + 1,
                           lifecycle_state=lifecycle, current_version_number=version.version_number,
                           current_version_id=version.version_id, candidate_artifact_id=None,
                           manifold_candidate_node_id=None, updated_at=self.clock())
        updated = replace(record, artifact=artifact, versions=record.versions + (version,),
                          source_snapshots=record.source_snapshots + snapshots)
        return self._persist(updated, command, operation, self._result(updated), command.expectedRevision)

    def create_candidate(self, path_id: str, command: CreateCandidateKnowledgeArtifact) -> StudioCommandResult:
        operation = "CREATE_CANDIDATE"
        replay = self._begin(path_id, command, operation)
        if replay: return replay
        record = self._load(command)
        require_transition(record.artifact.lifecycle_state, StudioLifecycle.CANDIDATE_KNOWLEDGE_ARTIFACT)
        existing = next((c for c in record.candidates if c.artifact_version_id == record.artifact.current_version_id), None)
        warnings = [f"Claim {claim.claim_id} has {claim.lineage_state.value.lower()} lineage"
                    for claim in record.versions[-1].claims
                    if claim.lineage_state in (LineageState.UNRESOLVED, LineageState.ORPHANED)]
        candidate_id = existing.candidate_artifact_id if existing else (command.candidateArtifactId or str(uuid4()))
        candidate = existing or CandidateKnowledgeArtifact(
            candidate_id, record.artifact.artifact_id, record.artifact.current_version_id,
            ReadinessState.READY_WITH_WARNINGS if warnings else ReadinessState.READY,
            tuple(warnings), command.principalId, self.clock())
        artifact = replace(record.artifact, revision=record.artifact.revision + 1,
                           lifecycle_state=StudioLifecycle.CANDIDATE_KNOWLEDGE_ARTIFACT,
                           candidate_artifact_id=candidate_id, updated_at=self.clock())
        updated = replace(record, artifact=artifact,
                          candidates=record.candidates if existing else record.candidates + (candidate,))
        result = self._result(updated, readinessState=candidate.readiness_state.value,
                              warnings=list(candidate.validation_warnings))
        return self._persist(updated, command, operation, result, command.expectedRevision)

    def publish_candidate(self, path_id: str, command: PublishStudioCandidateNode) -> StudioCommandResult:
        operation = "PUBLISH_CANDIDATE"
        replay = self._begin(path_id, command, operation)
        if replay: return replay
        record = self._load(command)
        require_transition(record.artifact.lifecycle_state, StudioLifecycle.MANIFOLD_CANDIDATE_NODE)
        if command.candidateArtifactId != record.artifact.candidate_artifact_id:
            raise InvalidLifecycleTransition("Candidate identity does not match artifact")
        try:
            receipt = self.publication_port.publish_candidate(
                investigation_id=command.investigationId, artifact_id=command.artifactId,
                artifact_version_id=record.artifact.current_version_id,
                candidate_artifact_id=command.candidateArtifactId, principal_id=command.principalId)
        except Exception as exc:
            raise PublicationFailure("Candidate publication failed closed") from exc
        artifact = replace(record.artifact, revision=record.artifact.revision + 1,
                           lifecycle_state=StudioLifecycle.MANIFOLD_CANDIDATE_NODE,
                           manifold_candidate_node_id=receipt.candidate_node_id, updated_at=self.clock())
        updated = replace(record, artifact=artifact,
                          publication_receipts=record.publication_receipts + (receipt.__dict__,))
        return self._persist(updated, command, operation,
                             self._result(updated, receiptId=receipt.receipt_id), command.expectedRevision)

    def submit_for_review(self, path_id: str, command: SubmitStudioForReview) -> StudioCommandResult:
        return self._simple_transition(path_id, command, "SUBMIT_REVIEW", StudioLifecycle.REVIEW_TEST)

    def _simple_transition(self, path_id: str, command: Any, operation: str,
                           target: StudioLifecycle) -> StudioCommandResult:
        replay = self._begin(path_id, command, operation)
        if replay: return replay
        record = self._load(command)
        if command.candidateArtifactId != record.artifact.candidate_artifact_id:
            raise InvalidLifecycleTransition("Candidate identity does not match artifact")
        require_transition(record.artifact.lifecycle_state, target)
        artifact = replace(record.artifact, revision=record.artifact.revision + 1,
                           lifecycle_state=target, updated_at=self.clock())
        updated = replace(record, artifact=artifact)
        return self._persist(updated, command, operation, self._result(updated), command.expectedRevision)

    def accept(self, path_id: str, command: AcceptStudioArtifact) -> StudioCommandResult:
        return self._review(path_id, command, "ACCEPT", ReviewDecisionType.ACCEPT)

    def return_artifact(self, path_id: str, command: ReturnStudioArtifact) -> StudioCommandResult:
        return self._review(path_id, command, "RETURN", ReviewDecisionType.RETURN)

    def reject(self, path_id: str, command: RejectStudioArtifact) -> StudioCommandResult:
        return self._review(path_id, command, "REJECT", ReviewDecisionType.REJECT)

    def _review(self, path_id: str, command: Any, operation: str,
                decision_type: ReviewDecisionType) -> StudioCommandResult:
        replay = self._begin(path_id, command, operation)
        if replay: return replay
        record = self._load(command)
        if record.artifact.lifecycle_state != StudioLifecycle.REVIEW_TEST:
            raise InvalidLifecycleTransition("Review decisions require REVIEW_TEST")
        if command.candidateArtifactId != record.artifact.candidate_artifact_id:
            raise InvalidLifecycleTransition("Candidate identity does not match artifact")
        if command.claimId and command.claimId not in {c.claim_id for c in record.versions[-1].claims}:
            raise InvalidClaimSourceMapping("Reviewed claim does not exist")
        target = {ReviewDecisionType.ACCEPT: StudioLifecycle.ACCEPTED_KNOWLEDGE,
                  ReviewDecisionType.RETURN: StudioLifecycle.RETURNED,
                  ReviewDecisionType.REJECT: StudioLifecycle.REJECTED}[decision_type]
        receipt_data = None
        if command.targetScope == "ARTIFACT" and decision_type == ReviewDecisionType.ACCEPT:
            try:
                receipt = self.accepted_knowledge_port.accept_candidate(
                    investigation_id=command.investigationId, artifact_id=command.artifactId,
                    artifact_version_id=record.artifact.current_version_id,
                    candidate_artifact_id=command.candidateArtifactId, principal_id=command.principalId)
                receipt_data = receipt.__dict__
            except Exception as exc:
                raise AcceptanceFailure("Acceptance failed closed") from exc
        next_revision = record.artifact.revision + 1
        lifecycle = target if command.targetScope == "ARTIFACT" else record.artifact.lifecycle_state
        decision = StudioReviewDecision(
            str(uuid4()), command.artifactId, command.candidateArtifactId,
            ReviewTargetScope(command.targetScope), command.claimId, decision_type,
            command.reason, command.principalId, record.artifact.revision, next_revision, self.clock())
        artifact = replace(record.artifact, revision=next_revision,
                           lifecycle_state=lifecycle, updated_at=self.clock())
        updated = replace(record, artifact=artifact,
                          review_decisions=record.review_decisions + (decision,),
                          acceptance_receipts=record.acceptance_receipts + ((receipt_data,) if receipt_data else ()))
        result = self._result(updated, receiptId=receipt_data["receipt_id"] if receipt_data else None)
        return self._persist(updated, command, operation, result, command.expectedRevision)

    def validate_projection(self, path_id: str, command: ValidateStudioProjection) -> StudioCommandResult:
        operation = "VALIDATE_PROJECTION"
        replay = self._begin(path_id, command, operation)
        if replay: return replay
        record = self._load(command)
        version = next((v for v in record.versions if v.version_id == command.artifactVersionId), None)
        if version is None:
            raise ArtifactNotFound("Artifact version was not found")
        warnings = [f"Claim {c.claim_id} has {c.lineage_state.value.lower()} lineage" for c in version.claims
                    if c.lineage_state in (LineageState.UNRESOLVED, LineageState.ORPHANED)]
        readiness = ReadinessState.NOT_READY if warnings else ReadinessState.READY
        projection_id = command.projectionId or str(uuid4())
        projection = StudioProjectionRecord(
            projection_id, command.artifactId, version.version_id,
            ProjectionFormat(command.projectionFormat), command.citationStyleConfiguration,
            readiness, tuple(warnings), MaterializationState.NOT_MATERIALIZED,
            command.validatorVersion, self.clock())
        artifact = replace(record.artifact, revision=record.artifact.revision + 1, updated_at=self.clock())
        updated = replace(record, artifact=artifact, projections=record.projections + (projection,))
        result = self._result(updated, projectionId=projection_id,
                              readinessState=readiness.value, warnings=warnings)
        return self._persist(updated, command, operation, result, command.expectedRevision)

    def record_materialized_projection(self, path_id: str,
                                       command: RecordMaterializedProjection) -> StudioCommandResult:
        operation = "MATERIALIZE_PROJECTION"
        replay = self._begin(path_id, command, operation)
        if replay: return replay
        record = self._load(command)
        matches = [p for p in record.projections if p.projection_id == command.projectionId]
        if not matches:
            raise ArtifactNotFound("Projection validation was not found")
        projection = matches[-1]
        if projection.readiness_state != ReadinessState.READY:
            raise UnresolvedProjectionReadiness("Projection is not ready for materialization")
        if projection.materialization_state == MaterializationState.MATERIALIZED:
            raise RevisionConflict("Projection is already materialized")
        materialized = replace(
            projection, materialization_state=MaterializationState.MATERIALIZED,
            materializer_version=command.materializerVersion, output_identity=command.outputIdentity,
            output_location=command.outputLocation, output_hash=command.outputHash,
            materialized_at=self.clock())
        projections = tuple(materialized if p.projection_id == projection.projection_id else p
                            for p in record.projections)
        artifact = replace(record.artifact, revision=record.artifact.revision + 1, updated_at=self.clock())
        updated = replace(record, artifact=artifact, projections=projections)
        result = self._result(updated, projectionId=projection.projection_id,
                              readinessState=projection.readiness_state.value)
        return self._persist(updated, command, operation, result, command.expectedRevision)
