import type { GuideContextSnapshot, GuideDefinition, GuideResolution } from "../contracts/index.ts";
import { isLayersSnapshot, resolveLayersGuideDefinition, resolveNeutralGuideDefinition } from "./LayersGuideDefinitions.ts";

export function resolveGuideDefinition(snapshot: Readonly<GuideContextSnapshot>): GuideResolution {
  try {
    const definition: GuideDefinition = isLayersSnapshot(snapshot)
      ? resolveLayersGuideDefinition(snapshot)
      : resolveNeutralGuideDefinition(snapshot);
    return Object.freeze({ status: "RESOLVED", definition });
  } catch {
    return Object.freeze({ status: "FAILED_SAFE", message: "Contextual guidance is temporarily unavailable. The workspace remains available.", workflowRemainsAvailable: true });
  }
}
