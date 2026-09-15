from __future__ import annotations

import json
import sqlite3
from contextlib import closing
from datetime import datetime, timezone
from pathlib import Path
from typing import Any, Callable

from .authorization import AuthorizationDecision
from .canonical import canonical_bytes, canonical_hash
from .contracts import *
from .contracts import _micros, _time
from .errors import *
from .fixture import (CandidateKnowledgeBundle, CandidateLineage, CandidateNode,
                      SourceDocument, SourceFieldLineage)
from .lifecycle import transition_assignment
from .models import *

SCHEMA_VERSION = 2

def _now() -> datetime: return datetime.now(timezone.utc)
def _text_time(value: datetime) -> str:
    _time(value, "timestamp")
    return value.astimezone(timezone.utc).isoformat(timespec="microseconds").replace("+00:00", "Z")
def _parse_time(value: str) -> datetime: return datetime.fromisoformat(value.replace("Z", "+00:00"))
def _id(value: Any) -> str: return str(value)
def _json(payload: bytes | str) -> Any: return json.loads(payload)

def _manifold(d): return ManifoldRevisionReference(d["investigation_id"],d["revision_id"],d["revision_hash"],d["ontology_version"],d["configuration_hash"])
def _assignment(payload: bytes) -> FrontierAssignmentRevision:
    d=_json(payload)
    return FrontierAssignmentRevision(
        FrontierAssignmentId(d["assignment_id"]["value"]),FrontierAssignmentRevisionId(d["revision_id"]["value"]),d["revision_number"],
        FrontierAssignmentRevisionId(d["parent_revision_id"]["value"]) if d["parent_revision_id"] else None,
        d["owner_subject_id"],d["governing_subject_id"],d["investigation_id"],d["target_id"],TargetKind(d["target_kind"]),
        d["research_objective"],tuple(d["scope"]),tuple(d["exclusions"]),Lifecycle(d["lifecycle"]),
        TriggerPolicy(tuple(TriggerKind(x) for x in d["trigger_policy"]["allowed_kinds"]),d["trigger_policy"]["coalescing_version"]),
        FreshnessPolicy(**d["freshness_policy"]),SourcePolicy(tuple(SourceClass(x) for x in d["source_policy"]["allowed_source_classes"]),d["source_policy"]["policy_version"]),
        d["privacy_policy_reference"],d["risk_policy_reference"],EntitlementSnapshotId(d["entitlement_snapshot_id"]["value"]),ExecutionCeilings(**d["execution_ceilings"]),
        tuple(tuple(x) for x in d["source_cursor_state"]),_parse_time(d["created_at"]),_parse_time(d["effective_at"]),d["created_by"],d["transition_reason"],
        SuspensionReason(d["suspension_reason"]) if d["suspension_reason"] else None,d["content_hash"])

def _source(d): return SourceDocument(d["locator"],d["version"],d["media_type"],SourceClass(d["source_class"]),tuple(tuple(x) for x in d["structured_material"]),d["content_hash"])
def _bundle(payload: bytes) -> CandidateKnowledgeBundle:
    d=_json(payload); src=_source(d["source_document"])
    candidates=tuple(CandidateNode(x["candidate_id"],x["kind"],x["label"],x["claim"],CandidateEpistemicClassification(x["epistemic_classification"]),CandidateReviewStatus(x["review_status"]),CanonEffect(x["canon_effect"])) for x in d["candidates"])
    lineage=tuple(CandidateLineage(x["candidate_id"],x["source_locator"],x["source_version"],tuple(SourceFieldLineage(**f) for f in x["fields"]),x["supplied_by"]) for x in d["lineage"])
    return CandidateKnowledgeBundle(CandidateKnowledgeBundleId(d["bundle_id"]["value"]),src,candidates,lineage,d["source_locator"],d["source_version"],d["adapter_identity"],d["adapter_version"],d["normalizer_identity"],d["normalizer_version"],d["source_content_hash"],d["configuration_hash"],FrontierAssignmentRevisionId(d["assignment_revision_id"]["value"]),_manifold(d["manifold_revision"]),SearchExecutionId(d["execution_id"]["value"]),AiAssistanceStatus(d["ai_assistance_status"]),d["provider_identity"],d["model_identity"],ModelClass(d["model_class"]),d["content_hash"])

