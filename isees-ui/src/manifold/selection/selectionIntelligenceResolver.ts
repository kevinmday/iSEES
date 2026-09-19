import type { GraphSelection, InvestigationGraph } from "../graphTypes";
import type {
  EdgeEndpointProfile,
  EntityClassificationProfile,
  EntityEvidenceProfile,
  EntityProvenanceProfile,
  EntityRelationshipSummary,
  GraphNodeIntelligence,
  GraphEdgeIntelligence,
  IntelligenceFieldAvailability,
  EntityDossierProjection,
} from "../../graph/graphInteractionTypes";
import { ENTITY_DOSSIER_SCHEMA_VERSION } from "../../knowledge/dossier/EntityDossierTypes.ts";
import { entityDossierSha256, validateEntityDossierRevision } from "../../knowledge/dossier/EntityDossierCanonicalization.ts";
import { resolveSystemCanonEntityDossierRevision } from "../../knowledge/dossier/SystemCanonEntityDossierRegistry.ts";
import type { GovernedEntityDossierReference } from "../../knowledge/topology/KnowledgeTopologyTypes.ts";
import { projectOperationalDossierProfile } from "../../intelligence/selection/profiles/OperationalDossierProjection.ts";

const RELATIONSHIP_SUMMARY_LIMIT = 8;

export type IntelligenceOrigin =
  | "KNOWN_LOCALLY"
  | "REX_DISCOVERED"
  | "DETERMINISTICALLY_DERIVED"
  | "RESEARCH_VECTOR";

export type IntelligenceAvailability =
  | { readonly status: "AVAILABLE" }
  | { readonly status: "UNAVAILABLE"; readonly reason: "SELECTION_NOT_FOUND" | "INVESTIGATION_CONTEXT_NOT_SUPPLIED" };

export type MetricAvailability =
  | { readonly status: "AVAILABLE"; readonly value: number }
  | { readonly status: "UNAVAILABLE"; readonly reason: "NOT_SUPPLIED" };

export interface SelectionIntelligenceContext {
  readonly investigationId: string;
  readonly manifoldRevisionId: string;
}

export interface SelectionIntelligenceBinding {
  readonly investigationId: string;
  readonly manifoldRevisionId: string;
  readonly selectionKind: "NODE" | "EDGE" | "CLUSTER";
  readonly targetId: string;
  readonly projectionFingerprint: string;
}

export interface SelectionIntelligenceProvenance {
  readonly sourceType: "CANONICAL_INVESTIGATION_GRAPH";
  readonly sourceIds: readonly string[];
  readonly derivation: "DETERMINISTIC_LOCAL_PROJECTION";
}

export interface EdgeMetricAvailability {
  readonly confidence: MetricAvailability;
  readonly narrative: MetricAvailability;
  readonly observability: MetricAvailability;
  readonly infrastructure: MetricAvailability;
  readonly topology: MetricAvailability;
  readonly geo: MetricAvailability;
}

interface AvailableResult {
  readonly availability: { readonly status: "AVAILABLE" };
  readonly binding?: SelectionIntelligenceBinding;
  readonly provenance: SelectionIntelligenceProvenance;
  readonly intelligenceOrigin: IntelligenceOrigin;
}

export type SelectionIntelligence =
  | { readonly kind: "NONE"; readonly availability: IntelligenceAvailability }
  | (AvailableResult & { readonly kind: "NODE"; readonly intelligence: GraphNodeIntelligence })
  | (AvailableResult & {
      readonly kind: "EDGE";
      readonly intelligence: GraphEdgeIntelligence;
      readonly metricAvailability: EdgeMetricAvailability;
    })
  | (AvailableResult & { readonly kind: "CLUSTER"; readonly clusterId: string });

function metric(value: number | undefined): MetricAvailability {
  return value === undefined || !Number.isFinite(value)
    ? { status: "UNAVAILABLE", reason: "NOT_SUPPLIED" }
    : { status: "AVAILABLE", value };
}

function available<T>(value: T): IntelligenceFieldAvailability<T> {
  return Object.freeze({ status: "AVAILABLE", value });
}

function notSupplied<T>(): IntelligenceFieldAvailability<T> {
  return Object.freeze({ status: "UNAVAILABLE", reason: "NOT_SUPPLIED" });
}

