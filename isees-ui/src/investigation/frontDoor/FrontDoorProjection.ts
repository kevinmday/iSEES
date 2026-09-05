import {
  FrontDoorActionId,
  FrontDoorActionIntent,
  FrontDoorNoticeCode,
  FrontDoorProjectionErrorCode,
  GuestRestorableWorkStatus,
  InvestigationLibraryStatus,
  OverviewFrontDoorManifestation,
  RepositoryCapabilityState,
  type ExternalRepositoryProjection,
  type FrontDoorActionProjection,
  type FrontDoorNoticeProjection,
  type FrontDoorProjectionError,
  type InvestigationLibraryProjection,
  type OverviewFrontDoorProjection,
  type OverviewFrontDoorProjectionInput,
  type SystemCanonCardProjection,
} from "./FrontDoorProjectionTypes.ts";

const repositoryCapabilities = new Set<string>(
  Object.values(RepositoryCapabilityState),
);

function immutableCopy<T>(value: T): T {
  if (Array.isArray(value)) {
    const copy = value.map(item => immutableCopy(item));
    return Object.freeze(copy) as T;
  }

  if (value !== null && typeof value === "object") {
    const copy: Record<string, unknown> = {};
    for (const [key, item] of Object.entries(value)) {
      copy[key] = immutableCopy(item);
    }
    return Object.freeze(copy) as T;
  }

  return value;
}

function projectLibrary(
  library: InvestigationLibraryProjection,
): InvestigationLibraryProjection {
  return immutableCopy({
    status: library.status,
    summaries: library.summaries.map(summary => ({
      investigationId: summary.investigationId,
      title: summary.title,
    })),
  });
}

function projectCanon(
  cards: readonly SystemCanonCardProjection[],
): readonly SystemCanonCardProjection[] {
  return immutableCopy(cards.map(card => ({ ...card })));
}

function projectRepositories(
  repositories: readonly ExternalRepositoryProjection[],
): readonly ExternalRepositoryProjection[] {
  return immutableCopy(repositories.map(repository => ({ ...repository })));
}

function validateInput(
  input: OverviewFrontDoorProjectionInput,
): readonly FrontDoorProjectionError[] {
  const errors: FrontDoorProjectionError[] = [];
  const summaries = input.library.summaries;

  if (
    input.library.status === InvestigationLibraryStatus.READY &&
    summaries.length === 0
  ) {
    errors.push({
      code: FrontDoorProjectionErrorCode.READY_LIBRARY_EMPTY,
      message: "A READY Investigation Library must contain at least one owned summary.",
    });
  }

  if (
    input.library.status === InvestigationLibraryStatus.EMPTY &&
    summaries.length !== 0
  ) {
    errors.push({
      code: FrontDoorProjectionErrorCode.EMPTY_LIBRARY_NONEMPTY,
      message: "An EMPTY Investigation Library cannot contain owned summaries.",
    });
  }

  const seenInvestigationIds = new Set<string>();
  for (const summary of summaries) {
    if (seenInvestigationIds.has(summary.investigationId)) {
      errors.push({
        code: FrontDoorProjectionErrorCode.DUPLICATE_INVESTIGATION_ID,
        message: "Investigation Library summaries must have unique investigation IDs.",
        subjectId: summary.investigationId,
      });
    }
    seenInvestigationIds.add(summary.investigationId);
  }

  const activeId = input.activeInvestigation.investigationId;
  if (
    input.library.status === InvestigationLibraryStatus.READY &&
    input.activeInvestigation.claimsOwnedByIdentity &&
    activeId !== undefined &&
    !seenInvestigationIds.has(activeId)
  ) {
    errors.push({
      code: FrontDoorProjectionErrorCode.ACTIVE_OWNED_INVESTIGATION_ABSENT,
      message: "An active investigation claimed as owned must exist in the READY owned library.",
      subjectId: activeId,
    });
  }

  if (
    input.guestRestorableWork.status === GuestRestorableWorkStatus.VALIDATED &&
    input.guestRestorableWork.investigationId.length === 0
  ) {
    errors.push({
      code: FrontDoorProjectionErrorCode.INVALID_GUEST_RESTORABLE_WORK,
      message: "Validated Guest restorable work requires an investigation ID.",
    });
  }

  for (const repository of input.caseGateway.repositories) {
    if (!repositoryCapabilities.has(repository.capability)) {
      errors.push({
        code: FrontDoorProjectionErrorCode.UNSUPPORTED_REPOSITORY_CAPABILITY,
        message: "Repository capability must be an explicit supported capability state.",
        subjectId: repository.repositoryId,
      });
    }
  }

  return immutableCopy(errors);
}

function accountManifestation(
  status: InvestigationLibraryStatus,
): ValidOverviewFrontDoorProjectionManifestation {
  if (status === InvestigationLibraryStatus.EMPTY) {
    return OverviewFrontDoorManifestation.NEW_ACCOUNT;
  }
  if (status === InvestigationLibraryStatus.READY) {
    return OverviewFrontDoorManifestation.RETURNING_ACCOUNT;
  }
  return OverviewFrontDoorManifestation.ACCOUNT_LIBRARY_UNRESOLVED;
}

