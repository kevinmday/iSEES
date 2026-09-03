import type { TimelineTemporalItem } from "./TimelineTemporalProjectionTypes";

export const TimelineCorrespondenceStatus = {
  POTENTIAL_CORRESPONDENCE: "POTENTIAL_CORRESPONDENCE",
  POTENTIAL_CONTRADICTION: "POTENTIAL_CONTRADICTION",
  UNRESOLVED: "UNRESOLVED",
  UNAVAILABLE: "UNAVAILABLE",
} as const;
export type TimelineCorrespondenceStatus = typeof TimelineCorrespondenceStatus[keyof typeof TimelineCorrespondenceStatus];

export type TimelineCorrespondence = Readonly<{
  correspondenceId: string;
  focusedItemId: string;
  comparedItemId: string;
  status: TimelineCorrespondenceStatus;
  explanation: string;
}>;

function lexical(left: string, right: string): number { return left < right ? -1 : left > right ? 1 : 0; }

export function projectTimelineCorrespondences(
  focusedItems: readonly TimelineTemporalItem[],
  comparedItems: readonly TimelineTemporalItem[],
): readonly TimelineCorrespondence[] {
  const results: TimelineCorrespondence[] = [];
  for (const focused of focusedItems) for (const compared of comparedItems) {
    let status: TimelineCorrespondenceStatus = TimelineCorrespondenceStatus.UNAVAILABLE;
    let explanation = "The admitted temporal values do not provide a meaningful shared basis.";
    if (focused.temporal.kind === "UNKNOWN" || compared.temporal.kind === "UNKNOWN") {
      explanation = "Unknown time cannot establish a temporal correspondence.";
    } else if (focused.semantic === compared.semantic && focused.temporal.kind === compared.temporal.kind) {
      status = TimelineCorrespondenceStatus.UNRESOLVED;
      explanation = focused.temporal.kind === "DURATION"
        ? "The records describe comparable durations, but duration similarity does not establish a relationship."
        : "The records share a temporal grammar, but the available evidence does not establish alignment or contradiction.";
    }
    results.push(Object.freeze({
      correspondenceId: `timeline-correspondence:${encodeURIComponent(focused.itemId)}:${encodeURIComponent(compared.itemId)}`,
      focusedItemId: focused.itemId,
      comparedItemId: compared.itemId,
      status,
      explanation,
    }));
  }
  return Object.freeze(results.sort((left, right) => lexical(left.focusedItemId, right.focusedItemId) || lexical(left.comparedItemId, right.comparedItemId)));
}
