import type { DraftingArtifactDesign } from "./StudioDraftingTypes.ts";

export interface StudioArtifactDesignDefinition extends DraftingArtifactDesign {
  readonly label: string;
  readonly purpose: string;
  readonly sectionPlan: readonly string[];
  readonly draftingGuidance: string;
  readonly provenanceExpectations: string;
}

export const STUDIO_ARTIFACT_DESIGNS: readonly StudioArtifactDesignDefinition[] = Object.freeze([
  { designId: "investigation-report", designVersion: "1", label: "Investigation Report", purpose: "Synthesize the Investigation record into a structured report.", sectionPlan: ["Scope", "Findings", "Evidence", "Contradictions and uncertainties", "Conclusion"], draftingGuidance: "Separate sourced findings from researcher interpretation and unresolved questions.", provenanceExpectations: "Attach source references to factual blocks and disclose unsupported claims." },
  { designId: "evidence-assessment", designVersion: "1", label: "Evidence Assessment", purpose: "Evaluate the strength, limits, and conflicts in selected evidence.", sectionPlan: ["Question", "Evidence inventory", "Assessment", "Gaps", "Confidence"], draftingGuidance: "Weigh evidence without converting source presence into proof.", provenanceExpectations: "Identify supporting and contradicting sources and preserve uncertainty." },
  { designId: "comparative-event-analysis", designVersion: "1", label: "Comparative Event Analysis", purpose: "Compare events using explicitly selected Investigation context.", sectionPlan: ["Events and scope", "Comparable dimensions", "Similarities", "Differences", "Interpretation"], draftingGuidance: "Keep event identities distinct and avoid inferred equivalence.", provenanceExpectations: "Reference the source behind each comparison and disclose missing dimensions." },
  { designId: "research-memorandum", designVersion: "1", label: "Research Memorandum", purpose: "Prepare a concise decision-oriented research memorandum.", sectionPlan: ["Issue", "Background", "Analysis", "Risks and unknowns", "Recommended next research"], draftingGuidance: "Be concise, qualify judgments, and distinguish instructions from evidence.", provenanceExpectations: "Provide block-level source references and enumerate unsupported statements." },
]);

export function findStudioArtifactDesign(designId: string, designVersion: string): StudioArtifactDesignDefinition | undefined {
  return STUDIO_ARTIFACT_DESIGNS.find(item => item.designId === designId && item.designVersion === designVersion);
}
