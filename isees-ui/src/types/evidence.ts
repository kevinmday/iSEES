// ============================================================
// evidence.ts
// EPISTEMIC EVIDENCE RESERVOIR CONTRACT
// ============================================================
//
// PURPOSE
// -------
// Defines the canonical evidence reservoir architecture
// for iSEES.
//
// CRITICAL PRINCIPLES
// -------------------
// 1. Evidence is NOT cognition.
// 2. Evidence is NOT truth.
// 3. Evidence reservoirs remain epistemically subordinate
//    to immutable frame ontology.
// 4. NotebookLM is OPTIONAL.
// 5. External cognition providers are NEVER ontology authority.
// 6. iSEES must remain fully operational without any
//    external cognition provider.
// 7. Evidence may evolve through time.
// 8. Frames NEVER mutate.
//
// ============================================================

/**
 * ============================================================
 * EVIDENCE PROVIDER TYPE
 * ============================================================
 *
 * Represents the origin/source system responsible for
 * evidence storage or cognition augmentation.
 *
 * IMPORTANT:
 * Providers are interchangeable infrastructure layers.
 *
 * The ontology MUST NEVER depend on a specific provider.
 */

export type EvidenceProviderType =
  | "LOCAL_FILESYSTEM"
  | "NOTEBOOK_LM"
  | "SQLITE_ARCHIVE"
  | "VECTOR_STORE"
  | "MANUAL_UPLOAD"
  | "REMOTE_ARCHIVE"
  | "AIR_GAPPED_STORAGE"
  | "UNKNOWN";

/**
 * ============================================================
 * EVIDENCE ARTIFACT TYPE
 * ============================================================
 *
 * Represents raw evidence categories.
 */

export type EvidenceArtifactType =
  | "IMAGE"
  | "VIDEO"
  | "AUDIO"
  | "DOCUMENT"
  | "RADAR_CAPTURE"
  | "SATELLITE_CAPTURE"
  | "ATC_TRANSCRIPT"
  | "FAA_RECORD"
  | "WEATHER_DATA"
  | "WITNESS_STATEMENT"
  | "SOCIAL_CAPTURE"
  | "NEWS_ARTICLE"
  | "RESEARCH_NOTE"
  | "NOTEBOOK_SUMMARY"
  | "UNKNOWN";

/**
 * ============================================================
 * EVIDENCE CLASSIFICATION
 * ============================================================
 *
 * Represents evidentiary trust classification.
 *
 * IMPORTANT:
 * Classification does NOT imply truth.
 */

export type EvidenceClassification =
  | "RAW"
  | "UNVERIFIED"
  | "PARTIALLY_VERIFIED"
  | "CORROBORATED"
  | "CONTRADICTED"
  | "ARCHIVED"
  | "DEPRECATED";

/**
 * ============================================================
 * NOTEBOOK CONTEXT
 * ============================================================
 *
 * Represents optional contextual cognition workspace.
 *
 * IMPORTANT:
 * Notebook contexts are NEVER ontology authority.
 *
 * They may assist investigation but may NOT mutate frames.
 */

export interface NotebookContext {
  notebook_id: string;

  provider_type: EvidenceProviderType;

  title: string;

  description?: string;

  created_at: string;

  updated_at?: string;

  enabled: boolean;

  /**
   * Optional provider-specific linkage.
   *
   * Example:
   * NotebookLM URL or provider reference.
   */
  external_reference?: string;

  /**
   * IMPORTANT:
   * Notebook contexts remain epistemically subordinate.
   */
  epistemically_subordinate: true;
}

/**
 * ============================================================
 * EVIDENCE ARTIFACT
 * ============================================================
 *
 * Represents an individual evidence object.
 *
 * IMPORTANT:
 * Evidence artifacts may evolve through investigation-time.
 */

export interface EvidenceArtifact {
  artifact_id: string;

  event_id?: string;

  epoch_id?: string;

  notebook_id?: string;

