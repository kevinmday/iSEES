import {
  CanonicalLayerCatalog,
  CanonicalLayerFamilies,
  CanonicalLayerOperationalStatus,
  CanonicalLayerReadiness,
  type CanonicalLayerDefinition,
  type CanonicalLayerFamilyDefinition,
} from "../catalog/index.ts";

export interface LayerCatalogFamilyProjection {
  readonly family: CanonicalLayerFamilyDefinition;
  readonly members: readonly CanonicalLayerDefinition[];
  readonly operationalCount: number;
  readonly selectedOperationalCount: number;
}

export const operationalSelectableLayerIds = Object.freeze(CanonicalLayerCatalog
  .filter(layer => layer.operationalStatus === CanonicalLayerOperationalStatus.OPERATIONAL && layer.researcherSelectable)
  .map(layer => layer.id));
export const catalogSelectableLayerIds = Object.freeze(CanonicalLayerCatalog
  .filter(layer => layer.researcherSelectable)
  .map(layer => layer.id));

export const layerCatalogTotals = Object.freeze({
  total: CanonicalLayerCatalog.length,
  operational: CanonicalLayerCatalog.filter(layer => layer.operationalStatus === CanonicalLayerOperationalStatus.OPERATIONAL).length,
  unavailable: CanonicalLayerCatalog.filter(layer => layer.operationalStatus === CanonicalLayerOperationalStatus.UNAVAILABLE).length,
  ready: CanonicalLayerCatalog.filter(layer => layer.readiness === CanonicalLayerReadiness.READY).length,
  inputNeeded: CanonicalLayerCatalog.filter(layer => layer.readiness === CanonicalLayerReadiness.INPUT_NEEDED).length,
  methodNeeded: CanonicalLayerCatalog.filter(layer => layer.readiness === CanonicalLayerReadiness.METHOD_NEEDED).length,
  blocked: CanonicalLayerCatalog.filter(layer => layer.readiness === CanonicalLayerReadiness.BLOCKED).length,
});

export function normalizeLayerCatalogFilter(filter: string): string {
  return filter.trim().toLowerCase();
}

export function normalizeOperationalSelection(layerIds: readonly string[]): readonly string[] {
  const requested = new Set(layerIds);
  return Object.freeze(catalogSelectableLayerIds.filter(id => requested.has(id)));
}

export function projectLayerCatalogFamilies(filter: string, selectedIds: readonly string[]): readonly LayerCatalogFamilyProjection[] {
  const query = normalizeLayerCatalogFilter(filter);
  const selected = new Set(normalizeOperationalSelection(selectedIds));
  const matchingFamilyIds = new Set(query ? CanonicalLayerFamilies
    .filter(family => [family.label, family.description].some(value => normalizeLayerCatalogFilter(value).includes(query)))
    .map(family => family.id) : []);
  return CanonicalLayerFamilies.map(family => {
    const allMembers = CanonicalLayerCatalog.filter(layer => layer.familyId === family.id)
      .sort((a, b) => a.familyMemberOrder - b.familyMemberOrder);
    const familyMatches = matchingFamilyIds.has(family.id);
    const members = query && !familyMatches
      ? (matchingFamilyIds.size ? [] : allMembers.filter(layer => [layer.label, layer.id, layer.description, layer.unavailableReason, ...layer.requiredCanonicalInputs]
        .some(value => value && normalizeLayerCatalogFilter(value).includes(query))))
      : allMembers;
    const operational = allMembers.filter(layer => operationalSelectableLayerIds.includes(layer.id));
    return Object.freeze({ family, members: Object.freeze(members), operationalCount: operational.length, selectedOperationalCount: operational.filter(layer => selected.has(layer.id)).length });
  }).filter(group => !query || group.members.length > 0);
}

export function selectCatalogFamily(selectedIds: readonly string[], familyId: string): readonly string[] {
  const selected = new Set(normalizeOperationalSelection(selectedIds));
  CanonicalLayerCatalog.filter(layer => layer.familyId === familyId && layer.researcherSelectable).forEach(layer => selected.add(layer.id));
  return normalizeOperationalSelection([...selected]);
}

export function clearCatalogFamily(selectedIds: readonly string[], familyId: string): readonly string[] {
  const familyIds = new Set(CanonicalLayerCatalog.filter(layer => layer.familyId === familyId).map(layer => layer.id));
  return normalizeOperationalSelection(selectedIds.filter(id => !familyIds.has(id)));
}
