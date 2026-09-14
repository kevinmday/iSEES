from __future__ import annotations

from dataclasses import dataclass
from datetime import datetime
from enum import Enum
from typing import Any

from .canonical import canonical_hash
from .errors import RexContractError


def _text(value: str, name: str) -> None:
    if type(value) is not str or not value.strip() or value != value.strip():
        raise RexContractError(f"{name} must be non-empty, trimmed text")


def _time(value: datetime, name: str) -> None:
    if not isinstance(value, datetime) or value.tzinfo is None or value.utcoffset() is None:
        raise RexContractError(f"{name} must be timezone-aware")


def _micros(value: int, name: str) -> None:
    if type(value) is not int or value < 0:
        raise RexContractError(f"{name} must be non-negative integer micros")


@dataclass(frozen=True, slots=True)
class _Identity:
    value: str
    def __post_init__(self) -> None: _text(self.value, type(self).__name__)
    def __str__(self) -> str: return self.value


class FrontierAssignmentId(_Identity): pass
class FrontierAssignmentRevisionId(_Identity): pass
class EligibilityEventId(_Identity): pass
class EntitlementSnapshotId(_Identity): pass
class AuthorizationDecisionId(_Identity): pass
class SearchExecutionId(_Identity): pass
class CandidateKnowledgeBundleId(_Identity): pass


class TargetKind(str, Enum):
    NODE="NODE"; EDGE="EDGE"; CLUSTER="CLUSTER"; INVESTIGATION="INVESTIGATION"; RESEARCH_VECTOR="RESEARCH_VECTOR"
class Lifecycle(str, Enum):
    SLEEPING="SLEEPING"; ELIGIBLE="ELIGIBLE"; EXECUTING="EXECUTING"; SUSPENDED="SUSPENDED"; EXPIRED="EXPIRED"; REVOKED="REVOKED"; BUDGET_EXHAUSTED="BUDGET_EXHAUSTED"
class TriggerKind(str, Enum):
    MANIFOLD_CREATED="MANIFOLD_CREATED"; MANIFOLD_REVISED="MANIFOLD_REVISED"; RESOLVE_COMPLETED="RESOLVE_COMPLETED"; SOURCE_CURSOR_CHANGED="SOURCE_CURSOR_CHANGED"; FRESHNESS_EXPIRED="FRESHNESS_EXPIRED"; CONNECTING_DISCOVERY="CONNECTING_DISCOVERY"; RESEARCHER_REQUEST="RESEARCHER_REQUEST"; SCHEDULED_REFRESH="SCHEDULED_REFRESH"; CANON_CONTEXT_CHANGED="CANON_CONTEXT_CHANGED"; CANDIDATE_CONTEXT_CHANGED="CANDIDATE_CONTEXT_CHANGED"
class SourceClass(str, Enum): LOCAL_FIXTURE="LOCAL_FIXTURE"; PUBLIC="PUBLIC"; PREMIUM="PREMIUM"; PRIVATE="PRIVATE"
class ModelClass(str, Enum): NONE="NONE"; LANGUAGE="LANGUAGE"; EMBEDDING="EMBEDDING"
class AiAssistanceStatus(str, Enum): NONE="NONE"; ASSISTED="ASSISTED"
class AuthorizationDisposition(str, Enum): ALLOW="ALLOW"; DENY="DENY"
class DenialReason(str, Enum):
    NONE="NONE"; INVALID_LIFECYCLE="INVALID_LIFECYCLE"; ENTITLEMENT_SUSPENDED="ENTITLEMENT_SUSPENDED"; ENTITLEMENT_EXPIRED="ENTITLEMENT_EXPIRED"; EXTERNAL_EXECUTION_NOT_ALLOWED="EXTERNAL_EXECUTION_NOT_ALLOWED"; AI_NOT_ALLOWED="AI_NOT_ALLOWED"; SOURCE_NOT_ALLOWED="SOURCE_NOT_ALLOWED"; MODEL_NOT_ALLOWED="MODEL_NOT_ALLOWED"; RECURSION_DEPTH_EXCEEDED="RECURSION_DEPTH_EXCEEDED"; COST_LIMIT_EXCEEDED="COST_LIMIT_EXCEEDED"; BUDGET_EXCEEDED="BUDGET_EXCEEDED"; CIRCUIT_BREAKER_OPEN="CIRCUIT_BREAKER_OPEN"; DUPLICATE="DUPLICATE"; UTILITY_BELOW_THRESHOLD="UTILITY_BELOW_THRESHOLD"
