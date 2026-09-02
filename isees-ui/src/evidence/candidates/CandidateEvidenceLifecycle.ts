import type {
  CandidateAcquiredContent,
  CandidateAcquisitionState,
  CandidateActor,
  CandidateArchiveState,
  CandidateAvailability,
  CandidateEvidence,
  CandidateLifecycleState,
  CandidateProvenanceEvent,
  CandidateReviewDecision,
  CreateCandidateEvidenceInput,
} from "./CandidateEvidenceTypes.ts";

const ACQUISITION_TRANSITIONS = Object.freeze({
  NOT_REQUESTED: Object.freeze(["QUEUED", "BLOCKED"]), QUEUED: Object.freeze(["ACQUIRING", "FAILED", "BLOCKED"]),
  ACQUIRING: Object.freeze(["ACQUIRED", "FAILED", "BLOCKED"]), ACQUIRED: Object.freeze([]), FAILED: Object.freeze(["QUEUED", "BLOCKED"]), BLOCKED: Object.freeze(["QUEUED"]),
} as const satisfies Readonly<Record<CandidateAcquisitionState, readonly CandidateAcquisitionState[]>>);
const ARCHIVE_TRANSITIONS = Object.freeze({
  NOT_REQUESTED: Object.freeze(["QUEUED", "PROHIBITED"]), QUEUED: Object.freeze(["ARCHIVED", "FAILED", "PROHIBITED"]), ARCHIVED: Object.freeze([]), FAILED: Object.freeze(["QUEUED", "PROHIBITED"]), PROHIBITED: Object.freeze([]),
} as const satisfies Readonly<Record<CandidateArchiveState, readonly CandidateArchiveState[]>>);

export const CANDIDATE_LIFECYCLE_TRANSITIONS = Object.freeze({
  DISCOVERED: Object.freeze(["REFERENCED"]),
  SUBMITTED: Object.freeze(["REFERENCED"]),
  REFERENCED: Object.freeze(["ACQUIRED", "IN_REVIEW"]),
  ACQUIRED: Object.freeze(["IN_REVIEW"]),
  IN_REVIEW: Object.freeze(["ADMITTED", "DEFERRED", "EXCLUDED"]),
  ADMITTED: Object.freeze([]),
  DEFERRED: Object.freeze(["IN_REVIEW"]),
  EXCLUDED: Object.freeze([]),
} as const satisfies Readonly<Record<CandidateLifecycleState, readonly CandidateLifecycleState[]>>);

function assertText(value: string, label: string): void {
  if (value.trim().length === 0) throw new Error(`${label} is required`);
}

export function immutable<T>(value: T): T {
  if (value !== null && typeof value === "object" && !Object.isFrozen(value)) {
    for (const nested of Object.values(value)) immutable(nested);
    Object.freeze(value);
  }
  return value;
}

export function createCandidateEvidence(input: CreateCandidateEvidenceInput): CandidateEvidence {
  assertText(input.candidateId, "candidateId");
  assertText(input.investigationId, "investigationId");
  assertText(input.originIdentity, "originIdentity");
  if (input.origin !== input.lineage.kind) throw new Error("Origin and immutable lineage kind must agree");
  if (input.association && input.association.basis !== "EXACT_CANONICAL_ID") throw new Error("Canonical association must use EXACT_CANONICAL_ID");
  const lifecycleState = input.origin === "DISCOVERY" ? "DISCOVERED" : "SUBMITTED";
  return immutable({
    ...input,
    source: input.source ?? {},
    revision: 0,
    lifecycleState,
    acquisitionState: "NOT_REQUESTED",
    archiveState: "NOT_REQUESTED",
    availability: "UNKNOWN",
    provenanceEvents: [],
  });
}

export interface CandidateTransitionRequest {
  readonly expectedRevision: number;
  readonly to: CandidateLifecycleState;
  readonly actor: CandidateActor;
  readonly occurredAt: string;
  readonly eventId: string;
  readonly reviewDecision?: CandidateReviewDecision;
}

