from __future__ import annotations
import hashlib
import json

def canonical_serialize(value: object) -> str:
    """RFC-8259 subset: UTF-8, sorted object keys, compact separators, preserved arrays."""
    return json.dumps(value, ensure_ascii=False, allow_nan=False, sort_keys=True, separators=(",", ":"))

def canonical_sha256(value: object) -> str:
    return "sha256:" + hashlib.sha256(canonical_serialize(value).encode("utf-8")).hexdigest()
