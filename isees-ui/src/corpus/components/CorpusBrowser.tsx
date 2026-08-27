// ============================================================
// src/corpus/components/CorpusBrowser.tsx
// P57-UI-A4
// CASE REPOSITORY BROWSER
//
// Browse repositories and select a case for preview.
//
// Navigation only.
// Federation state and selection ownership remain unchanged.
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
    <div className="investigation-library__browser">

      {/* ===================================================== */}
      {/* BROWSER IDENTITY */}
      {/* ===================================================== */}

      <div className="investigation-library__browser-header">
        <div className="investigation-library__browser-title">
          Case Repositories
        </div>
      </div>

      {/* ===================================================== */}
      {/* REPOSITORY TREE */}
      {/* ===================================================== */}

      {
        repositories.length === 0
          ? (
            <div className="investigation-library__empty">
              No case repositories loaded.
            </div>
          )
          : (
            repositories.map(
              repository => {
                const repositoryId =
                  repository.repository.id;

                const expanded =
                  expandedRepositoryIds.has(
                    repositoryId
                  );

                return (
                  <div
                    key={repositoryId}
                    className="investigation-library__repository"
                  >

                    {/* ======================================= */}
                    {/* REPOSITORY */}
                    {/* ======================================= */}

                    <button
                      type="button"
                      className={
                        "investigation-library__repository-toggle"
                      }
                      aria-expanded={expanded}
                      onClick={() =>
                        toggleRepository(
                          repositoryId
                        )
                      }
                    >
                      <span
                        className={
                          "investigation-library__repository-indicator"
                        }
                        aria-hidden="true"
                      >
                        {expanded ? "▾" : "▸"}
                      </span>

                      <span
                        className={
                          "investigation-library__repository-name"
                        }
                      >
                        {repository.repository.name}
                      </span>
                    </button>

                    {/* ======================================= */}
                    {/* CASES */}
                    {/* ======================================= */}

                    {
                      expanded && (
                        <div className="investigation-library__cases">
                          {
                            repository.events.map(
                              event => {
                                const eventId =
                                  event
                                    .canonical_event
                                    .event_id;

                                const isSelected =
                                  eventId ===
                                  selectedEventId;

                                const className = [
                                  "investigation-library__case",
                                  isSelected
                                    ? "investigation-library__case--selected"
                                    : "",
                                ]
                                  .filter(Boolean)
                                  .join(" ");

                                return (
                                  <button
                                    type="button"
                                    key={event.corpus_id}
                                    className={className}
                                    aria-pressed={isSelected}
                                    onClick={() => {
                                      void selectEvent(
                                        repositoryId,
                                        eventId
                                      );
                                    }}
                                  >
                                    <span
                                      className={
                                        "investigation-library__case-indicator"
                                      }
                                      aria-hidden="true"
                                    >
                                      {isSelected ? "●" : "•"}
                                    </span>

                                    <span
                                      className={
                                        "investigation-library__case-name"
                                      }
                                    >
                                      {
                                        event
                                          .canonical_event
                                          .event_name
                                      }
                                    </span>
                                  </button>
                                );
                              }
                            )
                          }
                        </div>
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