export function transitionCandidate(candidate: CandidateEvidence, request: CandidateTransitionRequest): CandidateEvidence {
  if (candidate.revision !== request.expectedRevision) throw new Error("Candidate revision conflict");
  if (!(CANDIDATE_LIFECYCLE_TRANSITIONS[candidate.lifecycleState] as readonly CandidateLifecycleState[]).includes(request.to)) throw new Error("Prohibited candidate lifecycle transition");
  if (request.to === "ACQUIRED" && (candidate.acquisitionState !== "ACQUIRED" || !candidate.acquiredContent)) throw new Error("ACQUIRED lifecycle requires an independently completed acquisition observation");
  if (request.to === "ADMITTED") {
    if (request.actor.kind !== "HUMAN") throw new Error("Automation cannot admit Candidate Evidence");
    const decision = request.reviewDecision;
    if (!decision || decision.decision !== "ADMITTED" || !decision.admissionReceiptIdentity || !decision.admittedArtifactId) throw new Error("ADMITTED requires a complete admission decision and receipt identity");
    for (const [value, label] of [[decision.reviewerId, "reviewerId"], [decision.decidedAt, "decision time"], [decision.reason, "decision reason"]] as const) assertText(value, label);
    if (decision.reviewerId !== request.actor.actorId) throw new Error("Reviewer must be the attributable transition actor");
  } else if (request.to === "EXCLUDED" || request.to === "DEFERRED") {
    const decision = request.reviewDecision;
    if (request.actor.kind !== "HUMAN" || !decision || decision.decision !== request.to) throw new Error(`${request.to} requires a human review decision`);
    for (const [value, label] of [[decision.reviewerId, "reviewerId"], [decision.decidedAt, "decision time"], [decision.reason, "decision reason"]] as const) assertText(value, label);
    if (decision.reviewerId !== request.actor.actorId) throw new Error("Reviewer must be the attributable transition actor");
  } else if (request.reviewDecision) {
    throw new Error("Review decision metadata is only valid for review decisions");
  }
  const event: CandidateProvenanceEvent = {
    eventId: request.eventId,
    candidateId: candidate.candidateId,
    investigationId: candidate.investigationId,
    actor: request.actor,
    occurredAt: request.occurredAt,
    action: `LIFECYCLE_${request.to}`,
    priorRevision: candidate.revision,
    resultingRevision: candidate.revision + 1,
    priorLifecycleState: candidate.lifecycleState,
    resultingLifecycleState: request.to,
  };
  return immutable({
    ...candidate,
    revision: candidate.revision + 1,
    lifecycleState: request.to,
    reviewDecision: request.reviewDecision ?? candidate.reviewDecision,
    provenanceEvents: [...candidate.provenanceEvents, event],
  });
}

interface ObservationRequest<T> {
  readonly expectedRevision: number;
  readonly to: T;
  readonly actor: CandidateActor;
  readonly occurredAt: string;
  readonly eventId: string;
}

function observedUpdate(candidate: CandidateEvidence, request: ObservationRequest<unknown>, changes: Partial<CandidateEvidence>, action: string): CandidateEvidence {
  if (candidate.revision !== request.expectedRevision) throw new Error("Candidate revision conflict");
  const revision = candidate.revision + 1;
  const event: CandidateProvenanceEvent = { eventId: request.eventId, candidateId: candidate.candidateId, investigationId: candidate.investigationId, actor: request.actor, occurredAt: request.occurredAt, action, priorRevision: candidate.revision, resultingRevision: revision, priorLifecycleState: candidate.lifecycleState, resultingLifecycleState: candidate.lifecycleState };
  return immutable({ ...candidate, ...changes, revision, provenanceEvents: [...candidate.provenanceEvents, event] });
}

export function transitionAcquisition(candidate: CandidateEvidence, request: ObservationRequest<CandidateAcquisitionState> & { readonly acquiredContent?: CandidateAcquiredContent }): CandidateEvidence {
  if (!(ACQUISITION_TRANSITIONS[candidate.acquisitionState] as readonly CandidateAcquisitionState[]).includes(request.to)) throw new Error("Prohibited acquisition transition");
  if (request.to === "ACQUIRED") {
    const content = request.acquiredContent;
    if (!content || !content.objectIdentity.trim() || !content.digest.algorithm.trim() || !content.digest.contentHash.trim() || !Number.isSafeInteger(content.byteLength) || content.byteLength < 0) throw new Error("Acquired bytes require object identity, byte length, digest algorithm, and content hash");
  } else if (request.acquiredContent) throw new Error("Acquired content is valid only for ACQUIRED");
  return observedUpdate(candidate, request, { acquisitionState: request.to, acquiredContent: request.acquiredContent ?? candidate.acquiredContent }, `ACQUISITION_${request.to}`);
}

export function transitionArchive(candidate: CandidateEvidence, request: ObservationRequest<CandidateArchiveState>): CandidateEvidence {
  if (!(ARCHIVE_TRANSITIONS[candidate.archiveState] as readonly CandidateArchiveState[]).includes(request.to)) throw new Error("Prohibited archive transition");
  return observedUpdate(candidate, request, { archiveState: request.to }, `ARCHIVE_${request.to}`);
}

export function observeAvailability(candidate: CandidateEvidence, request: ObservationRequest<CandidateAvailability>): CandidateEvidence {
  if (request.to === candidate.availability) throw new Error("Equivalent availability observation replay is rejected");
  return observedUpdate(candidate, request, { availability: request.to }, `AVAILABILITY_${request.to}`);
}
