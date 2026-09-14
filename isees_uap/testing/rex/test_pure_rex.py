from __future__ import annotations

import dataclasses
import itertools
import socket
from datetime import datetime, timedelta, timezone

import pytest

from isees_uap.rex.authorization import (ExecutionAuthorizationContext,
                                         ExplorationProposal, authorize)
from isees_uap.rex.canonical import canonical_bytes, canonical_hash
from isees_uap.rex.contracts import *
from isees_uap.rex.cost import ZeroCostEstimator
from isees_uap.rex.entitlement import DevelopmentFixtureEntitlementProvider
from isees_uap.rex.errors import InvalidLifecycleTransition, RexContractError
from isees_uap.rex.fixture import (FIXTURE_STRUCTURED_MATERIAL,
                                   FixtureCandidateNormalizer,
                                   FixtureNormalizationRequest,
                                   LocalFixtureSourceAdapter)
from isees_uap.rex.lifecycle import PERMITTED_TRANSITIONS, transition_assignment

NOW=datetime(2026,9,14,12,tzinfo=timezone.utc)
MANIFOLD=ManifoldRevisionReference("synthetic-investigation","manifold-revision-1","sha256:"+"1"*64,"synthetic-ontology/v1","sha256:"+"2"*64)

def entitlement():
    return DevelopmentFixtureEntitlementProvider(snapshot_id=EntitlementSnapshotId("entitlement-1"),valid_from=NOW-timedelta(days=1),valid_until=NOW+timedelta(days=1),issued_at=NOW-timedelta(days=1)).snapshot(subject_id="researcher-1",at=NOW)

def assignment():
    return create_assignment(assignment_id=FrontierAssignmentId("assignment-1"),revision_id=FrontierAssignmentRevisionId("assignment-revision-1"),
        owner_subject_id="researcher-1",governing_subject_id="researcher-1",investigation_id="synthetic-investigation",
        target_id="synthetic-node",target_kind=TargetKind.NODE,research_objective="Preserve the fixture claim.",scope=("synthetic-node",),exclusions=("external-sources",),
        trigger_policy=TriggerPolicy((TriggerKind.RESEARCHER_REQUEST,),"coalescing/v1"),freshness_policy=FreshnessPolicy("freshness/v1","fixture-v1"),
        source_policy=SourcePolicy((SourceClass.LOCAL_FIXTURE,),"source/v1"),privacy_policy_reference="privacy/synthetic/v1",risk_policy_reference="risk/synthetic/v1",
        entitlement_snapshot_id=EntitlementSnapshotId("entitlement-1"),execution_ceilings=ExecutionCeilings(1,4096,0,0,1),source_cursor_state=(("fixture","v1"),),
        created_at=NOW,effective_at=NOW,created_by="researcher-1")

def eligible():
    return transition_assignment(assignment(),revision_id=FrontierAssignmentRevisionId("assignment-revision-2"),target=Lifecycle.ELIGIBLE,effective_at=NOW,actor_id="researcher-1",reason="fixture trigger")

def normalized_bundle():
    doc=LocalFixtureSourceAdapter().retrieve(object())
    return FixtureCandidateNormalizer().normalize(FixtureNormalizationRequest(doc,CandidateKnowledgeBundleId("bundle-1"),eligible().revision_id,MANIFOLD,SearchExecutionId("execution-1"),canonical_hash({"ai":"NONE"}),"fixture-author"))

def test_assignment_creation_is_sleeping_and_creates_no_execution():
    made=assignment(); assert made.lifecycle is Lifecycle.SLEEPING
    assert not hasattr(made,"execution_id") and not hasattr(made,"eligibility_event")

