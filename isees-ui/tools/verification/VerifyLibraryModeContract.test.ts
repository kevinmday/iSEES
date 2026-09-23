import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { WorkspaceRuntime } from "../../src/workspace/runtime/WorkspaceRuntime.ts";
import { WorkspaceMode } from "../../src/workspace/runtime/WorkspaceRuntimeTypes.ts";
import { getWorkspaceModeLabel } from "../../src/workspace/presentation/WorkspaceModePresentation.ts";
import { isGuestWorkspaceSessionSnapshot } from "../../src/workspace/persistence/GuestWorkspaceSessionPersistence.ts";
import { GUEST_WORKSPACE_SESSION_SCHEMA_VERSION } from "../../src/workspace/persistence/GuestWorkspaceSessionPersistenceTypes.ts";

const root = resolve(import.meta.dirname, "../..");
const source = (path: string) => readFileSync(resolve(root, path), "utf8");
const expectedOrder = ["OVERVIEW", "LIBRARY", "MANIFOLD", "COMPARE", "NARRATIVE", "EVIDENCE", "TIMELINE", "LAYERS", "INTENTION", "RESEARCH"];

function emptySnapshot(activeMode: string) {
  return {
    schemaVersion: GUEST_WORKSPACE_SESSION_SCHEMA_VERSION,
    ownership: { kind: "GUEST", operatorId: "guest:library-contract", establishedAt: "2026-09-23T00:00:00.000Z" },
    createdAt: "2026-09-23T00:00:00.000Z",
    updatedAt: "2026-09-23T00:00:01.000Z",
    workspace: { operator: { activeMode, layoutMode: "NORMAL" }, computational: { activeLayers: [] } },
    research: { desk: { entries: [] } },
    authoring: {},
  };
}

describe("P57-LIBRARY-I1A mode contract", () => {
  it("adopts the canonical order and presentation exactly once", () => {
    expect(Object.values(WorkspaceMode)).toEqual(expectedOrder);
    expect(expectedOrder.filter(mode => mode === "LIBRARY")).toHaveLength(1);
    expect(getWorkspaceModeLabel(WorkspaceMode.LIBRARY)).toBe("LIBRARY");
    const bar = source("src/components/workspace/WorkspaceModeBar.tsx");
    const positions = expectedOrder.map(mode => bar.indexOf(`WorkspaceMode.${mode}`));
    expect(positions.every((position, index) => position >= 0 && (index === 0 || position > positions[index - 1]!))).toBe(true);
  });

  it("keeps Overview as default while Overview and Library are available without an investigation", () => {
    const runtime = new WorkspaceRuntime();
    expect(runtime.getActiveMode()).toBe(WorkspaceMode.OVERVIEW);
    expect(runtime.getModeAvailability(WorkspaceMode.OVERVIEW).available).toBe(true);
    expect(runtime.getModeAvailability(WorkspaceMode.LIBRARY).available).toBe(true);
    for (const mode of Object.values(WorkspaceMode).filter(mode => mode !== WorkspaceMode.OVERVIEW && mode !== WorkspaceMode.LIBRARY)) {
      expect(runtime.getModeAvailability(mode)).toEqual({ available: false, reason: "Import or activate an investigation before entering this workspace mode." });
    }
  });

  it("changes only operator mode when navigating to Library", () => {
    const runtime = new WorkspaceRuntime();
    const investigation = { id: "investigation:library-contract" } as never;
    runtime.setActiveInvestigation(investigation);
    const before = runtime.getState();
    runtime.setActiveMode(WorkspaceMode.LIBRARY);
    const after = runtime.getState();
    expect(after.operator.activeMode).toBe(WorkspaceMode.LIBRARY);
    expect(after.session.investigation).toBe(investigation);
    expect(after.session).toEqual(before.session);
    expect(after.computational).toEqual(before.computational);
    expect(after.revision).toBe(before.revision + 1);
  });

  it("accepts compatible Library persistence and rejects invalid empty modes", () => {
    expect(isGuestWorkspaceSessionSnapshot(emptySnapshot("LIBRARY"))).toBe(true);
    expect(isGuestWorkspaceSessionSnapshot(emptySnapshot("NOT_A_MODE"))).toBe(false);
    expect(source("src/investigation/continuity/OwnedInvestigationContinuity.ts")).toContain('"LIBRARY"');
    expect(source("../isees_uap/api/v1/investigations.py")).toMatch(/activeMode: Literal\[[^\]]*"LIBRARY"/);
  });
});
