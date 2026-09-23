export type MetricEpistemicClassification = "EXPERIMENTAL / DERIVED / NON-CANONICAL";

import type { EquationDocumentation } from "./EquationDocumentationTypes";

export type IntelligenceKind = "METRIC" | "TERM";
export type IntelligenceInclusionClassification = "INTERPRETIVE" | "EPISTEMIC_TERM" | "REFERENCE_ONLY";
export type IntelligenceMutationEffect = "NONE";

export interface IntelligenceDefinitionBase {
  readonly definitionId: string;
  readonly definitionVersion: string;
  readonly label: string;
  readonly intelligenceKind: IntelligenceKind;
  readonly semanticProducer: Readonly<{ id: string; version: string }>;
  readonly eligibleContexts: readonly string[];
  readonly briefing: Readonly<{ templateId: string; version: string; conciseTemplate: string }>;
  readonly whyItMatters: readonly string[];
  readonly inclusionClassification: IntelligenceInclusionClassification;
  readonly provenanceRequirements: readonly string[];
  readonly mathematicalDocumentation?: EquationDocumentation;
  readonly mathematicalDocumentationStatus: Readonly<{ status: "AVAILABLE" | "NOT_APPLICABLE" | "DEFERRED_UNAVAILABLE"; reason?: string }>;
  readonly mathematicsAuthorityIdentity?: string;
  readonly collectionEligible: boolean;
  readonly epistemicEffect: "CONTEXT_ONLY" | "DERIVED_NON_CANONICAL";
  readonly canonEffect: IntelligenceMutationEffect;
  readonly operationalGraphEffect: IntelligenceMutationEffect;
}

export interface MetricDefinition extends IntelligenceDefinitionBase {
  readonly intelligenceKind: "METRIC";
  readonly evaluatorLineage: Readonly<{ implementationReference: string; version: string }>;
}

export interface TermDefinition extends IntelligenceDefinitionBase {
  readonly intelligenceKind: "TERM";
  readonly evaluatorLineage?: never;
}

export type IntelligenceDefinition = MetricDefinition | TermDefinition;

export interface MetricIntelligenceDefinition extends MetricDefinition {
  readonly metricId: string;
  readonly label: string;
  readonly unit: "PERCENT";
  readonly semanticKind: "TOPOLOGY_SIMILARITY";
  readonly evaluator: Readonly<{ key: string; version: string }>;
  readonly normalization: Readonly<{ key: string; version: string }>;
  readonly epistemicBoundary: readonly string[];
  readonly briefingTemplateId: string;
  readonly briefingTemplateVersion: string;
}

export interface MetricIntelligenceComponent {
  readonly identity: string;
  readonly value: number;
  readonly sourceReferences: readonly string[];
}

export interface MetricIntelligenceEndpoint {
  readonly role: "CASE_A" | "CASE_B";
  readonly subjectIdentity: string;
  readonly displayLabel: string;
  readonly knowledgeObjectId: string;
  readonly snapshotId: string;
  readonly components: readonly MetricIntelligenceComponent[];
}

export interface MetricIntelligenceSource {
  readonly investigationId: string;
  readonly pairId: string;
  readonly value: number;
  readonly availability: "AVAILABLE";
  readonly evaluator: Readonly<{ key: string; version: string }>;
  readonly normalization: Readonly<{ key: string; version: string }>;
  readonly executionId: string;
  readonly inputProjectionId: string;
  readonly endpoints: readonly [MetricIntelligenceEndpoint, MetricIntelligenceEndpoint];
  readonly canonicalConfiguredWeight: number;
  readonly participatingNormalizedWeight: number;
  readonly componentSimilarities?: Readonly<Record<string, number>>;
  readonly classification: MetricEpistemicClassification;
}

export interface MetricSignificanceBriefing {
  readonly findingId: string;
  readonly metricId: string;
  readonly metricLabel: string;
  readonly value: number;
  readonly displayValue: string;
  readonly pairDisplay: string;
  readonly microBriefing: string;
  readonly whyItMatters: string;
  readonly researchQuestion: string;
  readonly plausibleExplanations: readonly string[];
  readonly limitations: readonly string[];
  readonly deterministicBasisSummary: string;
  readonly epistemicClassification: MetricEpistemicClassification;
  readonly templateId: string;
  readonly templateVersion: string;
  readonly evaluator: Readonly<{ key: string; version: string }>;
  readonly normalization: Readonly<{ key: string; version: string }>;
  readonly source: MetricIntelligenceSource;
}

export interface MetricBriefingTemplate {
  readonly id: string;
  readonly version: string;
  readonly metricSemanticKind: MetricIntelligenceDefinition["semanticKind"];
}

export interface GovernedMetricExplanation {
  readonly definitionId: string;
  readonly semanticIdentity: string;
  readonly surfaceId: string;
  readonly activeMode: string;
  readonly displayValue: string;
  readonly exactValue: string;
  readonly definition: string;
  readonly interpretation: string;
  readonly notice: string;
  readonly provenance: readonly string[];
  readonly sourceReferences: readonly string[];
  readonly limitations: readonly string[];
  readonly unavailableInputs: readonly string[];
  readonly evaluatedSnapshot?: import("./EquationDocumentationTypes").EvaluatedMathematicalSnapshot;
  readonly mathematicalExplanation?: import("./MetricExplanationContract").VisibleMathematics;
  readonly mathematicsAuthorityIdentity?: string;
}
