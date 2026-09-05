export const FrontDoorIdentityKind = {
  GUEST: "GUEST",
  ACCOUNT: "ACCOUNT",
} as const;
export type FrontDoorIdentityKind = typeof FrontDoorIdentityKind[keyof typeof FrontDoorIdentityKind];

export const FrontDoorPersistenceCapability = {
  SESSION: "SESSION",
  PERSISTENT: "PERSISTENT",
} as const;
export type FrontDoorPersistenceCapability = typeof FrontDoorPersistenceCapability[keyof typeof FrontDoorPersistenceCapability];

export const InvestigationLibraryStatus = {
  NOT_REQUESTED: "NOT_REQUESTED",
  LOADING: "LOADING",
  READY: "READY",
  EMPTY: "EMPTY",
  STALE: "STALE",
  ERROR: "ERROR",
} as const;
export type InvestigationLibraryStatus = typeof InvestigationLibraryStatus[keyof typeof InvestigationLibraryStatus];

export const GuestRestorableWorkStatus = {
  NONE: "NONE",
  VALIDATED: "VALIDATED",
} as const;
export type GuestRestorableWorkStatus = typeof GuestRestorableWorkStatus[keyof typeof GuestRestorableWorkStatus];

export const RepositoryCapabilityState = {
  INTEGRATED: "INTEGRATED",
  IMPORT_SUPPORTED: "IMPORT_SUPPORTED",
  REFERENCE_SUPPORTED: "REFERENCE_SUPPORTED",
  EXTERNAL_READING: "EXTERNAL_READING",
  RESTRICTED: "RESTRICTED",
  PLANNED: "PLANNED",
} as const;
export type RepositoryCapabilityState = typeof RepositoryCapabilityState[keyof typeof RepositoryCapabilityState];

export const OverviewFrontDoorManifestation = {
  FRESH_GUEST: "FRESH_GUEST",
  RETURNING_GUEST: "RETURNING_GUEST",
  NEW_ACCOUNT: "NEW_ACCOUNT",
  RETURNING_ACCOUNT: "RETURNING_ACCOUNT",
  ACCOUNT_LIBRARY_UNRESOLVED: "ACCOUNT_LIBRARY_UNRESOLVED",
  INVALID_INPUT: "INVALID_INPUT",
} as const;
export type OverviewFrontDoorManifestation = typeof OverviewFrontDoorManifestation[keyof typeof OverviewFrontDoorManifestation];

export const FrontDoorActionId = {
  EXPLORE_CANON: "EXPLORE_CANON",
  READ_SOURCE: "READ_SOURCE",
  START_INVESTIGATION: "START_INVESTIGATION",
  IMPORT_CASE: "IMPORT_CASE",
  OPEN_INVESTIGATION: "OPEN_INVESTIGATION",
  RESUME_INVESTIGATION: "RESUME_INVESTIGATION",
  LOG_IN: "LOG_IN",
  CREATE_ACCOUNT: "CREATE_ACCOUNT",
} as const;
export type FrontDoorActionId = typeof FrontDoorActionId[keyof typeof FrontDoorActionId];

export const FrontDoorActionIntent = {
  READ_ONLY: "READ_ONLY",
  MUTATION: "MUTATION",
  IDENTITY: "IDENTITY",
} as const;
export type FrontDoorActionIntent = typeof FrontDoorActionIntent[keyof typeof FrontDoorActionIntent];

export const FrontDoorNoticeCode = {
  GUEST_SESSION_LOCAL: "GUEST_SESSION_LOCAL",
  ACCOUNT_DURABLE_OWNERSHIP: "ACCOUNT_DURABLE_OWNERSHIP",
  ACCOUNT_LIBRARY_UNRESOLVED: "ACCOUNT_LIBRARY_UNRESOLVED",
  REPOSITORY_NON_ENDORSEMENT: "REPOSITORY_NON_ENDORSEMENT",
} as const;
export type FrontDoorNoticeCode = typeof FrontDoorNoticeCode[keyof typeof FrontDoorNoticeCode];

