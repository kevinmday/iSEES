import { webcrypto } from "node:crypto";
import { act, cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, beforeAll, describe, expect, it, vi } from "vitest";
import type { SelectionIntelligenceBinding } from "../../src/manifold/selection/selectionIntelligenceResolver.ts";
import { approveFreeRexExecution, type RexApi, type RexExpansionProposal } from "../../src/rex/RexApi.ts";

const graph={nodes:[{id:"node-1",label:"Selected",type:"ENTITY"},{id:"node-2",label:"Other",type:"ENTITY"}],edges:[{id:"edge-1",source:"node-1",target:"node-2",relationship:"RELATED",weight:1,rationale:[]}]};
const investigation={id:"investigation-1",createdBy:"AUTHENTICATED_RESEARCHER",currentRevisionId:"revision-1",revisions:[{id:"revision-1",manifold:{graph}}]};

const navigateToMode=vi.fn();
vi.mock("../../src/workspace/runtime/WorkspaceRuntimeContext.tsx",()=>({useWorkspaceRuntime:()=>({getActiveInvestigation:()=>investigation,navigateToMode})}));
vi.mock("../../src/identity/runtime/OperatorIdentityRuntimeContext.tsx",()=>({useOperatorIdentity:()=>({identity:{kind:"ACCOUNT",operatorId:"principal-1"},persistence:"PERSISTENT"})}));

import { RexProposalControl } from "../../src/rex/RexExploreControl.tsx";

const binding=(targetId:string):SelectionIntelligenceBinding=>({investigationId:"investigation-1",manifoldRevisionId:"revision-1",selectionKind:"NODE",targetId,projectionFingerprint:`projection:${targetId}`});
const proposal=(targetId:string,revisionHash:string):RexExpansionProposal=>({proposalId:`proposal-${targetId}`,investigationId:"investigation-1",principalId:"principal-1",selectedObject:{kind:"NODE",id:targetId},revision:{id:"revision-1",hash:revisionHash},researcherQuestion:"What should be checked?",researcherNotes:null,plan:{plannerVersion:"rex-expansion-proposal-planner/v1",profile:{id:"GENERAL_NODE",version:"rex-general-selection-profile/v1"},objectivePacks:[{id:"GENERAL_EVIDENCE",version:"rex-general-evidence-objectives/v1"}],queryGuidance:[`Inspect ${targetId}`],governedContext:[`Selected node: ${targetId}`],limits:["Bounded"],stopRules:["Stop"]},proposedQueryPlan:[`Inspect ${targetId}`],limits:["Bounded"],stopRules:["Stop"],inspectionWork:["Inspect"],status:"PROPOSAL_ONLY",createdAt:"2026-09-26T00:00:00Z",costEnvelope:{status:"OPERATOR_FUNDED_FREE",providerComponent:"COVERED_BY_ISEES",iseesMargin:"NOT_APPLICABLE",maximumCustomerPrice:"$0.00",customerCharge:"$0.00"},effects:{externalDispatch:"NONE"}});

function deferred<T>(){let resolve!:(value:T)=>void;const promise=new Promise<T>(done=>{resolve=done});return {promise,resolve}}
function api(createProposal:RexApi["createProposal"]):RexApi{return {createProposal,getProposal:vi.fn(),createAssignment:vi.fn(),prepare:vi.fn(),execute:vi.fn(),getReceipt:vi.fn(),getBundle:vi.fn(),listCompletedDiscoveries:vi.fn()}}

beforeAll(()=>Object.defineProperty(globalThis,"crypto",{value:webcrypto,configurable:true}));
afterEach(()=>{cleanup();navigateToMode.mockClear();vi.unstubAllGlobals()});

