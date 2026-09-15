import type { RelevanceAssessment, IntelligenceVisibility } from "./ContextualRelevance";

export interface DensityCandidate { readonly surfaceId: string; readonly assessment: RelevanceAssessment; }
export interface DensityDecision { readonly surfaceId: string; readonly definitionId: string; readonly visibility: IntelligenceVisibility; readonly score: number; readonly reasons: readonly string[]; }

export function evaluateIntelligenceDensity(candidates: readonly DensityCandidate[]): readonly DensityDecision[] {
  const ordered = [...candidates].sort((a,b) => a.surfaceId.localeCompare(b.surfaceId) || b.assessment.score - a.assessment.score || a.assessment.definitionId.localeCompare(b.assessment.definitionId));
  const budgets = new Map<string, { primary: number; secondary: number }>();
  return Object.freeze(ordered.map(({surfaceId, assessment}) => {
    const budget = budgets.get(surfaceId) ?? { primary: 0, secondary: 0 }; let visibility = assessment.visibility;
    if (visibility === "PRIMARY") { if (budget.primary >= 1) visibility = "AVAILABLE_IN_DETAIL"; else budget.primary++; }
    else if (visibility === "SECONDARY") { if (budget.secondary >= 2) visibility = "AVAILABLE_IN_DETAIL"; else budget.secondary++; }
    budgets.set(surfaceId, budget);
    return Object.freeze({ surfaceId, definitionId: assessment.definitionId, visibility, score: assessment.score, reasons: Object.freeze([...assessment.reasons]) });
  }));
}
