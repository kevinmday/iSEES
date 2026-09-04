from __future__ import annotations

import json
import sqlite3
from contextlib import closing
from datetime import datetime, timezone
from pathlib import Path
from typing import Any
from uuid import uuid4

from .errors import IdempotencyConflict, RevisionConflict
from .hashing import canonical_json
from .lifecycle import StudioLifecycle
from .models import (
    CandidateKnowledgeArtifact, ClaimReviewState, ContradictionOrigin, LineageState,
    MaterializationState, ProjectionFormat, ReadinessState, RelationshipType,
    ResolutionStatus, ReviewDecisionType, ReviewTargetScope, SourceClassification,
    SourceKind, StudioArtifact, StudioArtifactVersion, StudioCitation, StudioClaim,
    StudioClaimSourceMapping, StudioProjectionRecord, StudioReviewDecision,
    StudioSourceSnapshot,
)
from .repository import IdempotencyRecord, IdempotencyScope, StudioAggregateRecord

SCHEMA_VERSION = 1


def _sql_statements(script: str):
    """Yield complete SQLite statements without splitting inside SQL syntax."""
    pending = ""
    for line in script.splitlines(keepends=True):
        pending += line
        if sqlite3.complete_statement(pending):
            statement = pending.strip()
            if statement:
                yield statement
            pending = ""
    if pending.strip():
        raise RuntimeError("Incomplete STUDIO migration statement")


def _time(value: datetime) -> str:
    return value.astimezone(timezone.utc).isoformat(timespec="microseconds").replace("+00:00", "Z")


def _parse(value: str | None) -> datetime | None:
    return datetime.fromisoformat(value.replace("Z", "+00:00")) if value else None


