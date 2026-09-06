import { CANONICAL_LAYER_DEFAULT_PROFILE_VERSION, CanonicalLayerOperationalStatus, CanonicalLayerProfileId, type CanonicalLayerDefaultProfile } from "./CanonicalLayerCatalogTypes.ts";
import { CanonicalLayerCatalog } from "./CanonicalLayerCatalog.ts";

const profile = (id: CanonicalLayerDefaultProfile["id"], description: string, layerIds: readonly string[]): CanonicalLayerDefaultProfile => Object.freeze({ id, version: CANONICAL_LAYER_DEFAULT_PROFILE_VERSION, description, layerIds: Object.freeze([...layerIds]) });
export const CanonicalLayerDefaultProfiles = Object.freeze({
 [CanonicalLayerProfileId.CANONICAL_BASELINE]: profile(CanonicalLayerProfileId.CANONICAL_BASELINE,"Existing application baseline; preserves Workspace.active_layers semantics.",["OBSERVABILITY","NARRATIVE","TEMPORAL"]),
 [CanonicalLayerProfileId.EMPTY_EXPERIMENT]: profile(CanonicalLayerProfileId.EMPTY_EXPERIMENT,"No layers armed.",[]),
 [CanonicalLayerProfileId.ALL_OPERATIONAL]: profile(CanonicalLayerProfileId.ALL_OPERATIONAL,"Every currently proven computational layer.",CanonicalLayerCatalog.filter(x=>x.operationalStatus===CanonicalLayerOperationalStatus.OPERATIONAL).map(x=>x.id)),
});

export function restoreCanonicalLayerProfile(id: CanonicalLayerDefaultProfile["id"]): readonly string[] {
 const found = CanonicalLayerDefaultProfiles[id];
 if (!found) throw new Error(`Unknown canonical layer profile: ${String(id)}`);
 return Object.freeze([...found.layerIds]);
}
