import type { InvestigationLibraryStatus } from "../frontDoor/FrontDoorProjectionTypes.ts";

export const InvestigationLifecycle = {
  ACTIVE: "ACTIVE",
} as const;
export type InvestigationLifecycle = typeof InvestigationLifecycle[keyof typeof InvestigationLifecycle];

export interface InvestigationSummary {
  readonly investigationId: string;
  readonly title: string;
  readonly objective: string | null;
  readonly lifecycle: InvestigationLifecycle;
  readonly createdAt: string;
  readonly modifiedAt: string;
  readonly version: number;
}

export interface InvestigationListResult {
  readonly items: readonly InvestigationSummary[];
}

export const InvestigationLibraryErrorCode = {
  INVALID_PRINCIPAL: "INVALID_PRINCIPAL",
  TRANSPORT_FAILURE: "TRANSPORT_FAILURE",
  REQUEST_ABORTED: "REQUEST_ABORTED",
  MALFORMED_RESPONSE: "MALFORMED_RESPONSE",
  INVESTIGATION_NOT_FOUND: "INVESTIGATION_NOT_FOUND",
  INVESTIGATION_REPOSITORY_UNAVAILABLE: "INVESTIGATION_REPOSITORY_UNAVAILABLE",
  UNKNOWN_SERVER_ERROR: "UNKNOWN_SERVER_ERROR",
} as const;
export type InvestigationLibraryErrorCode = typeof InvestigationLibraryErrorCode[keyof typeof InvestigationLibraryErrorCode];

export class InvestigationLibraryError extends Error {
  readonly code: InvestigationLibraryErrorCode;
  readonly status?: number;
  readonly requestId?: string;
  readonly backendCode?: string;

  constructor(
    code: InvestigationLibraryErrorCode,
    message: string,
    options: { readonly status?: number; readonly requestId?: string; readonly backendCode?: string } = {},
  ) {
    super(message);
    this.name = "InvestigationLibraryError";
    this.code = code;
    this.status = options.status;
    this.requestId = options.requestId;
    this.backendCode = options.backendCode;
    Object.freeze(this);
  }
}

export interface InvestigationLibraryLoadMetadata {
  readonly loadedAt: string;
}

export interface InvestigationLibraryState {
  readonly principalId: string | null;
  readonly status: InvestigationLibraryStatus;
  readonly summaries: readonly InvestigationSummary[];
  readonly requestGeneration: number;
  readonly lastSuccessfulLoad?: InvestigationLibraryLoadMetadata;
  readonly error?: InvestigationLibraryError;
}
