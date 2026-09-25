from __future__ import annotations

import sqlite3
import json
import hashlib
from contextlib import closing
from datetime import datetime, timezone
from pathlib import Path
from typing import Callable

from .errors import (
    DuplicateInvestigationId,
    IdempotencyKeyReuse,
    InvestigationNotFound,
    InvalidStoredInvestigation,
    RepositoryUnavailable,
    RevisionConflict,
    OperationalRevisionConflict,
    InvalidOperationalGraph,
    ManifoldArtifactAlreadyAdmitted,
)
from .models import (AdoptionReceipt, Investigation, InvestigationAggregate,
                     InvestigationLifecycle, OperationalGraphRevision,
                     OperationalRevisionLineage, ManifoldArtifactAdmissionReceipt)

SCHEMA_VERSION = 6

GRAPH_SCHEMA_VERSION = "investigation-operational-graph/v1"


def _stable(value):
    if isinstance(value, list):
        return [_stable(item) for item in value]
    if isinstance(value, dict):
        return {key: _stable(value[key]) for key in sorted(value)}
    if value is None or isinstance(value, (str, int, float, bool)):
        return value
    raise InvalidOperationalGraph("Operational graph contains unsupported content")


def validate_operational_graph(graph: dict) -> None:
    if not isinstance(graph, dict) or set(graph) - {"nodes", "edges", "statistics", "centerNodeId"}:
        raise InvalidOperationalGraph("Operational graph contract is invalid")
    nodes, edges = graph.get("nodes"), graph.get("edges")
    if not isinstance(nodes, list) or not isinstance(edges, list):
        raise InvalidOperationalGraph("Operational graph collections are invalid")
    node_ids: set[str] = set()
    for node in nodes:
        if (not isinstance(node, dict) or set(node) - {"id", "label", "type", "iconType", "metadata"}
                or not all(isinstance(node.get(key), str) and node[key].strip() for key in ("id", "label", "type"))
                or node["id"] in node_ids):
            raise InvalidOperationalGraph("Operational graph NODE is invalid")
        _stable(node.get("metadata", {}))
        node_ids.add(node["id"])
    edge_ids: set[str] = set()
    for edge in edges:
        required = ("id", "source", "target", "relationship", "weight", "rationale")
        if (not isinstance(edge, dict) or set(edge) - {"id", "source", "target", "relationship", "weight", "metrics", "rationale"}
                or not all(isinstance(edge.get(key), str) and edge[key].strip() for key in required[:4])
                or edge["id"] in edge_ids or edge["source"] not in node_ids or edge["target"] not in node_ids
                or not isinstance(edge.get("weight"), (int, float)) or isinstance(edge.get("weight"), bool)
                or not isinstance(edge.get("rationale"), list) or not all(isinstance(item, str) for item in edge["rationale"])):
            raise InvalidOperationalGraph("Operational graph EDGE is invalid")
        _stable(edge.get("metrics", {}))
        edge_ids.add(edge["id"])


def operational_graph_fingerprint(graph: dict) -> str:
    validate_operational_graph(graph)
    nodes = []
    for source in sorted(graph["nodes"], key=lambda item: item["id"]):
        node = {key: source[key] for key in ("id", "label", "type")}
        if "iconType" in source: node["iconType"] = source["iconType"]
        if "metadata" in source: node["metadata"] = _stable(source["metadata"])
        nodes.append(node)
    edges = []
    for source in sorted(graph["edges"], key=lambda item: item["id"]):
        edge = {key: source[key] for key in ("id", "source", "target", "relationship", "weight")}
        if "metrics" in source: edge["metrics"] = _stable(source["metrics"])
        edge["rationale"] = list(source["rationale"])
        edges.append(edge)
    return json.dumps({"nodes": nodes, "edges": edges}, ensure_ascii=False, separators=(",", ":"))


def _legacy_payload_graph(payload: dict) -> dict:
    try:
        workspace = payload["workspace"]
        canonical = [item for item in workspace["nodes"] if item["kind"] == "CANONICAL_EVENT"]
        nodes = [{"id": item["id"], "label": item["title"],
                  "type": "EVENT" if item["kind"] == "CANONICAL_EVENT" else
                          "HYPOTHESIS" if item["kind"] == "QUESTION" else "NARRATIVE",
                  "metadata": ({"sourceId": item["canonicalEventId"]} if item["kind"] == "CANONICAL_EVENT"
                               else {"adoptedKind": item["kind"]})}
                 for item in workspace["nodes"]]
        edges = [{"id": item["id"], "source": item["sourceId"], "target": item["targetId"],
                  "relationship": "ASSOCIATED_WITH" if item["kind"] == "RELATED" else item["kind"],
                  "weight": 1, "rationale": ["Preserved guest adoption."]}
                 for item in workspace["edges"]]
        graph = {"nodes": nodes, "edges": edges,
                 "statistics": {"nodeCount": len(nodes), "edgeCount": len(edges),
                    "eventCount": len(canonical), "facilityCount": 0, "artifactCount": 0,
                    "personCount": 0, "organizationCount": 0, "locationCount": 0,
                    "narrativeCount": sum(item["kind"] == "NOTE" for item in workspace["nodes"]),
                    "hypothesisCount": sum(item["kind"] == "QUESTION" for item in workspace["nodes"])}}
    except (KeyError, TypeError) as error:
        raise InvalidStoredInvestigation("Legacy aggregate cannot form an operational baseline") from error
    validate_operational_graph(graph)
    return graph


