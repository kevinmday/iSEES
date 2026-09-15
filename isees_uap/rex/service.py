"""Explicit, single-job REX application execution boundary.

There is deliberately no background dispatcher, poller, provider client, or application
composition in this module.  Calling ``execute_one`` is the only way work starts.
"""

from __future__ import annotations

from dataclasses import dataclass, fields
from datetime import datetime, timedelta
from typing import Any, Callable, Mapping

from .canonical import canonical_bytes, canonical_hash
from .contracts import (AiAssistanceStatus, CandidateEpistemicClassification,
                        CandidateKnowledgeBundleId, CandidateReviewStatus,
                        CanonEffect, CostEstimate, CostReconciliation,
                        CostReconciliationStatus, FrontierAssignmentRevisionId,
                        ManifoldRevisionReference, ModelClass, RexUsageRecord,
                        SearchExecutionId, UsageMeasurement, _text, _time)
from .errors import (CandidateNormalizationFailed, CandidateValidationFailed,
                     ExecutionContextInvalid, ExecutionPersistenceFailed,
                     JobUnavailable, PortResolutionFailed, RexExecutionError,
                     SourceAdapterFailed)
from .fixture import (CandidateKnowledgeBundle, FixtureNormalizationRequest,
                      SourceDocument)


@dataclass(frozen=True, slots=True)
class DurableExecutionContext:
    execution_id: SearchExecutionId
    job_id: str
    assignment_id: str
    assignment_revision_id: FrontierAssignmentRevisionId
    manifold_revision: ManifoldRevisionReference
    source_adapter_identity: str
    source_adapter_version: str
    normalizer_identity: str
    normalizer_version: str
    candidate_bundle_id: CandidateKnowledgeBundleId
    configuration_hash: str
    supplied_by: str
    ai_assistance_status: AiAssistanceStatus
    provider_identity: str
    model_identity: str
    model_class: ModelClass
    estimate: CostEstimate

    def __post_init__(self) -> None:
        for name in ("job_id", "assignment_id", "source_adapter_identity",
                     "source_adapter_version", "normalizer_identity",
                     "normalizer_version", "configuration_hash", "supplied_by",
                     "provider_identity", "model_identity"):
            _text(getattr(self, name), name)


@dataclass(frozen=True, slots=True)
class ExecutionReceipt:
    execution_id: str
    job_id: str
    assignment_id: str
    assignment_revision_id: str
    manifold_revision_id: str
    manifold_revision_hash: str
    source_adapter_identity: str
    source_adapter_version: str
    normalizer_identity: str
    normalizer_version: str
    candidate_bundle_id: str
    candidate_content_hash: str
    source_content_hash: str
    ai_assistance_status: str
    provider_identity: str
    model_identity: str
    estimated_micros: int
    reserved_micros: int
    actual_micros: int
    charged_micros: int
    released_micros: int
    terminal_execution_status: str
    completed_at: datetime
    content_hash: str

    def __post_init__(self) -> None:
        _time(self.completed_at, "completed_at")
        expected = canonical_hash(self.hash_fields())
        if self.content_hash != expected:
            raise ExecutionContextInvalid("Execution receipt hash is invalid")

    def hash_fields(self) -> dict[str, Any]:
        return {field.name: getattr(self, field.name) for field in fields(self)
                if field.name != "content_hash"}

    def canonical_bytes(self) -> bytes:
        return canonical_bytes(self)


@dataclass(frozen=True, slots=True)
class ExecuteDurableJob:
    job_id: str
    claimant_id: str


