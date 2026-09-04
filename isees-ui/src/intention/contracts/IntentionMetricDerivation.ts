import type { IntentionAvailability, IntentionEpistemicClassification } from "./IntentionAvailability";

export interface IntentionDerivationInput { readonly id: string; readonly symbol: string; readonly value?: number | string | boolean; readonly sourcePath: string; readonly sourceKnowledgeIds: readonly string[]; readonly sourceRelationshipIds: readonly string[]; readonly availability: IntentionAvailability; readonly reason?: string; }
export interface IntentionMetricDerivation {
  readonly id: string; readonly metricId: string; readonly metricName: string; readonly symbol: string;
  readonly value?: number; readonly displayValue?: string; readonly units?: string; readonly availability: IntentionAvailability;
  readonly epistemicClassification: IntentionEpistemicClassification; readonly equationId: string; readonly inputs: readonly IntentionDerivationInput[];
  readonly normalizationDefinition?: string; readonly assumptions: readonly string[]; readonly unavailableInputs: readonly string[];
  readonly sourceKnowledgeIds: readonly string[]; readonly sourceRelationshipIds: readonly string[];
  readonly investigationId: string; readonly operationalRevisionId: string; readonly resolveExecutionId?: string;
  readonly intentionExecutionId: string; readonly modelId: string; readonly modelVersion: string; readonly configurationId: string;
  readonly projectedNodeId: string; readonly reason?: string;
}
