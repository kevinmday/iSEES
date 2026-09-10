from __future__ import annotations

import json
import sqlite3
from concurrent.futures import ThreadPoolExecutor
from copy import deepcopy
from dataclasses import replace
from datetime import datetime, timezone
from pathlib import Path

import pytest
from pydantic import ValidationError

from isees_uap.studio.models import StudioArtifactVersion
from isees_uap.studio.v1.hashing import canonical_sha256
from isees_uap.studio.v1.legacy_adapter import legacy_version_to_author_revision
from isees_uap.studio.v1.persistence import (FailureCode, ProjectionSpecification, SaveCommand,
                                             StudioV1Failure)
from isees_uap.studio.v1.save_service import StudioV1SaveService, request_fingerprint
from isees_uap.studio.v1.schemas import ArtifactIdentity, AuthorRevision, FrozenResearchSourceSnapshot
from isees_uap.studio.v1.sqlite_store import SQLiteStudioV1Store

FIXTURE = Path(__file__).parents[3] / "contracts/studio-v1/fixtures/studio-v1-contract-fixtures.json"
NOW = "2026-09-10T18:00:00.000Z"
LATER = "2026-09-10T18:05:00.000Z"
HASH = "sha256:" + "a" * 64


def fixture_data(): return json.loads(FIXTURE.read_text(encoding="utf-8"))


def make_store(tmp_path, **kwargs):
    tmp_path.mkdir(parents=True,exist_ok=True)
    store=SQLiteStudioV1Store(tmp_path / "studio-v1.sqlite3", **kwargs); store.initialize_schema(); return store


def make_command(*, key="key-1", projections=2, artifact_id="artifact-paper-1", owner="principal-1",
                 investigation="investigation-1", revision=None, snapshot=None, expected=None):
    data=fixture_data(); raw=deepcopy(revision or data["scientificRevision"]); raw["artifactId"]=artifact_id; raw["authorPrincipalId"]=owner
    snap=FrozenResearchSourceSnapshot.model_validate(snapshot or data["entireInboxSnapshot"])
    artifact=ArtifactIdentity.model_validate({"artifactId":artifact_id,"investigationId":investigation,"authorPrincipalId":owner,
        "profile":raw["profile"],"profileCapability":"ADMITTED_UNVERIFIED","lifecycleClassification":"CANDIDATE_KNOWLEDGE",
        "createdAt":NOW,"currentSavedRevisionId":expected,"workingDraft":{"state":"UNSAVED","basedOnRevisionId":expected}})
    specs=(ProjectionSpecification("PDF","paper/1","pdf/1",HASH), ProjectionSpecification("DOCX","paper/1","docx/1",HASH))[:projections]
    c=SaveCommand(artifact,AuthorRevision.model_validate(raw),(snap,),specs,expected,key,"pending",NOW)
    return replace(c,request_fingerprint=request_fingerprint(c))


def second(first):
    raw=first.revision.model_dump(exclude_none=True); raw.update(revisionId="artifact-paper-1.r2",revisionNumber=2,parentRevisionId=first.revision.revisionId,createdAt=LATER)
    raw["semanticContent"]["title"]="Second immutable revision"; raw["contentHash"]=canonical_sha256(raw["semanticContent"])
    return make_command(key="key-2",revision=raw,expected=first.revision.revisionId)


def assert_code(code, fn):
    with pytest.raises(StudioV1Failure) as caught: fn()
    assert caught.value.code == code
    assert "sqlite" not in caught.value.safe_message.lower()


def test_first_revision_and_jobs_are_atomic(tmp_path):
    store=make_store(tmp_path); command=make_command(); result=StudioV1SaveService(store).save(command)
    assert result.revision_number == 1 and len(result.job_ids)==2
    assert store.get_artifact_head("principal-1","investigation-1","artifact-paper-1").revisionId == command.revision.revisionId
    assert sorted(x.format for x in store.list_projection_jobs("principal-1","investigation-1")) == ["DOCX","PDF"]


@pytest.mark.parametrize("stage",["artifact","snapshots","revision","head","jobs","idempotency"])
def test_failure_at_each_transaction_stage_leaves_nothing(tmp_path,stage):
    store=make_store(tmp_path,failure_injector=lambda value: (_ for _ in ()).throw(RuntimeError("injected")) if value==stage else None)
    with pytest.raises(RuntimeError): StudioV1SaveService(store).save(make_command())
    with sqlite3.connect(store.path) as db:
        for table in ("artifacts","revisions","source_snapshots","projection_jobs","idempotency_commands"):
            assert db.execute(f"SELECT count(*) FROM studio_v1_{table}").fetchone()[0] == 0


