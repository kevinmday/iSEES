from __future__ import annotations

from typing import Protocol

from .models import RecoveryDeliveryRecord


class RecoveryDelivery(Protocol):
    def deliver(self, record: RecoveryDeliveryRecord) -> None: ...


class RecordingRecoveryDelivery:
    """Deterministic test adapter. Never configure this as production delivery."""

    def __init__(self) -> None:
        self.records: list[RecoveryDeliveryRecord] = []

    def deliver(self, record: RecoveryDeliveryRecord) -> None:
        self.records.append(record)
