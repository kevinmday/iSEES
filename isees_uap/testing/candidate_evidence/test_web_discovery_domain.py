from dataclasses import FrozenInstanceError
from datetime import datetime, timedelta, timezone
from pathlib import Path
import sqlite3

import pytest

from isees_uap.candidate_evidence.url_normalization import (
    URL_NORMALIZATION_VERSION, UrlNormalizationError, normalize_http_url,
    normalize_web_discovery_url,
)
from isees_uap.candidate_evidence.web_discovery import (
    Cancellation, InMemoryWebDiscoverySessions, MAX_RESULT_LIMIT,
    QUERY_NORMALIZATION_VERSION, SEARCH_SCHEMA_VERSION, SearchRequest, SearchStatus,
    WebDiscoveryError, WebDiscoveryErrorCode,
)
from isees_uap.candidate_evidence.web_discovery_fixture import (
    DeterministicWebDiscoveryFixture, FIXTURE_ADAPTER_ID, FIXTURE_ADAPTER_VERSION,
)


START = datetime(2026, 1, 2, 3, 4, 5, tzinfo=timezone.utc)
LIFETIME = timedelta(minutes=7)


class Clock:
    def __init__(self):
        self.value = START

    def __call__(self):
        return self.value


def request(query="one", *, session="session-1", operation="operation-1", principal="principal-1",
            investigation="investigation-1", investigation_revision=4, manifold="manifold-9",
            key="key-1", limit=10, now=START):
    return SearchRequest(
        SEARCH_SCHEMA_VERSION, session, operation, principal, investigation,
        investigation_revision, manifold, query, QUERY_NORMALIZATION_VERSION, None, limit,
        FIXTURE_ADAPTER_ID, FIXTURE_ADAPTER_VERSION, key, True, True, now, now + LIFETIME,
    )


def owner(clock=None, capacity=3):
    return InMemoryWebDiscoverySessions(capacity=capacity, lifetime=LIFETIME, clock=clock or Clock())


def search(query="one", **kwargs):
    fixture = DeterministicWebDiscoveryFixture()
    authority = owner()
    outcome = authority.search(request(query, **kwargs), fixture, Cancellation())
    return authority, fixture, outcome


def assert_code(code, call):
    with pytest.raises(WebDiscoveryError) as raised:
        call()
    assert raised.value.code == code


def test_request_result_outcome_session_and_receipt_are_immutable():
    authority, _, outcome = search()
    projection = authority.project(search_session_id="session-1", principal_id="principal-1",
                                   investigation_id="investigation-1",
                                   expected_investigation_revision=4, manifold_revision_id="manifold-9")
    for value, field in ((request(), "principal_id"), (outcome.results[0], "title"),
                         (outcome, "status"), (projection, "result_count"),
                         (outcome.receipt, "final_charge")):
        with pytest.raises((FrozenInstanceError, AttributeError)):
            setattr(value, field, "changed")
    assert isinstance(outcome.results, tuple)
    assert isinstance(outcome.results[0].provider_metadata, tuple)


@pytest.mark.parametrize("query,status,count", [
    ("zero", SearchStatus.ZERO_RESULTS, 0),
    ("one", SearchStatus.COMPLETED, 1),
    ("multiple", SearchStatus.COMPLETED, 3),
])
def test_deterministic_result_scenarios(query, status, count):
    first = search(query)[2]
    second = search(query)[2]
    assert first == second
    assert first.status == status
    assert first.result_count == count


@pytest.mark.parametrize("query,status,code", [
    ("cancelled", SearchStatus.CANCELLED, WebDiscoveryErrorCode.CANCELLED),
    ("unavailable", SearchStatus.UNAVAILABLE, WebDiscoveryErrorCode.UNAVAILABLE),
    ("rate limited", SearchStatus.RATE_LIMITED, WebDiscoveryErrorCode.RATE_LIMITED),
    ("provider failure", SearchStatus.FAILED, WebDiscoveryErrorCode.PROVIDER_FAILURE),
])
def test_terminal_fixture_scenarios_are_distinct(query, status, code):
    outcome = search(query)[2]
    assert outcome.status == status
    assert outcome.error.code == code
    assert outcome.results == ()


def test_explicit_cancellation_boundary():
    fixture = DeterministicWebDiscoveryFixture()
    outcome = owner().search(request(), fixture, Cancellation(True))
    assert outcome.status == SearchStatus.CANCELLED


def test_malformed_provider_metadata_is_rejected():
    assert_code(WebDiscoveryErrorCode.INVALID_PROVIDER_METADATA,
                lambda: search("malformed metadata"))


def test_search_creates_no_candidate_evidence_or_database_records(tmp_path):
    database = tmp_path / "proof.sqlite3"
    with sqlite3.connect(database) as connection:
        connection.execute("CREATE TABLE candidate_evidence (candidate_id TEXT)")
    search("multiple")
    with sqlite3.connect(database) as connection:
        assert connection.execute("SELECT count(*) FROM candidate_evidence").fetchone()[0] == 0
    assert not list(tmp_path.glob("*.sqlite3-*"))


