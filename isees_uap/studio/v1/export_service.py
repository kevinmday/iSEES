"""Explicit saved-revision Studio V1 export orchestration."""
from __future__ import annotations

from dataclasses import replace
from datetime import datetime, timedelta
import hashlib
import re
from threading import RLock

from .hashing import canonical_serialize
from .output_store import OutputStoreFailure, StudioOutputStore
from .pdf_renderer import CONFIGURATION_HASH, MEDIA_TYPE, RENDERER_VERSION, TEMPLATE_VERSION, render_pdf
from .docx_renderer import (CONFIGURATION_HASH as DOCX_CONFIGURATION_HASH,
    MEDIA_TYPE as DOCX_MEDIA_TYPE, RENDERER_VERSION as DOCX_RENDERER_VERSION,
    TEMPLATE_VERSION as DOCX_TEMPLATE_VERSION, render_docx)
from .persistence import ExportRecord, FailureCode, StudioV1Failure
from .render_model import RenderModelFailure, build_render_model
from .manifold_artifact_renderer import (
    CONFIGURATION_HASH as MANIFOLD_CONFIGURATION_HASH,
    FILENAME_EXTENSION as MANIFOLD_FILENAME_EXTENSION,
    MEDIA_TYPE as MANIFOLD_MEDIA_TYPE,
    RENDERER_VERSION as MANIFOLD_RENDERER_VERSION,
    TEMPLATE_VERSION as MANIFOLD_TEMPLATE_VERSION,
    ManifoldArtifactRenderFailure, render_manifold_artifact,
    CONFIGURATION_IDENTITY as MANIFOLD_CONFIGURATION_IDENTITY,
    CONFIGURATION_VERSION as MANIFOLD_CONFIGURATION_VERSION,
    ALTERNATE_CONFIGURATION_HASH as MANIFOLD_ALTERNATE_CONFIGURATION_HASH,
    ALTERNATE_CONFIGURATION_IDENTITY as MANIFOLD_ALTERNATE_CONFIGURATION_IDENTITY,
    ALTERNATE_CONFIGURATION_VERSION as MANIFOLD_ALTERNATE_CONFIGURATION_VERSION,
    ManifoldArtifactConfiguration,
)

_HASH = re.compile(r"^sha256:[0-9a-f]{64}$")


def _digest(value: object) -> str:
    return hashlib.sha256(canonical_serialize(value).encode("utf-8")).hexdigest()


def _filename(title: str, revision_number: int, exported_at: str, extension: str = "pdf") -> str:
    slug = re.sub(r"[^a-z0-9]+", "-", title.lower()).strip("-")[:80] or "investigation-report"
    stamp = exported_at.replace("-", "").replace(":", "").split(".", 1)[0] + "Z"
    return f"isees-{slug}-r{revision_number:04d}-{stamp}.{extension}"


def _projection_filename(artifact_id: str, revision_number: int) -> str:
    slug = re.sub(r"[^a-z0-9]+", "-", artifact_id.lower()).strip("-")[:80] or "artifact"
    return f"isees-{slug}-r{revision_number:04d}.{MANIFOLD_FILENAME_EXTENSION}"


