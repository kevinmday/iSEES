// ============================================================
// src/knowledge/components/KnowledgeInspector.tsx
// P53
// KNOWLEDGE INSPECTOR
//
// Read-only inspector for the Computational Knowledge Runtime.
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

export function KnowledgeInspector(): React.JSX.Element {

  const objects = useKnowledgeObjects();

  const object =
    objects.length > 0
      ? objects[0]
      : undefined;

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

          marginBottom: 16,

        }}
      >
        Knowledge Inspector
      </div>

      {

        object === undefined ? (

          <div
            style={{

              opacity: 0.55,

              fontStyle: "italic",

            }}
          >
            No Knowledge Object selected.
          </div>

        ) : (

          <>

            <div
              style={{

                marginBottom: 12,

              }}
            >
              <strong>Title</strong>

              <div>{object.metadata.title}</div>

            </div>

            <div
              style={{

                marginBottom: 12,

              }}
            >
              <strong>Identifier</strong>

              <div>{object.identity.id}</div>

            </div>

            <div
              style={{

                marginBottom: 12,

              }}
            >
              <strong>Type</strong>

              <div>{object.type}</div>

            </div>

            <div
              style={{

                marginBottom: 12,

              }}
            >
              <strong>Status</strong>

              <div>{object.status}</div>

            </div>

            <div
              style={{

                marginBottom: 12,

              }}
            >
              <strong>Confidence</strong>

              <div>{object.confidence.value}</div>

            </div>

            <div
              style={{

                marginBottom: 12,

              }}
            >
              <strong>Revision</strong>

              <div>{object.revision.revision}</div>

            </div>

            <div
              style={{

                marginBottom: 12,

              }}
            >
              <strong>Relationships</strong>

              <div>{object.relationships.length}</div>

            </div>

            <div
              style={{

                marginBottom: 12,

              }}
            >
              <strong>Graph References</strong>

              <div>{object.graph.length}</div>

            </div>

            <div
              style={{

                marginBottom: 12,

              }}
            >
              <strong>Tags</strong>

              <div>{object.tags.length}</div>

            </div>

          </>

        )

      }

    </div>

  );

}

// ============================================================
// END
// ============================================================