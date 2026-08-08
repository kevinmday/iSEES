// ============================================================
// src/resolve/runtime/ResolveRuntimeTypes.ts
//
// P55A
// RESOLVE RUNTIME TYPES
//
// Canonical runtime contracts for Resolve–Dissolve Computation.
//
// Resolve Runtime owns ONLY deterministic computation lifecycle.
//
// It owns no UI.
// It owns no graph rendering.
// It owns no persistence.
// It owns no networking.
// It owns no AI inference.
//
// ============================================================

import type { Investigation } from "../../investigation/investigationTypes";
import type { KnowledgeObject } from "../../knowledge/model/KnowledgeObject";

// ============================================================
// RUNTIME STATUS
// ============================================================

export const ResolveRuntimeStatus = {

  INITIALIZING: "INITIALIZING",

  READY: "READY",

  EXECUTING: "EXECUTING",

  COMPLETE: "COMPLETE",

  ERROR: "ERROR",

} as const;

export type ResolveRuntimeStatus =

  (typeof ResolveRuntimeStatus)[

    keyof typeof ResolveRuntimeStatus

  ];
// ============================================================
// COMPUTATIONAL INPUT
// ============================================================

export interface ResolveComputationInput {

  investigation: Investigation;

  knowledgeObjects: readonly KnowledgeObject[];

  activeLayers: readonly string[];

  temporalContext: unknown;

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
// EXECUTION RECORD
// ============================================================

export interface ResolveExecutionRecord {

  executionId: string;

  startedAt: Date;

  completedAt?: Date;

  input: ResolveComputationInput;

  result?: ResolveComputationResult;

}

// ============================================================
// RUNTIME STATE
// ============================================================

export interface ResolveRuntimeState {

  status: ResolveRuntimeStatus;

  currentExecution?: ResolveExecutionRecord;

  history: readonly ResolveExecutionRecord[];

  revision: number;

}

// ============================================================
// RUNTIME CONTRACT
// ============================================================

export interface ResolveRuntime {

  initialize(): void;

  execute(
    input: ResolveComputationInput,
  ): ResolveComputationResult;

  getState(): ResolveRuntimeState;

  subscribe(
    listener: () => void,
  ): () => void;

  dispose(): void;

}