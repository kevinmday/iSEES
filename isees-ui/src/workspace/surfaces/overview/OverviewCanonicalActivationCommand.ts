import type { FederationAdapter } from "../../../federation/adapters/FederationAdapter";
import {
  importInvestigationIntoWorkspace,
  type CanonicalInvestigationImportResult,
} from "../../../federation/services/importInvestigation";
import type { KnowledgeObject } from "../../../knowledge/model/KnowledgeObject";
import type { WorkspaceRuntime } from "../../runtime/WorkspaceRuntime";

export type OverviewCanonicalActivationOutcome =
  | Readonly<{ status: "SUCCEEDED"; result: CanonicalInvestigationImportResult }>
  | Readonly<{ status: "ERROR"; error: Error }>;

export interface OverviewCanonicalActivationRequest {
  readonly adapter: FederationAdapter;
  readonly eventId: string;
  readonly runtime: WorkspaceRuntime;
  readonly admittedKnowledge: readonly KnowledgeObject[];
  readonly activationStillCurrent: () => boolean;
}

function asActivationError(error: unknown): Error {
  return error instanceof Error
    ? error
    : new Error("Unable to load this canonical event.");
}

/**
 * One settling command boundary for the Overview action.
 *
 * Construction and validation finish before WorkspaceRuntime is touched. The
 * runtime publication is synchronous, and subscriber-driven Guest persistence
 * is therefore complete before SUCCEEDED is returned.
 */
export async function executeOverviewCanonicalActivation(
  request: OverviewCanonicalActivationRequest,
): Promise<OverviewCanonicalActivationOutcome> {
  try {
    const result = await importInvestigationIntoWorkspace(
      request.adapter,
      request.eventId,
      request.runtime,
      request.admittedKnowledge,
      request.activationStillCurrent,
    );
    return Object.freeze({ status: "SUCCEEDED", result });
  } catch (error) {
    return Object.freeze({ status: "ERROR", error: asActivationError(error) });
  }
}