describe("REX proposal binding",()=>{
  it("requests the configured one-result-per-query free trial limit",async()=>{
    document.cookie="isees_csrf=token; path=/";
    const transport=vi.fn().mockResolvedValue(new Response(JSON.stringify({authorization:{authorizationId:"authorization-1",customerCharge:"$0.00",providerUsageCoveredBy:"iSEES"},execution:{executionStatus:"COMPLETED",customerCharge:"$0.00",providerUsageCoveredBy:"iSEES",candidateEvidence:[],ephemeralLeads:[],researchInboxEffect:"NONE",graphEffect:"NONE",manifoldEffect:"NONE"},idempotencyDisposition:"CREATED"}),{status:200,headers:{"Content-Type":"application/json"}}));
    vi.stubGlobal("fetch",transport);
    await approveFreeRexExecution("investigation-1",proposal("node-1","sha256:"+"a".repeat(64)),"approval-key");
    const request=transport.mock.calls[0]?.[1] as RequestInit;
    expect(JSON.parse(String(request.body)).requestedResultLimit).toBe(1);
    expect(JSON.parse(String(request.body)).researcherConfirmation).toBe(true);
  });

  it("ignores an in-flight response after selection changes",async()=>{
    const pending=deferred<RexExpansionProposal>();
    const rex=api(vi.fn(()=>pending.promise));
    const view=render(<RexProposalControl api={rex} selectionBinding={binding("node-1")}/>);
    fireEvent.change(screen.getByLabelText("Research question"),{target:{value:"What should be checked?"}});
    fireEvent.click(screen.getByRole("button",{name:"Create free proposal"}));
    expect(screen.getByText("Creating immutable proposal…")).toBeTruthy();
    view.rerender(<RexProposalControl api={rex} selectionBinding={binding("node-2")}/>);
    expect(screen.queryByText(/Inspect proposal/)).toBeNull();
    await act(async()=>pending.resolve(proposal("node-1","sha256:"+"a".repeat(64))));
    expect(screen.queryByText(/Inspect proposal/)).toBeNull();
    expect(screen.getByText("Selection or revision changed. Create a proposal for the current binding.")).toBeTruthy();
  });

  it("clears a completed proposal immediately when selection changes",async()=>{
    const rex=api(vi.fn(async(_investigationId,request)=>proposal(request.targetId,request.operationalRevisionHash)));
    const view=render(<RexProposalControl api={rex} selectionBinding={binding("node-1")}/>);
    fireEvent.change(screen.getByLabelText("Research question"),{target:{value:"What should be checked?"}});
    await act(async()=>fireEvent.click(screen.getByRole("button",{name:"Create free proposal"})));
    expect(await screen.findByText(/Review exact proposal/)).toBeTruthy();
    expect(screen.getByText("1 result per query")).toBeTruthy();
    view.rerender(<RexProposalControl api={rex} selectionBinding={binding("node-2")}/>);
    expect(screen.queryByText(/Review exact proposal/)).toBeNull();
    expect(screen.getByText("Selection or revision changed. Create a proposal for the current binding.")).toBeTruthy();
  });

  it("invalidates reviewed approval when the question changes",async()=>{
    const approve=vi.fn();
    const rex={...api(vi.fn(async(_investigationId,request)=>proposal(request.targetId,request.operationalRevisionHash))),approveFreeExecution:approve};
    render(<RexProposalControl api={rex} selectionBinding={binding("node-1")}/>);
    fireEvent.change(screen.getByLabelText("Research question"),{target:{value:"What should be checked?"}});
    await act(async()=>fireEvent.click(screen.getByRole("button",{name:"Create free proposal"})));
    fireEvent.click(screen.getByLabelText(/I explicitly approve this exact selection/));
    expect((screen.getByRole("checkbox") as HTMLInputElement).checked).toBe(true);
    await act(async()=>fireEvent.change(screen.getByLabelText("Research question"),{target:{value:"Which primary records describe the radar observations?"}}));
    expect(screen.queryByText(/Review exact proposal/)).toBeNull();
    expect(screen.getByText("Question or notes changed. Create and review a new proposal.")).toBeTruthy();
    expect(approve).not.toHaveBeenCalled();
  });

  it("reuses the approval idempotency key after a lost response",async()=>{
    const approve=vi.fn().mockRejectedValueOnce(new Error("lost response")).mockResolvedValueOnce({authorization:{authorizationId:"execution-1",customerCharge:"$0.00",providerUsageCoveredBy:"iSEES"},execution:{executionStatus:"COMPLETED",customerCharge:"$0.00",providerUsageCoveredBy:"iSEES",candidateEvidence:[],ephemeralLeads:[],researchInboxEffect:"NONE",graphEffect:"NONE",manifoldEffect:"NONE"},idempotencyDisposition:"REPLAYED"});
    const rex={...api(vi.fn(async(_investigationId,request)=>proposal(request.targetId,request.operationalRevisionHash))),approveFreeExecution:approve};
    render(<RexProposalControl api={rex} selectionBinding={binding("node-1")}/>);
    fireEvent.change(screen.getByLabelText("Research question"),{target:{value:"What should be checked?"}});
    await act(async()=>fireEvent.click(screen.getByRole("button",{name:"Create free proposal"})));
    fireEvent.click(screen.getByRole("checkbox"));
    await act(async()=>fireEvent.click(screen.getByRole("button",{name:"Approve and run once · $0"})));
    await act(async()=>fireEvent.click(screen.getByRole("button",{name:"Approve and run once · $0"})));
    expect(approve).toHaveBeenCalledTimes(2);
    expect(approve.mock.calls[0][2]).toBe(approve.mock.calls[1][2]);
  });

  it("creates no candidate until one selected lead receives its own confirmation",async()=>{
    const lead={searchSessionId:"session-1",expectedInvestigationRevision:1,manifoldRevisionId:"investigation-aggregate:1",resultId:"result-1",providerResultId:"provider-1",rank:1,title:"Authoritative title",snippet:"Authoritative snippet",providerReturnedUrl:"https://example.test/source",sourceUrl:"https://example.test/source",displayUrl:"example.test/source",displayDomain:"example.test",mediaType:"text/html",attribution:"Tavily",retentionRestrictions:[],providerMetadata:{},acquisitionLabel:"METADATA_ONLY - EPHEMERAL"};
    const secondLead={...lead,resultId:"result-2",providerResultId:"provider-2",rank:2,title:"Second authoritative title",snippet:"Second authoritative snippet",sourceUrl:"https://example.test/second",providerReturnedUrl:"https://example.test/second"};
    const approve=vi.fn().mockResolvedValue({authorization:{authorizationId:"execution-1",customerCharge:"$0.00",providerUsageCoveredBy:"iSEES"},execution:{executionId:"execution-1",executionStatus:"COMPLETED",customerCharge:"$0.00",providerUsageCoveredBy:"iSEES",candidateEvidence:[],ephemeralLeads:[lead,secondLead],researchInboxEffect:"NONE",graphEffect:"NONE",manifoldEffect:"NONE"},idempotencyDisposition:"CREATED"});
    const captureLead=vi.fn().mockResolvedValue({candidateId:"candidate-1",idempotencyDisposition:"CREATED",lifecycleState:"DISCOVERED",acquisitionState:"NOT_REQUESTED",publicationState:"NOT_PUBLISHED",researchInboxEffect:"NONE",receipt:{graphEffect:"NONE",manifoldEffect:"NONE",canonEffect:"NONE"}});
    const rex={...api(vi.fn(async(_investigationId,request)=>proposal(request.targetId,request.operationalRevisionHash))),approveFreeExecution:approve,captureLead};
    render(<RexProposalControl api={rex} selectionBinding={binding("node-1")}/>);
    fireEvent.change(screen.getByLabelText("Research question"),{target:{value:"What should be checked?"}});
    await act(async()=>fireEvent.click(screen.getByRole("button",{name:"Create free proposal"})));
    fireEvent.click(screen.getByLabelText(/I explicitly approve this exact selection/));
    await act(async()=>fireEvent.click(screen.getByRole("button",{name:"Approve and run once · $0"})));
    expect(captureLead).not.toHaveBeenCalled();
    fireEvent.click(screen.getByLabelText(/Authoritative title/));
    expect(screen.getByText("Authoritative title").className).toContain("rex-lead__title");
    expect(screen.getByText("https://example.test/source").className).toContain("rex-lead__url");
    expect(screen.getByText("Authoritative snippet").className).toContain("rex-lead__snippet");
    expect(screen.getAllByText(/Source page not acquired or inspected/)).toHaveLength(2);
    expect(screen.getAllByText(/Source page not acquired or inspected/)[0]?.className).toContain("rex-lead__notice");
    expect(captureLead).not.toHaveBeenCalled();
    fireEvent.click(screen.getByLabelText(/I confirm this selected result only/));
    await act(async()=>fireEvent.click(screen.getByRole("button",{name:"Add to Candidate Evidence"})));
    expect(captureLead).toHaveBeenCalledTimes(1);
    expect(await screen.findByText(/Captured candidate: candidate-1/)).toBeTruthy();
    fireEvent.click(screen.getByLabelText(/Second authoritative title/));
    expect((screen.getByLabelText(/I confirm this selected result only/) as HTMLInputElement).checked).toBe(false);
    expect(captureLead).toHaveBeenCalledTimes(1);
    fireEvent.click(screen.getByRole("button",{name:"Review in Candidate Evidence"}));
    expect(navigateToMode).toHaveBeenCalledWith("EVIDENCE");
  });
});
