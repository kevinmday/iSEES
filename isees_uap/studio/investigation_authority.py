from __future__ import annotations

import sqlite3
from pathlib import Path

from .ports import AccessResult


class CandidateEvidenceInvestigationAuthority:
    """Read Investigation access from the canonical Candidate Evidence scope."""

    def __init__(self, path: str | Path):
        self.path = Path(path).expanduser().resolve()

    def resolve_access(self, *, principal_id: str, investigation_id: str) -> AccessResult:
        # mode=ro is intentional: authority resolution must never bootstrap or
        # migrate the canonical store, and a missing/unreadable store must fail.
        uri = f"{self.path.as_uri()}?mode=ro"
        with sqlite3.connect(uri, uri=True, timeout=5) as connection:
            row = connection.execute(
                "SELECT 1 FROM candidate_evidence "
                "WHERE investigation_id=? AND created_by_principal_id=? LIMIT 1",
                (investigation_id, principal_id),
            ).fetchone()
        return AccessResult(allowed=row is not None)
