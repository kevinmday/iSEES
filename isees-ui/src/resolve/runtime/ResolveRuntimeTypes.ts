// ============================================================
// src/resolve/runtime/ResolveRuntimeTypes.ts
//
// P55B
// RESOLVE RUNTIME TYPES
//
// Canonical runtime contracts for Resolve-Dissolve Computation.
//
// Resolve Runtime owns deterministic computation lifecycle.
//
// Runtime responsibilities:
//
//   • execution identity
//   • execution timestamps
//   • execution lifecycle
//   • execution history
//   • runtime publication
//   • delegation to Resolve Engine
//
// Runtime explicitly owns NO:
//
//   • UI
//   • graph rendering
//   • persistence
//   • networking
//   • AI inference
//   • heuristic reasoning
//
// Computation itself belongs to Resolve Engine.
//
// ============================================================

import type {
  Investigation,
} from "../../investigation/investigationTypes";

import type {
  KnowledgeObject,
} from "../../knowledge/model/KnowledgeObject";

import type {
  CanonicalManifold,
} from "../engine/ResolveEngineTypes";

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
//
// Runtime result combines:
//
//   deterministic computational output
//
// with:
//
//   nondeterministic execution metadata.
//
// The manifold itself is produced exclusively by ResolveEngine.
//
// canonicalRepresentation is the stable serialized form of the
// deterministic manifold and becomes the substrate for P55B
// fingerprinting and replay verification.
//
// ============================================================

export interface ResolveComputationResult {

  success: boolean;

  executionId: string;

  startedAt: Date;

  completedAt: Date;

  manifold: CanonicalManifold;

  canonicalRepresentation: string;

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

// ============================================================
// END
// ============================================================