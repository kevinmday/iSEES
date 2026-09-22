from __future__ import annotations

from dataclasses import asdict, dataclass
import re
from typing import Literal

from .contracts import ARTIFACT_PROFILES, PROJECTION_FORMATS, SEMANTIC_NODE_TYPES

REGISTRY_SCHEMA_VERSION = "studio-v1/profile-registry/1"
PROFILE_AVAILABILITIES = ("VERIFIED_AVAILABLE", "ADMITTED_UNVERIFIED")
SECTION_REQUIREMENTS = ("REQUIRED", "OPTIONAL")
SECTION_REPEATABILITIES = ("SINGLE", "REPEATABLE")
VALIDATION_LEVELS = ("VERIFIED", "ADMITTED_UNVERIFIED")
DRAFTING_DESIGN_IDS = ("investigation-report/1", "evidence-assessment/1", "comparative-event-analysis/1", "research-memorandum/1")
PROJECTION_CAPABILITY_STATES = ("VERIFIED_AVAILABLE", "ADMITTED_UNVERIFIED", "UNSUPPORTED")
AUTHOR_DOCUMENT_TYPES = ("DOCUMENT", "REPORT", "PRESENTATION", "NOTEBOOK", "ARTICLE", "MANUAL")

@dataclass(frozen=True)
class SectionDefinition:
    sectionId: str; displayLabel: str; description: str; ordinal: int
    requirement: Literal["REQUIRED", "OPTIONAL"]
    repeatability: Literal["SINGLE", "REPEATABLE"]
    allowedSemanticNodeTypes: tuple[str, ...] = SEMANTIC_NODE_TYPES
    customResearcherContentAllowed: bool = True

@dataclass(frozen=True)
class ProjectionCapability:
    format: Literal["PDF", "DOCX", "HTML"]
    capabilityState: Literal["VERIFIED_AVAILABLE", "ADMITTED_UNVERIFIED", "UNSUPPORTED"]
    currentDraftSupport: bool; savedRevisionSupport: bool
    disposition: Literal["DURABLE_CHILD_PROJECTION", "LOCAL_DISPOSABLE_PREVIEW", "NOT_PROJECTION_READY"]
    templateProfileVersion: str | None = None; rendererVersion: str | None = None

@dataclass(frozen=True)
class ProfileChangePolicy:
    beforeFirstSave: Literal["SELECTABLE_OR_CHANGEABLE_LOCAL_WORKING_DOCUMENT"] = "SELECTABLE_OR_CHANGEABLE_LOCAL_WORKING_DOCUMENT"
    afterFirstSave: Literal["IMMUTABLE_FOR_ARTIFACT_LINEAGE"] = "IMMUTABLE_FOR_ARTIFACT_LINEAGE"

@dataclass(frozen=True)
class ProfileDefinition:
    profileId: str; displayName: str; description: str; profileVersion: str
    availability: Literal["VERIFIED_AVAILABLE", "ADMITTED_UNVERIFIED"]
    compatibleAuthorDocumentTypes: tuple[str, ...]; sections: tuple[SectionDefinition, ...]
    validationLevel: Literal["VERIFIED", "ADMITTED_UNVERIFIED"]
    compatibleDraftingDesignIds: tuple[str, ...]
    projectionCapabilities: tuple[ProjectionCapability, ...]
    profileChangePolicy: ProfileChangePolicy = ProfileChangePolicy()

def _s(section_id: str, label: str, description: str, ordinal: int, requirement: str, repeatability: str) -> SectionDefinition:
    return SectionDefinition(section_id, label, description, ordinal, requirement, repeatability)  # type: ignore[arg-type]

def _unavailable(fmt: str) -> ProjectionCapability:
    return ProjectionCapability(fmt, "ADMITTED_UNVERIFIED", False, False, "NOT_PROJECTION_READY")  # type: ignore[arg-type]

