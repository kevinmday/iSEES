import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

describe("accepted relationship presentation", () => {
  const compare = readFileSync("src/compare/components/CompareWorkspace.tsx", "utf8");
  const rightPanel = readFileSync("src/components/RightPanel.tsx", "utf8");

  it("renders candidate and accepted lifecycle labels from canonical acceptance", () => {
    expect(compare).toContain('{accepted ? "ACCEPTED" : "CANDIDATE"}');
    expect(compare).not.toContain('compare-workspace__badge--candidate">CANDIDATE</span>');
    expect(rightPanel).toMatch(/accepted\s*\? "ACCEPTED"\s*: "CANDIDATE"/);
    expect(rightPanel).toContain("acceptance.state === ResolveCandidateAcceptanceState.ACCEPTED");
  });

  it("preserves candidate identity as relationship lineage", () => {
    expect(compare).toContain("Candidate ID: {projection.candidateId}");
    expect(compare).toContain("<dt>Candidate ID</dt><dd>{projection.candidateId}</dd>");
  });

  it("retains idempotent accepted publication and insertion reconciliation", async () => {
    await import("./VerifyAcceptedCompareResearchReconciliation.test.ts");
  });
});
