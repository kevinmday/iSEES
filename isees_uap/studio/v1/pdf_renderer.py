"""Deterministic, non-networked ReportLab renderer for Studio V1 render models."""
from __future__ import annotations

from datetime import datetime
from io import BytesIO
from pathlib import Path
from types import SimpleNamespace

from reportlab.lib import colors
from reportlab.lib.enums import TA_CENTER
from reportlab.lib.pagesizes import LETTER
from reportlab.lib.styles import ParagraphStyle, getSampleStyleSheet
from reportlab.lib.units import inch
from reportlab.pdfbase import pdfmetrics
from reportlab.pdfbase.pdfdoc import PDFDate
from reportlab.pdfbase.ttfonts import TTFont
from reportlab.platypus import BaseDocTemplate, Frame, PageTemplate, Paragraph, Spacer, Table, TableStyle
from xml.sax.saxutils import escape

from .render_model import RenderDocument, RenderModelFailure, RenderModelFailureCode

RENDERER_VERSION = "studio-v1-reportlab-pdf/1"
TEMPLATE_VERSION = "investigation-report-pdf/1"
MEDIA_TYPE = "application/pdf"
CONFIGURATION_HASH = "sha256:6d1e0783d1fe839271f281ee34b7355a618291c6e31b1282cfc170e297dab200"
FONT_NAME = "DejaVuSans-Governed"
FONT_PATH = Path(__file__).with_name("fonts") / "DejaVuSans.ttf"
_FONT = TTFont(FONT_NAME, str(FONT_PATH))
pdfmetrics.registerFont(_FONT)
_SUPPORTED_CODEPOINTS = frozenset(_FONT.face.charToGlyph)


def _safe_pdf_text(value: str, source_kind: str) -> str:
    unsupported = next((character for character in value
                        if character not in "\n\r\t" and ord(character) not in _SUPPORTED_CODEPOINTS), None)
    if unsupported is not None:
        subject = "Current draft content" if source_kind == "CURRENT_DRAFT" else "Saved revision content"
        raise RenderModelFailure(RenderModelFailureCode.UNSUPPORTED_CONTENT,
                                 f"{subject} contains glyphs unsupported by the governed PDF font.")
    return escape(value).replace("\n", "<br/>")