PROFILE_REGISTRY = (
    ProfileDefinition("INVESTIGATION_REPORT", "Investigation Report", "Governed report of a research question, evidence, analysis, and conclusion.", "investigation-report/v1", "VERIFIED_AVAILABLE", ("REPORT",), (
        _s("abstract", "Abstract", "Optional summary of the investigation.", 1, "OPTIONAL", "SINGLE"),
        _s("research-question", "Research Question", "Question that governs the investigation.", 2, "REQUIRED", "SINGLE"),
        _s("hypothesis", "Hypothesis / H0 / H1", "Declared hypotheses and alternatives.", 3, "OPTIONAL", "REPEATABLE"),
        _s("method", "Method", "Methods, assumptions, and analytical approach.", 4, "OPTIONAL", "SINGLE"),
        _s("evidence", "Evidence", "Governed evidence supporting or challenging the inquiry.", 5, "REQUIRED", "REPEATABLE"),
        _s("analysis", "Analysis", "Reasoning grounded in the declared evidence.", 6, "REQUIRED", "REPEATABLE"),
        _s("figures-tables", "Figures / Tables", "Figures and tables with governed lineage.", 7, "OPTIONAL", "REPEATABLE"),
        _s("conclusion", "Conclusion", "Bounded findings and unresolved uncertainty.", 8, "REQUIRED", "SINGLE"),
        _s("references-footnotes", "References / Footnotes", "Citations, references, and footnotes.", 9, "OPTIONAL", "REPEATABLE"),
    ), "VERIFIED", ("investigation-report/1",), (
        ProjectionCapability("PDF", "VERIFIED_AVAILABLE", True, True, "DURABLE_CHILD_PROJECTION", "investigation-report-pdf/1", "studio-v1-reportlab-pdf/1"),
        ProjectionCapability("DOCX", "VERIFIED_AVAILABLE", True, True, "DURABLE_CHILD_PROJECTION", "investigation-report-docx/1", "studio-v1-python-docx/1"),
        ProjectionCapability("HTML", "VERIFIED_AVAILABLE", True, False, "LOCAL_DISPOSABLE_PREVIEW", "studio-current-draft/v1", "studio-local-html/v1"),
    )),
    ProfileDefinition("EXECUTIVE_BRIEF", "Executive Brief", "Concise decision-oriented synthesis; runtime validation and projection acceptance are incomplete.", "executive-brief/v1", "ADMITTED_UNVERIFIED", ("REPORT",), (
        _s("executive-summary", "Executive Summary", "Concise statement of the issue and result.", 1, "REQUIRED", "SINGLE"), _s("key-findings", "Key Findings", "Material supported findings.", 2, "REQUIRED", "REPEATABLE"), _s("evidence-basis", "Evidence Basis", "Evidence scope and limitations.", 3, "REQUIRED", "REPEATABLE"), _s("implications", "Implications", "Decision-relevant implications.", 4, "REQUIRED", "REPEATABLE"), _s("recommended-actions", "Recommended Actions", "Bounded actions for consideration.", 5, "OPTIONAL", "REPEATABLE"),
    ), "ADMITTED_UNVERIFIED", (), (_unavailable("PDF"), _unavailable("DOCX"), _unavailable("HTML"))),
    ProfileDefinition("SCIENTIFIC_PAPER", "Scientific Paper", "Formal scientific manuscript; runtime validation and projection acceptance are incomplete.", "scientific-paper/v1", "ADMITTED_UNVERIFIED", ("ARTICLE",), (
        _s("abstract", "Abstract", "Structured summary of the paper.", 1, "REQUIRED", "SINGLE"), _s("introduction", "Introduction", "Research context, question, and contribution.", 2, "REQUIRED", "SINGLE"), _s("methods", "Methods", "Reproducible methods and assumptions.", 3, "REQUIRED", "SINGLE"), _s("results", "Results", "Reported results without interpretive overreach.", 4, "REQUIRED", "REPEATABLE"), _s("discussion", "Discussion", "Interpretation, limitations, and alternatives.", 5, "REQUIRED", "SINGLE"), _s("conclusion", "Conclusion", "Bounded conclusion and future work.", 6, "OPTIONAL", "SINGLE"), _s("references", "References", "Structured scholarly citations.", 7, "REQUIRED", "SINGLE"), _s("appendices-supplementary", "Appendices / Supplementary Material", "Supplementary governed material.", 8, "OPTIONAL", "REPEATABLE"),
    ), "ADMITTED_UNVERIFIED", (), (_unavailable("PDF"), _unavailable("DOCX"), _unavailable("HTML"))),
    ProfileDefinition("INTENTION_HYPOTHESIS_ASSESSMENT", "Intention Hypothesis Assessment", "Governed H0/H1 assessment; runtime validation and projection acceptance are incomplete.", "intention-hypothesis-assessment/v1", "ADMITTED_UNVERIFIED", ("REPORT",), (
        _s("assessment-scope", "Assessment Scope", "Evidence scope, framework version, and declared tests.", 1, "REQUIRED", "SINGLE"), _s("observations", "Observations", "Available deterministic measurements.", 2, "REQUIRED", "REPEATABLE"), _s("hypotheses", "H0 / H1 and Alternatives", "H0, H1 variants, and competing explanations.", 3, "REQUIRED", "REPEATABLE"), _s("supporting-evidence", "Supporting Evidence", "Evidence supporting declared hypotheses.", 4, "REQUIRED", "REPEATABLE"), _s("counterevidence", "Counterevidence", "Counterevidence and strongest competing arguments.", 5, "REQUIRED", "REPEATABLE"), _s("warrants-assumptions", "Warrants / Assumptions", "Mathematical warrants and explicit assumptions.", 6, "REQUIRED", "REPEATABLE"), _s("predictions-falsifiers", "Predictions / Falsifiers", "Testable predictions and falsifiers.", 7, "REQUIRED", "REPEATABLE"), _s("uncertainty-gaps", "Uncertainty / Evidence Gaps", "Unresolved uncertainty and unavailable measurements.", 8, "REQUIRED", "SINGLE"), _s("governed-conclusion", "Governed Conclusion", "Controlled conclusion with evidence scope and alternatives.", 9, "REQUIRED", "SINGLE"),
    ), "ADMITTED_UNVERIFIED", ("evidence-assessment/1",), (_unavailable("PDF"), _unavailable("DOCX"), _unavailable("HTML"))),
)

