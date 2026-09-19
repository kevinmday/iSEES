"""Explicit, provider-free capture of one authoritative Web Discovery result."""

from __future__ import annotations

from .errors import OriginConflict, WebDiscoveryAlreadyCaptured
from .service import CandidateEvidenceService
from .web_discovery_runtime import WebDiscoverySearchRuntime
from .web_discovery_schemas import WebDiscoveryCaptureCommand, WebDiscoveryCaptureResponse
from isees_uap.research_sources.sqlite_repository import SQLiteResearchSourceRepository


class WebDiscoveryCaptureService:
    def __init__(self, candidates: CandidateEvidenceService, runtime: WebDiscoverySearchRuntime,
                 research_sources: SQLiteResearchSourceRepository):
        self._candidates = candidates
        self._runtime = runtime
        self._research_sources = research_sources

    def capture(self, *, principal_id: str, command: WebDiscoveryCaptureCommand) -> tuple[WebDiscoveryCaptureResponse, bool]:
        session, result = self._runtime.resolve_capture(
            principal_id=principal_id, investigation_id=command.investigationId,
            expected_investigation_revision=command.expectedInvestigationRevision,
            manifold_revision_id=command.manifoldRevisionId,
            search_session_id=command.searchSessionId, result_id=command.resultId,
        )
        source = {
            "title": result.title, "originalLocator": result.provider_returned_url,
            "providerReturnedUrl": result.provider_returned_url,
            "normalizedUrl": result.normalized_url, "sourceDomain": result.display_domain,
            "snippet": result.snippet, "mediaType": result.media_type,
            "attribution": result.attribution,
            "retentionRestrictions": list(result.retention_restrictions),
            "providerMetadata": dict(result.provider_metadata),
        }
        receipt = {
            "schemaVersion": "web-discovery-capture-receipt/v1",
            "operationId": command.operationId, "searchSessionId": command.searchSessionId,
            "resultId": command.resultId, "principalAuthority": principal_id,
            "investigationId": command.investigationId,
            "expectedInvestigationRevision": command.expectedInvestigationRevision,
            "manifoldRevisionId": command.manifoldRevisionId,
            "providerAdapterId": session.adapter_id, "providerAdapterVersion": session.adapter_version,
            "providerResultId": result.provider_result_id,
            "normalizedQuery": session.normalized_query,
            "queryNormalizationVersion": session.query_normalization_version,
            "resultRank": result.rank, "providerReturnedUrl": result.provider_returned_url,
            "normalizedUrl": result.normalized_url,
            "aiAssistance": "NONE", "rexExecution": "NONE",
            "estimatedProviderCost": 0, "actualProviderCost": 0, "finalCharge": 0,
            "researchInboxEffect": "NONE", "publicationEffect": "NONE",
            "candidateKnowledgeEffect": "NONE", "canonEffect": "NONE",
            "graphEffect": "NONE", "manifoldEffect": "NONE", "resolveEffect": "NONE",
        }
        internal = {
            "schemaVersion": "candidate-evidence-command/v1",
            "investigationId": command.investigationId, "source": source, "association": None,
            "idempotencyKey": command.idempotencyKey,
            "querySpecification": {
                "schemaVersion": "candidate-evidence-query/v1",
                "investigationId": command.investigationId,
                "targetConnector": session.adapter_id, "query": session.normalized_query,
                "clauses": [], "lineage": {
                    "searchSessionId": session.search_session_id,
                    "queryNormalizationVersion": session.query_normalization_version,
                    "selectedObjectContext": None if session.selected_object_context is None else {
                        "objectType": session.selected_object_context.object_type,
                        "objectId": session.selected_object_context.object_id,
                        "objectRevision": session.selected_object_context.object_revision,
                    },
                },
            },
            "connector": session.adapter_id, "connectorVersion": session.adapter_version,
            "providerResultId": result.provider_result_id or result.result_id,
            "providerResultVersion": None, "manifoldRevisionId": command.manifoldRevisionId,
            "investigationAggregateRevision": command.expectedInvestigationRevision,
            "intakePathway": "WEB_DISCOVERY", "operationId": command.operationId,
            "normalizationVersion": result.normalization_version,
            "acquisitionState": "NOT_REQUESTED", "availability": "AVAILABLE",
            "publicationState": "NOT_PUBLISHED", "researcherConfirmed": True,
            "intakeProvenance": {
                "kind": "WEB_DISCOVERY", "researcherConfirmed": True,
                "researcherNote": command.researcherNote, "zeroExternalFetch": True,
                "searchSessionId": command.searchSessionId, "resultId": command.resultId,
                "exactSelectedResult": source,
            },
            "captureReceipt": receipt,
        }
        try:
            candidate, replayed = self._candidates.capture_web_discovery(internal, principal_id)
        except OriginConflict as error:
            if error.existing_candidate_id is None:
                raise
            existing = self._candidates.get(
                command.investigationId, error.existing_candidate_id, principal_id)
            existing_receipt = existing["lineage"].get("captureReceipt", {})
            if existing_receipt.get("searchSessionId") == command.searchSessionId:
                raise
            raise WebDiscoveryAlreadyCaptured(error.existing_candidate_id) from error
        inbox_effect = "NONE"
        inbox_anchor_id = None
        if command.addToResearchInbox:
            inbox, inbox_replayed = self._research_sources.publish_candidate_evidence(
                candidate=candidate, principal_id=principal_id)
            inbox_effect = "REPLAYED" if inbox_replayed else "CREATED"
            inbox_anchor_id = inbox["anchorId"]
        self._runtime.mark_captured(
            principal_id=principal_id, investigation_id=command.investigationId,
            expected_investigation_revision=command.expectedInvestigationRevision,
            manifold_revision_id=command.manifoldRevisionId,
            search_session_id=command.searchSessionId, result_id=command.resultId,
            candidate_id=candidate["candidateId"],
        )
        persisted = candidate["lineage"]["captureReceipt"]
        disposition = "REPLAYED" if replayed else "CREATED"
        response_receipt = {**persisted, "idempotencyDisposition": disposition,
                            "researchInboxEffect": inbox_effect}
        projection_source = {key: source[key] for key in (
            "title", "providerReturnedUrl", "normalizedUrl", "sourceDomain", "snippet",
            "mediaType", "attribution", "retentionRestrictions", "providerMetadata")}
        return WebDiscoveryCaptureResponse.model_validate({
            "schemaVersion": "web-discovery-capture-outcome/v1",
            "operationId": command.operationId, "searchSessionId": command.searchSessionId,
            "resultId": command.resultId, "investigationId": command.investigationId,
            "expectedInvestigationRevision": command.expectedInvestigationRevision,
            "manifoldRevisionId": command.manifoldRevisionId,
            "candidateId": candidate["candidateId"], "candidateRevision": candidate["revision"],
            "origin": "DISCOVERY", "intakePathway": "WEB_DISCOVERY",
            "visibleOrigin": "WEB_DISCOVERED", "lifecycleState": candidate["lifecycleState"],
            "acquisitionState": candidate["acquisitionState"],
            "publicationState": candidate["publicationState"],
            "idempotencyDisposition": disposition, "capturedAt": persisted["capturedAt"],
            "researchInboxEffect": inbox_effect, "researchInboxAnchorId": inbox_anchor_id,
            "source": projection_source, "receipt": response_receipt,
        }), replayed