function suppliedString(metadata: Readonly<Record<string, unknown>> | undefined, ...keys: readonly string[]): IntelligenceFieldAvailability<string> {
  for (const key of keys) {
    const value = metadata?.[key];
    if (typeof value === "string" && value.trim().length > 0) return available(value);
  }
  return notSupplied();
}

function suppliedRevision(metadata: Readonly<Record<string, unknown>> | undefined, ...keys: readonly string[]): IntelligenceFieldAvailability<string | number> {
  for (const key of keys) {
    const value = metadata?.[key];
    if ((typeof value === "string" && value.trim().length > 0) || (typeof value === "number" && Number.isFinite(value))) return available(value);
  }
  return notSupplied();
}

function suppliedLineage(metadata: Readonly<Record<string, unknown>> | undefined): EntityProvenanceProfile["lineage"] {
  const value = metadata?.lineage;
  if (Array.isArray(value)) return available(Object.freeze([...value]));
  if (value !== null && typeof value === "object") return available(Object.freeze({ ...(value as Record<string, unknown>) }));
  return notSupplied();
}

function classification(node: InvestigationGraph["nodes"][number]): EntityClassificationProfile {
  return Object.freeze({
    projectedType: node.type,
    canonicalType: suppliedString(node.metadata, "canonicalKnowledgeType"),
    iconType: typeof node.iconType === "string" ? available<string>(node.iconType) : notSupplied<string>(),
  });
}

function provenance(metadata: Readonly<Record<string, unknown>> | undefined): EntityProvenanceProfile {
  return Object.freeze({
    sourceId: suppliedString(metadata, "sourceId"),
    sourceType: suppliedString(metadata, "knowledgeSourceType", "sourceType", "source"),
    sourceRevision: suppliedRevision(metadata, "sourceRevision"),
    knowledgeRevision: suppliedRevision(metadata, "revision", "knowledgeRevision"),
    lineage: suppliedLineage(metadata),
  });
}

function evidence(metadata: Readonly<Record<string, unknown>> | undefined): EntityEvidenceProfile {
  const knowledgeClassification = suppliedString(metadata, "knowledgeClassification", "classification");
  const reviewStatus = suppliedString(metadata, "reviewStatus");
  const canonEffect = suppliedString(metadata, "canonEffect");
  const epistemicStatus = suppliedString(metadata, "epistemicStatus", "epistemicClassification", "status");
  const candidate = knowledgeClassification.status === "AVAILABLE" && knowledgeClassification.value === "CANDIDATE_KNOWLEDGE";
  const reviewOnly = reviewStatus.status === "AVAILABLE" && /REVIEW/i.test(reviewStatus.value);
  const noCanonEffect = canonEffect.status === "AVAILABLE" && /^(NONE|NO_CANON_EFFECT)$/i.test(canonEffect.value);
  return Object.freeze({
    knowledgeClassification,
    epistemicStatus,
    reviewStatus,
    canonEffect,
    candidateEvidenceBoundary: candidate || reviewOnly || noCanonEffect ? "NON_CANONICAL_REVIEW_ONLY" : "CANONICAL_OR_UNSPECIFIED",
  });
}

function endpoint(node: InvestigationGraph["nodes"][number], role: "SOURCE" | "TARGET"): EdgeEndpointProfile {
  return Object.freeze({ role, identity: Object.freeze({ id: node.id, label: node.label }), classification: classification(node) });
}

function relationshipSummary(nodeId: string, graph: InvestigationGraph): EntityRelationshipSummary {
  const incident = graph.edges
    .filter(edge => edge.source === nodeId || edge.target === nodeId)
    .map(edge => {
      const direction = edge.source === nodeId && edge.target === nodeId ? "SELF" as const : edge.source === nodeId ? "OUTGOING" as const : "INCOMING" as const;
      const neighborId = direction === "INCOMING" ? edge.source : edge.target;
      const neighbor = graph.nodes.find(candidate => candidate.id === neighborId);
      return neighbor === undefined ? undefined : Object.freeze({
        edgeId: edge.id,
        direction,
        relationship: edge.relationship,
        neighbor: Object.freeze({ id: neighbor.id, label: neighbor.label }),
        neighborClassification: classification(neighbor),
      });
    })
    .filter((item): item is NonNullable<typeof item> => item !== undefined)
    .sort((left, right) => left.edgeId < right.edgeId ? -1 : left.edgeId > right.edgeId ? 1 : left.neighbor.id < right.neighbor.id ? -1 : left.neighbor.id > right.neighbor.id ? 1 : 0);
  const items = Object.freeze(incident.slice(0, RELATIONSHIP_SUMMARY_LIMIT));
  return Object.freeze({
    totalCount: incident.length,
    incomingCount: incident.filter(item => item.direction === "INCOMING").length,
    outgoingCount: incident.filter(item => item.direction === "OUTGOING").length,
    selfCount: incident.filter(item => item.direction === "SELF").length,
    returnedCount: items.length,
    truncated: incident.length > RELATIONSHIP_SUMMARY_LIMIT,
    items,
  });
}