class StudioV1ExportService:
    def __init__(self, store, output_store: StudioOutputStore, application_instance_id: str,
                 lease_duration: timedelta):
        self.store, self.outputs = store, output_store
        self.worker_id, self.lease_duration = f"{application_instance_id}:export", lease_duration
        self._materialization_lock = RLock()

    def create(self, owner: str, investigation: str, artifact: str, revision_id: str, *,
               format: str, template_version: str, renderer_version: str,
               configuration_hash: str, idempotency_key: str, exported_at: str) -> ExportRecord:
        with self._materialization_lock:
            return self._create(owner, investigation, artifact, revision_id, format=format,
                template_version=template_version, renderer_version=renderer_version,
                configuration_hash=configuration_hash, idempotency_key=idempotency_key,
                exported_at=exported_at)

    def _create(self, owner: str, investigation: str, artifact: str, revision_id: str, *,
               format: str, template_version: str, renderer_version: str,
               configuration_hash: str, idempotency_key: str, exported_at: str) -> ExportRecord:
        profiles = {"PDF": (TEMPLATE_VERSION, RENDERER_VERSION, CONFIGURATION_HASH, MEDIA_TYPE, render_pdf, "pdf"),
                    "DOCX": (DOCX_TEMPLATE_VERSION, DOCX_RENDERER_VERSION, DOCX_CONFIGURATION_HASH, DOCX_MEDIA_TYPE, render_docx, "docx"),
                    "MANIFOLD_ARTIFACT": (MANIFOLD_TEMPLATE_VERSION, MANIFOLD_RENDERER_VERSION,
                        (MANIFOLD_CONFIGURATION_HASH, MANIFOLD_ALTERNATE_CONFIGURATION_HASH), MANIFOLD_MEDIA_TYPE,
                        render_manifold_artifact, MANIFOLD_FILENAME_EXTENSION)}
        selected = profiles.get(format)
        if (selected is None or template_version != selected[0] or renderer_version != selected[1]
                or (configuration_hash not in selected[2] if isinstance(selected[2], tuple)
                    else configuration_hash != selected[2]) or not _HASH.fullmatch(configuration_hash)
                or not idempotency_key.strip() or len(idempotency_key) > 200):
            raise StudioV1Failure(FailureCode.EXPORT_CONFIGURATION_INVALID, "Export configuration is invalid.")
        revision = self.store.get_revision(owner, investigation, artifact, revision_id)
        fingerprint = "sha256:" + _digest({"owner":owner,"investigation":investigation,"artifact":artifact,
            "revision":revision_id,"format":format,"template":template_version,"renderer":renderer_version,
            "configurationHash":configuration_hash})
        identity = _digest({"fingerprint":fingerprint,"idempotencyKey":idempotency_key})
        projection_identity = _digest({"artifactId":artifact,"revisionId":revision_id,
            "parentContentHash":revision.contentHash,"format":format,
            "templateProfileVersion":template_version,"rendererVersion":renderer_version,
            "configurationHash":configuration_hash})
        export_id, projection_id = f"export-{identity}", f"studio-v1-projection-{projection_identity}"
        job_id = f"job-{projection_id}"
        record = ExportRecord(export_id, projection_id, job_id, owner, investigation, artifact,
            revision_id, revision.revisionNumber, revision.contentHash, format, renderer_version,
            template_version, configuration_hash, exported_at, "QUEUED", None, None, None, None,
            None, None, None, exported_at, None)
        record = self.store.create_export(record, idempotency_key, fingerprint)
        if format == "MANIFOLD_ARTIFACT":
            config_identity, config_version = (
                (MANIFOLD_ALTERNATE_CONFIGURATION_IDENTITY, MANIFOLD_ALTERNATE_CONFIGURATION_VERSION)
                if configuration_hash == MANIFOLD_ALTERNATE_CONFIGURATION_HASH
                else (MANIFOLD_CONFIGURATION_IDENTITY, MANIFOLD_CONFIGURATION_VERSION))
            self.store.register_manifold_materialization(record.projection_id, record.export_id,
                config_identity, config_version)
        if record.state == "CURRENT" and record.storage_key:
            return record
        lease_id = "lease-" + identity
        now = exported_at
        expires = (datetime.fromisoformat(exported_at.replace("Z", "+00:00")) + self.lease_duration).isoformat(timespec="milliseconds").replace("+00:00", "Z")
        try:
            job = self.store.claim_projection_job(record.job_id, self.worker_id, lease_id, now, expires)
            self.store.update_export_state(export_id, "REBUILDING")
            if format == "MANIFOLD_ARTIFACT":
                artifact_identity = self.store.locate_artifact(owner, investigation, artifact)
                snapshots = tuple(self.store.get_snapshot(owner, investigation, ref.snapshotId)
                                  for ref in revision.sourceSnapshots)
                data = selected[4](artifact_identity, revision, snapshots, investigation,
                    ManifoldArtifactConfiguration(config_identity, config_version, configuration_hash))
                filename = _projection_filename(artifact, revision.revisionNumber)
            else:
                model = build_render_model(revision, investigation)
                data = selected[4](model, exported_at)
                filename = _filename(model.title, revision.revisionNumber, exported_at, selected[5])
            key, output_hash, length = self.outputs.write(export_id, data, format)
            self.store.complete_projection_job(job.job_id, lease_id, now, output_hash)
            return self.store.update_export_state(export_id, "CURRENT", output_hash=output_hash,
                storage_key=key, media_type=selected[3], safe_filename=filename,
                byte_length=length, completed_at=now)
        except (RenderModelFailure, ManifoldArtifactRenderFailure, OutputStoreFailure, Exception) as exc:
            code = exc.code.value if isinstance(exc, (RenderModelFailure, ManifoldArtifactRenderFailure)) else "OUTPUT_STORAGE_FAILURE"
            message = exc.safe_message if isinstance(exc, (RenderModelFailure, ManifoldArtifactRenderFailure)) else (str(exc) if isinstance(exc, OutputStoreFailure) else f"{format} rendering failed safely.")
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

    def projection_status(self, owner, investigation, artifact, revision_id, projection_id):
        return self.store.get_projection_output(owner, investigation, artifact, revision_id, projection_id)

    def download_projection(self, owner, investigation, artifact, revision_id, projection_id):
        record = self.projection_status(owner, investigation, artifact, revision_id, projection_id)
        if record.format != "MANIFOLD_ARTIFACT":
            raise StudioV1Failure(FailureCode.EXPORT_NOT_FOUND, "Projection materialization was not found.")
        if record.state != "CURRENT" or not all((record.storage_key, record.output_hash,
                record.media_type, record.safe_filename, record.byte_length is not None)):
            raise StudioV1Failure(FailureCode.EXPORT_NOT_FOUND, "Projection materialization was not found.")
        try:
            return record, self.outputs.read_verified(record.storage_key, record.output_hash,
                                                      record.byte_length)
        except OutputStoreFailure as exc:
            raise StudioV1Failure(FailureCode.OUTPUT_INTEGRITY_FAILURE,
                                  "Stored projection integrity verification failed.") from exc
