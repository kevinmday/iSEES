"""Strict HTTP projections for authenticated Web Discovery search only."""

from __future__ import annotations

from datetime import datetime
from typing import Annotated, Literal

from pydantic import BaseModel, ConfigDict, Field, StringConstraints


Identity = Annotated[str, StringConstraints(
    strip_whitespace=True, min_length=1, max_length=200, pattern=r"^[^\x00-\x1f\x7f]+$",
)]
class StrictWebDiscoveryModel(BaseModel):
    model_config = ConfigDict(extra="forbid", populate_by_name=True)


class SelectedObjectContextCommand(StrictWebDiscoveryModel):
    objectType: Identity
    objectId: Identity
    objectRevision: Identity | None = None


class WebDiscoveryExecutionPolicy(StrictWebDiscoveryModel):
    metadataOnly: Literal[True]
    aiAssistance: Literal["NONE"]
    rexExecution: Literal["NONE"]
    authorizedSpend: Literal[0]


class WebDiscoverySearchCommand(StrictWebDiscoveryModel):
    schemaVersion: Literal["web-discovery-search/v1"]
    investigationId: Identity
    expectedInvestigationRevision: int = Field(ge=0)
    manifoldRevisionId: Identity
    searchSessionId: Identity
    operationId: Identity
    query: Annotated[str, StringConstraints(
        strip_whitespace=True, min_length=1, max_length=2_000,
        pattern=r"^[^\x00-\x1f\x7f]+$",
    )]
    selectedObjectContext: SelectedObjectContextCommand | None = None
    resultLimit: int = Field(ge=1, le=50)
    adapterId: Identity
    adapterVersion: Identity
    idempotencyKey: Identity
    executionPolicy: WebDiscoveryExecutionPolicy


class SelectedObjectContextProjection(StrictWebDiscoveryModel):
    objectType: str
    objectId: str
    objectRevision: str | None = None


class WebDiscoverySearchResultProjection(StrictWebDiscoveryModel):
    resultId: str
    providerResultId: str | None = None
    rank: int
    title: str
    providerReturnedUrl: str
    normalizedUrl: str
    displayUrl: str
    displayDomain: str
    snippet: str
    mediaType: str | None = None
    attribution: str
    retentionRestrictions: list[str]
    providerMetadata: dict[str, str]


class WebDiscoveryStableErrorProjection(StrictWebDiscoveryModel):
    code: str
    message: str


class WebDiscoveryZeroEffectReceiptProjection(StrictWebDiscoveryModel):
    schemaVersion: str
    operationId: str
    investigationId: str
    manifoldRevisionId: str
    status: str
    createdAt: datetime
    completedAt: datetime
    aiAssistance: Literal["NONE"]
    rexExecution: Literal["NONE"]
    estimatedProviderCost: Literal[0]
    actualProviderCost: Literal[0]
    finalCharge: Literal[0]
    researchInboxEffect: Literal["NONE"]
    publicationEffect: Literal["NONE"]
    candidateKnowledgeEffect: Literal["NONE"]
    canonEffect: Literal["NONE"]
    graphEffect: Literal["NONE"]
    manifoldEffect: Literal["NONE"]
    resolveEffect: Literal["NONE"]


class WebDiscoverySearchResponse(StrictWebDiscoveryModel):
    schemaVersion: Literal["web-discovery-outcome/v1"]
    searchSessionId: str
    operationId: str
    investigationId: str
    expectedInvestigationRevision: int
    manifoldRevisionId: str
    normalizedQuery: str
    queryNormalizationVersion: str
    adapterId: str
    adapterVersion: str
    status: Literal["COMPLETED", "ZERO_RESULTS", "CANCELLED", "UNAVAILABLE", "RATE_LIMITED", "FAILED"]
    startedAt: datetime
    completedAt: datetime
    expiresAt: datetime
    resultCount: int
    results: list[WebDiscoverySearchResultProjection]
    providerAttribution: str
    restrictions: list[str]
    warnings: list[str]
    error: WebDiscoveryStableErrorProjection | None = None
    receipt: WebDiscoveryZeroEffectReceiptProjection
