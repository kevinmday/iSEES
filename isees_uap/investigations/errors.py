class InvestigationLibraryError(Exception):
    code = "INVESTIGATION_LIBRARY_ERROR"
    status_code = 400


class InvestigationNotFound(InvestigationLibraryError):
    code = "INVESTIGATION_NOT_FOUND"
    status_code = 404


class DuplicateInvestigationId(InvestigationLibraryError):
    code = "DUPLICATE_INVESTIGATION_ID"
    status_code = 409


class RevisionConflict(InvestigationLibraryError):
    code = "REVISION_CONFLICT"
    status_code = 409


class OperationalRevisionConflict(InvestigationLibraryError):
    code = "OPERATIONAL_REVISION_CONFLICT"
    status_code = 409


class InvalidOperationalGraph(InvestigationLibraryError):
    code = "INVALID_OPERATIONAL_GRAPH"
    status_code = 422


class InvalidPrincipal(InvestigationLibraryError):
    code = "INVALID_PRINCIPAL"
    status_code = 422


class RepositoryUnavailable(InvestigationLibraryError):
    code = "INVESTIGATION_REPOSITORY_UNAVAILABLE"
    status_code = 503


class InvalidStoredInvestigation(InvestigationLibraryError):
    code = "INVALID_STORED_INVESTIGATION"
    status_code = 503


class InvalidInvestigationInput(InvestigationLibraryError):
    code = "INVALID_INVESTIGATION_INPUT"
    status_code = 422


class IdempotencyKeyReuse(InvestigationLibraryError):
    code = "IDEMPOTENCY_KEY_REUSE"
    status_code = 409

class InvalidManifoldArtifactAdmission(InvestigationLibraryError):
    code = "INVALID_MANIFOLD_ARTIFACT_ADMISSION"
    status_code = 422

class ManifoldArtifactAlreadyAdmitted(InvestigationLibraryError):
    code = "MANIFOLD_ARTIFACT_ALREADY_ADMITTED"
    status_code = 409
