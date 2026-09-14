from __future__ import annotations

from dataclasses import dataclass
from datetime import datetime
from typing import Any

from .canonical import canonical_bytes, canonical_hash
from .contracts import (AiAssistanceStatus, CandidateEpistemicClassification,
                        CandidateKnowledgeBundleId, CandidateReviewStatus, CanonEffect,
                        FrontierAssignmentRevisionId, ManifoldRevisionReference,
                        ModelClass, SearchExecutionId, SourceClass, _text, _time)

FIXTURE_LOCATOR = "rex-fixture://synthetic-observation/v1"
FIXTURE_VERSION = "1.0.0"
FIXTURE_STRUCTURED_MATERIAL = (
    ("claim", "A synthetic observer reported a blue indicator at the test site."),
    ("candidate_kind", "OBSERVATION"),
    ("candidate_label", "Reported blue indicator"),
)


@dataclass(frozen=True, slots=True)
class SourceDocument:
    locator: str; version: str; media_type: str; source_class: SourceClass
    structured_material: tuple[tuple[str,str],...]; content_hash: str
    def __post_init__(self):
        if self.content_hash != canonical_hash(self.content_fields()): raise ValueError("source content_hash mismatch")
    def content_fields(self) -> dict[str,Any]:
        return {"locator":self.locator,"version":self.version,"mediaType":self.media_type,
                "sourceClass":self.source_class,"structuredMaterial":self.structured_material}
    def deterministic_bytes(self) -> bytes: return canonical_bytes(self.content_fields())


@dataclass(frozen=True, slots=True)
class SourceFieldLineage:
    candidate_field: str; source_field: str; exact_value: str; normalization_rule: str

@dataclass(frozen=True, slots=True)
class CandidateNode:
    candidate_id: str; kind: str; label: str; claim: str
    epistemic_classification: CandidateEpistemicClassification
    review_status: CandidateReviewStatus; canon_effect: CanonEffect

@dataclass(frozen=True, slots=True)
class CandidateLineage:
    candidate_id: str; source_locator: str; source_version: str
    fields: tuple[SourceFieldLineage,...]; supplied_by: str

@dataclass(frozen=True, slots=True)
class CandidateKnowledgeBundle:
    bundle_id: CandidateKnowledgeBundleId; source_document: SourceDocument
    candidates: tuple[CandidateNode,...]; lineage: tuple[CandidateLineage,...]
    source_locator: str; source_version: str; adapter_identity: str; adapter_version: str
    normalizer_identity: str; normalizer_version: str; source_content_hash: str; configuration_hash: str
    assignment_revision_id: FrontierAssignmentRevisionId; manifold_revision: ManifoldRevisionReference
    execution_id: SearchExecutionId; ai_assistance_status: AiAssistanceStatus
    provider_identity: str; model_identity: str; model_class: ModelClass; content_hash: str
    def __post_init__(self):
        if len(self.candidates)!=1 or len(self.lineage)!=1: raise ValueError("fixture bundle must contain exactly one candidate and lineage record")
        if self.source_content_hash != self.source_document.content_hash: raise ValueError("source hash binding mismatch")
        if self.source_locator != self.source_document.locator or self.source_version != self.source_document.version: raise ValueError("source binding mismatch")
        if {c.candidate_id for c in self.candidates}!={l.candidate_id for l in self.lineage}: raise ValueError("candidate lineage is incomplete")
        if self.content_hash != canonical_hash(self.hash_fields()): raise ValueError("bundle content_hash mismatch")
    def hash_fields(self): return {n:getattr(self,n) for n in self.__dataclass_fields__ if n != "content_hash"}


@dataclass(frozen=True, slots=True)
class FixtureNormalizationRequest:
    document: SourceDocument; bundle_id: CandidateKnowledgeBundleId
    assignment_revision_id: FrontierAssignmentRevisionId; manifold_revision: ManifoldRevisionReference
    execution_id: SearchExecutionId; configuration_hash: str; supplied_by: str


class LocalFixtureSourceAdapter:
    adapter_identity="rex-local-immutable-fixture"
    adapter_version="1.0.0"
    source_class=SourceClass.LOCAL_FIXTURE
    def retrieve(self, request: Any) -> SourceDocument:
        fields={"locator":FIXTURE_LOCATOR,"version":FIXTURE_VERSION,
                "mediaType":"application/vnd.isees.rex-fixture+json",
                "sourceClass":SourceClass.LOCAL_FIXTURE,"structuredMaterial":FIXTURE_STRUCTURED_MATERIAL}
        return SourceDocument(locator=FIXTURE_LOCATOR,version=FIXTURE_VERSION,
            media_type=fields["mediaType"],source_class=SourceClass.LOCAL_FIXTURE,
            structured_material=FIXTURE_STRUCTURED_MATERIAL,content_hash=canonical_hash(fields))


class FixtureCandidateNormalizer:
    normalizer_identity="rex-fixture-claim-conserving-normalizer"
    normalizer_version="1.0.0"
    def normalize(self, request: FixtureNormalizationRequest) -> CandidateKnowledgeBundle:
        material=dict(request.document.structured_material)
        candidate_id="rex-candidate:"+canonical_hash({"source":request.document.content_hash,"claim":material["claim"]}).removeprefix("sha256:")
        candidate=CandidateNode(candidate_id=candidate_id,kind=material["candidate_kind"],label=material["candidate_label"],claim=material["claim"],
            epistemic_classification=CandidateEpistemicClassification.CANDIDATE_KNOWLEDGE,
            review_status=CandidateReviewStatus.RESEARCHER_REVIEW_REQUIRED,canon_effect=CanonEffect.NONE)
        lineage=CandidateLineage(candidate_id=candidate_id,source_locator=request.document.locator,
            source_version=request.document.version,supplied_by=request.supplied_by,fields=(
                SourceFieldLineage("kind","candidate_kind",material["candidate_kind"],"EXACT_STRUCTURED_FIELD/v1"),
                SourceFieldLineage("label","candidate_label",material["candidate_label"],"EXACT_STRUCTURED_FIELD/v1"),
                SourceFieldLineage("claim","claim",material["claim"],"EXACT_STRUCTURED_FIELD/v1")))
        values=dict(bundle_id=request.bundle_id,source_document=request.document,candidates=(candidate,),lineage=(lineage,),
            source_locator=request.document.locator,source_version=request.document.version,
            adapter_identity=LocalFixtureSourceAdapter.adapter_identity,adapter_version=LocalFixtureSourceAdapter.adapter_version,
            normalizer_identity=self.normalizer_identity,normalizer_version=self.normalizer_version,
            source_content_hash=request.document.content_hash,configuration_hash=request.configuration_hash,
            assignment_revision_id=request.assignment_revision_id,manifold_revision=request.manifold_revision,
            execution_id=request.execution_id,ai_assistance_status=AiAssistanceStatus.NONE,
            provider_identity="NONE",model_identity="NONE",model_class=ModelClass.NONE)
        return CandidateKnowledgeBundle(**values,content_hash=canonical_hash(values))
