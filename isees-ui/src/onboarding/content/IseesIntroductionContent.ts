export const ISEES_INTRODUCTION_CONTENT_SCHEMA_ID = "isees-introduction-content" as const;
export const ISEES_INTRODUCTION_CONTENT_VERSION = 1 as const;

export interface IseesIntroductionContent {
  readonly schemaId: typeof ISEES_INTRODUCTION_CONTENT_SCHEMA_ID;
  readonly version: typeof ISEES_INTRODUCTION_CONTENT_VERSION;
  readonly productName: string;
  readonly expandedName: string;
  readonly productClass: string;
  readonly explanation: string;
  readonly deterministicBoundary: string;
  readonly researcherRole: string;
  readonly workflow: readonly string[];
  readonly trustBoundaries: readonly string[];
}

export const ISEES_V1_INTRODUCTION: IseesIntroductionContent = Object.freeze({
  schemaId: ISEES_INTRODUCTION_CONTENT_SCHEMA_ID,
  version: ISEES_INTRODUCTION_CONTENT_VERSION,
  productName: "iSEES",
  expandedName: "Integrated Systems Epistemology & Evaluation System",
  productClass: "UAP Research Workstation",
  explanation: "iSEES is a research workstation for investigating unusual events as connected systems of evidence, sources, claims, people, places, and relationships.",
  deterministicBoundary: "iSEES does not ask artificial intelligence to guess what happened. Its investigation graph and analytical results come from explicit data, governed methods, and reproducible computation.",
  researcherRole: "The researcher decides what to inspect, compare, test, collect, and publish. iSEES preserves the difference between established records, experimental results, and candidate knowledge.",
  workflow: Object.freeze([
    "Open an investigation",
    "Inspect the evidence and relationships",
    "Compare related events",
    "Test analytical layers",
    "Collect findings",
    "Produce research artifacts",
  ]),
  trustBoundaries: Object.freeze([
    "System Canon is not silently changed.",
    "Experimental results are not automatically accepted as knowledge.",
    "AI assistance is limited to deliberate drafting work in STUDIO.",
  ]),
});

export const ONBOARDING_RESEARCHER_GUIDE_TARGET_ID = "onboarding.researcher-guide.download" as const;
