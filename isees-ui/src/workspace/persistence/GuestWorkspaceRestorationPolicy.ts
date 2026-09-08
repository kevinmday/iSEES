import type { OperatorIdentityState } from "../../identity/runtime/OperatorIdentityRuntimeTypes.ts";
import type { GuestWorkspaceSessionRestoreResult, GuestWorkspaceSessionSnapshot } from "./GuestWorkspaceSessionPersistenceTypes.ts";

export type GuestWorkspaceRestorationDecision =
  | { kind: "EMPTY" }
  | { kind: "RESTORE"; snapshot: GuestWorkspaceSessionSnapshot }
  | { kind: "RECOVER_CLEAN"; diagnostic: "OWNERSHIP_MISMATCH" | "INVALID_SNAPSHOT" };

export function decideGuestWorkspaceRestoration(
  result: GuestWorkspaceSessionRestoreResult,
  identity: OperatorIdentityState,
): GuestWorkspaceRestorationDecision {
  if (result.status === "EMPTY") return { kind: "EMPTY" };
  if (result.status === "INVALID") return { kind: "RECOVER_CLEAN", diagnostic: "INVALID_SNAPSHOT" };
  if (
    identity.status !== "READY" ||
    identity.persistence !== "SESSION" ||
    identity.identity?.kind !== "GUEST" ||
    identity.identity.operatorId !== result.snapshot.ownership.operatorId
  ) return { kind: "RECOVER_CLEAN", diagnostic: "OWNERSHIP_MISMATCH" };
  return { kind: "RESTORE", snapshot: result.snapshot };
}

export function guestIdentityFromValidatedSnapshot(
  result: GuestWorkspaceSessionRestoreResult,
) {
  return result.status === "RESTORED" ? { ...result.snapshot.ownership } : undefined;
}