def test_domain_and_fixture_import_no_downstream_owner_or_network_modules():
    base = Path("isees_uap/candidate_evidence")
    source = (base / "web_discovery.py").read_text(encoding="utf-8")
    fixture = (base / "web_discovery_fixture.py").read_text(encoding="utf-8")
    forbidden = ("repository", "research_sources", "publication", "rex", "frontier",
                 "requests", "httpx", "urllib.request", "socket", "browser")
    import_lines = "\n".join(line for line in (source + fixture).splitlines()
                             if line.startswith("import ") or line.startswith("from "))
    assert all(name not in import_lines.casefold() for name in forbidden)


def test_search_performs_no_live_network(monkeypatch):
    import socket
    monkeypatch.setattr(socket, "socket", lambda *args, **kwargs: pytest.fail("network attempted"))
    assert search("multiple")[2].result_count == 3


def test_unselected_results_are_only_in_bounded_ephemeral_memory():
    authority, _, outcome = search("multiple")
    projection = authority.project(search_session_id="session-1", principal_id="principal-1",
                                   investigation_id="investigation-1",
                                   expected_investigation_revision=4, manifold_revision_id="manifold-9")
    assert not hasattr(projection, "results")
    assert projection.result_count == len(outcome.results)
    assert projection.capture_count == 0


def test_capacity_evicts_oldest_session_deterministically():
    authority = owner(capacity=2)
    fixture = DeterministicWebDiscoveryFixture()
    for number in range(1, 4):
        authority.search(request(session=f"session-{number}", operation=f"operation-{number}",
                                 key=f"key-{number}"), fixture, Cancellation())
    assert authority.session_count == 2
    assert_code(WebDiscoveryErrorCode.SESSION_EXPIRED,
                lambda: authority.project(search_session_id="session-1", principal_id="principal-1",
                                          investigation_id="investigation-1",
                                          expected_investigation_revision=4,
                                          manifold_revision_id="manifold-9"))


def test_expiry_is_configuration_owned_visible_and_clock_testable():
    clock = Clock()
    authority = owner(clock)
    outcome = authority.search(request(), DeterministicWebDiscoveryFixture(), Cancellation())
    projection = authority.project(search_session_id="session-1", principal_id="principal-1",
                                   investigation_id="investigation-1",
                                   expected_investigation_revision=4, manifold_revision_id="manifold-9")
    assert projection.expires_at == START + LIFETIME
    assert outcome.search_session_id == projection.search_session_id
    clock.value = START + LIFETIME
    assert_code(WebDiscoveryErrorCode.SESSION_EXPIRED,
                lambda: authority.resolve_result(search_session_id="session-1", result_id="any",
                                                 principal_id="principal-1", investigation_id="investigation-1",
                                                 expected_investigation_revision=4,
                                                 manifold_revision_id="manifold-9"))


def test_request_cannot_choose_a_different_lifetime():
    bad = request(now=START)
    bad = SearchRequest(*[getattr(bad, field.name) for field in bad.__dataclass_fields__.values()][:-1],
                        START + timedelta(hours=1))
    assert_code(WebDiscoveryErrorCode.INVALID_REQUEST,
                lambda: owner().search(bad, DeterministicWebDiscoveryFixture(), Cancellation()))


@pytest.mark.parametrize("changed,code", [
    ({"principal_id": "other"}, WebDiscoveryErrorCode.PRINCIPAL_MISMATCH),
    ({"investigation_id": "other"}, WebDiscoveryErrorCode.INVESTIGATION_MISMATCH),
    ({"expected_investigation_revision": 5}, WebDiscoveryErrorCode.INVESTIGATION_REVISION_MISMATCH),
    ({"manifold_revision_id": "other"}, WebDiscoveryErrorCode.MANIFOLD_REVISION_MISMATCH),
])
def test_session_authority_rejects_scope_mismatches(changed, code):
    authority, _, outcome = search()
    arguments = dict(search_session_id="session-1", result_id=outcome.results[0].result_id,
                     principal_id="principal-1", investigation_id="investigation-1",
                     expected_investigation_revision=4, manifold_revision_id="manifold-9")
    arguments.update(changed)
    assert_code(code, lambda: authority.resolve_result(**arguments))


def test_result_from_another_session_is_rejected_as_mismatch():
    authority = owner()
    fixture = DeterministicWebDiscoveryFixture()
    first = authority.search(request(), fixture, Cancellation())
    authority.search(request(session="session-2", operation="operation-2", key="key-2"),
                     fixture, Cancellation())
    assert_code(WebDiscoveryErrorCode.RESULT_MISMATCH,
                lambda: authority.resolve_result(search_session_id="session-2",
                                                 result_id=first.results[0].result_id,
                                                 principal_id="principal-1", investigation_id="investigation-1",
                                                 expected_investigation_revision=4,
                                                 manifold_revision_id="manifold-9"))