class CandidateEpistemicClassification(str, Enum): CANDIDATE_KNOWLEDGE="CANDIDATE_KNOWLEDGE"
class CandidateReviewStatus(str, Enum): RESEARCHER_REVIEW_REQUIRED="RESEARCHER_REVIEW_REQUIRED"
class CanonEffect(str, Enum): NONE="NONE"
class SuspensionReason(str, Enum): ENTITLEMENT="ENTITLEMENT"; BUDGET="BUDGET"; POLICY="POLICY"; RESEARCHER="RESEARCHER"; CIRCUIT_BREAKER="CIRCUIT_BREAKER"
class CostReconciliationStatus(str, Enum): PENDING="PENDING"; RECONCILED="RECONCILED"
class BudgetScopeKind(str, Enum): EXECUTION="EXECUTION"; USER="USER"; INVESTIGATION="INVESTIGATION"; AGENT="AGENT"; SOURCE="SOURCE"; GLOBAL="GLOBAL"


@dataclass(frozen=True, slots=True)
class ManifoldRevisionReference:
    investigation_id: str; revision_id: str; revision_hash: str; ontology_version: str; configuration_hash: str
    def __post_init__(self):
        for name in ("investigation_id","revision_id","revision_hash","ontology_version","configuration_hash"): _text(getattr(self,name), name)


@dataclass(frozen=True, slots=True)
class TriggerPolicy:
    allowed_kinds: tuple[TriggerKind, ...]; coalescing_version: str
    def __post_init__(self):
        if not self.allowed_kinds: raise RexContractError("trigger policy requires an allowed kind")
        _text(self.coalescing_version, "coalescing_version")

@dataclass(frozen=True, slots=True)
class FreshnessPolicy:
    policy_version: str; freshness_bucket: str
    def __post_init__(self): _text(self.policy_version,"policy_version"); _text(self.freshness_bucket,"freshness_bucket")
@dataclass(frozen=True, slots=True)
class SourcePolicy:
    allowed_source_classes: tuple[SourceClass,...]; policy_version: str
    def __post_init__(self):
        if not self.allowed_source_classes: raise RexContractError("source policy cannot be empty")
        _text(self.policy_version,"policy_version")
@dataclass(frozen=True, slots=True)
class ExecutionCeilings:
    maximum_requests: int; maximum_bytes: int; maximum_tokens: int; maximum_cost_micros: int; maximum_recursion_depth: int
    def __post_init__(self):
        for name in ("maximum_requests","maximum_bytes","maximum_tokens","maximum_recursion_depth"):
            if type(getattr(self,name)) is not int or getattr(self,name) < 0: raise RexContractError(f"{name} must be a non-negative integer")
        _micros(self.maximum_cost_micros,"maximum_cost_micros")


