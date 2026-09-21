from copy import deepcopy
from pathlib import Path

import pytest
from pypdf import PdfReader

from isees_uap.studio.v1.application import compose_private_studio_v1_application
from isees_uap.studio.v1.hashing import canonical_sha256
from isees_uap.studio.v1.output_store import OutputStoreFailure, StudioOutputStore
from isees_uap.testing.studio_v1.test_application import Clock, application, settings
from isees_uap.testing.studio_v1.test_persistence import make_command

CONFIG = "sha256:6d1e0783d1fe839271f281ee34b7355a618291c6e31b1282cfc170e297dab200"


def create(app, command, key="pdf-1"):
    return app.create_export("principal-1", "investigation-1", command.artifact.artifactId,
        command.revision.revisionId, format="PDF", template_version="investigation-report-pdf/1",
        renderer_version="studio-v1-reportlab-pdf/1", configuration_hash=CONFIG, idempotency_key=key)


def test_completed_export_is_parseable_inactive_hash_verified_idempotent_and_restart_safe(tmp_path, monkeypatch):
    app = application(tmp_path); app.start(); command = make_command(projections=0); app.save("principal-1","investigation-1",command)
    monkeypatch.setattr("socket.create_connection", lambda *a, **k: (_ for _ in ()).throw(AssertionError("network forbidden")))
    first = create(app, command); record, data = app.download_export("principal-1","investigation-1",command.artifact.artifactId,command.revision.revisionId,first.export_id)
    assert first.state == "CURRENT" and data.startswith(b"%PDF-") and first.byte_length == len(data)
    assert all(marker not in data for marker in (b"/JavaScript", b"/Launch", b"/EmbeddedFile"))
    text = "\n".join(page.extract_text() or "" for page in PdfReader(Path(first.storage_key) if False else __import__("io").BytesIO(data)).pages)
    assert command.revision.semanticContent.title in text and command.revision.revisionId in text and command.revision.contentHash in text
    replay = create(app, command); assert replay.export_id == first.export_id
    assert app.download_export("principal-1","investigation-1",command.artifact.artifactId,command.revision.revisionId,replay.export_id)[1] == data
    app.close(); reopened = compose_private_studio_v1_application(settings(tmp_path / "studio-v1.sqlite3", identity="restart"), clock=Clock()); reopened.start()
    assert reopened.download_export("principal-1","investigation-1",command.artifact.artifactId,command.revision.revisionId,first.export_id)[1] == data
    reopened.close()


def test_failed_export_does_not_mutate_revision_or_expose_partial_and_prior_success_survives(tmp_path):
    app=application(tmp_path); app.start(); good=make_command(projections=0); app.save("principal-1","investigation-1",good)
    current=create(app,good,"good"); before=app.get_revision("principal-1","investigation-1",good.artifact.artifactId,good.revision.revisionId)
    raw=deepcopy(good.revision.model_dump(exclude_none=True)); raw.update(revisionId="artifact-paper-1.r2",revisionNumber=2,parentRevisionId=good.revision.revisionId,createdAt="2026-09-10T18:05:00.000Z"); raw["semanticContent"]["title"]="Unsupported glyph \U0001f6f8"; raw["contentHash"]=canonical_sha256(raw["semanticContent"])
    bad=make_command(key="save-bad",projections=0,revision=raw,expected=good.revision.revisionId); app.save("principal-1","investigation-1",bad)
    failed=create(app,bad,"bad"); assert failed.state=="FAILED" and failed.storage_key is None and failed.failure_code=="UNSUPPORTED_CONTENT"
    assert failed.safe_failure_message == "Saved revision content contains glyphs unsupported by the governed PDF font."
    assert app.get_revision("principal-1","investigation-1",good.artifact.artifactId,good.revision.revisionId)==before
    assert app.download_export("principal-1","investigation-1",good.artifact.artifactId,good.revision.revisionId,current.export_id)[1].startswith(b"%PDF-")
    app.close()


def test_saved_revision_pdf_preserves_relationship_and_scientific_glyphs(tmp_path):
    app = application(tmp_path); app.start()
    command = make_command(projections=0)
    raw = deepcopy(command.revision.model_dump(exclude_none=True))
    relationship = "E-TICTAC-2004 ↔ E-ROOSEVELT-2015"
    symbols = "→ ← ± ≤ ≥ ≠ × ÷ ° αβγδθλμπσφω ΓΔΘΛΠΣΦΩ"
    raw["semanticContent"]["title"] = relationship
    raw["semanticContent"]["nodes"][0]["text"] = symbols
    raw["contentHash"] = canonical_sha256(raw["semanticContent"])
    command = make_command(projections=0, revision=raw)
    app.save("principal-1", "investigation-1", command)
    export = create(app, command)
    _, data = app.download_export("principal-1", "investigation-1", command.artifact.artifactId,
                                  command.revision.revisionId, export.export_id)
    text = "\n".join(page.extract_text() or "" for page in PdfReader(__import__("io").BytesIO(data)).pages)
    assert relationship in text
    assert symbols in text
    app.close()


def test_storage_path_traversal_is_impossible(tmp_path):
    store=StudioOutputStore(tmp_path / "outputs")
    with pytest.raises(OutputStoreFailure): store._path("../escape.pdf")
