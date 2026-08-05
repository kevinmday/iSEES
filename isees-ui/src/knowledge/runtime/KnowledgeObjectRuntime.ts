// ============================================================
// src/knowledge/runtime/KnowledgeObjectRuntime.ts
// P53
// COMPUTATIONAL KNOWLEDGE OBJECT RUNTIME
//
// Deterministic runtime owning the operator's active
// Computational Knowledge Objects.
//
// React observes.
//
// Components subscribe.
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

  KnowledgeRuntimeStatus,

  type KnowledgeRuntime,
  type KnowledgeRuntimeListener,
  type KnowledgeRuntimeState,
  type KnowledgeRuntimeSubscription,

} from "./KnowledgeObjectRuntimeTypes";

// ============================================================
// RUNTIME
// ============================================================

export class KnowledgeObjectRuntime implements KnowledgeRuntime {

  private state: KnowledgeRuntimeState = {

    status: KnowledgeRuntimeStatus.READY,

    objects: [],

    revision: 0,

  };

  private readonly listeners = new Set<KnowledgeRuntimeListener>();

  // ==========================================================
  // STATE
  // ==========================================================

  public getState(): KnowledgeRuntimeState {

    return this.state;

  }

  public getObjects(): readonly KnowledgeObject[] {

    return this.state.objects;

  }

  public getObject(

    id: string,

  ): KnowledgeObject | undefined {

    return this.state.objects.find(

      object => object.identity.id === id,

    );

  }

  public hasObject(

    id: string,

  ): boolean {

    return this.getObject(id) !== undefined;

  }

  // ==========================================================
  // MUTATION
  // ==========================================================

  public setObjects(

    objects: KnowledgeObject[],

  ): void {

    this.state = {

      ...this.state,

      objects: [...objects],

      revision: this.state.revision + 1,

    };

    this.notify();

  }

  public addObject(

    object: KnowledgeObject,

  ): void {

    this.state = {

      ...this.state,

      objects: [

        ...this.state.objects,

        object,

      ],

      revision: this.state.revision + 1,

    };

    this.notify();

  }

  public updateObject(

    object: KnowledgeObject,

  ): void {

    this.state = {

      ...this.state,

      objects: this.state.objects.map(

        existing =>

          existing.identity.id === object.identity.id

            ? object

            : existing,

      ),

      revision: this.state.revision + 1,

    };

    this.notify();

  }

  public removeObject(

    id: string,

  ): void {

    this.state = {

      ...this.state,

      objects: this.state.objects.filter(

        object => object.identity.id !== id,

      ),

      revision: this.state.revision + 1,

    };

    this.notify();

  }

  public clear(): void {

    this.state = {

      ...this.state,

      objects: [],

      revision: this.state.revision + 1,

    };

    this.notify();

  }

  public getRevision(): number {

    return this.state.revision;

  }

  // ==========================================================
  // SUBSCRIPTIONS
  // ==========================================================

  public subscribe(

    listener: KnowledgeRuntimeListener,

  ): KnowledgeRuntimeSubscription {

    this.listeners.add(listener);

    listener(this.state);

    return {

      unsubscribe: () => {

        this.listeners.delete(listener);

      },

    };

  }

  // ==========================================================
  // INTERNAL
  // ==========================================================

  private notify(): void {

    for (const listener of this.listeners) {

      listener(this.state);

    }

  }

}

// ============================================================
// SINGLETON
// ============================================================

export const knowledgeObjectRuntime =
  new KnowledgeObjectRuntime();

// ============================================================
// END
// ============================================================