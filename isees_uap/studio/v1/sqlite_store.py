from __future__ import annotations

import json
import sqlite3
from datetime import datetime
from pathlib import Path
from threading import RLock
from typing import Callable

from .hashing import canonical_serialize
from .persistence import FailureCode, ProjectionJob, SaveCommand, SaveResult, StudioV1Failure
from .save_service import projection_identity
from .schemas import ArtifactIdentity, AuthorRevision, FrozenResearchSourceSnapshot
from .validation import validate_projection_transition

ConnectionFactory = Callable[[], sqlite3.Connection]


SCHEMA = """
CREATE TABLE IF NOT EXISTS studio_v1_schema_identity(
 schema_name TEXT PRIMARY KEY, schema_version INTEGER NOT NULL);
CREATE TABLE IF NOT EXISTS studio_v1_artifacts(
 owner_id TEXT NOT NULL, investigation_id TEXT NOT NULL, artifact_id TEXT NOT NULL,
 profile TEXT NOT NULL, profile_capability TEXT NOT NULL, created_at TEXT NOT NULL,
 head_revision_id TEXT, head_revision_number INTEGER NOT NULL DEFAULT 0,
 PRIMARY KEY(owner_id, investigation_id, artifact_id));
CREATE TABLE IF NOT EXISTS studio_v1_revisions(
 owner_id TEXT NOT NULL, investigation_id TEXT NOT NULL, artifact_id TEXT NOT NULL,
 revision_id TEXT NOT NULL, revision_number INTEGER NOT NULL, parent_revision_id TEXT,
 content_hash TEXT NOT NULL, revision_json TEXT NOT NULL, created_at TEXT NOT NULL,
 PRIMARY KEY(owner_id, investigation_id, artifact_id, revision_id),
 UNIQUE(owner_id, investigation_id, artifact_id, revision_number),
 FOREIGN KEY(owner_id, investigation_id, artifact_id) REFERENCES studio_v1_artifacts(owner_id, investigation_id, artifact_id));
CREATE TABLE IF NOT EXISTS studio_v1_source_snapshots(
 owner_id TEXT NOT NULL, investigation_id TEXT NOT NULL, snapshot_id TEXT NOT NULL,
 snapshot_hash TEXT NOT NULL, snapshot_json TEXT NOT NULL, captured_at TEXT NOT NULL,
 PRIMARY KEY(owner_id, investigation_id, snapshot_id));
CREATE TABLE IF NOT EXISTS studio_v1_source_representations(
 owner_id TEXT NOT NULL, investigation_id TEXT NOT NULL, snapshot_id TEXT NOT NULL,
 anchor_id TEXT NOT NULL, representation_id TEXT NOT NULL, media_type TEXT NOT NULL,
 schema_version TEXT NOT NULL, content_hash TEXT NOT NULL, content TEXT NOT NULL,
 sensitivity_json TEXT NOT NULL, PRIMARY KEY(owner_id, investigation_id, snapshot_id, anchor_id, representation_id),
 FOREIGN KEY(owner_id, investigation_id, snapshot_id) REFERENCES studio_v1_source_snapshots(owner_id, investigation_id, snapshot_id));
CREATE TABLE IF NOT EXISTS studio_v1_revision_snapshots(
 owner_id TEXT NOT NULL, investigation_id TEXT NOT NULL, artifact_id TEXT NOT NULL,
 revision_id TEXT NOT NULL, ordinal INTEGER NOT NULL, snapshot_id TEXT NOT NULL, snapshot_hash TEXT NOT NULL,
 PRIMARY KEY(owner_id, investigation_id, artifact_id, revision_id, ordinal),
 UNIQUE(owner_id, investigation_id, artifact_id, revision_id, snapshot_id),
 FOREIGN KEY(owner_id, investigation_id, artifact_id, revision_id) REFERENCES studio_v1_revisions(owner_id, investigation_id, artifact_id, revision_id),
 FOREIGN KEY(owner_id, investigation_id, snapshot_id) REFERENCES studio_v1_source_snapshots(owner_id, investigation_id, snapshot_id));
CREATE TABLE IF NOT EXISTS studio_v1_enabled_projections(
 owner_id TEXT NOT NULL, investigation_id TEXT NOT NULL, artifact_id TEXT NOT NULL, revision_id TEXT NOT NULL,
 format TEXT NOT NULL, template_profile_version TEXT NOT NULL, renderer_version TEXT NOT NULL, configuration_hash TEXT NOT NULL,
 prior_successful_projection_id TEXT, PRIMARY KEY(owner_id, investigation_id, artifact_id, revision_id, format, template_profile_version, renderer_version, configuration_hash));
CREATE TABLE IF NOT EXISTS studio_v1_projection_jobs(
 job_id TEXT PRIMARY KEY, projection_id TEXT NOT NULL UNIQUE, owner_id TEXT NOT NULL, investigation_id TEXT NOT NULL,
 artifact_id TEXT NOT NULL, revision_id TEXT NOT NULL, parent_content_hash TEXT NOT NULL, format TEXT NOT NULL,
 template_profile_version TEXT NOT NULL, renderer_version TEXT NOT NULL, configuration_hash TEXT NOT NULL,
 state TEXT NOT NULL, created_at TEXT NOT NULL, attempt_count INTEGER NOT NULL DEFAULT 0, max_attempts INTEGER NOT NULL,
 lease_id TEXT, lease_owner TEXT, lease_expires_at TEXT, failure_code TEXT, safe_failure_message TEXT, output_hash TEXT,
 prior_successful_projection_id TEXT,
 UNIQUE(owner_id, investigation_id, artifact_id, revision_id, format, template_profile_version, renderer_version, configuration_hash),
 FOREIGN KEY(owner_id, investigation_id, artifact_id, revision_id) REFERENCES studio_v1_revisions(owner_id, investigation_id, artifact_id, revision_id));
CREATE TABLE IF NOT EXISTS studio_v1_projection_attempts(
 job_id TEXT NOT NULL, attempt_number INTEGER NOT NULL, lease_id TEXT NOT NULL, worker_id TEXT NOT NULL,
 claimed_at TEXT NOT NULL, lease_expires_at TEXT NOT NULL, completed_at TEXT, outcome TEXT, failure_code TEXT, safe_failure_message TEXT,
 PRIMARY KEY(job_id, attempt_number), FOREIGN KEY(job_id) REFERENCES studio_v1_projection_jobs(job_id));
CREATE TABLE IF NOT EXISTS studio_v1_idempotency_commands(
 owner_id TEXT NOT NULL, investigation_id TEXT NOT NULL, operation TEXT NOT NULL, idempotency_key TEXT NOT NULL,
 request_fingerprint TEXT NOT NULL, result_json TEXT NOT NULL, created_at TEXT NOT NULL,
 PRIMARY KEY(owner_id, investigation_id, operation, idempotency_key));
CREATE TRIGGER IF NOT EXISTS studio_v1_revisions_immutable BEFORE UPDATE ON studio_v1_revisions BEGIN SELECT RAISE(ABORT,'immutable revision'); END;
CREATE TRIGGER IF NOT EXISTS studio_v1_snapshots_immutable BEFORE UPDATE ON studio_v1_source_snapshots BEGIN SELECT RAISE(ABORT,'immutable snapshot'); END;
CREATE TRIGGER IF NOT EXISTS studio_v1_representations_immutable BEFORE UPDATE ON studio_v1_source_representations BEGIN SELECT RAISE(ABORT,'immutable representation'); END;
"""


