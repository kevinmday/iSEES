export const TimelineCompositionKind = {
  FOCUSED_ONLY: "FOCUSED_ONLY",
  PAIRWISE: "PAIRWISE",
  MULTI_EVENT_OVERVIEW: "MULTI_EVENT_OVERVIEW",
} as const;
export type TimelineCompositionKind = typeof TimelineCompositionKind[keyof typeof TimelineCompositionKind];

export function resolveTimelineComposition(qualifiedComparisonCount: number): TimelineCompositionKind {
  if (!Number.isSafeInteger(qualifiedComparisonCount) || qualifiedComparisonCount < 0) {
    throw new Error("Timeline composition requires a non-negative safe-integer qualified comparison count.");
  }
  if (qualifiedComparisonCount === 0) return TimelineCompositionKind.FOCUSED_ONLY;
  if (qualifiedComparisonCount === 1) return TimelineCompositionKind.PAIRWISE;
  return TimelineCompositionKind.MULTI_EVENT_OVERVIEW;
}

export function presentTimelineComposition(kind: TimelineCompositionKind): string {
  if (kind === TimelineCompositionKind.FOCUSED_ONLY) return "Focused Event chronology";
  if (kind === TimelineCompositionKind.PAIRWISE) return "Pairwise chronology available after qualified comparison selection";
  return "Multi-Event chronology overview";
}
