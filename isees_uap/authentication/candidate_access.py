from __future__ import annotations

import re
from dataclasses import dataclass
from typing import Mapping

from .errors import InvalidAccountInput

MAX_APPROVED_TESTERS = 10
_EMAIL = re.compile(r"^[^\s@]+@[^\s@]+\.[^\s@]+$")


def normalize_email(email: str) -> str:
    normalized = email.strip().casefold()
    if len(normalized) > 254 or not _EMAIL.fullmatch(normalized):
        raise InvalidAccountInput("Account details are invalid")
    return normalized


@dataclass(frozen=True)
class CandidateAccessPolicy:
    enabled: bool = False
    approved_emails: frozenset[str] = frozenset()
    configuration_valid: bool = True

    @classmethod
    def from_environment(cls, environment: Mapping[str, str]) -> CandidateAccessPolicy:
        if environment.get("ISEES_CANDIDATE_ACCESS_MODE", "").strip().casefold() != "enabled":
            return cls()

        raw = environment.get("ISEES_APPROVED_TESTER_EMAILS")
        if raw is None:
            return cls(enabled=True, configuration_valid=False)

        approved: set[str] = set()
        try:
            entries = raw.split(",")
            if any(not entry.strip() for entry in entries):
                raise ValueError
            for entry in entries:
                normalized = normalize_email(entry)
                if normalized in approved:
                    raise ValueError
                approved.add(normalized)
                if len(approved) > MAX_APPROVED_TESTERS:
                    raise ValueError
        except (InvalidAccountInput, ValueError):
            return cls(enabled=True, configuration_valid=False)

        return cls(enabled=True, approved_emails=frozenset(approved))

    def permits_registration(self, email: str) -> bool:
        if not self.enabled:
            return True
        return self.configuration_valid and email in self.approved_emails
