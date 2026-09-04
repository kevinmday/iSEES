class StudioError(Exception):
    code = "STUDIO_ERROR"
    status_code = 400


class InvestigationMismatch(StudioError):
    code = "INVESTIGATION_MISMATCH"
    status_code = 412


class OwnershipAccessFailure(StudioError):
    code = "STUDIO_ARTIFACT_NOT_FOUND"
    status_code = 404


class ArtifactNotFound(OwnershipAccessFailure):
    pass


class InvalidLifecycleTransition(StudioError):
    code = "INVALID_LIFECYCLE_TRANSITION"
    status_code = 409


class RevisionConflict(StudioError):
    code = "REVISION_CONFLICT"
    status_code = 409


class IdempotencyConflict(StudioError):
    code = "IDEMPOTENCY_KEY_REUSE"
    status_code = 409


class InvalidSourceSnapshot(StudioError):
    code = "INVALID_SOURCE_SNAPSHOT"
    status_code = 422


class InvalidClaimSourceMapping(StudioError):
    code = "INVALID_CLAIM_SOURCE_MAPPING"
    status_code = 422


class UnresolvedProjectionReadiness(StudioError):
    code = "UNRESOLVED_PROJECTION_READINESS"
    status_code = 409


class UnavailableExternalAuthority(StudioError):
    code = "EXTERNAL_AUTHORITY_UNAVAILABLE"
    status_code = 503


class PublicationFailure(StudioError):
    code = "PUBLICATION_FAILURE"
    status_code = 503


class AcceptanceFailure(StudioError):
    code = "ACCEPTANCE_FAILURE"
    status_code = 503


class InvalidDraftingContext(StudioError):
    code = "INVALID_DRAFTING_CONTEXT"
    status_code = 422


class DraftingProviderUnavailable(StudioError):
    code = "DRAFTING_PROVIDER_UNAVAILABLE"
    status_code = 503


class DraftingProviderTimeout(StudioError):
    code = "DRAFTING_PROVIDER_TIMEOUT"
    status_code = 504


class DraftingProviderFailure(StudioError):
    code = "DRAFTING_PROVIDER_FAILURE"
    status_code = 502


class InvalidDraftingProviderResponse(StudioError):
    code = "INVALID_DRAFTING_PROVIDER_RESPONSE"
    status_code = 502
