class RexContractError(ValueError):
    """A pure REX value violates its contract."""


class InvalidLifecycleTransition(RexContractError):
    """A Frontier Assignment lifecycle transition is not governed."""
