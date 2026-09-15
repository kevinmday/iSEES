from __future__ import annotations

from dataclasses import dataclass
from datetime import datetime
from enum import Enum
from typing import Any

from .contracts import (AuthorizationDecisionId, BudgetScope, CandidateKnowledgeBundleId,
                        CostEstimate, FrontierAssignmentRevisionId, SearchExecutionId)


class ExecutionDisposition(str, Enum):
    EXECUTABLE = "EXECUTABLE"
    SUPPRESSED_DUPLICATE = "SUPPRESSED_DUPLICATE"

class ExecutionStatus(str, Enum):
    QUEUED = "QUEUED"
    CLAIMED = "CLAIMED"
    COMPLETED = "COMPLETED"
    FAILED = "FAILED"
    SUPPRESSED = "SUPPRESSED"

@dataclass(frozen=True, slots=True)
class ReservationRequest:
    reservation_id: str
    scope: BudgetScope
    limit_micros: int
    consumed_micros: int
    reserved_micros: int
    period_identity: str

@dataclass(frozen=True, slots=True)
class AuthorizedExecutionRequest:
    execution_id: SearchExecutionId
    job_id: str
    eligibility_event_id: str
    authorization_decision_id: AuthorizationDecisionId
    semantic_duplicate_key: str
    estimate: CostEstimate
    reservations: tuple[ReservationRequest, ...]
    circuit_breakers: tuple[Any, ...]
    execution_context: Any
    executing_revision: Any
    created_at: datetime
    available_at: datetime

@dataclass(frozen=True, slots=True)
class SearchExecutionRecord:
    execution_id: str
    authorization_decision_id: str
    semantic_duplicate_key: str
    disposition: ExecutionDisposition
    status: ExecutionStatus
    original_execution_id: str | None
    context_payload: bytes
    context_hash: str
    created_at: str

@dataclass(frozen=True, slots=True)
class ClaimedJob:
    job_id: str
    execution_id: str
    attempt_number: int
    lease_owner: str
    lease_id: str
    lease_expires_at: str

@dataclass(frozen=True, slots=True)
class ResearchPublication:
    publication_id: str
    investigation_id: str
    candidate_bundle_id: CandidateKnowledgeBundleId
    research_anchor_id: str
    publication_classification: str
    review_status: str
    canon_effect: str
    created_at: datetime
    payload: Any
    content_hash: str
