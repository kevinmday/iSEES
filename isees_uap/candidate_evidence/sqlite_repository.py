from __future__ import annotations

import hashlib
import json
import sqlite3
import uuid
from datetime import datetime, timezone
from pathlib import Path
from typing import Any

from .errors import IdempotencyConflict, InvalidCursor, OriginConflict, RevisionConflict
from .lifecycle import require_transition

SCHEMA_VERSION = 2


def _canonical(value: Any) -> str:
    return json.dumps(value, sort_keys=True, separators=(",", ":"), ensure_ascii=False)


def _hash(value: Any) -> str:
    return hashlib.sha256(_canonical(value).encode("utf-8")).hexdigest()


def _now() -> str:
    return datetime.now(timezone.utc).isoformat(timespec="milliseconds").replace("+00:00", "Z")


class SQLiteCandidateEvidenceRepository:
    """SQLite implementation; callers only exchange domain dictionaries."""

    def __init__(self, path: str | Path):
        self.path = Path(path).resolve()
        self.path.parent.mkdir(parents=True, exist_ok=True)
        self._migrate()

    def _connect(self) -> sqlite3.Connection:
        connection = sqlite3.connect(self.path, timeout=5, isolation_level=None)
        connection.row_factory = sqlite3.Row
        connection.execute("PRAGMA foreign_keys=ON")
        connection.execute("PRAGMA busy_timeout=5000")
        connection.execute("PRAGMA synchronous=FULL")
        return connection

    def _migrate(self) -> None:
        with self._connect() as connection:
            connection.execute("PRAGMA journal_mode=WAL")
            connection.execute("CREATE TABLE IF NOT EXISTS schema_migrations (version INTEGER PRIMARY KEY, applied_at TEXT NOT NULL)")
            versions = [row[0] for row in connection.execute("SELECT version FROM schema_migrations ORDER BY version")]
            if versions and max(versions) > SCHEMA_VERSION:
                raise RuntimeError("Candidate Evidence database schema is newer than this application")
            for version in range(1, SCHEMA_VERSION + 1):
                if version in versions:
                    continue
                sql = Path(__file__).with_name("migrations").joinpath(
                    f"{version:03d}_candidate_evidence.sql"
                ).read_text(encoding="utf-8")
                if version == 2:
                    connection.execute("PRAGMA foreign_keys=OFF")
                connection.execute("BEGIN IMMEDIATE")
                try:
                    # executescript() implicitly commits pending transactions.  This
                    # migration contains only simple DDL, so execute its statements
                    # inside our explicit transaction instead.
                    for statement in sql.split(";"):
                        if statement.strip():
                            connection.execute(statement)
                    connection.execute("INSERT INTO schema_migrations VALUES (?, ?)", (version, _now()))
                    connection.commit()
                except Exception:
                    connection.rollback()
                    raise
                finally:
                    if version == 2:
                        connection.execute("PRAGMA foreign_keys=ON")

    @staticmethod
    def _candidate(connection: sqlite3.Connection, row: sqlite3.Row) -> dict[str, Any]:
        events = connection.execute(
            "SELECT * FROM candidate_provenance_event WHERE candidate_id=? ORDER BY sequence", (row["candidate_id"],)
        ).fetchall()
        result: dict[str, Any] = {
            "candidateId": row["candidate_id"], "investigationId": row["investigation_id"],
            "revision": row["revision"], "origin": row["origin"], "originIdentity": row["origin_identity"],
            "lineage": json.loads(row["lineage_json"]), "source": json.loads(row["source_json"]),
            "lifecycleState": row["lifecycle_state"], "acquisitionState": row["acquisition_state"],
            "archiveState": row["archive_state"], "availability": row["availability"],
            "createdAt": row["created_at"], "updatedAt": row["updated_at"],
            "provenanceEvents": [{
                "eventId": event["event_id"], "candidateId": event["candidate_id"],
                "investigationId": event["investigation_id"],
                "actor": {"actorId": event["actor_id"], "kind": event["actor_kind"]},
                "occurredAt": event["occurred_at"], "action": event["action"],
                "priorRevision": event["prior_revision"], "resultingRevision": event["resulting_revision"],
                "priorLifecycleState": event["prior_lifecycle_state"],
                "resultingLifecycleState": event["resulting_lifecycle_state"],
            } for event in events],
        }
        for key, column in (("association", "association_json"), ("reviewDecision", "review_decision_json")):
            if row[column] is not None:
                result[key] = json.loads(row[column])
        return result

    @staticmethod
    def _replay(connection: sqlite3.Connection, scope: tuple[str, str, str, str], request_hash: str) -> dict[str, Any] | None:
        row = connection.execute(
            "SELECT request_hash,response_json FROM candidate_idempotency WHERE principal_id=? AND investigation_id=? AND operation=? AND idempotency_key=?", scope
        ).fetchone()
        if row is None:
            return None
        if row["request_hash"] != request_hash:
            raise IdempotencyConflict("Idempotency key was already used for another command")
        return json.loads(row["response_json"])

    def create(self, *, command: dict[str, Any], principal_id: str, origin: str) -> tuple[dict[str, Any], bool]:
        investigation_id = command["investigationId"]
        operation = f"CREATE_{origin}"
        request_hash = _hash(command)
        create_fingerprint = _hash({key: value for key, value in command.items() if key != "idempotencyKey"})
        scope = (principal_id, investigation_id, operation, command["idempotencyKey"])
        if origin == "SUBMISSION":
            origin_identity = command["submissionIdentity"]
        elif origin == "DISCOVERY":
            origin_identity = "result:" + _hash({
                "connector": command["connector"],
                "providerResultId": command["providerResultId"],
                "providerResultVersion": command.get("providerResultVersion"),
            })
        elif origin == "CURATED_REPOSITORY":
            reference = command["repositoryReference"]
            origin_identity = "curated-reference:" + _hash({
                "repositoryIdentity": reference["repositoryIdentity"],
                "artifactIdentity": reference["artifactIdentity"],
                "artifactVersion": reference["artifactVersion"],
            })
        else:
            raise ValueError(f"Unsupported Candidate Evidence origin: {origin}")
        with self._connect() as connection:
            connection.execute("BEGIN IMMEDIATE")
            replay = self._replay(connection, scope, request_hash)
            if replay is not None:
                connection.commit()
                return replay, True
            existing = connection.execute(
                "SELECT * FROM candidate_evidence WHERE created_by_principal_id=? AND investigation_id=? AND origin=? AND origin_identity=?",
                (principal_id, investigation_id, origin, origin_identity),
            ).fetchone()
            if existing is not None:
                if existing["create_fingerprint"] != create_fingerprint:
                    connection.rollback()
                    raise OriginConflict("Origin identity is already bound to different candidate metadata")
                response = self._candidate(connection, existing)
                self._store_idempotency(connection, scope, request_hash, response)
                connection.commit()
                return response, True
            candidate_id, occurred_at = str(uuid.uuid4()), _now()
            lifecycle = {"SUBMISSION": "SUBMITTED", "DISCOVERY": "DISCOVERED",
                         "CURATED_REPOSITORY": "REFERENCED"}[origin]
            if origin == "SUBMISSION":
                lineage = {"kind": "SUBMISSION", "submittedAt": occurred_at, "submitterId": principal_id,
                           "submissionIdentity": command["submissionIdentity"]}
                if command.get("submittedLocator") is not None:
                    lineage["submittedLocator"] = command["submittedLocator"]
            elif origin == "DISCOVERY":
                query = command["querySpecification"]
                query_id = "query:" + _hash(query)
                connection.execute(
                    "INSERT OR IGNORE INTO candidate_query_specification VALUES (?,?,?,?,?,?,?,?,?)",
                    (query_id, investigation_id, query["schemaVersion"], query["targetConnector"], query["query"],
                     _canonical(query["clauses"]), _canonical(query["lineage"]), occurred_at, principal_id),
                )
                lineage = {"kind": "DISCOVERY", "discoveredAt": occurred_at, "querySpecification": query,
                           "connector": command["connector"], "connectorVersion": command["connectorVersion"]}
            else:
                lineage = {
                    "kind": "CURATED_REPOSITORY", "referencedAt": occurred_at,
                    "repositoryReference": command["repositoryReference"],
                    "provenance": command["provenance"], "custody": command["custody"],
                    "ownership": "CURATED_REPOSITORY",
                }
            connection.execute(
                "INSERT INTO candidate_evidence (candidate_id,investigation_id,revision,origin,origin_identity,lineage_json,source_json,association_json,lifecycle_state,created_at,updated_at,created_by_principal_id,create_fingerprint) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?)",
                (candidate_id, investigation_id, 0, origin, origin_identity, _canonical(lineage), _canonical(command["source"]),
                 _canonical(command["association"]) if command.get("association") else None, lifecycle, occurred_at,
                 occurred_at, principal_id, create_fingerprint),
            )
            connection.execute(
                "INSERT INTO candidate_provenance_event VALUES (?,?,?,?,?,?,?,?,?,?,?,?)",
                (str(uuid.uuid4()), candidate_id, investigation_id, 0, f"CREATED_{origin}", principal_id,
                 "AUTOMATION" if origin == "DISCOVERY" else "HUMAN", occurred_at, 0, 0, lifecycle, lifecycle),
            )
            if origin == "CURATED_REPOSITORY":
                connection.execute("UPDATE candidate_evidence SET availability=? WHERE candidate_id=?",
                                   (command["availability"], candidate_id))
            row = connection.execute("SELECT * FROM candidate_evidence WHERE candidate_id=?", (candidate_id,)).fetchone()
            response = self._candidate(connection, row)
            self._store_idempotency(connection, scope, request_hash, response)
            connection.commit()
            return response, False

    def _store_idempotency(self, connection: sqlite3.Connection, scope: tuple[str, str, str, str], request_hash: str, response: dict[str, Any]) -> None:
        connection.execute("INSERT INTO candidate_idempotency VALUES (?,?,?,?,?,?,?,?)", (*scope, request_hash, response["candidateId"], _canonical(response), _now()))

    def get(self, *, investigation_id: str, candidate_id: str, principal_id: str) -> dict[str, Any] | None:
        with self._connect() as connection:
            row = connection.execute(
                "SELECT * FROM candidate_evidence WHERE investigation_id=? AND candidate_id=? AND created_by_principal_id=?",
                (investigation_id, candidate_id, principal_id),
            ).fetchone()
            return self._candidate(connection, row) if row is not None else None

    def list(self, *, investigation_id: str, principal_id: str, limit: int, cursor: str | None) -> tuple[list[dict[str, Any]], str | None]:
        params: list[Any] = [investigation_id, principal_id]
        after = ""
        if cursor:
            try:
                created_at, candidate_id = cursor.split("|", 1)
            except ValueError as error:
                raise InvalidCursor("Candidate list cursor is invalid") from error
            if not created_at or not candidate_id:
                raise InvalidCursor("Candidate list cursor is invalid")
            after = " AND (created_at > ? OR (created_at = ? AND candidate_id > ?))"
            params.extend([created_at, created_at, candidate_id])
        params.append(limit + 1)
        with self._connect() as connection:
            rows = connection.execute(
                f"SELECT * FROM candidate_evidence WHERE investigation_id=? AND created_by_principal_id=?{after} ORDER BY created_at,candidate_id LIMIT ?", params
            ).fetchall()
            page = rows[:limit]
            next_cursor = f"{page[-1]['created_at']}|{page[-1]['candidate_id']}" if len(rows) > limit else None
            return [self._candidate(connection, row) for row in page], next_cursor

    def transition(self, *, investigation_id: str, candidate_id: str, principal_id: str, command: dict[str, Any]) -> tuple[dict[str, Any], bool]:
        request_hash = _hash(command)
        scope = (principal_id, investigation_id, "LIFECYCLE_TRANSITION", command["idempotencyKey"])
        with self._connect() as connection:
            connection.execute("BEGIN IMMEDIATE")
            replay = self._replay(connection, scope, request_hash)
            if replay is not None:
                connection.commit()
                return replay, True
            row = connection.execute(
                "SELECT * FROM candidate_evidence WHERE investigation_id=? AND candidate_id=? AND created_by_principal_id=?",
                (investigation_id, candidate_id, principal_id),
            ).fetchone()
            if row is None:
                connection.rollback()
                return {}, False
            if row["revision"] != command["expectedRevision"]:
                connection.rollback()
                raise RevisionConflict("Candidate revision conflict")
            target = command["to"]
            require_transition(row["lifecycle_state"], target)
            revision, occurred_at = row["revision"] + 1, _now()
            decision = None
            if command.get("reviewDecision"):
                decision = {**command["reviewDecision"], "reviewerId": principal_id, "decidedAt": occurred_at}
            changed = connection.execute(
                "UPDATE candidate_evidence SET revision=?,lifecycle_state=?,review_decision_json=?,updated_at=? WHERE candidate_id=? AND investigation_id=? AND revision=?",
                (revision, target, _canonical(decision) if decision else row["review_decision_json"], occurred_at,
                 candidate_id, investigation_id, command["expectedRevision"]),
            )
            if changed.rowcount != 1:
                connection.rollback()
                raise RevisionConflict("Candidate revision conflict")
            connection.execute(
                "INSERT INTO candidate_provenance_event VALUES (?,?,?,?,?,?,?,?,?,?,?,?)",
                (str(uuid.uuid4()), candidate_id, investigation_id, revision, f"LIFECYCLE_{target}", principal_id,
                 "HUMAN", occurred_at, row["revision"], revision, row["lifecycle_state"], target),
            )
            updated = connection.execute("SELECT * FROM candidate_evidence WHERE candidate_id=?", (candidate_id,)).fetchone()
            response = self._candidate(connection, updated)
            self._store_idempotency(connection, scope, request_hash, response)
            connection.commit()
            return response, False
