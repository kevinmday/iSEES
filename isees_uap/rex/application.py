from __future__ import annotations

import threading
from dataclasses import asdict
from datetime import datetime, timedelta, timezone
from typing import Callable

from .authorization import ExecutionAuthorizationContext, ExplorationProposal, authorize
from .canonical import canonical_hash
from .contracts import *
from .cost import ZeroCostEstimator
from .entitlement import DevelopmentFixtureEntitlementProvider
from .errors import DuplicateSuppressed, RecordNotFound
from .fixture import FixtureCandidateNormalizer, LocalFixtureSourceAdapter
from .lifecycle import transition_assignment
from .models import AuthorizedExecutionRequest, ExecutionDisposition, ReservationRequest
from .service import DurableExecutionContext, ExecuteDurableJob, RexExecutionService


class RexApiApplicationService:
    """Authenticated caller-facing orchestration for the local-fixture slice."""

    def __init__(self, repository, *, clock: Callable[[], datetime] | None = None,
                 adapter=None, normalizer=None):
        self.repository = repository
        self.clock = clock or (lambda: datetime.now(timezone.utc))
        self.adapter = adapter or LocalFixtureSourceAdapter()
        self.normalizer = normalizer or FixtureCandidateNormalizer()
        self._commands = threading.RLock()

    @staticmethod
    def _identity(prefix: str, value) -> str:
        return f"{prefix}_{canonical_hash(value).removeprefix('sha256:')}"

    def assignment(self, *, subject_id: str, investigation_id: str, target_id: str,
                   target_kind: TargetKind, objective: str):
        key = {"subject": subject_id, "investigation": investigation_id,
               "target": target_id, "kind": target_kind.value}
        assignment_id = FrontierAssignmentId(self._identity("rxa", key))
        with self._commands:
            try:
                existing = self.repository.get_assignment(assignment_id)
                if existing.owner_subject_id != subject_id or existing.investigation_id != investigation_id:
                    raise RecordNotFound("REX assignment was not found")
                return existing, True
            except RecordNotFound:
                pass
            now = self.clock()
            entitlement_id = EntitlementSnapshotId(self._identity("rxe", key))
            revision_id = FrontierAssignmentRevisionId(self._identity("rxar", key | {"revision": 1}))
            value = create_assignment(assignment_id=assignment_id, revision_id=revision_id,
                owner_subject_id=subject_id, governing_subject_id=subject_id,
                investigation_id=investigation_id, target_id=target_id, target_kind=target_kind,
                research_objective=objective, scope=(target_id,), exclusions=("external-sources",),
                trigger_policy=TriggerPolicy((TriggerKind.RESEARCHER_REQUEST,), "rex-api-coalescing/v1"),
                freshness_policy=FreshnessPolicy("rex-api-freshness/v1", "local-fixture/v1"),
                source_policy=SourcePolicy((SourceClass.LOCAL_FIXTURE,), "rex-local-fixture/v1"),
                privacy_policy_reference="rex-local-fixture-privacy/v1",
                risk_policy_reference="rex-local-fixture-risk/v1", entitlement_snapshot_id=entitlement_id,
                execution_ceilings=ExecutionCeilings(1, 4096, 0, 0, 1),
                source_cursor_state=(("local-fixture", "v1"),), created_at=now,
                effective_at=now, created_by=subject_id)
            self.repository.create_assignment(value)
            return value, False

    def prepare(self, *, subject_id: str, investigation_id: str, assignment_id: str,
                manifold_revision_id: str, manifold_revision_hash: str):
        with self._commands:
            current = self.repository.get_assignment(assignment_id)
            self._owned(current, subject_id, investigation_id)
            prior = self.repository.find_execution_for_assignment_context(
                assignment_id, manifold_revision_id, manifold_revision_hash)
            if prior is not None:
                return prior, "SUPPRESSED_DUPLICATE"
            manifold = ManifoldRevisionReference(investigation_id, manifold_revision_id,
                manifold_revision_hash, "isees-operational/v1", canonical_hash({"fixture": "v1"}))
            duplicate_key = semantic_duplicate_key(assignment_revision_id=current.revision_id,
                manifold_revision=manifold, normalized_trigger_identity="researcher-request:local-fixture",
                source_adapter_identity=self.adapter.adapter_identity,
                source_adapter_version=self.adapter.adapter_version,
                normalizer_identity=self.normalizer.normalizer_identity,
                normalizer_version=self.normalizer.normalizer_version,
                entitlement_policy_version="rex-development-fixture/v1", source_cursor="v1",
                freshness_bucket="local-fixture/v1")
            existing = self.repository.find_execution_by_semantic_key(duplicate_key)
            if existing is not None:
                return existing, "SUPPRESSED_DUPLICATE"
            now = self.clock()
            eligible = transition_assignment(current,
                revision_id=FrontierAssignmentRevisionId(self._identity("rxar", {"previous": str(current.revision_id), "state": "ELIGIBLE"})),
                target=Lifecycle.ELIGIBLE, effective_at=now, actor_id=subject_id,
                reason="explicit local-fixture request")
            self.repository.append_assignment_revision(eligible)
            event = EligibilityEvent(EligibilityEventId(self._identity("rxev", {"assignment": assignment_id, "revision": str(eligible.revision_id)})),
                eligible.assignment_id, eligible.revision_id, manifold, TriggerKind.RESEARCHER_REQUEST,
                "researcher-request:local-fixture", "v1", self._identity("rxco", duplicate_key), now, subject_id)
            self.repository.append_eligibility_event(event)
            entitlement = DevelopmentFixtureEntitlementProvider(snapshot_id=eligible.entitlement_snapshot_id,
                valid_from=now-timedelta(seconds=1), valid_until=now+timedelta(days=3650), issued_at=now
            ).snapshot(subject_id=subject_id, at=now)
            proposal = ExplorationProposal(SourceClass.LOCAL_FIXTURE, ModelClass.NONE, 1, 1, 0, 0, 0, False)
            estimate = ZeroCostEstimator().estimate(proposal)
            decision = authorize(ExecutionAuthorizationContext(eligible, entitlement, proposal, estimate,
                (), (), now, "rex-api-authorization/v1", 0),
                decision_id=AuthorizationDecisionId(self._identity("rxad", {"event": str(event.event_id)})))
            self.repository.append_authorization_decision(decision,
                assignment_revision_id=eligible.revision_id, eligibility_event_id=event.event_id,
                entitlement_snapshot_id=entitlement.snapshot_id,
                entitlement_snapshot_hash=entitlement.content_hash, manifold_revision=manifold)
            execution_id = SearchExecutionId(self._identity("rxx", duplicate_key))
            job_id = self._identity("rxj", str(execution_id))
            bundle_id = CandidateKnowledgeBundleId(self._identity("rxb", str(execution_id)))
            context = DurableExecutionContext(execution_id, job_id, assignment_id, eligible.revision_id,
                manifold, self.adapter.adapter_identity, self.adapter.adapter_version,
                self.normalizer.normalizer_identity, self.normalizer.normalizer_version, bundle_id,
                canonical_hash({"composition": "local-fixture/v1"}), subject_id,
                AiAssistanceStatus.NONE, "NONE", "NONE", ModelClass.NONE, estimate)
            executing = transition_assignment(eligible,
                revision_id=FrontierAssignmentRevisionId(self._identity("rxar", {"previous": str(eligible.revision_id), "state": "EXECUTING"})),
                target=Lifecycle.EXECUTING, effective_at=now, actor_id=subject_id,
                reason="authorized explicit execution")
            reservations = tuple(ReservationRequest(self._identity("rxr", {"execution": str(execution_id), "scope": kind.value}),
                BudgetScope(kind, subject_id if kind is BudgetScopeKind.USER else investigation_id if kind is BudgetScopeKind.INVESTIGATION else assignment_id),
                0, 0, 0, "local-fixture/v1") for kind in BudgetScopeKind)
            request = AuthorizedExecutionRequest(execution_id, job_id, str(event.event_id), decision.decision_id,
                duplicate_key, estimate, reservations, (), context, executing, now, now)
            try:
                return self.repository.reserve_authorized_execution_atomically(request), "EXECUTABLE"
            except DuplicateSuppressed as error:
                return self.repository.get_execution(error.suppressed_execution_id), "SUPPRESSED_DUPLICATE"

    def execute(self, *, subject_id: str, investigation_id: str, job_id: str):
        context = self.repository.get_job_execution_context(job_id, DurableExecutionContext)
        self._context_owned(context, subject_id, investigation_id)
        service = RexExecutionService(repository=self.repository,
            source_adapters={self.adapter.adapter_identity: self.adapter},
            normalizers={self.normalizer.normalizer_identity: self.normalizer}, clock=self.clock,
            id_factory=lambda prefix: self._identity(f"rx{prefix}", {"job": job_id, "at": self.clock()}))
        return service.execute_one(ExecuteDurableJob(job_id, subject_id))

    def receipt(self, *, subject_id: str, investigation_id: str, execution_id: str):
        context = self.repository.get_execution_context(execution_id, DurableExecutionContext)
        self._context_owned(context, subject_id, investigation_id)
        return self.repository.reconstruct_execution_receipt(SearchExecutionId(execution_id))

    def bundle(self, *, subject_id: str, investigation_id: str, bundle_id: str):
        value = self.repository.get_candidate_bundle(CandidateKnowledgeBundleId(bundle_id))
        if value.manifold_revision.investigation_id != investigation_id:
            raise RecordNotFound("REX candidate bundle was not found")
        assignment = self.repository.get_assignment_revision(value.assignment_revision_id)
        self._owned(assignment, subject_id, investigation_id)
        return value

    def completed_discoveries(self, *, subject_id: str, investigation_id: str):
        """Read completed durable bundles without scheduling or executing work."""
        discoveries = []
        for bundle_id in self.repository.list_completed_candidate_bundle_ids(
                investigation_id, subject_id):
            bundle = self.bundle(subject_id=subject_id,
                investigation_id=investigation_id, bundle_id=bundle_id)
            assignment = self.repository.get_assignment_revision(bundle.assignment_revision_id)
            receipt = self.receipt(subject_id=subject_id,
                investigation_id=investigation_id, execution_id=str(bundle.execution_id))
            discoveries.append((assignment, receipt, bundle))
        return tuple(discoveries)

    @staticmethod
    def _owned(value, subject_id, investigation_id):
        if value.owner_subject_id != subject_id or value.investigation_id != investigation_id:
            raise RecordNotFound("REX resource was not found")

    def _context_owned(self, context, subject_id, investigation_id):
        if context.manifold_revision.investigation_id != investigation_id:
            raise RecordNotFound("REX resource was not found")
        self._owned(self.repository.get_assignment_revision(context.assignment_revision_id), subject_id, investigation_id)