function investigationRole(connectionCount: number): "ISOLATED" | "TERMINAL" | "CONNECTOR" | "HUB" {
  if (connectionCount === 0) return "ISOLATED";
  if (connectionCount === 1) return "TERMINAL";
  if (connectionCount <= 3) return "CONNECTOR";
  return "HUB";
}

function frozenUnavailableDossier(reason: Extract<EntityDossierProjection, { availability: "UNAVAILABLE" }>["reason"]): EntityDossierProjection {
  return Object.freeze({ availability: "UNAVAILABLE", reason });
}

function dossierReference(metadata: Readonly<Record<string, unknown>> | undefined): GovernedEntityDossierReference | undefined | null {
  const candidate = metadata?.dossierReference;
  if (candidate === undefined) return undefined;
  if (candidate === null || typeof candidate !== "object" || Array.isArray(candidate)) return null;
  const record = candidate as Record<string, unknown>;
  const allowed = ["schemaVersion", "entityId", "globalDossierRevisionId", "investigationOverlayRevisionId", "effectiveDossierHash"];
  if (Object.keys(record).some(key => !allowed.includes(key))) return null;
  if (typeof record.schemaVersion !== "string" || typeof record.entityId !== "string" || typeof record.globalDossierRevisionId !== "string" || typeof record.effectiveDossierHash !== "string") return null;
  if (record.investigationOverlayRevisionId !== undefined && typeof record.investigationOverlayRevisionId !== "string") return null;
  return record as unknown as GovernedEntityDossierReference;
}

function resolveGovernedDossierProjection(
  node: InvestigationGraph["nodes"][number],
  context: SelectionIntelligenceContext | undefined,
): EntityDossierProjection {
  const reference = dossierReference(node.metadata);
  if (reference === undefined) return frozenUnavailableDossier("NOT_REFERENCED");
  if (reference === null || reference.globalDossierRevisionId.toLowerCase().includes("latest") || reference.investigationOverlayRevisionId?.toLowerCase().includes("latest")) return frozenUnavailableDossier("MALFORMED_REFERENCE");
  if (context === undefined) return frozenUnavailableDossier("BINDING_CONTEXT_NOT_SUPPLIED");
  if (reference.schemaVersion !== ENTITY_DOSSIER_SCHEMA_VERSION) return frozenUnavailableDossier("SCHEMA_MISMATCH");
  if (reference.entityId !== node.id) return frozenUnavailableDossier("ENTITY_MISMATCH");
  if (!/^sha256:[0-9a-f]{64}$/.test(reference.effectiveDossierHash)) return frozenUnavailableDossier("MALFORMED_REFERENCE");
  const revision = resolveSystemCanonEntityDossierRevision(reference.entityId, reference.globalDossierRevisionId);
  if (revision === undefined) return frozenUnavailableDossier("REVISION_NOT_FOUND");
  try { validateEntityDossierRevision(revision); } catch { return frozenUnavailableDossier("INVALID_GOVERNED_REVISION"); }
  if (revision.schemaVersion !== reference.schemaVersion) return frozenUnavailableDossier("SCHEMA_MISMATCH");
  if (revision.entityIdentity.canonicalEntityId !== reference.entityId) return frozenUnavailableDossier("ENTITY_MISMATCH");
  if (revision.contentHash !== reference.effectiveDossierHash) return frozenUnavailableDossier("HASH_MISMATCH");
  const acceptedFacts = Object.freeze(revision.facts.filter(fact => fact.reviewStatus === "ACCEPTED" && fact.canonEffect !== "NONE"));
  const relationshipFacts = Object.freeze(revision.relationshipFacts.filter(fact => fact.reviewStatus === "ACCEPTED" && fact.canonEffect !== "NONE"));
  const factIds = new Set([...acceptedFacts, ...relationshipFacts].map(fact => fact.factId));
  const sourceLinks = Object.freeze(revision.sourceLinks.filter(link => factIds.has(link.factId)));
  const sourceIds = new Set(sourceLinks.map(link => link.sourceRecordId));
  const sourceRecords = Object.freeze(revision.sourceRecords.filter(source => sourceIds.has(source.sourceRecordId)));
  const binding = Object.freeze({
    investigationId: context.investigationId,
    manifoldRevisionId: context.manifoldRevisionId,
    nodeId: node.id,
    entityId: reference.entityId,
    globalDossierRevisionId: reference.globalDossierRevisionId,
    ...(reference.investigationOverlayRevisionId === undefined ? {} : { investigationOverlayRevisionId: reference.investigationOverlayRevisionId }),
    effectiveDossierHash: reference.effectiveDossierHash,
  });
  const domain = {
    schemaVersion: revision.schemaVersion,
    dossierRevisionId: revision.dossierRevisionId,
    scope: revision.scope,
    entityIdentity: revision.entityIdentity,
    acceptedFacts,
    relationshipFacts,
    sourceRecords,
    sourceLinks,
    unavailableCategories: revision.fieldAvailability,
    limitations: revision.limitations,
    operationalProfile: projectOperationalDossierProfile(revision, node.type),
    binding,
  } as const;
  return Object.freeze({ ...domain, availability: "AVAILABLE", projectionFingerprint: entityDossierSha256(domain) });
}

