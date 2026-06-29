// ============================================================
// src/corpus/components/CorpusBrowser.tsx
// P26 FEDERATED KNOWLEDGE LAYER
// FEDERATED KNOWLEDGE BROWSER
// OPERATOR EXPLORER SURFACE
//
// Browse repositories.
// Select investigations.
// Future workflow:
//
// Browse
//   ↓
// Preview
//   ↓
// Import
//   ↓
// Investigate
//
// The browser intentionally remains lightweight.
// It is a navigation surface—not an investigation surface.
// ============================================================

import {
  useFederation,
} from "../../federation/context/FederationContext";

// ============================================================
// COMPONENT
// ============================================================

export default function CorpusBrowser() {

  const {

    repositories,

    expandedRepositoryIds,

    toggleRepository,

    selectedEventId,

    selectEvent,

  } = useFederation();

  return (

    <div
      style={{
        padding: "12px",
        borderBottom: "1px solid #333",
      }}
    >

      {/* ================================================ */}
      {/* TITLE */}
      {/* ================================================ */}

      <div
        style={{
          fontWeight: 700,
          fontSize: "14px",
          textAlign: "center",
          marginBottom: "14px",
          letterSpacing: "0.05em",
        }}
      >
        FEDERATED KNOWLEDGE
      </div>

      {/* ================================================ */}
      {/* EMPTY */}
      {/* ================================================ */}

      {

        repositories.length === 0

          ? (

            <div
              style={{
                fontSize: "12px",
                opacity: 0.6,
              }}
            >
              No repositories loaded.
            </div>

          )

          : (

            repositories.map(

              repository => {

                const expanded =

                  expandedRepositoryIds.has(

                    repository
                      .repository
                      .id

                  );

                return (

                  <div

                    key={
                      repository
                        .repository
                        .id
                    }

                    style={{
                      marginBottom: "10px",
                    }}

                  >

                    {/* ==================================== */}
                    {/* REPOSITORY */}
                    {/* ==================================== */}

                    <div

                      onClick={() =>

                        toggleRepository(

                          repository
                            .repository
                            .id

                        )

                      }

                      style={{

                        display: "flex",

                        alignItems: "center",

                        gap: "6px",

                        cursor: "pointer",

                        userSelect: "none",

                        fontWeight: 700,

                        fontSize: "12px",

                        color: "#d6d6d6",

                        padding: "4px 0",

                      }}

                    >

                      <span>

                        {

                          expanded

                            ? "▼"

                            : "▶"

                        }

                      </span>

                      <span>

                        {

                          repository
                            .repository
                            .name

                        }

                      </span>

                    </div>

                    {/* ==================================== */}
                    {/* EVENTS */}
                    {/* ==================================== */}

                    {

                      expanded &&

                      repository.events.map(

                        event => {

                          const isSelected =

                            event
                              .canonical_event
                              .event_id ===

                            selectedEventId;

                          return (

                            <div

                              key={
                                event.corpus_id
                              }

                              onClick={() => {

                                void selectEvent(

                                  repository
                                    .repository
                                    .id,

                                  event
                                    .canonical_event
                                    .event_id

                                );

                              }}

                              style={{

                                display: "flex",

                                alignItems: "center",

                                gap: "6px",

                                marginLeft: "14px",

                                marginTop: "1px",

                                marginBottom: "1px",

                                padding: "4px 8px",

                                cursor: "pointer",

                                fontSize: "12px",

                                lineHeight: 1.35,

                                whiteSpace: "nowrap",

                                overflow: "hidden",

                                textOverflow: "ellipsis",

                                borderRadius: "4px",

                                borderLeft:

                                  isSelected

                                    ? "3px solid #3ea6ff"

                                    : "3px solid transparent",

                                background:

                                  isSelected

                                    ? "rgba(62,166,255,.14)"

                                    : "transparent",

                                transition:
                                  "all 120ms ease",

                              }}

                            >

                              <span
                                style={{
                                  width: "14px",
                                  flexShrink: 0,
                                  opacity:
                                    isSelected
                                      ? 1
                                      : 0.45,
                                }}
                              >

                                {

                                  isSelected

                                    ? "▶"

                                    : "•"

                                }

                              </span>

                              <span
                                style={{
                                  flex: 1,
                                  overflow: "hidden",
                                  textOverflow: "ellipsis",
                                  whiteSpace: "nowrap",
                                  textAlign: "left",
                                }}
                              >

                                {

                                  event
                                    .canonical_event
                                    .event_name

                                }

                              </span>

                            </div>

                          );

                        }

                      )

                    }

                  </div>

                );

              }

            )

          )

      }

    </div>

  );

}