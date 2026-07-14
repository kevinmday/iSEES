// ============================================================
// AssistantAdapter.ts
// P38A
// OPERATOR ASSISTANT FOUNDATION
//
// Canonical Assistant Adapter contract.
//
// Every assistant implementation must satisfy this
// interface.
//
// Examples:
//
// • MockAssistantAdapter
// • OpenAIAdapter
// • OllamaAdapter
// • AnthropicAdapter
// • ReplayAdapter
// • DeterministicAdapter
//
// No implementation.
//
// FULL DROP-IN REPLACEMENT
// ============================================================

import type {

    AssistantConversation,
    AssistantMessage,
    AssistantSuggestion,

} from "../types/AssistantTypes";

import type {

    AssistantRequestContext,

} from "../context/AssistantContext";

/**
 * Response returned by every Assistant Adapter.
 *
 * This is intentionally simple.
 *
 * Future revisions may extend it with citations,
 * references, timing, token accounting, etc.
 */
export interface AssistantResponse {

    /**
     * Primary assistant reply.
     */
    message: AssistantMessage;

    /**
     * Optional follow-up suggestions.
     */
    suggestions?: AssistantSuggestion[];

}

/**
 * Canonical adapter contract.
 *
 * The Operator Assistant communicates only
 * through this interface.
 *
 * It has no knowledge of:
 *
 * • OpenAI
 * • Ollama
 * • Anthropic
 * • Gemini
 * • Local models
 * • Replay engines
 *
 * Every backend simply adapts to this API.
 */
export interface AssistantAdapter {

    /**
     * Human readable adapter name.
     *
     * Example:
     *
     * Mock Assistant
     * OpenAI GPT
     * Ollama
     */
    readonly name: string;

    /**
     * Whether this adapter is currently available.
     */
    isAvailable(): boolean;

    /**
     * Begin a new conversation.
     *
     * Canon:
     *
     * Adapters never own operational context.
     * Context is supplied on every request.
     */
    createConversation(): AssistantConversation;

    /**
     * Submit an operator prompt.
     *
     * Returns an advisory response.
     */
    send(

        request: AssistantRequestContext

    ): Promise<AssistantResponse>;

}

/**
 * Canonical design notes.
 *
 * ------------------------------------------------------------
 *
 * WorkspaceRuntime
 *        │
 *        ▼
 * AssistantContext
 *        │
 *        ▼
 * OperatorAssistant
 *        │
 *        ▼
 * AssistantAdapter
 *        │
 *        ▼
 * Any implementation
 *
 * ------------------------------------------------------------
 *
 * The Operator Assistant never communicates
 * directly with external AI systems.
 *
 * All communication occurs through this adapter.
 *
 * This preserves complete implementation
 * independence.
 *
 * The adapter is advisory only.
 *
 * It never owns canonical investigation state.
 *
 * ============================================================
 */