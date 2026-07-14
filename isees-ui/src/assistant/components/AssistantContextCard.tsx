// ============================================================
// AssistantContextCard.tsx
// P38A
// OPERATOR ASSISTANT FOUNDATION
//
// Assistant Context presentation component.
//
// Displays the read-only operational context
// currently supplied to the Operator Assistant.
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

    AssistantContext,

} from "../context/AssistantContext";

import "./AssistantContextCard.css";

export interface AssistantContextCardProps {

    context: AssistantContext;

}

export default function AssistantContextCard({

    context,

}: AssistantContextCardProps) {

    return (

        <div className="assistant-context-card">

            <div className="assistant-context-title">

                Assistant Context

            </div>

            <ContextRow
                label="Workspace"
                value={context.workspace}
            />

            <ContextRow
                label="Investigation"
                value={context.investigation.name}
            />

            <ContextRow
                label="Focused Event"
                value={
                    context.focusedEvent?.label ??
                    "None"
                }
            />

            <ContextRow
                label="Selected Nodes"
                value={
                    String(
                        context.selection.selectedNodeIds.length
                    )
                }
            />

            <ContextRow
                label="Selected Edges"
                value={
                    String(
                        context.selection.selectedEdgeIds.length
                    )
                }
            />

            <ContextRow
                label="Active Layers"
                value={
                    context.layers.activeLayers.length > 0
                        ? context.layers.activeLayers.join(", ")
                        : "None"
                }
            />

            <ContextRow
                label="Corpus"
                value={
                    context.corpus.corpora.length > 0
                        ? context.corpus.corpora.join(", ")
                        : "None"
                }
            />

            <div className="assistant-context-footer">

                Read-only runtime context.

            </div>

        </div>

    );

}

interface ContextRowProps {

    label: string;

    value: string;

}

function ContextRow({

    label,

    value,

}: ContextRowProps) {

    return (

        <div className="assistant-context-row">

            <div className="assistant-context-label">

                {label}

            </div>

            <div className="assistant-context-value">

                {value}

            </div>

        </div>

    );

}