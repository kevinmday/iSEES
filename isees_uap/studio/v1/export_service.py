"""Explicit saved-revision Studio V1 export orchestration."""
from __future__ import annotations

from dataclasses import replace
from datetime import datetime, timedelta
import hashlib
import re

from .hashing import canonical_serialize
from .output_store import OutputStoreFailure, StudioOutputStore
from .pdf_renderer import CONFIGURATION_HASH, MEDIA_TYPE, RENDERER_VERSION, TEMPLATE_VERSION, render_pdf
from .docx_renderer import (CONFIGURATION_HASH as DOCX_CONFIGURATION_HASH,
    MEDIA_TYPE as DOCX_MEDIA_TYPE, RENDERER_VERSION as DOCX_RENDERER_VERSION,
    TEMPLATE_VERSION as DOCX_TEMPLATE_VERSION, render_docx)
from .persistence import ExportRecord, FailureCode, StudioV1Failure
from .render_model import RenderModelFailure, build_render_model

_HASH = re.compile(r"^sha256:[0-9a-f]{64}$")


def _digest(value: object) -> str:
    return hashlib.sha256(canonical_serialize(value).encode("utf-8")).hexdigest()


def _filename(title: str, revision_number: int, exported_at: str, extension: str = "pdf") -> str:
    slug = re.sub(r"[^a-z0-9]+", "-", title.lower()).strip("-")[:80] or "investigation-report"
    stamp = exported_at.replace("-", "").replace(":", "").split(".", 1)[0] + "Z"
    return f"isees-{slug}-r{revision_number:04d}-{stamp}.{extension}"


class StudioV1ExportService:
    def __init__(self, store, output_store: StudioOutputStore, application_instance_id: str,
                 lease_duration: timedelta):
        self.store, self.outputs = store, output_store
        self.worker_id, self.lease_duration = f"{application_instance_id}:export", lease_duration

    def create(self, owner: str, investigation: str, artifact: str, revision_id: str, *,
               format: str, template_version: str, renderer_version: str,
               configuration_hash: str, idempotency_key: str, exported_at: str) -> ExportRecord:
        profiles = {"PDF": (TEMPLATE_VERSION, RENDERER_VERSION, CONFIGURATION_HASH, MEDIA_TYPE, render_pdf, "pdf"),
                    "DOCX": (DOCX_TEMPLATE_VERSION, DOCX_RENDERER_VERSION, DOCX_CONFIGURATION_HASH, DOCX_MEDIA_TYPE, render_docx, "docx")}
        selected = profiles.get(format)
        if (selected is None or template_version != selected[0] or renderer_version != selected[1]
                or configuration_hash != selected[2] or not _HASH.fullmatch(configuration_hash)
                or not idempotency_key.strip() or len(idempotency_key) > 200):
            raise StudioV1Failure(FailureCode.EXPORT_CONFIGURATION_INVALID, "Export configuration is invalid.")
        revision = self.store.get_revision(owner, investigation, artifact, revision_id)
        fingerprint = "sha256:" + _digest({"owner":owner,"investigation":investigation,"artifact":artifact,
            "revision":revision_id,"format":format,"template":template_version,"renderer":renderer_version,
            "configurationHash":configuration_hash})
        identity = _digest({"fingerprint":fingerprint,"idempotencyKey":idempotency_key})
        export_id, projection_id, job_id = f"export-{identity}", f"projection-{identity}", f"job-{identity}"
        record = ExportRecord(export_id, projection_id, job_id, owner, investigation, artifact,
            revision_id, revision.revisionNumber, revision.contentHash, format, renderer_version,
            template_version, configuration_hash, exported_at, "QUEUED", None, None, None, None,
            None, None, None, exported_at, None)
        record = self.store.create_export(record, idempotency_key, fingerprint)
        if record.state == "CURRENT" and record.storage_key:
            return record
        lease_id = "lease-" + identity
        now = exported_at
        expires = (datetime.fromisoformat(exported_at.replace("Z", "+00:00")) + self.lease_duration).isoformat(timespec="milliseconds").replace("+00:00", "Z")
        try:
            job = self.store.claim_projection_job(record.job_id, self.worker_id, lease_id, now, expires)
            self.store.update_export_state(export_id, "REBUILDING")
            model = build_render_model(revision, investigation)
            data = selected[4](model, exported_at)
            key, output_hash, length = self.outputs.write(export_id, data, format)
            self.store.complete_projection_job(job.job_id, lease_id, now, output_hash)
            return self.store.update_export_state(export_id, "CURRENT", output_hash=output_hash,
                storage_key=key, media_type=selected[3], safe_filename=_filename(model.title, revision.revisionNumber, exported_at, selected[5]),
                byte_length=length, completed_at=now)
        except (RenderModelFailure, OutputStoreFailure, Exception) as exc:
            code = exc.code.value if isinstance(exc, RenderModelFailure) else "OUTPUT_STORAGE_FAILURE"
            message = exc.safe_message if isinstance(exc, RenderModelFailure) else (str(exc) if isinstance(exc, OutputStoreFailure) else f"{format} rendering failed safely.")
            try: self.store.fail_projection_job(record.job_id, lease_id, now, code, message)
            except StudioV1Failure: pass
            return self.store.update_export_state(export_id, "FAILED", failure_code=code,
                                                   safe_failure_message=message, completed_at=now)

    def status(self, owner, investigation, artifact, revision_id, export_id):
        return self.store.get_export(owner, investigation, artifact, revision_id, export_id)

    def download(self, owner, investigation, artifact, revision_id, export_id):
        record = self.status(owner, investigation, artifact, revision_id, export_id)
        if record.state != "CURRENT" or not all((record.storage_key, record.output_hash, record.media_type,
                                                  record.safe_filename, record.byte_length is not None)):
            raise StudioV1Failure(FailureCode.EXPORT_NOT_FOUND, "Export was not found.")
        try: return record, self.outputs.read_verified(record.storage_key, record.output_hash, record.byte_length)
        except OutputStoreFailure as exc:
            raise StudioV1Failure(FailureCode.OUTPUT_INTEGRITY_FAILURE, "Stored export integrity verification failed.") from exc
