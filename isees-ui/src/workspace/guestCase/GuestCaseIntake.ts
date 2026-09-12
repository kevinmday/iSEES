import type { OperatorIdentityState } from "../../identity/runtime/OperatorIdentityRuntimeTypes";
import type { Investigation } from "../../investigation/investigationTypes";
import type { GuestCandidateEvent } from "../workspaceTypes";
import type { WorkspaceRuntime } from "../runtime/WorkspaceRuntime";
import { mapFormStateToContent, validateNativeCaseDraftForm, type NativeCaseDraftFormState } from "../../nativeCaseDraft/NativeCaseDraftFieldState.ts";
import type { NativeCaseDraftContent } from "../../nativeCaseDraft/NativeCaseDraftTypes.ts";
import { createGuestCandidateKnowledgeObject, serializeGuestCandidateContent } from "../../knowledge/ingestion/GuestCandidateKnowledgeAdapter.ts";
import { materializeInitialOperationalRevision } from "../../investigation/revision/OperationalGraphRevision.ts";
import type { KnowledgeObject } from "../../knowledge/model/KnowledgeObject.ts";

export type GuestCaseIntakeResult =
  | Readonly<{ status: "INVALID"; validation: ReturnType<typeof validateNativeCaseDraftForm>; workingTitleError?: string }>
  | Readonly<{ status: "CREATED"; investigation: Investigation; candidate: GuestCandidateEvent }>;

export { serializeGuestCandidateContent } from "../../knowledge/ingestion/GuestCandidateKnowledgeAdapter.ts";
const suppliedTitle = (content: NativeCaseDraftContent): string | null => content.workingTitle.state === "SUPPLIED" ? content.workingTitle.value?.trim() || null : null;
export const GUEST_WORKING_TITLE_REQUIRED_MESSAGE = "Your case needs a working title. We’ve taken you to the required field.";

export function createGuestCandidateInvestigation(
  form: NativeCaseDraftFormState,
  identity: OperatorIdentityState,
  recordedAt: string,
  sessionIdentity = crypto.randomUUID(),
  operationalContext: readonly KnowledgeObject[] = [],
): GuestCaseIntakeResult {
  const validation = validateNativeCaseDraftForm(form);
  if (validation.some(result => !result.valid)) return Object.freeze({ status: "INVALID", validation });
  const content = mapFormStateToContent(form);
  const title = suppliedTitle(content);
  if (title === null) {
    const guestValidation = validation.map(result => result.field === "workingTitle" ? Object.freeze({ ...result, valid: false, message: "Working title is required for a guest case." }) : result);
    return Object.freeze({ status: "INVALID", validation: Object.freeze(guestValidation), workingTitleError: GUEST_WORKING_TITLE_REQUIRED_MESSAGE });
  }
  if (identity.status !== "READY" || identity.identity?.kind !== "GUEST" || identity.persistence !== "SESSION") {
    throw new Error("Bring Your Own Case requires an active Guest session.");
  }
  const canonicalSerialization = serializeGuestCandidateContent(content);
  const candidateId = `guest-candidate:${sessionIdentity}`;
  const knowledgeObject = createGuestCandidateKnowledgeObject({ candidateId, title, content, operatorId: identity.identity.operatorId, recordedAt });
  const candidate: GuestCandidateEvent = Object.freeze({
    candidateId, knowledgeClassification: "CANDIDATE_KNOWLEDGE", origin: "RESEARCHER_SUPPLIED",
    lifecycle: "DRAFT", objectType: "EVENT", operationalMaterialization: "INITIAL_REVISION_ACTIVE", systemCanonIdentity: null,
    title, content, canonicalSerialization, knowledgeObject,
  });
  const investigationId = `guest-investigation:${candidateId.slice("guest-candidate:".length)}`;
  const revisionless: Investigation = Object.freeze({
    id: investigationId, name: candidate.title, description: content.observationNarrative.state === "SUPPLIED" ? content.observationNarrative.value! : "Researcher-supplied temporary case.",
    createdAt: recordedAt, updatedAt: recordedAt, createdBy: identity.identity.operatorId, status: "DRAFT",
    workspace: Object.freeze({ id: `workspace:${investigationId}`, name: candidate.title,
      description: "Temporary guest candidate workspace.",
      imported_events: [Object.freeze({ event_id: candidateId, source: "RESEARCHER_SUPPLIED" as const })],
      focused_event_id: candidateId, guest_candidate_event: candidate, investigations: [], artifacts: [], active_layers: [], created_at: recordedAt }),
    revisions: [],
  });
  const investigation = materializeInitialOperationalRevision(
    revisionless,
    [...operationalContext, knowledgeObject],
    { recordedAt },
  );
  return Object.freeze({ status: "CREATED", investigation, candidate });
}

export function submitGuestCase(form: NativeCaseDraftFormState, identity: OperatorIdentityState, runtime: WorkspaceRuntime, operationalContext: readonly KnowledgeObject[], recordedAt = new Date().toISOString()): GuestCaseIntakeResult {
  const result = createGuestCandidateInvestigation(form, identity, recordedAt, crypto.randomUUID(), operationalContext);
  if (result.status === "CREATED") runtime.activateGuestCandidateInvestigation(result.investigation);
  return result;
}
