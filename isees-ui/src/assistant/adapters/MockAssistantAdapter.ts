// ============================================================
// MockAssistantAdapter.ts
// P38A
// OPERATOR ASSISTANT FOUNDATION
//
// Deterministic mock implementation.
//
// Presentation scaffold only.
//
// No AI.
// No networking.
// No runtime ownership.
//
// FULL DROP-IN REPLACEMENT
// ============================================================

import type {

    AssistantAdapter,
    AssistantResponse,

} from "./AssistantAdapter";

import type {

    AssistantRequestContext,

} from "../context/AssistantContext";

import type {

    AssistantConversation,

} from "../types/AssistantTypes";

import {

    EMPTY_CONVERSATION,

} from "../types/AssistantTypes";

/**
 * Deterministic scaffold implementation.
 *
 * This adapter simply echoes supplied context.
 *
 * It exists only to validate the Operator
 * Assistant architecture before introducing
 * any AI integration.
 */
export class MockAssistantAdapter implements AssistantAdapter {

    public readonly name = "Mock Assistant";

    /**
     * Mock adapter is always available.
     */
    public isAvailable(): boolean {

        return true;

    }

    /**
     * Begin an empty conversation.
     */
    public createConversation(): AssistantConversation {

        return {

            ...EMPTY_CONVERSATION,

            messages: [...EMPTY_CONVERSATION.messages],

            suggestions: [...EMPTY_CONVERSATION.suggestions],

        };

    }

    /**
     * Deterministic canned response.
     *
     * No inference.
     * No networking.
     * No external systems.
     */
    public async send(

        request: AssistantRequestContext

    ): Promise<AssistantResponse> {

        const {

            workspace,
            investigation,
            focusedEvent,

        } = request.context;

        const message = {

            id: crypto.randomUUID(),

            role: "assistant" as const,

            timestamp: new Date().toISOString(),

            content:
`Mock Assistant

Context successfully received.

Workspace:
${workspace}

Investigation:
${investigation.name}

Focused Event:
${focusedEvent?.label ?? "None"}

Prompt:
${request.prompt}

This is a deterministic scaffold response.

No AI model was invoked.`,

        };

        return {

            message,

            suggestions: [

                {

                    id: "compare",

                    label: "Compare Investigations",

                    description:
                        "Placeholder suggestion.",

                },

                {

                    id: "summary",

                    label: "Generate Summary",

                    description:
                        "Placeholder suggestion.",

                },

                {

                    id: "research",

                    label: "Research Literature",

                    description:
                        "Placeholder suggestion.",

                },

            ],

        };

    }

}