// ============================================================
// src/knowledge/model/KnowledgeObject.ts
// P53
// COMPUTATIONAL KNOWLEDGE OBJECT
//
// Canonical deterministic Knowledge Object.
//
// A Knowledge Object is the immutable computational unit owned
// by the Knowledge Runtime. It represents observations,
// evidence, hypotheses, entities, narratives, documents, and
// other computational knowledge.
//
// No React.
// No runtime.
// No persistence.
// No networking.
// No AI.
//
// ============================================================

import type {

  KnowledgeConfidence,
  KnowledgeExportCapabilities,
  KnowledgeGraphReference,
  KnowledgeIdentity,
  KnowledgeLifecycle,
  KnowledgeMetadata,
  KnowledgeObjectStatus,
  KnowledgeObjectType,
  KnowledgeProvenance,
  KnowledgeRelationship,
  KnowledgeRevision,
  KnowledgeTag,

} from "./KnowledgeObjectTypes";

// ============================================================
// KNOWLEDGE OBJECT
// ============================================================

export interface KnowledgeObject {

  identity: KnowledgeIdentity;

  metadata: KnowledgeMetadata;

  lifecycle: KnowledgeLifecycle;

  type: KnowledgeObjectType;

  status: KnowledgeObjectStatus;

  confidence: KnowledgeConfidence;

  provenance: KnowledgeProvenance;

  revision: KnowledgeRevision;

  graph: KnowledgeGraphReference[];

  relationships: KnowledgeRelationship[];

  tags: KnowledgeTag[];

  capabilities: KnowledgeExportCapabilities;

  payload: unknown;

}

// ============================================================
// KNOWLEDGE OBJECT COLLECTION
// ============================================================

export interface KnowledgeObjectCollection {

  objects: KnowledgeObject[];

}

// ============================================================
// KNOWLEDGE OBJECT SNAPSHOT
// ============================================================

export interface KnowledgeObjectSnapshot {

  revision: number;

  objects: KnowledgeObject[];

}

// ============================================================
// KNOWLEDGE OBJECT LOOKUP
// ============================================================

export type KnowledgeObjectIndex = Record<string, KnowledgeObject>;

// ============================================================
// END
// ============================================================