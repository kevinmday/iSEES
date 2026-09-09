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


class ProhibitedTransition(Conflict):
    code = "PROHIBITED_TRANSITION"


class InvalidCursor(CandidateEvidenceError):
    code = "INVALID_CURSOR"


class NativeCaseDraftNotFound(NotFound):
    code = "NATIVE_CASE_DRAFT_NOT_FOUND"


class NativeCaseInvestigationNotFound(NotFound):
    code = "NATIVE_CASE_INVESTIGATION_NOT_FOUND"
