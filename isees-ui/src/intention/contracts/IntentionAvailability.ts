export const IntentionAvailability = Object.freeze({
  AVAILABLE: "AVAILABLE",
  UNAVAILABLE: "UNAVAILABLE",
  THEORETICAL: "THEORETICAL",
} as const);

export type IntentionAvailability = typeof IntentionAvailability[keyof typeof IntentionAvailability];

export const IntentionEpistemicClassification = Object.freeze({
  COMPUTATIONAL_PROJECTION: "COMPUTATIONAL_PROJECTION",
  OBSERVED_SOURCE_VALUE: "OBSERVED_SOURCE_VALUE",
  CANONICAL_SOURCE_MATERIAL: "CANONICAL_SOURCE_MATERIAL",
  THEORETICAL_DESCRIPTOR: "THEORETICAL_DESCRIPTOR",
} as const);

export type IntentionEpistemicClassification = typeof IntentionEpistemicClassification[keyof typeof IntentionEpistemicClassification];