def _receipt(context: DurableExecutionContext, bundle: CandidateKnowledgeBundle,
             *, reserved_micros: int, actual_micros: int, charged_micros: int,
             released_micros: int, completed_at: datetime) -> ExecutionReceipt:
    values = dict(execution_id=str(context.execution_id), job_id=context.job_id,
        assignment_id=context.assignment_id,
        assignment_revision_id=str(context.assignment_revision_id),
        manifold_revision_id=context.manifold_revision.revision_id,
        manifold_revision_hash=context.manifold_revision.revision_hash,
        source_adapter_identity=context.source_adapter_identity,
        source_adapter_version=context.source_adapter_version,
        normalizer_identity=context.normalizer_identity,
        normalizer_version=context.normalizer_version,
        candidate_bundle_id=str(bundle.bundle_id),
        candidate_content_hash=bundle.content_hash,
        source_content_hash=bundle.source_content_hash,
        ai_assistance_status=bundle.ai_assistance_status.value,
        provider_identity=bundle.provider_identity,
        model_identity=bundle.model_identity,
        estimated_micros=context.estimate.total_micros,
        reserved_micros=reserved_micros, actual_micros=actual_micros,
        charged_micros=charged_micros, released_micros=released_micros,
        terminal_execution_status="COMPLETED", completed_at=completed_at)
    return ExecutionReceipt(**values, content_hash=canonical_hash(values))


