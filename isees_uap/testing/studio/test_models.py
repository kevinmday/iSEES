from dataclasses import FrozenInstanceError
from datetime import datetime, timezone

import pytest

from isees_uap.studio.lifecycle import StudioLifecycle
from isees_uap.studio.models import (
    ClaimReviewState, LineageState, StudioArtifact, StudioArtifactVersion, StudioClaim,
)


NOW = datetime(2026, 1, 1, tzinfo=timezone.utc)


def test_artifact_investigation_and_owner_are_immutable():
    artifact = StudioArtifact("a", "i", "p", 0, StudioLifecycle.DRAFT, 1, "v1", NOW, NOW)
    with pytest.raises(FrozenInstanceError):
        artifact.investigation_id = "other"
    with pytest.raises(FrozenInstanceError):
        artifact.owner_principal_id = "other"


def test_saved_version_and_nested_document_are_immutable():
    version = StudioArtifactVersion(
        "v1", "a", 1, None, "author/v1", {"sections": [{"text": "exact"}]}, (), (), (), (),
        None, "sha256:" + "0" * 64, "p", NOW)
    with pytest.raises(FrozenInstanceError):
        version.version_number = 2
    with pytest.raises(TypeError):
        version.document["sections"] = ()
    assert isinstance(version.document["sections"], tuple)


def test_claim_requires_exact_text_or_span():
    claim = StudioClaim("c", "v", ClaimReviewState.UNREVIEWED, LineageState.ORPHANED,
                        claim_text="A claim")
    assert claim.claim_text == "A claim"
    with pytest.raises(ValueError):
        StudioClaim("c", "v", ClaimReviewState.UNREVIEWED, LineageState.ORPHANED)
