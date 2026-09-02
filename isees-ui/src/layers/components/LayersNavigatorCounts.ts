import { ArmedLayerClassification } from "../runtime/LayersExperimentRuntimeTypes";
import type { ArmedLayer } from "../runtime/LayersExperimentRuntimeTypes";
import { LayersOperationalMappingStatus, LayersPairAvailability } from "../projection/LayersExperimentalPairProjectionTypes";
import type { LayersExperimentalPairProjection } from "../projection/LayersExperimentalPairProjectionTypes";
import { CanonicalFeatureDimension } from "../../resolve/features/CanonicalKnowledgeFeatureTypes";

const supportedCanonicalDimensions = new Set<string>(Object.values(CanonicalFeatureDimension));

export interface LayersNavigatorCounts {
  armed: number;
  mapped: number;
  unavailable: number;
}

export function hasOperationalCanonicalMapping(layer: ArmedLayer): boolean {
  return layer.classification === ArmedLayerClassification.CANONICAL
    && layer.operational
    && supportedCanonicalDimensions.has(layer.id);
}

export function resolveLayersNavigatorCounts(
  armedLayers: readonly ArmedLayer[],
  completedProjection?: LayersExperimentalPairProjection,
): LayersNavigatorCounts {
  const armedById = new Map(armedLayers.map(layer => [layer.id, layer]));
  const armedIds = [...armedById.keys()].sort();
  const projectedIds = completedProjection
    ? [...completedProjection.provenance.experimentalLayerIds].sort()
    : [];
  const projectionMatchesArmed = completedProjection !== undefined
    && armedIds.length === projectedIds.length
    && armedIds.every((id, index) => id === projectedIds[index]);

  if (projectionMatchesArmed) {
    const contributions = new Map(completedProjection.experimental.contributions.map(item => [item.layerId, item]));
    const mapped = armedIds.filter(id => contributions.get(id)?.operationalMappingStatus === LayersOperationalMappingStatus.MAPPED).length;
    const unavailable = armedIds.filter(id => contributions.get(id)?.availability !== LayersPairAvailability.AVAILABLE).length;
    return { armed: armedIds.length, mapped, unavailable };
  }

  const mapped = [...armedById.values()].filter(hasOperationalCanonicalMapping).length;
  return { armed: armedIds.length, mapped, unavailable: armedIds.length - mapped };
}
