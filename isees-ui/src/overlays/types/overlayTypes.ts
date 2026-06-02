// ============================================================
// overlayTypes.ts
// iSEES — EPISTEMIC OVERLAY TYPE CONTRACTS (V1)
// FOUNDATION-FIRST / CONTRACT-FIRST
// ============================================================

// ============================================================
// OVERLAY SCOPE
// ============================================================

export type OverlayScope =
  | "LOCAL"
  | "SHARED"
  | "REPLAY"
  | "TEMPORAL"
  | "SEMANTIC";

// ============================================================
// AUTHORITY DOMAIN
// ============================================================

export type AuthorityDomain =
  | "EVENT"
  | "OVERLAY"
  | "REPLAY"
  | "TOPOLOGY"
  | "SEMANTIC"
  | "OPERATOR";

// ============================================================
// REPLAY MUTATION POLICY
// ============================================================

export type ReplayMutationPolicy =
  | "IMMUTABLE"
  | "ANNOTATION_ONLY"
  | "TEMPORAL_BRANCH"
  | "PROHIBITED";

// ============================================================
// OVERLAY ATTACHMENT TYPE
// ============================================================

export type OverlayAttachmentType =
  | "EVENT"
  | "TOPOLOGY"
  | "NARRATIVE"
  | "OBSERVATION"
  | "FACILITY"
  | "REPLAY_FRAME"
  | "SEMANTIC_REFERENCE";

// ============================================================
// OVERLAY VISIBILITY
// ============================================================

export type OverlayVisibility =
  | "PRIVATE"
  | "SHARED"
  | "PUBLIC";

// ============================================================
// OVERLAY REFERENCE
// ============================================================

export interface OverlayReference {

  overlay_id: string;

  event_id: string;

  authority_domain:
    AuthorityDomain;

  attachment_type:
    OverlayAttachmentType;

  scope:
    OverlayScope;

  visibility:
    OverlayVisibility;

  replay_policy:
    ReplayMutationPolicy;

  created_at: string;
}