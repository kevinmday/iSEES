// ============================================================
// src/knowledge/components/KnowledgeWorkspace.tsx
// P53B
// COMPUTATIONAL KNOWLEDGE PROMOTION WORKSPACE
//
// Canonical Knowledge Workspace.
//
// This workspace is NOT a graph browser.
//
// This workspace is where Research Candidates are intentionally
// promoted into Computational Knowledge Objects.
//
// Explorer remains a persistent instrument.
//
// Inspector remains a persistent instrument.
//
// React observes.
//
// No persistence.
// No networking.
// No AI.
//
// ============================================================

import React, {

  useMemo,
  useState,

} from "react";

import {

  KnowledgeObjectType,

} from "../model/KnowledgeObjectTypes";

import {

  KnowledgeObjectFactory,

} from "../factory/KnowledgeObjectFactory";

import {

  knowledgeObjectRuntime,

} from "../runtime/KnowledgeObjectRuntime";

import {

  useKnowledgeObjects,

} from "../runtime/KnowledgeObjectRuntimeContext";

// ============================================================
// TYPES
// ============================================================
interface CandidateItem {

  id: string;

  title: string;

}

const KNOWLEDGE_TYPES = Object.values(

  KnowledgeObjectType,

);

// ============================================================
// COMPONENT
// ============================================================

export default function KnowledgeWorkspace():

