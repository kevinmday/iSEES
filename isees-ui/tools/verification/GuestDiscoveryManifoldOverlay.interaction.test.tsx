import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { resolveActiveOperationalGraphProjection } from "../../src/investigation/revision/OperationalGraphRevision";
import { GraphProvider } from "../../src/manifold/context/GraphContext";
import InvestigationGraph from "../../src/manifold/components/InvestigationGraph";
import { guestDiscoveryOverlayPosition } from "../../src/manifold/components/GuestDiscoveryManifoldOverlay";
import { createBlankNativeCaseDraftContent, restoreNativeCaseDraftContent, suppliedEnvelope } from "../../src/nativeCaseDraft/NativeCaseDraftFieldState";
import { projectGuestDiscoveryPreview, type GuestDiscoveryLead } from "../../src/evidence/candidates/GuestDiscoveryPreview";
import { createGuestCandidateInvestigation } from "../../src/workspace/guestCase/GuestCaseIntake";
import { workspaceRuntime } from "../../src/workspace/runtime/WorkspaceRuntime";
import { WorkspaceRuntimeProvider } from "../../src/workspace/runtime/WorkspaceRuntimeContext";
import { ResolveRuntimeProvider } from "../../src/resolve/runtime/ResolveRuntimeContext";

class ImmediateResizeObserver {
  constructor(private readonly callback: ResizeObserverCallback) {}
  observe(target: Element) { this.callback([{ target, contentRect: { width: 900, height: 600 } } as ResizeObserverEntry], this as unknown as ResizeObserver); }
  disconnect() {}
  unobserve() {}
}

const at="2026-09-28T12:00:00.000Z";
function investigation() {
  const content=restoreNativeCaseDraftContent(createBlankNativeCaseDraftContent());
  const created=createGuestCandidateInvestigation(Object.freeze({...content,workingTitle:suppliedEnvelope("Guest discovery overlay"),observationNarrative:suppliedEnvelope("A governed event used to verify the provisional overlay.")}),{status:"READY",identity:{kind:"GUEST",operatorId:"guest:overlay",establishedAt:at},persistence:"SESSION",revision:1},at,"overlay");
  if(created.status!=="CREATED") throw new Error(created.message);
  return created.investigation;
}
function preview(investigationId:string,targetId:string) {
  const lead:GuestDiscoveryLead={leadId:"guest-lead:one",query:"primary records",provider:"Tavily",result:{resultId:"one",providerResultId:"provider-one",rank:1,title:"Primary metadata lead",providerReturnedUrl:"https://example.test/source",normalizedUrl:"https://example.test/source",displayUrl:"example.test/source",displayDomain:"example.test",snippet:"Metadata only",attribution:"Tavily Basic Search",retentionRestrictions:[],providerMetadata:{}}};
  return projectGuestDiscoveryPreview({investigationId,proposedBy:"guest:overlay",lead,connection:{leadId:lead.leadId,targetId,relationship:"REFERENCES"},targets:[{id:targetId,label:"Governed event",type:"EVENT"}],activeLayerIds:["TOPOLOGY"]})!;
}
function Canvas(){return <WorkspaceRuntimeProvider><ResolveRuntimeProvider><GraphProvider><InvestigationGraph onAction={()=>undefined}/></GraphProvider></ResolveRuntimeProvider></WorkspaceRuntimeProvider>}

