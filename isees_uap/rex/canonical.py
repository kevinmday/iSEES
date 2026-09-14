from __future__ import annotations

import hashlib
import json
from dataclasses import fields, is_dataclass
from datetime import datetime, timezone
from enum import Enum
from typing import Any, Mapping


def _normalize(value: Any) -> Any:
    if isinstance(value, datetime):
        if value.tzinfo is None or value.utcoffset() is None:
            raise ValueError("timestamps must be timezone-aware")
        return value.astimezone(timezone.utc).isoformat(timespec="microseconds").replace("+00:00", "Z")
    if isinstance(value, Enum):
        return value.value
    if is_dataclass(value):
        return {field.name: _normalize(getattr(value, field.name)) for field in fields(value)}
    if isinstance(value, Mapping):
        if any(type(key) is not str for key in value):
            raise TypeError("canonical JSON object keys must be strings")
        return {key: _normalize(item) for key, item in value.items()}
    if isinstance(value, (tuple, list)):
        return [_normalize(item) for item in value]
    if isinstance(value, float):
        raise TypeError("floats are not permitted in REX canonical records")
    if value is None or type(value) in (str, int, bool):
        return value
    raise TypeError(f"unsupported canonical JSON value: {type(value).__name__}")


def canonical_bytes(value: Any) -> bytes:
    return json.dumps(_normalize(value), ensure_ascii=False, allow_nan=False,
                      sort_keys=True, separators=(",", ":")).encode("utf-8")


def canonical_hash(value: Any) -> str:
    return "sha256:" + hashlib.sha256(canonical_bytes(value)).hexdigest()
