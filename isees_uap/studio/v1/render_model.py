"""Pure, bounded AuthorRevision -> renderer-neutral document adaptation."""
from __future__ import annotations

from dataclasses import dataclass
from enum import Enum
import re
from urllib.parse import urlsplit

from .hashing import canonical_sha256
from .schemas import AuthorRevision, FrozenResearchSourceSnapshot, SemanticDocument

MAX_NODES = 500
MAX_TEXT = 100_000
MAX_TEXT_FIELD = 20_000
MAX_TABLE_ROWS = 200
MAX_TABLE_COLUMNS = 20
MAX_CITATIONS = 500
MAX_SNAPSHOTS = 500
SAFE_URI_SCHEMES = frozenset({"https"})
_BAD_XML = re.compile(r"[\x00-\x08\x0b\x0c\x0e-\x1f\x7f]")


class RenderModelFailureCode(str, Enum):
    MALFORMED_CONTENT = "MALFORMED_CONTENT"
    UNSUPPORTED_CONTENT = "UNSUPPORTED_CONTENT"
    UNSAFE_URI = "UNSAFE_URI"
    INVALID_CHARACTER = "INVALID_CHARACTER"
    LIMIT_EXCEEDED = "LIMIT_EXCEEDED"


class RenderModelFailure(ValueError):
    def __init__(self, code: RenderModelFailureCode, safe_message: str):
        super().__init__(safe_message)
        self.code, self.safe_message = code, safe_message


@dataclass(frozen=True)
class RenderBlock:
    node_id: str
    kind: str
    text: str
    level: int | None = None
    columns: tuple[str, ...] = ()
    rows: tuple[tuple[str, ...], ...] = ()
    provenance: tuple[str, ...] = ()
    placeholder_reason: str | None = None


@dataclass(frozen=True)
class RenderCitation:
    citation_id: str
    title: str
    authors: tuple[str, ...]
    issued: str | None
    publisher: str | None
    url: str | None
    accessed_at: str | None
    source_snapshot_id: str


@dataclass(frozen=True)
class RenderDocument:
    source_kind: str
    document_id: str
    investigation_id: str | None
    artifact_id: str | None
    revision_id: str | None
    revision_number: int | None
    content_hash: str
    author_principal_id: str | None
    profile: str
    profile_version: str
    title: str
    node_order: tuple[str, ...]
    blocks: tuple[RenderBlock, ...]
    citations: tuple[RenderCitation, ...]
    snapshot_references: tuple[tuple[str, str], ...]


def _fail(code: RenderModelFailureCode, message: str):
    raise RenderModelFailure(code, message)


def _text(value: object, label: str, total: list[int]) -> str:
    if not isinstance(value, str):
        _fail(RenderModelFailureCode.MALFORMED_CONTENT, f"{label} must be text.")
    if _BAD_XML.search(value):
        _fail(RenderModelFailureCode.INVALID_CHARACTER, f"{label} contains an invalid control character.")
    if len(value) > MAX_TEXT_FIELD:
        _fail(RenderModelFailureCode.LIMIT_EXCEEDED, f"{label} exceeds the render limit.")
    total[0] += len(value)
    if total[0] > MAX_TEXT:
        _fail(RenderModelFailureCode.LIMIT_EXCEEDED, "Document text exceeds the render limit.")
    return value


def _uri(value: str | None, label: str, total: list[int]) -> str | None:
    if value is None:
        return None
    value = _text(value, label, total)
    parsed = urlsplit(value)
    if parsed.scheme.lower() not in SAFE_URI_SCHEMES or not parsed.netloc or parsed.username or parsed.password:
        _fail(RenderModelFailureCode.UNSAFE_URI, f"{label} uses an unsafe URI.")
    return value


