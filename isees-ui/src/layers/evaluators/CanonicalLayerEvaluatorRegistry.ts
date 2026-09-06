import { CanonicalLayerCatalog } from "../catalog/CanonicalLayerCatalog.ts";
import { CanonicalLayerOperationalStatus } from "../catalog/CanonicalLayerCatalogTypes.ts";
import type { CanonicalLayerDefinition } from "../catalog/CanonicalLayerCatalogTypes.ts";
import { CanonicalLayerEvaluatorRegistrations } from "./CanonicalLayerEvaluators.ts";
import type { CanonicalLayerEvaluatorRegistration, CanonicalLayerEvaluatorRegistryValidation } from "./CanonicalLayerEvaluatorTypes.ts";

function frozen<T>(value: T): T { return Object.freeze(value); }

export function validateCanonicalLayerEvaluatorRegistry(
  catalog: readonly CanonicalLayerDefinition[],
  registrations: readonly CanonicalLayerEvaluatorRegistration[],
): CanonicalLayerEvaluatorRegistryValidation {
  const catalogById = new Map(catalog.map(entry => [entry.id, entry]));
  const layerIds = new Set<string>();
  const evaluatorKeys = new Set<string>();
  for (const registration of registrations) {
    if (layerIds.has(registration.layerId)) throw new Error(`Duplicate evaluator registration for layer ${registration.layerId}.`);
    if (evaluatorKeys.has(registration.evaluatorKey)) throw new Error(`Duplicate evaluator key ${registration.evaluatorKey}.`);
    layerIds.add(registration.layerId); evaluatorKeys.add(registration.evaluatorKey);
    const definition = catalogById.get(registration.layerId);
    if (!definition) throw new Error(`Orphan evaluator registration for non-canonical layer ${registration.layerId}.`);
    if (definition.operationalStatus !== CanonicalLayerOperationalStatus.OPERATIONAL || !definition.researcherSelectable) throw new Error(`Unavailable catalog layer ${registration.layerId} cannot have an evaluator.`);
    if (definition.evaluatorKey !== registration.evaluatorKey) throw new Error(`Evaluator key mismatch for layer ${registration.layerId}.`);
    if (definition.evaluatorVersion !== registration.evaluatorVersion) throw new Error(`Evaluator version mismatch for layer ${registration.layerId}.`);
  }
  const operationalIds = catalog.filter(entry => entry.operationalStatus === CanonicalLayerOperationalStatus.OPERATIONAL).map(entry => entry.id);
  const registeredInCatalogOrder = catalog.filter(entry => layerIds.has(entry.id)).map(entry => entry.id);
  if (operationalIds.length !== registeredInCatalogOrder.length || operationalIds.some((id, index) => id !== registeredInCatalogOrder[index])) {
    throw new Error("Operational catalog layers and registered evaluator layers disagree.");
  }
  if (registrations.some((entry, index) => entry.layerId !== registeredInCatalogOrder[index])) throw new Error("Evaluator registry order must follow canonical catalog order.");
  return frozen({ valid: true, registeredLayerIds: frozen([...registeredInCatalogOrder]) });
}

validateCanonicalLayerEvaluatorRegistry(CanonicalLayerCatalog, CanonicalLayerEvaluatorRegistrations);

export const CanonicalLayerEvaluatorRegistry: readonly CanonicalLayerEvaluatorRegistration[] = frozen([...CanonicalLayerEvaluatorRegistrations]);
const registryByLayerId: ReadonlyMap<string, CanonicalLayerEvaluatorRegistration> = new Map(CanonicalLayerEvaluatorRegistry.map(entry => [entry.layerId, entry]));

export function enumerateCanonicalLayerEvaluators(): readonly CanonicalLayerEvaluatorRegistration[] { return CanonicalLayerEvaluatorRegistry; }
export function getCanonicalLayerEvaluator(layerId: string): CanonicalLayerEvaluatorRegistration | undefined { return registryByLayerId.get(layerId); }
