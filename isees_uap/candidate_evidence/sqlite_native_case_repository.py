from __future__ import annotations

import json
import sqlite3
import uuid
from pathlib import Path
from typing import Any

from .errors import IdempotencyConflict, RevisionConflict
from .sqlite_repository import SQLiteCandidateEvidenceRepository, _canonical, _hash, _now


class SQLiteNativeCaseDraftRepository(SQLiteCandidateEvidenceRepository):
    """Durable researcher-owned Candidate Knowledge drafts; never operational records."""

    def __init__(self, path: str | Path):
        super().__init__(path)

    @staticmethod
    def _projection(row: sqlite3.Row) -> dict[str, Any]:
        return {
            "schemaVersion": "native-case-draft-projection/v1",
            "candidateId": row["candidate_id"],
            "ownership": {
                "kind": "RESEARCHER_OWNED",
                "researcherId": row["owner_principal_id"],
            },
            "investigationId": row["investigation_id"],
            "knowledgeClassification": "CANDIDATE_KNOWLEDGE",
            "lifecycle": "DRAFT",
            "revision": row["revision"],
            "freshnessToken": f"{row['candidate_id']}:{row['revision']}",
            "content": json.loads(row["content_json"]),
            "createdAt": row["created_at"],
            "updatedAt": row["updated_at"],
            "operationalMaterialization": "NONE",
            "systemCanonIdentity": None,
        }

    @staticmethod
    def _replay(connection: sqlite3.Connection, scope: tuple[str, str, str],
                request_hash: str) -> dict[str, Any] | None:
        row = connection.execute(
            "SELECT request_hash,response_json FROM native_case_draft_idempotency "
            "WHERE principal_id=? AND operation=? AND idempotency_key=?", scope).fetchone()
        if row is None:
            return None
        if row["request_hash"] != request_hash:
            raise IdempotencyConflict("Idempotency key was already used for another native case command")
        return json.loads(row["response_json"])

    @staticmethod
    def _store(connection: sqlite3.Connection, scope: tuple[str, str, str],
               request_hash: str, response: dict[str, Any]) -> None:
        connection.execute(
            "INSERT INTO native_case_draft_idempotency VALUES (?,?,?,?,?,?,?)",
            (*scope, request_hash, response["candidateId"], _canonical(response), _now()))

    def create(self, *, principal_id: str, command: dict[str, Any]) -> tuple[dict[str, Any], bool]:
        request_hash = _hash(command)
        scope = (principal_id, "CREATE_NATIVE_CASE_DRAFT", command["idempotencyKey"])
        with self._connect() as connection:
            connection.execute("BEGIN IMMEDIATE")
            replay = self._replay(connection, scope, request_hash)
            if replay is not None:
                connection.commit()
                return replay, True
            candidate_id, occurred_at = str(uuid.uuid4()), _now()
            content = command["content"]
            connection.execute(
                "INSERT INTO native_case_draft VALUES (?,?,?,?,?,?,?,?)",
                (candidate_id, principal_id, command.get("investigationId"), 0,
                 content["schemaVersion"], _canonical(content), occurred_at, occurred_at))
            row = connection.execute(
                "SELECT * FROM native_case_draft WHERE candidate_id=?", (candidate_id,)).fetchone()
            response = self._projection(row)
            self._store(connection, scope, request_hash, response)
            connection.commit()
            return response, False

    def get(self, *, principal_id: str, candidate_id: str) -> dict[str, Any] | None:
        with self._connect() as connection:
            row = connection.execute(
                "SELECT * FROM native_case_draft WHERE candidate_id=? AND owner_principal_id=?",
                (candidate_id, principal_id)).fetchone()
            return self._projection(row) if row is not None else None

    def list(self, *, principal_id: str) -> list[dict[str, Any]]:
        with self._connect() as connection:
            rows = connection.execute(
                "SELECT * FROM native_case_draft WHERE owner_principal_id=? "
                "ORDER BY created_at,candidate_id", (principal_id,)).fetchall()
            return [self._projection(row) for row in rows]

    def update(self, *, principal_id: str, candidate_id: str,
               command: dict[str, Any]) -> tuple[dict[str, Any] | None, bool]:
        request_hash = _hash(command)
        scope = (principal_id, f"UPDATE_NATIVE_CASE_DRAFT:{candidate_id}", command["idempotencyKey"])
        with self._connect() as connection:
            connection.execute("BEGIN IMMEDIATE")
            replay = self._replay(connection, scope, request_hash)
            if replay is not None:
                connection.commit()
                return replay, True
            row = connection.execute(
                "SELECT * FROM native_case_draft WHERE candidate_id=? AND owner_principal_id=?",
                (candidate_id, principal_id)).fetchone()
            if row is None:
                connection.rollback()
                return None, False
            if row["revision"] != command["expectedRevision"]:
                connection.rollback()
                raise RevisionConflict("Native case draft revision conflict")
            revision, occurred_at = row["revision"] + 1, _now()
            changed = connection.execute(
                "UPDATE native_case_draft SET investigation_id=?,revision=?,content_schema_version=?,"
                "content_json=?,updated_at=? WHERE candidate_id=? AND owner_principal_id=? AND revision=?",
                (command.get("investigationId"), revision, command["content"]["schemaVersion"],
                 _canonical(command["content"]), occurred_at, candidate_id, principal_id,
                 command["expectedRevision"]))
            if changed.rowcount != 1:
                connection.rollback()
                raise RevisionConflict("Native case draft revision conflict")
            updated = connection.execute(
                "SELECT * FROM native_case_draft WHERE candidate_id=?", (candidate_id,)).fetchone()
            response = self._projection(updated)
            self._store(connection, scope, request_hash, response)
            connection.commit()
            return response, False