export const FrontDoorProjectionErrorCode = {
  READY_LIBRARY_EMPTY: "READY_LIBRARY_EMPTY",
  EMPTY_LIBRARY_NONEMPTY: "EMPTY_LIBRARY_NONEMPTY",
  DUPLICATE_INVESTIGATION_ID: "DUPLICATE_INVESTIGATION_ID",
  ACTIVE_OWNED_INVESTIGATION_ABSENT: "ACTIVE_OWNED_INVESTIGATION_ABSENT",
  INVALID_GUEST_RESTORABLE_WORK: "INVALID_GUEST_RESTORABLE_WORK",
  UNSUPPORTED_REPOSITORY_CAPABILITY: "UNSUPPORTED_REPOSITORY_CAPABILITY",
} as const;
export type FrontDoorProjectionErrorCode = typeof FrontDoorProjectionErrorCode[keyof typeof FrontDoorProjectionErrorCode];

export interface FrontDoorIdentityProjection {
  readonly kind: FrontDoorIdentityKind;
  readonly persistence: FrontDoorPersistenceCapability;
}

export interface InvestigationSummaryProjection {
  readonly investigationId: string;
  readonly title: string;
}

export interface InvestigationLibraryProjection {
  readonly status: InvestigationLibraryStatus;
  readonly summaries: readonly InvestigationSummaryProjection[];
}

export type GuestRestorableWorkProjection =
  | {
      readonly status: typeof GuestRestorableWorkStatus.NONE;
    }
  | {
      readonly status: typeof GuestRestorableWorkStatus.VALIDATED;
      readonly investigationId: string;
    };

export interface ActiveInvestigationProjection {
  readonly investigationId?: string;
  readonly claimsOwnedByIdentity: boolean;
}

export interface SystemCanonCardProjection {
  readonly canonCardId: string;
  readonly title: string;
  readonly summary: string;
  readonly sourceReference: string;
}

export interface ExternalRepositoryProjection {
  readonly repositoryId: string;
  readonly label: string;
  readonly capability: RepositoryCapabilityState;
}

export interface CaseGatewayProjection {
  readonly canonCards: readonly SystemCanonCardProjection[];
  readonly repositories: readonly ExternalRepositoryProjection[];
}

export interface OverviewFrontDoorProjectionInput {
  readonly identity: FrontDoorIdentityProjection;
  readonly library: InvestigationLibraryProjection;
  readonly guestRestorableWork: GuestRestorableWorkProjection;
  readonly activeInvestigation: ActiveInvestigationProjection;
  readonly caseGateway: CaseGatewayProjection;
}

export interface FrontDoorActionProjection {
  readonly actionId: FrontDoorActionId;
  readonly intent: FrontDoorActionIntent;
  readonly targetId?: string;
}

export interface FrontDoorNoticeProjection {
  readonly code: FrontDoorNoticeCode;
  readonly message: string;
}

export interface FrontDoorProjectionError {
  readonly code: FrontDoorProjectionErrorCode;
  readonly message: string;
  readonly subjectId?: string;
}

interface OverviewFrontDoorProjectionBase {
  readonly manifestation: OverviewFrontDoorManifestation;
  readonly identity: FrontDoorIdentityProjection;
  readonly library: InvestigationLibraryProjection;
  readonly canon: readonly SystemCanonCardProjection[];
  readonly repositoryProjections: readonly ExternalRepositoryProjection[];
  readonly primaryActions: readonly FrontDoorActionProjection[];
  readonly notices: readonly FrontDoorNoticeProjection[];
}

export interface ValidOverviewFrontDoorProjection
  extends OverviewFrontDoorProjectionBase {
  readonly status: "VALID";
  readonly manifestation:
    | typeof OverviewFrontDoorManifestation.FRESH_GUEST
    | typeof OverviewFrontDoorManifestation.RETURNING_GUEST
    | typeof OverviewFrontDoorManifestation.NEW_ACCOUNT
    | typeof OverviewFrontDoorManifestation.RETURNING_ACCOUNT
    | typeof OverviewFrontDoorManifestation.ACCOUNT_LIBRARY_UNRESOLVED;
}

export interface InvalidOverviewFrontDoorProjection
  extends OverviewFrontDoorProjectionBase {
  readonly status: "INVALID";
  readonly manifestation: typeof OverviewFrontDoorManifestation.INVALID_INPUT;
  readonly errors: readonly FrontDoorProjectionError[];
}

export type OverviewFrontDoorProjection =
  | ValidOverviewFrontDoorProjection
  | InvalidOverviewFrontDoorProjection;