@dataclass(frozen=True, slots=True)
class FrontierAssignmentRevision:
    assignment_id: FrontierAssignmentId; revision_id: FrontierAssignmentRevisionId; revision_number: int; parent_revision_id: FrontierAssignmentRevisionId|None
    owner_subject_id: str; governing_subject_id: str; investigation_id: str; target_id: str; target_kind: TargetKind
    research_objective: str; scope: tuple[str,...]; exclusions: tuple[str,...]; lifecycle: Lifecycle
    trigger_policy: TriggerPolicy; freshness_policy: FreshnessPolicy; source_policy: SourcePolicy
    privacy_policy_reference: str; risk_policy_reference: str; entitlement_snapshot_id: EntitlementSnapshotId
    execution_ceilings: ExecutionCeilings; source_cursor_state: tuple[tuple[str,str],...]
    created_at: datetime; effective_at: datetime; created_by: str; transition_reason: str; suspension_reason: SuspensionReason|None
    content_hash: str
    def __post_init__(self):
        if type(self.revision_number) is not int or self.revision_number < 1: raise RexContractError("revision_number must be positive")
        for name in ("owner_subject_id","governing_subject_id","investigation_id","target_id","research_objective","privacy_policy_reference","risk_policy_reference","created_by","transition_reason"): _text(getattr(self,name),name)
        _time(self.created_at,"created_at"); _time(self.effective_at,"effective_at")
        if self.content_hash != canonical_hash(self.hash_fields()): raise RexContractError("assignment content_hash mismatch")
    def hash_fields(self) -> dict[str,Any]: return {name:getattr(self,name) for name in self.__dataclass_fields__ if name != "content_hash"}


def create_assignment(**values: Any) -> FrontierAssignmentRevision:
    values.update(lifecycle=Lifecycle.SLEEPING, parent_revision_id=None, revision_number=1,
                  suspension_reason=None, transition_reason="ASSIGNMENT_CREATED")
    return FrontierAssignmentRevision(**values, content_hash=canonical_hash(values))


@dataclass(frozen=True, slots=True)
class EligibilityEvent:
    event_id: EligibilityEventId; assignment_id: FrontierAssignmentId; assignment_revision_id: FrontierAssignmentRevisionId
    manifold_revision: ManifoldRevisionReference; trigger_kind: TriggerKind; normalized_trigger_identity: str
    observed_cursor: str; coalescing_key: str; occurred_at: datetime; actor_id: str
    def __post_init__(self):
        for name in ("normalized_trigger_identity","observed_cursor","coalescing_key","actor_id"): _text(getattr(self,name),name)
        _time(self.occurred_at,"occurred_at")


def semantic_duplicate_key(*, assignment_revision_id: FrontierAssignmentRevisionId,
                           manifold_revision: ManifoldRevisionReference, normalized_trigger_identity: str,
                           source_adapter_identity: str, source_adapter_version: str,
                           normalizer_identity: str, normalizer_version: str,
                           entitlement_policy_version: str, source_cursor: str,
                           freshness_bucket: str) -> str:
    return canonical_hash({"schemaVersion":"rex-semantic-duplicate/v1","assignmentRevisionId":assignment_revision_id,
        "manifoldRevision":manifold_revision,"normalizedTriggerIdentity":normalized_trigger_identity,
        "sourceAdapterIdentity":source_adapter_identity,"sourceAdapterVersion":source_adapter_version,
        "normalizerIdentity":normalizer_identity,"normalizerVersion":normalizer_version,
        "entitlementPolicyVersion":entitlement_policy_version,"sourceCursor":source_cursor,
        "freshnessBucket":freshness_bucket})


