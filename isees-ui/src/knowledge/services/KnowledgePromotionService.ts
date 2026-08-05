// ============================================================
// src/knowledge/services/KnowledgePromotionService.ts
// P53D
// COMPUTATIONAL KNOWLEDGE PROMOTION SERVICE
//
// Canonical orchestration service responsible for promoting
// Research artifacts into Computational Knowledge Objects.
//
// This service coordinates:
//
//     Workspace
//         ↓
//     Promotion Service
//         ↓
//     Knowledge Object Factory
//         ↓
//     Knowledge Runtime
//
// React never performs promotion directly.
//
// No React.
// No persistence.
// No networking.
// No AI.
//
// ============================================================

import {

  KnowledgeObjectFactory,

  type KnowledgeObjectCreateRequest,

} from "../factory/KnowledgeObjectFactory";

import type {

  KnowledgeObject,

} from "../model/KnowledgeObject";

import {

  knowledgeObjectRuntime,

} from "../runtime/KnowledgeObjectRuntime";

// ============================================================
// RESULT
// ============================================================

export interface KnowledgePromotionResult {

  success: boolean;

  object?: KnowledgeObject;

  message?: string;

}

// ============================================================
// SERVICE
// ============================================================

export class KnowledgePromotionService {

  // ==========================================================
  // PROMOTE
  // ==========================================================

  public static promote(

    request: KnowledgeObjectCreateRequest,

  ): KnowledgePromotionResult {

    if (

      request.title.trim().length === 0

    ) {

      return {

        success: false,

        message: "Knowledge Object title is required.",

      };

    }

    const object =

      KnowledgeObjectFactory.create(

        request,

      );

    knowledgeObjectRuntime.addObject(

      object,

    );

    return {

      success: true,

      object,

    };

  }

  // ==========================================================
  // PROMOTE MANY
  // ==========================================================

  public static promoteMany(

    requests: KnowledgeObjectCreateRequest[],

  ): KnowledgeObject[] {

    const promoted: KnowledgeObject[] = [];

    for (

      const request of requests

    ) {

      const result =

        this.promote(

          request,

        );

      if (

        result.success &&

        result.object

      ) {

        promoted.push(

          result.object,

        );

      }

    }

    return promoted;

  }

  // ==========================================================
  // VALIDATION
  // ==========================================================

  public static canPromote(

    request: KnowledgeObjectCreateRequest,

  ): boolean {

    return (

      request.title.trim().length > 0

    );

  }

}

// ============================================================
// END
// ============================================================