class SQLiteStudioV1Store:
    def __init__(self, path: str | Path | None = None, *, connection_factory: ConnectionFactory | None = None,
                 max_attempts: int = 3, failure_injector: Callable[[str], None] | None = None):
        if path is None and connection_factory is None: raise ValueError("explicit database path or connection factory required")
        self.path = Path(path) if path is not None else None
        self._factory = connection_factory
        self.max_attempts = max_attempts
        self._inject = failure_injector or (lambda _: None)
        self._closed = False
        self._connections = []
        self._connections_lock = RLock()

    def _connect(self):
        if self._closed:
            self._fail(FailureCode.APPLICATION_CLOSED, "Studio application persistence is closed.")
        db = self._factory() if self._factory else sqlite3.connect(self.path, timeout=10, isolation_level=None)
        db.row_factory = sqlite3.Row
        db.execute("PRAGMA foreign_keys=ON")
        try: db.execute("PRAGMA journal_mode=WAL")
        except sqlite3.DatabaseError: pass
        with self._connections_lock: self._connections.append(db)
        return db

    def initialize_schema(self):
        try:
            with self._connect() as db:
                existing = db.execute(
                    "SELECT name FROM sqlite_master WHERE type='table' AND name='studio_v1_schema_identity'"
                ).fetchone()
                if existing:
                    row = db.execute(
                        "SELECT schema_version FROM studio_v1_schema_identity WHERE schema_name='STUDIO_V1'"
                    ).fetchone()
                    if row and row[0] != 1:
                        self._fail(FailureCode.INCOMPATIBLE_SCHEMA_VERSION,
                                   "The Studio V1 persistence schema is incompatible.")
                db.executescript(SCHEMA)
                db.execute("INSERT OR IGNORE INTO studio_v1_schema_identity VALUES('STUDIO_V1',1)")
        except StudioV1Failure: raise
        except sqlite3.Error as exc:
            self._fail(FailureCode.PERSISTENCE_UNAVAILABLE, "Studio persistence is unavailable.", exc)

    def verify_schema_version(self, expected_version):
        if expected_version != 1:
            self._fail(FailureCode.INCOMPATIBLE_SCHEMA_VERSION,
                       "The requested Studio V1 schema version is incompatible.")
        try:
            with self._connect() as db:
                if db.execute("PRAGMA foreign_keys").fetchone()[0] != 1:
                    self._fail(FailureCode.APPLICATION_START_FAILED,
                               "Studio persistence foreign-key enforcement is unavailable.")
                row = db.execute(
                    "SELECT schema_version FROM studio_v1_schema_identity WHERE schema_name='STUDIO_V1'"
                ).fetchone()
                if not row or row[0] != expected_version:
                    self._fail(FailureCode.INCOMPATIBLE_SCHEMA_VERSION,
                               "The Studio V1 persistence schema is incompatible.")
        except StudioV1Failure: raise
        except sqlite3.Error as exc:
            self._fail(FailureCode.PERSISTENCE_UNAVAILABLE, "Studio persistence is unavailable.", exc)

    def close(self):
        with self._connections_lock:
            if self._closed: return
            self._closed = True
            for connection in self._connections:
                try: connection.close()
                except sqlite3.Error: pass
            self._connections.clear()

    def _fail(self, code, message, exc=None): raise StudioV1Failure(code, message) from exc

    def append_revision_and_jobs(self, c: SaveCommand) -> SaveResult:
        owner, inv, aid = c.artifact.authorPrincipalId, c.artifact.investigationId, c.artifact.artifactId
        try:
            with self._connect() as db:
                db.execute("BEGIN IMMEDIATE")
                prior = db.execute("SELECT request_fingerprint,result_json FROM studio_v1_idempotency_commands WHERE owner_id=? AND investigation_id=? AND operation=? AND idempotency_key=?", (owner,inv,c.operation,c.idempotency_key)).fetchone()
                if prior:
                    if prior["request_fingerprint"] != c.request_fingerprint: self._fail(FailureCode.IDEMPOTENCY_KEY_REUSE,"Idempotency key was used for a different request.")
                    value=json.loads(prior["result_json"]); value["job_ids"]=tuple(value["job_ids"]); db.commit(); return SaveResult(**value, replayed=True)
                row=db.execute("SELECT * FROM studio_v1_artifacts WHERE artifact_id=?",(aid,)).fetchone()
                if row and row["owner_id"] != owner: self._fail(FailureCode.AUTHORITY_MISMATCH,"Artifact belongs to a different owner.")
                if row and row["investigation_id"] != inv: self._fail(FailureCode.INVESTIGATION_MISMATCH,"Artifact belongs to a different investigation.")
                if row and (row["profile"] != c.artifact.profile
                            or row["profile_capability"] != c.artifact.profileCapability
                            or row["created_at"] != c.artifact.createdAt):
                    self._fail(FailureCode.REVISION_IDENTITY_CONFLICT,
                               "Artifact identity conflicts with the saved authority.")
                if not row:
                    if c.expected_head_revision_id is not None or c.revision.revisionNumber != 1: self._fail(FailureCode.REVISION_CONFLICT,"Expected artifact head is stale.")
                    db.execute("INSERT INTO studio_v1_artifacts VALUES(?,?,?,?,?,?,NULL,0)",(owner,inv,aid,c.artifact.profile,c.artifact.profileCapability,c.artifact.createdAt))
                    head=None; number=0
                else: head,number=row["head_revision_id"],row["head_revision_number"]
                if head != c.expected_head_revision_id: self._fail(FailureCode.REVISION_CONFLICT,"Expected artifact head is stale.")
                if c.revision.revisionNumber != number+1 or c.revision.parentRevisionId != head: self._fail(FailureCode.REVISION_IDENTITY_CONFLICT,"Revision lineage is invalid.")
                self._inject("artifact")
                provided={x.snapshotId:x for x in c.snapshots}
                for ref in c.revision.sourceSnapshots:
                    snap=provided.get(ref.snapshotId)
                    existing=db.execute("SELECT snapshot_hash,snapshot_json FROM studio_v1_source_snapshots WHERE owner_id=? AND investigation_id=? AND snapshot_id=?",(owner,inv,ref.snapshotId)).fetchone()
                    if snap and snap.investigationId != inv: self._fail(FailureCode.INVESTIGATION_MISMATCH,"Snapshot belongs to another investigation.")
                    if not snap and not existing: self._fail(FailureCode.SNAPSHOT_NOT_FOUND,"Referenced snapshot was not found.")
                    actual=snap.snapshotHash if snap else existing["snapshot_hash"]
                    if actual != ref.snapshotHash: self._fail(FailureCode.SNAPSHOT_HASH_MISMATCH,"Snapshot hash does not match its reference.")
                    if existing and snap and existing["snapshot_json"] != canonical_serialize(snap.model_dump(exclude_none=True)): self._fail(FailureCode.SNAPSHOT_IMMUTABILITY_CONFLICT,"Frozen snapshot identity already has different content.")
                    if snap and not existing:
                        db.execute("INSERT INTO studio_v1_source_snapshots VALUES(?,?,?,?,?,?)",(owner,inv,snap.snapshotId,snap.snapshotHash,canonical_serialize(snap.model_dump(exclude_none=True)),snap.capturedAt))
                        for source in snap.sources:
                            sensitivity=canonical_serialize(source.sensitivity.model_dump())
                            for rep in source.representations: db.execute("INSERT INTO studio_v1_source_representations VALUES(?,?,?,?,?,?,?,?,?,?)",(owner,inv,snap.snapshotId,source.anchorId,rep.representationId,rep.mediaType,rep.schemaVersion,rep.contentHash,rep.content,sensitivity))
                self._inject("snapshots")
                db.execute("INSERT INTO studio_v1_revisions VALUES(?,?,?,?,?,?,?,?,?)",(owner,inv,aid,c.revision.revisionId,c.revision.revisionNumber,c.revision.parentRevisionId,c.revision.contentHash,canonical_serialize(c.revision.model_dump(exclude_none=True)),c.revision.createdAt))
                for n,ref in enumerate(c.revision.sourceSnapshots): db.execute("INSERT INTO studio_v1_revision_snapshots VALUES(?,?,?,?,?,?,?)",(owner,inv,aid,c.revision.revisionId,n,ref.snapshotId,ref.snapshotHash))
                self._inject("revision")
                changed=db.execute("UPDATE studio_v1_artifacts SET head_revision_id=?,head_revision_number=? WHERE owner_id=? AND investigation_id=? AND artifact_id=? AND head_revision_id IS ?",(c.revision.revisionId,c.revision.revisionNumber,owner,inv,aid,head)).rowcount
                if changed != 1: self._fail(FailureCode.REVISION_CONFLICT,"Expected artifact head is stale.")
                self._inject("head")
                jobs=[]
                for spec in c.projections:
                    pid=projection_identity(c,spec); jid=f"job-{pid}"
                    db.execute("INSERT INTO studio_v1_enabled_projections VALUES(?,?,?,?,?,?,?,?,?)",(owner,inv,aid,c.revision.revisionId,spec.format,spec.template_profile_version,spec.renderer_version,spec.configuration_hash,spec.prior_successful_projection_id))
                    db.execute("INSERT INTO studio_v1_projection_jobs VALUES(?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)",(jid,pid,owner,inv,aid,c.revision.revisionId,c.revision.contentHash,spec.format,spec.template_profile_version,spec.renderer_version,spec.configuration_hash,"QUEUED",c.command_timestamp,0,self.max_attempts,None,None,None,None,None,None,spec.prior_successful_projection_id))
                    jobs.append(jid)
                self._inject("jobs")
                result=SaveResult(aid,c.revision.revisionId,c.revision.revisionNumber,tuple(jobs))
                data={"artifact_id":result.artifact_id,"revision_id":result.revision_id,"revision_number":result.revision_number,"job_ids":result.job_ids}
                db.execute("INSERT INTO studio_v1_idempotency_commands VALUES(?,?,?,?,?,?,?)",(owner,inv,c.operation,c.idempotency_key,c.request_fingerprint,canonical_serialize(data),c.command_timestamp))
                self._inject("idempotency"); db.commit(); return result
        except StudioV1Failure: raise
        except sqlite3.IntegrityError as exc: self._fail(FailureCode.REVISION_IDENTITY_CONFLICT,"Persistence constraint rejected the command.",exc)
        except sqlite3.Error as exc: self._fail(FailureCode.PERSISTENCE_UNAVAILABLE,"Studio persistence is unavailable.",exc)

    def _scoped_artifact(self, db, owner, inv, aid):
        row=db.execute("SELECT * FROM studio_v1_artifacts WHERE artifact_id=?",(aid,)).fetchone()
        if not row: self._fail(FailureCode.ARTIFACT_NOT_FOUND,"Artifact was not found.")
        if row["owner_id"] != owner: self._fail(FailureCode.AUTHORITY_MISMATCH,"Artifact belongs to a different owner.")
        if row["investigation_id"] != inv: self._fail(FailureCode.INVESTIGATION_MISMATCH,"Artifact belongs to a different investigation.")
        return row

    def locate_artifact(self, owner_id, investigation_id, artifact_id):
        with self._connect() as db: row=self._scoped_artifact(db,owner_id,investigation_id,artifact_id)
        return ArtifactIdentity.model_validate({"artifactId":row["artifact_id"],"investigationId":row["investigation_id"],
            "authorPrincipalId":row["owner_id"],"profile":row["profile"],"profileCapability":row["profile_capability"],
            "lifecycleClassification":"CANDIDATE_KNOWLEDGE","createdAt":row["created_at"],
            "currentSavedRevisionId":row["head_revision_id"],"workingDraft":{"state":"UNSAVED","basedOnRevisionId":row["head_revision_id"]}})

    def get_idempotency_result(self, owner_id, investigation_id, operation, idempotency_key, request_fingerprint):
        with self._connect() as db: row=db.execute("SELECT request_fingerprint,result_json FROM studio_v1_idempotency_commands WHERE owner_id=? AND investigation_id=? AND operation=? AND idempotency_key=?",(owner_id,investigation_id,operation,idempotency_key)).fetchone()
        if not row: return None
        if row["request_fingerprint"] != request_fingerprint: self._fail(FailureCode.IDEMPOTENCY_KEY_REUSE,"Idempotency key was used for a different request.")
        value=json.loads(row["result_json"]); value["job_ids"]=tuple(value["job_ids"]); return SaveResult(**value,replayed=True)

    def get_revision(self, owner_id, investigation_id, artifact_id, revision_id):
        with self._connect() as db:
            self._scoped_artifact(db,owner_id,investigation_id,artifact_id)
            row=db.execute("SELECT revision_json FROM studio_v1_revisions WHERE owner_id=? AND investigation_id=? AND artifact_id=? AND revision_id=?",(owner_id,investigation_id,artifact_id,revision_id)).fetchone()
            if not row: self._fail(FailureCode.REVISION_IDENTITY_CONFLICT,"Revision was not found.")
            return AuthorRevision.model_validate_json(row[0])

    def get_artifact_head(self, owner_id, investigation_id, artifact_id):
        with self._connect() as db: row=self._scoped_artifact(db,owner_id,investigation_id,artifact_id)
        return None if row["head_revision_id"] is None else self.get_revision(owner_id,investigation_id,artifact_id,row["head_revision_id"])

    def list_revisions(self, owner_id, investigation_id, artifact_id):
        with self._connect() as db:
            self._scoped_artifact(db,owner_id,investigation_id,artifact_id)
            rows=db.execute("SELECT revision_json FROM studio_v1_revisions WHERE owner_id=? AND investigation_id=? AND artifact_id=? ORDER BY revision_number,revision_id",(owner_id,investigation_id,artifact_id)).fetchall()
        return tuple(AuthorRevision.model_validate_json(x[0]) for x in rows)

    def get_snapshot(self, owner_id, investigation_id, snapshot_id):
        with self._connect() as db: row=db.execute("SELECT snapshot_json FROM studio_v1_source_snapshots WHERE owner_id=? AND investigation_id=? AND snapshot_id=?",(owner_id,investigation_id,snapshot_id)).fetchone()
        if not row: self._fail(FailureCode.SNAPSHOT_NOT_FOUND,"Snapshot was not found.")
        return FrozenResearchSourceSnapshot.model_validate_json(row[0])

    @staticmethod
    def _job(row): return ProjectionJob(**{k:row[k] for k in ProjectionJob.__dataclass_fields__})
    def list_projection_jobs(self, owner_id, investigation_id, artifact_id=None):
        sql="SELECT * FROM studio_v1_projection_jobs WHERE owner_id=? AND investigation_id=?"; args=[owner_id,investigation_id]
        if artifact_id is not None: sql += " AND artifact_id=?"; args.append(artifact_id)
        with self._connect() as db: rows=db.execute(sql+" ORDER BY created_at,job_id",args).fetchall()
        return tuple(self._job(x) for x in rows)

    def _transition(self, db, row, target):
        try: validate_projection_transition(row["state"],target)
        except ValueError as exc: self._fail(FailureCode.ILLEGAL_PROJECTION_TRANSITION,"Projection transition is not permitted.",exc)

    def claim_projection_job(self, job_id, worker_id, lease_id, now, lease_expires_at):
        with self._connect() as db:
            db.execute("BEGIN IMMEDIATE"); row=db.execute("SELECT * FROM studio_v1_projection_jobs WHERE job_id=?",(job_id,)).fetchone()
            if not row: self._fail(FailureCode.ARTIFACT_NOT_FOUND,"Projection job was not found.")
            if row["state"] == "REBUILDING" and row["lease_expires_at"] > now: self._fail(FailureCode.LEASE_CONFLICT,"Projection job is already leased.")
            if row["state"] == "REBUILDING": db.execute("UPDATE studio_v1_projection_jobs SET state='FAILED',lease_id=NULL,lease_owner=NULL,lease_expires_at=NULL,failure_code='LEASE_EXPIRED',safe_failure_message='Projection lease expired.' WHERE job_id=?",(job_id,)); row=db.execute("SELECT * FROM studio_v1_projection_jobs WHERE job_id=?",(job_id,)).fetchone()
            if row["state"] == "FAILED": db.execute("UPDATE studio_v1_projection_jobs SET state='QUEUED',failure_code=NULL,safe_failure_message=NULL WHERE job_id=?",(job_id,)); row=db.execute("SELECT * FROM studio_v1_projection_jobs WHERE job_id=?",(job_id,)).fetchone()
            if row["attempt_count"] >= row["max_attempts"]: self._fail(FailureCode.ATTEMPT_LIMIT_REACHED,"Projection attempt limit reached.")
            self._transition(db,row,"REBUILDING"); attempt=row["attempt_count"]+1
            db.execute("UPDATE studio_v1_projection_jobs SET state='REBUILDING',attempt_count=?,lease_id=?,lease_owner=?,lease_expires_at=? WHERE job_id=?",(attempt,lease_id,worker_id,lease_expires_at,job_id))
            db.execute("INSERT INTO studio_v1_projection_attempts(job_id,attempt_number,lease_id,worker_id,claimed_at,lease_expires_at) VALUES(?,?,?,?,?,?)",(job_id,attempt,lease_id,worker_id,now,lease_expires_at)); db.commit()
            return self._job(db.execute("SELECT * FROM studio_v1_projection_jobs WHERE job_id=?",(job_id,)).fetchone())

    def _finish(self, job_id, lease_id, now, target, output_hash=None, code=None, message=None):
        with self._connect() as db:
            db.execute("BEGIN IMMEDIATE"); row=db.execute("SELECT * FROM studio_v1_projection_jobs WHERE job_id=?",(job_id,)).fetchone()
            if not row or row["lease_id"] != lease_id: self._fail(FailureCode.LEASE_CONFLICT,"Active projection lease does not match.")
            if row["lease_expires_at"] <= now: self._fail(FailureCode.LEASE_EXPIRED,"Projection lease has expired.")
            self._transition(db,row,target)
            db.execute("UPDATE studio_v1_projection_jobs SET state=?,lease_id=NULL,lease_owner=NULL,lease_expires_at=NULL,output_hash=?,failure_code=?,safe_failure_message=? WHERE job_id=?",(target,output_hash,code,message,job_id))
            db.execute("UPDATE studio_v1_projection_attempts SET completed_at=?,outcome=?,failure_code=?,safe_failure_message=? WHERE job_id=? AND attempt_number=?",(now,target,code,message,job_id,row["attempt_count"])); db.commit()
            return self._job(db.execute("SELECT * FROM studio_v1_projection_jobs WHERE job_id=?",(job_id,)).fetchone())
    def complete_projection_job(self, job_id, lease_id, now, output_hash): return self._finish(job_id,lease_id,now,"CURRENT",output_hash=output_hash)
    def fail_projection_job(self, job_id, lease_id, now, failure_code, safe_message):
        if not failure_code.strip() or not safe_message.strip() or len(safe_message)>500 or any(x in safe_message.lower() for x in ("traceback","password","api_key","c:\\","/home/")): self._fail(FailureCode.ILLEGAL_PROJECTION_TRANSITION,"Failure detail is not safe for persistence.")
        return self._finish(job_id,lease_id,now,"FAILED",code=failure_code,message=safe_message)
    def retry_projection_job(self, job_id, now):
        with self._connect() as db:
            db.execute("BEGIN IMMEDIATE"); row=db.execute("SELECT * FROM studio_v1_projection_jobs WHERE job_id=?",(job_id,)).fetchone()
            if not row: self._fail(FailureCode.ARTIFACT_NOT_FOUND,"Projection job was not found.")
            if row["attempt_count"] >= row["max_attempts"]: self._fail(FailureCode.ATTEMPT_LIMIT_REACHED,"Projection attempt limit reached.")
            self._transition(db,row,"QUEUED"); db.execute("UPDATE studio_v1_projection_jobs SET state='QUEUED',failure_code=NULL,safe_failure_message=NULL WHERE job_id=?",(job_id,)); db.commit()
            return self._job(db.execute("SELECT * FROM studio_v1_projection_jobs WHERE job_id=?",(job_id,)).fetchone())
    def recover_expired_jobs(self, now):
        with self._connect() as db:
            db.execute("BEGIN IMMEDIATE"); rows=db.execute("SELECT * FROM studio_v1_projection_jobs WHERE state='REBUILDING' AND lease_expires_at<=?",(now,)).fetchall()
            for row in rows:
                db.execute("UPDATE studio_v1_projection_jobs SET state='FAILED',lease_id=NULL,lease_owner=NULL,lease_expires_at=NULL,failure_code='LEASE_EXPIRED',safe_failure_message='Projection lease expired.' WHERE job_id=?",(row["job_id"],))
                db.execute("UPDATE studio_v1_projection_attempts SET completed_at=?,outcome='FAILED',failure_code='LEASE_EXPIRED',safe_failure_message='Projection lease expired.' WHERE job_id=? AND attempt_number=?",(now,row["job_id"],row["attempt_count"]))
            db.commit(); return len(rows)
