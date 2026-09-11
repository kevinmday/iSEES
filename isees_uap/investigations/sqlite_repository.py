from __future__ import annotations

import sqlite3
import json
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
)
from .models import AdoptionReceipt, Investigation, InvestigationAggregate, InvestigationLifecycle

SCHEMA_VERSION = 4


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
                          command_hash: str, payload: dict):
        occurred_at = _utc_text(self.clock())
        canonical_json = json.dumps(payload, ensure_ascii=False, sort_keys=True, separators=(",", ":"))
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
                    source = payload["source"]
                    connection.execute("INSERT INTO investigation_adoption_receipt VALUES (?,?,?,?,?,?,?,?,?,?)", (
                        investigation_id, owner_principal_id, "GUEST_SESSION", source["guestInvestigationId"],
                        payload["schemaVersion"], source["snapshotUpdatedAt"], command_hash, occurred_at, 1, canonical_json))
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
                                 expected_revision, idempotency_key, command_hash, payload):
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
                existing = json.loads(aggregate["payload_json"]) if aggregate["payload_json"] else None
                duplicate = bool(existing and payload["viewState"]["focusedEventId"] in [n.get("canonicalEventId") for n in existing["workspace"]["nodes"]])
                if duplicate: connection.commit(); return self._from_row(parent), self._aggregate_from_row(aggregate), False, True
                revision = expected_revision + 1
                connection.execute("UPDATE investigation_aggregate SET state='ADOPTED',revision=?,payload_json=? WHERE investigation_id=?", (revision, canonical_json, investigation_id))
                connection.execute("UPDATE investigation SET modified_at=?,version=version+1 WHERE investigation_id=?", (occurred_at, investigation_id))
                connection.execute("INSERT INTO investigation_idempotency VALUES (?,?,?,?,?,?)", (owner_principal_id, "IMPORT_CANON", idempotency_key, command_hash, investigation_id, occurred_at))
                connection.execute("INSERT INTO account_active_investigation VALUES (?,?,?) ON CONFLICT(owner_principal_id) DO UPDATE SET investigation_id=excluded.investigation_id,activated_at=excluded.activated_at", (owner_principal_id, investigation_id, occurred_at))
                parent = connection.execute("SELECT * FROM investigation WHERE investigation_id=?", (investigation_id,)).fetchone(); aggregate = connection.execute("SELECT * FROM investigation_aggregate WHERE investigation_id=?", (investigation_id,)).fetchone(); connection.commit()
                return self._from_row(parent), self._aggregate_from_row(aggregate), False, False
        except sqlite3.Error as error: raise RepositoryUnavailable("Investigation repository is unavailable") from error
