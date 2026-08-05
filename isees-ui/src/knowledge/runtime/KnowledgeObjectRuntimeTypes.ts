// ============================================================
// src/knowledge/runtime/KnowledgeObjectRuntimeTypes.ts
// P53A
// COMPUTATIONAL KNOWLEDGE RUNTIME TYPES
//
// Shared runtime contracts for the deterministic Knowledge
// Runtime.
//
// Owns operator navigation.
//
// Owns operator selection.
//
// Owns operator inspection.
//
// Owns computational state.
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
// VIEW MODE
// ============================================================

export const KnowledgeViewMode = {

  LIST: "LIST",

  GRAPH: "GRAPH",

  HIERARCHY: "HIERARCHY",

  TIMELINE: "TIMELINE",

} as const;

export type KnowledgeViewMode =
  (typeof KnowledgeViewMode)[keyof typeof KnowledgeViewMode];

// ============================================================
// SORT MODE
// ============================================================

export const KnowledgeSortMode = {

  TITLE: "TITLE",

  TYPE: "TYPE",

  CREATED: "CREATED",

  UPDATED: "UPDATED",

} as const;

export type KnowledgeSortMode =
  (typeof KnowledgeSortMode)[keyof typeof KnowledgeSortMode];

// ============================================================
// FILTER
// ============================================================

export interface KnowledgeRuntimeFilter {

  types: string[];

  statuses: string[];

  tags: string[];

}

// ============================================================
// RUNTIME STATE
// ============================================================

export interface KnowledgeRuntimeState {

  // ----------------------------------------------------------
  // Runtime
  // ----------------------------------------------------------

  status: KnowledgeRuntimeStatus;

  revision: number;

  // ----------------------------------------------------------
  // Knowledge Objects
  // ----------------------------------------------------------

  objects: KnowledgeObject[];

  // ----------------------------------------------------------
  // Operator Navigation
  // ----------------------------------------------------------

  activeObjectId?: string;

  inspectionObjectId?: string;

  selectedObjectIds: string[];

  expandedObjectIds: string[];

  // ----------------------------------------------------------
  // Presentation
  // ----------------------------------------------------------

  searchText: string;

  viewMode: KnowledgeViewMode;

  sortMode: KnowledgeSortMode;

  filter: KnowledgeRuntimeFilter;

}

// ============================================================
// LISTENER
// ============================================================

export type KnowledgeRuntimeListener = (

  state: KnowledgeRuntimeState,

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

  // ----------------------------------------------------------
  // State
  // ----------------------------------------------------------

  getState(): KnowledgeRuntimeState;

  getRevision(): number;

  // ----------------------------------------------------------
  // Knowledge Objects
  // ----------------------------------------------------------

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

  // ----------------------------------------------------------
  // Navigation
  // ----------------------------------------------------------

  getActiveObjectId(): string | undefined;

  setActiveObject(

    id?: string,

  ): void;

  getInspectionObjectId(): string | undefined;

  setInspectionObject(

    id?: string,

  ): void;

  getSelectedObjectIds(): readonly string[];

  selectObject(

    id: string,

  ): void;

  deselectObject(

    id: string,

  ): void;

  clearSelection(): void;

  getExpandedObjectIds(): readonly string[];

  expandObject(

    id: string,

  ): void;

  collapseObject(

    id: string,

  ): void;

  toggleExpandedObject(

    id: string,

  ): void;

  // ----------------------------------------------------------
  // Presentation
  // ----------------------------------------------------------

  getSearchText(): string;

  setSearchText(

    text: string,

  ): void;

  getViewMode(): KnowledgeViewMode;

  setViewMode(

    mode: KnowledgeViewMode,

  ): void;

  getSortMode(): KnowledgeSortMode;

  setSortMode(

    mode: KnowledgeSortMode,

  ): void;

  getFilter(): KnowledgeRuntimeFilter;

  setFilter(

    filter: KnowledgeRuntimeFilter,

  ): void;

  clearFilter(): void;

  // ----------------------------------------------------------
  // Events
  // ----------------------------------------------------------

  subscribe(

    listener: KnowledgeRuntimeListener,

  ): KnowledgeRuntimeSubscription;

}

// ============================================================
// END
// ============================================================