export function formatMetricAvailability(
  availability: MetricAvailability,
): string {
  return availability.status === "AVAILABLE"
    ? `${(availability.value * 100).toFixed(1)}%`
    : "NOT COMPUTED";
}

function stableValue(value: unknown): string {
  if (value === null || typeof value !== "object") return JSON.stringify(value);
  if (Array.isArray(value)) return `[${value.map(stableValue).join(",")}]`;
  const record = value as Record<string, unknown>;
  return `{${Object.keys(record).sort().map(
    key => `${JSON.stringify(key)}:${stableValue(record[key])}`,
  ).join(",")}}`;
}

function fingerprint(value: unknown): string {
  const input = stableValue(value);
  let hash = 0x811c9dc5;
  for (let index = 0; index < input.length; index += 1) {
    hash ^= input.charCodeAt(index);
    hash = Math.imul(hash, 0x01000193);
  }
  return `fnv1a32:${(hash >>> 0).toString(16).padStart(8, "0")}`;
}

function binding(
  context: SelectionIntelligenceContext | undefined,
  selectionKind: "NODE" | "EDGE" | "CLUSTER",
  targetId: string,
  projection: unknown,
): SelectionIntelligenceBinding | undefined {
  return context === undefined ? undefined : {
    investigationId: context.investigationId,
    manifoldRevisionId: context.manifoldRevisionId,
    selectionKind,
    targetId,
    projectionFingerprint: fingerprint({ context, selectionKind, targetId, projection }),
  };
}

function unavailable(
  reason: "SELECTION_NOT_FOUND" | "INVESTIGATION_CONTEXT_NOT_SUPPLIED",
): SelectionIntelligence {
  return { kind: "NONE", availability: { status: "UNAVAILABLE", reason } };
}