class SQLiteRexRepository:
    """Isolated, explicitly initialized, connection-per-operation REX store."""
    def __init__(self, path: str | Path, *, clock: Callable[[],datetime]=_now, busy_timeout_ms: int=5000):
        self.path=Path(path); self.clock=clock
        if type(busy_timeout_ms) is not int or busy_timeout_ms < 0: raise ValueError("busy timeout must be a non-negative integer")
        self.busy_timeout_ms=busy_timeout_ms

    def _connect(self):
        db=sqlite3.connect(self.path,timeout=self.busy_timeout_ms/1000,isolation_level=None)
        db.row_factory=sqlite3.Row; db.execute(f"PRAGMA busy_timeout={self.busy_timeout_ms}"); db.execute("PRAGMA foreign_keys=ON"); db.execute("PRAGMA synchronous=FULL")
        try: db.execute("PRAGMA journal_mode=WAL")
        except sqlite3.OperationalError as e:
            if "locked" not in str(e).lower(): raise
        return db

    def initialize(self):
        try:
            self.path.parent.mkdir(parents=True,exist_ok=True)
            with closing(self._connect()) as db:
                db.execute("BEGIN IMMEDIATE")
                db.execute("CREATE TABLE IF NOT EXISTS rex_schema_migrations(version INTEGER PRIMARY KEY, applied_at TEXT NOT NULL)")
                versions=[x[0] for x in db.execute("SELECT version FROM rex_schema_migrations ORDER BY version")]
                if any(v<1 or v>SCHEMA_VERSION for v in versions): raise SchemaMismatch("REX database schema is incompatible")
                if 1 in versions:
                    required={"rex_assignments","rex_assignment_revisions","rex_eligibility_events","rex_authorization_decisions","rex_search_executions","rex_jobs","rex_budget_reservations","rex_usage_ledger","rex_candidate_bundles","rex_candidate_lineage","rex_research_publications","rex_state_history"}
                    if 2 in versions: required.add("rex_execution_receipts")
                    present={r[0] for r in db.execute("SELECT name FROM sqlite_master WHERE type='table'")}
                    if not required <= present: raise SchemaMismatch("REX database schema is incomplete")
                if 1 not in versions:
                    db.executescript(Path(__file__).with_name("migrations").joinpath("001_rex_foundation.sql").read_text(encoding="utf-8"))
                    db.execute("INSERT INTO rex_schema_migrations VALUES(?,?)",(1,_text_time(self.clock())))
                if 2 not in versions:
                    db.executescript(Path(__file__).with_name("migrations").joinpath("002_rex_execution_receipts.sql").read_text(encoding="utf-8"))
                    db.execute("INSERT INTO rex_schema_migrations VALUES(?,?)",(2,_text_time(self.clock())))
                db.commit()
        except SchemaMismatch: raise
        except (OSError,sqlite3.Error) as e: raise RepositoryUnavailable("REX repository is unavailable") from e

    def schema_version(self):
        try:
            with closing(self._connect()) as db:
                rows=[x[0] for x in db.execute("SELECT version FROM rex_schema_migrations ORDER BY version")]
            if rows != list(range(1,SCHEMA_VERSION+1)): raise SchemaMismatch("REX database schema is incompatible")
            return rows[-1]
        except SchemaMismatch: raise
        except sqlite3.Error as e: raise RepositoryUnavailable("REX repository is unavailable") from e

    def _read_payload(self,row,field,hash_field,decoder):
        try:
            obj=decoder(row[field])
            expected=getattr(obj,"content_hash",canonical_hash(obj))
            if row[hash_field] != expected: raise ContentHashMismatch("Stored REX content hash does not match")
            return obj
        except ContentHashMismatch: raise
        except Exception as e: raise InvalidStoredRecord("Stored REX record is invalid") from e

    def create_assignment(self, revision: FrontierAssignmentRevision):
        if revision.revision_number!=1 or revision.parent_revision_id is not None or revision.lifecycle is not Lifecycle.SLEEPING: raise RevisionConflict("Initial assignment revision is invalid")
        p=canonical_bytes(revision)
        try:
            with closing(self._connect()) as db:
                db.execute("BEGIN IMMEDIATE")
                db.execute("INSERT INTO rex_assignments VALUES(?,?,?,?,?,?,?,?,?,?,?,?)",(_id(revision.assignment_id),revision.owner_subject_id,revision.governing_subject_id,revision.investigation_id,revision.target_id,revision.target_kind.value,_id(revision.revision_id),revision.lifecycle.value,_text_time(revision.created_at),_text_time(revision.effective_at),p,revision.content_hash))
                db.execute("INSERT INTO rex_assignment_revisions VALUES(?,?,?,?,?,?,?,?,?,?)",(_id(revision.revision_id),_id(revision.assignment_id),1,None,revision.lifecycle.value,p,revision.content_hash,_text_time(revision.effective_at),revision.created_by,revision.transition_reason))
                self._history(db,"ASSIGNMENT",_id(revision.assignment_id),revision.lifecycle.value,revision.created_by,revision.transition_reason,revision.effective_at,p,revision.content_hash); db.commit()
            return revision
        except sqlite3.IntegrityError as e: raise DuplicateImmutableIdentity("REX immutable identity already exists") from e
        except sqlite3.Error as e: raise RepositoryUnavailable("REX repository is unavailable") from e

    def append_assignment_revision(self, revision: FrontierAssignmentRevision):
        try:
            with closing(self._connect()) as db:
                db.execute("BEGIN IMMEDIATE"); head=db.execute("SELECT current_revision_id,lifecycle FROM rex_assignments WHERE assignment_id=?",(_id(revision.assignment_id),)).fetchone()
                if not head: raise RecordNotFound("REX assignment was not found")
                prior=db.execute("SELECT payload FROM rex_assignment_revisions WHERE revision_id=?",(head["current_revision_id"],)).fetchone(); old=_assignment(prior[0])
                if revision.parent_revision_id!=old.revision_id or revision.revision_number!=old.revision_number+1: raise RevisionConflict("Assignment revision lineage conflicts with the durable head")
                # Re-run lifecycle authority; equality proves no bypass of transition rules.
                expected=transition_assignment(old,revision_id=revision.revision_id,target=revision.lifecycle,effective_at=revision.effective_at,actor_id=revision.created_by,reason=revision.transition_reason,suspension_reason=revision.suspension_reason,
                    resumed_manifold_revision=ManifoldRevisionReference(old.investigation_id,"durable-resumption","durable-hash","durable-ontology","durable-config") if old.lifecycle in (Lifecycle.SUSPENDED,Lifecycle.BUDGET_EXHAUSTED) and revision.lifecycle is Lifecycle.SLEEPING else None,
                    entitlement_revalidated=True,authorization_revalidated=True)
                if expected != revision: raise InvalidLifecyclePersistence("Assignment revision is not an authorized lifecycle transition")
                p=canonical_bytes(revision); db.execute("INSERT INTO rex_assignment_revisions VALUES(?,?,?,?,?,?,?,?,?,?)",(_id(revision.revision_id),_id(revision.assignment_id),revision.revision_number,_id(revision.parent_revision_id),revision.lifecycle.value,p,revision.content_hash,_text_time(revision.effective_at),revision.created_by,revision.transition_reason))
                db.execute("UPDATE rex_assignments SET current_revision_id=?,lifecycle=?,updated_at=? WHERE assignment_id=?",(_id(revision.revision_id),revision.lifecycle.value,_text_time(revision.effective_at),_id(revision.assignment_id)))
                self._history(db,"ASSIGNMENT",_id(revision.assignment_id),revision.lifecycle.value,revision.created_by,revision.transition_reason,revision.effective_at,p,revision.content_hash); db.commit(); return revision
        except (RecordNotFound,RevisionConflict,InvalidLifecyclePersistence): raise
        except InvalidLifecycleTransition as e: raise InvalidLifecyclePersistence("Assignment lifecycle transition is invalid") from e
        except sqlite3.IntegrityError as e: raise RevisionConflict("Assignment revision conflicts with durable history") from e
        except sqlite3.Error as e: raise RepositoryUnavailable("REX repository is unavailable") from e

    def get_assignment(self, assignment_id):
        try:
            with closing(self._connect()) as db: row=db.execute("SELECT r.payload,r.content_hash FROM rex_assignments a JOIN rex_assignment_revisions r ON r.revision_id=a.current_revision_id WHERE a.assignment_id=?",(_id(assignment_id),)).fetchone()
            if not row: raise RecordNotFound("REX assignment was not found")
            return self._read_payload(row,"payload","content_hash",_assignment)
        except (RecordNotFound,ContentHashMismatch,InvalidStoredRecord): raise
        except sqlite3.Error as e: raise RepositoryUnavailable("REX repository is unavailable") from e

    def get_assignment_revision(self, revision_id):
        with closing(self._connect()) as db: row=db.execute("SELECT payload,content_hash FROM rex_assignment_revisions WHERE revision_id=?",(_id(revision_id),)).fetchone()
        if not row: raise RecordNotFound("REX assignment revision was not found")
        return self._read_payload(row,"payload","content_hash",_assignment)

    def list_assignment_revisions(self, assignment_id):
        with closing(self._connect()) as db: rows=db.execute("SELECT payload,content_hash FROM rex_assignment_revisions WHERE assignment_id=? ORDER BY revision_number",(_id(assignment_id),)).fetchall()
        return tuple(self._read_payload(x,"payload","content_hash",_assignment) for x in rows)

    def append_eligibility_event(self,event: EligibilityEvent):
        p=canonical_bytes(event); h=canonical_hash(event)
        try:
            with closing(self._connect()) as db:
                db.execute("INSERT INTO rex_eligibility_events VALUES(?,?,?,?,?,?,?,?,?,?,?,?)",(_id(event.event_id),_id(event.assignment_id),_id(event.assignment_revision_id),event.manifold_revision.revision_id,event.manifold_revision.revision_hash,event.trigger_kind.value,event.normalized_trigger_identity,event.coalescing_key,_text_time(event.occurred_at),None,p,h))
            return event
        except sqlite3.IntegrityError as e: raise DuplicateImmutableIdentity("Eligibility identity or pending coalescing key already exists") from e
        except sqlite3.Error as e: raise RepositoryUnavailable("REX repository is unavailable") from e

    def get_pending_eligibility(self, assignment_id=None):
        sql="SELECT payload,content_hash FROM rex_eligibility_events WHERE consumed_at IS NULL"; args=()
        if assignment_id is not None: sql+=" AND assignment_id=?"; args=(_id(assignment_id),)
        with closing(self._connect()) as db: rows=db.execute(sql+" ORDER BY created_at,event_id",args).fetchall()
        result=[]
        for r in rows:
            d=_json(r["payload"])
            if canonical_hash(d)!=r["content_hash"]: raise ContentHashMismatch("Stored REX content hash does not match")
            result.append(d)
        return tuple(result)

    def consume_eligibility(self,event_id,*,consumed_at:datetime):
        try:
            with closing(self._connect()) as db:
                db.execute("BEGIN IMMEDIATE"); changed=db.execute("UPDATE rex_eligibility_events SET consumed_at=? WHERE event_id=? AND consumed_at IS NULL",(_text_time(consumed_at),_id(event_id))).rowcount
                if changed!=1: raise EligibilityUnavailable("Eligibility is consumed or unavailable")
                db.commit()
        except EligibilityUnavailable: raise
        except sqlite3.Error as e: raise RepositoryUnavailable("REX repository is unavailable") from e

    def append_authorization_decision(self,decision: AuthorizationDecision,*,assignment_revision_id,eligibility_event_id,entitlement_snapshot_id,entitlement_snapshot_hash,manifold_revision:ManifoldRevisionReference,circuit_breakers=()):
        p=canonical_bytes(decision)
        try:
            with closing(self._connect()) as db: db.execute("INSERT INTO rex_authorization_decisions VALUES(?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)",(_id(decision.decision_id),_id(assignment_revision_id),_id(eligibility_event_id),_id(entitlement_snapshot_id),entitlement_snapshot_hash,manifold_revision.revision_id,manifold_revision.revision_hash,decision.disposition.value,decision.denial_reason.value,decision.policy_version,decision.utility_units,decision.utility_threshold_units,canonical_bytes(circuit_breakers),p,decision.content_hash,_text_time(decision.evaluated_at)))
            return decision
        except sqlite3.IntegrityError as e: raise DuplicateImmutableIdentity("Authorization decision identity already exists") from e
        except sqlite3.Error as e: raise RepositoryUnavailable("REX repository is unavailable") from e

    def reserve_authorized_execution_atomically(self, request: AuthorizedExecutionRequest):
        for x in request.reservations:
            for n in (x.limit_micros,x.consumed_micros,x.reserved_micros): _micros(n,"money")
        _micros(request.estimate.total_micros,"estimated_micros")
        context=canonical_bytes(request.execution_context); context_hash=canonical_hash(request.execution_context)
        try:
            with closing(self._connect()) as db:
                db.execute("BEGIN IMMEDIATE")
                event=db.execute("SELECT consumed_at FROM rex_eligibility_events WHERE event_id=?",(request.eligibility_event_id,)).fetchone()
                if not event or event[0] is not None: raise EligibilityUnavailable("Eligibility is consumed or unavailable")
                decision=db.execute("SELECT disposition FROM rex_authorization_decisions WHERE decision_id=? AND eligibility_event_id=?",(_id(request.authorization_decision_id),request.eligibility_event_id)).fetchone()
                if not decision or decision[0]!="ALLOW": raise AuthorizationDenied("Authorization does not permit execution")
                original=db.execute("SELECT execution_id FROM rex_search_executions WHERE semantic_duplicate_key=? AND disposition='EXECUTABLE'",(request.semantic_duplicate_key,)).fetchone()
                if original:
                    db.execute("INSERT INTO rex_search_executions VALUES(?,?,?,?,?,?,?,?,?,?,?,?)",(_id(request.execution_id),_id(request.authorization_decision_id),request.semantic_duplicate_key,"SUPPRESSED_DUPLICATE","SUPPRESSED",original[0],context,context_hash,_text_time(request.created_at),_text_time(request.created_at),None,None))
                    db.execute("UPDATE rex_eligibility_events SET consumed_at=? WHERE event_id=? AND consumed_at IS NULL",(_text_time(request.created_at),request.eligibility_event_id)); db.commit()
                    raise DuplicateSuppressed(original[0],_id(request.execution_id))
                for breaker in request.circuit_breakers:
                    if breaker.open: raise CircuitBreakerOpen("A required circuit breaker is open")
                for r in request.reservations:
                    aggregate=db.execute("SELECT COALESCE(SUM(reserved_micros),0) FROM rex_budget_reservations WHERE scope_kind=? AND scope_identity=? AND period_identity=? AND status='RESERVED'",(r.scope.kind.value,r.scope.identity,r.period_identity)).fetchone()[0]
                    if r.consumed_micros+aggregate+r.reserved_micros>r.limit_micros: raise BudgetExceeded("A required REX budget would be exceeded")
                db.execute("INSERT INTO rex_search_executions VALUES(?,?,?,?,?,?,?,?,?,?,?,?)",(_id(request.execution_id),_id(request.authorization_decision_id),request.semantic_duplicate_key,"EXECUTABLE","QUEUED",None,context,context_hash,_text_time(request.created_at),None,None,None))
                for r in request.reservations: db.execute("INSERT INTO rex_budget_reservations VALUES(?,?,?,?,?,?,?,?,?,?,?,?,?)",(r.reservation_id,_id(request.execution_id),r.scope.kind.value,r.scope.identity,r.period_identity,request.estimate.total_micros,r.reserved_micros,"RESERVED","authorization-policy",request.estimate.estimator_version,_text_time(request.created_at),None,None))
                db.execute("INSERT INTO rex_jobs VALUES(?,?,?,?,?,?,?,?,?,?,?,?)",(request.job_id,_id(request.execution_id),"QUEUED",0,_text_time(request.available_at),None,None,None,None,None,None,None))
                db.execute("UPDATE rex_eligibility_events SET consumed_at=? WHERE event_id=? AND consumed_at IS NULL",(_text_time(request.created_at),request.eligibility_event_id))
                self._append_revision_tx(db,request.executing_revision); db.commit()
            return self.get_execution(request.execution_id)
        except DuplicateSuppressed: raise
        except (EligibilityUnavailable,AuthorizationDenied,CircuitBreakerOpen,BudgetExceeded): raise
        except InvalidLifecycleTransition as e: raise InvalidLifecyclePersistence("Executing revision is invalid") from e
        except sqlite3.IntegrityError as e:
            if "semantic_duplicate_key" in str(e):
                raise RepositoryUnavailable("Concurrent REX state changed; retry with a new attempt identity") from e
            raise DuplicateImmutableIdentity("REX immutable identity already exists") from e
        except sqlite3.Error as e: raise RepositoryUnavailable("REX repository is unavailable") from e

    def _append_revision_tx(self,db,revision):
        head=db.execute("SELECT current_revision_id FROM rex_assignments WHERE assignment_id=?",(_id(revision.assignment_id),)).fetchone()
        if not head: raise InvalidLifecyclePersistence("Assignment is unavailable")
        old=_assignment(db.execute("SELECT payload FROM rex_assignment_revisions WHERE revision_id=?",(head[0],)).fetchone()[0])
        expected=transition_assignment(old,revision_id=revision.revision_id,target=revision.lifecycle,effective_at=revision.effective_at,actor_id=revision.created_by,reason=revision.transition_reason,suspension_reason=revision.suspension_reason)
        if expected!=revision or revision.lifecycle is not Lifecycle.EXECUTING: raise InvalidLifecyclePersistence("Executing revision is invalid")
        p=canonical_bytes(revision); db.execute("INSERT INTO rex_assignment_revisions VALUES(?,?,?,?,?,?,?,?,?,?)",(_id(revision.revision_id),_id(revision.assignment_id),revision.revision_number,_id(revision.parent_revision_id),revision.lifecycle.value,p,revision.content_hash,_text_time(revision.effective_at),revision.created_by,revision.transition_reason)); db.execute("UPDATE rex_assignments SET current_revision_id=?,lifecycle=?,updated_at=? WHERE assignment_id=?",(_id(revision.revision_id),revision.lifecycle.value,_text_time(revision.effective_at),_id(revision.assignment_id)))
        self._history(db,"ASSIGNMENT",_id(revision.assignment_id),revision.lifecycle.value,revision.created_by,revision.transition_reason,revision.effective_at,p,revision.content_hash)

    def get_execution(self,execution_id):
        with closing(self._connect()) as db: r=db.execute("SELECT * FROM rex_search_executions WHERE execution_id=?",(_id(execution_id),)).fetchone()
        if not r: raise RecordNotFound("REX execution was not found")
        if canonical_hash(_json(r["context_payload"]))!=r["context_hash"]: raise ContentHashMismatch("Stored REX content hash does not match")
        return SearchExecutionRecord(r["execution_id"],r["authorization_decision_id"],r["semantic_duplicate_key"],ExecutionDisposition(r["disposition"]),ExecutionStatus(r["status"]),r["original_execution_id"],bytes(r["context_payload"]),r["context_hash"],r["created_at"])

    def find_execution_by_semantic_key(self, semantic_key):
        try:
            with closing(self._connect()) as db:
                row=db.execute("SELECT execution_id FROM rex_search_executions WHERE semantic_duplicate_key=? AND disposition='EXECUTABLE'",(semantic_key,)).fetchone()
            return None if row is None else self.get_execution(row[0])
        except sqlite3.Error as e: raise RepositoryUnavailable("REX repository is unavailable") from e

    def find_execution_for_assignment_context(self, assignment_id, manifold_revision_id, manifold_revision_hash):
        try:
            with closing(self._connect()) as db:
                rows=db.execute("SELECT execution_id,context_payload FROM rex_search_executions WHERE disposition='EXECUTABLE' ORDER BY created_at").fetchall()
            for row in rows:
                context=_json(row["context_payload"])
                manifold=context.get("manifold_revision", {})
                if (context.get("assignment_id")==_id(assignment_id) and
                    manifold.get("revision_id")==manifold_revision_id and
                    manifold.get("revision_hash")==manifold_revision_hash):
                    return self.get_execution(row["execution_id"])
            return None
        except sqlite3.Error as e: raise RepositoryUnavailable("REX repository is unavailable") from e

    def get_execution_context(self, execution_id, context_type):
        try:
            with closing(self._connect()) as db:
                row=db.execute("SELECT job_id FROM rex_jobs WHERE execution_id=?",(_id(execution_id),)).fetchone()
            if not row: raise RecordNotFound("REX execution was not found")
            return self.get_job_execution_context(row[0], context_type)
        except (RecordNotFound,ContentHashMismatch,InvalidStoredRecord): raise
        except sqlite3.Error as e: raise RepositoryUnavailable("REX repository is unavailable") from e

    def job_id_for_execution(self, execution_id):
        try:
            with closing(self._connect()) as db: row=db.execute("SELECT job_id FROM rex_jobs WHERE execution_id=?",(_id(execution_id),)).fetchone()
            if not row: raise RecordNotFound("REX job was not found")
            return row[0]
        except RecordNotFound: raise
        except sqlite3.Error as e: raise RepositoryUnavailable("REX repository is unavailable") from e

    def claim_job_once(self,job_id,*,claimant_id,lease_id,claimed_at,lease_expires_at):
        try:
            with closing(self._connect()) as db:
                db.execute("BEGIN IMMEDIATE"); changed=db.execute("UPDATE rex_jobs SET status='CLAIMED',attempt_number=attempt_number+1,claimed_at=?,lease_owner=?,lease_id=?,lease_expires_at=? WHERE job_id=? AND status='QUEUED' AND available_at<=?",(_text_time(claimed_at),claimant_id,lease_id,_text_time(lease_expires_at),job_id,_text_time(claimed_at))).rowcount
                if changed!=1: raise JobUnavailable("REX job is unavailable or already claimed")
                r=db.execute("SELECT * FROM rex_jobs WHERE job_id=?",(job_id,)).fetchone()
                changed=db.execute("UPDATE rex_search_executions SET status='CLAIMED' WHERE execution_id=? AND status='QUEUED'",(r["execution_id"],)).rowcount
                if changed!=1: raise JobUnavailable("REX execution is unavailable or already claimed")
                db.commit()
            return ClaimedJob(job_id,r["execution_id"],r["attempt_number"],claimant_id,lease_id,r["lease_expires_at"])
        except JobUnavailable: raise
        except sqlite3.Error as e: raise RepositoryUnavailable("REX repository is unavailable") from e

    def get_job_execution_context(self,job_id,context_type):
        try:
            with closing(self._connect()) as db:
                row=db.execute("SELECT e.context_payload,e.context_hash,e.execution_id,d.assignment_revision_id,d.manifold_revision_id,d.manifold_revision_hash FROM rex_jobs j JOIN rex_search_executions e ON e.execution_id=j.execution_id JOIN rex_authorization_decisions d ON d.decision_id=e.authorization_decision_id WHERE j.job_id=?",(job_id,)).fetchone()
            if not row: raise JobUnavailable("REX job is unavailable")
            d=_json(row["context_payload"])
            if canonical_hash(d)!=row["context_hash"]: raise ContentHashMismatch("Stored REX content hash does not match")
            estimate=CostEstimate(**d["estimate"])
            context=context_type(SearchExecutionId(d["execution_id"]["value"]),d["job_id"],d["assignment_id"],
                FrontierAssignmentRevisionId(d["assignment_revision_id"]["value"]),_manifold(d["manifold_revision"]),
                d["source_adapter_identity"],d["source_adapter_version"],d["normalizer_identity"],d["normalizer_version"],
                CandidateKnowledgeBundleId(d["candidate_bundle_id"]["value"]),d["configuration_hash"],d["supplied_by"],
                AiAssistanceStatus(d["ai_assistance_status"]),d["provider_identity"],d["model_identity"],ModelClass(d["model_class"]),estimate)
            if (str(context.execution_id)!=row["execution_id"] or
                str(context.assignment_revision_id)!=row["assignment_revision_id"] or
                context.manifold_revision.revision_id!=row["manifold_revision_id"] or
                context.manifold_revision.revision_hash!=row["manifold_revision_hash"]):
                raise ContentHashMismatch("Stored REX execution bindings do not match")
            return context
        except (JobUnavailable,ContentHashMismatch): raise
        except Exception as e: raise InvalidStoredRecord("Stored REX execution context is invalid") from e

    def reserved_micros(self,execution_id):
        with closing(self._connect()) as db:
            row=db.execute("SELECT MAX(reserved_micros) FROM rex_budget_reservations WHERE execution_id=? AND status='RESERVED'",(_id(execution_id),)).fetchone()
        if not row or row[0] is None: raise InvalidStoredRecord("REX reservation is unavailable")
        return row[0]

    def finalize_execution_success(self,*,bundle,usage,ledger_id,receipt,completed_at):
        """Atomically store candidate, lineage, reconciliation, receipt, and terminal state."""
        p=canonical_bytes(bundle); src=canonical_bytes(bundle.source_document)
        up=canonical_bytes(usage); uh=canonical_hash(usage); rp=canonical_bytes(receipt)
        r=usage.reconciliation
        try:
            with closing(self._connect()) as db:
                db.execute("BEGIN IMMEDIATE")
                state=db.execute("SELECT e.status,j.status FROM rex_search_executions e JOIN rex_jobs j ON j.execution_id=e.execution_id WHERE e.execution_id=?",(_id(bundle.execution_id),)).fetchone()
                if not state or tuple(state)!=("CLAIMED","CLAIMED"): raise JobUnavailable("REX execution is unavailable or terminal")
                db.execute("INSERT INTO rex_candidate_bundles VALUES(?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)",(_id(bundle.bundle_id),_id(bundle.execution_id),_id(bundle.assignment_revision_id),bundle.manifold_revision.revision_id,bundle.manifold_revision.revision_hash,src,bundle.source_content_hash,p,bundle.content_hash,"CANDIDATE_KNOWLEDGE","RESEARCHER_REVIEW_REQUIRED","NONE",bundle.ai_assistance_status.value,bundle.provider_identity,bundle.model_identity,_text_time(completed_at)))
                for lineage in bundle.lineage:
                    for order,f in enumerate(lineage.fields):
                        lp=canonical_bytes(f); db.execute("INSERT INTO rex_candidate_lineage VALUES(?,?,?,?,?,?,?,?,?,?,?,?,?)",(_id(bundle.bundle_id),lineage.candidate_id,order,f.candidate_field,lineage.source_locator,lineage.source_version,f.source_field,f.exact_value,f.normalization_rule,bundle.adapter_version,bundle.normalizer_version,lp,canonical_hash(f)))
                db.execute("INSERT INTO rex_usage_ledger VALUES(?,?,?,?,?,?,?,?,?,?,?,?)",(ledger_id,_id(usage.execution_id),r.estimated_micros,r.reserved_micros,r.actual_micros,r.charged_micros,r.released_micros,r.status.value,usage.estimate.estimator_version,_text_time(completed_at),up,uh))
                changed=db.execute("UPDATE rex_budget_reservations SET status='RECONCILED',released_at=?,reconciled_at=? WHERE execution_id=? AND status='RESERVED'",(_text_time(completed_at),_text_time(completed_at),_id(bundle.execution_id))).rowcount
                if changed==0: raise InvalidStoredRecord("REX reservation is unavailable")
                db.execute("INSERT INTO rex_execution_receipts VALUES(?,?,?,?,?)",(_id(bundle.execution_id),rp,receipt.content_hash,_text_time(completed_at),_id(bundle.bundle_id)))
                if db.execute("UPDATE rex_search_executions SET status='COMPLETED',completed_at=? WHERE execution_id=? AND status='CLAIMED'",(_text_time(completed_at),_id(bundle.execution_id))).rowcount!=1: raise JobUnavailable("REX execution is unavailable or terminal")
                if db.execute("UPDATE rex_jobs SET status='COMPLETED',completed_at=? WHERE execution_id=? AND status='CLAIMED'",(_text_time(completed_at),_id(bundle.execution_id))).rowcount!=1: raise JobUnavailable("REX job is unavailable or terminal")
                db.commit()
            return receipt
        except (JobUnavailable,InvalidStoredRecord): raise
        except sqlite3.IntegrityError as e: raise DuplicateImmutableIdentity("Candidate bundle or receipt identity already exists") from e
        except sqlite3.Error as e: raise RepositoryUnavailable("REX repository is unavailable") from e

    def finalize_execution_failure(self,execution_id,*,ledger_id,estimate,occurred_at,failure_category):
        measurement=UsageMeasurement(0,0,0,0,0,0,0,0)
        reserved=self.reserved_micros(execution_id)
        reconciliation=CostReconciliation(SearchExecutionId(_id(execution_id)),estimate.total_micros,reserved,0,0,reserved,CostReconciliationStatus.RECONCILED,occurred_at)
        usage=RexUsageRecord(SearchExecutionId(_id(execution_id)),estimate,measurement,reconciliation)
        p=canonical_bytes(usage); h=canonical_hash(usage)
        try:
            with closing(self._connect()) as db:
                db.execute("BEGIN IMMEDIATE")
                if db.execute("SELECT count(*) FROM rex_candidate_bundles WHERE execution_id=?",(_id(execution_id),)).fetchone()[0]: raise InvalidStoredRecord("A failed execution cannot retain a candidate bundle")
                db.execute("INSERT INTO rex_usage_ledger VALUES(?,?,?,?,?,?,?,?,?,?,?,?)",(ledger_id,_id(execution_id),estimate.total_micros,reserved,0,0,reserved,"RECONCILED",estimate.estimator_version,_text_time(occurred_at),p,h))
                db.execute("UPDATE rex_budget_reservations SET status='RECONCILED',released_at=?,reconciled_at=? WHERE execution_id=? AND status='RESERVED'",(_text_time(occurred_at),_text_time(occurred_at),_id(execution_id)))
                if db.execute("UPDATE rex_search_executions SET status='FAILED',failed_at=?,failure_category=? WHERE execution_id=? AND status='CLAIMED'",(_text_time(occurred_at),failure_category,_id(execution_id))).rowcount!=1: raise JobUnavailable("REX execution is unavailable or terminal")
                if db.execute("UPDATE rex_jobs SET status='FAILED',failed_at=?,failure_category=? WHERE execution_id=? AND status='CLAIMED'",(_text_time(occurred_at),failure_category,_id(execution_id))).rowcount!=1: raise JobUnavailable("REX job is unavailable or terminal")
                db.commit()
        except (InvalidStoredRecord,JobUnavailable): raise
        except sqlite3.Error as e: raise RepositoryUnavailable("REX repository is unavailable") from e

    def fail_claimed_job(self,job_id,*,ledger_id,occurred_at,failure_category):
        """Fail a claimed job whose immutable context cannot safely be decoded."""
        try:
            with closing(self._connect()) as db:
                db.execute("BEGIN IMMEDIATE")
                row=db.execute("SELECT execution_id FROM rex_jobs WHERE job_id=? AND status='CLAIMED'",(job_id,)).fetchone()
                if not row: raise JobUnavailable("REX job is unavailable or terminal")
                execution_id=row[0]
                reserved=db.execute("SELECT COALESCE(MAX(reserved_micros),0),COALESCE(MAX(estimated_micros),0),COALESCE(MAX(estimator_version),'unknown') FROM rex_budget_reservations WHERE execution_id=? AND status='RESERVED'",(execution_id,)).fetchone()
                payload={"executionId":execution_id,"estimatedMicros":reserved[1],"reservedMicros":reserved[0],"actualMicros":0,"chargedMicros":0,"releasedMicros":reserved[0],"status":"RECONCILED"}
                db.execute("INSERT INTO rex_usage_ledger VALUES(?,?,?,?,?,?,?,?,?,?,?,?)",(ledger_id,execution_id,reserved[1],reserved[0],0,0,reserved[0],"RECONCILED",reserved[2],_text_time(occurred_at),canonical_bytes(payload),canonical_hash(payload)))
                db.execute("UPDATE rex_budget_reservations SET status='RECONCILED',released_at=?,reconciled_at=? WHERE execution_id=? AND status='RESERVED'",(_text_time(occurred_at),_text_time(occurred_at),execution_id))
                db.execute("UPDATE rex_search_executions SET status='FAILED',failed_at=?,failure_category=? WHERE execution_id=? AND status='CLAIMED'",(_text_time(occurred_at),failure_category,execution_id))
                db.execute("UPDATE rex_jobs SET status='FAILED',failed_at=?,failure_category=? WHERE job_id=? AND status='CLAIMED'",(_text_time(occurred_at),failure_category,job_id)); db.commit()
        except JobUnavailable: raise
        except sqlite3.Error as e: raise RepositoryUnavailable("REX repository is unavailable") from e

    def reconstruct_execution_receipt(self,execution_id):
        from .service import ExecutionReceipt
        try:
            with closing(self._connect()) as db: row=db.execute("SELECT payload,content_hash FROM rex_execution_receipts WHERE execution_id=?",(_id(execution_id),)).fetchone()
            if not row: raise RecordNotFound("REX execution receipt was not found")
            d=_json(row["payload"])
            if canonical_hash({k:v for k,v in d.items() if k!="content_hash"})!=row["content_hash"] or d["content_hash"]!=row["content_hash"]: raise ContentHashMismatch("Stored REX receipt hash does not match")
            d["completed_at"]=_parse_time(d["completed_at"])
            return ExecutionReceipt(**d)
        except (RecordNotFound,ContentHashMismatch): raise
        except Exception as e: raise InvalidStoredRecord("Stored REX receipt is invalid") from e

    def append_execution_outcome(self,execution_id,*,status,occurred_at,failure_category=None):
        if status not in ("COMPLETED","FAILED"): raise ValueError("invalid execution outcome")
        with closing(self._connect()) as db:
            db.execute("BEGIN IMMEDIATE"); col="completed_at" if status=="COMPLETED" else "failed_at"; changed=db.execute(f"UPDATE rex_search_executions SET status=?,{col}=?,failure_category=? WHERE execution_id=? AND status='CLAIMED'",(status,_text_time(occurred_at),failure_category,_id(execution_id))).rowcount
            if changed!=1: raise JobUnavailable("REX execution is unclaimed or already has an outcome")
            db.execute(f"UPDATE rex_jobs SET status=?,{col}=?,failure_category=? WHERE execution_id=?",(status,_text_time(occurred_at),failure_category,_id(execution_id))); db.commit()

    def append_cost_reconciliation(self,ledger_id,usage:RexUsageRecord,*,measured_at=None):
        at=measured_at or usage.reconciliation.reconciled_at; p=canonical_bytes(usage); h=canonical_hash(usage)
        r=usage.reconciliation
        try:
            with closing(self._connect()) as db:
                db.execute("BEGIN IMMEDIATE"); db.execute("INSERT INTO rex_usage_ledger VALUES(?,?,?,?,?,?,?,?,?,?,?,?)",(ledger_id,_id(usage.execution_id),r.estimated_micros,r.reserved_micros,r.actual_micros,r.charged_micros,r.released_micros,r.status.value,usage.estimate.estimator_version,_text_time(at),p,h)); db.execute("UPDATE rex_budget_reservations SET status=?,released_at=?,reconciled_at=? WHERE execution_id=?",("PENDING" if r.status is CostReconciliationStatus.PENDING else "RECONCILED",_text_time(at) if r.released_micros else None,_text_time(at) if r.status is CostReconciliationStatus.RECONCILED else None,_id(usage.execution_id))); db.commit()
            return usage
        except sqlite3.IntegrityError as e: raise DuplicateImmutableIdentity("Usage ledger identity already exists") from e

    def store_candidate_bundle(self,bundle:CandidateKnowledgeBundle,*,created_at:datetime):
        p=canonical_bytes(bundle); src=canonical_bytes(bundle.source_document)
        try:
            with closing(self._connect()) as db:
                db.execute("BEGIN IMMEDIATE"); db.execute("INSERT INTO rex_candidate_bundles VALUES(?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)",(_id(bundle.bundle_id),_id(bundle.execution_id),_id(bundle.assignment_revision_id),bundle.manifold_revision.revision_id,bundle.manifold_revision.revision_hash,src,bundle.source_content_hash,p,bundle.content_hash,"CANDIDATE_KNOWLEDGE","RESEARCHER_REVIEW_REQUIRED","NONE",bundle.ai_assistance_status.value,bundle.provider_identity,bundle.model_identity,_text_time(created_at)))
                for lineage in bundle.lineage:
                    for order,f in enumerate(lineage.fields):
                        lp=canonical_bytes(f); db.execute("INSERT INTO rex_candidate_lineage VALUES(?,?,?,?,?,?,?,?,?,?,?,?,?)",(_id(bundle.bundle_id),lineage.candidate_id,order,f.candidate_field,lineage.source_locator,lineage.source_version,f.source_field,f.exact_value,f.normalization_rule,bundle.adapter_version,bundle.normalizer_version,lp,canonical_hash(f)))
                db.commit(); return bundle
        except sqlite3.IntegrityError as e: raise DuplicateImmutableIdentity("Candidate bundle identity already exists") from e

    def get_candidate_bundle(self,bundle_id):
        with closing(self._connect()) as db: row=db.execute("SELECT bundle_payload,bundle_hash,source_hash FROM rex_candidate_bundles WHERE bundle_id=?",(_id(bundle_id),)).fetchone()
        if not row: raise RecordNotFound("REX candidate bundle was not found")
        bundle=self._read_payload(row,"bundle_payload","bundle_hash",_bundle)
        if row["source_hash"] != bundle.source_document.content_hash: raise ContentHashMismatch("Stored REX source content hash does not match")
        return bundle

    def create_research_publication(self,publication:ResearchPublication):
        p=canonical_bytes(publication.payload)
        if publication.review_status!="RESEARCHER_REVIEW_REQUIRED" or publication.canon_effect!="NONE": raise InvalidStoredRecord("REX publication must remain quarantined")
        if canonical_hash(publication.payload)!=publication.content_hash: raise ContentHashMismatch("REX publication content hash does not match")
        try:
            with closing(self._connect()) as db: db.execute("INSERT INTO rex_research_publications VALUES(?,?,?,?,?,?,?,?,?,?)",(publication.publication_id,publication.investigation_id,_id(publication.candidate_bundle_id),publication.research_anchor_id,publication.publication_classification,publication.review_status,publication.canon_effect,_text_time(publication.created_at),p,publication.content_hash))
            return publication
        except sqlite3.IntegrityError as e: raise DuplicateImmutableIdentity("Research publication identity already exists") from e

    def get_research_publication(self,publication_id):
        with closing(self._connect()) as db: r=db.execute("SELECT * FROM rex_research_publications WHERE publication_id=?",(publication_id,)).fetchone()
        if not r: raise RecordNotFound("REX research publication was not found")
        if canonical_hash(_json(r["payload"]))!=r["content_hash"]: raise ContentHashMismatch("Stored REX content hash does not match")
        return dict(r)
    def list_investigation_publications(self,investigation_id):
        with closing(self._connect()) as db: rows=db.execute("SELECT publication_id FROM rex_research_publications WHERE investigation_id=? ORDER BY created_at,publication_id",(investigation_id,)).fetchall()
        return tuple(self.get_research_publication(r[0]) for r in rows)

    def _history(self,db,kind,identity,state,actor,reason,at,payload,h): db.execute("INSERT INTO rex_state_history(entity_kind,entity_id,state,actor_id,reason,occurred_at,payload,content_hash) VALUES(?,?,?,?,?,?,?,?)",(kind,identity,state,actor,reason,_text_time(at),payload,h))

SQLiteREXRepository = SQLiteRexRepository
