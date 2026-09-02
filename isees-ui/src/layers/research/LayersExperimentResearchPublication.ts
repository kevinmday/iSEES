import { ResearchAnchorType, type ResearchExperimentAnchor } from "../../research/researchBridgeTypes";
import type { ResearchBridgeRuntime } from "../../research/ResearchBridgeRuntime";
import type { LayersExperimentExecution } from "../runtime/LayersExperimentRuntimeTypes";
import type { LayersExperimentalPairProjection } from "../projection";

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
  return Object.freeze({
    anchorId: ["research", input.investigationId, "EXPERIMENT", input.projection.projectionId].join(":"),
    investigationId: input.investigationId,
    experiment: Object.freeze({
      type: ResearchAnchorType.EXPERIMENT,
      caseAEventId: input.caseAEventId,
      caseBEventId: input.caseBEventId,
      projection: input.projection,
      source: "LAYERS_EXPERIMENTAL_LABORATORY",
    }),
    createdAt: new Date(),
    pinned: false,
  });
}

export function publishLayersExperimentToResearch(input: LayersExperimentResearchPublicationInput): ResearchExperimentAnchor {
  const anchor = createLayersExperimentResearchAnchor(input);
  input.researchBridgeRuntime.createAnchor(anchor);
  return anchor;
}
