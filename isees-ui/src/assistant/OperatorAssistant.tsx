// ============================================================
// OperatorAssistant.tsx
// P38A
// OPERATOR ASSISTANT FOUNDATION
//
// Root Operator Assistant component.
//
// Canon v1
//
// Presentation only.
//
// No WorkspaceRuntime.
// No AI.
// No networking.
// No adapters beyond the injected interface.
//
// FULL DROP-IN REPLACEMENT
// ============================================================

import { useMemo, useState } from "react";

import type {

    AssistantMessage,
    AssistantSuggestion,

} from "./types/AssistantTypes";

import type {

    AssistantContext,

} from "./context/AssistantContext";

import type {

    AssistantAdapter,

} from "./adapters/AssistantAdapter";

import {

    MockAssistantAdapter,

} from "./adapters/MockAssistantAdapter";

import AssistantConversation from "./components/AssistantConversation";
import AssistantSuggestedActions from "./components/AssistantSuggestedActions";
import AssistantContextCard from "./components/AssistantContextCard";

import "./OperatorAssistant.css";

export interface OperatorAssistantProps {

    context: AssistantContext;

    adapter?: AssistantAdapter;

}

export default function OperatorAssistant({

    context,

    adapter,

}: OperatorAssistantProps) {

    const assistant = useMemo<AssistantAdapter>(

        () => adapter ?? new MockAssistantAdapter(),

        [adapter]

    );

    const [messages, setMessages] = useState<AssistantMessage[]>([]);

    const [suggestions, setSuggestions] = useState<AssistantSuggestion[]>([]);

    const [prompt, setPrompt] = useState("");

    async function submitPrompt(

        value: string

    ) {

        const text = value.trim();

        if (!text) {

            return;

        }

        const operatorMessage: AssistantMessage = {

            id: crypto.randomUUID(),

            role: "operator",

            timestamp: new Date().toISOString(),

            content: text,

        };

        setMessages(previous => [

            ...previous,

            operatorMessage,

        ]);

        setPrompt("");

        const response = await assistant.send({

            context,

            prompt: text,

        });

        setMessages(previous => [

            ...previous,

            response.message,

        ]);

        setSuggestions(

            response.suggestions ?? []

        );

    }

    function handleSuggestion(

        suggestion: AssistantSuggestion

    ) {

        void submitPrompt(

            suggestion.label

        );

    }

    function handleKeyDown(

        event: React.KeyboardEvent<HTMLInputElement>

    ) {

        if (event.key !== "Enter") {

            return;

        }

        event.preventDefault();

        void submitPrompt(prompt);

    }

    return (

        <div className="operator-assistant">

            <div className="operator-assistant-header">

                <div className="operator-assistant-title">

                    Operator Assistant

                </div>

                <div className="operator-assistant-subtitle">

                    Advisory • Read-Only • Glass-Box

                </div>

            </div>

            <AssistantContextCard

                context={context}

            />

            <AssistantSuggestedActions

                suggestions={suggestions}

                onSuggestionSelected={handleSuggestion}

            />

            <AssistantConversation

                messages={messages}

            />

            <div className="operator-assistant-input">

                <input

                    type="text"

                    value={prompt}

                    placeholder="Ask the investigation..."

                    onChange={event =>

                        setPrompt(event.target.value)

                    }

                    onKeyDown={handleKeyDown}

                />

                <button

                    type="button"

                    disabled={!assistant.isAvailable()}

                    onClick={() =>

                        void submitPrompt(prompt)

                    }

                >

                    Send

                </button>

            </div>

        </div>

    );

}