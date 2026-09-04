import type { IntentionAvailability } from "./IntentionAvailability";
export const IntentionValidationStatus = Object.freeze({ NOT_TESTED: "NOT_TESTED", UNAVAILABLE: "UNAVAILABLE" } as const);
export type IntentionValidationStatus = typeof IntentionValidationStatus[keyof typeof IntentionValidationStatus];
export interface IntentionHypothesis { readonly id: string; readonly statement: string; readonly nullCandidate: { readonly id: string; readonly statement: string }; readonly assumptions: readonly string[]; readonly requiredInputs: readonly string[]; readonly availability: IntentionAvailability; readonly falsificationConditions: readonly string[]; readonly validationStatus: IntentionValidationStatus; readonly reason: string; }
