from __future__ import annotations

import hashlib
import os
import re
import tempfile
from dataclasses import dataclass
from io import BytesIO
from pathlib import Path
from typing import Any, Mapping

from reportlab.lib.pagesizes import LETTER
from reportlab.pdfgen.canvas import Canvas

from .models import StudioArtifact, StudioArtifactVersion, StudioSourceSnapshot


MATERIALIZER_VERSION = "studio-reportlab-pdf/v1"


@dataclass(frozen=True)
class StoredPdf:
    output_identity: str
    output_location: str
    output_hash: str
    path: Path
    created: bool


def _text(value: Any) -> str:
    return str(value if value is not None else "").encode("latin-1", "replace").decode("latin-1")


def _node_lines(node: Mapping[str, Any]) -> list[tuple[str, int]]:
    kind = node.get("type")
    if kind == "DIVIDER": return [("________________________________________", 10)]
    if kind == "HEADING": return [(_text(node.get("text")), 16)]
    if kind in {"PARAGRAPH", "QUOTE", "OBSERVATION"}: return [(_text(node.get("text")), 11)]
    if kind == "CITATION": return [(f"Citation: {_text(node.get('citation'))}", 10)]
    if kind == "REFERENCE":
        return [(f"Source reference: {_text(node.get('title'))} [{_text(node.get('targetId'))}]", 10),
                (f"Provenance: {_text(node.get('source'))} / {_text(node.get('corpusId'))}", 9)]
    if kind == "LIST":
        items = node.get("items") if isinstance(node.get("items"), list) else []
        return [(f"- {_text(item.get('text') if isinstance(item, dict) else item)}", 11) for item in items]
    if kind == "CODE": return [(_text(node.get("code", node.get("text", ""))), 9)]
    if kind == "TABLE": return [(f"[Table: {node.get('rows', 0)} rows x {node.get('columns', 0)} columns]", 10)]
    if kind == "IMAGE": return [(f"[Image: {_text(node.get('source'))}]", 10)]
    return [(f"[Unsupported authored block: {_text(kind or 'UNKNOWN')}]", 10)]


def render_pdf(artifact: StudioArtifact, version: StudioArtifactVersion,
               snapshots: tuple[StudioSourceSnapshot, ...]) -> bytes:
    document = version.document if isinstance(version.document, Mapping) else {}
    metadata = document.get("metadata") if isinstance(document.get("metadata"), Mapping) else {}
    title = _text(metadata.get("title") or "Untitled Studio document")
    output = BytesIO()
    canvas = Canvas(output, pagesize=LETTER, invariant=1, pageCompression=1)
    canvas.setTitle(title); canvas.setAuthor(_text(metadata.get("author") or "iSEES Studio"))
    width, height = LETTER; y = height - 54

    def write(value: str, size: int = 11) -> None:
        nonlocal y
        words = value.split() or [""]
        lines: list[str] = []
        current = ""
        limit = max(20, int(92 * 11 / max(size, 1)))
        for word in words:
            if current and len(current) + len(word) + 1 > limit:
                lines.append(current); current = word
            else: current = f"{current} {word}".strip()
        lines.append(current)
        for line in lines:
            if y < 54: canvas.showPage(); y = height - 54
            canvas.setFont("Helvetica-Bold" if size >= 16 else "Helvetica", size)
            canvas.drawString(54, y, line); y -= size + 5

    write(title, 20)
    write(f"Investigation: {artifact.investigation_id}", 9)
    write(f"Artifact: {artifact.artifact_id}", 9)
    write(f"Saved version: {version.version_id} (v{version.version_number})", 9)
    y -= 8
    nodes = document.get("nodes") if isinstance(document.get("nodes"), (list, tuple)) else []
    if not nodes: write("This saved document contains no authored blocks.", 11)
    for node in nodes:
        if isinstance(node, Mapping):
            for line, size in _node_lines(node): write(line, size)
    if snapshots:
        y -= 8; write("Source and provenance record", 16)
        write("Source presence records lineage; it does not establish scientific validity.", 9)
        for source in snapshots:
            write(f"{source.snapshot_id}: {source.source_identity} | {source.source_workspace} | {source.source_kind.value} | {source.resolution_status.value}", 9)
    if version.claims:
        y -= 8; write("Authored claims and lineage", 16)
        for claim in version.claims:
            write(f"{claim.claim_id} [{claim.lineage_state.value}]: {_text(claim.claim_text or claim.span_identity)}", 9)
    canvas.save()
    return output.getvalue()


class PdfOutputStore:
    def __init__(self, root: Path): self.root = root.resolve()

    @staticmethod
    def identity(artifact_id: str, version_id: str, projection_id: str) -> str:
        seed = "\0".join((artifact_id, version_id, projection_id, MATERIALIZER_VERSION)).encode()
        return f"studio-pdf:{hashlib.sha256(seed).hexdigest()}"

    def _relative(self, identity: str) -> str:
        digest = identity.removeprefix("studio-pdf:")
        if not re.fullmatch(r"[0-9a-f]{64}", digest): raise ValueError("Invalid output identity")
        return f"pdf/{digest[:2]}/{digest}.pdf"

    def path_for_location(self, location: str) -> Path:
        if not re.fullmatch(r"pdf/[0-9a-f]{2}/[0-9a-f]{64}\.pdf", location): raise ValueError("Invalid output location")
        path = (self.root / location).resolve()
        if self.root != path and self.root not in path.parents: raise ValueError("Output escaped storage root")
        return path

    def store(self, identity: str, content: bytes) -> StoredPdf:
        location = self._relative(identity); destination = self.path_for_location(location)
        digest = f"sha256:{hashlib.sha256(content).hexdigest()}"
        if destination.exists():
            if hashlib.sha256(destination.read_bytes()).hexdigest() != digest.removeprefix("sha256:"):
                raise OSError("Canonical PDF identity conflicts with stored bytes")
            return StoredPdf(identity, location, digest, destination, False)
        destination.parent.mkdir(parents=True, exist_ok=True)
        fd, temporary = tempfile.mkstemp(prefix=".studio-pdf-", suffix=".tmp", dir=destination.parent)
        try:
            with os.fdopen(fd, "wb") as stream:
                stream.write(content); stream.flush(); os.fsync(stream.fileno())
            os.replace(temporary, destination)
        except Exception:
            try: os.unlink(temporary)
            except FileNotFoundError: pass
            raise
        return StoredPdf(identity, location, digest, destination, True)
