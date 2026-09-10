import type { GuideContextSnapshot } from "./GuideContextSnapshot.ts";
import type { GuideSemanticTargetId } from "./GuideSemanticTarget.ts";

export const GUIDE_DEFINITION_SCHEMA_ID = "isees-guide-definition" as const;
export const GUIDE_DEFINITION_SCHEMA_VERSION = "1.0" as const;
export const GUIDE_LESSON_PREFERENCE_SCHEMA_ID = "isees-guide-lesson-preference" as const;
export const GUIDE_LESSON_PREFERENCE_SCHEMA_VERSION = "1.0" as const;

export const GuideActionClassification = {
  RECOMMENDED: "RECOMMENDED",
  AVAILABLE: "AVAILABLE",
  UNAVAILABLE: "UNAVAILABLE",
  BLOCKED: "BLOCKED",
  CONSEQUENTIAL: "CONSEQUENTIAL",
  INFORMATIONAL: "INFORMATIONAL",
} as const;
export type GuideActionClassification = typeof GuideActionClassification[keyof typeof GuideActionClassification];

export const GuideEpistemicClassification = {
  CANONICAL: "CANONICAL",
  CANDIDATE: "CANDIDATE",
  EXPERIMENTAL: "EXPERIMENTAL",
  DERIVED: "DERIVED",
  NON_CANONICAL: "NON_CANONICAL",
  UNRESOLVED: "UNRESOLVED",
  UNAVAILABLE: "UNAVAILABLE",
  PUBLISHED: "PUBLISHED",
  COLLECTED: "COLLECTED",
  INCOMING: "INCOMING",
  UNASSIGNED: "UNASSIGNED",
} as const;
export type GuideEpistemicClassification = typeof GuideEpistemicClassification[keyof typeof GuideEpistemicClassification];

export interface GuideStateReference {
  readonly classification: GuideEpistemicClassification;
  readonly identifier?: string;
  readonly description: string;
}

export interface GuideConsequence {
  readonly description: string;
  readonly consequential: boolean;
}

export interface GuideProtectedBoundary {
  readonly description: string;
}

export interface GuideBlocker {
  readonly code: string;
  readonly missing: string;
  readonly reason: string;
  readonly remedy: string;
  readonly changesCanonicalState: boolean;
  readonly alternative?: string;
}

/** Describes an advisory action; execution remains owned by an application control. */
export interface GuideAction {
  readonly id: string;
  readonly classification: GuideActionClassification;
  readonly label: string;
  readonly description: string;
  readonly targetId?: GuideSemanticTargetId;
  readonly consequences: readonly GuideConsequence[];
  readonly protectedBoundaries: readonly GuideProtectedBoundary[];
}

export interface GuideVisualStep {
  readonly sequence: number;
  readonly instruction: string;
  readonly targetId: GuideSemanticTargetId;
}

/** A data-only resolved briefing. The optional field enforces zero-or-one recommendation. */
export interface GuideBriefing {
  readonly definitionId: string;
  readonly location: string;
  readonly situation: string;
  readonly significance: string;
  readonly recommendedAction?: GuideAction;
  readonly alternatives: readonly GuideAction[];
  readonly consequences: readonly GuideConsequence[];
  readonly protectedBoundaries: readonly GuideProtectedBoundary[];
  readonly blockers: readonly GuideBlocker[];
  readonly stateReferences: readonly GuideStateReference[];
  readonly showMeTargetId?: GuideSemanticTargetId;
  readonly visualSteps: readonly GuideVisualStep[];
}

export interface GuideDefinition {
  readonly schemaId: typeof GUIDE_DEFINITION_SCHEMA_ID;
  readonly schemaVersion: typeof GUIDE_DEFINITION_SCHEMA_VERSION;
  readonly definitionId: string;
  readonly briefing: GuideBriefing;
}

export type GuideResolution =
  | Readonly<{ status: "RESOLVED"; definition: GuideDefinition }>
  | Readonly<{ status: "NO_MATCH"; message: string; workflowRemainsAvailable: true }>
  | Readonly<{ status: "FAILED_SAFE"; message: string; workflowRemainsAvailable: true }>;

/** Pure registries may implement this contract; mutation functions are intentionally absent. */
export interface GuideDefinitionResolver {
  resolve(snapshot: Readonly<GuideContextSnapshot>): GuideResolution;
}

export const GuideLessonPreferenceStatus = {
  AVAILABLE: "AVAILABLE",
  DISMISSED: "DISMISSED",
  COMPLETE: "COMPLETE",
} as const;
export type GuideLessonPreferenceStatus = typeof GuideLessonPreferenceStatus[keyof typeof GuideLessonPreferenceStatus];

export interface GuideLessonPreference {
  readonly schemaId: typeof GUIDE_LESSON_PREFERENCE_SCHEMA_ID;
  readonly schemaVersion: typeof GUIDE_LESSON_PREFERENCE_SCHEMA_VERSION;
  readonly lessonId: string;
  readonly definitionVersion: string;
  readonly status: GuideLessonPreferenceStatus;
}

/** Storage tier is deliberately undecided; I1 provides no implementation. */
export interface GuideLessonPreferenceStore {
  read(lessonId: string): Promise<GuideLessonPreference | undefined>;
  write(preference: GuideLessonPreference): Promise<void>;
}
