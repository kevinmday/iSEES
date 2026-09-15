class RexContractError(ValueError):
    """A pure REX value violates its contract."""


class InvalidLifecycleTransition(RexContractError):
    """A Frontier Assignment lifecycle transition is not governed."""


class RexRepositoryError(RuntimeError):
    """Base class for sanitized durable REX persistence failures."""

class RepositoryUnavailable(RexRepositoryError): pass
class SchemaMismatch(RexRepositoryError): pass
class RecordNotFound(RexRepositoryError): pass
class DuplicateImmutableIdentity(RexRepositoryError): pass
class ContentHashMismatch(RexRepositoryError): pass
class InvalidStoredRecord(RexRepositoryError): pass
class RevisionConflict(RexRepositoryError): pass
class InvalidLifecyclePersistence(RexRepositoryError): pass
class AuthorizationDenied(RexRepositoryError): pass
class BudgetExceeded(RexRepositoryError): pass
class CircuitBreakerOpen(RexRepositoryError): pass
class EligibilityUnavailable(RexRepositoryError): pass
class DuplicateSuppressed(RexRepositoryError):
    def __init__(self, original_execution_id: str, suppressed_execution_id: str):
        super().__init__("Semantic duplicate execution was suppressed")
        self.original_execution_id = original_execution_id
        self.suppressed_execution_id = suppressed_execution_id
class JobUnavailable(RexRepositoryError): pass
