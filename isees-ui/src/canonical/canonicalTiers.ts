// ============================================================
// CANONICAL CORPUS TIERS
// ============================================================

export const CANONICAL_TIERS = {

  TIER_1:
    "Multi-Sensor Military Canon",

  TIER_2:
    "Military Historical Canon",

  TIER_3:
    "Mass Witness Canon",

  TIER_4:
    "Historical Narrative Canon",

  TIER_5:
    "Ancient Narrative Canon",

} as const;

export type CanonicalTier =
  keyof typeof CANONICAL_TIERS;