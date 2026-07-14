// ============================================================
// ResearchWorkspace.tsx
// P38A
// RESEARCH WORKSPACE
//
// First Operator Assistant integration.
//
// Static presentation only.
//
// No WorkspaceRuntime integration.
// No AI.
// No networking.
// No graph changes.
//
// FULL DROP-IN REPLACEMENT
// ============================================================

import OperatorAssistant from "../../assistant/OperatorAssistant";

import type {

    AssistantContext,

} from "../../assistant/context/AssistantContext";

const assistantContext: AssistantContext = {

    workspace: "RESEARCH",

    investigation: {

        id: "INV-NIMITZ",

        name: "Nimitz Investigation",

    },

    focusedEvent: {

        id: "E-TICTAC-2004",

        label: "E-TICTAC-2004",

    },

    selection: {

        selectedNodeIds: [],

        selectedEdgeIds: [],

    },

    layers: {

        activeLayers: [

            "Evidence",

            "Timeline",

        ],

    },

    corpus: {

        corpora: [

            "System Canon",

        ],

    },

};

export default function ResearchWorkspace() {

    return (

        <div
            style={{
                display: "flex",
                flexDirection: "column",
                gap: 24,
                padding: 32,
                height: "100%",
                overflow: "auto",
                color: "#e2e8f0",
            }}
        >

            <div>

                <div
                    style={{
                        fontSize: 28,
                        fontWeight: 700,
                    }}
                >
                    Research Workspace
                </div>

                <div
                    style={{
                        marginTop: 6,
                        color: "#94a3b8",
                        fontSize: 15,
                    }}
                >
                    Explore external knowledge, compare investigations,
                    develop hypotheses, and generate advisory research.
                    The Operator Assistant is advisory only and never
                    modifies the canonical investigation.
                </div>

            </div>

            <OperatorAssistant

                context={assistantContext}

            />

        </div>

    );

}