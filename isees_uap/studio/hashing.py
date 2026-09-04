from __future__ import annotations

import hashlib
import json
import math
from dataclasses import fields, is_dataclass
from datetime import datetime, timezone
from enum import Enum
from typing import Any, Mapping


def _normalize(value: Any) -> Any:
    if isinstance(value, datetime):
        if value.tzinfo is None or value.utcoffset() is None:
            raise ValueError("timestamps must be timezone-aware")
        utc = value.astimezone(timezone.utc)
        text = utc.isoformat(timespec="microseconds").replace("+00:00", "Z")
        return text
    if isinstance(value, Enum):
        return value.value
    if is_dataclass(value):
        return {item.name: _normalize(getattr(value, item.name)) for item in fields(value)}
    if isinstance(value, Mapping):
        if any(not isinstance(key, str) for key in value):
            raise TypeError("canonical JSON object keys must be strings")
        return {key: _normalize(item) for key, item in value.items()}
    if isinstance(value, (list, tuple)):
        return [_normalize(item) for item in value]
    if isinstance(value, float) and not math.isfinite(value):
        raise ValueError("non-finite numbers are not canonical JSON")
    if value is None or isinstance(value, (str, int, float, bool)):
        return value
    raise TypeError(f"unsupported canonical JSON value: {type(value).__name__}")


def canonical_json(value: Any) -> str:
    return json.dumps(
        _normalize(value), ensure_ascii=False, allow_nan=False, sort_keys=True,
        separators=(",", ":"),
    )


def canonical_hash(value: Any) -> str:
    digest = hashlib.sha256(canonical_json(value).encode("utf-8")).hexdigest()
    return f"sha256:{digest}"


def snapshot_hash_fields(snapshot: Any) -> dict[str, Any]:
    return {
        "snapshotId": snapshot.snapshot_id,
        "sourceIdentity": snapshot.source_identity,
        "sourceInvestigationId": snapshot.source_investigation_id,
        "sourceWorkspace": snapshot.source_workspace,
        "sourceKind": snapshot.source_kind.value,
        "classification": snapshot.classification.value,
        "sourceRevisionId": snapshot.source_revision_id,
        "sourceExecutionId": snapshot.source_execution_id,
        "sourceProjectionId": snapshot.source_projection_id,
        "capturedAt": snapshot.captured_at,
        "representationSchemaVersion": snapshot.representation_schema_version,
        "mediaType": snapshot.media_type,
        "capturedRepresentation": snapshot.captured_representation,
    }


def hash_snapshot(snapshot: Any) -> str:
    return canonical_hash(snapshot_hash_fields(snapshot))
