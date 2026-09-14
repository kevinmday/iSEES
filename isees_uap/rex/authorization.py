from __future__ import annotations

from dataclasses import dataclass
from datetime import datetime

from .canonical import canonical_hash
from .contracts import (AuthorizationDecisionId, AuthorizationDisposition,
                        BudgetSnapshot, CircuitBreakerSnapshot, CostEstimate,
                        DenialReason, EntitlementSnapshot, FrontierAssignmentRevision,
                        Lifecycle, ModelClass, SourceClass, _text, _time)


@dataclass(frozen=True, slots=True)
class ExplorationProposal:
    source_class: SourceClass; model_class: ModelClass; recursion_depth: int
    information_gain_units: int; bridge_value_units: int; freshness_value_units: int; risk_units: int
    duplicate: bool
    def __post_init__(self):
        for name in ("recursion_depth","information_gain_units","bridge_value_units","freshness_value_units","risk_units"):
            if type(getattr(self,name)) is not int or getattr(self,name)<0: raise ValueError(f"{name} must be a non-negative integer")
        if type(self.duplicate) is not bool: raise ValueError("duplicate must be boolean")

@dataclass(frozen=True, slots=True)
class ExecutionAuthorizationContext:
    assignment: FrontierAssignmentRevision; entitlement: EntitlementSnapshot; proposal: ExplorationProposal
    estimate: CostEstimate; budgets: tuple[BudgetSnapshot,...]; circuit_breakers: tuple[CircuitBreakerSnapshot,...]
    evaluated_at: datetime; policy_version: str; utility_threshold_units: int

@dataclass(frozen=True, slots=True)
class AuthorizationDecision:
    decision_id: AuthorizationDecisionId; disposition: AuthorizationDisposition
    denial_reason: DenialReason; policy_version: str; utility_units: int
    utility_threshold_units: int; evaluated_at: datetime; input_hash: str; content_hash: str


def authorize(context: ExecutionAuthorizationContext, *, decision_id: AuthorizationDecisionId) -> AuthorizationDecision:
    _time(context.evaluated_at,"evaluated_at"); _text(context.policy_version,"policy_version")
    proposal, entitlement = context.proposal, context.entitlement
    utility = proposal.information_gain_units + proposal.bridge_value_units + proposal.freshness_value_units - proposal.risk_units - context.estimate.total_micros
    reason = DenialReason.NONE
    if context.assignment.lifecycle is not Lifecycle.ELIGIBLE: reason=DenialReason.INVALID_LIFECYCLE
    elif entitlement.suspended: reason=DenialReason.ENTITLEMENT_SUSPENDED
    elif not (entitlement.valid_from <= context.evaluated_at < entitlement.valid_until): reason=DenialReason.ENTITLEMENT_EXPIRED
    elif proposal.source_class is not SourceClass.LOCAL_FIXTURE and not entitlement.external_execution_allowed: reason=DenialReason.EXTERNAL_EXECUTION_NOT_ALLOWED
    elif proposal.model_class is not ModelClass.NONE and not entitlement.ai_assistance_allowed: reason=DenialReason.AI_NOT_ALLOWED
    elif proposal.source_class not in entitlement.allowed_source_classes: reason=DenialReason.SOURCE_NOT_ALLOWED
    elif proposal.model_class not in entitlement.allowed_model_classes: reason=DenialReason.MODEL_NOT_ALLOWED
    elif proposal.recursion_depth > entitlement.maximum_recursion_depth: reason=DenialReason.RECURSION_DEPTH_EXCEEDED
    elif context.estimate.total_micros > entitlement.maximum_cost_per_execution_micros: reason=DenialReason.COST_LIMIT_EXCEEDED
    elif any(b.consumed_micros+b.reserved_micros+context.estimate.total_micros>b.limit_micros for b in context.budgets): reason=DenialReason.BUDGET_EXCEEDED
    elif any(b.open for b in context.circuit_breakers): reason=DenialReason.CIRCUIT_BREAKER_OPEN
    elif proposal.duplicate: reason=DenialReason.DUPLICATE
    elif utility < context.utility_threshold_units: reason=DenialReason.UTILITY_BELOW_THRESHOLD
    disposition = AuthorizationDisposition.ALLOW if reason is DenialReason.NONE else AuthorizationDisposition.DENY
    input_hash = canonical_hash(context)
    values = dict(decision_id=decision_id,disposition=disposition,denial_reason=reason,
                  policy_version=context.policy_version,utility_units=utility,
                  utility_threshold_units=context.utility_threshold_units,
                  evaluated_at=context.evaluated_at,input_hash=input_hash)
    return AuthorizationDecision(**values,content_hash=canonical_hash(values))
