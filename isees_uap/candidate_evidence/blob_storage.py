from __future__ import annotations

import hashlib
import os
import re
import tempfile
from dataclasses import dataclass
from pathlib import Path
from typing import BinaryIO, Protocol

from .errors import InvalidUpload, UploadTooLarge

CHUNK_SIZE = 64 * 1024
DEFAULT_MAX_UPLOAD_BYTES = 25 * 1024 * 1024


@dataclass(frozen=True)
class StagedBlob:
    path: Path
    byte_size: int
    sha256: str
    prefix: bytes


@dataclass(frozen=True)
class StoredBlob:
    object_reference: str
    byte_size: int
    sha256: str
    created: bool


class CandidateBlobStorage(Protocol):
    def stage(self, stream: BinaryIO, *, maximum_bytes: int) -> StagedBlob: ...
    def commit(self, staged: StagedBlob, *, scope_identity: str) -> StoredBlob: ...
    def get(self, object_reference: str) -> BinaryIO: ...
    def stat(self, object_reference: str) -> tuple[int, str]: ...
    def exists(self, object_reference: str) -> bool: ...
    def delete_for_cleanup(self, object_reference: str) -> None: ...
    def discard(self, staged: StagedBlob) -> None: ...


class LocalContentAddressedBlobStore:
    """Candidate Evidence storage authority; paths never cross the API boundary."""

    def __init__(self, root: str | Path):
        self.root = Path(root).resolve()
        self.staging = (self.root / ".staging").resolve()
        self.objects = (self.root / "sha256").resolve()
        for path in (self.staging, self.objects):
            if self.root != path and self.root not in path.parents:
                raise ValueError("Candidate Evidence blob path escaped its root")
            path.mkdir(parents=True, exist_ok=True)

    def stage(self, stream: BinaryIO, *, maximum_bytes: int) -> StagedBlob:
        fd, temporary = tempfile.mkstemp(prefix=".candidate-upload-", suffix=".tmp", dir=self.staging)
        digest = hashlib.sha256()
        size = 0
        prefix = bytearray()
        try:
            with os.fdopen(fd, "wb") as output:
                while True:
                    chunk = stream.read(CHUNK_SIZE)
                    if not chunk:
                        break
                    size += len(chunk)
                    if size > maximum_bytes:
                        raise UploadTooLarge(f"Upload exceeds the {maximum_bytes}-byte limit")
                    if len(prefix) < 8192:
                        prefix.extend(chunk[:8192 - len(prefix)])
                    digest.update(chunk)
                    output.write(chunk)
                if size == 0:
                    raise InvalidUpload("Upload file must not be empty")
                output.flush()
                os.fsync(output.fileno())
            return StagedBlob(Path(temporary), size, digest.hexdigest(), bytes(prefix))
        except Exception:
            try:
                os.unlink(temporary)
            except FileNotFoundError:
                pass
            raise

    def commit(self, staged: StagedBlob, *, scope_identity: str) -> StoredBlob:
        scope = hashlib.sha256(scope_identity.encode("utf-8")).hexdigest()
        destination = self._path(scope, staged.sha256)
        destination.parent.mkdir(parents=True, exist_ok=True)
        if destination.exists():
            if self._digest(destination) != staged.sha256:
                raise OSError("Stored Candidate Evidence content failed integrity verification")
            staged.path.unlink(missing_ok=True)
            return StoredBlob(self._reference(scope, staged.sha256), staged.byte_size, staged.sha256, False)
        try:
            os.replace(staged.path, destination)
        except Exception:
            staged.path.unlink(missing_ok=True)
            raise
        if self._digest(destination) != staged.sha256:
            destination.unlink(missing_ok=True)
            raise OSError("Stored Candidate Evidence content failed integrity verification")
        return StoredBlob(self._reference(scope, staged.sha256), staged.byte_size, staged.sha256, True)

    def stat(self, object_reference: str) -> tuple[int, str]:
        scope, digest = self._parts_from_reference(object_reference)
        path = self._path(scope, digest)
        return path.stat().st_size, self._digest(path)

    def get(self, object_reference: str) -> BinaryIO:
        scope, digest = self._parts_from_reference(object_reference)
        return self._path(scope, digest).open("rb")

    def exists(self, object_reference: str) -> bool:
        scope, digest = self._parts_from_reference(object_reference)
        return self._path(scope, digest).is_file()

    def delete_for_cleanup(self, object_reference: str) -> None:
        scope, digest = self._parts_from_reference(object_reference)
        self._path(scope, digest).unlink(missing_ok=True)

    def discard(self, staged: StagedBlob) -> None:
        staged.path.unlink(missing_ok=True)

    def _path(self, scope: str, digest: str) -> Path:
        if not re.fullmatch(r"[0-9a-f]{64}", scope) or not re.fullmatch(r"[0-9a-f]{64}", digest):
            raise ValueError("Invalid Candidate Evidence content digest")
        path = (self.objects / scope / digest[:2] / digest).resolve()
        if self.root != path and self.root not in path.parents:
            raise ValueError("Candidate Evidence blob path escaped its root")
        return path

    @staticmethod
    def _reference(scope: str, digest: str) -> str:
        return f"candidate-content:{scope}:sha256:{digest}"

    @staticmethod
    def _parts_from_reference(reference: str) -> tuple[str, str]:
        match = re.fullmatch(r"candidate-content:([0-9a-f]{64}):sha256:([0-9a-f]{64})", reference)
        if not match:
            raise ValueError("Invalid Candidate Evidence object reference")
        return match.group(1), match.group(2)

    @staticmethod
    def _digest(path: Path) -> str:
        digest = hashlib.sha256()
        with path.open("rb") as stream:
            for chunk in iter(lambda: stream.read(CHUNK_SIZE), b""):
                digest.update(chunk)
        return digest.hexdigest()
