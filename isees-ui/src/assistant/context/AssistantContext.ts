// ============================================================
// AssistantContext.ts
// P38A
// OPERATOR ASSISTANT FOUNDATION
//
// Read-only Assistant context contract.
//
// This file defines the canonical operational context
// supplied to the Operator Assistant.
//
// No runtime implementation.
// No React.
// No adapters.
// No networking.
//
// FULL DROP-IN REPLACEMENT
// ============================================================

import type { WorkspaceMode } from "../../workspace/runtime/WorkspaceRuntimeTypes";

/**
 * Minimal investigation identity.
 *
 * Expanded later as needed.
 */
export interface AssistantInvestigationContext {

    id: string;

    name: string;

}

/**
 * Current focused event.
 */
export interface AssistantFocusedEventContext {

    id: string;

    label: string;

}

/**
 * Current graph selection.
 *
 * Assistant is intentionally ignorant of
 * graph implementation details.
 */
export interface AssistantSelectionContext {

    selectedNodeIds: string[];

    selectedEdgeIds: string[];

}

/**
 * Active workspace layers.
 *
 * Example:
 *
 * Timeline
 * Evidence
 * Communication
 * Sensor
 */
export interface AssistantLayerContext {

    activeLayers: string[];

}

/**
 * Corpus currently participating
 * in the investigation.
 */
export interface AssistantCorpusContext {

    corpora: string[];

}

/**
 * Everything the Assistant is allowed
 * to know about the current operator state.
 *
 * This object should be populated from
 * WorkspaceRuntime and passed to the
 * Operator Assistant.
 *
 * Canon Principle:
 *
 * WorkspaceRuntime owns context.
 *
 * The Assistant consumes context.
 */
export interface AssistantContext {

    /**
     * Current workspace.
     */
    workspace: WorkspaceMode;

    /**
     * Active investigation.
     */
    investigation: AssistantInvestigationContext;

    /**
     * Focused event.
     */
    focusedEvent?: AssistantFocusedEventContext;

    /**
     * Current graph selection.
     */
    selection: AssistantSelectionContext;

    /**
     * Enabled layers.
     */
    layers: AssistantLayerContext;

    /**
     * Active corpora.
     */
    corpus: AssistantCorpusContext;

}

/**
 * Read-only context passed into every
 * Assistant Adapter.
 */
export interface AssistantRequestContext {

    context: AssistantContext;

    prompt: string;

}

/**
 * Canonical design note.
 *
 * The Assistant never owns operational state.
 *
 * WorkspaceRuntime is the single source of truth.
 *
 * The Assistant receives a snapshot of the
 * current operational context and returns
 * an advisory response.
 */