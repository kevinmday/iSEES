export const TimelineCompositionKind = {
  FOCUSED_ONLY: "FOCUSED_ONLY",
  PAIRWISE: "PAIRWISE",
  MULTI_EVENT_OVERVIEW: "MULTI_EVENT_OVERVIEW",
} as const;
export type TimelineCompositionKind = typeof TimelineCompositionKind[keyof typeof TimelineCompositionKind];

export type TimelineCompositionInput = Readonly<{
  qualifiedComparisonCount: number;
  selectedComparisonAvailable: boolean;
  overviewRequested: boolean;
}>;

export function resolveTimelineComposition(input: number | TimelineCompositionInput): TimelineCompositionKind {
  const qualifiedComparisonCount = typeof input === "number" ? input : input.qualifiedComparisonCount;
  if (!Number.isSafeInteger(qualifiedComparisonCount) || qualifiedComparisonCount < 0) {
    throw new Error("Timeline composition requires a non-negative safe-integer qualified comparison count.");
  }
  if (qualifiedComparisonCount === 0) return TimelineCompositionKind.FOCUSED_ONLY;
  if (qualifiedComparisonCount === 1) return typeof input === "number" || input.selectedComparisonAvailable ? TimelineCompositionKind.PAIRWISE : TimelineCompositionKind.FOCUSED_ONLY;
  if (typeof input !== "number" && input.selectedComparisonAvailable && !input.overviewRequested) return TimelineCompositionKind.PAIRWISE;
  return TimelineCompositionKind.MULTI_EVENT_OVERVIEW;
}

export function presentTimelineComposition(kind: TimelineCompositionKind): string {
  if (kind === TimelineCompositionKind.FOCUSED_ONLY) return "Focused Event chronology";
  if (kind === TimelineCompositionKind.PAIRWISE) return "Pairwise chronology available after qualified comparison selection";
  return "Multi-Event chronology overview";
}
