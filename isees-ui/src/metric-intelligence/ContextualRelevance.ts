import type { IntelligenceDefinition } from "./MetricIntelligenceTypes";

export type IntelligenceVisibility = "PRIMARY" | "SECONDARY" | "AVAILABLE_IN_DETAIL" | "HIDDEN";
export interface IntelligenceContextFacts {
  readonly activeMode: string;
  readonly surfaceId: string;
  readonly focusedSubject?: string;
  readonly comparedSubject?: string;
  readonly currentSelection?: string;
  readonly activeLayers: readonly string[];
  readonly availability: "AVAILABLE" | "UNAVAILABLE";
  readonly anomalyOrContradiction: boolean;
  readonly alreadyRepresentedNearby: boolean;
  readonly valueTraits: Readonly<{ materiallyNonObvious?: boolean; conclusionAlteringRisk?: boolean; weightedNormalizedUncertainOrAssumed?: boolean; unusuallyHighLowContradictoryOrUnavailable?: boolean; directlyConnectsSubjects?: boolean; suggestsNextInspection?: boolean; simpleCount?: boolean; date?: boolean; identifier?: boolean; familiarStatus?: boolean; rawSelfExplanatoryMetadata?: boolean; decorativeNumber?: boolean }>;
}
export interface RelevanceAssessment { readonly definitionId: string; readonly visibility: IntelligenceVisibility; readonly score: number; readonly reasons: readonly string[]; }

export function assessContextualRelevance(definition: IntelligenceDefinition, context: IntelligenceContextFacts): RelevanceAssessment {
  const excluded = Object.entries(context.valueTraits).filter(([key,value]) => value && ["simpleCount","date","identifier","familiarStatus","rawSelfExplanatoryMetadata","decorativeNumber"].includes(key)).map(([key]) => `EXCLUDED_${key.replace(/[A-Z]/g, x => `_${x}`).toUpperCase()}`).sort();
  if (!definition.eligibleContexts.includes(context.activeMode) || excluded.length || context.alreadyRepresentedNearby) return Object.freeze({ definitionId: definition.definitionId, visibility: "HIDDEN", score: 0, reasons: Object.freeze(excluded.length ? excluded : [context.alreadyRepresentedNearby ? "ALREADY_REPRESENTED_NEARBY" : "INELIGIBLE_CONTEXT"]) });
  const reasons: string[] = [];
  const add = (condition: boolean | undefined, reason: string) => { if (condition) reasons.push(reason); };
  add(context.valueTraits.materiallyNonObvious, "MATERIALLY_NON_OBVIOUS"); add(context.valueTraits.conclusionAlteringRisk, "CONCLUSION_ALTERING_RISK"); add(context.valueTraits.weightedNormalizedUncertainOrAssumed, "WEIGHTING_NORMALIZATION_UNCERTAINTY_OR_ASSUMPTIONS"); add(context.valueTraits.unusuallyHighLowContradictoryOrUnavailable || context.anomalyOrContradiction || context.availability === "UNAVAILABLE", "ANOMALOUS_CONTRADICTORY_OR_UNAVAILABLE"); add(context.valueTraits.directlyConnectsSubjects && !!context.focusedSubject && !!context.comparedSubject, "DIRECTLY_CONNECTS_SUBJECTS"); add(definition.intelligenceKind === "TERM" && definition.inclusionClassification === "EPISTEMIC_TERM", "ISEES_SPECIFIC_EPISTEMIC_TERM"); add(context.valueTraits.suggestsNextInspection, "SUGGESTS_NEXT_INSPECTION");
  reasons.sort(); const score = reasons.length;
  const visibility: IntelligenceVisibility = score >= 3 || reasons.includes("CONCLUSION_ALTERING_RISK") ? "PRIMARY" : score >= 1 ? "SECONDARY" : definition.inclusionClassification === "REFERENCE_ONLY" ? "AVAILABLE_IN_DETAIL" : "HIDDEN";
  return Object.freeze({ definitionId: definition.definitionId, visibility, score, reasons: Object.freeze(reasons.length ? reasons : ["NO_QUALIFYING_CONTEXTUAL_SIGNAL"]) });
}