type ValidOverviewFrontDoorProjectionManifestation = Exclude<
  OverviewFrontDoorManifestation,
  typeof OverviewFrontDoorManifestation.INVALID_INPUT
>;

function actionsFor(
  manifestation: ValidOverviewFrontDoorProjectionManifestation,
  library: InvestigationLibraryProjection,
): readonly FrontDoorActionProjection[] {
  const actions: FrontDoorActionProjection[] = [
    {
      actionId: FrontDoorActionId.EXPLORE_CANON,
      intent: FrontDoorActionIntent.READ_ONLY,
    },
    {
      actionId: FrontDoorActionId.READ_SOURCE,
      intent: FrontDoorActionIntent.READ_ONLY,
    },
    {
      actionId: FrontDoorActionId.START_INVESTIGATION,
      intent: FrontDoorActionIntent.MUTATION,
    },
    {
      actionId: FrontDoorActionId.IMPORT_CASE,
      intent: FrontDoorActionIntent.MUTATION,
    },
  ];

  if (manifestation === OverviewFrontDoorManifestation.FRESH_GUEST) {
    actions.push(
      { actionId: FrontDoorActionId.LOG_IN, intent: FrontDoorActionIntent.IDENTITY },
      { actionId: FrontDoorActionId.CREATE_ACCOUNT, intent: FrontDoorActionIntent.IDENTITY },
    );
  }

  if (manifestation === OverviewFrontDoorManifestation.RETURNING_GUEST) {
    actions.push({
      actionId: FrontDoorActionId.RESUME_INVESTIGATION,
      intent: FrontDoorActionIntent.MUTATION,
    });
  }

  if (manifestation === OverviewFrontDoorManifestation.RETURNING_ACCOUNT) {
    for (const summary of library.summaries) {
      actions.push({
        actionId: FrontDoorActionId.OPEN_INVESTIGATION,
        intent: FrontDoorActionIntent.MUTATION,
        targetId: summary.investigationId,
      });
    }
  }

  return immutableCopy(actions);
}

function noticesFor(
  input: OverviewFrontDoorProjectionInput,
  manifestation: ValidOverviewFrontDoorProjectionManifestation,
): readonly FrontDoorNoticeProjection[] {
  const notices: FrontDoorNoticeProjection[] = [];

  if (input.identity.kind === "GUEST") {
    notices.push({
      code: FrontDoorNoticeCode.GUEST_SESSION_LOCAL,
      message: "Guest work uses session/browser-local persistence where available.",
    });
  } else {
    notices.push({
      code: FrontDoorNoticeCode.ACCOUNT_DURABLE_OWNERSHIP,
      message: "Accounts add durable ownership and synchronization; investigative capability is unchanged.",
    });
  }

  if (manifestation === OverviewFrontDoorManifestation.ACCOUNT_LIBRARY_UNRESOLVED) {
    notices.push({
      code: FrontDoorNoticeCode.ACCOUNT_LIBRARY_UNRESOLVED,
      message: "A loading, stale, failed, or unrequested Account library cannot be classified as empty.",
    });
  }

  if (input.caseGateway.repositories.length > 0) {
    notices.push({
      code: FrontDoorNoticeCode.REPOSITORY_NON_ENDORSEMENT,
      message: "Repository capability labels describe executable support and do not imply partnership or endorsement.",
    });
  }

  return immutableCopy(notices);
}

export function resolveOverviewFrontDoorProjection(
  input: OverviewFrontDoorProjectionInput,
): OverviewFrontDoorProjection {
  const identity = immutableCopy({ ...input.identity });
  const library = projectLibrary(input.library);
  const canon = projectCanon(input.caseGateway.canonCards);
  const repositoryProjections = projectRepositories(input.caseGateway.repositories);
  const errors = validateInput(input);

  if (errors.length > 0) {
    return immutableCopy({
      status: "INVALID" as const,
      manifestation: OverviewFrontDoorManifestation.INVALID_INPUT,
      identity,
      library,
      canon,
      repositoryProjections,
      primaryActions: [],
      notices: [],
      errors,
    });
  }

  const manifestation: ValidOverviewFrontDoorProjectionManifestation =
    input.identity.kind === "GUEST"
      ? input.guestRestorableWork.status === GuestRestorableWorkStatus.VALIDATED
        ? OverviewFrontDoorManifestation.RETURNING_GUEST
        : OverviewFrontDoorManifestation.FRESH_GUEST
      : accountManifestation(input.library.status);

  return immutableCopy({
    status: "VALID" as const,
    manifestation,
    identity,
    library,
    canon,
    repositoryProjections,
    primaryActions: actionsFor(manifestation, library),
    notices: noticesFor(input, manifestation),
  });
}
