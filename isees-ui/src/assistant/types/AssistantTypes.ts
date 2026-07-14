// ============================================================
// AssistantTypes.ts
// P38A
// OPERATOR ASSISTANT FOUNDATION
//
// Canonical Assistant type definitions.
//
// Presentation + contracts only.
//
// No runtime.
// No adapters.
// No AI.
// No networking.
//
// FULL DROP-IN REPLACEMENT
// ============================================================

/**
 * Every assistant message has an explicit origin.
 * Nothing is anonymous.
 */
export type AssistantRole =
    | "operator"
    | "assistant"
    | "system";

/**
 * The authority level of the assistant.
 *
 * Canon v1:
 *
 * The assistant is advisory only.
 */
export type AssistantAuthority =
    | "advisory"
    | "read-only"
    | "canonical";

/**
 * Message displayed inside the conversation surface.
 */
export interface AssistantMessage {

    id: string;

    role: AssistantRole;

    content: string;

    timestamp: string;

}

/**
 * Quick action chip shown above the conversation.
 */
export interface AssistantSuggestion {

    id: string;

    label: string;

    description?: string;

}

/**
 * Current operational identity of the assistant.
 *
 * This changes depending on Workspace Mode.
 *
 * Example:
 *
 * Research Analyst
 * Evidence Analyst
 * Operations Officer
 * Technical Writer
 */
export interface AssistantIdentity {

    /**
     * Human readable title.
     */
    title: string;

    /**
     * Assistant role description.
     */
    role: string;

    /**
     * Explicit authority.
     */
    authority: AssistantAuthority;

    /**
     * Whether the assistant may
     * directly modify canonical state.
     *
     * Canon v1:
     *
     * Always false.
     */
    mayWriteCanon: boolean;

}

/**
 * Root conversation state.
 *
 * Runtime independent.
 */
export interface AssistantConversation {

    messages: AssistantMessage[];

    suggestions: AssistantSuggestion[];

}

/**
 * Static placeholder used during
 * scaffold development.
 */
export const DEFAULT_ASSISTANT_IDENTITY: AssistantIdentity = {

    title: "Operator Assistant",

    role: "Research Analyst",

    authority: "advisory",

    mayWriteCanon: false,

};

/**
 * Empty conversation state.
 */
export const EMPTY_CONVERSATION: AssistantConversation = {

    messages: [],

    suggestions: [],

};