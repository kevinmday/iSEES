import type { LayerDefinition } from "../../manifold/layers/layerTypes";
import type { LayersExperimentalPairProjection, LayersPairDelta, LayersLayerContribution, LayersExperimentalPairProjectionProvenance } from "../projection/LayersExperimentalPairProjectionTypes";

export const LayersExperimentStatus = {
  EMPTY: "EMPTY",
  READY: "READY",
  EXECUTING: "EXECUTING",
  COMPLETE: "COMPLETE",
  ERROR: "ERROR",
} as const;

export type LayersExperimentStatus =
  (typeof LayersExperimentStatus)[keyof typeof LayersExperimentStatus];

export interface LayersExperimentCompareOrigin {
  pairId?: string;
  candidateId?: string;
}

export interface LayersExperimentResolveOrigin {
  executionId?: string;
  manifoldId?: string;
}

export interface LayersExperimentScope {
  investigationId: string;
  workspaceId?: string;
  focusedEventId?: string;
  comparisonEventId?: string;
  subjectIds: readonly string[];
  compareOrigin?: LayersExperimentCompareOrigin;
  resolveOrigin?: LayersExperimentResolveOrigin;
}

export interface LayersExperimentBaseline {
  investigationId: string;
  workspaceId?: string;
  subjectIds: readonly string[];
  canonicalStartingLayerIds: readonly string[];
  startingResolveExecutionId?: string;
  startingManifoldId?: string;
  temporalContext: unknown;
  investigativeScale: unknown;
}

export const ArmedLayerClassification = {
  CANONICAL: "CANONICAL",
  UNSUPPORTED: "UNSUPPORTED",
  LEGACY: "LEGACY",
} as const;

export type ArmedLayerClassification =
  (typeof ArmedLayerClassification)[keyof typeof ArmedLayerClassification];

export interface ArmedLayer {
  id: string;
  classification: ArmedLayerClassification;
  operational: boolean;
  canonicalDefinition?: LayerDefinition;
}

export interface ArmedLayerSelection {
  layerIds: readonly string[];
  legacyLayerIds?: readonly string[];
}

export interface LayersExperimentExecutionInput {
  scope: LayersExperimentScope;
  baseline: LayersExperimentBaseline;
  armedLayers: readonly ArmedLayer[];
  temporalContext: unknown;
  investigativeScale: unknown;
  researcherConfiguration: Readonly<Record<string, unknown>>;
}

export interface LayersExperimentUnavailableInput {
  code: string;
  description: string;
}

export interface LayersExperimentResult {
  outcome: "COMPUTED" | "UNAVAILABLE";
  experimentalManifoldSnapshot?: LayersExperimentalPairProjection;
  baselineDelta?: LayersPairDelta;
  layerContributions?: readonly LayersLayerContribution[];
  unavailableInputs: readonly LayersExperimentUnavailableInput[];
  provenance?: LayersExperimentalPairProjectionProvenance;
}

export interface LayersExperimentError {
  code: string;
  message: string;
  details?: unknown;
}

export interface LayersExperimentExecution {
  executionId: string;
  input: LayersExperimentExecutionInput;
  result?: LayersExperimentResult;
  error?: LayersExperimentError;
  startedAt?: string;
  completedAt?: string;
}

export interface LayersExperimentState {
  status: LayersExperimentStatus;
  scope?: LayersExperimentScope;
  baseline?: LayersExperimentBaseline;
  armedLayers: readonly ArmedLayer[];
  currentExecution?: LayersExperimentExecution;
  history: readonly LayersExperimentExecution[];
  error?: LayersExperimentError;
  revision: number;
}

export interface EstablishLayersExperimentInput {
  scope: Omit<LayersExperimentScope, "subjectIds"> & { subjectIds?: readonly string[] };
  baseline: LayersExperimentBaseline;
  armedLayers?: ArmedLayerSelection;
}