def _build_semantic_render_model(*, semantic: SemanticDocument,
                                 snapshots: tuple[FrozenResearchSourceSnapshot, ...],
                                 source_kind: str, content_hash: str,
                                 investigation_id: str | None,
                                 artifact_id: str | None = None,
                                 revision_id: str | None = None,
                                 revision_number: int | None = None,
                                 author_principal_id: str | None = None,
                                 profile: str = "INVESTIGATION_REPORT",
                                 profile_version: str = "investigation-report/v1") -> RenderDocument:
    order = tuple(semantic.nodeOrder)
    if len(order) > MAX_NODES or len(semantic.nodes) > MAX_NODES:
        _fail(RenderModelFailureCode.LIMIT_EXCEEDED, "Document node count exceeds the render limit.")
    if len(order) != len(set(order)):
        _fail(RenderModelFailureCode.MALFORMED_CONTENT, "Document node order contains duplicates.")
    by_id = {node.id: node for node in semantic.nodes}
    if len(by_id) != len(semantic.nodes) or set(order) != set(by_id):
        _fail(RenderModelFailureCode.MALFORMED_CONTENT, "Document node order does not exactly identify its nodes.")
    if len(semantic.citations) > MAX_CITATIONS or len(snapshots) > MAX_SNAPSHOTS:
        _fail(RenderModelFailureCode.LIMIT_EXCEEDED, "Document source count exceeds the render limit.")
    total = [0]
    title = _text(semantic.title, "Document title", total)
    citations: list[RenderCitation] = []
    citation_ids: set[str] = set()
    for citation in semantic.citations:
        if citation.citationId in citation_ids:
            _fail(RenderModelFailureCode.MALFORMED_CONTENT, "Citation identities must be unique.")
        citation_ids.add(citation.citationId)
        citations.append(RenderCitation(
            citation.citationId, _text(citation.title, "Citation title", total),
            tuple(_text(x, "Citation author", total) for x in (citation.authors or ((citation.institutionalAuthor,) if citation.institutionalAuthor else ()))),
            _text(citation.publicationDate, "Citation date", total) if citation.publicationDate else None,
            _text(citation.publisher, "Citation publisher", total) if citation.publisher else None,
            _uri(citation.url, "Citation URL", total),
            _text(citation.accessedDate, "Citation access date", total) if citation.accessedDate else None,
            citation.sourceSnapshotId,
        ))
    blocks: list[RenderBlock] = []
    for node_id in order:
        node = by_id[node_id]
        kind = node.type
        provenance: tuple[str, ...] = ()
        reason: str | None = None
        columns: tuple[str, ...] = ()
        rows: tuple[tuple[str, ...], ...] = ()
        level: int | None = None
        if kind == "HEADING": text, level = node.text, node.level
        elif kind in {"PARAGRAPH", "RESEARCHER_NOTE"}: text = node.text
        elif kind == "CLAIM":
            text = f"[{node.supportState}] {node.text}"
            provenance = tuple(node.sourceSnapshotIds)
        elif kind == "QUOTATION":
            text = f'“{node.text}” — citation {node.citationId}, {node.locator}'
            provenance = (node.citationId,)
        elif kind == "CITATION_REFERENCE":
            text = f"Citation: {node.citationId}"
            provenance = (node.citationId,)
        elif kind == "TABLE":
            columns = tuple(_text(x, "Table column", total) for x in node.columns)
            rows = tuple(tuple(_text(x, "Table cell", total) for x in row) for row in node.rows)
            if not columns or len(columns) > MAX_TABLE_COLUMNS or len(rows) > MAX_TABLE_ROWS or any(len(row) != len(columns) for row in rows):
                _fail(RenderModelFailureCode.LIMIT_EXCEEDED, "Table dimensions are invalid or exceed the render limit.")
            text = node.caption or node.altText or "Table"
            provenance = tuple(x.sourceSnapshotId for x in node.lineage) + ((node.sourceAttribution,) if node.sourceAttribution else ())
        elif kind == "SECTION":
            text, reason = node.title, f"Structural children: {', '.join(node.childNodeIds) or 'none'}; flat saved order governs this export."
        elif kind == "FOOTNOTE": text, reason = f"{node.marker}: {node.text}", "Rendered as a labeled block; native PDF footnotes are unavailable."
        elif kind == "EQUATION": text, reason = f"{node.latexSource} {node.equationNumber or ''}".strip(), "Rendered as literal source; deterministic math layout is unavailable."
        elif kind == "FIGURE":
            text, reason = node.caption or node.altText or "Figure", f"Asset {node.assetId} is not embedded; frozen admitted bytes are unavailable."
            provenance = tuple(x.sourceSnapshotId for x in node.lineage) + ((node.sourceAttribution,) if node.sourceAttribution else ())
        elif kind == "APPENDIX":
            text, reason = node.title, f"Appendix children: {', '.join(node.childNodeIds) or 'none'}; flat saved order governs this export."
        else:
            _fail(RenderModelFailureCode.UNSUPPORTED_CONTENT, f"Unsupported semantic node type: {kind}.")
        blocks.append(RenderBlock(node_id, kind, _text(text, f"{kind} content", total), level,
                                  columns, rows, provenance, reason))
    snapshot_by_id = {snapshot.snapshotId: snapshot for snapshot in snapshots}
    if len(snapshot_by_id) != len(snapshots):
        _fail(RenderModelFailureCode.MALFORMED_CONTENT, "Frozen snapshot identities must be unique.")
    referenced = {citation.sourceSnapshotId for citation in semantic.citations}
    referenced.update(source_id for block in blocks for source_id in block.provenance
                      if source_id in snapshot_by_id)
    if source_kind == "CURRENT_DRAFT" and referenced != set(snapshot_by_id):
        _fail(RenderModelFailureCode.MALFORMED_CONTENT, "Frozen snapshots must exactly match semantic source references.")
    for snapshot in snapshots:
        if investigation_id is not None and snapshot.investigationId != investigation_id:
            _fail(RenderModelFailureCode.MALFORMED_CONTENT, "Frozen snapshot investigation identity is inconsistent.")
        for source in snapshot.sources:
            for representation in source.representations:
                if representation.contentHash != canonical_sha256(representation.content):
                    _fail(RenderModelFailureCode.MALFORMED_CONTENT, "Frozen source representation hash is invalid.")
                _text(representation.content, "Frozen source representation", total)
    return RenderDocument(source_kind, semantic.documentId, investigation_id, artifact_id,
        revision_id, revision_number, content_hash, author_principal_id, profile, profile_version,
        title, order, tuple(blocks), tuple(citations),
        tuple((x.snapshotId, x.snapshotHash) for x in snapshots))


