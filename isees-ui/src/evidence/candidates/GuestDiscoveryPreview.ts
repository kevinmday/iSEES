import type { WebDiscoverySearchResult } from "./WebDiscoveryApi.ts";

export interface GuestDiscoveryTarget { readonly id: string; readonly label: string; readonly type: string }
export interface GuestDiscoveryLead { readonly leadId: string; readonly result: WebDiscoverySearchResult; readonly query: string; readonly provider: string; readonly expiresAt?: string }
export interface GuestDiscoveryConnection { readonly leadId: string; readonly targetId: string; readonly relationship: "REFERENCES" | "ASSOCIATED_WITH" | "SUPPORTS" | "CONTRADICTS" }
export interface GuestDiscoveryPreview {
  readonly projectionId: string;
  readonly investigationId: string;
  readonly leadId: string;
  readonly nodeId: string;
  readonly edgeId: string;
  readonly proposedBy: string;
  readonly lead: GuestDiscoveryLead;
  readonly target: GuestDiscoveryTarget;
  readonly relationship: GuestDiscoveryConnection["relationship"];
  readonly manifold: { readonly nodeDelta: 1; readonly edgeDelta: 1; readonly governedMutation: false };
  /** Descriptive availability only. No Layers evaluator is run by Guest discovery. */
  readonly layers: readonly { readonly id: string; readonly effect: "PROVISIONAL_METADATA_REFERENCE"; readonly evaluation: "NOT_EVALUATED" }[];
}

const hash = (value: string): string => {
  let result = 2166136261;
  for (let index = 0; index < value.length; index += 1) { result ^= value.charCodeAt(index); result = Math.imul(result, 16777619); }
  return (result >>> 0).toString(16).padStart(8, "0");
};

export function projectGuestDiscoveryPreview(input: { readonly investigationId: string; readonly proposedBy: string; readonly lead: GuestDiscoveryLead; readonly connection: GuestDiscoveryConnection; readonly targets: readonly GuestDiscoveryTarget[]; readonly activeLayerIds: readonly string[] }): GuestDiscoveryPreview | undefined {
  const target = input.targets.find((item) => item.id === input.connection.targetId);
  if (!target || input.connection.leadId !== input.lead.leadId) return undefined;
  const layerIds = [...new Set(input.activeLayerIds)].sort();
  const canonical = JSON.stringify({ investigationId: input.investigationId, leadId: input.lead.leadId, resultId: input.lead.result.resultId, targetId: target.id, relationship: input.connection.relationship, layerIds });
  const suffix = hash(canonical);
  return Object.freeze({ projectionId: `guest-discovery-preview:${suffix}`, investigationId: input.investigationId, leadId: input.lead.leadId, nodeId: `guest-metadata-reference:${suffix}`, edgeId: `guest-proposed-connection:${suffix}`, proposedBy: input.proposedBy, lead: input.lead, target, relationship: input.connection.relationship, manifold: Object.freeze({ nodeDelta: 1 as const, edgeDelta: 1 as const, governedMutation: false as const }), layers: Object.freeze(layerIds.map((id) => Object.freeze({ id, effect: "PROVISIONAL_METADATA_REFERENCE" as const, evaluation: "NOT_EVALUATED" as const }))) });
}