def test_append_preserves_history_and_advances_head(tmp_path):
    store=make_store(tmp_path); one=make_command(); service=StudioV1SaveService(store); service.save(one); two=second(one); service.save(two)
    revisions=store.list_revisions("principal-1","investigation-1","artifact-paper-1")
    assert [x.revisionNumber for x in revisions]==[1,2] and revisions[0].semanticContent.title != revisions[1].semanticContent.title
    assert store.get_artifact_head("principal-1","investigation-1","artifact-paper-1").revisionId.endswith("r2")


def test_snapshot_and_revision_database_rows_are_immutable(tmp_path):
    store=make_store(tmp_path); command=make_command(); StudioV1SaveService(store).save(command)
    with sqlite3.connect(store.path) as db:
        with pytest.raises(sqlite3.IntegrityError): db.execute("UPDATE studio_v1_revisions SET content_hash=?",(HASH,))
        with pytest.raises(sqlite3.IntegrityError): db.execute("UPDATE studio_v1_source_snapshots SET snapshot_hash=?",(HASH,))
    assert not hasattr(store,"update_revision") and not hasattr(store,"update_snapshot")


def test_idempotency_replay_conflict_and_restart(tmp_path):
    store=make_store(tmp_path); command=make_command(); first=StudioV1SaveService(store).save(command)
    reopened=SQLiteStudioV1Store(store.path); reopened.initialize_schema(); replay=StudioV1SaveService(reopened).save(command)
    assert replay.replayed and replay.revision_id==first.revision_id and replay.job_ids==first.job_ids
    assert_code(FailureCode.IDEMPOTENCY_KEY_REUSE,lambda: StudioV1SaveService(reopened).save(replace(second(command),idempotency_key=command.idempotency_key)))


def test_same_expected_head_has_exactly_one_winner(tmp_path):
    store=make_store(tmp_path); initial=make_command(); StudioV1SaveService(store).save(initial)
    a=second(initial); raw=a.revision.model_dump(exclude_none=True); raw["revisionId"]="artifact-paper-1.r2-other"; raw["semanticContent"]["title"]="Concurrent other"; raw["contentHash"]=canonical_sha256(raw["semanticContent"])
    b=make_command(key="other",revision=raw,expected=initial.revision.revisionId)
    def save(c):
        try: return StudioV1SaveService(SQLiteStudioV1Store(store.path)).save(c)
        except StudioV1Failure as e: return e.code
    with ThreadPoolExecutor(max_workers=2) as pool: outcomes=list(pool.map(save,(a,b)))
    assert sum(not isinstance(x,FailureCode) for x in outcomes)==1 and FailureCode.REVISION_CONFLICT in outcomes


def test_projection_uniqueness_and_deterministic_identity(tmp_path):
    command=make_command(); duplicate=replace(command,projections=(command.projections[0],command.projections[0])); duplicate=replace(duplicate,request_fingerprint=request_fingerprint(duplicate))
    assert_code(FailureCode.DUPLICATE_PROJECTION_SPECIFICATION,lambda: StudioV1SaveService(make_store(tmp_path)).save(duplicate))
    store=make_store(tmp_path/"other"); first=StudioV1SaveService(store).save(command)
    reopened=SQLiteStudioV1Store(store.path); replay=StudioV1SaveService(reopened).save(command)
    assert first.job_ids==replay.job_ids and len(set(first.job_ids))==len(command.projections)


def test_transactional_claim_wrong_worker_completion_and_attempt_audit(tmp_path):
    store=make_store(tmp_path); job=StudioV1SaveService(store).save(make_command(projections=1)).job_ids[0]
    claimed=store.claim_projection_job(job,"worker-a","lease-a",NOW,LATER); assert claimed.attempt_count==1
    assert_code(FailureCode.LEASE_CONFLICT,lambda: store.claim_projection_job(job,"worker-b","lease-b",NOW,LATER))
    assert_code(FailureCode.LEASE_CONFLICT,lambda: store.complete_projection_job(job,"lease-b",NOW,HASH))
    done=store.complete_projection_job(job,"lease-a",NOW,HASH); assert done.state=="CURRENT"
    with sqlite3.connect(store.path) as db: assert db.execute("SELECT outcome FROM studio_v1_projection_attempts").fetchone()[0]=="CURRENT"


