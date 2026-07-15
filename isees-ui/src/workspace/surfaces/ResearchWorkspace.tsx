// ============================================================
// ResearchWorkspace.tsx
// P38A.1
// RESEARCH DOCUMENT FOUNDATION
//
// Canon v1
//
// The Research workspace is the professional
// authoring environment of iSEES.
//
// The primary object is the Research Document.
//
// The Operator Assistant is advisory only.
//
// Static presentation.
//
// No WorkspaceRuntime integration.
// No AI.
// No networking.
// No persistence.
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
                gap: 32,
                height: "100%",
                padding: 32,
                overflow: "hidden",
                color: "#e2e8f0",
                boxSizing: "border-box",
            }}
        >

            {/* =====================================================
                RESEARCH DOCUMENT
            ====================================================== */}

            <div
                style={{
                    flex: 1,
                    display: "flex",
                    flexDirection: "column",
                    minWidth: 0,
                    overflow: "auto",
                    gap: 24,
                }}
            >

                {/* ==============================================
                    WORKSPACE INTRODUCTION
                =============================================== */}

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
                            maxWidth: 760,
                            lineHeight: 1.6,
                        }}
                    >
                        Create investigator-authored research products
                        derived from the canonical investigation.
                        The investigation remains the source of truth.
                        Research Documents capture interpretation,
                        analysis, conclusions, and publication-ready
                        artifacts without modifying canonical evidence.
                    </div>

                </div>

                {/* ==============================================
                    RESEARCH DOCUMENT
                =============================================== */}

                <div
                    style={{
                        display: "flex",
                        flexDirection: "column",
                        background: "#111827",
                        border: "1px solid #334155",
                        borderRadius: 12,
                        overflow: "hidden",
                    }}
                >

                    {/* ==========================================
                        DOCUMENT HEADER
                    =========================================== */}

                    <div
                        style={{
                            padding: "28px 32px",
                            borderBottom: "1px solid #334155",
                        }}
                    >

                        <div
                            style={{
                                fontSize: 26,
                                fontWeight: 700,
                                marginBottom: 18,
                            }}
                        >
                            Untitled Research Document
                        </div>

                        <div
                            style={{
                                display: "grid",
                                gridTemplateColumns: "repeat(2, minmax(220px, 1fr))",
                                gap: "8px 32px",
                                fontSize: 14,
                            }}
                        >

                            <MetadataRow
                                label="Author"
                                value="Operator"
                            />

                            <MetadataRow
                                label="Status"
                                value="Draft"
                            />

                            <MetadataRow
                                label="Investigation"
                                value="Nimitz Investigation"
                            />

                            <MetadataRow
                                label="Focused Event"
                                value="E-TICTAC-2004"
                            />

                            <MetadataRow
                                label="Source Revision"
                                value="Current Canon"
                            />

                            <MetadataRow
                                label="Document Revision"
                                value="Revision 0"
                            />

                        </div>

                    </div>

                    {/* ==========================================
                        DOCUMENT BODY
                    =========================================== */}

                    <div
                        style={{
                            padding: "36px 48px",
                            display: "flex",
                            flexDirection: "column",
                            gap: 36,
                            minHeight: 900,
                        }}
                    >

                        <Section
                            title="Executive Summary"
                            text="Summarize the investigation, major findings, confidence, intended audience, and key operational conclusions."
                        />

                        <Section
                            title="Background"
                            text="Provide historical context, investigative scope, operational setting, and relevant prior work."
                        />

                        <Section
                            title="Evidence"
                            text="Describe supporting observations, witness testimony, sensor data, imagery, documents, and referenced artifacts."
                        />

                        <Section
                            title="Analysis"
                            text="Develop interpretations, compare competing hypotheses, identify contradictions, discuss confidence, and document analytical reasoning."
                        />

                        <Section
                            title="Conclusions"
                            text="Present investigator conclusions while preserving explicit separation between interpretation and canonical investigation data."
                        />

                        <Section
                            title="References"
                            text="Future citation manager, bibliography, provenance tracking, linked evidence, and external publications."
                        />

                    </div>

                    {/* ==========================================
                        DOCUMENT TOOLBAR
                    =========================================== */}

                    <div
                        style={{
                            display: "flex",
                            flexWrap: "wrap",
                            gap: 12,
                            padding: "18px 24px",
                            borderTop: "1px solid #334155",
                            background: "#0f172a",
                        }}
                    >

                        {[
                            "Outline",
                            "Citations",
                            "References",
                            "Revision History",
                            "Notes",
                            "Export",
                        ].map(tool => (

                            <div
                                key={tool}
                                style={{
                                    padding: "8px 14px",
                                    border: "1px solid #334155",
                                    borderRadius: 8,
                                    color: "#cbd5e1",
                                    fontSize: 13,
                                    fontWeight: 600,
                                }}
                            >
                                {tool}
                            </div>

                        ))}

                    </div>

                </div>

            </div>

            {/* =====================================================
                OPERATOR ASSISTANT
            ====================================================== */}

            <div
                style={{
                    width: 420,
                    minWidth: 420,
                    display: "flex",
                    flexDirection: "column",
                    overflow: "hidden",
                }}
            >

                <OperatorAssistant

                    context={assistantContext}

                />

            </div>

        </div>

    );

}

interface MetadataRowProps {

    label: string;

    value: string;

}

function MetadataRow({

    label,
    value,

}: MetadataRowProps) {

    return (

        <div
            style={{
                display: "flex",
                gap: 12,
                marginBottom: 8,
                fontSize: 14,
            }}
        >

            <div
                style={{
                    width: 140,
                    color: "#94a3b8",
                    fontWeight: 600,
                }}
            >
                {label}
            </div>

            <div>

                {value}

            </div>

        </div>

    );

}

interface SectionProps {

    title: string;

    text: string;

}

function Section({

    title,
    text,

}: SectionProps) {

    return (

        <div
            style={{
                marginTop: 36,
            }}
        >

            <div
                style={{
                    fontSize: 18,
                    fontWeight: 700,
                    marginBottom: 12,
                }}
            >
                {title}
            </div>

            <div
                style={{
                    color: "#cbd5e1",
                    lineHeight: 1.8,
                }}
            >
                {text}
            </div>

        </div>

    );

}