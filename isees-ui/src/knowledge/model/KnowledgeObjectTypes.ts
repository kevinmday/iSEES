// ============================================================
// src/knowledge/model/KnowledgeObjectTypes.ts
// P53
// COMPUTATIONAL KNOWLEDGE OBJECT TYPES
//
// Canonical vocabulary describing deterministic Knowledge
// Objects within the Computational Knowledge Runtime.
//
// Knowledge Objects are immutable computational entities that
// emerge from observations, evidence, analysis, hypotheses,
// and authored computational artifacts.
//
// No React.
// No runtime.
// No persistence.
// No networking.
// No AI.
//
// ============================================================

// ============================================================
// KNOWLEDGE OBJECT TYPE
// ============================================================

export const KnowledgeObjectType = {

  OBSERVATION: "OBSERVATION",

  EVIDENCE: "EVIDENCE",

  FACT: "FACT",

  HYPOTHESIS: "HYPOTHESIS",

  NARRATIVE: "NARRATIVE",

  EVENT: "EVENT",

  ENTITY: "ENTITY",

  LOCATION: "LOCATION",

  PERSON: "PERSON",

  ORGANIZATION: "ORGANIZATION",

  ARTIFACT: "ARTIFACT",

  RELATIONSHIP: "RELATIONSHIP",

  INTENTION: "INTENTION",

  MODEL: "MODEL",

  DATASET: "DATASET",

  DOCUMENT: "DOCUMENT",

  REFERENCE: "REFERENCE",

  CUSTOM: "CUSTOM",

} as const;

export type KnowledgeObjectType =
  (typeof KnowledgeObjectType)[keyof typeof KnowledgeObjectType];

// ============================================================
// KNOWLEDGE OBJECT STATUS
// ============================================================

export const KnowledgeObjectStatus = {

  OBSERVED: "OBSERVED",

  COLLECTED: "COLLECTED",

  NORMALIZED: "NORMALIZED",

  ANALYZED: "ANALYZED",

  HYPOTHESIS: "HYPOTHESIS",

  VERIFIED: "VERIFIED",

  KNOWLEDGE: "KNOWLEDGE",

  PUBLISHED: "PUBLISHED",

  ARCHIVED: "ARCHIVED",

} as const;

export type KnowledgeObjectStatus =
  (typeof KnowledgeObjectStatus)[keyof typeof KnowledgeObjectStatus];

// ============================================================
// CONFIDENCE
// ============================================================

export interface KnowledgeConfidence {

  value: number;

  rationale?: string;

}

// ============================================================
// PROVENANCE
// ============================================================

export interface KnowledgeProvenance {

  sourceId: string;

  sourceType: string;

  sourceRevision: number;

  observedAt: string;

  createdAt: string;

  updatedAt: string;

}

// ============================================================
// GRAPH REFERENCE
// ============================================================

export interface KnowledgeGraphReference {

  id: string;

  type: string;

}

// ============================================================
// RELATIONSHIP
// ============================================================

export interface KnowledgeRelationship {

  id: string;

  type: string;

  targetId: string;

}

// ============================================================
// TAG
// ============================================================

export interface KnowledgeTag {

  id: string;

  label: string;

}

// ============================================================
// REVISION
// ============================================================

export interface KnowledgeRevision {

  revision: number;

  timestamp: string;

}

// ============================================================
// METADATA
// ============================================================

export interface KnowledgeMetadata {

  title: string;

  description?: string;

  author?: string;

  version: string;

}

// ============================================================
// IDENTITY
// ============================================================

export interface KnowledgeIdentity {

  id: string;

  createdAt: string;

}

// ============================================================
// LIFECYCLE
// ============================================================

export interface KnowledgeLifecycle {

  status: KnowledgeObjectStatus;

  revision: number;

}

// ============================================================
// EXPORT CAPABILITIES
// ============================================================

export interface KnowledgeExportCapabilities {

  projectable: boolean;

  publishable: boolean;

  editable: boolean;

}

// ============================================================
// END
// ============================================================