def test_identical_idempotent_replay_returns_original_without_execution_or_state():
    authority = owner()
    fixture = DeterministicWebDiscoveryFixture()
    first = authority.search(request(), fixture, Cancellation())
    replay = authority.search(request(), fixture, Cancellation())
    assert replay is first
    assert fixture.execution_count == 1
    assert authority.session_count == 1


def test_idempotency_key_reuse_with_changed_governed_input_fails():
    authority = owner()
    fixture = DeterministicWebDiscoveryFixture()
    authority.search(request(), fixture, Cancellation())
    assert_code(WebDiscoveryErrorCode.IDEMPOTENCY_CONFLICT,
                lambda: authority.search(request(query="multiple"), fixture, Cancellation()))


def test_result_and_metadata_limits_fail_closed():
    with pytest.raises(WebDiscoveryError):
        request(limit=MAX_RESULT_LIMIT + 1)
    from isees_uap.candidate_evidence.web_discovery import SearchResult
    normalized = normalize_web_discovery_url("https://example.test")
    with pytest.raises(WebDiscoveryError):
        SearchResult("r", "s", None, 1, "t", normalized.original_url,
                     normalized.normalized_url, normalized.normalized_url,
                     normalized.display_domain, "s", None, "a",
                     provider_metadata=(("notAllowlisted", "value"),))


@pytest.mark.parametrize("url", [
    "not a url", "ftp://example.test/a", "https://user:password@example.test/a",
    "https://example.test/a\nheader", "https://example.test:8443/a",
])
def test_web_url_policy_rejects_malformed_unsafe_or_disallowed_urls(url):
    with pytest.raises(UrlNormalizationError):
        normalize_web_discovery_url(url)


@pytest.mark.parametrize("url", [
    "http://localhost", "https://a.localhost/x", "https://printer", "https://a.local/x",
    "https://a.internal/x", "https://a.home/x", "https://a.lan/x",
    "http://127.0.0.1", "http://10.0.0.1", "http://172.16.0.1", "http://192.168.0.1",
    "http://169.254.1.1", "http://224.0.0.1", "http://0.0.0.0", "http://100.64.0.1",
    "http://192.0.2.1", "http://198.18.0.1", "http://240.0.0.1",
    "http://[::1]", "http://[fe80::1]", "http://[ff02::1]", "http://[::]",
    "http://[2001:db8::1]", "http://2130706433", "http://0177.0.0.1", "http://0x7f.0.0.1",
    "http://[fe80::1%25eth0]", "http://[::1", "http://example.com:443:80",
    "https://xn--invalid-.com", "https://xn--a.com",
])
def test_web_url_policy_rejects_local_private_reserved_and_ambiguous_authorities(url):
    with pytest.raises(UrlNormalizationError):
        normalize_web_discovery_url(url)


def test_public_ip_and_strict_idna_normalization_pass_without_network(monkeypatch):
    import socket
    monkeypatch.setattr(socket, "getaddrinfo", lambda *args, **kwargs: pytest.fail("DNS attempted"))
    assert normalize_web_discovery_url("https://93.184.216.34/a").display_domain == "93.184.216.34"
    first = normalize_web_discovery_url("HTTPS://BÜCHER.example:443/a#x")
    second = normalize_web_discovery_url("https://xn--bcher-kva.example/a")
    assert first.normalized_url == second.normalized_url == "https://xn--bcher-kva.example/a"


def test_shared_url_normalizer_preserves_original_and_direct_intake_port_semantics():
    value = "HTTPS://Example.COM:443/a/../source?q=1#fragment"
    normalized = normalize_web_discovery_url(value)
    assert normalized.original_url == value
    assert normalized.normalized_url == "https://example.com/a/../source?q=1"
    assert normalized.normalization_version == URL_NORMALIZATION_VERSION
    assert normalize_http_url("https://example.com:8443/a").normalized_url.endswith(":8443/a")


def test_titles_and_snippets_are_explicitly_untrusted_provider_metadata():
    outcome = search()[2]
    assert "untrusted" in outcome.results[0].title.casefold()
    assert "untrusted" in outcome.results[0].snippet.casefold()
    assert "untrusted provider metadata" in outcome.warnings[0].casefold()
    assert not hasattr(outcome.results[0], "canonical_url")


def test_receipt_proves_zero_ai_rex_cost_and_all_downstream_effects():
    receipt = search()[2].receipt
    assert receipt.ai_assistance == receipt.rex_execution == "NONE"
    assert (receipt.estimated_provider_cost, receipt.actual_provider_cost, receipt.final_charge) == (0, 0, 0)
    assert receipt.provider_credits_consumed == 0
    assert receipt.provider_credit_usage.value == "ZERO"
    assert receipt.monetary_cost == receipt.researcher_charge == "0.00"
    assert receipt.billing_triggered is False
    assert {receipt.research_inbox_effect, receipt.publication_effect,
            receipt.candidate_knowledge_effect, receipt.canon_effect, receipt.graph_effect,
            receipt.manifold_effect, receipt.resolve_effect} == {"NONE"}