export function resolveSelectionIntelligence(
  selection: GraphSelection,
  graph: InvestigationGraph,
  context?: SelectionIntelligenceContext,
): SelectionIntelligence {
  if (selection.kind === "NONE") {
    return { kind: "NONE", availability: { status: "AVAILABLE" } };
  }

  if (selection.kind === "NODE") {
    const node = graph.nodes.find(candidate => candidate.id === selection.nodeId);
    if (!node) return unavailable("SELECTION_NOT_FOUND");
    const connectionCount = graph.edges.filter(
      edge => edge.source === node.id || edge.target === node.id,
    ).length;
    const sourceType = typeof node.metadata?.source === "string" ? node.metadata.source : node.type;
    const confidenceValue = node.metadata?.confidence;
    const intelligence: GraphNodeIntelligence = {
      nodeId: node.id,
      title: node.label,
      sourceType,
      confidence: typeof confidenceValue === "number" ? confidenceValue : undefined,
      connectionCount,
      metadata: node.metadata,
      entitySpecific: Object.freeze({
        identity: Object.freeze({ id: node.id, label: node.label }),
        classification: classification(node),
        investigationRole: investigationRole(connectionCount),
        provenance: provenance(node.metadata),
        evidence: evidence(node.metadata),
        relationships: relationshipSummary(node.id, graph),
        governedDossier: resolveGovernedDossierProjection(node, context),
      }),
    };
    const selectionBinding = binding(context, "NODE", node.id, intelligence);
    return {
      kind: "NODE",
      availability: { status: "AVAILABLE" },
      ...(selectionBinding === undefined ? {} : { binding: selectionBinding }),
      provenance: {
        sourceType: "CANONICAL_INVESTIGATION_GRAPH",
        sourceIds: [node.id],
        derivation: "DETERMINISTIC_LOCAL_PROJECTION",
      },
      intelligenceOrigin: "DETERMINISTICALLY_DERIVED",
      intelligence,
    };
  }

  if (selection.kind === "EDGE") {
    const edge = graph.edges.find(candidate => candidate.id === selection.edgeId);
    if (!edge) return unavailable("SELECTION_NOT_FOUND");
    const sourceNode = graph.nodes.find(candidate => candidate.id === edge.source);
    const targetNode = graph.nodes.find(candidate => candidate.id === edge.target);
    if (!sourceNode || !targetNode) return unavailable("SELECTION_NOT_FOUND");
    const confidence = edge.metrics?.confidence ?? edge.weight;
    const metricAvailability: EdgeMetricAvailability = {
      confidence: metric(confidence),
      narrative: metric(edge.metrics?.narrative),
      observability: metric(edge.metrics?.observability),
      infrastructure: metric(edge.metrics?.infrastructure),
      topology: metric(edge.metrics?.topology),
      geo: metric(edge.metrics?.geo),
    };
    const intelligence: GraphEdgeIntelligence = {
      edgeId: edge.id,
      sourceId: edge.source,
      sourceLabel: sourceNode?.label ?? edge.source,
      targetId: edge.target,
      targetLabel: targetNode?.label ?? edge.target,
      relationship: edge.relationship,
      confidence: confidence ?? 0,
      narrative: edge.metrics?.narrative ?? 0,
      observability: edge.metrics?.observability ?? 0,
      infrastructure: edge.metrics?.infrastructure ?? 0,
      topology: edge.metrics?.topology ?? 0,
      geo: edge.metrics?.geo ?? 0,
      rationale: edge.rationale,
      entitySpecific: Object.freeze({
        endpoints: Object.freeze([endpoint(sourceNode, "SOURCE"), endpoint(targetNode, "TARGET")] as const),
        direction: Object.freeze({ kind: "DIRECTED", sourceId: edge.source, targetId: edge.target }),
        semantics: Object.freeze({ relationship: edge.relationship }),
        weight: Number.isFinite(edge.weight) ? available<number>(edge.weight) : notSupplied<number>(),
        provenance: provenance(undefined),
        evidence: evidence(undefined),
        rationale: Object.freeze([...new Set(edge.rationale)].sort()),
      }),
    };
    const selectionBinding = binding(context, "EDGE", edge.id, { intelligence, metricAvailability });
    return {
      kind: "EDGE",
      availability: { status: "AVAILABLE" },
      ...(selectionBinding === undefined ? {} : { binding: selectionBinding }),
      provenance: {
        sourceType: "CANONICAL_INVESTIGATION_GRAPH",
        sourceIds: [edge.id, edge.source, edge.target],
        derivation: "DETERMINISTIC_LOCAL_PROJECTION",
      },
      intelligenceOrigin: "DETERMINISTICALLY_DERIVED",
      intelligence,
      metricAvailability,
    };
  }

  const selectionBinding = binding(
    context,
    "CLUSTER",
    selection.clusterId,
    { clusterId: selection.clusterId },
  );
  return {
    kind: "CLUSTER",
    availability: { status: "AVAILABLE" },
    ...(selectionBinding === undefined ? {} : { binding: selectionBinding }),
    provenance: {
      sourceType: "CANONICAL_INVESTIGATION_GRAPH",
      sourceIds: [selection.clusterId],
      derivation: "DETERMINISTIC_LOCAL_PROJECTION",
    },
    intelligenceOrigin: "KNOWN_LOCALLY",
    clusterId: selection.clusterId,
  };
}