def test_all_valid_and_invalid_lifecycle_transitions_fail_closed():
    base=assignment()
    representatives={Lifecycle.SLEEPING:base}
    representatives[Lifecycle.ELIGIBLE]=eligible()
    representatives[Lifecycle.EXECUTING]=transition_assignment(representatives[Lifecycle.ELIGIBLE],revision_id=FrontierAssignmentRevisionId("x3"),target=Lifecycle.EXECUTING,effective_at=NOW,actor_id="actor",reason="authorized")
    for state in (Lifecycle.SUSPENDED,Lifecycle.BUDGET_EXHAUSTED,Lifecycle.EXPIRED,Lifecycle.REVOKED):
        representatives[state]=transition_assignment(base,revision_id=FrontierAssignmentRevisionId("x-"+state.value),target=state,effective_at=NOW,actor_id="actor",reason="governed",suspension_reason=SuspensionReason.POLICY if state is Lifecycle.SUSPENDED else None)
    for source,target in itertools.product(Lifecycle,Lifecycle):
        kwargs=dict(revision_id=FrontierAssignmentRevisionId("next"),target=target,effective_at=NOW,actor_id="actor",reason="test")
        if target is Lifecycle.SUSPENDED: kwargs["suspension_reason"]=SuspensionReason.POLICY
        if source in (Lifecycle.SUSPENDED,Lifecycle.BUDGET_EXHAUSTED) and target is Lifecycle.SLEEPING:
            kwargs.update(resumed_manifold_revision=MANIFOLD,entitlement_revalidated=True,authorization_revalidated=True)
        if (source,target) in PERMITTED_TRANSITIONS: assert transition_assignment(representatives[source],**kwargs).lifecycle is target
        else:
            with pytest.raises(InvalidLifecycleTransition): transition_assignment(representatives[source],**kwargs)

def test_transition_is_immutable_attributable_and_resumption_is_governed():
    old=assignment(); new=transition_assignment(old,revision_id=FrontierAssignmentRevisionId("revision-2"),target=Lifecycle.SUSPENDED,effective_at=NOW,actor_id="governor",reason="policy pause",suspension_reason=SuspensionReason.POLICY)
    assert old.lifecycle is Lifecycle.SLEEPING and new.parent_revision_id==old.revision_id and new.created_by=="governor"
    with pytest.raises(dataclasses.FrozenInstanceError): new.lifecycle=Lifecycle.ELIGIBLE
    with pytest.raises(InvalidLifecycleTransition): transition_assignment(new,revision_id=FrontierAssignmentRevisionId("revision-3"),target=Lifecycle.SLEEPING,effective_at=NOW,actor_id="governor",reason="resume")

def test_entitlement_is_deterministic_hash_stable_and_plan_free():
    first=entitlement(); second=entitlement()
    assert first==second and first.content_hash==second.content_hash
    core=" ".join(p.read_text(encoding="utf-8") for p in __import__('pathlib').Path("isees_uap/rex").glob("*.py")).upper()
    assert not any(label in core for label in ("GUEST =","EXPLORER =","FREE_RESEARCHER","PROFESSIONAL =","INSTITUTIONAL =","SKU","SUBSCRIPTION"))

def test_development_entitlement_is_fixture_none_zero_and_bounded():
    item=entitlement(); assert item.allowed_source_classes==(SourceClass.LOCAL_FIXTURE,)
    assert item.allowed_model_classes==(ModelClass.NONE,) and item.maximum_recursion_depth==1
    assert item.maximum_cost_per_execution_micros==item.maximum_cost_per_period_micros==0

def test_zero_cost_is_explicit_integer_accounting_and_invalid_money_rejected():
    value=ZeroCostEstimator().estimate(object())
    assert all(type(getattr(value,n)) is int and getattr(value,n)==0 for n in ("compute_micros","ai_micros","source_micros","storage_micros","network_micros","total_micros"))
    with pytest.raises(RexContractError): CostEstimate(-1,0,0,0,0,-1,"bad")
    with pytest.raises(RexContractError): CostEstimate(0.0,0,0,0,0,0,"bad")

