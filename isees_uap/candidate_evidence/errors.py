class CandidateEvidenceError(Exception):
    code = "CANDIDATE_EVIDENCE_ERROR"
    status_code = 400


class NotFound(CandidateEvidenceError):
    code = "CANDIDATE_NOT_FOUND"
    status_code = 404


class InvestigationMismatch(CandidateEvidenceError):
    code = "INVESTIGATION_MISMATCH"
    status_code = 412


class Conflict(CandidateEvidenceError):
    status_code = 409


class RevisionConflict(Conflict):
    code = "REVISION_CONFLICT"


class IdempotencyConflict(Conflict):
    code = "IDEMPOTENCY_KEY_REUSE"


class OriginConflict(Conflict):
    code = "ORIGIN_IDENTITY_CONFLICT"

    def __init__(self, message: str, *, existing_candidate_id: str | None = None):
        super().__init__(message)
        self.existing_candidate_id = existing_candidate_id


class WebDiscoveryAlreadyCaptured(Conflict):
    code = "WEB_DISCOVERY_ALREADY_CAPTURED"

    def __init__(self, existing_candidate_id: str):
        super().__init__("Web Discovery result is already captured")
        self.existing_candidate_id = existing_candidate_id


class ProhibitedTransition(Conflict):
    code = "PROHIBITED_TRANSITION"


class InvalidCursor(CandidateEvidenceError):
    code = "INVALID_CURSOR"


class InvalidUpload(CandidateEvidenceError):
    code = "INVALID_UPLOAD"
    status_code = 422


class UnsupportedUpload(InvalidUpload):
    code = "UNSUPPORTED_UPLOAD"


class UploadTooLarge(InvalidUpload):
    code = "UPLOAD_TOO_LARGE"
    status_code = 413


class NativeCaseDraftNotFound(NotFound):
    code = "NATIVE_CASE_DRAFT_NOT_FOUND"


class NativeCaseInvestigationNotFound(NotFound):
    code = "NATIVE_CASE_INVESTIGATION_NOT_FOUND"
