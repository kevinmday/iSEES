// ============================================================
// src/knowledge/runtime/KnowledgeObjectRuntime.ts
// P53A
// COMPUTATIONAL KNOWLEDGE OBJECT RUNTIME
//
// Deterministic runtime owning the operator's
// Computational Knowledge Objects.
//
// Owns navigation.
//
// Owns selection.
//
// Owns inspection.
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
  KnowledgeSortMode,
  KnowledgeViewMode,

  type KnowledgeRuntime,
  type KnowledgeRuntimeFilter,
  type KnowledgeRuntimeListener,
  type KnowledgeRuntimeState,
  type KnowledgeRuntimeSubscription,

} from "./KnowledgeObjectRuntimeTypes";

// ============================================================
// RUNTIME
// ============================================================

export class KnowledgeObjectRuntime implements KnowledgeRuntime {

  private state: KnowledgeRuntimeState = {

    // --------------------------------------------------------
    // Runtime
    // --------------------------------------------------------

    status: KnowledgeRuntimeStatus.READY,

    revision: 0,

    // --------------------------------------------------------
    // Objects
    // --------------------------------------------------------

    objects: [],

    // --------------------------------------------------------
    // Navigation
    // --------------------------------------------------------

    activeObjectId: undefined,

    inspectionObjectId: undefined,

    selectedObjectIds: [],

    expandedObjectIds: [],

    // --------------------------------------------------------
    // Presentation
    // --------------------------------------------------------

    searchText: "",

    viewMode: KnowledgeViewMode.LIST,

    sortMode: KnowledgeSortMode.TITLE,

    filter: {

      types: [],

      statuses: [],

      tags: [],

    },

  };

  private readonly listeners =
    new Set<KnowledgeRuntimeListener>();

  // ==========================================================
  // STATE
  // ==========================================================

  public getState(): KnowledgeRuntimeState {

    return this.state;

  }

  public getRevision(): number {

    return this.state.revision;

  }

  // ==========================================================
  // OBJECTS
  // ==========================================================

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

      activeObjectId:

        this.state.activeObjectId === id

          ? undefined

          : this.state.activeObjectId,

      inspectionObjectId:

        this.state.inspectionObjectId === id

          ? undefined

          : this.state.inspectionObjectId,

      selectedObjectIds:

        this.state.selectedObjectIds.filter(

          value => value !== id,

        ),

      expandedObjectIds:

        this.state.expandedObjectIds.filter(

          value => value !== id,

        ),

      revision: this.state.revision + 1,

    };

    this.notify();

  }

  public clear(): void {

    this.state = {

      ...this.state,

      objects: [],

      activeObjectId: undefined,

      inspectionObjectId: undefined,

      selectedObjectIds: [],

      expandedObjectIds: [],

      revision: this.state.revision + 1,

    };

    this.notify();

  }

  // ==========================================================
  // ACTIVE
  // ==========================================================

  public getActiveObjectId(): string | undefined {

    return this.state.activeObjectId;

  }

  public setActiveObject(

    id?: string,

  ): void {

    this.state = {

      ...this.state,

      activeObjectId: id,

      revision: this.state.revision + 1,

    };

    this.notify();

  }

  // ==========================================================
  // INSPECTION
  // ==========================================================

  public getInspectionObjectId(): string | undefined {

    return this.state.inspectionObjectId;

  }

  public setInspectionObject(

    id?: string,

  ): void {

    this.state = {

      ...this.state,

      inspectionObjectId: id,

      revision: this.state.revision + 1,

    };

    this.notify();

  }

  // ==========================================================
  // SELECTION
  // ==========================================================

  public getSelectedObjectIds(): readonly string[] {

    return this.state.selectedObjectIds;

  }

  public selectObject(

    id: string,

  ): void {

    if (

      this.state.selectedObjectIds.includes(id)

    ) {

      return;

    }

    this.state = {

      ...this.state,

      selectedObjectIds: [

        ...this.state.selectedObjectIds,

        id,

      ],

      revision: this.state.revision + 1,

    };

    this.notify();

  }

  public deselectObject(

    id: string,

  ): void {

    this.state = {

      ...this.state,

      selectedObjectIds:

        this.state.selectedObjectIds.filter(

          value => value !== id,

        ),

      revision: this.state.revision + 1,

    };

    this.notify();

  }

  public clearSelection(): void {

    this.state = {

      ...this.state,

      selectedObjectIds: [],

      revision: this.state.revision + 1,

    };

    this.notify();

  }

  // ==========================================================
  // EXPANSION
  // ==========================================================

  public getExpandedObjectIds(): readonly string[] {

    return this.state.expandedObjectIds;

  }

  public expandObject(

    id: string,

  ): void {

    if (

      this.state.expandedObjectIds.includes(id)

    ) {

      return;

    }

    this.state = {

      ...this.state,

      expandedObjectIds: [

        ...this.state.expandedObjectIds,

        id,

      ],

      revision: this.state.revision + 1,

    };

    this.notify();

  }

  public collapseObject(

    id: string,

  ): void {

    this.state = {

      ...this.state,

      expandedObjectIds:

        this.state.expandedObjectIds.filter(

          value => value !== id,

        ),

      revision: this.state.revision + 1,

    };

    this.notify();

  }

  public toggleExpandedObject(

    id: string,

  ): void {

    if (

      this.state.expandedObjectIds.includes(id)

    ) {

      this.collapseObject(id);

      return;

    }

    this.expandObject(id);

  }

  // ==========================================================
  // SEARCH
  // ==========================================================

  public getSearchText(): string {

    return this.state.searchText;

  }

  public setSearchText(

    text: string,

  ): void {

    this.state = {

      ...this.state,

      searchText: text,

      revision: this.state.revision + 1,

    };

    this.notify();

  }

  // ==========================================================
  // VIEW
  // ==========================================================

  public getViewMode(): KnowledgeViewMode {

    return this.state.viewMode;

  }

  public setViewMode(

    mode: KnowledgeViewMode,

  ): void {

    this.state = {

      ...this.state,

      viewMode: mode,

      revision: this.state.revision + 1,

    };

    this.notify();

  }

  // ==========================================================
  // SORT
  // ==========================================================

  public getSortMode(): KnowledgeSortMode {

    return this.state.sortMode;

  }

  public setSortMode(

    mode: KnowledgeSortMode,

  ): void {

    this.state = {

      ...this.state,

      sortMode: mode,

      revision: this.state.revision + 1,

    };

    this.notify();

  }

  // ==========================================================
  // FILTER
  // ==========================================================

  public getFilter(): KnowledgeRuntimeFilter {

    return this.state.filter;

  }

  public setFilter(

    filter: KnowledgeRuntimeFilter,

  ): void {

    this.state = {

      ...this.state,

      filter,

      revision: this.state.revision + 1,

    };

    this.notify();

  }

  public clearFilter(): void {

    this.state = {

      ...this.state,

      filter: {

        types: [],

        statuses: [],

        tags: [],

      },

      revision: this.state.revision + 1,

    };

    this.notify();

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