class RexExecutionService:
    """Executes exactly one explicitly identified, already-durable REX job."""

    def __init__(self, *, repository: Any, source_adapters: Mapping[str, Any],
                 normalizers: Mapping[str, Any], clock: Callable[[], datetime],
                 id_factory: Callable[[str], str], lease_duration: timedelta = timedelta(minutes=5)):
        self._repository = repository
        self._source_adapters = dict(source_adapters)
        self._normalizers = dict(normalizers)
        self._clock = clock
        self._id_factory = id_factory
        self._lease_duration = lease_duration

    def execute_one(self, command: ExecuteDurableJob) -> ExecutionReceipt:
        _text(command.job_id, "job_id"); _text(command.claimant_id, "claimant_id")
        claimed_at = self._clock()
        try:
            claim = self._repository.claim_job_once(command.job_id,
                claimant_id=command.claimant_id, lease_id=self._id_factory("lease"),
                claimed_at=claimed_at, lease_expires_at=claimed_at + self._lease_duration)
        except JobUnavailable:
            raise
        try:
            context = self._load_and_validate_context(command.job_id)
        except RexExecutionError as error:
            try:
                self._repository.fail_claimed_job(command.job_id,
                    ledger_id=self._id_factory("ledger"), occurred_at=self._clock(),
                    failure_category=error.category)
            except Exception:
                raise ExecutionPersistenceFailed("REX failure persistence failed") from None
            raise error
        if claim.execution_id != str(context.execution_id):
            return self._fail(context, ExecutionContextInvalid())

        try:
            adapter = self._resolve(self._source_adapters, context.source_adapter_identity,
                                    context.source_adapter_version, "adapter_identity",
                                    "adapter_version")
            normalizer = self._resolve(self._normalizers, context.normalizer_identity,
                                       context.normalizer_version, "normalizer_identity",
                                       "normalizer_version")
            try:
                document = adapter.retrieve(context)
            except Exception:
                raise SourceAdapterFailed("Source adapter failed") from None
            self._validate_source(document, context, adapter)
            request = FixtureNormalizationRequest(document, context.candidate_bundle_id,
                context.assignment_revision_id, context.manifold_revision,
                context.execution_id, context.configuration_hash, context.supplied_by)
            try:
                bundle = normalizer.normalize(request)
            except Exception:
                raise CandidateNormalizationFailed("Candidate normalization failed") from None
            self._validate_bundle(bundle, context)
            completed_at = self._clock()
            actual = 0
            reserved = self._repository.reserved_micros(context.execution_id)
            charged = min(actual, reserved)
            released = reserved - charged
            usage = self._usage(context, reserved, actual, charged, released, completed_at,
                                len(document.deterministic_bytes()), len(canonical_bytes(bundle)))
            receipt = _receipt(context, bundle, reserved_micros=reserved,
                actual_micros=actual, charged_micros=charged,
                released_micros=released, completed_at=completed_at)
            self._repository.finalize_execution_success(bundle=bundle, usage=usage,
                ledger_id=self._id_factory("ledger"), receipt=receipt,
                completed_at=completed_at)
            return receipt
        except RexExecutionError as error:
            return self._fail(context, error)
        except Exception:
            return self._fail(context, ExecutionPersistenceFailed())

    def reconstruct_receipt(self, execution_id: SearchExecutionId) -> ExecutionReceipt:
        return self._repository.reconstruct_execution_receipt(execution_id)

    def _load_and_validate_context(self, job_id: str) -> DurableExecutionContext:
        try:
            context = self._repository.get_job_execution_context(job_id, DurableExecutionContext)
        except JobUnavailable:
            raise
        except Exception:
            raise ExecutionContextInvalid("Durable execution context is invalid") from None
        if context.job_id != job_id:
            raise ExecutionContextInvalid("Durable job binding is invalid")
        return context

    @staticmethod
    def _resolve(mapping: Mapping[str, Any], identity: str, version: str,
                 identity_field: str, version_field: str) -> Any:
        port = mapping.get(identity)
        if port is None or getattr(port, identity_field, None) != identity or getattr(port, version_field, None) != version:
            raise PortResolutionFailed("Governed execution port is unavailable")
        return port

    @staticmethod
    def _validate_source(document: Any, context: DurableExecutionContext, adapter: Any) -> None:
        if not isinstance(document, SourceDocument):
            raise CandidateValidationFailed("Source document is invalid")
        if document.content_hash != canonical_hash(document.content_fields()):
            raise CandidateValidationFailed("Source document hash is invalid")
        if document.source_class not in (adapter.source_class,):
            raise CandidateValidationFailed("Source adapter binding is invalid")

    @staticmethod
    def _validate_bundle(bundle: Any, context: DurableExecutionContext) -> None:
        if not isinstance(bundle, CandidateKnowledgeBundle):
            raise CandidateValidationFailed("Candidate bundle is invalid")
        valid = (bundle.bundle_id == context.candidate_bundle_id and
            bundle.execution_id == context.execution_id and
            bundle.assignment_revision_id == context.assignment_revision_id and
            bundle.manifold_revision == context.manifold_revision and
            bundle.adapter_identity == context.source_adapter_identity and
            bundle.adapter_version == context.source_adapter_version and
            bundle.normalizer_identity == context.normalizer_identity and
            bundle.normalizer_version == context.normalizer_version and
            bundle.configuration_hash == context.configuration_hash and
            bundle.ai_assistance_status == context.ai_assistance_status and
            bundle.provider_identity == context.provider_identity and
            bundle.model_identity == context.model_identity and
            bundle.model_class == context.model_class and
            bundle.content_hash == canonical_hash(bundle.hash_fields()) and
            all(c.epistemic_classification is CandidateEpistemicClassification.CANDIDATE_KNOWLEDGE
                and c.review_status is CandidateReviewStatus.RESEARCHER_REVIEW_REQUIRED
                and c.canon_effect is CanonEffect.NONE for c in bundle.candidates))
        if not valid:
            raise CandidateValidationFailed("Candidate bundle binding is invalid")

    @staticmethod
    def _usage(context: DurableExecutionContext, reserved: int, actual: int,
               charged: int, released: int, at: datetime, retrieved: int,
               stored: int) -> RexUsageRecord:
        measurement = UsageMeasurement(0, 0, 1, retrieved, stored, retrieved, 0, actual)
        reconciliation = CostReconciliation(context.execution_id,
            context.estimate.total_micros, reserved, actual, charged, released,
            CostReconciliationStatus.RECONCILED, at)
        return RexUsageRecord(context.execution_id, context.estimate, measurement, reconciliation)

    def _fail(self, context: DurableExecutionContext, error: RexExecutionError):
        try:
            self._repository.finalize_execution_failure(context.execution_id,
                ledger_id=self._id_factory("ledger"), estimate=context.estimate,
                occurred_at=self._clock(), failure_category=error.category)
        except Exception:
            if isinstance(error, ExecutionPersistenceFailed):
                raise error
            raise ExecutionPersistenceFailed("REX failure persistence failed") from None
        raise error