def build_render_model(revision: AuthorRevision, investigation_id: str) -> RenderDocument:
    """Adapt only immutable revision data; no IO, URL resolution, or mutation."""
    if revision.immutableStatus != "IMMUTABLE_SAVED_REVISION":
        _fail(RenderModelFailureCode.MALFORMED_CONTENT, "PDF export requires an immutable saved revision.")
    # Saved revisions persist only snapshot references; their frozen payloads were
    # validated on admission and remain in the authoritative snapshot store.
    model = _build_semantic_render_model(semantic=revision.semanticContent, snapshots=(),
        source_kind="SAVED_REVISION", content_hash=revision.contentHash,
        investigation_id=investigation_id, artifact_id=revision.artifactId,
        revision_id=revision.revisionId, revision_number=revision.revisionNumber,
        author_principal_id=revision.authorPrincipalId, profile=revision.profile,
        profile_version=revision.profileVersion)
    return RenderDocument(**{**model.__dict__, "snapshot_references":
        tuple((x.snapshotId, x.snapshotHash) for x in revision.sourceSnapshots)})


def build_current_draft_render_model(*, document_id: str,
                                     investigation_id: str | None,
                                     semantic: SemanticDocument,
                                     snapshots: tuple[FrozenResearchSourceSnapshot, ...],
                                     source_hash: str, profile: str,
                                     profile_version: str) -> RenderDocument:
    if semantic.documentId != document_id or source_hash != canonical_sha256(
            semantic.model_dump(exclude_none=True)):
        _fail(RenderModelFailureCode.MALFORMED_CONTENT, "Current-draft source hash or document identity is invalid.")
    return _build_semantic_render_model(semantic=semantic, snapshots=snapshots,
        source_kind="CURRENT_DRAFT", content_hash=source_hash,
        investigation_id=investigation_id, profile=profile,
        profile_version=profile_version)