def _sql_statements(script: str):
    pending = ""
    for line in script.splitlines(keepends=True):
        pending += line
        if sqlite3.complete_statement(pending):
            statement = pending.strip()
            if statement:
                yield statement
            pending = ""
    if pending.strip():
        raise RuntimeError("Incomplete Investigation Library migration statement")


def _utc_text(value: datetime) -> str:
    if value.tzinfo is None or value.utcoffset() is None:
        raise ValueError("Investigation timestamps must be timezone-aware")
    return value.astimezone(timezone.utc).isoformat(
        timespec="microseconds"
    ).replace("+00:00", "Z")


def _utc_now() -> datetime:
    return datetime.now(timezone.utc)


class SQLiteInvestigationRepository:
    """Connection-per-operation durable authority for parent Investigations."""

    def __init__(
        self,
        path: str | Path,
        *,
        clock: Callable[[], datetime] = _utc_now,
    ):
        self.path = Path(path).resolve()
        self.clock = clock
        try:
            self.path.parent.mkdir(parents=True, exist_ok=True)
            self._migrate()
        except (OSError, sqlite3.Error) as error:
            raise RepositoryUnavailable(
                "Investigation repository is unavailable"
            ) from error

    def _connect(self) -> sqlite3.Connection:
        connection = sqlite3.connect(self.path, timeout=5, isolation_level=None)
        connection.row_factory = sqlite3.Row
        connection.execute("PRAGMA busy_timeout=5000")
        connection.execute("PRAGMA foreign_keys=ON")
        connection.execute("PRAGMA synchronous=FULL")
        try:
            connection.execute("PRAGMA journal_mode=WAL")
        except sqlite3.OperationalError as error:
            if "locked" not in str(error).lower(): raise
        return connection

    @staticmethod
    def _operational_from_row(row: sqlite3.Row) -> OperationalGraphRevision:
        try:
            recorded_at = datetime.fromisoformat(row["recorded_at"].replace("Z", "+00:00"))
            graph = json.loads(row["graph_snapshot_json"])
            model = OperationalGraphRevision(
                investigation_id=row["investigation_id"],
                operational_revision_id=row["operational_revision_id"],
                revision_number=row["revision_number"],
                parent_operational_revision_id=row["parent_operational_revision_id"],
                graph_snapshot=graph, graph_fingerprint=row["graph_fingerprint"],
                graph_schema_version=row["graph_schema_version"],
                algorithm_version=row["algorithm_version"],
                actor_authority=row["actor_authority"], recorded_at=recorded_at,
                mutation_kind=row["mutation_kind"], source_identity=row["source_identity"],
            )
            if (model.graph_schema_version != GRAPH_SCHEMA_VERSION
                    or operational_graph_fingerprint(graph) != model.graph_fingerprint):
                raise ValueError("invalid persisted operational fingerprint")
            return model
        except (KeyError, TypeError, ValueError, json.JSONDecodeError) as error:
            raise InvalidStoredInvestigation("Stored operational revision is invalid") from error

    @staticmethod
    def _insert_operational_revision(connection: sqlite3.Connection,
                                     revision: OperationalGraphRevision) -> None:
        validate_operational_graph(revision.graph_snapshot)
        fingerprint = operational_graph_fingerprint(revision.graph_snapshot)
        if revision.graph_schema_version != GRAPH_SCHEMA_VERSION or revision.graph_fingerprint != fingerprint:
            raise InvalidOperationalGraph("Operational graph fingerprint does not match its snapshot")
        connection.execute(
            "INSERT INTO investigation_operational_revision "
            "(investigation_id,operational_revision_id,revision_number,parent_operational_revision_id,"
            "graph_snapshot_json,graph_fingerprint,graph_schema_version,algorithm_version,actor_authority,"
            "recorded_at,mutation_kind,source_identity) VALUES (?,?,?,?,?,?,?,?,?,?,?,?)",
            (revision.investigation_id, revision.operational_revision_id, revision.revision_number,
             revision.parent_operational_revision_id,
             json.dumps(revision.graph_snapshot, ensure_ascii=False, sort_keys=True, separators=(",", ":")),
             revision.graph_fingerprint, revision.graph_schema_version, revision.algorithm_version,
             revision.actor_authority, _utc_text(revision.recorded_at), revision.mutation_kind,
             revision.source_identity),
        )

    def _migrate(self) -> None:
        with closing(self._connect()) as connection:
            # Write serialization precedes both migration-history inspection and
            # decisions, preventing the stale-history cold-start race from I2K.
            connection.execute("BEGIN IMMEDIATE")
            try:
                connection.execute(
                    "CREATE TABLE IF NOT EXISTS investigation_schema_migrations "
                    "(version INTEGER PRIMARY KEY, applied_at TEXT NOT NULL)"
                )
                versions = {
                    row[0] for row in connection.execute(
                        "SELECT version FROM investigation_schema_migrations"
                    )
                }
                if versions and max(versions) > SCHEMA_VERSION:
                    raise RepositoryUnavailable(
                        "Investigation database schema is newer than this application"
                    )
                for version in range(1, SCHEMA_VERSION + 1):
                    if version in versions:
                        continue
                    migration = Path(__file__).with_name("migrations").joinpath(
                        f"{version:03d}_investigations.sql"
                    ).read_text(encoding="utf-8")
                    for statement in _sql_statements(migration):
                        connection.execute(statement)
                    connection.execute(
                        "INSERT INTO investigation_schema_migrations VALUES (?, ?)",
                        (version, _utc_text(self.clock())),
                    )
                connection.commit()
            except Exception:
                connection.rollback()
                raise

    @staticmethod
    def _from_row(row: sqlite3.Row) -> Investigation:
        try:
            created_at = datetime.fromisoformat(row["created_at"].replace("Z", "+00:00"))
            modified_at = datetime.fromisoformat(row["modified_at"].replace("Z", "+00:00"))
            if (
                created_at.tzinfo is None
                or modified_at.tzinfo is None
                or created_at.utcoffset() is None
                or modified_at.utcoffset() is None
                or row["version"] < 0
                or not row["investigation_id"]
                or not row["owner_principal_id"]
                or not row["title"]
            ):
                raise ValueError("Invalid Investigation row")
            return Investigation(
                investigation_id=row["investigation_id"],
                owner_principal_id=row["owner_principal_id"],
                title=row["title"],
                objective=row["objective"],
                lifecycle=InvestigationLifecycle(row["lifecycle"]),
                created_at=created_at.astimezone(timezone.utc),
                modified_at=modified_at.astimezone(timezone.utc),
                version=row["version"],
            )
        except (KeyError, TypeError, ValueError) as error:
            raise InvalidStoredInvestigation(
                "Stored Investigation data is invalid"
            ) from error

    def list_owned(self, *, owner_principal_id: str) -> list[Investigation]:
        try:
            with closing(self._connect()) as connection:
                rows = connection.execute(
                    "SELECT * FROM investigation "
                    "WHERE owner_principal_id=? AND lifecycle=? "
                    "ORDER BY modified_at DESC, investigation_id ASC",
                    (owner_principal_id, InvestigationLifecycle.ACTIVE.value),
                ).fetchall()
                return [self._from_row(row) for row in rows]
        except sqlite3.Error as error:
            raise RepositoryUnavailable(
                "Investigation repository is unavailable"
            ) from error

    def get_owned(
        self, *, investigation_id: str, owner_principal_id: str
    ) -> Investigation | None:
        try:
            with closing(self._connect()) as connection:
                row = connection.execute(
                    "SELECT * FROM investigation "
                    "WHERE investigation_id=? AND owner_principal_id=?",
                    (investigation_id, owner_principal_id),
                ).fetchone()
                return self._from_row(row) if row is not None else None
        except sqlite3.Error as error:
            raise RepositoryUnavailable(
                "Investigation repository is unavailable"
            ) from error

    def create(
        self,
        *,
        investigation_id: str,
        owner_principal_id: str,
        title: str,
        objective: str | None = None,
    ) -> Investigation:
        occurred_at = _utc_text(self.clock())
        try:
            with closing(self._connect()) as connection:
                connection.execute("BEGIN IMMEDIATE")
                try:
                    connection.execute(
                        "INSERT INTO investigation "
                        "(investigation_id,owner_principal_id,title,objective,lifecycle,"
                        "created_at,modified_at,version) VALUES (?,?,?,?,?,?,?,?)",
                        (
                            investigation_id,
                            owner_principal_id,
                            title,
                            objective,
                            InvestigationLifecycle.ACTIVE.value,
                            occurred_at,
                            occurred_at,
                            0,
                        ),
                    )
                    connection.execute(
                        "INSERT INTO investigation_aggregate (investigation_id,schema_version,state,revision) VALUES (?,?,?,?)",
                        (investigation_id, "investigation-aggregate/v1", "EMPTY", 0),
                    )
                    row = connection.execute(
                        "SELECT * FROM investigation WHERE investigation_id=?",
                        (investigation_id,),
                    ).fetchone()
                    connection.commit()
                    return self._from_row(row)
                except Exception:
                    connection.rollback()
                    raise
        except sqlite3.IntegrityError as error:
            if "investigation.investigation_id" in str(error):
                raise DuplicateInvestigationId(
                    "Investigation ID already exists"
                ) from error
            raise RepositoryUnavailable(
                "Investigation repository rejected the write"
            ) from error
        except sqlite3.Error as error:
            raise RepositoryUnavailable(
                "Investigation repository is unavailable"
            ) from error

    @staticmethod
    def _aggregate_from_row(row: sqlite3.Row) -> InvestigationAggregate:
        try:
            if (not row["investigation_id"] or row["schema_version"] != "investigation-aggregate/v1"
                    or row["state"] not in ("EMPTY", "ADOPTED")
                    or (row["state"] == "EMPTY" and row["revision"] != 0)
                    or (row["state"] == "ADOPTED" and row["revision"] < 1)):
                raise ValueError("Invalid aggregate")
            payload = json.loads(row["payload_json"]) if "payload_json" in row.keys() and row["payload_json"] else None
            return InvestigationAggregate(
                investigation_id=row["investigation_id"],
                schema_version=row["schema_version"], state=row["state"],
                revision=row["revision"], payload=payload,
            )
        except (KeyError, TypeError, ValueError) as error:
            raise InvalidStoredInvestigation(
                "Stored Investigation aggregate is invalid"
            ) from error

    def create_empty_owned(
        self, *, investigation_id: str, owner_principal_id: str, title: str,
        objective: str | None, idempotency_key: str, command_hash: str,
    ) -> tuple[Investigation, InvestigationAggregate, bool]:
        occurred_at = _utc_text(self.clock())
        try:
            with closing(self._connect()) as connection:
                connection.execute("BEGIN IMMEDIATE")
                try:
                    replay = connection.execute(
                        "SELECT command_hash,investigation_id FROM investigation_idempotency "
                        "WHERE owner_principal_id=? AND operation='CREATE' AND idempotency_key=?",
                        (owner_principal_id, idempotency_key),
                    ).fetchone()
                    if replay is not None:
                        if replay["command_hash"] != command_hash:
                            raise IdempotencyKeyReuse(
                                "Idempotency key was reused with different command content"
                            )
                        parent = connection.execute(
                            "SELECT * FROM investigation WHERE investigation_id=? AND owner_principal_id=?",
                            (replay["investigation_id"], owner_principal_id),
                        ).fetchone()
                        aggregate = connection.execute(
                            "SELECT * FROM investigation_aggregate WHERE investigation_id=?",
                            (replay["investigation_id"],),
                        ).fetchone()
                        if parent is None or aggregate is None:
                            raise InvalidStoredInvestigation(
                                "Stored Investigation idempotency result is invalid"
                            )
                        connection.commit()
                        return self._from_row(parent), self._aggregate_from_row(aggregate), True
                    connection.execute(
                        "INSERT INTO investigation "
                        "(investigation_id,owner_principal_id,title,objective,lifecycle,created_at,modified_at,version) "
                        "VALUES (?,?,?,?,?,?,?,?)",
                        (investigation_id, owner_principal_id, title, objective,
                         InvestigationLifecycle.ACTIVE.value, occurred_at, occurred_at, 0),
                    )
                    connection.execute(
                        "INSERT INTO investigation_aggregate (investigation_id,schema_version,state,revision) VALUES (?,?,?,?)",
                        (investigation_id, "investigation-aggregate/v1", "EMPTY", 0),
                    )
                    connection.execute(
                        "INSERT INTO investigation_idempotency VALUES (?,?,?,?,?,?)",
                        (owner_principal_id, "CREATE", idempotency_key, command_hash,
                         investigation_id, occurred_at),
                    )
                    parent = connection.execute(
                        "SELECT * FROM investigation WHERE investigation_id=?", (investigation_id,)
                    ).fetchone()
                    aggregate = connection.execute(
                        "SELECT * FROM investigation_aggregate WHERE investigation_id=?", (investigation_id,)
                    ).fetchone()
                    connection.commit()
                    return self._from_row(parent), self._aggregate_from_row(aggregate), False
                except Exception:
                    connection.rollback()
                    raise
        except sqlite3.IntegrityError as error:
            if "investigation.investigation_id" in str(error):
                raise DuplicateInvestigationId("Investigation ID already exists") from error
            raise RepositoryUnavailable("Investigation repository rejected the write") from error
        except sqlite3.Error as error:
            raise RepositoryUnavailable("Investigation repository is unavailable") from error

    def get_empty_aggregate(
        self, *, investigation_id: str, owner_principal_id: str
    ) -> InvestigationAggregate | None:
        try:
            with closing(self._connect()) as connection:
                row = connection.execute(
                    "SELECT aggregate.* FROM investigation_aggregate aggregate "
                    "JOIN investigation parent ON parent.investigation_id=aggregate.investigation_id "
                    "WHERE aggregate.investigation_id=? AND parent.owner_principal_id=?",
                    (investigation_id, owner_principal_id),
                ).fetchone()
                return self._aggregate_from_row(row) if row is not None else None
        except sqlite3.Error as error:
            raise RepositoryUnavailable("Investigation repository is unavailable") from error

    def adopt_guest_owned(self, *, investigation_id: str, owner_principal_id: str,
                          title: str, objective: str | None, idempotency_key: str,
                          command_hash: str, payload: dict,
                          operational_revision: OperationalGraphRevision | None = None):
        occurred_at = _utc_text(self.clock())
        canonical_json = json.dumps(payload, ensure_ascii=False, sort_keys=True, separators=(",", ":"))
        if operational_revision is None:
            graph = _legacy_payload_graph(payload)
            timestamp = payload.get("source", {}).get("snapshotUpdatedAt")
            if not isinstance(timestamp, str):
                raise InvalidOperationalGraph("Adoption operational timestamp is unavailable")
            operational_revision = OperationalGraphRevision(
                investigation_id, "REV-0001", 1, None, graph,
                operational_graph_fingerprint(graph), GRAPH_SCHEMA_VERSION,
                "COMPATIBILITY_WORKSPACE_PROJECTION_V1", "GUEST_ADOPTION",
                datetime.fromisoformat(timestamp.replace("Z", "+00:00")),
                "GUEST_ADOPTION_INITIAL", payload.get("source", {}).get("guestInvestigationId"))
        try:
            with closing(self._connect()) as connection:
                connection.execute("BEGIN IMMEDIATE")
                try:
                    replay = connection.execute(
                        "SELECT command_hash,investigation_id FROM investigation_adoption_idempotency WHERE owner_principal_id=? AND idempotency_key=?",
                        (owner_principal_id, idempotency_key)).fetchone()
                    if replay:
                        if replay["command_hash"] != command_hash:
                            raise IdempotencyKeyReuse("Idempotency key was reused with different command content")
                        return_value = self._read_adoption(connection, replay["investigation_id"], owner_principal_id, True)
                        connection.commit()
                        return return_value
                    connection.execute("INSERT INTO investigation VALUES (?,?,?,?,?,?,?,?)", (
                        investigation_id, owner_principal_id, title, objective,
                        InvestigationLifecycle.ACTIVE.value, occurred_at, occurred_at, 1))
                    connection.execute("INSERT INTO investigation_aggregate (investigation_id,schema_version,state,revision,payload_json) VALUES (?,?,?,?,?)",
                                       (investigation_id, "investigation-aggregate/v1", "ADOPTED", 1, canonical_json))
                    if (operational_revision.investigation_id != investigation_id
                            or operational_revision.revision_number != 1
                            or operational_revision.parent_operational_revision_id is not None):
                        raise InvalidOperationalGraph("Initial operational revision lineage is invalid")
                    self._insert_operational_revision(connection, operational_revision)
                    connection.execute("INSERT INTO investigation_operational_head VALUES (?,?)",
                                       (investigation_id, operational_revision.operational_revision_id))
                    source = payload["source"]
                    connection.execute("INSERT INTO investigation_adoption_receipt VALUES (?,?,?,?,?,?,?,?,?,?)", (
                        investigation_id, owner_principal_id, "GUEST_SESSION", source["guestInvestigationId"],
                        payload["schemaVersion"], source["snapshotUpdatedAt"],
                        hashlib.sha256(canonical_json.encode("utf-8")).hexdigest(),
                        occurred_at, 1, canonical_json))
                    for entry in payload["researchInbox"]:
                        connection.execute("INSERT INTO investigation_research_inbox VALUES (?,?,?,?,?)", (
                            investigation_id, entry["anchorId"], entry["order"], entry["title"], entry["canonicalSourceId"]))
                    for artifact in payload["artifacts"]:
                        connection.execute("INSERT INTO investigation_adopted_artifact VALUES (?,?,?,?,?,?)", (
                            investigation_id, artifact["artifactId"], artifact["kind"], artifact["title"],
                            artifact["content"], json.dumps(artifact["canonicalSourceIds"], ensure_ascii=False, separators=(",", ":"))))
                    connection.execute("INSERT INTO investigation_adoption_idempotency VALUES (?,?,?,?,?)", (
                        owner_principal_id, idempotency_key, command_hash, investigation_id, occurred_at))
                    connection.execute("INSERT INTO account_active_investigation VALUES (?,?,?) ON CONFLICT(owner_principal_id) DO UPDATE SET investigation_id=excluded.investigation_id,activated_at=excluded.activated_at",
                                       (owner_principal_id, investigation_id, occurred_at))
                    result = self._read_adoption(connection, investigation_id, owner_principal_id, False)
                    connection.commit()
                    return result
                except Exception:
                    connection.rollback()
                    raise
        except sqlite3.IntegrityError as error:
            if "investigation.investigation_id" in str(error):
                raise DuplicateInvestigationId("Investigation ID already exists") from error
            raise RepositoryUnavailable("Investigation repository rejected the adoption") from error
        except sqlite3.Error as error:
            raise RepositoryUnavailable("Investigation repository is unavailable") from error

    def _read_adoption(self, connection, investigation_id: str, owner_principal_id: str, replayed: bool):
        parent = connection.execute("SELECT * FROM investigation WHERE investigation_id=? AND owner_principal_id=?", (investigation_id, owner_principal_id)).fetchone()
        aggregate = connection.execute("SELECT * FROM investigation_aggregate WHERE investigation_id=?", (investigation_id,)).fetchone()
        receipt = connection.execute("SELECT * FROM investigation_adoption_receipt WHERE investigation_id=? AND owner_principal_id=?", (investigation_id, owner_principal_id)).fetchone()
        active = connection.execute("SELECT investigation_id FROM account_active_investigation WHERE owner_principal_id=?", (owner_principal_id,)).fetchone()
        if not parent or not aggregate or not receipt or not active or active[0] != investigation_id:
            raise InvalidStoredInvestigation("Stored adoption result is invalid")
        adopted_at = datetime.fromisoformat(receipt["adopted_at"].replace("Z", "+00:00"))
        snapshot_at = datetime.fromisoformat(receipt["source_snapshot_timestamp"].replace("Z", "+00:00"))
        model = AdoptionReceipt(investigation_id, owner_principal_id, receipt["source_guest_investigation_id"],
            receipt["source_schema_version"], snapshot_at, receipt["payload_digest"], adopted_at,
            receipt["resulting_revision"], json.loads(receipt["payload_json"]))
        return self._from_row(parent), self._aggregate_from_row(aggregate), model, replayed

    def get_active_owned(self, *, owner_principal_id: str):
        try:
            with closing(self._connect()) as connection:
                row = connection.execute("SELECT investigation_id FROM account_active_investigation WHERE owner_principal_id=?", (owner_principal_id,)).fetchone()
                if row is None:
                    return None
                parent = connection.execute("SELECT * FROM investigation WHERE investigation_id=? AND owner_principal_id=?", (row[0], owner_principal_id)).fetchone()
                aggregate = connection.execute("SELECT * FROM investigation_aggregate WHERE investigation_id=?", (row[0],)).fetchone()
                if parent is None or aggregate is None:
                    raise InvalidStoredInvestigation("Stored active investigation is invalid")
                return self._from_row(parent), self._aggregate_from_row(aggregate)
        except sqlite3.Error as error:
            raise RepositoryUnavailable("Investigation repository is unavailable") from error

    def import_canon_event_owned(self, *, investigation_id, owner_principal_id,
                                 expected_revision, idempotency_key, command_hash, payload,
                                 operational_revision, expected_operational_head_id):
        occurred_at = _utc_text(self.clock())
        canonical_json = json.dumps(payload, ensure_ascii=False, sort_keys=True, separators=(",", ":"))
        try:
            with closing(self._connect()) as connection:
                connection.execute("BEGIN IMMEDIATE")
                replay = connection.execute("SELECT command_hash FROM investigation_idempotency WHERE owner_principal_id=? AND operation='IMPORT_CANON' AND idempotency_key=?", (owner_principal_id, idempotency_key)).fetchone()
                if replay:
                    if replay["command_hash"] != command_hash: raise IdempotencyKeyReuse("Idempotency key was reused with different command content")
                    parent = connection.execute("SELECT * FROM investigation WHERE investigation_id=? AND owner_principal_id=?", (investigation_id, owner_principal_id)).fetchone(); aggregate = connection.execute("SELECT * FROM investigation_aggregate WHERE investigation_id=?", (investigation_id,)).fetchone()
                    if not parent or not aggregate: raise InvalidStoredInvestigation("Stored import result is invalid")
                    connection.commit(); return self._from_row(parent), self._aggregate_from_row(aggregate), True, False
                parent = connection.execute("SELECT * FROM investigation WHERE investigation_id=? AND owner_principal_id=?", (investigation_id, owner_principal_id)).fetchone()
                if not parent: raise InvestigationNotFound("Investigation was not found")
                aggregate = connection.execute("SELECT * FROM investigation_aggregate WHERE investigation_id=?", (investigation_id,)).fetchone()
                if not aggregate: raise InvalidStoredInvestigation("Investigation aggregate is unavailable")
                if aggregate["revision"] != expected_revision: raise RevisionConflict("Expected investigation revision is stale")
                head = connection.execute("SELECT operational_revision_id FROM investigation_operational_head WHERE investigation_id=?", (investigation_id,)).fetchone()
                actual_head = head[0] if head else None
                if actual_head != expected_operational_head_id:
                    raise OperationalRevisionConflict("Expected operational revision head is stale")
                existing = json.loads(aggregate["payload_json"]) if aggregate["payload_json"] else None
                duplicate = bool(existing and payload["viewState"]["focusedEventId"] in [n.get("canonicalEventId") for n in existing["workspace"]["nodes"]])
                if duplicate: connection.commit(); return self._from_row(parent), self._aggregate_from_row(aggregate), False, True
                revision = expected_revision + 1
                expected_number = 1
                if head:
                    head_row = connection.execute("SELECT revision_number FROM investigation_operational_revision WHERE investigation_id=? AND operational_revision_id=?", (investigation_id, actual_head)).fetchone()
                    if not head_row: raise InvalidStoredInvestigation("Operational head is invalid")
                    expected_number = head_row[0] + 1
                if (operational_revision.investigation_id != investigation_id
                        or operational_revision.revision_number != expected_number
                        or operational_revision.parent_operational_revision_id != actual_head):
                    raise OperationalRevisionConflict("Operational revision does not extend the current head")
                self._insert_operational_revision(connection, operational_revision)
                connection.execute("INSERT INTO investigation_operational_head VALUES (?,?) ON CONFLICT(investigation_id) DO UPDATE SET operational_revision_id=excluded.operational_revision_id", (investigation_id, operational_revision.operational_revision_id))
                connection.execute("UPDATE investigation_aggregate SET state='ADOPTED',revision=?,payload_json=? WHERE investigation_id=?", (revision, canonical_json, investigation_id))
                connection.execute("UPDATE investigation SET modified_at=?,version=version+1 WHERE investigation_id=?", (occurred_at, investigation_id))
                connection.execute("INSERT INTO investigation_idempotency VALUES (?,?,?,?,?,?)", (owner_principal_id, "IMPORT_CANON", idempotency_key, command_hash, investigation_id, occurred_at))
                connection.execute("INSERT INTO account_active_investigation VALUES (?,?,?) ON CONFLICT(owner_principal_id) DO UPDATE SET investigation_id=excluded.investigation_id,activated_at=excluded.activated_at", (owner_principal_id, investigation_id, occurred_at))
                parent = connection.execute("SELECT * FROM investigation WHERE investigation_id=?", (investigation_id,)).fetchone(); aggregate = connection.execute("SELECT * FROM investigation_aggregate WHERE investigation_id=?", (investigation_id,)).fetchone(); connection.commit()
                return self._from_row(parent), self._aggregate_from_row(aggregate), False, False
        except sqlite3.Error as error: raise RepositoryUnavailable("Investigation repository is unavailable") from error

    def get_current_operational_revision(self, *, investigation_id: str,
                                         owner_principal_id: str):
        lineage = self.get_operational_revision_lineage(
            investigation_id=investigation_id, owner_principal_id=owner_principal_id)
        return lineage.revisions[-1] if lineage else None

    def get_operational_revision_lineage(self, *, investigation_id: str,
                                         owner_principal_id: str):
        try:
            with closing(self._connect()) as connection:
                parent = connection.execute("SELECT 1 FROM investigation WHERE investigation_id=? AND owner_principal_id=?", (investigation_id, owner_principal_id)).fetchone()
                if not parent:
                    return None
                head = connection.execute("SELECT operational_revision_id FROM investigation_operational_head WHERE investigation_id=?", (investigation_id,)).fetchone()
                rows = connection.execute("SELECT * FROM investigation_operational_revision WHERE investigation_id=? ORDER BY revision_number", (investigation_id,)).fetchall()
                if not head and not rows:
                    return None
                revisions = tuple(self._operational_from_row(row) for row in rows)
                for index, revision in enumerate(revisions):
                    expected_parent = None if index == 0 else revisions[index - 1].operational_revision_id
                    if revision.revision_number != index + 1 or revision.parent_operational_revision_id != expected_parent:
                        raise InvalidStoredInvestigation("Stored operational lineage is broken")
                if not revisions or revisions[-1].operational_revision_id != head[0]:
                    raise InvalidStoredInvestigation("Stored operational head is invalid")
                return OperationalRevisionLineage(investigation_id, head[0], revisions)
        except sqlite3.Error as error:
            raise RepositoryUnavailable("Investigation repository is unavailable") from error

    def append_operational_revision_owned(self, *, investigation_id: str,
            owner_principal_id: str, expected_operational_head_id: str | None,
            revision: OperationalGraphRevision, aggregate_payload: dict,
            expected_aggregate_revision: int):
        occurred_at = _utc_text(self.clock())
        try:
            with closing(self._connect()) as connection:
                connection.execute("BEGIN IMMEDIATE")
                parent = connection.execute("SELECT * FROM investigation WHERE investigation_id=? AND owner_principal_id=?", (investigation_id, owner_principal_id)).fetchone()
                if not parent: raise InvestigationNotFound("Investigation was not found")
                aggregate = connection.execute("SELECT * FROM investigation_aggregate WHERE investigation_id=?", (investigation_id,)).fetchone()
                head = connection.execute("SELECT operational_revision_id FROM investigation_operational_head WHERE investigation_id=?", (investigation_id,)).fetchone()
                actual_head = head[0] if head else None
                if not aggregate or aggregate["revision"] != expected_aggregate_revision:
                    raise RevisionConflict("Expected investigation revision is stale")
                if actual_head != expected_operational_head_id:
                    raise OperationalRevisionConflict("Expected operational revision head is stale")
                expected_number = 1 if not head else connection.execute("SELECT revision_number+1 FROM investigation_operational_revision WHERE investigation_id=? AND operational_revision_id=?", (investigation_id, actual_head)).fetchone()[0]
                if revision.investigation_id != investigation_id or revision.revision_number != expected_number or revision.parent_operational_revision_id != actual_head:
                    raise OperationalRevisionConflict("Operational revision does not extend the current head")
                self._insert_operational_revision(connection, revision)
                connection.execute("INSERT INTO investigation_operational_head VALUES (?,?) ON CONFLICT(investigation_id) DO UPDATE SET operational_revision_id=excluded.operational_revision_id", (investigation_id, revision.operational_revision_id))
                connection.execute("UPDATE investigation_aggregate SET state='ADOPTED',revision=revision+1,payload_json=? WHERE investigation_id=?", (json.dumps(aggregate_payload, ensure_ascii=False, sort_keys=True, separators=(",", ":")), investigation_id))
                connection.execute("UPDATE investigation SET modified_at=?,version=version+1 WHERE investigation_id=?", (occurred_at, investigation_id))
                parent = connection.execute("SELECT * FROM investigation WHERE investigation_id=?", (investigation_id,)).fetchone()
                aggregate = connection.execute("SELECT * FROM investigation_aggregate WHERE investigation_id=?", (investigation_id,)).fetchone()
                connection.commit()
                return self._from_row(parent), self._aggregate_from_row(aggregate), revision
        except sqlite3.IntegrityError as error:
            if "UNIQUE constraint failed: investigation_operational_revision" in str(error):
                raise OperationalRevisionConflict("Operational revision identity or number already exists") from error
            raise RepositoryUnavailable("Investigation repository rejected the operational commit") from error
        except sqlite3.Error as error:
            raise RepositoryUnavailable("Investigation repository is unavailable") from error

    @staticmethod
    def _admission_from_row(row):
        return ManifoldArtifactAdmissionReceipt(row["receipt_id"],row["owner_principal_id"],row["investigation_id"],
          row["studio_artifact_id"],row["author_revision_id"],row["projection_id"],row["verified_output_hash"],
          row["admitted_artifact_node_id"],tuple(json.loads(row["selected_relationship_declaration_ids_json"])),
          tuple(json.loads(row["created_relationship_ids_json"])),row["previous_operational_revision_id"],
          row["resulting_operational_revision_id"],row["command_hash"],row["idempotency_key"],
          datetime.fromisoformat(row["admitted_at"].replace("Z","+00:00")))

    def get_manifold_admission_replay(self, *, owner_principal_id, investigation_id,
                                      idempotency_key, command_hash):
        with closing(self._connect()) as connection:
            row=connection.execute("SELECT * FROM investigation_manifold_artifact_admission_receipt WHERE owner_principal_id=? AND investigation_id=? AND idempotency_key=?",(owner_principal_id,investigation_id,idempotency_key)).fetchone()
            if row is None: return None
            if row["command_hash"]!=command_hash: raise IdempotencyKeyReuse("Idempotency key was reused with different command content")
            return self._admission_from_row(row)

    def admit_manifold_artifact_owned(self, *, owner_principal_id, investigation_id,
            expected_operational_head_id, expected_aggregate_revision, revision, aggregate_payload,
            receipt: ManifoldArtifactAdmissionReceipt):
        occurred_at=_utc_text(self.clock())
        try:
            with closing(self._connect()) as connection:
                connection.execute("BEGIN IMMEDIATE")
                prior=connection.execute("SELECT * FROM investigation_manifold_artifact_admission_receipt WHERE owner_principal_id=? AND investigation_id=? AND idempotency_key=?",(owner_principal_id,investigation_id,receipt.idempotency_key)).fetchone()
                if prior:
                    if prior["command_hash"]!=receipt.command_hash: raise IdempotencyKeyReuse("Idempotency key was reused with different command content")
                    connection.commit(); return self._admission_from_row(prior), True
                duplicate=connection.execute("SELECT * FROM investigation_manifold_artifact_admission_receipt WHERE owner_principal_id=? AND investigation_id=? AND projection_id=?",(owner_principal_id,investigation_id,receipt.projection_id)).fetchone()
                if duplicate: raise ManifoldArtifactAlreadyAdmitted("Projection has already been admitted")
                parent=connection.execute("SELECT * FROM investigation WHERE investigation_id=? AND owner_principal_id=?",(investigation_id,owner_principal_id)).fetchone()
                if not parent: raise InvestigationNotFound("Investigation was not found")
                aggregate=connection.execute("SELECT * FROM investigation_aggregate WHERE investigation_id=?",(investigation_id,)).fetchone()
                head=connection.execute("SELECT operational_revision_id FROM investigation_operational_head WHERE investigation_id=?",(investigation_id,)).fetchone()
                actual=head[0] if head else None
                if not aggregate or aggregate["revision"]!=expected_aggregate_revision: raise RevisionConflict("Expected investigation revision is stale")
                if actual!=expected_operational_head_id: raise OperationalRevisionConflict("Expected operational revision head is stale")
                expected_number=1 if not head else connection.execute("SELECT revision_number+1 FROM investigation_operational_revision WHERE investigation_id=? AND operational_revision_id=?",(investigation_id,actual)).fetchone()[0]
                if revision.revision_number!=expected_number or revision.parent_operational_revision_id!=actual: raise OperationalRevisionConflict("Operational revision does not extend the current head")
                self._insert_operational_revision(connection,revision)
                connection.execute("INSERT INTO investigation_operational_head VALUES (?,?) ON CONFLICT(investigation_id) DO UPDATE SET operational_revision_id=excluded.operational_revision_id",(investigation_id,revision.operational_revision_id))
                connection.execute("UPDATE investigation_aggregate SET state='ADOPTED',revision=revision+1,payload_json=? WHERE investigation_id=?",(json.dumps(aggregate_payload,sort_keys=True,separators=(",",":")),investigation_id))
                connection.execute("UPDATE investigation SET modified_at=?,version=version+1 WHERE investigation_id=?",(occurred_at,investigation_id))
                connection.execute("INSERT INTO investigation_manifold_artifact_admission_receipt VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)",(
                  receipt.receipt_id,owner_principal_id,investigation_id,receipt.studio_artifact_id,receipt.author_revision_id,receipt.projection_id,receipt.verified_output_hash,
                  receipt.admitted_artifact_node_id,json.dumps(receipt.selected_relationship_declaration_ids),json.dumps(receipt.created_relationship_ids),actual,
                  revision.operational_revision_id,receipt.command_hash,receipt.idempotency_key,occurred_at,"NONE","REVISION_APPENDED","NONE","NONE","NONE","NONE","NONE"))
                connection.execute("INSERT INTO account_active_investigation VALUES (?,?,?) ON CONFLICT(owner_principal_id) DO UPDATE SET investigation_id=excluded.investigation_id,activated_at=excluded.activated_at",(owner_principal_id,investigation_id,occurred_at))
                stored=connection.execute("SELECT * FROM investigation_manifold_artifact_admission_receipt WHERE receipt_id=?",(receipt.receipt_id,)).fetchone()
                connection.commit(); return self._admission_from_row(stored), False
        except sqlite3.IntegrityError as error:
            raise RepositoryUnavailable("Investigation repository rejected the admission") from error

    def materialize_compatibility_baseline_owned(self, *, investigation_id: str,
            owner_principal_id: str):
        try:
            with closing(self._connect()) as connection:
                connection.execute("BEGIN IMMEDIATE")
                parent = connection.execute("SELECT * FROM investigation WHERE investigation_id=? AND owner_principal_id=?", (investigation_id, owner_principal_id)).fetchone()
                if not parent: raise InvestigationNotFound("Investigation was not found")
                existing = connection.execute("SELECT operational_revision_id FROM investigation_operational_head WHERE investigation_id=?", (investigation_id,)).fetchone()
                if existing:
                    connection.commit()
                    return self.get_operational_revision_lineage(investigation_id=investigation_id, owner_principal_id=owner_principal_id)
                aggregate = connection.execute("SELECT * FROM investigation_aggregate WHERE investigation_id=?", (investigation_id,)).fetchone()
                if not aggregate or aggregate["state"] == "EMPTY":
                    connection.commit()
                    return None
                payload = json.loads(aggregate["payload_json"])
                graph = _legacy_payload_graph(payload)
                source = payload.get("source", {})
                timestamp = source.get("snapshotUpdatedAt") or source.get("importedAt")
                if not isinstance(timestamp, str):
                    raise InvalidStoredInvestigation("Legacy aggregate provenance timestamp is unavailable")
                recorded_at = datetime.fromisoformat(timestamp.replace("Z", "+00:00"))
                revision = OperationalGraphRevision(
                    investigation_id, "MIGRATION-BASELINE-0001", 1, None, graph,
                    operational_graph_fingerprint(graph), GRAPH_SCHEMA_VERSION,
                    "MIGRATION_BASELINE_WORKSPACE_V1", "MIGRATION_AUTHORITY", recorded_at,
                    "MIGRATION_BASELINE", source.get("guestInvestigationId") or source.get("eventId"))
                self._insert_operational_revision(connection, revision)
                connection.execute("INSERT INTO investigation_operational_head VALUES (?,?)",
                                   (investigation_id, revision.operational_revision_id))
                connection.commit()
                return OperationalRevisionLineage(investigation_id, revision.operational_revision_id, (revision,))
        except (json.JSONDecodeError, ValueError) as error:
            raise InvalidStoredInvestigation("Legacy aggregate cannot form an operational baseline") from error
        except sqlite3.Error as error:
            raise RepositoryUnavailable("Investigation repository is unavailable") from error
