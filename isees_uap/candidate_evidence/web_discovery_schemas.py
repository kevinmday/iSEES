"""Strict HTTP projections for authenticated Web Discovery search and capture."""

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
    providerCreditsConsumed: Literal[0, 1] = 0
    providerCreditUsage: Literal["ZERO", "ESTIMATED", "ACTUAL", "UNKNOWN"] = "ZERO"
    monetaryCost: Literal["0.00"] = "0.00"
    researcherCharge: Literal["0.00"] = "0.00"
    billingTriggered: Literal[False] = False
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
    runtimeStatus: Literal["LIVE_WEB_DISCOVERY", "OFFLINE_FIXTURE", "UNAVAILABLE"]
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


class WebDiscoveryCaptureCommand(StrictWebDiscoveryModel):
    schemaVersion: Literal["web-discovery-capture/v1"]
    investigationId: Identity
    expectedInvestigationRevision: int = Field(ge=0)
    manifoldRevisionId: Identity
    searchSessionId: Identity
    resultId: Identity
    operationId: Identity
    idempotencyKey: Identity
    researcherConfirmation: Literal[True]
    addToResearchInbox: bool = True
    researcherNote: Annotated[str, StringConstraints(
        strip_whitespace=True, min_length=1, max_length=20_000,
    )] | None = None


class WebDiscoveryCaptureSourceProjection(StrictWebDiscoveryModel):
    title: str
    providerReturnedUrl: str
    normalizedUrl: str
    sourceDomain: str
    snippet: str
    mediaType: str | None = None
    attribution: str
    retentionRestrictions: list[str]
    providerMetadata: dict[str, str]


class WebDiscoveryCaptureReceiptProjection(StrictWebDiscoveryModel):
    schemaVersion: Literal["web-discovery-capture-receipt/v1"]
    operationId: str
    searchSessionId: str
    resultId: str
    candidateId: str
    principalAuthority: str
    investigationId: str
    expectedInvestigationRevision: int
    manifoldRevisionId: str
    providerAdapterId: str
    providerAdapterVersion: str
    providerResultId: str | None = None
    normalizedQuery: str
    queryNormalizationVersion: str
    resultRank: int
    providerReturnedUrl: str
    normalizedUrl: str
    capturedAt: datetime
    idempotencyDisposition: Literal["CREATED", "REPLAYED"]
    aiAssistance: Literal["NONE"]
    rexExecution: Literal["NONE"]
    estimatedProviderCost: Literal[0]
    actualProviderCost: Literal[0]
    finalCharge: Literal[0]
    researchInboxEffect: Literal["NONE", "CREATED", "REPLAYED"]
    publicationEffect: Literal["NONE"]
    candidateKnowledgeEffect: Literal["NONE"]
    canonEffect: Literal["NONE"]
    graphEffect: Literal["NONE"]
    manifoldEffect: Literal["NONE"]
    resolveEffect: Literal["NONE"]


class WebDiscoveryCaptureResponse(StrictWebDiscoveryModel):
    schemaVersion: Literal["web-discovery-capture-outcome/v1"]
    operationId: str
    searchSessionId: str
    resultId: str
    investigationId: str
    expectedInvestigationRevision: int
    manifoldRevisionId: str
    candidateId: str
    candidateRevision: int
    origin: Literal["DISCOVERY"]
    intakePathway: Literal["WEB_DISCOVERY"]
    visibleOrigin: Literal["WEB_DISCOVERED"]
    lifecycleState: Literal["DISCOVERED", "REFERENCED", "IN_REVIEW", "DEFERRED", "EXCLUDED"]
    acquisitionState: Literal["NOT_REQUESTED"]
    publicationState: Literal["NOT_PUBLISHED"]
    idempotencyDisposition: Literal["CREATED", "REPLAYED"]
    capturedAt: datetime
    researchInboxEffect: Literal["NONE", "CREATED", "REPLAYED"]
    researchInboxAnchorId: str | None = None
    source: WebDiscoveryCaptureSourceProjection
    receipt: WebDiscoveryCaptureReceiptProjection
