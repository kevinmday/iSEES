from __future__ import annotations

import json
import sqlite3
from pathlib import Path
from typing import Any

from isees_uap.studio.hashing import canonical_hash, canonical_json


class ResearchSourceConflict(Exception):
    pass


class SQLiteResearchSourceRepository:
    """Durable, Investigation/principal-scoped canonical Research publications."""

    def __init__(self, path: str | Path):
        self.path = Path(path).expanduser().resolve()
        self.path.parent.mkdir(parents=True, exist_ok=True)
        with self._connect() as connection:
            connection.execute("PRAGMA journal_mode=WAL")
            connection.execute("""CREATE TABLE IF NOT EXISTS research_graph_source (
                anchor_id TEXT PRIMARY KEY, investigation_id TEXT NOT NULL, principal_id TEXT NOT NULL,
                source_workspace TEXT NOT NULL, source_kind TEXT NOT NULL, source_identity TEXT NOT NULL,
                graph_identity TEXT NOT NULL, graph_type TEXT NOT NULL, graph_id TEXT NOT NULL,
                graph_revision INTEGER NOT NULL, classification TEXT NOT NULL, insertion_state TEXT NOT NULL,
                insertion_reason TEXT NOT NULL, representation_schema_version TEXT NOT NULL,
                display_title TEXT NOT NULL, display_summary TEXT NOT NULL,
                media_type TEXT NOT NULL, captured_representation_json TEXT NOT NULL,
                collected_at TEXT NOT NULL, created_at TEXT NOT NULL, immutable_source_hash TEXT NOT NULL,
                UNIQUE(investigation_id, principal_id, source_workspace, source_kind, source_identity)
            )""")

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
