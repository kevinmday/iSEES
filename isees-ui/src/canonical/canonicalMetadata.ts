// ============================================================
// CANONICAL CORPUS METADATA CONTRACT
// ============================================================

export interface CanonicalMetadata {

  event_id: string;

  event_name: string;

  tier: number;

  classification: string;

  year: number;

  location: string;

  observability_profile: string;

  canonical_status:
    "ACTIVE";
}