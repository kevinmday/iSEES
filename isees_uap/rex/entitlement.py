from __future__ import annotations

from datetime import datetime
from typing import Protocol

from .canonical import canonical_hash
from .contracts import (EntitlementSnapshot, EntitlementSnapshotId, ModelClass,
                        SourceClass)


class EntitlementProvider(Protocol):
    def snapshot(self, *, subject_id: str, at: datetime) -> EntitlementSnapshot: ...


class DevelopmentFixtureEntitlementProvider:
    def __init__(self, *, snapshot_id: EntitlementSnapshotId, valid_from: datetime,
                 valid_until: datetime, issued_at: datetime, maximum_executions: int = 4):
        self._values = dict(snapshot_id=snapshot_id, scope=("REX",),
            persistent_assignments_allowed=True, external_execution_allowed=False,
            ai_assistance_allowed=False, premium_sources_allowed=False,
            maximum_active_assignments=1, maximum_executions_per_period=maximum_executions,
            period_seconds=86400, maximum_cost_per_execution_micros=0,
            maximum_cost_per_period_micros=0, maximum_recursion_depth=1,
            allowed_source_classes=(SourceClass.LOCAL_FIXTURE,),
            allowed_model_classes=(ModelClass.NONE,), valid_from=valid_from,
            valid_until=valid_until, policy_version="rex-development-fixture/v1",
            suspended=False, suspension_reason=None, issued_at=issued_at)

    def snapshot(self, *, subject_id: str, at: datetime) -> EntitlementSnapshot:
        values = self._values | {"subject_id":subject_id}
        return EntitlementSnapshot(**values, content_hash=canonical_hash(values))
