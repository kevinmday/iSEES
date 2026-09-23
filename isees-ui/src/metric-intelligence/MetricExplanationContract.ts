import type { DeterministicProcedure } from "./DeterministicProcedureTypes.ts";
import type { EquationDocumentation, EquationSymbolDefinition } from "./EquationDocumentationTypes.ts";
import type { AuthorityClassification, EquationStatus } from "./MetricMathematicsAuthorityTypes.ts";

export const METRIC_EXPLANATION_SCHEMA_VERSION = "metric-explanation/v1" as const;

export type GovernedAvailability<T> =
  | Readonly<{ status: "AVAILABLE"; value: T }>
  | Readonly<{ status: "NOT_APPLICABLE"; reason: string }>
  | Readonly<{ status: "DEFERRED_TO_I2B"; reason: string }>
  | Readonly<{ status: "UNAVAILABLE"; reason: string }>;

export interface ExactMetricValue {
  readonly valueKind: "NUMBER" | "TEXT" | "CATEGORICAL";
  readonly exactValue: string;
  readonly unit: string;
  readonly normalization: string;
}

export interface RenderedMetricValue {
  readonly text: string;
  readonly formattingRule: string;
  readonly displayUnit: string;
}

export interface MetricExplanationContract {
  readonly schemaVersion: typeof METRIC_EXPLANATION_SCHEMA_VERSION;
  readonly metricIdentity: string;
  readonly displayName: string;
  readonly researchQuestion: string;
  readonly plainLanguageDefinition: string;
  readonly philosophyOfUse: string;
  readonly authorityClassification: AuthorityClassification;
  readonly equationStatus: EquationStatus;
  readonly authoritativeEquation: GovernedAvailability<EquationDocumentation>;
  readonly deterministicProcedure: GovernedAvailability<DeterministicProcedure>;
  readonly symbolDefinitions: readonly EquationSymbolDefinition[];
  readonly canonicalInputs: GovernedAvailability<readonly ExactMetricValue[]>;
  readonly normalizedInputs: GovernedAvailability<readonly ExactMetricValue[]>;
  readonly intermediateValues: GovernedAvailability<readonly ExactMetricValue[]>;
  readonly participationRules: readonly string[];
  readonly exclusionRules: readonly string[];
  readonly configuredWeights: GovernedAvailability<Readonly<Record<string, string>>>;
  readonly actualValueSubstitution: GovernedAvailability<string>;
  readonly finalCalculation: GovernedAvailability<ExactMetricValue>;
  readonly renderedResult: GovernedAvailability<RenderedMetricValue>;
  readonly interpretation: string;
  readonly epistemicBoundaries: readonly string[];
  readonly researchUsefulness: string;
  readonly evaluatorIdentity: GovernedAvailability<string>;
  readonly evaluatorVersion: GovernedAvailability<string>;
  readonly sourceReferences: readonly string[];
  readonly executionIdentity: GovernedAvailability<string>;
  readonly reproductionRecipe: GovernedAvailability<readonly string[]>;
  readonly relatedMathematics: readonly Readonly<{ identity: string; relationship: string }>[];
}

export const deferredToI2B = <T>(reason: string): GovernedAvailability<T> => Object.freeze({ status: "DEFERRED_TO_I2B", reason });
export const unavailable = <T>(reason: string): GovernedAvailability<T> => Object.freeze({ status: "UNAVAILABLE", reason });
export const notApplicable = <T>(reason: string): GovernedAvailability<T> => Object.freeze({ status: "NOT_APPLICABLE", reason });
export const available = <T>(value: T): GovernedAvailability<T> => Object.freeze({ status: "AVAILABLE", value });
