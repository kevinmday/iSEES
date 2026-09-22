import type { WorkspaceMode } from "../../workspace/runtime/WorkspaceRuntimeTypes.ts";
import type { GuideSemanticTargetId } from "./GuideSemanticTarget.ts";

export const GUIDED_ORIENTATION_SCHEMA_ID = "isees-guided-orientation" as const;
export const GUIDED_ORIENTATION_SCHEMA_VERSION = "1.0" as const;

export type OrientationCompletionState = "NOT_STARTED" | "IN_PROGRESS" | "COMPLETE";

export interface GuidedOrientationChapter {
  readonly chapterId: string;
  readonly title: string;
  readonly summary: string;
  readonly visibleTranscript: readonly string[];
  readonly spokenTranscript: string;
  readonly interfaceTargetId?: GuideSemanticTargetId;
  readonly recommendedMode?: WorkspaceMode;
  readonly previousChapterId?: string;
  readonly nextChapterId?: string;
  readonly permitsAuthoritativeMutation: false;
}

export interface GuidedOrientationDefinition {
  readonly schemaId: typeof GUIDED_ORIENTATION_SCHEMA_ID;
  readonly schemaVersion: typeof GUIDED_ORIENTATION_SCHEMA_VERSION;
  readonly orientationId: string;
  readonly title: string;
  readonly purpose: string;
  readonly definitionVersion: string;
  readonly authorityBoundary: string;
  readonly advisoryBoundary: string;
  readonly chapters: readonly GuidedOrientationChapter[];
}

export interface GuidedOrientationProgress {
  readonly orientationId: string;
  readonly definitionVersion: string;
  readonly activeChapterId: string;
  readonly completionState: OrientationCompletionState;
}
