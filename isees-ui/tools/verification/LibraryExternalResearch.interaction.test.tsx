import { cleanup, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it, vi } from "vitest";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { ExternalResearchTile } from "../../src/workspace/surfaces/LibraryWorkspace.tsx";
import { OVERVIEW_REPOSITORIES, validateOverviewRepositoryDestination } from "../../src/workspace/surfaces/overview/OverviewEndStateModel.ts";

const expected = Object.freeze({
  SCU: ["https://www.explorescu.org/", "explorescu.org"], AARO: ["https://www.aaro.mil/", "aaro.mil"],
  NUFORC: ["https://nuforc.org/", "nuforc.org"], Zenodo: ["https://zenodo.org/", "zenodo.org"],
  "National Archives": ["https://www.nationalarchives.gov.uk/explore-the-collection/explore-by-time-period/postwar/ufo-reports/", "nationalarchives.gov.uk"],
} as const);

afterEach(cleanup);
const source = (path: string) => readFileSync(resolve(import.meta.dirname, "../..", path), "utf8");

describe("Library governed external reading", () => {
  it.each(OVERVIEW_REPOSITORIES.filter(repository => repository.navigationAvailable))("renders $name as an exact, natively keyboard-accessible new-tab link", repository => {
    render(<ExternalResearchTile repository={repository} />);
    const link = screen.getByRole("link", { name: new RegExp(`${repository.name}.*new tab`, "i") });
    expect(link.getAttribute("href")).toBe(expected[repository.name as keyof typeof expected][0]);
    expect(link.getAttribute("target")).toBe("_blank"); expect(link.getAttribute("rel")).toBe("noopener noreferrer");
    expect(link.textContent).toContain(expected[repository.name as keyof typeof expected][1]); expect(link.textContent).toContain("↗");
    expect(link.tagName).toBe("A"); expect(link.getAttribute("tabindex")).not.toBe("-1");
  });

  it("keeps MUFON planned, URL-less, unfocusable, and non-navigable", async () => {
    const user = userEvent.setup(); const mufon = OVERVIEW_REPOSITORIES.find(repository => repository.name === "MUFON")!;
    render(<ExternalResearchTile repository={mufon} />); const tile = screen.getByText("MUFON").closest("article")!;
    expect(mufon).toMatchObject({ state: "PLANNED", navigationAvailable: false, destinationUrl: null, destinationDomain: null });
    expect(tile.getAttribute("aria-disabled")).toBe("true"); expect(tile.hasAttribute("href")).toBe(false); expect(tile.hasAttribute("tabindex")).toBe(false);
    expect(tile.textContent).toContain("External access planned."); await user.tab(); expect(document.activeElement).not.toBe(tile);
  });

  it.each([
    ["HTTP", "scu", "http://www.explorescu.org/", "explorescu.org"], ["credentials", "scu", "https://user:secret@www.explorescu.org/", "explorescu.org"],
    ["malformed URL", "scu", "not a URL", "explorescu.org"], ["unsafe scheme", "scu", "javascript:alert(1)", "explorescu.org"],
    ["lookalike host", "scu", "https://www.explorescu.org.example/", "explorescu.org"], ["unapproved domain", "scu", "https://example.org/", "example.org"],
    ["open-redirect shape", "scu", "https://www.explorescu.org/?redirect=https://example.org", "explorescu.org"],
    ["mismatched display domain", "scu", "https://www.explorescu.org/", "example.org"],
  ])("rejects %s configuration", (_label, id, url, domain) => expect(() => validateOverviewRepositoryDestination(id, url, domain)).toThrow());

  it("does not attach mutation or internal-navigation behavior", () => {
    const repository = OVERVIEW_REPOSITORIES.find(item => item.name === "SCU")!; const selectRepository = vi.fn(); const pushState = vi.spyOn(history, "pushState");
    render(<ExternalResearchTile repository={repository} />); expect(screen.getByRole("link").hasAttribute("aria-pressed")).toBe(false);
    expect(selectRepository).not.toHaveBeenCalled(); expect(pushState).not.toHaveBeenCalled(); pushState.mockRestore();
  });

  it("keeps external activation declarative and styles visible keyboard focus", () => {
    const workspace = source("src/workspace/surfaces/LibraryWorkspace.tsx");
    const tile = workspace.slice(workspace.indexOf("export function ExternalResearchTile"), workspace.indexOf("function LibraryVisualBoundary"));
    const css = source("src/workspace/surfaces/LibraryWorkspace.css");
    expect(tile).not.toMatch(/onClick|onKey|window\.open|selectRepository|pushState|navigateToMode|fetch\(|axios|telemetry|federat|import\(|preload|publish/i);
    expect(css).toContain(".library-workspace__external-tile:focus-visible");
    expect(css).toContain(".library-workspace__external-tile:hover");
    expect(css).toContain(".library-workspace__external-tile--disabled");
  });
});
