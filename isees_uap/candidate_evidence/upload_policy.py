from __future__ import annotations

import codecs
import re
import unicodedata
from dataclasses import dataclass
from pathlib import Path

from .blob_storage import CHUNK_SIZE, StagedBlob
from .errors import UnsupportedUpload


@dataclass(frozen=True)
class MediaPolicy:
    category: str
    media_type: str
    extensions: frozenset[str]
    claimed_types: frozenset[str]


POLICIES = {
    "PDF": MediaPolicy("PDF", "application/pdf", frozenset({".pdf"}), frozenset({"application/pdf"})),
    "PLAIN_TEXT": MediaPolicy("PLAIN_TEXT", "text/plain", frozenset({".txt"}), frozenset({"text/plain"})),
    "PNG": MediaPolicy("PNG", "image/png", frozenset({".png"}), frozenset({"image/png"})),
    "JPEG": MediaPolicy("JPEG", "image/jpeg", frozenset({".jpg", ".jpeg"}), frozenset({"image/jpeg", "image/jpg"})),
    "WEBP": MediaPolicy("WEBP", "image/webp", frozenset({".webp"}), frozenset({"image/webp"})),
    "MP3": MediaPolicy("MP3", "audio/mpeg", frozenset({".mp3"}), frozenset({"audio/mpeg", "audio/mp3"})),
    "WAV": MediaPolicy("WAV", "audio/wav", frozenset({".wav"}), frozenset({"audio/wav", "audio/x-wav", "audio/wave"})),
    "M4A": MediaPolicy("M4A", "audio/mp4", frozenset({".m4a"}), frozenset({"audio/mp4", "audio/x-m4a"})),
    "MP4": MediaPolicy("MP4", "video/mp4", frozenset({".mp4"}), frozenset({"video/mp4"})),
    "WEBM": MediaPolicy("WEBM", "video/webm", frozenset({".webm"}), frozenset({"video/webm"})),
    "MOV": MediaPolicy("MOV", "video/quicktime", frozenset({".mov"}), frozenset({"video/quicktime"})),
}
ACTIVE_EXTENSIONS = frozenset({".bat", ".cmd", ".com", ".exe", ".hta", ".htm", ".html", ".js", ".mjs", ".ps1", ".sh", ".svg", ".vbs", ".xhtml"})


def sanitize_display_filename(value: str | None) -> tuple[str, str]:
    original = unicodedata.normalize("NFKC", value or "upload")
    leaf = original.replace("\\", "/").rsplit("/", 1)[-1]
    leaf = "".join(character for character in leaf if character >= " " and character != "\x7f")
    leaf = re.sub(r"[^A-Za-z0-9._() -]+", "_", leaf).strip(" .")
    return original[:500], (leaf[:240] or "upload")


def validate_media(staged: StagedBlob, *, filename: str | None, claimed_type: str | None) -> MediaPolicy:
    original, display = sanitize_display_filename(filename)
    del original
    extension = Path(display).suffix.lower()
    if extension in ACTIVE_EXTENSIONS:
        raise UnsupportedUpload("Executable or active-content filenames are not supported")
    detected = _detect(staged)
    policy = POLICIES.get(detected)
    if policy is None:
        raise UnsupportedUpload("File content is unsupported or ambiguous")
    if extension not in policy.extensions:
        raise UnsupportedUpload("Filename extension does not match the detected file content")
    declared = (claimed_type or "").split(";", 1)[0].strip().lower()
    if declared not in policy.claimed_types:
        raise UnsupportedUpload("Browser-declared media type does not match the detected file content")
    return policy


def _detect(staged: StagedBlob) -> str | None:
    value = staged.prefix
    if value.startswith(b"%PDF-"):
        return "PDF"
    if value.startswith(b"\x89PNG\r\n\x1a\n"):
        return "PNG"
    if value.startswith(b"\xff\xd8\xff"):
        return "JPEG"
    if len(value) >= 12 and value[:4] == b"RIFF" and value[8:12] == b"WEBP":
        return "WEBP"
    if len(value) >= 12 and value[:4] == b"RIFF" and value[8:12] == b"WAVE":
        return "WAV"
    if value.startswith(b"ID3") or (len(value) >= 2 and value[0] == 0xff and value[1] & 0xe0 == 0xe0):
        return "MP3"
    if value.startswith(b"\x1a\x45\xdf\xa3") and b"webm" in value[:256].lower():
        return "WEBM"
    if len(value) >= 12 and value[4:8] == b"ftyp":
        brand = value[8:12]
        if brand in {b"M4A ", b"M4B ", b"M4P "}:
            return "M4A"
        if brand == b"qt  ":
            return "MOV"
        if brand in {b"avc1", b"dash", b"iso2", b"iso3", b"iso4", b"iso5", b"iso6", b"isom", b"mp41", b"mp42", b"MSNV"}:
            return "MP4"
        return None
    return "PLAIN_TEXT" if _is_plain_text(staged.path) else None


def _is_plain_text(path: Path) -> bool:
    decoder = codecs.getincrementaldecoder("utf-8")("strict")
    prefix = ""
    try:
        with path.open("rb") as stream:
            while True:
                chunk = stream.read(CHUNK_SIZE)
                if not chunk:
                    break
                text = decoder.decode(chunk)
                if len(prefix) < 8192:
                    prefix += text[:8192 - len(prefix)]
                if any((ord(character) < 32 and character not in "\t\n\r") or character == "\x7f" for character in text):
                    return False
            decoder.decode(b"", final=True)
        active = re.compile(r"^\s*(?:<!doctype\s+html|<html\b|<script\b|<svg\b|<\?xml\b)", re.IGNORECASE)
        return active.search(prefix) is None
    except UnicodeDecodeError:
        return False