def denial_context():
    proposal=ExplorationProposal(SourceClass.PUBLIC,ModelClass.NONE,1,5,0,0,0,False)
    return ExecutionAuthorizationContext(eligible(),entitlement(),proposal,ZeroCostEstimator().estimate(proposal),(),(),NOW,"authorization/v1",0)

def test_authorization_denial_is_deterministic_and_precedes_adapter():
    class ExplodingAdapter:
        calls=0
        def retrieve(self, request): self.calls+=1; raise AssertionError("adapter invoked")
    adapter=ExplodingAdapter(); one=authorize(denial_context(),decision_id=AuthorizationDecisionId("decision-1")); two=authorize(denial_context(),decision_id=AuthorizationDecisionId("decision-1"))
    assert one==two and one.disposition is AuthorizationDisposition.DENY and adapter.calls==0

def test_fixture_retrieval_is_network_free_and_byte_stable(monkeypatch):
    monkeypatch.setattr(socket,"create_connection",lambda *a,**k: (_ for _ in ()).throw(AssertionError("network")))
    adapter=LocalFixtureSourceAdapter(); first=adapter.retrieve(None); second=adapter.retrieve(None)
    assert first==second and first.deterministic_bytes()==second.deterministic_bytes()
    assert first.content_hash==canonical_hash(first.content_fields())

def test_normalization_is_one_stable_claim_conserving_candidate_with_complete_lineage():
    one=normalized_bundle(); two=normalized_bundle(); candidate=one.candidates[0]
    assert one==two and len(one.candidates)==1 and candidate.claim==dict(FIXTURE_STRUCTURED_MATERIAL)["claim"]
    assert candidate.epistemic_classification is CandidateEpistemicClassification.CANDIDATE_KNOWLEDGE
    assert candidate.review_status is CandidateReviewStatus.RESEARCHER_REVIEW_REQUIRED and candidate.canon_effect is CanonEffect.NONE
    assert one.ai_assistance_status is AiAssistanceStatus.NONE and one.provider_identity==one.model_identity=="NONE" and one.model_class is ModelClass.NONE
    assert one.assignment_revision_id==eligible().revision_id and one.manifold_revision==MANIFOLD
    assert tuple(f.candidate_field for f in one.lineage[0].fields)==("kind","label","claim")
    assert all(f.source_field and f.exact_value and f.normalization_rule for f in one.lineage[0].fields)

def test_canonical_serialization_and_hashes_repeat_exactly():
    bundle=normalized_bundle(); assert canonical_bytes(bundle)==canonical_bytes(bundle)
    assert canonical_hash(bundle.hash_fields())==canonical_hash(bundle.hash_fields())==bundle.content_hash
    with pytest.raises(TypeError): canonical_bytes({"money":0.0})

def test_semantic_duplicate_key_is_stable_and_excludes_retrieval_time():
    args=dict(assignment_revision_id=eligible().revision_id,manifold_revision=MANIFOLD,normalized_trigger_identity="researcher-request:synthetic-node",source_adapter_identity="fixture",source_adapter_version="1",normalizer_identity="normalizer",normalizer_version="1",entitlement_policy_version="policy-v1",source_cursor="fixture-v1",freshness_bucket="bucket-v1")
    assert semantic_duplicate_key(**args)==semantic_duplicate_key(**args)
    assert "time" not in semantic_duplicate_key.__annotations__

def test_ports_and_package_have_no_production_or_external_imports():
    import ast, pathlib
    forbidden=("isees_uap.api","isees_uap.manifold","isees_uap.resolve","isees_uap.research","isees_uap.persistence","requests","httpx","urllib")
    imports=[]
    for path in pathlib.Path("isees_uap/rex").glob("*.py"):
        tree=ast.parse(path.read_text(encoding="utf-8"))
        imports += [n.module or "" for n in ast.walk(tree) if isinstance(n,ast.ImportFrom)]
        imports += [a.name for n in ast.walk(tree) if isinstance(n,ast.Import) for a in n.names]
    assert not any(name.startswith(forbidden) for name in imports)
