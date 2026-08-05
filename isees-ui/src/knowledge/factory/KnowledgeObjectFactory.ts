// ============================================================
// src/knowledge/factory/KnowledgeObjectFactory.ts
// P53C
// COMPUTATIONAL KNOWLEDGE OBJECT FACTORY
//
// Canonical deterministic constructor for Computational
// Knowledge Objects.
//
// Every .knowledge artifact originates here.
//
// React observes.
//
// No React.
// No persistence.
// No networking.
// No AI.
//
// ============================================================

import type {

  KnowledgeObject,

} from "../model/KnowledgeObject";

import {

  KnowledgeObjectStatus,
  KnowledgeObjectType,

  type KnowledgeConfidence,
  type KnowledgeExportCapabilities,
  type KnowledgeGraphReference,
  type KnowledgeIdentity,
  type KnowledgeLifecycle,
  type KnowledgeMetadata,
  type KnowledgeProvenance,
  type KnowledgeRelationship,
  type KnowledgeRevision,
  type KnowledgeTag,

} from "../model/KnowledgeObjectTypes";

// ============================================================
// INPUT
// ============================================================

export interface KnowledgeObjectCreateRequest {

  title: string;

  description?: string;

  author?: string;

  type: KnowledgeObjectType;

  confidence?: number;

  tags?: string[];

  graph?: KnowledgeGraphReference[];

  relationships?: KnowledgeRelationship[];

  payload?: unknown;

}

// ============================================================
// FACTORY
// ============================================================

export class KnowledgeObjectFactory {

  // ==========================================================
  // CREATE
  // ==========================================================

  public static create(

    request: KnowledgeObjectCreateRequest,

  ): KnowledgeObject {

    const timestamp =

      new Date().toISOString();

    const identity: KnowledgeIdentity = {

      id: crypto.randomUUID(),

      createdAt: timestamp,

    };

    const metadata: KnowledgeMetadata = {

      title: request.title,

      description:

        request.description,

      author:

        request.author,

      version: "1.0.0",

    };

    const lifecycle: KnowledgeLifecycle = {

      status:

        KnowledgeObjectStatus.COLLECTED,

      revision: 1,

    };

    const confidence: KnowledgeConfidence = {

      value:

        request.confidence ?? 1.0,

    };

    const provenance: KnowledgeProvenance = {

      sourceId: "",

      sourceType: "PROMOTION",

      sourceRevision: 1,

      observedAt: timestamp,

      createdAt: timestamp,

      updatedAt: timestamp,

    };

    const revision: KnowledgeRevision = {

      revision: 1,

      timestamp,

    };

    const capabilities:
      KnowledgeExportCapabilities = {

        editable: true,

        publishable: true,

        projectable: true,

      };

    const tags: KnowledgeTag[] =

      (request.tags ?? []).map(

        tag => ({

          id: crypto.randomUUID(),

          label: tag,

        }),

      );

    return {

      identity,

      metadata,

      lifecycle,

      type: request.type,

      status:

        KnowledgeObjectStatus.COLLECTED,

      confidence,

      provenance,

      revision,

      graph:

        request.graph ?? [],

      relationships:

        request.relationships ?? [],

      tags,

      capabilities,

      payload:

        request.payload,

    };

  }

  // ==========================================================
  // CONVENIENCE
  // ==========================================================

  public static createEntity(

    title: string,

    description?: string,

  ): KnowledgeObject {

    return this.create({

      title,

      description,

      type:

        KnowledgeObjectType.ENTITY,

    });

  }

  public static createObservation(

    title: string,

    description?: string,

  ): KnowledgeObject {

    return this.create({

      title,

      description,

      type:

        KnowledgeObjectType.OBSERVATION,

    });

  }

  public static createEvidence(

    title: string,

    description?: string,

  ): KnowledgeObject {

    return this.create({

      title,

      description,

      type:

        KnowledgeObjectType.EVIDENCE,

    });

  }

  public static createNarrative(

    title: string,

    description?: string,

  ): KnowledgeObject {

    return this.create({

      title,

      description,

      type:

        KnowledgeObjectType.NARRATIVE,

    });

  }

  public static createHypothesis(

    title: string,

    description?: string,

  ): KnowledgeObject {

    return this.create({

      title,

      description,

      type:

        KnowledgeObjectType.HYPOTHESIS,

    });

  }

}

// ============================================================
// END
// ============================================================