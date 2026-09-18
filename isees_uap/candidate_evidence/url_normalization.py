"""Deterministic, network-free URL normalization shared by Evidence intake."""

from __future__ import annotations

from dataclasses import dataclass
import ipaddress
import re
import unicodedata
from urllib.parse import quote, unquote, urlsplit, urlunsplit

import idna


URL_NORMALIZATION_VERSION = "evidence-url-normalization/v1"
WEB_DISCOVERY_ALLOWED_PORTS = frozenset((80, 443))
_LOCAL_SUFFIXES = ("localhost", "local", "internal", "home", "lan")
_AMBIGUOUS_NUMERIC = re.compile(r"^(?:0[xX][0-9a-fA-F]+|[0-9]+)(?:\.(?:0[xX][0-9a-fA-F]+|[0-9]+)){0,3}$")


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
    raw_host = parsed.hostname
    if "%" in raw_host:
        raise UrlNormalizationError("URL host cannot contain an IPv6 zone identifier")
    try:
        literal = ipaddress.ip_address(raw_host)
    except ValueError:
        try:
            ascii_host = idna.encode(raw_host, uts46=True, std3_rules=True).decode("ascii").lower()
            unicode_host = idna.decode(ascii_host, uts46=True, std3_rules=True)
            if idna.encode(unicode_host, uts46=True, std3_rules=True).decode("ascii").lower() != ascii_host:
                raise idna.IDNAError("IDNA round trip failed")
        except (UnicodeError, idna.IDNAError) as error:
            raise UrlNormalizationError("URL host is malformed") from error
    else:
        ascii_host = literal.compressed
    if not ascii_host:
        raise UrlNormalizationError("URL host is malformed")
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
    normalized = normalize_http_url(original_url, allowed_ports=WEB_DISCOVERY_ALLOWED_PORTS)
    host = normalized.display_domain
    try:
        address = ipaddress.ip_address(host)
    except ValueError:
        labels = host.split(".")
        if len(labels) < 2 or any(host == suffix or host.endswith(f".{suffix}") for suffix in _LOCAL_SUFFIXES):
            raise UrlNormalizationError("Web Discovery requires a public multi-label host")
        if _AMBIGUOUS_NUMERIC.fullmatch(host):
            raise UrlNormalizationError("Ambiguous numeric hosts are not permitted")
    else:
        if (not address.is_global or address.is_multicast or address.is_unspecified
                or address.is_loopback or address.is_link_local or address.is_private
                or address.is_reserved):
            raise UrlNormalizationError("Non-global IP literals are not permitted")
    return normalized
