// ============================================================
// src/resolve/contracts/ResolveRuntimeContract.ts
//
// P55A
// RESOLVE RUNTIME CONTRACT
//
// Canonical deterministic computation contract.
//
// Resolve Runtime owns NO UI.
//
// Resolve Runtime owns NO React.
//
// Resolve Runtime owns NO persistence.
//
// Resolve Runtime owns NO networking.
//
// Resolve Runtime is responsible ONLY for deterministic
// computation of an Investigation Manifold.
//
// Every execution is replayable.
//
// Every execution is inspectable.
//
// Every execution is deterministic.
//
// ============================================================

import type { Investigation } from "../../investigation/investigationTypes";

import type { KnowledgeObject } from "../../knowledge/model/KnowledgeObject";

// ============================================================
// COMPUTATIONAL INPUT
// ============================================================

export interface ResolveComputationInput {

  // ----------------------------------------------------------
  // Investigation
  // ----------------------------------------------------------

  investigation: Investigation;

  // ----------------------------------------------------------
  // Computational Knowledge
  // ----------------------------------------------------------

  knowledgeObjects: readonly KnowledgeObject[];

  // ----------------------------------------------------------
  // Active Computational Layers
  // ----------------------------------------------------------

  activeLayers: readonly string[];

  // ----------------------------------------------------------
  // Temporal Context
  // ----------------------------------------------------------

  temporalContext: unknown;

  // ----------------------------------------------------------
  // Investigative Scale
  // ----------------------------------------------------------

  investigativeScale: unknown;

}

// ============================================================
// COMPUTATIONAL RESULT
// ============================================================

export interface ResolveComputationResult {

  success: boolean;

  executionId: string;

  startedAt: Date;

  completedAt: Date;

  manifold: unknown;

}

// ============================================================
// EXECUTION CONTRACT
// ============================================================

export interface ResolveRuntimeContract {

  execute(

    input: ResolveComputationInput,

  ): ResolveComputationResult;

}