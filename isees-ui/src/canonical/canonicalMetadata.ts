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

// ============================================================
// TIER 1 — SENSOR ERA MILITARY CANON
// ============================================================

export const NIMITZ_METADATA:
  CanonicalMetadata = {

  event_id:
    "E-TICTAC-2004",

  event_name:
    "Nimitz Tic Tac Encounter",

  tier:
    1,

  classification:
    "multi_sensor_naval_event",

  year:
    2004,

  location:
    "Pacific Sector, CA",

  observability_profile:
    "MULTI_SENSOR_MILITARY",

  canonical_status:
    "ACTIVE",
};

export const ROOSEVELT_METADATA:
  CanonicalMetadata = {

  event_id:
    "E-ROOSEVELT-2015",

  event_name:
    "Roosevelt Training Range Encounters",

  tier:
    1,

  classification:
    "multi_sensor_naval_event",

  year:
    2015,

  location:
    "Atlantic Training Areas",

  observability_profile:
    "MULTI_SENSOR_MILITARY",

  canonical_status:
    "ACTIVE",
};

// ============================================================
// CANONICAL CORPUS
// ============================================================

export const CANONICAL_METADATA = [

  NIMITZ_METADATA,

  ROOSEVELT_METADATA,
];