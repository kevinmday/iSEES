from __future__ import annotations

from typing import Annotated, Any, Literal

from pydantic import BaseModel, ConfigDict, Field, StringConstraints, model_validator


Identity = Annotated[str, StringConstraints(strip_whitespace=True, min_length=1)]
IdempotencyKey = Annotated[str, StringConstraints(strip_whitespace=True, min_length=1, max_length=200)]


class StrictModel(BaseModel):
    model_config = ConfigDict(extra="forbid", populate_by_name=True)


class Association(StrictModel):
    kind: Literal["NODE", "EDGE"]
    canonicalIdentity: Identity
    basis: Literal["EXACT_CANONICAL_ID"]


class CuratedAssociation(StrictModel):
    kind: Literal["INVESTIGATION", "NODE", "EDGE"]
    canonicalIdentity: Identity
    basis: Literal["EXACT_CANONICAL_ID"]


class Source(StrictModel):
    originalLocator: str | None = None
    normalizedUrl: str | None = None
    sourceDomain: str | None = None
    repository: str | None = None
    doi: str | None = None
    citation: str | None = None
    title: str | None = None
    publisherOrCustodian: str | None = None
    publicationOrCaptureDate: str | None = None
    declaredMimeType: str | None = None


class BaseCreate(StrictModel):
    schemaVersion: Literal["candidate-evidence-command/v1"]
    investigationId: Identity
    source: Source = Field(default_factory=Source)
    association: Association | None = None
    idempotencyKey: IdempotencyKey


class SubmissionCreate(BaseCreate):
    submissionIdentity: Identity
    submittedLocator: str | None = None


class QuerySpecification(StrictModel):
    schemaVersion: Literal["candidate-evidence-query/v1"]
    investigationId: Identity
    targetConnector: Identity
    query: str
    clauses: list[dict[str, Any]]
    lineage: dict[str, Any]


class DiscoveryCreate(BaseCreate):
    querySpecification: QuerySpecification
    connector: Identity
    connectorVersion: Identity
    providerResultId: Identity
    providerResultVersion: str | None = None


class CuratedRepositoryReference(StrictModel):
    repositoryIdentity: Identity
    artifactIdentity: Identity
    artifactVersion: Identity | None
    contentHash: Identity | None
    sourceLocator: Identity | None


class CuratedRepositoryCreate(BaseCreate):
    association: CuratedAssociation | None = None
    repositoryReference: CuratedRepositoryReference
    provenance: dict[str, Any] | None
    custody: dict[str, Any] | None
    availability: Literal["AVAILABLE", "UNAVAILABLE", "MISSING", "REDACTED", "UNKNOWN"]

    @model_validator(mode="after")
    def validate_investigation_association(self):
        if (self.association is not None and self.association.kind == "INVESTIGATION"
                and self.association.canonicalIdentity != self.investigationId):
            raise ValueError("Investigation association identity must match investigationId")
        return self


class ReviewDecision(StrictModel):
    decision: Literal["DEFERRED", "EXCLUDED"]
    reason: Identity


class LifecycleTransition(StrictModel):
    schemaVersion: Literal["candidate-evidence-command/v1"]
    investigationId: Identity
    expectedRevision: int = Field(ge=0)
    to: Literal["REFERENCED", "IN_REVIEW", "DEFERRED", "EXCLUDED"]
    reviewDecision: ReviewDecision | None = None
    idempotencyKey: IdempotencyKey

    @model_validator(mode="after")
    def validate_review(self):
        if self.to in ("DEFERRED", "EXCLUDED"):
            if self.reviewDecision is None or self.reviewDecision.decision != self.to:
                raise ValueError(f"{self.to} requires a matching human review decision")
        elif self.reviewDecision is not None:
            raise ValueError("reviewDecision is valid only for DEFERRED or EXCLUDED")
        return self
