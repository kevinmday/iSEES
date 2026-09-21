"""Private durable storage for completed Studio V1 exports."""
from __future__ import annotations

import hashlib
import os
from pathlib import Path
import tempfile

MAX_PDF_BYTES = 25 * 1024 * 1024


class OutputStoreFailure(RuntimeError): pass


class StudioOutputStore:
    def __init__(self, root: Path):
        self.root = Path(root).resolve()
        self.root.mkdir(parents=True, exist_ok=True)

    @staticmethod
    def storage_key(export_id: str, output_hash: str) -> str:
        digest = output_hash.removeprefix("sha256:")
        if not all(c in "0123456789abcdef" for c in digest) or len(digest) != 64:
            raise OutputStoreFailure("Output hash is invalid.")
        safe_id = hashlib.sha256(export_id.encode("utf-8")).hexdigest()[:24]
        return f"pdf/{digest[:2]}/{safe_id}-{digest}.pdf"

    def _path(self, key: str) -> Path:
        if not key or "\\" in key or key.startswith("/") or any(x in {"", ".", ".."} for x in key.split("/")):
            raise OutputStoreFailure("Output storage identity is invalid.")
        path = (self.root / Path(*key.split("/"))).resolve()
        if self.root not in path.parents:
            raise OutputStoreFailure("Output storage identity is invalid.")
        return path

    def write(self, export_id: str, data: bytes) -> tuple[str, str, int]:
        if not data or len(data) > MAX_PDF_BYTES:
            raise OutputStoreFailure("Rendered output exceeds the storage limit.")
        output_hash = "sha256:" + hashlib.sha256(data).hexdigest()
        key, path = self.storage_key(export_id, output_hash), None
        path = self._path(key); path.parent.mkdir(parents=True, exist_ok=True)
        fd, temporary = tempfile.mkstemp(prefix=".studio-v1-", suffix=".tmp", dir=path.parent)
        try:
            with os.fdopen(fd, "wb") as stream:
                stream.write(data); stream.flush(); os.fsync(stream.fileno())
            os.replace(temporary, path)
        except Exception:
            try: os.unlink(temporary)
            except FileNotFoundError: pass
            raise
        return key, output_hash, len(data)

    def read_verified(self, key: str, expected_hash: str, expected_length: int) -> bytes:
        data = self._path(key).read_bytes()
        actual = "sha256:" + hashlib.sha256(data).hexdigest()
        if len(data) != expected_length or actual != expected_hash:
            raise OutputStoreFailure("Stored output integrity verification failed.")
        return data
