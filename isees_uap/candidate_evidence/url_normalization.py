"""Deterministic, network-free URL normalization shared by Evidence intake."""

from __future__ import annotations

from dataclasses import dataclass
import unicodedata
from urllib.parse import quote, unquote, urlsplit, urlunsplit


URL_NORMALIZATION_VERSION = "evidence-url-normalization/v1"
WEB_DISCOVERY_ALLOWED_PORTS = frozenset((80, 443))


class UrlNormalizationError(ValueError):
    """The supplied URL cannot be represented under the governed policy."""


@dataclass(frozen=True, slots=True)
class NormalizedUrl:
    original_url: str
    normalized_url: str
    display_domain: str
    normalization_version: str = URL_NORMALIZATION_VERSION


def normalize_http_url(
    original_url: str,
    *,
    allowed_ports: frozenset[int] | None = None,
) -> NormalizedUrl:
    """Normalize an HTTP(S) URL without resolving, fetching, or following it.

    ``allowed_ports=None`` preserves the pre-existing direct-intake port policy.
    Web Discovery passes ``WEB_DISCOVERY_ALLOWED_PORTS``.
    """
    if not isinstance(original_url, str) or not original_url:
        raise UrlNormalizationError("URL must be a non-empty string")
    if any(unicodedata.category(character) == "Cc" for character in original_url):
        raise UrlNormalizationError("URL cannot contain control characters")
    try:
        parsed = urlsplit(original_url)
        port = parsed.port
    except (UnicodeError, ValueError) as error:
        raise UrlNormalizationError("URL is malformed") from error
    scheme = parsed.scheme.lower()
    if scheme not in ("http", "https"):
        raise UrlNormalizationError("URL must use http or https")
    if not parsed.hostname or parsed.username is not None or parsed.password is not None:
        raise UrlNormalizationError("URL must have a host and cannot contain credentials")
    if allowed_ports is not None and port is not None and port not in allowed_ports:
        raise UrlNormalizationError("URL port is not permitted")
    try:
        ascii_host = parsed.hostname.encode("idna").decode("ascii").lower()
    except UnicodeError as error:
        raise UrlNormalizationError("URL host is malformed") from error
    if (any(character.isspace() for character in ascii_host) or not ascii_host
            or "%" in ascii_host or ".." in ascii_host or ascii_host.startswith(".")
            or ascii_host.endswith(".")):
        raise UrlNormalizationError("URL host is malformed")
    display_domain = ascii_host
    host = f"[{ascii_host}]" if ":" in ascii_host and not ascii_host.startswith("[") else ascii_host
    is_default_port = (scheme == "http" and port == 80) or (scheme == "https" and port == 443)
    netloc = host if port is None or is_default_port else f"{host}:{port}"
    # This preserves the established direct-intake normalization semantics.
    path = quote(unquote(parsed.path or "/"), safe="/%:@!$&'()*+,;=-._~")
    normalized = urlunsplit((scheme, netloc, path, parsed.query, ""))
    return NormalizedUrl(original_url, normalized, display_domain)


def normalize_web_discovery_url(original_url: str) -> NormalizedUrl:
    return normalize_http_url(original_url, allowed_ports=WEB_DISCOVERY_ALLOWED_PORTS)
