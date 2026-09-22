import { RUNNING_FRONTEND_CONTRACT, SUPPORTED_BACKEND_CONTRACTS, SUPPORTED_FRONTEND_CONTRACTS, type SystemIdentity } from "./SystemIdentity.ts";

export type CompatibilityResult = "COMPATIBLE" | "INCOMPATIBLE" | "UNKNOWN";

const contract = (value: unknown): value is string => typeof value === "string" && /^[a-z][a-z0-9-]*\/[a-z0-9.-]+$/.test(value);

export function resolveSystemCompatibility(
  identity: Pick<SystemIdentity, "frontendContract" | "backendContract"> | null | undefined,
  runningFrontendContract: string = RUNNING_FRONTEND_CONTRACT,
): CompatibilityResult {
  if (!identity || !contract(runningFrontendContract) || !contract(identity.frontendContract) || !contract(identity.backendContract)) return "UNKNOWN";
  if (!SUPPORTED_FRONTEND_CONTRACTS.includes(runningFrontendContract) || identity.frontendContract !== runningFrontendContract) return "INCOMPATIBLE";
  return SUPPORTED_BACKEND_CONTRACTS.includes(identity.backendContract) ? "COMPATIBLE" : "INCOMPATIBLE";
}