class SQLiteStudioRepository:
    """Durable, connection-per-operation STUDIO aggregate repository."""

    def __init__(self, path: str | Path):
        self.path = Path(path).resolve()
        self.path.parent.mkdir(parents=True, exist_ok=True)
        self._migrate()

    def close(self) -> None:
        """Connections are short lived; retained for an explicit lifecycle seam."""

    def _connect(self) -> sqlite3.Connection:
        connection = sqlite3.connect(self.path, timeout=5, isolation_level=None)
        connection.row_factory = sqlite3.Row
        connection.execute("PRAGMA foreign_keys=ON")
        connection.execute("PRAGMA busy_timeout=5000")
        connection.execute("PRAGMA synchronous=FULL")
        return connection

    def _migrate(self) -> None:
        with closing(self._connect()) as connection:
            connection.execute("PRAGMA journal_mode=WAL")
            connection.execute("CREATE TABLE IF NOT EXISTS studio_schema_migrations (version INTEGER PRIMARY KEY, applied_at TEXT NOT NULL)")
            versions = {row[0] for row in connection.execute("SELECT version FROM studio_schema_migrations")}
            if versions and max(versions) > SCHEMA_VERSION:
                raise RuntimeError("STUDIO database schema is newer than this application")
            for version in range(1, SCHEMA_VERSION + 1):
                if version in versions:
                    continue
                sql = Path(__file__).with_name("migrations").joinpath(f"{version:03d}_studio.sql").read_text(encoding="utf-8")
                connection.execute("BEGIN IMMEDIATE")
                try:
                    for statement in _sql_statements(sql):
                        connection.execute(statement)
                    connection.execute("INSERT INTO studio_schema_migrations VALUES (?, ?)", (version, _time(datetime.now(timezone.utc))))
                    connection.commit()
                except Exception:
                    connection.rollback()
                    raise

    def get(self, *, artifact_id: str) -> StudioAggregateRecord | None:
        with closing(self._connect()) as connection:
            return self._load(connection, artifact_id)

    def get_scoped(self, *, investigation_id: str, artifact_id: str, principal_id: str) -> StudioAggregateRecord | None:
        with closing(self._connect()) as connection:
            row = connection.execute(
                "SELECT artifact_id FROM studio_artifact WHERE investigation_id=? AND artifact_id=? AND owner_principal_id=?",
                (investigation_id, artifact_id, principal_id),
            ).fetchone()
            return self._load(connection, artifact_id) if row else None

    def list(self, *, investigation_id: str, principal_id: str) -> list[StudioAggregateRecord]:
        with closing(self._connect()) as connection:
            rows = connection.execute(
                "SELECT artifact_id FROM studio_artifact WHERE investigation_id=? AND owner_principal_id=? ORDER BY created_at,artifact_id",
                (investigation_id, principal_id),
            ).fetchall()
            return [self._load(connection, row[0]) for row in rows]  # type: ignore[misc]

    def create(self, *, record: StudioAggregateRecord) -> None:
        with closing(self._connect()) as connection:
            connection.execute("BEGIN IMMEDIATE")
            self._write_create(connection, record)
            connection.commit()

    def replace(self, *, record: StudioAggregateRecord, expected_revision: int) -> None:
        with closing(self._connect()) as connection:
            connection.execute("BEGIN IMMEDIATE")
            self._write_replace(connection, record, expected_revision)
            connection.commit()

    def persist_command(self, *, record: StudioAggregateRecord, expected_revision: int | None,
                        scope: IdempotencyScope, idempotency: IdempotencyRecord) -> None:
        """Atomically persist the aggregate and its command replay result."""
        with closing(self._connect()) as connection:
            connection.execute("BEGIN IMMEDIATE")
            try:
                existing = self._get_idempotency(connection, scope)
                if existing:
                    if existing.command_hash != idempotency.command_hash:
                        raise IdempotencyConflict("Idempotency key was reused with different command content")
                    connection.commit()
                    return
                if expected_revision is None:
                    self._write_create(connection, record)
                else:
                    self._write_replace(connection, record, expected_revision)
                self._put_idempotency(connection, scope, idempotency, record.artifact.artifact_id)
                connection.commit()
            except sqlite3.IntegrityError as exc:
                connection.rollback()
                raise RevisionConflict("Persistent STUDIO identity conflict") from exc
            except Exception:
                connection.rollback()
                raise

    def get_idempotency(self, *, scope: IdempotencyScope) -> IdempotencyRecord | None:
        with closing(self._connect()) as connection:
            return self._get_idempotency(connection, scope)

    def put_idempotency(self, *, scope: IdempotencyScope, record: IdempotencyRecord) -> None:
        with closing(self._connect()) as connection:
            artifact_id = record.result["artifactId"]
            self._put_idempotency(connection, scope, record, artifact_id)

    @staticmethod
    def _get_idempotency(connection: sqlite3.Connection, scope: IdempotencyScope) -> IdempotencyRecord | None:
        row = connection.execute(
            "SELECT command_hash,result_json FROM studio_idempotency WHERE principal_id=? AND investigation_id=? AND operation=? AND idempotency_key=?", scope
        ).fetchone()
        return IdempotencyRecord(row["command_hash"], json.loads(row["result_json"])) if row else None

    @staticmethod
    def _put_idempotency(connection: sqlite3.Connection, scope: IdempotencyScope,
                         record: IdempotencyRecord, artifact_id: str) -> None:
        connection.execute("INSERT INTO studio_idempotency VALUES (?,?,?,?,?,?,?,?)",
                           (*scope, record.command_hash, artifact_id, canonical_json(record.result),
                            _time(datetime.now(timezone.utc))))

    @staticmethod
    def _write_create(c: sqlite3.Connection, record: StudioAggregateRecord) -> None:
        a = record.artifact
        c.execute("INSERT INTO studio_artifact VALUES (?,?,?,?,?,?,?,?,?,?,?)", (
            a.artifact_id, a.investigation_id, a.owner_principal_id, a.revision,
            a.lifecycle_state.value, a.current_version_number, a.current_version_id,
            a.candidate_artifact_id, a.manifold_candidate_node_id, _time(a.created_at), _time(a.updated_at)))
        SQLiteStudioRepository._write_children(c, record)
        c.execute("INSERT INTO studio_lifecycle_event VALUES (?,?,?,?,?,?,?,?)", (
            str(uuid4()), a.artifact_id, 0, 0, 0, None, a.lifecycle_state.value, _time(a.created_at)))

    @staticmethod
    def _write_replace(c: sqlite3.Connection, record: StudioAggregateRecord, expected: int) -> None:
        a = record.artifact
        prior = c.execute("SELECT revision,lifecycle_state FROM studio_artifact WHERE artifact_id=?", (a.artifact_id,)).fetchone()
        if prior is None or prior["revision"] != expected or a.revision != expected + 1:
            raise RevisionConflict("Expected revision is stale")
        changed = c.execute(
            "UPDATE studio_artifact SET revision=?,lifecycle_state=?,current_version_number=?,current_version_id=?,candidate_artifact_id=?,manifold_candidate_node_id=?,updated_at=? WHERE artifact_id=? AND revision=?",
            (a.revision, a.lifecycle_state.value, a.current_version_number, a.current_version_id,
             a.candidate_artifact_id, a.manifold_candidate_node_id, _time(a.updated_at), a.artifact_id, expected))
        if changed.rowcount != 1:
            raise RevisionConflict("Expected revision is stale")
        SQLiteStudioRepository._write_children(c, record)
        c.execute("INSERT INTO studio_lifecycle_event VALUES (?,?,?,?,?,?,?,?)", (
            str(uuid4()), a.artifact_id, a.revision, expected, a.revision,
            prior["lifecycle_state"], a.lifecycle_state.value, _time(a.updated_at)))

    @staticmethod
    def _write_children(c: sqlite3.Connection, r: StudioAggregateRecord) -> None:
        a = r.artifact
        snapshots = {s.snapshot_id: s for s in r.source_snapshots}
        for v in r.versions:
            stored = c.execute("SELECT artifact_id,version_number,content_hash FROM studio_artifact_version WHERE version_id=?", (v.version_id,)).fetchone()
            if stored is not None:
                if (stored["artifact_id"], stored["version_number"], stored["content_hash"]) != (v.artifact_id, v.version_number, v.content_hash):
                    raise sqlite3.IntegrityError("immutable STUDIO version identity conflict")
                continue
            c.execute("INSERT INTO studio_artifact_version VALUES (?,?,?,?,?,?,?,?,?,?)", (
                v.version_id, v.artifact_id, v.version_number, v.parent_version_id,
                v.author_schema_version, canonical_json(v.document),
                canonical_json(v.comparison_context) if v.comparison_context is not None else None,
                v.content_hash, v.created_by_principal_id, _time(v.created_at)))
            for snapshot_id in v.source_snapshot_ids:
                s = snapshots[snapshot_id]
                c.execute("INSERT INTO studio_source_snapshot VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)", (
                    s.snapshot_id, a.artifact_id, v.version_id, s.source_identity, s.source_investigation_id,
                    s.source_workspace, s.source_kind.value, s.classification.value, _time(s.captured_at),
                    s.representation_schema_version, s.media_type, canonical_json(s.captured_representation),
                    s.snapshot_hash, s.source_revision_id, s.source_execution_id, s.source_projection_id,
                    s.resolution_status.value, canonical_json(s.resolution_metadata)))
            for claim in v.claims:
                c.execute("INSERT INTO studio_claim VALUES (?,?,?,?,?,?,?)", (
                    claim.claim_id, a.artifact_id, v.version_id, claim.review_state.value,
                    claim.lineage_state.value, claim.claim_text, claim.span_identity))
            for citation in v.citations:
                c.execute("INSERT INTO studio_citation VALUES (?,?,?,?,?)", (
                    citation.citation_id, a.artifact_id, v.version_id, citation.source_snapshot_id,
                    canonical_json(citation.locator_metadata) if citation.locator_metadata is not None else None))
            for mapping in v.claim_source_mappings:
                c.execute("INSERT INTO studio_claim_source_mapping VALUES (?,?,?,?,?,?,?,?,?,?)", (
                    mapping.mapping_id, a.artifact_id, v.version_id, mapping.claim_id,
                    mapping.source_snapshot_id, mapping.relationship_type.value, mapping.citation_id,
                    mapping.contradiction_origin.value if mapping.contradiction_origin else None,
                    mapping.attributed_actor_id, mapping.attributed_process))
        for item in r.candidates:
            values = (
                item.candidate_artifact_id, item.artifact_id, item.artifact_version_id,
                item.readiness_state.value, canonical_json(item.validation_warnings),
                item.created_by_principal_id, _time(item.created_at))
            SQLiteStudioRepository._insert_immutable(
                c, "studio_candidate_artifact", "candidate_artifact_id", values[0], values)
        for item in r.publication_receipts:
            values = (
                item["receipt_id"], a.artifact_id, a.candidate_artifact_id,
                item["candidate_node_id"], item["published_at"])
            SQLiteStudioRepository._insert_immutable(
                c, "studio_candidate_publication_receipt", "receipt_id", values[0], values)
        for item in r.acceptance_receipts:
            values = (
                item["receipt_id"], a.artifact_id, a.candidate_artifact_id,
                item["accepted_knowledge_id"], item["accepted_at"])
            SQLiteStudioRepository._insert_immutable(
                c, "studio_acceptance_receipt", "receipt_id", values[0], values)
        for item in r.review_decisions:
            values = (
                item.decision_id, item.artifact_id, item.candidate_artifact_id,
                item.target_scope.value, item.claim_id, item.decision.value, item.reason,
                item.actor_principal_id, item.prior_revision, item.resulting_revision, _time(item.decided_at))
            SQLiteStudioRepository._insert_immutable(
                c, "studio_review_decision", "decision_id", values[0], values)
        for item in r.projections:
            existing = c.execute("SELECT * FROM studio_projection WHERE projection_id=?", (item.projection_id,)).fetchone()
            immutable = (item.artifact_id, item.artifact_version_id, item.projection_format.value,
                         canonical_json(item.citation_style_configuration), item.readiness_state.value,
                         canonical_json(item.validation_warnings), item.validator_version, _time(item.validated_at))
            if existing is not None:
                stored = tuple(existing[key] for key in (
                    "artifact_id", "artifact_version_id", "projection_format",
                    "citation_style_configuration_json", "readiness_state",
                    "validation_warnings_json", "validator_version", "validated_at"))
                if stored != immutable:
                    raise sqlite3.IntegrityError("immutable STUDIO projection identity conflict")
            c.execute("INSERT INTO studio_projection VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?) ON CONFLICT(projection_id) DO UPDATE SET materialization_state=excluded.materialization_state,materializer_version=excluded.materializer_version,output_identity=excluded.output_identity,output_location=excluded.output_location,output_hash=excluded.output_hash,materialized_at=excluded.materialized_at", (
                item.projection_id, item.artifact_id, item.artifact_version_id, item.projection_format.value,
                canonical_json(item.citation_style_configuration), item.readiness_state.value,
                canonical_json(item.validation_warnings), item.materialization_state.value,
                item.validator_version, _time(item.validated_at), item.materializer_version,
                item.output_identity, item.output_location, item.output_hash,
                _time(item.materialized_at) if item.materialized_at else None))

    @staticmethod
    def _insert_immutable(c: sqlite3.Connection, table: str, identity_column: str,
                          identity: str, values: tuple[Any, ...]) -> None:
        existing = c.execute(
            f"SELECT * FROM {table} WHERE {identity_column}=?", (identity,)).fetchone()
        if existing is None:
            placeholders = ",".join("?" for _ in values)
            c.execute(f"INSERT INTO {table} VALUES ({placeholders})", values)
        elif tuple(existing) != values:
            raise sqlite3.IntegrityError(f"immutable STUDIO {table} identity conflict")

    @staticmethod
    def _load(c: sqlite3.Connection, artifact_id: str) -> StudioAggregateRecord | None:
        a = c.execute("SELECT * FROM studio_artifact WHERE artifact_id=?", (artifact_id,)).fetchone()
        if not a:
            return None
        snapshot_rows = c.execute("SELECT * FROM studio_source_snapshot WHERE artifact_id=? ORDER BY rowid", (artifact_id,)).fetchall()
        snapshots = tuple(StudioSourceSnapshot(
            s["snapshot_id"], s["source_identity"], s["source_investigation_id"], s["source_workspace"],
            SourceKind(s["source_kind"]), SourceClassification(s["classification"]), _parse(s["captured_at"]),
            s["representation_schema_version"], s["media_type"], json.loads(s["captured_representation_json"]),
            s["snapshot_hash"], s["source_revision_id"], s["source_execution_id"], s["source_projection_id"],
            ResolutionStatus(s["resolution_status"]), json.loads(s["resolution_metadata_json"]))
            for s in snapshot_rows)
        versions = []
        for v in c.execute("SELECT * FROM studio_artifact_version WHERE artifact_id=? ORDER BY version_number", (artifact_id,)):
            vid = v["version_id"]
            claims = tuple(StudioClaim(x["claim_id"], vid, ClaimReviewState(x["review_state"]), LineageState(x["lineage_state"]), x["claim_text"], x["span_identity"])
                           for x in c.execute("SELECT * FROM studio_claim WHERE artifact_version_id=? ORDER BY rowid", (vid,)))
            citations = tuple(StudioCitation(x["citation_id"], vid, x["source_snapshot_id"], json.loads(x["locator_metadata_json"]) if x["locator_metadata_json"] else None)
                              for x in c.execute("SELECT * FROM studio_citation WHERE artifact_version_id=? ORDER BY rowid", (vid,)))
            mappings = tuple(StudioClaimSourceMapping(x["mapping_id"], vid, x["claim_id"], x["source_snapshot_id"], RelationshipType(x["relationship_type"]), x["citation_id"], ContradictionOrigin(x["contradiction_origin"]) if x["contradiction_origin"] else None, x["attributed_actor_id"], x["attributed_process"])
                             for x in c.execute("SELECT * FROM studio_claim_source_mapping WHERE artifact_version_id=? ORDER BY rowid", (vid,)))
            versions.append(StudioArtifactVersion(vid, artifact_id, v["version_number"], v["parent_version_id"],
                v["author_schema_version"], json.loads(v["document_json"]),
                tuple(x["snapshot_id"] for x in snapshot_rows if x["artifact_version_id"] == vid),
                claims, citations, mappings, json.loads(v["comparison_context_json"]) if v["comparison_context_json"] else None,
                v["content_hash"], v["created_by_principal_id"], _parse(v["created_at"])))
        candidates = tuple(CandidateKnowledgeArtifact(x["candidate_artifact_id"], artifact_id, x["artifact_version_id"], ReadinessState(x["readiness_state"]), tuple(json.loads(x["validation_warnings_json"])), x["created_by_principal_id"], _parse(x["created_at"])) for x in c.execute("SELECT * FROM studio_candidate_artifact WHERE artifact_id=? ORDER BY created_at", (artifact_id,)))
        projections = tuple(StudioProjectionRecord(x["projection_id"], artifact_id, x["artifact_version_id"], ProjectionFormat(x["projection_format"]), json.loads(x["citation_style_configuration_json"]), ReadinessState(x["readiness_state"]), tuple(json.loads(x["validation_warnings_json"])), MaterializationState(x["materialization_state"]), x["validator_version"], _parse(x["validated_at"]), x["materializer_version"], x["output_identity"], x["output_location"], x["output_hash"], _parse(x["materialized_at"])) for x in c.execute("SELECT * FROM studio_projection WHERE artifact_id=? ORDER BY validated_at,projection_id", (artifact_id,)))
        reviews = tuple(StudioReviewDecision(x["decision_id"], artifact_id, x["candidate_artifact_id"], ReviewTargetScope(x["target_scope"]), x["claim_id"], ReviewDecisionType(x["decision"]), x["reason"], x["actor_principal_id"], x["prior_revision"], x["resulting_revision"], _parse(x["decided_at"])) for x in c.execute("SELECT * FROM studio_review_decision WHERE artifact_id=? ORDER BY resulting_revision,decided_at,decision_id", (artifact_id,)))
        pubs = tuple(dict(x) for x in c.execute("SELECT receipt_id,candidate_node_id,published_at FROM studio_candidate_publication_receipt WHERE artifact_id=? ORDER BY published_at,receipt_id", (artifact_id,)))
        accepts = tuple(dict(x) for x in c.execute("SELECT receipt_id,accepted_knowledge_id,accepted_at FROM studio_acceptance_receipt WHERE artifact_id=? ORDER BY accepted_at,receipt_id", (artifact_id,)))
        artifact = StudioArtifact(a["artifact_id"], a["investigation_id"], a["owner_principal_id"], a["revision"], StudioLifecycle(a["lifecycle_state"]), a["current_version_number"], a["current_version_id"], _parse(a["created_at"]), _parse(a["updated_at"]), a["candidate_artifact_id"], a["manifold_candidate_node_id"])
        return StudioAggregateRecord(artifact, tuple(versions), snapshots, candidates, projections, reviews, pubs, accepts)

    def lifecycle_events(self, *, artifact_id: str) -> list[dict[str, Any]]:
        with closing(self._connect()) as c:
            return [dict(row) for row in c.execute("SELECT * FROM studio_lifecycle_event WHERE artifact_id=? ORDER BY sequence", (artifact_id,))]
