# ============================================================
# runtime_registry.py
# RUNTIME COGNITION REGISTRY
# ============================================================

"""
Tracks active runtime cognition states.

Responsibilities:
- register runtime cognition states
- retrieve runtime states
- enforce cognition domain boundaries
- validate domain transfers
- maintain active operator cognition contexts

This registry manages LIVE cognition runtime state.

It does NOT mutate immutable epistemic snapshots.
"""

from __future__ import annotations

from datetime import datetime, UTC
from typing import Dict, List, Optional

from isees_uap.epistemic.runtime.runtime_state import (
    CognitionDomain,
    DomainTransfer,
    RuntimeCognitionState,
)


# ============================================================
# DOMAIN TRANSFER RULES
# ============================================================

ALLOWED_DOMAIN_TRANSFERS = {

    # --------------------------------------------------------
    # LIVE DOMAIN
    # --------------------------------------------------------

    (
        CognitionDomain.LIVE,
        CognitionDomain.REPLAY
    ): True,

    (
        CognitionDomain.LIVE,
        CognitionDomain.TRAINING
    ): True,

    (
        CognitionDomain.LIVE,
        CognitionDomain.RED_TEAM
    ): True,

    # --------------------------------------------------------
    # REPLAY DOMAIN
    # --------------------------------------------------------

    (
        CognitionDomain.REPLAY,
        CognitionDomain.LIVE
    ): False,

    (
        CognitionDomain.REPLAY,
        CognitionDomain.TRAINING
    ): True,

    # --------------------------------------------------------
    # TRAINING DOMAIN
    # --------------------------------------------------------

    (
        CognitionDomain.TRAINING,
        CognitionDomain.LIVE
    ): False,

    # --------------------------------------------------------
    # ENTANGLEMENT DOMAIN
    # --------------------------------------------------------

    (
        CognitionDomain.ENTANGLEMENT,
        CognitionDomain.LIVE
    ): False,

    (
        CognitionDomain.ENTANGLEMENT,
        CognitionDomain.REPLAY
    ): False,

    # --------------------------------------------------------
    # DEFAULT SAME-DOMAIN
    # --------------------------------------------------------

    (
        CognitionDomain.LIVE,
        CognitionDomain.LIVE
    ): True,

    (
        CognitionDomain.REPLAY,
        CognitionDomain.REPLAY
    ): True,

    (
        CognitionDomain.TRAINING,
        CognitionDomain.TRAINING
    ): True,
}


# ============================================================
# RUNTIME REGISTRY
# ============================================================

class RuntimeRegistry:
    """
    Canonical cognition runtime registry.

    Maintains active mutable cognition runtime state.
    """

    def __init__(self):

        self._runtimes: Dict[
            str,
            RuntimeCognitionState
        ] = {}

    # ========================================================
    # REGISTER
    # ========================================================

    def register(
        self,
        runtime: RuntimeCognitionState
    ) -> None:

        runtime.updated_at = datetime.now(UTC)

        self._runtimes[
            runtime.runtime_id
        ] = runtime

    # ========================================================
    # GET RUNTIME
    # ========================================================

    def get(
        self,
        runtime_id: str
    ) -> Optional[RuntimeCognitionState]:

        return self._runtimes.get(runtime_id)

    # ========================================================
    # REMOVE RUNTIME
    # ========================================================

    def remove(
        self,
        runtime_id: str
    ) -> bool:

        if runtime_id in self._runtimes:

            del self._runtimes[runtime_id]

            return True

        return False

    # ========================================================
    # LIST RUNTIMES
    # ========================================================

    def list_all(
        self
    ) -> List[RuntimeCognitionState]:

        return list(self._runtimes.values())

    # ========================================================
    # LIST BY DOMAIN
    # ========================================================

    def list_by_domain(
        self,
        domain: CognitionDomain
    ) -> List[RuntimeCognitionState]:

        return [

            runtime

            for runtime
            in self._runtimes.values()

            if runtime.active_domain == domain
        ]

    # ========================================================
    # LIST BY OPERATOR
    # ========================================================

    def list_by_operator(
        self,
        operator_id: str
    ) -> List[RuntimeCognitionState]:

        return [

            runtime

            for runtime
            in self._runtimes.values()

            if runtime.operator_id == operator_id
        ]

    # ========================================================
    # VALIDATE DOMAIN TRANSFER
    # ========================================================

    def validate_transfer(
        self,
        source_domain: CognitionDomain,
        target_domain: CognitionDomain
    ) -> bool:

        return ALLOWED_DOMAIN_TRANSFERS.get(

            (
                source_domain,
                target_domain
            ),

            False
        )

    # ========================================================
    # TRANSFER DOMAIN
    # ========================================================

    def transfer_domain(
        self,
        runtime_id: str,
        target_domain: CognitionDomain,
        transferred_by: str = "",
        transfer_reason: str = ""
    ) -> bool:

        runtime = self.get(runtime_id)

        if not runtime:
            return False

        source_domain = runtime.active_domain

        allowed = self.validate_transfer(
            source_domain,
            target_domain
        )

        if not allowed:

            runtime.contamination_state \
                .boundary_violations.append(

                    (
                        f"Blocked transfer: "
                        f"{source_domain} -> "
                        f"{target_domain}"
                    )
                )

            runtime.contamination_state \
                .contamination_detected = True

            return False

        # ----------------------------------------------------
        # TRACK TRANSFER
        # ----------------------------------------------------

        transfer = DomainTransfer(

            source_domain=source_domain,

            target_domain=target_domain,

            approved=True,

            transferred_by=transferred_by,

            transfer_reason=transfer_reason,
        )

        runtime.domain_transfers.append(
            transfer
        )

        # ----------------------------------------------------
        # APPLY DOMAIN
        # ----------------------------------------------------

        runtime.active_domain = target_domain

        runtime.updated_at = datetime.now(UTC)

        return True


# ============================================================
# GLOBAL RUNTIME REGISTRY
# ============================================================

runtime_registry = RuntimeRegistry()


# ============================================================
# DEVELOPMENT TEST
# ============================================================

if __name__ == "__main__":

    from isees_uap.epistemic.runtime.runtime_state import (
        RuntimeCognitionState
    )

    runtime = RuntimeCognitionState(

        runtime_id="runtime-001",

        operator_id="kday",

        active_domain=CognitionDomain.LIVE,
    )

    runtime_registry.register(runtime)

    print("\n================================================")
    print("RUNTIME REGISTRY TEST")
    print("================================================\n")

    print(runtime_registry.list_all())

    print("\n")

    success = runtime_registry.transfer_domain(

        runtime_id="runtime-001",

        target_domain=CognitionDomain.REPLAY,

        transferred_by="operator",

        transfer_reason="Historical replay analysis"
    )

    print(f"Transfer success: {success}")

    print("\n")

    print(runtime_registry.get("runtime-001"))