React.JSX.Element {

// ==========================================================
// KNOWLEDGE LIBRARY
// ==========================================================

const knowledgeObjects =

  useKnowledgeObjects();

  // ----------------------------------------------------------
  // Temporary mock candidates
  //
  // P53C
  // Replace with Research Runtime integration.
  // ----------------------------------------------------------

  const candidates = useMemo<CandidateItem[]>(

    () => [

      {

        id: "1",

        title: "USS Nimitz",

      },

      {

        id: "2",

        title: "FLIR Video",

      },

      {

        id: "3",

        title: "AN/SPY-1 Radar",

      },

      {

        id: "4",

        title: "Pilot Testimony",

      },

    ],

    [],

  );

  // ----------------------------------------------------------
  // State
  // ----------------------------------------------------------

  const [

    selected,

    setSelected,

  ] = useState<string[]>([]);

  const [

    knowledgeType,

    setKnowledgeType,

  ] = useState(

    KnowledgeObjectType.ENTITY,

  );

  const [

    title,

    setTitle,

  ] = useState("");

  const [

    description,

    setDescription,

  ] = useState("");

  const [

    confidence,

    setConfidence,

  ] = useState(0.95);

  // ----------------------------------------------------------
  // Toggle Candidate
  // ----------------------------------------------------------

  function toggleCandidate(

    id: string,

  ) {

    if (

      selected.includes(id)

    ) {

      setSelected(

        selected.filter(

          value => value !== id,

        ),

      );

      return;

    }

    setSelected(

      [

        ...selected,

        id,

      ],

    );

  }

  // ----------------------------------------------------------
  // Promote
  // ----------------------------------------------------------

  function handlePromote() {

    if (

      title.trim().length === 0

    ) {

      return;

    }

    const knowledgeObject =

      KnowledgeObjectFactory.create({

        title,

        description,

        type: knowledgeType,

        confidence,

        tags: [],

        payload: {

          promotedCandidates: selected,

        },

      });

    knowledgeObjectRuntime.addObject(

      knowledgeObject,

    );

    // --------------------------------------------------------
    // Reset Promotion Workspace
    // --------------------------------------------------------

    setSelected([]);

    setTitle("");

    setDescription("");

    setConfidence(0.95);

  }
   // ==========================================================
  // UI
  // ==========================================================

  return (

    <div

      style={{

        display: "flex",

        flexDirection: "column",

        gap: 20,

        padding: 24,

        color: "#e2e8f0",

        background: "#020617",

        height: "100%",

        overflow: "auto",

      }}

    >

      {/* ==================================================== */}

      <div>

        <div

          style={{

            fontSize: 24,

            fontWeight: 700,

          }}

        >

          Knowledge Promotion

        </div>

        <div

          style={{

            marginTop: 6,

            color: "#94a3b8",

          }}

        >

          Promote temporary Research artifacts into
          canonical Computational Knowledge Objects.

        </div>

      </div>

      {/* ---------------------------------------------------- */}
      {/* Knowledge Library                                    */}
      {/* ---------------------------------------------------- */}

      <section>

        <div

          style={{

            display: "flex",

            justifyContent: "space-between",

            alignItems: "center",

            marginBottom: 12,

          }}

        >

          <div

            style={{

              fontWeight: 700,

              color: "#38bdf8",

            }}

          >

            Knowledge Library

          </div>

          <div

            style={{

              color: "#94a3b8",

              fontSize: 13,

            }}

          >

            Objects: {knowledgeObjects.length}

          </div>

        </div>

        <div

          style={{

            border: "1px solid rgba(148,163,184,.20)",

            borderRadius: 8,

            background: "#0f172a",

            overflow: "hidden",

            marginBottom: 24,

          }}

        >

          {

            knowledgeObjects.length === 0

              ? (

                  <div

                    style={{

                      padding: 20,

                      color: "#64748b",

                      fontStyle: "italic",

                    }}

                  >

                    No Knowledge Objects have been promoted.

                  </div>

                )

              : (

                  knowledgeObjects.map(

                    object => (

                      <div

                        key={object.identity.id}

                        style={{

                          padding: "12px 16px",

                          borderBottom:

                            "1px solid rgba(148,163,184,.08)",

                        }}

                      >

                        <div

                          style={{

                            color: "#38bdf8",

                            fontSize: 11,

                            fontWeight: 700,

                            textTransform: "uppercase",

                          }}

                        >

                          {object.type}

                        </div>

                        <div

                          style={{

                            marginTop: 4,

                            fontWeight: 600,

                          }}

                        >

                          {object.metadata.title}

                        </div>

                      </div>

                    ),

                  )

                )

          }

        </div>

      </section>


      {/* ==================================================== */}

      <section>

        <div

          style={{

            display: "flex",

            justifyContent: "space-between",

            alignItems: "center",

            marginBottom: 12,

          }}

        >

          <div

            style={{

              fontWeight: 700,

              color: "#38bdf8",

            }}

          >

            Knowledge Library

          </div>

          <div

            style={{

              color: "#94a3b8",

              fontSize: 13,

            }}

          >

            Objects: {knowledgeObjects.length}

          </div>

        </div>

        <div

          style={{

            border: "1px solid rgba(148,163,184,.20)",

            borderRadius: 8,

            background: "#0f172a",

            overflow: "hidden",

            marginBottom: 24,

          }}

        >

          {

            knowledgeObjects.length === 0

              ? (

                  <div

                    style={{

                      padding: 20,

                      color: "#64748b",

                      fontStyle: "italic",

                    }}

                  >

                    No Knowledge Objects have been promoted.

                  </div>

                )

              : (

                  knowledgeObjects.map(

                    object => (

                      <div

                        key={object.identity.id}

                        style={{

                          padding: "12px 16px",

                          borderBottom:

                            "1px solid rgba(148,163,184,.08)",

                          cursor: "pointer",

                        }}

                      >

                        <div

                          style={{

                            color: "#38bdf8",

                            fontSize: 11,

                            fontWeight: 700,

                            textTransform: "uppercase",

                          }}

                        >

                          {object.type}

                        </div>

                        <div

                          style={{

                            marginTop: 4,

                            fontWeight: 600,

                          }}

                        >

                          {object.metadata.title}

                        </div>

                      </div>

                    ),

                  )

                )

          }

        </div>

      </section>

      {/* ==================================================== */}

      <section>

        <div

          style={{

            fontWeight: 700,

            marginBottom: 12,

          }}

        >

          Research Candidates
        </div>

        <div

          style={{

            border: "1px solid rgba(148,163,184,.20)",

            borderRadius: 8,

            overflow: "hidden",

          }}

        >

          {

            candidates.map(

              candidate => (

                <label

                  key={candidate.id}

                  style={{

                    display: "flex",

                    gap: 12,

                    alignItems: "center",

                    padding: "12px 16px",

                    cursor: "pointer",

                    borderBottom:

                      "1px solid rgba(148,163,184,.08)",

                  }}

                >

                  <input

                    type="checkbox"

                    checked={

                      selected.includes(

                        candidate.id,

                      )

                    }

                    onChange={() =>

                      toggleCandidate(

                        candidate.id,

                      )

                    }

                  />

                  {candidate.title}

                </label>

              ),

            )

          }

        </div>

      </section>

      {/* ==================================================== */}

      <section>

        <div

          style={{

            fontWeight: 700,

            marginBottom: 12,

          }}

        >

          Knowledge Object Type

        </div>

        <select

          value={knowledgeType}

          onChange={event =>

            setKnowledgeType(

              event.target.value as any,

            )

          }

          style={{

            width: 320,

            padding: 10,

            borderRadius: 6,

            background: "#0f172a",

            color: "#e2e8f0",

            border:

              "1px solid rgba(148,163,184,.25)",

          }}

        >

          {

            KNOWLEDGE_TYPES.map(

              type => (

                <option

                  key={type}

                  value={type}

                >

                  {type}

                </option>

              ),

            )

          }

        </select>

      </section>

      {/* ==================================================== */}

      <section>

        <div

          style={{

            fontWeight: 700,

            marginBottom: 12,

          }}

        >

          Title

        </div>

        <input

          value={title}

          onChange={event =>

            setTitle(

              event.target.value,

            )

          }

          style={{

            width: 500,

            padding: 10,

            borderRadius: 6,

            background: "#0f172a",

            color: "#e2e8f0",

            border:

              "1px solid rgba(148,163,184,.25)",

          }}

        />

      </section>

      {/* ==================================================== */}

      <section>

        <div

          style={{

            fontWeight: 700,

            marginBottom: 12,

          }}

        >

          Description

        </div>

        <textarea

          value={description}

          onChange={event =>

            setDescription(

              event.target.value,

            )

          }

          rows={5}

          style={{

            width: 700,

            padding: 10,

            borderRadius: 6,

            background: "#0f172a",

            color: "#e2e8f0",

            border:

              "1px solid rgba(148,163,184,.25)",

          }}

        />

      </section>

      {/* ==================================================== */}

      <section>

        <div

          style={{

            fontWeight: 700,

            marginBottom: 12,

          }}

        >

          Confidence

        </div>

        <input

          type="range"

          min={0}

          max={1}

          step={0.01}

          value={confidence}

          onChange={event =>

            setConfidence(

              Number(

                event.target.value,

              ),

            )

          }

          style={{

            width: 400,

          }}

        />

        <div

          style={{

            marginTop: 8,

            color: "#38bdf8",

            fontWeight: 600,

          }}

        >

          {confidence.toFixed(2)}

        </div>

      </section>

      {/* ==================================================== */}

      <section>

        <button

          onClick={handlePromote}

          style={{

            padding: "12px 28px",

            borderRadius: 8,

            border: "none",

            cursor: "pointer",

            fontWeight: 700,

            background: "#2563eb",

            color: "white",

          }}

        >

          Promote Knowledge Object

        </button>

      </section>

    </div>

  );

}

// ============================================================
// END
// ============================================================