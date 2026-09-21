from copy import deepcopy
from io import BytesIO
import sqlite3

from fastapi.testclient import TestClient
from pypdf import PdfReader

from isees_uap.studio.v1.hashing import canonical_sha256
from isees_uap.testing.studio_v1.test_author_api import api
from isees_uap.testing.studio_v1.test_persistence import make_command


def _wire(command, **changes):
    semantic = command.revision.semanticContent.model_dump(exclude_none=True)
    snapshots = [item.model_dump(exclude_none=True) for item in command.snapshots]
    for snapshot in snapshots:
        for source in snapshot["sources"]:
            for representation in source["representations"]:
                representation["contentHash"] = canonical_sha256(representation["content"])
        domain = {key: value for key, value in snapshot.items() if key != "snapshotHash"}
        snapshot["snapshotHash"] = canonical_sha256(domain)
    payload = {
        "sourceKind": "CURRENT_DRAFT",
        "documentId": semantic["documentId"],
        "investigationId": "investigation-1",
        "semanticContent": semantic,
        "sourceSnapshots": snapshots,
        "sourceHash": canonical_sha256(semantic),
        "exportedAt": "2026-09-21T18:00:00.000Z",
        "profile": "INVESTIGATION_REPORT",
        "profileVersion": "investigation-report/v1",
        "templateProfileVersion": "investigation-report-pdf/1",
        "rendererVersion": "studio-v1-reportlab-pdf/1",
        "configurationHash": "sha256:6d1e0783d1fe839271f281ee34b7355a618291c6e31b1282cfc170e297dab200",
    }
    payload.update(changes)
    return payload


def _post(client, payload):
    return client.post("/api/v1/investigations/investigation-1/studio-v1/artifacts/current-draft/exports/pdf",
                       json=payload, headers={"X-ISEES-Current-Draft": "1"})


def _counts(path):
    tables = ("studio_v1_artifacts", "studio_v1_revisions", "studio_v1_projection_jobs",
              "studio_v1_exports", "studio_v1_source_snapshots")
    with sqlite3.connect(path) as db:
        return tuple(db.execute(f"SELECT COUNT(*) FROM {table}").fetchone()[0] for table in tables)


def test_guest_current_draft_is_direct_local_pdf_and_creates_no_durable_state(api):
    application, _, _, tmp_path = api
    command = make_command(projections=0)
    payload = _wire(command)
    before_payload = deepcopy(payload)
    before = _counts(tmp_path / "studio-v1.sqlite3")
    with TestClient(application) as guest:
        response = _post(guest, payload)
    assert response.status_code == 200 and response.content.startswith(b"%PDF-")
    assert response.headers["content-type"] == "application/pdf"
    assert response.headers["content-disposition"].startswith('attachment; filename="')
    assert response.headers["cache-control"] == "private, no-store"
    assert response.headers["pragma"] == "no-cache"
    assert response.headers["x-content-type-options"] == "nosniff"
    assert response.headers["x-studio-source-kind"] == "CURRENT_DRAFT"
    assert response.headers["x-studio-source-hash"] == payload["sourceHash"]
    text = "\n".join(page.extract_text() or "" for page in PdfReader(BytesIO(response.content)).pages)
    assert "LOCAL DRAFT" in text and "CURRENT DRAFT" in text and "Not an authority record" in text
    assert command.revision.semanticContent.title in text and payload["sourceHash"] in text
    assert payload == before_payload
    assert _counts(tmp_path / "studio-v1.sqlite3") == before


def test_guest_current_draft_preserves_relationship_and_scientific_glyphs(api):
    application, _, _, _ = api
    payload = _wire(make_command(projections=0))
    relationship = "E-TICTAC-2004 ↔ E-ROOSEVELT-2015"
    symbols = "→ ← ± ≤ ≥ ≠ × ÷ ° αβγδθλμπσφω ΓΔΘΛΠΣΦΩ"
    payload["semanticContent"]["title"] = relationship
    payload["semanticContent"]["nodes"][0]["text"] = symbols
    payload["sourceHash"] = canonical_sha256(payload["semanticContent"])
    with TestClient(application) as guest:
        response = _post(guest, payload)
        repeat = _post(guest, payload)
    assert response.status_code == 200
    assert response.content == repeat.content
    text = "\n".join(page.extract_text() or "" for page in PdfReader(BytesIO(response.content)).pages)
    assert relationship in text
    assert symbols in text


def test_unchanged_guest_exports_keep_source_hash_and_body_content(api):
    application, _, _, _ = api
    payload = _wire(make_command(projections=0))
    with TestClient(application) as guest:
        first = _post(guest, payload)
        second = _post(guest, {**payload, "exportedAt": "2026-09-21T18:01:00.000Z"})
    assert first.headers["x-studio-source-hash"] == second.headers["x-studio-source-hash"]
    first_text = "\n".join(page.extract_text() or "" for page in PdfReader(BytesIO(first.content)).pages)
    second_text = "\n".join(page.extract_text() or "" for page in PdfReader(BytesIO(second.content)).pages)
    assert first_text.replace("18:00:00.000Z", "TIME") == second_text.replace("18:01:00.000Z", "TIME")


def test_current_draft_rejects_csrf_hash_mismatch_malformed_and_unsupported_glyph(api):
    application, _, _, _ = api
    payload = _wire(make_command(projections=0))
    url = "/api/v1/investigations/investigation-1/studio-v1/artifacts/current-draft/exports/pdf"
    with TestClient(application) as guest:
        assert guest.post(url, json=payload).status_code == 403
        assert _post(guest, {**payload, "sourceHash": "sha256:" + "0" * 64}).status_code == 422
        snapshot_mismatch = deepcopy(payload)
        snapshot_mismatch["sourceSnapshots"][0]["snapshotHash"] = "sha256:" + "0" * 64
        assert _post(guest, snapshot_mismatch).status_code == 422
        assert _post(guest, {**payload, "unexpected": True}).status_code == 422
        oversized = deepcopy(payload)
        oversized["semanticContent"]["nodes"][0]["text"] = "x" * 20_001
        oversized["sourceHash"] = canonical_sha256(oversized["semanticContent"])
        assert _post(guest, oversized).status_code == 422
        unsupported = deepcopy(payload)
        unsupported["semanticContent"]["title"] += " \U0001f6f8"
        unsupported["sourceHash"] = canonical_sha256(unsupported["semanticContent"])
        response = _post(guest, unsupported)
    assert response.status_code == 422
    assert response.headers["content-type"].startswith("application/json")
    assert "unsupported" in response.json()["error"]["message"].lower()
    assert "Current draft content" in response.json()["error"]["message"]
    assert "Saved content" not in response.json()["error"]["message"]
