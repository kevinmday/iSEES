// ============================================================

import type {
  EntityDossierFact,
  EntityDossierFactSourceLink,
  EntityDossierFieldAvailability,
  EntityDossierIdentity,
  EntityDossierRelationshipFact,
  EntityDossierSourceRecord,
} from "../knowledge/dossier/EntityDossierTypes.ts";
import type { OperationalDossierProfileProjection } from "../intelligence/selection/profiles/OperationalDossierProfileTypes.ts";
// src/graph/graphInteractionTypes.ts
// P26.0 INTERACTIVE TOPOLOGY FOUNDATION
// GRAPH INTERACTION CONTRACTS
// FULL DROP-IN FILE
// ============================================================

export interface GraphNodeSelection {

  nodeId: string;

  selectedAt: string;
}

export interface GraphEdgeSelection {

  edgeId: string;

  sourceId: string;

  targetId: string;

  selectedAt: string;
}

export interface GraphFocusState {

  centerNodeId: string | null;

  selectedNodeId: string | null;

  selectedEdgeId: string | null;
}

export interface GraphNodeIntelligence {

  nodeId: string;

  title: string;

  sourceType: string;

  confidence?: number;

  connectionCount: number;

  metadata?: Record<string, unknown>;

  readonly entitySpecific: NodeEntityIntelligence;
}

export interface GraphEdgeIntelligence {

  edgeId: string;

  sourceId: string;

  sourceLabel: string;

  targetId: string;

  targetLabel: string;

  relationship: string;

  confidence: number;

  narrative: number;

  observability: number;

  infrastructure: number;

  topology: number;

  geo: number;

  rationale: string[];

  readonly entitySpecific: EdgeEntityIntelligence;
}

export type IntelligenceFieldAvailability<T> =
  | Readonly<{ status: "AVAILABLE"; value: T }>
  | Readonly<{ status: "UNAVAILABLE"; reason: "NOT_SUPPLIED" }>;

export interface EntityIdentityProfile {
  readonly id: string;
  readonly label: string;
}

export interface EntityClassificationProfile {
  readonly projectedType: string;
  readonly canonicalType: IntelligenceFieldAvailability<string>;
  readonly iconType: IntelligenceFieldAvailability<string>;
}

export interface EntityProvenanceProfile {
  readonly sourceId: IntelligenceFieldAvailability<string>;
  readonly sourceType: IntelligenceFieldAvailability<string>;
  readonly sourceRevision: IntelligenceFieldAvailability<string | number>;
  readonly knowledgeRevision: IntelligenceFieldAvailability<string | number>;
  readonly lineage: IntelligenceFieldAvailability<Readonly<Record<string, unknown>> | readonly unknown[]>;
}

export interface EntityEvidenceProfile {
  readonly knowledgeClassification: IntelligenceFieldAvailability<string>;
  readonly epistemicStatus: IntelligenceFieldAvailability<string>;
  readonly reviewStatus: IntelligenceFieldAvailability<string>;
  readonly canonEffect: IntelligenceFieldAvailability<string>;
  readonly candidateEvidenceBoundary: "CANONICAL_OR_UNSPECIFIED" | "NON_CANONICAL_REVIEW_ONLY";
}

export interface EntityRelationshipSummaryItem {
  readonly edgeId: string;
  readonly direction: "INCOMING" | "OUTGOING" | "SELF";
  readonly relationship: string;
  readonly neighbor: EntityIdentityProfile;
  readonly neighborClassification: EntityClassificationProfile;
}

export interface EntityRelationshipSummary {
  readonly totalCount: number;
  readonly incomingCount: number;
  readonly outgoingCount: number;
  readonly selfCount: number;
  readonly returnedCount: number;
  readonly truncated: boolean;
  readonly items: readonly EntityRelationshipSummaryItem[];
}

export interface NodeEntityIntelligence {
  readonly identity: EntityIdentityProfile;
  readonly classification: EntityClassificationProfile;
  readonly investigationRole: "ISOLATED" | "TERMINAL" | "CONNECTOR" | "HUB";
  readonly provenance: EntityProvenanceProfile;
  readonly evidence: EntityEvidenceProfile;
  readonly relationships: EntityRelationshipSummary;
  readonly governedDossier: EntityDossierProjection;
}

export type EntityDossierProjectionUnavailableReason =
  | "NOT_REFERENCED"
  | "BINDING_CONTEXT_NOT_SUPPLIED"
  | "MALFORMED_REFERENCE"
  | "SCHEMA_MISMATCH"
  | "ENTITY_MISMATCH"
  | "REVISION_NOT_FOUND"
  | "HASH_MISMATCH"
  | "INVALID_GOVERNED_REVISION";

export type EntityDossierProjection =
  | Readonly<{
      availability: "UNAVAILABLE";
      reason: EntityDossierProjectionUnavailableReason;
    }>
  | Readonly<{
      availability: "AVAILABLE";
      schemaVersion: string;
      dossierRevisionId: string;
      scope: "GLOBAL_BASE" | "INVESTIGATION_OVERLAY";
      entityIdentity: EntityDossierIdentity;
      acceptedFacts: readonly EntityDossierFact[];
      relationshipFacts: readonly EntityDossierRelationshipFact[];
      sourceRecords: readonly EntityDossierSourceRecord[];
      sourceLinks: readonly EntityDossierFactSourceLink[];
      unavailableCategories: readonly EntityDossierFieldAvailability[];
      limitations: readonly { readonly limitationId: string; readonly code: string }[];
      operationalProfile: OperationalDossierProfileProjection;
      projectionFingerprint: string;
      binding: Readonly<{
        investigationId: string;
        manifoldRevisionId: string;
        nodeId: string;
        entityId: string;
        globalDossierRevisionId: string;
        investigationOverlayRevisionId?: string;
        effectiveDossierHash: string;
      }>;
    }>;

export interface EdgeEndpointProfile {
  readonly role: "SOURCE" | "TARGET";
  readonly identity: EntityIdentityProfile;
  readonly classification: EntityClassificationProfile;
}

export interface EdgeEntityIntelligence {
  readonly endpoints: readonly [EdgeEndpointProfile, EdgeEndpointProfile];
  readonly direction: Readonly<{ kind: "DIRECTED"; sourceId: string; targetId: string }>;
  readonly semantics: Readonly<{ relationship: string }>;
  readonly weight: IntelligenceFieldAvailability<number>;
  readonly provenance: EntityProvenanceProfile;
  readonly evidence: EntityEvidenceProfile;
  readonly rationale: readonly string[];
}

export interface GraphInteractionState {

  focus: GraphFocusState;

  selectedNode?: GraphNodeIntelligence;

  selectedEdge?: GraphEdgeIntelligence;
}
