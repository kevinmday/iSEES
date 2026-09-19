from __future__ import annotations

import json
import sqlite3
from datetime import datetime, timezone
from pathlib import Path
from typing import Any
from urllib.parse import quote

from isees_uap.studio.hashing import canonical_hash, canonical_json


class ResearchSourceConflict(Exception):
    pass


SCHEMA_VERSION = 2


class SQLiteResearchSourceRepository:
    """Durable, Investigation/principal-scoped canonical Research publications."""

    def __init__(self, path: str | Path):
        self.path = Path(path).expanduser().resolve()
        self.path.parent.mkdir(parents=True, exist_ok=True)
        with self._connect() as connection:
            connection.execute("PRAGMA journal_mode=WAL")
            connection.execute("CREATE TABLE IF NOT EXISTS research_source_schema_migrations (version INTEGER PRIMARY KEY, applied_at TEXT NOT NULL)")
            versions = {row[0] for row in connection.execute("SELECT version FROM research_source_schema_migrations")}
            if any(version > SCHEMA_VERSION for version in versions):
                raise RuntimeError("Research Sources database schema is newer than this application")
            for version in range(1, SCHEMA_VERSION + 1):
                if version in versions:
                    continue
                migration = Path(__file__).with_name("migrations").joinpath(f"{version:03d}_research_sources.sql")
                connection.executescript(migration.read_text(encoding="utf-8"))
                connection.execute("INSERT INTO research_source_schema_migrations VALUES (?, ?)",
                                   (version, datetime.now(timezone.utc).isoformat()))

    def _connect(self) -> sqlite3.Connection:
        connection = sqlite3.connect(self.path, timeout=5)
        connection.row_factory = sqlite3.Row
        return connection

    @staticmethod
    def canonical_hash(publication: dict[str, Any]) -> str:
        return canonical_hash({key: value for key, value in publication.items()
                               if key != "immutableSourceHash"})

    def publish(self, publication: dict[str, Any], principal_id: str) -> tuple[dict[str, Any], bool]:
        value = dict(publication)
        if value["sourceWorkspace"] != "MANIFOLD" or value["sourceKind"] != "GRAPH":
            raise ResearchSourceConflict("Unsupported Research source route")
        graph = value["capturedRepresentation"].get("graph")
        expected = {"graph": {"type": value["graphType"], "id": value["graphId"]},
                    "graphRevision": value["graphRevision"]}
        if (graph != expected["graph"] or value["capturedRepresentation"] != expected
                or value["sourceIdentity"] != value["graphIdentity"]
                or value["graphIdentity"] != f'{value["graphType"]}:{value["graphId"]}'
                or value["sourceRevisionId"] != str(value["graphRevision"])
                or value["classification"] != "CANONICAL"
                or value["insertionState"] != "INSERTABLE"
                or value["representationSchemaVersion"] != "research-graph/v1"
                or value["mediaType"] != "application/json"
                or value["immutableSourceHash"] != self.canonical_hash(value)):
            raise ResearchSourceConflict("Research graph publication is not canonical")
        row_values = (value["anchorId"], value["investigationId"], principal_id,
            value["sourceWorkspace"], value["sourceKind"], value["sourceIdentity"],
            value["graphIdentity"], value["graphType"], value["graphId"], value["graphRevision"],
            value["classification"], value["insertionState"], value["insertionReason"],
            value["representationSchemaVersion"], value["displayTitle"], value["displaySummary"], value["mediaType"],
            canonical_json(value["capturedRepresentation"]), value["collectedAt"], value["createdAt"],
            value["immutableSourceHash"])
        with self._connect() as connection:
            existing = connection.execute("SELECT * FROM research_graph_source WHERE anchor_id=?", (value["anchorId"],)).fetchone()
            if existing is not None:
                stored = self._row(existing)
                if self._comparable(stored) != self._comparable({**value, "principalId": principal_id}):
                    raise ResearchSourceConflict("Immutable Research source identity conflict")
                return stored, True
            connection.execute("INSERT INTO research_graph_source VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)", row_values)
        return {**value, "principalId": principal_id}, False

    @staticmethod
    def _comparable(value: dict[str, Any]) -> str:
        return canonical_json(value)

    @staticmethod
    def _row(row: sqlite3.Row) -> dict[str, Any]:
        names = ["anchorId", "investigationId", "principalId", "sourceWorkspace", "sourceKind",
                 "sourceIdentity", "graphIdentity", "graphType", "graphId", "graphRevision",
                 "classification", "insertionState", "insertionReason", "representationSchemaVersion",
                 "displayTitle", "displaySummary", "mediaType", "capturedRepresentation", "collectedAt", "createdAt", "immutableSourceHash"]
        result = dict(zip(names, tuple(row)))
        result["schemaVersion"] = "research-source-publication/v1"
        result["capturedRepresentation"] = json.loads(result["capturedRepresentation"])
        result["sourceRevisionId"] = str(result["graphRevision"])
        return result

    def resolve(self, *, anchor_id: str, investigation_id: str, principal_id: str) -> dict[str, Any] | None:
        uri = f"{self.path.as_uri()}?mode=ro"
        with sqlite3.connect(uri, uri=True, timeout=5) as connection:
            connection.row_factory = sqlite3.Row
            row = connection.execute("SELECT * FROM research_graph_source WHERE anchor_id=? AND investigation_id=? AND principal_id=?",
                                     (anchor_id, investigation_id, principal_id)).fetchone()
        return self._row(row) if row is not None else None

    def publish_candidate_evidence(self, *, candidate: dict[str, Any], principal_id: str) -> tuple[dict[str, Any], bool]:
        """Publish an inspection-only Inbox reference to an already-durable Candidate Evidence item."""
        if candidate.get("principalOwnership") != principal_id:
            raise ResearchSourceConflict("Candidate Evidence ownership mismatch")
        candidate_id = candidate["candidateId"]
        investigation_id = candidate["investigationId"]
        # Match the established browser researchAnchorId/encodeURIComponent identity.
        js_safe = "-_.!~*'()"
        anchor_id = ":".join(("research-v2", quote(investigation_id, safe=js_safe),
                              "EVIDENCE_RECORD", quote(candidate_id, safe=js_safe)))
        source = candidate["source"]
        value = {
            "anchorId": anchor_id, "investigationId": investigation_id,
            "principalId": principal_id, "candidateId": candidate_id,
            "displayTitle": source.get("title") or "Candidate Evidence",
            "displaySummary": source.get("snippet") or source.get("originalLocator") or "Review-only Candidate Evidence",
            "source": source, "collectedAt": candidate["createdAt"], "createdAt": candidate["createdAt"],
        }
        with self._connect() as connection:
            existing = connection.execute(
                "SELECT * FROM research_candidate_evidence_source WHERE investigation_id=? AND principal_id=? AND candidate_id=?",
                (investigation_id, principal_id, candidate_id)).fetchone()
            if existing is not None:
                stored = self._candidate_row(existing)
                if self._comparable(stored) != self._comparable(value):
                    raise ResearchSourceConflict("Immutable Candidate Evidence Inbox identity conflict")
                return stored, True
            connection.execute(
                "INSERT INTO research_candidate_evidence_source VALUES (?,?,?,?,?,?,?,?,?)",
                (anchor_id, investigation_id, principal_id, candidate_id, value["displayTitle"],
                 value["displaySummary"], canonical_json(source), value["collectedAt"], value["createdAt"]))
        return value, False

    def list_candidate_evidence(self, *, investigation_id: str, principal_id: str) -> list[dict[str, Any]]:
        uri = f"{self.path.as_uri()}?mode=ro"
        with sqlite3.connect(uri, uri=True, timeout=5) as connection:
            connection.row_factory = sqlite3.Row
            rows = connection.execute(
                "SELECT * FROM research_candidate_evidence_source WHERE investigation_id=? AND principal_id=? ORDER BY collected_at, anchor_id",
                (investigation_id, principal_id)).fetchall()
        return [self._candidate_row(row) for row in rows]

    @staticmethod
    def _candidate_row(row: sqlite3.Row) -> dict[str, Any]:
        return {"anchorId": row["anchor_id"], "investigationId": row["investigation_id"],
                "principalId": row["principal_id"], "candidateId": row["candidate_id"],
                "displayTitle": row["display_title"], "displaySummary": row["display_summary"],
                "source": json.loads(row["source_json"]), "collectedAt": row["collected_at"],
                "createdAt": row["created_at"]}
