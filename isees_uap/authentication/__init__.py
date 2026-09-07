"""Server-authoritative researcher authentication."""

from .principal import AuthenticatedPrincipal, require_authenticated_principal

__all__ = ["AuthenticatedPrincipal", "require_authenticated_principal"]
