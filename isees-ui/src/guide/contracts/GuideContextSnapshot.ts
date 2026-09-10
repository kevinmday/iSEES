export const GUIDE_CONTEXT_SNAPSHOT_SCHEMA_ID = "isees-guide-context-snapshot" as const;
export const GUIDE_CONTEXT_SNAPSHOT_SCHEMA_VERSION = "1.0" as const;

export const GuideIdentityClassification = {
  NONE: "NONE",
  GUEST: "GUEST",
  ACCOUNT: "ACCOUNT",
} as const;
export type GuideIdentityClassification = typeof GuideIdentityClassification[keyof typeof GuideIdentityClassification];

export const GuideWorkspaceStatus = {
  INITIALIZING: "INITIALIZING",
  READY: "READY",
  ACTIVE: "ACTIVE",
} as const;
export type GuideWorkspaceStatus = typeof GuideWorkspaceStatus[keyof typeof GuideWorkspaceStatus];

export const GuideWorkspaceMode = {
  OVERVIEW: "OVERVIEW",
  MANIFOLD: "MANIFOLD",
  COMPARE: "COMPARE",
  NARRATIVE: "NARRATIVE",
  EVIDENCE: "EVIDENCE",
  TIMELINE: "TIMELINE",
  LAYERS: "LAYERS",
  INTENTION: "INTENTION",
  RESEARCH: "RESEARCH",
} as const;
export type GuideWorkspaceMode = typeof GuideWorkspaceMode[keyof typeof GuideWorkspaceMode];

export const GuideLayoutClassification = {
  NORMAL: "NORMAL",
  FOCUS: "FOCUS",
} as const;
export type GuideLayoutClassification = typeof GuideLayoutClassification[keyof typeof GuideLayoutClassification];

export const GuideSelectionClassification = {
  NONE: "NONE",
  NODE: "NODE",
  EDGE: "EDGE",
  CANDIDATE: "CANDIDATE",
} as const;
export type GuideSelectionClassification = typeof GuideSelectionClassification[keyof typeof GuideSelectionClassification];

export const GuideComparisonClassification = {
  NONE: "NONE",
  READY: "READY",
  STALE: "STALE",
  UNAVAILABLE: "UNAVAILABLE",
} as const;
export type GuideComparisonClassification = typeof GuideComparisonClassification[keyof typeof GuideComparisonClassification];

export const GuideResolveClassification = {
  UNRESOLVED: "UNRESOLVED",
  EXECUTING: "EXECUTING",
  RESOLVED: "RESOLVED",
  STALE: "STALE",
  FAILED: "FAILED",
  UNAVAILABLE: "UNAVAILABLE",
} as const;
export type GuideResolveClassification = typeof GuideResolveClassification[keyof typeof GuideResolveClassification];

export const GuideLayersExperimentClassification = {
  EMPTY: "EMPTY",
  READY: "READY",
  EXECUTING: "EXECUTING",
  COMPLETE: "COMPLETE",
  ERROR: "ERROR",
  UNAVAILABLE: "UNAVAILABLE",
} as const;
export type GuideLayersExperimentClassification = typeof GuideLayersExperimentClassification[keyof typeof GuideLayersExperimentClassification];

export const GuideResearchInboxClassification = {
  NO_ACTIVE_INVESTIGATION: "NO_ACTIVE_INVESTIGATION",
  EMPTY: "EMPTY",
  HAS_NEW_LEADS: "HAS_NEW_LEADS",
  HAS_INCOMING_SOURCES: "HAS_INCOMING_SOURCES",
  HAS_COLLECTED_FINDINGS: "HAS_COLLECTED_FINDINGS",
  MIXED: "MIXED",
} as const;
export type GuideResearchInboxClassification = typeof GuideResearchInboxClassification[keyof typeof GuideResearchInboxClassification];

export const GuidePresentationClassification = {
  CLOSED: "CLOSED",
  OPEN: "OPEN",
  SHOW_ME: "SHOW_ME",
  DISMISSED: "DISMISSED",
} as const;
export type GuidePresentationClassification = typeof GuidePresentationClassification[keyof typeof GuidePresentationClassification];

export const DEFAULT_GUIDE_PRESENTATION_CLASSIFICATION = GuidePresentationClassification.CLOSED;

export interface GuideContextSnapshot {
  readonly schemaId: typeof GUIDE_CONTEXT_SNAPSHOT_SCHEMA_ID;
  readonly schemaVersion: typeof GUIDE_CONTEXT_SNAPSHOT_SCHEMA_VERSION;
  readonly route: string;
  readonly identity: GuideIdentityClassification;
  readonly workspaceStatus: GuideWorkspaceStatus;
  readonly activeMode: GuideWorkspaceMode;
  readonly layout: GuideLayoutClassification;
  readonly activeWorkspaceId?: string;
  readonly activeInvestigationId?: string;
  readonly focusedEventId?: string;
  readonly selection: Readonly<{
    classification: GuideSelectionClassification;
    identifier?: string;
  }>;
  readonly comparison: Readonly<{
    classification: GuideComparisonClassification;
    focusedEventId?: string;
    comparisonEventId?: string;
    candidateId?: string;
  }>;
  readonly resolve: Readonly<{
    classification: GuideResolveClassification;
    executionId?: string;
  }>;
  readonly activeLayerIds: readonly string[];
  readonly layerReadiness?: Readonly<{
    selectedReadyLayerIds: readonly string[];
    selectedUnresolvedLayers: readonly Readonly<{
      layerId: string;
      label: string;
      readiness: "INPUT_NEEDED" | "METHOD_NEEDED" | "BLOCKED";
      missingRequirements: readonly string[];
    }>[];
  }>;
  readonly layersExperiment: Readonly<{
    classification: GuideLayersExperimentClassification;
    executionId?: string;
  }>;
  readonly researchInbox: Readonly<{
    classification: GuideResearchInboxClassification;
    newLeadCount: number;
    incomingSourceCount: number;
    collectedFindingCount: number;
  }>;
  readonly guidePresentation: GuidePresentationClassification;
}