describe("Guest discovery projection on the existing Manifold canvas",()=>{
  beforeEach(()=>{vi.stubGlobal("ResizeObserver",ImmediateResizeObserver);workspaceRuntime.deactivate()});
  afterEach(()=>{cleanup();workspaceRuntime.deactivate();vi.unstubAllGlobals()});
  it("dismisses through the captured background pointer path without removing the provisional projection",async()=>{
    const active=investigation();workspaceRuntime.activateGuestCandidateInvestigation(active);
    const graph=resolveActiveOperationalGraphProjection(active);
    workspaceRuntime.setGuestDiscoveryOverlay(preview(active.id,graph.nodes[0]!.id));
    render(<Canvas/>);
    const overlay=await screen.findByTestId("guest-discovery-manifold-overlay");
    fireEvent.click(screen.getByRole("button",{name:/PROVISIONAL METADATA REFERENCE/}));
    expect(await screen.findByLabelText("Provisional Guest discovery selection detail")).toBeTruthy();

    const background=screen.getByLabelText("Manifold background");
    const svg=background.ownerSVGElement!;
    Object.defineProperty(svg,"setPointerCapture",{value:vi.fn(),configurable:true});
    Object.defineProperty(svg,"hasPointerCapture",{value:()=>true,configurable:true});
    Object.defineProperty(svg,"releasePointerCapture",{value:vi.fn(),configurable:true});
    fireEvent.pointerDown(background,{pointerId:7,clientX:300,clientY:220});
    // Native pointer capture retargets completion to the SVG rather than the rect.
    fireEvent.pointerUp(svg,{pointerId:7,clientX:300,clientY:220});

    expect(screen.queryByLabelText("Provisional Guest discovery selection detail")).toBeNull();
    expect(workspaceRuntime.getGuestDiscoveryOverlaySelection()).toBeUndefined();
    expect(overlay.isConnected).toBe(true);
  });
  it("does not dismiss an open provisional card during a camera drag",async()=>{
    const active=investigation();workspaceRuntime.activateGuestCandidateInvestigation(active);
    const graph=resolveActiveOperationalGraphProjection(active);
    workspaceRuntime.setGuestDiscoveryOverlay(preview(active.id,graph.nodes[0]!.id));
    render(<Canvas/>);
    fireEvent.click(await screen.findByRole("button",{name:/PROVISIONAL METADATA REFERENCE/}));
    const detail=await screen.findByLabelText("Provisional Guest discovery selection detail");
    const background=screen.getByLabelText("Manifold background"),svg=background.ownerSVGElement!;
    Object.defineProperty(svg,"setPointerCapture",{value:vi.fn(),configurable:true});
    Object.defineProperty(svg,"hasPointerCapture",{value:()=>true,configurable:true});
    Object.defineProperty(svg,"releasePointerCapture",{value:vi.fn(),configurable:true});
    Object.defineProperty(svg,"getBoundingClientRect",{value:()=>({width:900,height:600}),configurable:true});
    fireEvent.pointerDown(background,{pointerId:8,clientX:300,clientY:220});
    fireEvent.pointerMove(svg,{pointerId:8,clientX:340,clientY:250});
    fireEvent.pointerUp(svg,{pointerId:8,clientX:340,clientY:250});
    expect(detail.isConnected).toBe(true);
    expect(workspaceRuntime.getGuestDiscoveryOverlaySelection()).toBe("NODE");
  });
  it("keeps governed and provisional node/edge inspection exclusive",async()=>{
    const active=investigation();workspaceRuntime.activateGuestCandidateInvestigation(active);
    const graph=resolveActiveOperationalGraphProjection(active),before=JSON.stringify(graph),counts={nodes:graph.nodes.length,edges:graph.edges.length};
    workspaceRuntime.setGuestDiscoveryOverlay(preview(active.id,graph.nodes[0]!.id));
    render(<Canvas/>);
    await screen.findByTestId("guest-discovery-manifold-overlay");
    const provisionalNode=screen.getByRole("button",{name:/PROVISIONAL METADATA REFERENCE/});
    const provisionalEdge=screen.getByRole("button",{name:/PROVISIONAL CONNECTION/});
    fireEvent.click(provisionalNode);
    expect((await screen.findByLabelText("Provisional Guest discovery selection detail")).textContent).toContain("PROVISIONAL METADATA REFERENCE");
    fireEvent.click(provisionalEdge);
    expect(screen.getByLabelText("Provisional Guest discovery selection detail").textContent).toContain("PROPOSED CONNECTION");

    fireEvent.click(provisionalNode);
    fireEvent.click(screen.getAllByRole("button",{name:/^NODE /})[0]!);
    expect(workspaceRuntime.getSelection()?.kind).toBe("NODE");
    expect(workspaceRuntime.getGuestDiscoveryOverlaySelection()).toBeUndefined();
    const governedEdge=screen.getByRole("button",{name:/^EDGE connecting/});
    fireEvent.click(governedEdge.querySelector("line")!);
    expect(workspaceRuntime.getSelection()?.kind).toBe("EDGE");
    fireEvent.click(provisionalEdge);
    expect(workspaceRuntime.getSelection()).toBeUndefined();
    expect(workspaceRuntime.getGuestDiscoveryOverlaySelection()).toBe("EDGE");
    workspaceRuntime.clearSelection();
    expect(workspaceRuntime.getGuestDiscoveryOverlaySelection()).toBeUndefined();
    expect(workspaceRuntime.getGuestDiscoveryOverlay()).toBeTruthy();
    expect(JSON.stringify(resolveActiveOperationalGraphProjection(workspaceRuntime.getActiveInvestigation()!))).toBe(before);
    expect({nodes:graph.nodes.length,edges:graph.edges.length}).toEqual(counts);
  });
  it("places the disposable glyph and label lanes deterministically inside topology framing",()=>{
    const active=investigation();const graph=resolveActiveOperationalGraphProjection(active);const projected=preview(active.id,graph.nodes[0]!.id);
    const nodes=[{...graph.nodes[0]!,x:0,y:0},{...graph.nodes[0]!,id:"nearby",x:96,y:-72}];
    const first=guestDiscoveryOverlayPosition(projected,nodes),second=guestDiscoveryOverlayPosition(projected,nodes);
    expect(first).toEqual(second);expect(first).toBeTruthy();
    expect(Math.hypot(first!.x,first!.y)).toBe(120);
    expect(first!.x).not.toBe(96);expect(first!.y).not.toBe(-72);
    expect(Math.abs(first!.x)).toBeLessThanOrEqual(201);expect(Math.abs(first!.y)).toBeLessThanOrEqual(177);
  });
  it("removes the rendered overlay at reset, expiry/auth clearing, and investigation activation boundaries",async()=>{
    const active=investigation();workspaceRuntime.activateGuestCandidateInvestigation(active);const graph=resolveActiveOperationalGraphProjection(active);
    render(<Canvas/>);workspaceRuntime.setGuestDiscoveryOverlay(preview(active.id,graph.nodes[0]!.id));await screen.findByTestId("guest-discovery-manifold-overlay");
    workspaceRuntime.clearGuestDiscoveryOverlay();await waitFor(()=>expect(screen.queryByTestId("guest-discovery-manifold-overlay")).toBeNull());
    workspaceRuntime.setGuestDiscoveryOverlay(preview(active.id,graph.nodes[0]!.id));await screen.findByTestId("guest-discovery-manifold-overlay");
    workspaceRuntime.activateGuestCandidateInvestigation(investigation());await waitFor(()=>expect(screen.queryByTestId("guest-discovery-manifold-overlay")).toBeNull());
    expect(workspaceRuntime.getGuestDiscoveryOverlay()).toBeUndefined();
  });
  it("replaces same-projection provenance without graph authority or selection loss",()=>{
    const active=investigation();workspaceRuntime.activateGuestCandidateInvestigation(active);const graph=resolveActiveOperationalGraphProjection(active),before=JSON.stringify(graph);
    const original=preview(active.id,graph.nodes[0]!.id);
    workspaceRuntime.setGuestDiscoveryOverlay(original);
    workspaceRuntime.selectGuestDiscoveryOverlay("NODE");
    const refreshed={...original,proposedBy:"account:current",lead:{...original.lead,provider:"Updated provider",result:{...original.lead.result,attribution:"Updated provenance"}}};
    workspaceRuntime.setGuestDiscoveryOverlay(refreshed);
    expect(workspaceRuntime.getGuestDiscoveryOverlay()).toBe(refreshed);
    expect(workspaceRuntime.getGuestDiscoveryOverlay()?.lead.result.attribution).toBe("Updated provenance");
    expect(workspaceRuntime.getGuestDiscoveryOverlaySelection()).toBe("NODE");
    expect(workspaceRuntime.getSelection()).toBeUndefined();
    expect(JSON.stringify(resolveActiveOperationalGraphProjection(active))).toBe(before);
  });
  it("only clears the overlay owned by the retiring discovery surface",()=>{
    const active=investigation();workspaceRuntime.activateGuestCandidateInvestigation(active);const graph=resolveActiveOperationalGraphProjection(active);
    const retiring=preview(active.id,graph.nodes[0]!.id);
    const newer={...retiring,proposedBy:"guest:newer"};
    workspaceRuntime.setGuestDiscoveryOverlay(retiring);
    workspaceRuntime.setGuestDiscoveryOverlay(newer);
    workspaceRuntime.clearGuestDiscoveryOverlay(retiring);
    expect(workspaceRuntime.getGuestDiscoveryOverlay()).toBe(newer);
    workspaceRuntime.clearGuestDiscoveryOverlay(newer);
    expect(workspaceRuntime.getGuestDiscoveryOverlay()).toBeUndefined();
  });
});