def validate_profile_registry(definitions: tuple[ProfileDefinition, ...] = PROFILE_REGISTRY) -> bool:
    ids: set[str] = set(); pairs: set[tuple[str, str]] = set()
    for profile in definitions:
        if profile.profileId not in ARTIFACT_PROFILES or profile.profileId in ids: raise ValueError(f"duplicate or unknown profile ID: {profile.profileId}")
        ids.add(profile.profileId); pair = (profile.profileId, profile.profileVersion)
        if pair in pairs: raise ValueError(f"duplicate profile version: {pair}")
        pairs.add(pair)
        if not re.fullmatch(r"[a-z0-9-]+/v[1-9][0-9]*", profile.profileVersion) or not profile.displayName.strip() or profile.availability not in PROFILE_AVAILABILITIES: raise ValueError(f"malformed profile: {profile.profileId}")
        if profile.validationLevel not in VALIDATION_LEVELS or not profile.compatibleAuthorDocumentTypes or any(x not in AUTHOR_DOCUMENT_TYPES for x in profile.compatibleAuthorDocumentTypes): raise ValueError("invalid compatibility or validation level")
        section_ids: set[str] = set(); ordinals: set[int] = set()
        for index, item in enumerate(profile.sections, 1):
            if not re.fullmatch(r"[a-z0-9]+(?:-[a-z0-9]+)*", item.sectionId) or item.sectionId in section_ids or item.ordinal in ordinals or item.ordinal != index or item.requirement not in SECTION_REQUIREMENTS or item.repeatability not in SECTION_REPEATABILITIES or any(x not in SEMANTIC_NODE_TYPES for x in item.allowedSemanticNodeTypes): raise ValueError(f"invalid section: {profile.profileId}/{item.sectionId}")
            section_ids.add(item.sectionId); ordinals.add(item.ordinal)
        if len(set(profile.compatibleDraftingDesignIds)) != len(profile.compatibleDraftingDesignIds) or any(x not in DRAFTING_DESIGN_IDS for x in profile.compatibleDraftingDesignIds): raise ValueError("invalid drafting design compatibility")
        formats: set[str] = set()
        for capability in profile.projectionCapabilities:
            if capability.format not in PROJECTION_FORMATS or capability.format in formats or capability.capabilityState not in PROJECTION_CAPABILITY_STATES: raise ValueError("duplicate or unknown projection format/state")
            formats.add(capability.format)
            if capability.capabilityState == "VERIFIED_AVAILABLE" and (not capability.templateProfileVersion or not capability.rendererVersion): raise ValueError("verified projection lacks identity")
        if profile.availability == "VERIFIED_AVAILABLE" and not any(x.format == "PDF" and x.capabilityState == "VERIFIED_AVAILABLE" and x.savedRevisionSupport for x in profile.projectionCapabilities): raise ValueError("verified profile lacks required durable PDF capability")
        if profile.profileChangePolicy != ProfileChangePolicy(): raise ValueError("invalid profile-change policy")
    if ids != set(ARTIFACT_PROFILES): raise ValueError("registry must contain every and only Studio V1 profile")
    return True

validate_profile_registry()

def list_profiles() -> tuple[ProfileDefinition, ...]: return PROFILE_REGISTRY
def list_verified_available_profiles() -> tuple[ProfileDefinition, ...]: return tuple(x for x in PROFILE_REGISTRY if x.availability == "VERIFIED_AVAILABLE")
def get_profile(profile_id: str) -> ProfileDefinition:
    try: return next(x for x in PROFILE_REGISTRY if x.profileId == profile_id)
    except StopIteration as error: raise KeyError(f"unknown Studio V1 profile: {profile_id}") from error
def get_profile_version(profile_id: str, profile_version: str) -> ProfileDefinition:
    try: return next(x for x in PROFILE_REGISTRY if x.profileId == profile_id and x.profileVersion == profile_version)
    except StopIteration as error: raise KeyError(f"unknown Studio V1 profile/version: {profile_id}/{profile_version}") from error
def serialize_profile_registry() -> dict[str, object]:
    def clean(value: object) -> object:
        if isinstance(value, dict): return {key: clean(child) for key, child in value.items() if child is not None}
        if isinstance(value, (tuple, list)): return [clean(child) for child in value]
        return value
    return {"schemaVersion": REGISTRY_SCHEMA_VERSION, "profiles": clean([asdict(x) for x in PROFILE_REGISTRY])}
