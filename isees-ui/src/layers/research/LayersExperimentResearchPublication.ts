import { ResearchAnchorType, type ResearchExperimentAnchor } from "../../research/researchBridgeTypes";
import type { ResearchBridgeRuntime } from "../../research/ResearchBridgeRuntime";
import type { LayersExperimentExecution } from "../runtime/LayersExperimentRuntimeTypes";
import type { LayersExperimentalPairProjection } from "../projection";
import { migrateResearchAnchor } from "../../research/ResearchAnchorContract";
import { LAYERS_EXPERIMENT_SCHEMA_VERSION } from "../catalog/CanonicalLayerCatalogTypes";

function immutableSnapshot<T>(value: T): T {
  if (value instanceof Date) return Object.freeze(new Date(value.getTime())) as T;
  if (Array.isArray(value)) return Object.freeze(value.map(immutableSnapshot)) as T;
  if (value && typeof value === "object") return Object.freeze(Object.fromEntries(Object.entries(value as object).map(([key, child]) => [key, immutableSnapshot(child)]))) as T;
  return value;
}

export interface LayersExperimentResearchPublicationInput {
  investigationId: string;
  caseAEventId: string;
  caseBEventId: string;
  execution: LayersExperimentExecution;
  projection: LayersExperimentalPairProjection;
  researchBridgeRuntime: ResearchBridgeRuntime;
}

export function createLayersExperimentResearchAnchor(
  input: Omit<LayersExperimentResearchPublicationInput, "researchBridgeRuntime">,
): ResearchExperimentAnchor {
  const result = input.execution.result?.experimentalManifoldSnapshot;
  if (!result || input.execution.executionId !== input.projection.executionId || result.projectionId !== input.projection.projectionId) {
    throw new Error("Research publication requires a completed matching LAYERS execution and projection.");
  }
  if (input.investigationId !== input.projection.investigationId || input.execution.input.scope.investigationId !== input.investigationId) {
    throw new Error("Research publication Investigation identity does not match the completed experiment.");
  }
  if (input.projection.provenance.experimentSchemaVersion !== LAYERS_EXPERIMENT_SCHEMA_VERSION) throw new Error("Research publication requires the current LAYERS experiment schema.");
  const projection = immutableSnapshot(input.projection);
  return migrateResearchAnchor(Object.freeze({
    anchorId: ["research", input.investigationId, "EXPERIMENT", input.projection.projectionId].join(":"),
    investigationId: input.investigationId,
    experiment: Object.freeze({
      type: ResearchAnchorType.EXPERIMENT,
      schemaVersion: LAYERS_EXPERIMENT_SCHEMA_VERSION,
      caseAEventId: input.caseAEventId,
      caseBEventId: input.caseBEventId,
      projection,
      source: "LAYERS_EXPERIMENTAL_LABORATORY",
    }),
    createdAt: new Date(),
    pinned: false,
  }) as unknown as Record<string, unknown>) as ResearchExperimentAnchor;
}

export function publishLayersExperimentToResearch(input: LayersExperimentResearchPublicationInput): ResearchExperimentAnchor {
  const anchor = createLayersExperimentResearchAnchor(input);
  input.researchBridgeRuntime.createAnchor(anchor);
  return anchor;
}
