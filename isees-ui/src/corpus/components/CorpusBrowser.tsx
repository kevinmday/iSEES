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

          marginBottom: "var(--space-md)",

          paddingBottom: "var(--space-xs)",

          borderBottom: "var(--surface-border)",

        }}
      >

        <div
          style={{

            fontFamily: "var(--font-family-sans)",

            fontSize: "var(--font-panel)",

            fontWeight: "var(--weight-bold)",

            letterSpacing: "var(--tracking-system)",

            textTransform: "uppercase",

            lineHeight: "var(--line-tight)",

            color: "var(--text-primary)",

          }}
        >
          Federated Knowledge
        </div>

      </div>

      {/* ================================================ */}
      {/* EMPTY */}
      {/* ================================================ */}

      {

        repositories.length === 0

          ? (

            <div
              style={{

                padding: "var(--space-sm) 0",

                fontFamily: "var(--font-family-sans)",

                fontSize: "var(--font-meta)",

                lineHeight: "var(--line-normal)",

                color: "var(--text-muted)",

                opacity: .75,

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
                      marginBottom: "var(--space-sm)",
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

                        gap: "var(--space-xs)",

                        cursor: "pointer",

                        userSelect: "none",

                        padding: "6px 0",

                        fontFamily: "var(--font-family-sans)",

                        fontSize: "var(--font-meta)",

                        fontWeight: "var(--weight-bold)",

                        letterSpacing: ".02em",

                        color: "var(--text-secondary)",

                        transition: "var(--transition-fast)",

                      }}

                    >

                      <span
                        style={{

                          width: 14,

                          color: "var(--text-muted)",

                          flexShrink: 0,

                        }}
                      >

                        {

                          expanded

                            ? "▼"

                            : "▶"

                        }

                      </span>

                      <span
                        style={{

                          flex: 1,

                        }}
                      >

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