// ============================================================
// src/knowledge/components/KnowledgeExplorer.tsx
// P53
// KNOWLEDGE EXPLORER
//
// Read-only explorer for the Computational Knowledge Runtime.
//
// React observes.
//
// Runtime owns state.
//
// No persistence.
// No networking.
// No AI.
//
// ============================================================

import {

  useKnowledgeObjects,

} from "../runtime/KnowledgeObjectRuntimeContext";

// ============================================================
// COMPONENT
// ============================================================

export function KnowledgeExplorer(): React.JSX.Element {

  const objects = useKnowledgeObjects();

  return (

    <div
      style={{

        display: "flex",

        flexDirection: "column",

        width: "100%",

        height: "100%",

        overflow: "auto",

        background: "#020617",

        color: "#e2e8f0",

        fontFamily: "sans-serif",

        padding: 16,

      }}
    >

      <div
        style={{

          fontSize: 16,

          fontWeight: 600,

          marginBottom: 12,

        }}
      >
        Knowledge Explorer
      </div>

      <div
        style={{

          fontSize: 13,

          opacity: 0.75,

          marginBottom: 16,

        }}
      >
        Objects: {objects.length}
      </div>

      {

        objects.length === 0

          ? (

              <div
                style={{

                  opacity: 0.55,

                  fontStyle: "italic",

                }}
              >
                No Knowledge Objects loaded.
              </div>

            )

          : (

              objects.map(

                object => (

                  <div

                    key={object.identity.id}

                    style={{

                      padding: 12,

                      marginBottom: 8,

                      border: "1px solid rgba(148,163,184,0.15)",

                      borderRadius: 6,

                      background: "rgba(15,23,42,0.55)",

                    }}

                  >

                    <div>

                      <strong>

                        {object.metadata.title}

                      </strong>

                    </div>

                    <div>

                      {object.type}

                    </div>

                    <div>

                      {object.status}

                    </div>

                  </div>

                ),

              )

            )

      }

    </div>

  );

}

// ============================================================
// END
// ============================================================