def test_expired_claim_recovery_survives_restart_and_attempt_limit(tmp_path):
    store=make_store(tmp_path,max_attempts=2); job=StudioV1SaveService(store).save(make_command(projections=1)).job_ids[0]
    store.claim_projection_job(job,"w1","l1",NOW,NOW)
    reopened=SQLiteStudioV1Store(store.path,max_attempts=2); assert reopened.recover_expired_jobs(LATER)==1
    assert reopened.list_projection_jobs("principal-1","investigation-1")[0].attempt_count==1
    reopened.retry_projection_job(job,LATER); reopened.claim_projection_job(job,"w2","l2",LATER,"2026-09-10T18:10:00.000Z")
    reopened.fail_projection_job(job,"l2",LATER,"RENDER_FAILED","Projection generation failed.")
    assert_code(FailureCode.ATTEMPT_LIMIT_REACHED,lambda: reopened.retry_projection_job(job,LATER))


def test_illegal_transition_and_expired_lease_fail_closed(tmp_path):
    store=make_store(tmp_path); job=StudioV1SaveService(store).save(make_command(projections=1)).job_ids[0]
    assert_code(FailureCode.ILLEGAL_PROJECTION_TRANSITION,lambda: store.retry_projection_job(job,NOW))
    store.claim_projection_job(job,"w","l",NOW,NOW)
    assert_code(FailureCode.LEASE_EXPIRED,lambda: store.complete_projection_job(job,"l",LATER,HASH))


def test_projection_failure_is_per_job_and_preserves_parent_and_prior_success(tmp_path):
    command=make_command(); spec=replace(command.projections[0],prior_successful_projection_id="pdf-prior")
    command=replace(command,projections=(spec,command.projections[1])); command=replace(command,request_fingerprint=request_fingerprint(command))
    store=make_store(tmp_path); jobs=StudioV1SaveService(store).save(command).job_ids
    store.claim_projection_job(jobs[0],"w","l",NOW,LATER); failed=store.fail_projection_job(jobs[0],"l",NOW,"RENDER_FAILED","Projection generation failed.")
    all_jobs=store.list_projection_jobs("principal-1","investigation-1")
    assert failed.prior_successful_projection_id=="pdf-prior" and next(x for x in all_jobs if x.job_id==jobs[1]).state=="QUEUED"
    assert store.get_artifact_head("principal-1","investigation-1","artifact-paper-1").revisionId==command.revision.revisionId


def test_owner_investigation_isolation_and_profile_capability(tmp_path):
    store=make_store(tmp_path); command=make_command(); StudioV1SaveService(store).save(command)
    assert_code(FailureCode.AUTHORITY_MISMATCH,lambda: store.get_artifact_head("other","investigation-1","artifact-paper-1"))
    assert_code(FailureCode.INVESTIGATION_MISMATCH,lambda: store.get_artifact_head("principal-1","other","artifact-paper-1"))
    with sqlite3.connect(store.path) as db: assert db.execute("SELECT profile_capability FROM studio_v1_artifacts").fetchone()[0]=="ADMITTED_UNVERIFIED"


def test_strict_unknown_and_blank_inputs_fail_closed(tmp_path):
    raw=fixture_data()["scientificRevision"]; raw["unknownField"]=True
    with pytest.raises(ValidationError): AuthorRevision.model_validate(raw)
    command=make_command(); assert_code(FailureCode.REVISION_IDENTITY_CONFLICT,lambda: StudioV1SaveService(make_store(tmp_path)).save(replace(command,idempotency_key=" ")))


def test_legacy_adapter_rejects_missing_scholarly_data_without_mutation():
    command=make_command(); original={"schemaVersion":"legacy/v1","title":"Legacy"}; before=deepcopy(original)
    version=StudioArtifactVersion("v1","a1",1,None,"legacy/v1",original,(),(),(),(),None,"legacy-hash","principal-1",datetime.now(timezone.utc))
    assert_code(FailureCode.LEGACY_ADAPTER_INCOMPATIBLE,lambda: legacy_version_to_author_revision(version,profile="SCIENTIFIC_PAPER",profile_version="1",snapshot_references=()))
    assert original==before


def test_no_default_database_path_and_foreign_keys(tmp_path):
    with pytest.raises(ValueError): SQLiteStudioV1Store()
    store=make_store(tmp_path)
    with store._connect() as db: assert db.execute("PRAGMA foreign_keys").fetchone()[0]==1
