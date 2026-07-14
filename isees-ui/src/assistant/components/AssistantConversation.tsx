// ============================================================
// AssistantConversation.tsx
// P38A
// OPERATOR ASSISTANT FOUNDATION
//
// Conversation presentation component.
//
// Pure presentation.
//
// No runtime.
// No adapters.
// No networking.
// No AI.
//
// FULL DROP-IN REPLACEMENT
// ============================================================

import type {

    AssistantMessage,

} from "../types/AssistantTypes";

import "./AssistantConversation.css";

export interface AssistantConversationProps {

    messages: AssistantMessage[];

}

export default function AssistantConversation({

    messages,

}: AssistantConversationProps) {

    if (messages.length === 0) {

        return (

            <div className="assistant-conversation">

                <div className="assistant-empty">

                    <div className="assistant-empty-title">

                        Operator Assistant

                    </div>

                    <div className="assistant-empty-text">

                        Begin a conversation with the active investigation.

                    </div>

                </div>

            </div>

        );

    }

    return (

        <div className="assistant-conversation">

            {messages.map(message => (

                <div

                    key={message.id}

                    className={`assistant-message assistant-${message.role}`}

                >

                    <div className="assistant-message-header">

                        <span className="assistant-role">

                            {formatRole(message.role)}

                        </span>

                        <span className="assistant-time">

                            {message.timestamp}

                        </span>

                    </div>

                    <div className="assistant-message-body">

                        {message.content}

                    </div>

                </div>

            ))}

        </div>

    );

}

function formatRole(

    role: AssistantMessage["role"]

): string {

    switch (role) {

        case "operator":

            return "Operator";

        case "assistant":

            return "Assistant";

        case "system":

            return "System";

        default:

            return role;

    }

}