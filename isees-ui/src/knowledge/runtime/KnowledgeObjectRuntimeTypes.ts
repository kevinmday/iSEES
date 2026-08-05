// ============================================================
// src/knowledge/runtime/KnowledgeObjectRuntimeTypes.ts
// P53
// COMPUTATIONAL KNOWLEDGE RUNTIME TYPES
//
// Shared runtime contracts for the deterministic Knowledge
// Runtime.
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

// ============================================================
// RUNTIME STATUS
// ============================================================

export const KnowledgeRuntimeStatus = {

  INITIALIZING: "INITIALIZING",

  READY: "READY",

  ACTIVE: "ACTIVE",

} as const;

export type KnowledgeRuntimeStatus =
  (typeof KnowledgeRuntimeStatus)[keyof typeof KnowledgeRuntimeStatus];

// ============================================================
// RUNTIME STATE
// ============================================================

export interface KnowledgeRuntimeState {

  status: KnowledgeRuntimeStatus;

  objects: KnowledgeObject[];

  revision: number;

}

// ============================================================
// LISTENER
// ============================================================

export type KnowledgeRuntimeListener = (

  state: KnowledgeRuntimeState

) => void;

// ============================================================
// SUBSCRIPTION
// ============================================================

export interface KnowledgeRuntimeSubscription {

  unsubscribe(): void;

}

// ============================================================
// RUNTIME CONTRACT
// ============================================================

export interface KnowledgeRuntime {

  getState(): KnowledgeRuntimeState;

  getObjects(): readonly KnowledgeObject[];

  getObject(

    id: string,

  ): KnowledgeObject | undefined;

  hasObject(

    id: string,

  ): boolean;

  setObjects(

    objects: KnowledgeObject[],

  ): void;

  addObject(

    object: KnowledgeObject,

  ): void;

  updateObject(

    object: KnowledgeObject,

  ): void;

  removeObject(

    id: string,

  ): void;

  clear(): void;

  getRevision(): number;

  subscribe(

    listener: KnowledgeRuntimeListener,

  ): KnowledgeRuntimeSubscription;

}

// ============================================================
// END
// ============================================================