// ============================================================
// AssistantSuggestedActions.tsx
// P38A
// OPERATOR ASSISTANT FOUNDATION
//
// Suggested Action presentation component.
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

    AssistantSuggestion,

} from "../types/AssistantTypes";

import "./AssistantSuggestedActions.css";

export interface AssistantSuggestedActionsProps {

    suggestions: AssistantSuggestion[];

    onSuggestionSelected?: (

        suggestion: AssistantSuggestion

    ) => void;

}

export default function AssistantSuggestedActions({

    suggestions,

    onSuggestionSelected,

}: AssistantSuggestedActionsProps) {

    if (suggestions.length === 0) {

        return (

            <div className="assistant-suggestions">

                <div className="assistant-suggestions-title">

                    Suggested Actions

                </div>

                <div className="assistant-suggestions-empty">

                    No suggestions available.

                </div>

            </div>

        );

    }

    return (

        <div className="assistant-suggestions">

            <div className="assistant-suggestions-title">

                Suggested Actions

            </div>

            <div className="assistant-suggestion-list">

                {suggestions.map(suggestion => (

                    <button

                        key={suggestion.id}

                        type="button"

                        className="assistant-suggestion"

                        onClick={() =>

                            onSuggestionSelected?.(suggestion)

                        }

                    >

                        <div className="assistant-suggestion-label">

                            {suggestion.label}

                        </div>

                        {suggestion.description && (

                            <div className="assistant-suggestion-description">

                                {suggestion.description}

                            </div>

                        )}

                    </button>

                ))}

            </div>

        </div>

    );

}