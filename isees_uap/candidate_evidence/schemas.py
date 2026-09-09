from __future__ import annotations

from datetime import date, time
from typing import Annotated, Any, Literal
import re
import unicodedata
from zoneinfo import ZoneInfo, ZoneInfoNotFoundError

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


FieldState = Literal["SUPPLIED", "UNKNOWN", "OMITTED"]


def _normalize_text(value: object) -> object:
    if not isinstance(value, str):
        return value
    value = unicodedata.normalize("NFKC", value).strip()
    if any(unicodedata.category(char) == "Cc" and char not in "\n\t" for char in value):
        raise ValueError("control characters are not allowed")
    return value


class DraftTextField(StrictModel):
    state: FieldState
    value: str | None = Field(default=None, max_length=20_000)

    @model_validator(mode="before")
    @classmethod
    def normalize(cls, data):
        if isinstance(data, dict) and "value" in data:
            data = {**data, "value": _normalize_text(data["value"])}
        return data

    @model_validator(mode="after")
    def require_state_value(self):
        if self.state == "SUPPLIED" and not self.value:
            raise ValueError("SUPPLIED requires a non-empty value")
        if self.state != "SUPPLIED" and self.value is not None:
            raise ValueError(f"{self.state} cannot carry a value")
        return self


class DraftDateField(StrictModel):
    state: FieldState
    value: str | None = None

    @model_validator(mode="after")
    def validate_value(self):
        if self.state == "SUPPLIED":
            if self.value is None:
                raise ValueError("SUPPLIED requires a value")
            try:
                date.fromisoformat(self.value)
            except ValueError as error:
                raise ValueError("date must be YYYY-MM-DD") from error
        elif self.value is not None:
            raise ValueError(f"{self.state} cannot carry a value")
        return self


class DraftTimeField(StrictModel):
    state: FieldState
    value: str | None = None

    @model_validator(mode="after")
    def validate_value(self):
        if self.state == "SUPPLIED":
            if self.value is None or not re.fullmatch(r"(?:[01]\d|2[0-3]):[0-5]\d(?::[0-5]\d)?", self.value):
                raise ValueError("time must be HH:MM or HH:MM:SS")
            time.fromisoformat(self.value)
        elif self.value is not None:
            raise ValueError(f"{self.state} cannot carry a value")
        return self


class DraftTimezoneField(StrictModel):
    state: FieldState
    value: str | None = Field(default=None, max_length=100)

    @model_validator(mode="after")
    def validate_value(self):
        if self.state == "SUPPLIED":
            if self.value is None:
                raise ValueError("SUPPLIED requires a timezone")
            valid_offset = re.fullmatch(r"(?:Z|[+-](?:0\d|1[0-4]):[0-5]\d)", self.value)
            if not valid_offset:
                try:
                    ZoneInfo(self.value)
                except (ZoneInfoNotFoundError, ValueError) as error:
                    raise ValueError("timezone must be an IANA zone or UTC offset") from error
        elif self.value is not None:
            raise ValueError(f"{self.state} cannot carry a value")
        return self


class DraftCountField(StrictModel):
    state: FieldState
    value: int | None = Field(default=None, ge=0, le=1_000_000, strict=True)

    @model_validator(mode="after")
    def validate_value(self):
        if (self.state == "SUPPLIED") != (self.value is not None):
            raise ValueError("value presence must match SUPPLIED state")
        return self


class DraftDurationField(StrictModel):
    state: FieldState
    seconds: int | None = Field(default=None, ge=0, le=31_536_000, strict=True)

    @model_validator(mode="after")
    def validate_value(self):
        if (self.state == "SUPPLIED") != (self.seconds is not None):
            raise ValueError("seconds presence must match SUPPLIED state")
        return self


class DraftPrivacyField(StrictModel):
    state: FieldState
    value: Literal["PUBLIC", "RESTRICTED", "PRIVATE"] | None = None

    @model_validator(mode="after")
    def validate_value(self):
        if (self.state == "SUPPLIED") != (self.value is not None):
            raise ValueError("value presence must match SUPPLIED state")
        return self


class NativeCaseDraftContent(StrictModel):
    schemaVersion: Literal["native-case-draft-content/v1"]
    workingTitle: DraftTextField
    observationLocation: DraftTextField
    localObservationDate: DraftDateField
    localObservationTime: DraftTimeField
    timezone: DraftTimezoneField
    observationNarrative: DraftTextField
    objectShape: DraftTextField
    movementBehavior: DraftTextField
    soundCharacteristics: DraftTextField
    lightingVisibility: DraftTextField
    observerContext: DraftTextField
    witnessCount: DraftCountField
    environmentalConditions: DraftTextField
    approximateDuration: DraftDurationField
    researcherNotes: DraftTextField
    sourceProvenanceStatement: DraftTextField
    privacyClassification: DraftPrivacyField
    rightsPublicationRestriction: DraftTextField


class NativeCaseDraftCreate(StrictModel):
    schemaVersion: Literal["native-case-draft-command/v1"]
    investigationId: Identity | None = None
    content: NativeCaseDraftContent
    idempotencyKey: IdempotencyKey


class NativeCaseDraftUpdate(StrictModel):
    schemaVersion: Literal["native-case-draft-command/v1"]
    investigationId: Identity | None = None
    expectedRevision: int = Field(ge=0)
    content: NativeCaseDraftContent
    idempotencyKey: IdempotencyKey


class NativeCaseOwnership(StrictModel):
    kind: Literal["RESEARCHER_OWNED"]
    researcherId: Identity


class NativeCaseDraftProjection(StrictModel):
    schemaVersion: Literal["native-case-draft-projection/v1"]
    candidateId: Identity
    ownership: NativeCaseOwnership
    investigationId: Identity | None
    knowledgeClassification: Literal["CANDIDATE_KNOWLEDGE"]
    lifecycle: Literal["DRAFT"]
    revision: int = Field(ge=0)
    freshnessToken: Identity
    content: NativeCaseDraftContent
    createdAt: str
    updatedAt: str
    operationalMaterialization: Literal["NONE"]
    systemCanonIdentity: None


class NativeCaseDraftReceipt(NativeCaseDraftProjection):
    idempotencyDisposition: Literal["CREATED", "UPDATED", "REPLAYED"]


class NativeCaseDraftList(StrictModel):
    schemaVersion: Literal["native-case-draft-list/v1"]
    items: list[NativeCaseDraftProjection]
