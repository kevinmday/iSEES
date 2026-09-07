export type MetricEpistemicClassification = "EXPERIMENTAL / DERIVED / NON-CANONICAL";

export interface MetricIntelligenceDefinition {
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
