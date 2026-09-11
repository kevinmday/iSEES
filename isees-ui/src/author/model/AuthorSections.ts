export const AUTHOR_SECTIONS = ["Abstract", "Research Question", "Hypothesis / H0 / H1", "Method", "Evidence", "Analysis", "Figures / Tables", "Conclusion", "References / Footnotes"] as const;
export type AuthorSection = (typeof AUTHOR_SECTIONS)[number];
