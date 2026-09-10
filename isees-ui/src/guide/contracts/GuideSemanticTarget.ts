export const GUIDE_SEMANTIC_TARGET_SCHEMA_ID = "isees-guide-semantic-target" as const;
export const GUIDE_SEMANTIC_TARGET_SCHEMA_VERSION = "1.0" as const;

/** Stable identifiers are registry keys, never DOM coordinates or display text. */
export type GuideSemanticTargetId = string;

export interface GuideSemanticTarget {
  readonly schemaId: typeof GUIDE_SEMANTIC_TARGET_SCHEMA_ID;
  readonly schemaVersion: typeof GUIDE_SEMANTIC_TARGET_SCHEMA_VERSION;
  readonly id: GuideSemanticTargetId;
  readonly accessibleName: string;
  readonly description: string;
}

export const GuideTargetResolutionStatus = {
  LOCATED: "LOCATED",
  MISSING: "MISSING",
} as const;

export type GuideTargetResolutionStatus =
  typeof GuideTargetResolutionStatus[keyof typeof GuideTargetResolutionStatus];

export type GuideTargetResolution =
  | Readonly<{
      status: typeof GuideTargetResolutionStatus.LOCATED;
      targetId: GuideSemanticTargetId;
    }>
  | Readonly<{
      status: typeof GuideTargetResolutionStatus.MISSING;
      targetId: GuideSemanticTargetId;
      message: string;
      workflowRemainsAvailable: true;
    }>;

export const GuideSemanticTargetIds = {
  GUIDE: "shell.guide",
  CAPTURE: "shell.capture",
  LAYERS_RESOLVE_TOPOLOGY_STATE: "layers.layer.resolve-topology-state",
  LAYERS_RUN_EXPERIMENT: "layers.run-experiment",
  RESOLVE_RUN_EXECUTION: "manifold.resolve.run-execution",
} as const satisfies Readonly<Record<string, GuideSemanticTargetId>>;

export function missingGuideTarget(
  targetId: GuideSemanticTargetId,
  message = "This visual target is unavailable. Continue using the underlying workflow or follow the textual guidance.",
): GuideTargetResolution {
  return Object.freeze({
    status: GuideTargetResolutionStatus.MISSING,
    targetId,
    message,
    workflowRemainsAvailable: true,
  });
}