  provider_type: EvidenceProviderType;

  artifact_type: EvidenceArtifactType;

  classification: EvidenceClassification;

  title: string;

  description?: string;

  created_at: string;

  updated_at?: string;

  source_reference?: string;

  local_path?: string;

  tags?: string[];

  metadata?: Record<string, unknown>;
}

/**
 * ============================================================
 * FRAME EVIDENCE REFERENCE
 * ============================================================
 *
 * Represents evidence linkage attached to a frame.
 *
 * IMPORTANT:
 * Frames reference evidence.
 *
 * Evidence does NOT control frames.
 */

export interface FrameEvidenceReference {
  frame_id: string;

  artifact_ids: string[];

  notebook_ids?: string[];

  attached_at: string;
}

/**
 * ============================================================
 * EPOCH EVIDENCE REFERENCE
 * ============================================================
 *
 * Represents macro-level evidence grouping attached
 * to investigation epochs.
 */

export interface EpochEvidenceReference {
  epoch_id: string;

  artifact_ids: string[];

  notebook_ids?: string[];

  attached_at: string;
}

/**
 * ============================================================
 * EVIDENCE MUTATION RECORD
 * ============================================================
 *
 * Represents changes within evidence-space.
 *
 * IMPORTANT:
 * Evidence mutations are NOT frame mutations.
 */

export interface EvidenceMutationRecord {
  mutation_id: string;

  artifact_id: string;

  timestamp: string;

  summary: string;

  provider_type: EvidenceProviderType;
}

/**
 * ============================================================
 * EVIDENCE RESERVOIR
 * ============================================================
 *
 * Represents the complete evidence-space associated
 * with an investigation.
 *
 * IMPORTANT:
 * This layer remains separate from immutable cognition
 * timelines.
 */

export interface EvidenceReservoir {
  reservoir_id: string;

  event_id: string;

  created_at: string;

  provider_types: EvidenceProviderType[];

  notebooks: NotebookContext[];

  artifacts: EvidenceArtifact[];

  frame_references: FrameEvidenceReference[];

  epoch_references: EpochEvidenceReference[];

  evidence_mutations?: EvidenceMutationRecord[];
}

/**
 * ============================================================
 * EVIDENCE PROVIDER STATUS
 * ============================================================
 *
 * Represents operational provider availability.
 *
 * IMPORTANT:
 * iSEES MUST remain fully operational even if
 * external providers fail or disappear entirely.
 */

export interface EvidenceProviderStatus {
  provider_type: EvidenceProviderType;

  available: boolean;

  last_checked_at?: string;

  error_message?: string;

  optional_dependency: true;
}

/**
 * ============================================================
 * EVIDENCE AUTHORITY STATE
 * ============================================================
 *
 * Future-facing centralized evidence authority contract.
 *
 * IMPORTANT:
 * Evidence authority is NOT ontology authority.
 */

export interface EvidenceAuthorityState {
  active_reservoir?: EvidenceReservoir;

  active_notebook?: NotebookContext;

  active_artifact?: EvidenceArtifact;

  provider_statuses?: EvidenceProviderStatus[];

  external_providers_optional: true;
}

/**
 * ============================================================
 * FUTURE ARCHITECTURAL RULES
 * ============================================================
 *
 * CONTRACT RULES
 * --------------
 *
 * 1. External cognition providers NEVER mutate frames.
 *
 * 2. Replay MUST remain deterministic even if providers
 *    are offline or unavailable.
 *
 * 3. Notebook synthesis results should eventually become
 *    bounded evidence artifacts.
 *
 * 4. Evidence-space evolution must remain separate from
 *    immutable cognition lineage.
 *
 * 5. Provider abstractions MUST remain interchangeable.
 *
 * 6. iSEES must support:
 *      - offline deployments
 *      - air-gapped deployments
 *      - self-hosted deployments
 *      - classified deployments
 *
 * without external dependency requirements.
 *
 * ============================================================
 */