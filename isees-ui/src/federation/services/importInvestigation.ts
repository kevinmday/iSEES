// ============================================================
// src/federation/services/importInvestigation.ts
// P57-UI-A4-I1
// FEDERATION -> CANONICAL INVESTIGATION INTAKE
//
// Pure deterministic construction boundary.
//
// Adapter: retrieves the source CorpusEvent.
// This service: constructs the canonical Investigation.
// WorkspaceRuntime: installs the active Investigation.
// Resolve: determines feature availability and comparability.
//
// Intake never manufactures observations, feature values,
// similarity values, or availability claims.
// ============================================================

import type {
  CorpusEvent,
} from "../../corpus/corpusTypes";

import type {
  Investigation,
} from "../../investigation/investigationTypes";

import type {
  Workspace,
  WorkspaceReferenceSource,
} from "../../workspace/workspaceTypes";

import type {
  FederationAdapter,
  FederationRepository,
} from "../adapters/FederationAdapter";

// ============================================================
// RESULT
// ============================================================

export interface CanonicalInvestigationImportResult {
  readonly repositoryId: string;
  readonly eventId: string;
  readonly investigation: Investigation;
  readonly warnings: readonly string[];
}

// ============================================================
// SUPPORTED CANONICAL SOURCES
// ============================================================

function resolveWorkspaceReferenceSource(
  repositoryId: string,
): WorkspaceReferenceSource {

  switch (repositoryId) {

    case "SYSTEM_CANON":
      return "SYSTEM_CANON";

    case "RESEARCH_CANON":
      return "RESEARCH_CANON";

    default:
      throw new Error(
        `Repository ${repositoryId} cannot yet be imported: ` +
        "canonical external-repository provenance is not implemented.",
      );

  }

}

// ============================================================
// VALIDATION
// ============================================================

function requireNonEmpty(
  value: string,
  label: string,
): string {

  const normalized =
    value.trim();

  if (normalized.length === 0) {

    throw new Error(
      `${label} must not be empty.`,
    );

  }

  return normalized;

}

function validateSourceIdentity(
  repository: FederationRepository,
  event: CorpusEvent,
): void {

  requireNonEmpty(
    repository.id,
    "Federation repository id",
  );

  requireNonEmpty(
    repository.authority,
    "Federation repository authority",
  );

  requireNonEmpty(
    event.corpus_id,
    "Corpus event id",
  );

  requireNonEmpty(
    event.canonical_event.event_id,
    "Canonical event id",
  );

  requireNonEmpty(
    event.canonical_event.event_name,
    "Canonical event name",
  );

  requireNonEmpty(
    event.created_at,
    "Corpus event created_at",
  );

  requireNonEmpty(
    event.updated_at,
    "Corpus event updated_at",
  );

}

// ============================================================
// DETERMINISTIC IDENTITY
// ============================================================

function canonicalInvestigationId(
  repositoryId: string,
  eventId: string,
): string {

  return [
    "INV",
    repositoryId,
    eventId,
  ].join("-");

}

function canonicalWorkspaceId(
  repositoryId: string,
  eventId: string,
): string {

  return [
    "WORKSPACE",
    repositoryId,
    eventId,
  ].join("-");

}

// ============================================================
// PURE CONSTRUCTOR
// ============================================================

export function createCanonicalInvestigationFromCorpusEvent(
  repository: FederationRepository,
  event: CorpusEvent,
): Investigation {

  validateSourceIdentity(
    repository,
    event,
  );

  const eventId =
    event.canonical_event.event_id;

  const eventName =
    event.canonical_event.event_name;

  const source =
    resolveWorkspaceReferenceSource(
      repository.id,
    );

  const workspace:
    Workspace = {

    id:
      canonicalWorkspaceId(
        repository.id,
        eventId,
      ),

    name:
      `${eventName} Workspace`,

    description:
      `Canonical workspace imported from ${repository.name}.`,

    imported_events: [
      {
        event_id:
          eventId,

        source,
      },
    ],

    focused_event_id:
      eventId,

    investigations: [],

    artifacts: [],

    active_layers: [],

    created_at:
      event.created_at,

  };

  return {

    id:
      canonicalInvestigationId(
        repository.id,
        eventId,
      ),

    name:
      eventName,

    description:
      `Imported from ${repository.name} ` +
      `(${repository.authority}, version ${repository.version}).`,

    createdAt:
      event.created_at,

    updatedAt:
      event.updated_at,

    createdBy:
      repository.authority,

    status:
      "ACTIVE",

    workspace,

    currentRevisionId:
      undefined,

    revisions: [],

  };

}

// ============================================================
// ADAPTER INTAKE
// ============================================================

export async function importInvestigation(
  adapter: FederationAdapter,
  eventId: string,
): Promise<CanonicalInvestigationImportResult> {

  const requestedEventId =
    requireNonEmpty(
      eventId,
      "Requested event id",
    );

  if (
    !adapter.repository
      .capabilities
      .supportsImport
  ) {

    throw new Error(
      `Repository ${adapter.repository.id} does not support import.`,
    );

  }

  const preview =
    await adapter.preview(
      requestedEventId,
    );

  if (
    preview.repositoryId !==
    adapter.repository.id
  ) {

    throw new Error(
      "Federation preview repository identity does not match its adapter.",
    );

  }

  if (
    preview.event
      .canonical_event
      .event_id !==
    requestedEventId
  ) {

    throw new Error(
      "Federation preview event identity does not match the requested event.",
    );

  }

  const investigation =
    createCanonicalInvestigationFromCorpusEvent(
      adapter.repository,
      preview.event,
    );

  return {

    repositoryId:
      adapter.repository.id,

    eventId:
      requestedEventId,

    investigation,

    warnings: [],

  };

}
