import { useState } from "react";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it } from "vitest";
import { StudioArtifactDesignSelector } from "../../src/studio/components/StudioDraftingPanel.tsx";
import { STUDIO_ARTIFACT_DESIGNS } from "../../src/studio/drafting/StudioArtifactDesigns.ts";

function Harness() { const [design, setDesign] = useState(STUDIO_ARTIFACT_DESIGNS[0]!); return <><StudioArtifactDesignSelector design={design} onSelect={setDesign} /><output>{design.designId}</output></>; }

describe("Studio Artifact Design selector", () => {
  it("keeps all report designs and allows keyboard users to select MANIFOLD_ARTIFACT", async () => {
    const user = userEvent.setup(); render(<Harness />); const selector = screen.getByRole("combobox", { name: "Predefined design" });
    expect(screen.getAllByRole("option").map(option => option.textContent)).toEqual(["Investigation Report · v1", "Evidence Assessment · v1", "Comparative Event Analysis · v1", "Research Memorandum · v1", "Manifold Artifact · v1"]);
    await user.tab(); expect(document.activeElement).toBe(selector); await user.selectOptions(selector, "MANIFOLD_ARTIFACT@1");
    expect(screen.getByText("MANIFOLD_ARTIFACT")).toBeTruthy(); expect(document.activeElement).toBe(selector);
  });
});