def render_pdf(model: RenderDocument, exported_at: str) -> bytes:
    when = datetime.fromisoformat(exported_at.replace("Z", "+00:00"))
    _safe_pdf_text(model.title, model.source_kind)
    buffer = BytesIO()
    doc = BaseDocTemplate(buffer, pagesize=LETTER, leftMargin=.75*inch, rightMargin=.75*inch,
                          topMargin=.75*inch, bottomMargin=.7*inch,
                          title=model.title, author=model.author_principal_id or "iSEES Studio guest",
                          subject=(f"Studio V1 revision {model.revision_id}" if model.source_kind == "SAVED_REVISION" else "Studio V1 LOCAL DRAFT — Not an authority record"), creator=RENDERER_VERSION,
                          invariant=True, pageCompression=1)
    styles = getSampleStyleSheet()
    for style in styles.byName.values():
        style.fontName = FONT_NAME
    styles.add(ParagraphStyle(name="StudioTitle", parent=styles["Title"], alignment=TA_CENTER, spaceAfter=18))
    styles.add(ParagraphStyle(name="StudioNote", parent=styles["BodyText"], leftIndent=12,
                              borderColor=colors.grey, borderWidth=.5, borderPadding=6, spaceAfter=8))
    styles.add(ParagraphStyle(name="StudioSmall", parent=styles["BodyText"], fontSize=8, leading=10))

    def page(canvas, _doc):
        canvas.saveState()
        canvas.setTitle(model.title); canvas.setAuthor(model.author_principal_id or "iSEES Studio guest")
        canvas.setCreator(RENDERER_VERSION); canvas.setSubject(f"Immutable revision {model.revision_id}" if model.source_kind == "SAVED_REVISION" else "LOCAL DRAFT — Not an authority record")
        info = canvas._doc.info
        timestamp = SimpleNamespace(YMDhms=(when.year, when.month, when.day, when.hour, when.minute, when.second), dhh=0, dmm=0)
        info.creationDate = PDFDate(timestamp); info.modDate = PDFDate(timestamp)
        canvas.setFont(FONT_NAME, 7)
        footer = (f"Revision {model.revision_number} · {model.revision_id}" if model.source_kind == "SAVED_REVISION"
                  else "LOCAL DRAFT · Not an authority record")
        canvas.drawString(.75*inch, .35*inch, footer)
        canvas.drawRightString(7.75*inch, .35*inch, f"{model.content_hash} · Page {canvas.getPageNumber()}")
        canvas.restoreState()

    doc.addPageTemplates(PageTemplate("governed", [Frame(doc.leftMargin, doc.bottomMargin,
        doc.width, doc.height, id="body")], onPage=page))
    def safe(value: str) -> str:
        return _safe_pdf_text(value, model.source_kind)

    story = [Paragraph(safe(model.title), styles["StudioTitle"])]
    if model.source_kind == "CURRENT_DRAFT":
        story += [Paragraph("LOCAL DRAFT", styles["Heading1"]),
                  Paragraph("CURRENT DRAFT", styles["Heading2"]),
                  Paragraph("Not an authority record", styles["StudioNote"])]
    for block in model.blocks:
        text = safe(block.text)
        if block.kind == "HEADING": style = styles[f"Heading{min(block.level or 1, 6)}"]
        elif block.kind in {"SECTION", "APPENDIX"}: style = styles["Heading2"]
        elif block.kind in {"RESEARCHER_NOTE", "CLAIM", "QUOTATION", "FOOTNOTE", "EQUATION", "FIGURE"}: style = styles["StudioNote"]
        else: style = styles["BodyText"]
        story.append(Paragraph(text, style))
        if block.placeholder_reason:
            story.append(Paragraph(f"[{safe(block.kind)} placeholder: {safe(block.placeholder_reason)}]", styles["StudioSmall"]))
        if block.provenance:
            story.append(Paragraph("Provenance: " + safe(", ".join(block.provenance)), styles["StudioSmall"]))
        if block.kind == "TABLE":
            data = [[Paragraph(safe(x), styles["StudioSmall"]) for x in block.columns]] + [
                [Paragraph(safe(x), styles["StudioSmall"]) for x in row] for row in block.rows]
            table = Table(data, repeatRows=1, hAlign="LEFT")
            table.setStyle(TableStyle([("GRID",(0,0),(-1,-1),.25,colors.grey),
                ("BACKGROUND",(0,0),(-1,0),colors.lightgrey), ("VALIGN",(0,0),(-1,-1),"TOP")]))
            story.append(table)
        story.append(Spacer(1, 6))
    identity = ([Paragraph(safe(f"Artifact: {model.artifact_id}"), styles["BodyText"]),
                 Paragraph(safe(f"Revision: {model.revision_id} (r{model.revision_number:04d})"), styles["BodyText"])]
                if model.source_kind == "SAVED_REVISION" else
                [Paragraph(safe(f"Document: {model.document_id}"), styles["BodyText"]),
                 Paragraph("Authority: LOCAL DRAFT — Not an authority record", styles["BodyText"])])
    story += [Paragraph("Provenance", styles["Heading1"]), *identity,
        *([Paragraph(safe(f"Investigation: {model.investigation_id}"), styles["BodyText"])] if model.investigation_id else []),
        Paragraph(safe(f"Source hash: {model.content_hash}"), styles["BodyText"]),
        Paragraph(safe(f"Profile: {model.profile} · {model.profile_version}"), styles["BodyText"]),
        Paragraph(safe(f"Exported: {exported_at} · Renderer: {RENDERER_VERSION}"), styles["BodyText"])]
    if model.snapshot_references:
        story.append(Paragraph("Frozen snapshots: " + safe(", ".join(f"{i} ({h})" for i,h in model.snapshot_references)), styles["StudioSmall"]))
    if model.citations:
        story.append(Paragraph("Citations", styles["Heading1"]))
        for c in model.citations:
            bits = [", ".join(c.authors), c.title, c.issued or "", c.publisher or "", c.url or "", f"snapshot {c.source_snapshot_id}"]
            story.append(Paragraph(safe(". ".join(x for x in bits if x)), styles["BodyText"]))
    doc.build(story)
    data = buffer.getvalue()
    if b"/JavaScript" in data or b"/Launch" in data or b"/EmbeddedFile" in data:
        raise RenderModelFailure(RenderModelFailureCode.UNSUPPORTED_CONTENT, "Generated PDF contains prohibited active content.")
    return data