@dataclass(frozen=True, slots=True)
class EntitlementSnapshot:
    snapshot_id: EntitlementSnapshotId; subject_id: str; scope: tuple[str,...]
    persistent_assignments_allowed: bool; external_execution_allowed: bool; ai_assistance_allowed: bool; premium_sources_allowed: bool
    maximum_active_assignments: int; maximum_executions_per_period: int; period_seconds: int
    maximum_cost_per_execution_micros: int; maximum_cost_per_period_micros: int; maximum_recursion_depth: int
    allowed_source_classes: tuple[SourceClass,...]; allowed_model_classes: tuple[ModelClass,...]
    valid_from: datetime; valid_until: datetime; policy_version: str; suspended: bool; suspension_reason: SuspensionReason|None
    issued_at: datetime; content_hash: str
    def __post_init__(self):
        _text(self.subject_id,"subject_id"); _text(self.policy_version,"policy_version")
        for name in ("maximum_active_assignments","maximum_executions_per_period","period_seconds","maximum_recursion_depth"):
            if type(getattr(self,name)) is not int or getattr(self,name) < 0: raise RexContractError(f"{name} must be a non-negative integer")
        _micros(self.maximum_cost_per_execution_micros,"maximum_cost_per_execution_micros"); _micros(self.maximum_cost_per_period_micros,"maximum_cost_per_period_micros")
        for name in ("valid_from","valid_until","issued_at"): _time(getattr(self,name),name)
        if self.valid_until <= self.valid_from: raise RexContractError("entitlement validity interval is invalid")
        if self.suspended != (self.suspension_reason is not None): raise RexContractError("suspension state and reason must agree")
        if self.content_hash != canonical_hash(self.hash_fields()): raise RexContractError("entitlement content_hash mismatch")
    def hash_fields(self): return {name:getattr(self,name) for name in self.__dataclass_fields__ if name != "content_hash"}


@dataclass(frozen=True, slots=True)
class CostEstimate:
    compute_micros:int; ai_micros:int; source_micros:int; storage_micros:int; network_micros:int; total_micros:int; estimator_version:str
    def __post_init__(self):
        for name in ("compute_micros","ai_micros","source_micros","storage_micros","network_micros","total_micros"): _micros(getattr(self,name),name)
        if self.total_micros != self.compute_micros+self.ai_micros+self.source_micros+self.storage_micros+self.network_micros: raise RexContractError("estimated total does not equal components")
        _text(self.estimator_version,"estimator_version")
@dataclass(frozen=True, slots=True)
class BudgetScope:
    kind: BudgetScopeKind; identity: str
    def __post_init__(self): _text(self.identity,"identity")
@dataclass(frozen=True, slots=True)
class BudgetSnapshot:
    scope: BudgetScope; limit_micros:int; consumed_micros:int; reserved_micros:int; period_identity:str
    def __post_init__(self):
        for n in ("limit_micros","consumed_micros","reserved_micros"): _micros(getattr(self,n),n)
        _text(self.period_identity,"period_identity")
@dataclass(frozen=True, slots=True)
class CircuitBreakerSnapshot:
    scope: BudgetScope; open: bool; reason: SuspensionReason|None; policy_version: str
    def __post_init__(self):
        if type(self.open) is not bool or self.open != (self.reason is not None): raise RexContractError("breaker state and reason must agree")
        _text(self.policy_version,"policy_version")
@dataclass(frozen=True, slots=True)
class UsageMeasurement:
    input_tokens:int; output_tokens:int; requests:int; bytes_retrieved:int; bytes_stored:int; bytes_transferred:int; compute_duration_micros:int
    actual_cost_micros:int
    def __post_init__(self):
        for n in self.__dataclass_fields__:
            if type(getattr(self,n)) is not int or getattr(self,n)<0: raise RexContractError(f"{n} must be a non-negative integer")
@dataclass(frozen=True, slots=True)
class CostReconciliation:
    execution_id:SearchExecutionId; estimated_micros:int; reserved_micros:int; actual_micros:int|None; charged_micros:int; released_micros:int; status:CostReconciliationStatus; reconciled_at:datetime
    def __post_init__(self):
        for n in ("estimated_micros","reserved_micros","charged_micros","released_micros"): _micros(getattr(self,n),n)
        if self.actual_micros is not None: _micros(self.actual_micros,"actual_micros")
        if (self.status is CostReconciliationStatus.PENDING) != (self.actual_micros is None): raise RexContractError("reconciliation status and actual cost must agree")
        _time(self.reconciled_at,"reconciled_at")
@dataclass(frozen=True, slots=True)
class RexUsageRecord:
    execution_id:SearchExecutionId; estimate:CostEstimate; measurement:UsageMeasurement; reconciliation:CostReconciliation
