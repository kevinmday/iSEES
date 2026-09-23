import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { WorkspaceMode } from "../../src/workspace/runtime/WorkspaceRuntimeTypes.ts";

const root = resolve(import.meta.dirname, "../..");
const source = (path: string) => readFileSync(resolve(root, path), "utf8");

describe("P57-LIBRARY-I1B governed migration", () => {
  it("keeps Overview orientational and routes both entries to Library", () => {
    const overview = source("src/workspace/surfaces/OverviewWorkspace.tsx");
    expect(overview).toContain("Enter Library");
    expect(overview).toContain("Bring Your Own Case");
    expect(overview).toContain("library.enter(true)");
    expect(overview).not.toMatch(/projectHydratedOverviewEvents|OVERVIEW_REPOSITORIES|OverviewInspector|GuestCaseIntake/);
  });

  it("owns catalogs, search, preview, intake, inspector, and explicit actions in Library", () => {
    const library = source("src/workspace/surfaces/LibraryWorkspace.tsx");
    for (const marker of ["Search records", "Current guest investigation", "Your investigations", "System Canon", "External research records", "GuestCaseIntake", "OverviewInspector", "Resume Investigation", "Continue Setup", "Featured events"]) expect(library).toContain(marker);
    expect(library).toMatch(/Selection alone never activates/i);
    expect(library).not.toMatch(/executeResolve|computeRelationships|acceptRelationship/);
  });

  it("publishes all populated activation paths directly to Manifold and empty ownership to Library", () => {
    const runtime = source("src/workspace/runtime/WorkspaceRuntime.ts");
    expect(runtime).toMatch(/activateInvestigation[\s\S]*?activeMode:\s*WorkspaceMode\.MANIFOLD/);
    expect(runtime).toMatch(/activateGuestCandidateInvestigation[\s\S]*?activeMode: WorkspaceMode\.MANIFOLD/);
    expect(runtime).toMatch(/activateEmptyOwnedInvestigationState[\s\S]*?activeMode: WorkspaceMode\.LIBRARY/);
    expect(runtime).toMatch(/activateAdoptedOwnedInvestigationState[\s\S]*?activeMode: WorkspaceMode\.MANIFOLD/);
    expect(source("src/investigation/continuity/OwnedInvestigationContinuity.ts")).toContain('activeMode: "LIBRARY"');
  });

  it("retains Overview default and Library availability without analytical viability", async () => {
    const { WorkspaceRuntime } = await import("../../src/workspace/runtime/WorkspaceRuntime.ts");
    const runtime = new WorkspaceRuntime();
    expect(runtime.getActiveMode()).toBe(WorkspaceMode.OVERVIEW);
    expect(runtime.getModeAvailability(WorkspaceMode.LIBRARY).available).toBe(true);
    expect(runtime.getModeAvailability(WorkspaceMode.MANIFOLD).available).toBe(false);
    runtime.setActiveMode(WorkspaceMode.LIBRARY);
    expect(runtime.getActiveMode()).toBe(WorkspaceMode.LIBRARY);
    expect(runtime.getActiveInvestigation()).toBeUndefined();
  });
});
