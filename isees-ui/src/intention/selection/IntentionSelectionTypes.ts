import type { IntentionMetricDerivation, IntentionProjectedLink, IntentionProjectedNode } from "../projection";

export const IntentionSelectionKind = Object.freeze({
  NONE: "NONE",
  INTENTION_PROJECTED_NODE: "INTENTION_PROJECTED_NODE",
  INTENTION_PROJECTED_LINK: "INTENTION_PROJECTED_LINK",
  INTENTION_METRIC_DERIVATION: "INTENTION_METRIC_DERIVATION",
} as const);

interface IntentionSelectionLineage {
  readonly investigationId: string;
  readonly operationalRevisionId: string;
  readonly intentionExecutionId: string;
  readonly projectionId: string;
  readonly modelId: string;
  readonly modelVersion: string;
  readonly configurationId: string;
  readonly resolveExecutionId?: string;
  readonly candidateId?: string;
  readonly evaluationId?: string;
}

export interface IntentionNoneSelection { readonly kind: typeof IntentionSelectionKind.NONE; }
export interface IntentionNodeSelection extends IntentionSelectionLineage { readonly kind: typeof IntentionSelectionKind.INTENTION_PROJECTED_NODE; readonly projectedNodeId: string; }
export interface IntentionLinkSelection extends IntentionSelectionLineage { readonly kind: typeof IntentionSelectionKind.INTENTION_PROJECTED_LINK; readonly projectedLinkId: string; }
export interface IntentionDerivationSelection extends IntentionSelectionLineage { readonly kind: typeof IntentionSelectionKind.INTENTION_METRIC_DERIVATION; readonly derivationId: string; }
export type IntentionSelection = IntentionNoneSelection | IntentionNodeSelection | IntentionLinkSelection | IntentionDerivationSelection;

export type ResolvedIntentionSelection =
  | { readonly kind: typeof IntentionSelectionKind.NONE }
  | { readonly kind: typeof IntentionSelectionKind.INTENTION_PROJECTED_NODE; readonly node: IntentionProjectedNode }
  | { readonly kind: typeof IntentionSelectionKind.INTENTION_PROJECTED_LINK; readonly link: IntentionProjectedLink }
  | { readonly kind: typeof IntentionSelectionKind.INTENTION_METRIC_DERIVATION; readonly derivation: IntentionMetricDerivation };
