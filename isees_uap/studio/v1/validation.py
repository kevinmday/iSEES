from __future__ import annotations
from collections.abc import Mapping, Sequence
from pydantic import ValidationError
from .schemas import AiDraftProposal, AuthorRevision, ChildProjection, FrozenResearchSourceSnapshot, InferencePackage, SensitiveSourceDirectives

UNSUPPORTED_CONFIDENCE_FIELDS = frozenset({"probability", "confidence", "confidenceValue", "bayesianProbability"})
def reject_unsupported_confidence(value: object) -> None:
    if isinstance(value, Mapping):
        for key, child in value.items():
            if key in UNSUPPORTED_CONFIDENCE_FIELDS: raise ValueError(f"unsupported {key}")
            reject_unsupported_confidence(child)
    elif isinstance(value, Sequence) and not isinstance(value, (str, bytes)):
        for child in value: reject_unsupported_confidence(child)
def effective_sensitivity(policies: Sequence[SensitiveSourceDirectives]) -> SensitiveSourceDirectives:
    if not policies: raise ValueError("sensitivity policy required")
    return SensitiveSourceDirectives(includeInAnalysis=all(x.includeInAnalysis for x in policies) and not any(x.excludeFromAiProcessing for x in policies), includeInArtifact=all(x.includeInArtifact for x in policies), citePublicly=all(x.citePublicly for x in policies) and not any(x.restrictedAppendix for x in policies), anonymize=any(x.anonymize for x in policies), restrictedAppendix=any(x.restrictedAppendix for x in policies), excludeFromAiProcessing=any(x.excludeFromAiProcessing for x in policies))
def validate_revision(value: object) -> AuthorRevision: reject_unsupported_confidence(value); return AuthorRevision.model_validate(value)
def validate_snapshot(value: object) -> FrozenResearchSourceSnapshot: return FrozenResearchSourceSnapshot.model_validate(value)
def validate_proposal(value: object, current_revision_id: str | None = None, current_content_hash: str | None = None) -> AiDraftProposal:
    proposal = AiDraftProposal.model_validate(value)
    stale = current_revision_id is not None and (proposal.baseRevisionId != current_revision_id or proposal.baseContentHash != current_content_hash)
    if stale and not proposal.staleBase.rejected: raise ValueError("stale proposal must be rejected")
    return proposal
def validate_projection(value: object, parent_content_hash: str) -> ChildProjection:
    projection = ChildProjection.model_validate(value)
    if projection.parentContentHash != parent_content_hash: raise ValueError("projection parent hash mismatch")
    if projection.state in {"CURRENT", "PUBLISHED", "RETRACTED"} and not projection.outputHash: raise ValueError("successful projection requires output hash")
    if projection.state == "FAILED" and (not projection.failure or not projection.priorSuccessfulProjectionId): raise ValueError("failed projection must preserve prior success")
    return projection
LEGAL_PROJECTION_TRANSITIONS = {"NOT_GENERATED": ("QUEUED",), "QUEUED": ("REBUILDING", "FAILED"), "REBUILDING": ("CURRENT", "FAILED"), "CURRENT": ("STALE", "SUPERSEDED", "PUBLISHED"), "STALE": ("QUEUED", "SUPERSEDED"), "FAILED": ("QUEUED", "SUPERSEDED"), "SUPERSEDED": (), "PUBLISHED": ("RETRACTED", "SUPERSEDED"), "RETRACTED": ()}
def validate_projection_transition(from_state: str, to_state: str) -> None:
    if to_state not in LEGAL_PROJECTION_TRANSITIONS.get(from_state, ()): raise ValueError(f"illegal projection transition {from_state} -> {to_state}")
def validate_inference(value: object) -> InferencePackage: reject_unsupported_confidence(value); return InferencePackage.model_validate(value)
