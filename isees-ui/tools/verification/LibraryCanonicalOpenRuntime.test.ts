import { describe, expect, it, vi } from "vitest";
import { readFileSync } from "node:fs";
import { CANONICAL_EVENTS } from "../../src/canonical/runtimeCorpus";
import { SystemCanonAdapter } from "../../src/federation/adapters/SystemCanonAdapter";
import { adaptSystemCanonToKnowledge } from "../../src/knowledge/ingestion/SystemCanonKnowledgeAdapter";
import { WorkspaceRuntime } from "../../src/workspace/runtime/WorkspaceRuntime";
import { WorkspaceMode } from "../../src/workspace/runtime/WorkspaceRuntimeTypes";
import { resumeCurrentInvestigation } from "../../src/workspace/surfaces/LibraryInvestigationResumeCommand";
import { executeOverviewCanonicalActivationAndEnterWorkspace } from "../../src/workspace/surfaces/overview/OverviewCanonicalActivationCommand";

const adapter = new SystemCanonAdapter();
const knowledge = adaptSystemCanonToKnowledge(CANONICAL_EVENTS);

function request(runtime: WorkspaceRuntime, eventId: string) {
  return { adapter, eventId, runtime, admittedKnowledge: knowledge, activationStillCurrent: () => true };
}

describe("Library canonical OPEN and resume", () => {
  it("routes both visible resume entry points through one command", () => {
    const library = readFileSync("src/workspace/surfaces/LibraryWorkspace.tsx", "utf8");
    const context = readFileSync("src/workspace/surfaces/overview/OverviewCanonicalActivationContext.tsx", "utf8");
    expect(library).toContain("resumeCurrentInvestigation(runtime)");
    expect(context).toContain("resumeCurrentInvestigation(runtime)");
    expect(context).toContain("canResume=alreadyActive&&!canImport");
  });

  it("keeps preview non-mutating until explicit OPEN creates once and enters MANIFOLD", async () => {
    const runtime = new WorkspaceRuntime();
    runtime.navigateToMode(WorkspaceMode.LIBRARY);
    const navigate = vi.fn();
    runtime.attachNavigationRecorder(navigate);

    expect(runtime.getActiveInvestigation()).toBeUndefined();
    expect(runtime.getActiveMode()).toBe(WorkspaceMode.LIBRARY);

    const outcome = await executeOverviewCanonicalActivationAndEnterWorkspace(request(runtime, "E-TICTAC-2004"));

    expect(outcome.status).toBe("SUCCEEDED");
    expect(runtime.getActiveInvestigation()?.workspace.focused_event_id).toBe("E-TICTAC-2004");
    expect(runtime.getActiveInvestigation()?.revisions).toHaveLength(1);
    expect(runtime.getActiveMode()).toBe(WorkspaceMode.MANIFOLD);
    expect(navigate).toHaveBeenCalledOnce();
    for (const mode of Object.values(WorkspaceMode)) expect(runtime.getModeAvailability(mode).available).toBe(true);
  });

  it("resumes the same investigation without activation or duplicate navigation", async () => {
    const runtime = new WorkspaceRuntime();
    await executeOverviewCanonicalActivationAndEnterWorkspace(request(runtime, "E-TICTAC-2004"));
    const investigation = runtime.getActiveInvestigation();
    runtime.restoreActiveMode(WorkspaceMode.LIBRARY);
    const navigate = vi.fn();
    runtime.attachNavigationRecorder(navigate);

    expect(resumeCurrentInvestigation(runtime)).toBe(true);
    expect(runtime.getActiveInvestigation()).toBe(investigation);
    expect(runtime.getActiveInvestigation()?.revisions).toHaveLength(1);
    expect(runtime.getActiveMode()).toBe(WorkspaceMode.MANIFOLD);
    expect(navigate).toHaveBeenCalledOnce();
  });

  it("retains explicit-open behavior for another canonical event", async () => {
    const runtime = new WorkspaceRuntime();
    const outcome = await executeOverviewCanonicalActivationAndEnterWorkspace(request(runtime, "E-ROOSEVELT-2015"));
    expect(outcome.status).toBe("SUCCEEDED");
    expect(runtime.getActiveInvestigation()?.workspace.focused_event_id).toBe("E-ROOSEVELT-2015");
    expect(runtime.getActiveMode()).toBe(WorkspaceMode.MANIFOLD);
  });

  it("does not navigate or publish partial state when activation fails", async () => {
    const runtime = new WorkspaceRuntime();
    runtime.navigateToMode(WorkspaceMode.LIBRARY);
    const navigate = vi.fn();
    runtime.attachNavigationRecorder(navigate);
    const outcome = await executeOverviewCanonicalActivationAndEnterWorkspace(request(runtime, "E-NOT-CANON"));
    expect(outcome.status).toBe("ERROR");
    expect(runtime.getActiveInvestigation()).toBeUndefined();
    expect(runtime.getActiveMode()).toBe(WorkspaceMode.LIBRARY);
    expect(navigate).not.toHaveBeenCalled();
  });
});
