from dataclasses import FrozenInstanceError, replace
import pytest

from isees_uap.studio.v1.contracts import ARTIFACT_PROFILES
from isees_uap.studio.v1.profile_registry import PROFILE_REGISTRY, get_profile, get_profile_version, list_profiles, list_verified_available_profiles, validate_profile_registry

def test_exact_profiles_availability_and_investigation_sections():
    assert tuple(x.profileId for x in list_profiles()) == ARTIFACT_PROFILES
    assert tuple(x.profileId for x in list_verified_available_profiles()) == ("INVESTIGATION_REPORT",)
    report = get_profile("INVESTIGATION_REPORT")
    assert tuple(x.sectionId for x in report.sections) == ("abstract", "research-question", "hypothesis", "method", "evidence", "analysis", "figures-tables", "conclusion", "references-footnotes")
    assert get_profile_version("INVESTIGATION_REPORT", "investigation-report/v1") is report

def test_registry_is_immutable_and_unknown_lookups_fail():
    with pytest.raises(FrozenInstanceError): PROFILE_REGISTRY[0].displayName = "Changed"  # type: ignore[misc]
    with pytest.raises(KeyError): get_profile("UNKNOWN")
    with pytest.raises(KeyError): get_profile_version("INVESTIGATION_REPORT", "investigation-report/v2")

def test_duplicate_profiles_sections_and_ordinals_fail_closed():
    with pytest.raises(ValueError): validate_profile_registry(PROFILE_REGISTRY + (PROFILE_REGISTRY[0],))
    report = PROFILE_REGISTRY[0]
    duplicate = replace(report.sections[1], sectionId=report.sections[0].sectionId)
    with pytest.raises(ValueError): validate_profile_registry((replace(report, sections=(report.sections[0], duplicate, *report.sections[2:])), *PROFILE_REGISTRY[1:]))
    duplicate_ordinal = replace(report.sections[1], ordinal=1)
    with pytest.raises(ValueError): validate_profile_registry((replace(report, sections=(report.sections[0], duplicate_ordinal, *report.sections[2:])), *PROFILE_REGISTRY[1:]))

def test_projection_truth_policy_and_unverified_profiles():
    report = get_profile("INVESTIGATION_REPORT")
    pdf, docx, html = report.projectionCapabilities
    assert (pdf.templateProfileVersion, pdf.rendererVersion, pdf.savedRevisionSupport) == ("investigation-report-pdf/1", "studio-v1-reportlab-pdf/1", True)
    assert (docx.templateProfileVersion, docx.rendererVersion, docx.savedRevisionSupport) == ("investigation-report-docx/1", "studio-v1-python-docx/1", True)
    assert (html.disposition, html.currentDraftSupport, html.savedRevisionSupport) == ("LOCAL_DISPOSABLE_PREVIEW", True, False)
    assert all(cap.capabilityState != "VERIFIED_AVAILABLE" and not cap.currentDraftSupport and not cap.savedRevisionSupport for profile in PROFILE_REGISTRY[1:] for cap in profile.projectionCapabilities)
    assert all(profile.profileChangePolicy.afterFirstSave == "IMMUTABLE_FOR_ARTIFACT_LINEAGE" for profile in PROFILE_REGISTRY)
