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


class InvalidPrincipal(InvestigationLibraryError):
    code = "INVALID_PRINCIPAL"
    status_code = 422


class RepositoryUnavailable(InvestigationLibraryError):
    code = "INVESTIGATION_REPOSITORY_UNAVAILABLE"
    status_code = 503


class InvalidStoredInvestigation(InvestigationLibraryError):
    code = "INVALID_STORED_INVESTIGATION"
    status_code = 503
