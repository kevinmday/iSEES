"""Deterministic saved-authority renderer for MANIFOLD_ARTIFACT projections.

Canonical output is UTF-8 RFC-8259 JSON with sorted object keys, compact
separators, no BOM and no trailing newline.  Declaration order is authored
semantic order.  Identity/reference sets are normalized lexicographically.
"""
from __future__ import annotations

from dataclasses import dataclass
from enum import Enum

from .hashing import canonical_serialize, canonical_sha256
from .schemas import (ArtifactIdentity, AuthorRevision,
                      FrozenResearchSourceSnapshot, ManifoldArtifactManifest,
                      ManifoldDeclaration, ManifoldReference)

SCHEMA_VERSION = "studio-manifold-artifact-manifest/v1"
TEMPLATE_VERSION = SCHEMA_VERSION
RENDERER_VERSION = "studio-v1-manifold-artifact/1"
CONFIGURATION_IDENTITY = "manifold-artifact-default"
CONFIGURATION_VERSION = "1"
CONFIGURATION_HASH = canonical_sha256({
    "configurationIdentity": CONFIGURATION_IDENTITY,
    "configurationVersion": CONFIGURATION_VERSION,
    "normalization": "studio-manifold-artifact-normalization/v1",
    "schemaVersion": SCHEMA_VERSION,
})
ALTERNATE_CONFIGURATION_IDENTITY = "manifold-artifact-portable"
ALTERNATE_CONFIGURATION_VERSION = "1"
ALTERNATE_CONFIGURATION_HASH = canonical_sha256({
    "configurationIdentity": ALTERNATE_CONFIGURATION_IDENTITY,
    "configurationVersion": ALTERNATE_CONFIGURATION_VERSION,
    "normalization": "studio-manifold-artifact-normalization/v1",
    "schemaVersion": SCHEMA_VERSION,
})
MEDIA_TYPE = "application/vnd.isees.manifold-artifact+json"
FILENAME_EXTENSION = "manifold-artifact.projection"


class ManifoldArtifactFailureCode(str, Enum):
    AUTHORITY_MISMATCH = "AUTHORITY_MISMATCH"
    CONTENT_HASH_MISMATCH = "CONTENT_HASH_MISMATCH"
    SNAPSHOT_MISMATCH = "SNAPSHOT_MISMATCH"
    MALFORMED_DECLARATION = "MALFORMED_DECLARATION"
    CONFIGURATION_UNSUPPORTED = "CONFIGURATION_UNSUPPORTED"


class ManifoldArtifactRenderFailure(ValueError):
    def __init__(self, code: ManifoldArtifactFailureCode, safe_message: str):
        super().__init__(safe_message)
        self.code, self.safe_message = code, safe_message


@dataclass(frozen=True)
class ManifoldArtifactConfiguration:
    identity: str = CONFIGURATION_IDENTITY
    version: str = CONFIGURATION_VERSION
    configuration_hash: str = CONFIGURATION_HASH


SUPPORTED_CONFIGURATIONS = {
    (CONFIGURATION_IDENTITY, CONFIGURATION_VERSION, CONFIGURATION_HASH),
    (ALTERNATE_CONFIGURATION_IDENTITY, ALTERNATE_CONFIGURATION_VERSION,
     ALTERNATE_CONFIGURATION_HASH),
}


def _fail(code: ManifoldArtifactFailureCode, message: str):
    raise ManifoldArtifactRenderFailure(code, message)


def _reference_key(reference: ManifoldReference) -> tuple[str, str, str]:
    return reference.kind, reference.identity, reference.integrityHash or ""


def _references(declaration: ManifoldDeclaration) -> tuple[ManifoldReference, ...]:
    values = list(declaration.references)
    if declaration.declarationType == "DECLARED_CONTRADICTION":
        values.extend(declaration.conflictingReferences)
    elif declaration.declarationType == "PROPOSED_RELATIONSHIP":
        values.extend((declaration.subject, declaration.object))
    elif declaration.declarationType == "RESEARCH_VECTOR":
        values.extend(declaration.targetReferences)
    elif declaration.declarationType == "EXCLUSION":
        values.append(declaration.excludedReference)
    return tuple(values)


def _normalize_declaration(declaration: ManifoldDeclaration) -> dict:
    value = declaration.model_dump(exclude_none=True)
    for key in ("references", "conflictingReferences", "targetReferences"):
        if key in value:
            value[key] = sorted(value[key], key=lambda item: (
                item["kind"], item["identity"], item.get("integrityHash", "")))
    return value


def render_manifold_artifact(
    artifact: ArtifactIdentity,
    revision: AuthorRevision,
    snapshots: tuple[FrozenResearchSourceSnapshot, ...],
    investigation_id: str,
    configuration: ManifoldArtifactConfiguration = ManifoldArtifactConfiguration(),
) -> bytes:
    """Render only persisted identity, revision, snapshots and explicit config."""
    if (configuration.identity, configuration.version,
            configuration.configuration_hash) not in SUPPORTED_CONFIGURATIONS:
        _fail(ManifoldArtifactFailureCode.CONFIGURATION_UNSUPPORTED,
              "MANIFOLD_ARTIFACT projection configuration is unsupported.")
    if (artifact.artifactId != revision.artifactId
            or artifact.authorPrincipalId != revision.authorPrincipalId
            or artifact.investigationId != investigation_id):
        _fail(ManifoldArtifactFailureCode.AUTHORITY_MISMATCH,
              "Saved artifact and revision authority do not match.")
    if revision.contentHash != canonical_sha256(
            revision.semanticContent.model_dump(exclude_none=True)):
        _fail(ManifoldArtifactFailureCode.CONTENT_HASH_MISMATCH,
              "Saved revision content hash does not match canonical content.")

    by_id = {snapshot.snapshotId: snapshot for snapshot in snapshots}
    if len(by_id) != len(snapshots) or set(by_id) != {x.snapshotId for x in revision.sourceSnapshots}:
        _fail(ManifoldArtifactFailureCode.SNAPSHOT_MISMATCH,
              "Saved revision snapshot identities do not match persisted snapshots.")
    for reference in revision.sourceSnapshots:
        snapshot = by_id[reference.snapshotId]
        if (snapshot.investigationId != investigation_id
                or snapshot.snapshotHash != reference.snapshotHash
                or snapshot.snapshotHash != canonical_sha256(
                    snapshot.model_dump(exclude={"snapshotHash"}, exclude_none=True))):
            _fail(ManifoldArtifactFailureCode.SNAPSHOT_MISMATCH,
                  "Saved revision snapshot hash or authority does not match.")

    try:
        declarations = tuple(revision.semanticContent.manifoldDeclarations or ())
        all_references = tuple(ref for declaration in declarations
                               for ref in _references(declaration))
        knowledge = sorted({(_reference_key(ref), ref) for ref in all_references
                            if ref.kind == "KNOWLEDGE_OBJECT"}, key=lambda item: item[0])
        evidence = sorted({(_reference_key(ref), ref) for ref in all_references
                           if ref.kind in {"EVIDENCE", "CITATION"}}, key=lambda item: item[0])
        frozen = [{"snapshotId": snapshot.snapshotId,
                   "snapshotHash": snapshot.snapshotHash,
                   "anchorIds": sorted(snapshot.selectedAnchorIds)}
                  for snapshot in sorted(snapshots, key=lambda item: item.snapshotId)]
        provenance = [{
            "provenanceId": f"snapshot:{snapshot.snapshotId}",
            "sourceIdentity": snapshot.snapshotId,
            "reference": {"kind": "SOURCE_SNAPSHOT", "identity": snapshot.snapshotId,
                          "integrityHash": snapshot.snapshotHash},
        } for snapshot in sorted(snapshots, key=lambda item: item.snapshotId)]
        manifest = ManifoldArtifactManifest.model_validate({
            "kind": "MANIFOLD_ARTIFACT", "schemaVersion": SCHEMA_VERSION,
            "source": {"artifactId": artifact.artifactId,
                       "documentId": revision.semanticContent.documentId,
                       "revisionId": revision.revisionId,
                       "revisionNumber": revision.revisionNumber,
                       "contentHash": revision.contentHash,
                       "investigationId": investigation_id},
            "frozenSourceAnchors": frozen,
            "sourceKnowledgeIdentities": [ref.model_dump(exclude_none=True) for _, ref in knowledge],
            "evidenceReferences": [ref.model_dump(exclude_none=True) for _, ref in evidence],
            "declarations": [_normalize_declaration(item) for item in declarations],
            # No saved Studio V1 field currently carries all three governed
            # accepted-relationship identities, so absence remains explicit.
            "acceptedRelationshipReferences": [],
            "normalizedProvenance": provenance,
            "projectionConfiguration": {
                "configurationIdentity": configuration.identity,
                "configurationVersion": configuration.version,
                "configurationHash": configuration.configuration_hash},
            "canonEffect": "NONE",
        })
    except ManifoldArtifactRenderFailure:
        raise
    except Exception as exc:
        raise ManifoldArtifactRenderFailure(
            ManifoldArtifactFailureCode.MALFORMED_DECLARATION,
            "Saved MANIFOLD_ARTIFACT declarations are malformed or ambiguous.") from exc
    return canonical_serialize(manifest.model_dump(exclude_none=True)).encode("utf-8")
