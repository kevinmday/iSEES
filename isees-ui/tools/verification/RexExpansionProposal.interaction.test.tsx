import { webcrypto } from "node:crypto";
import { act, cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, beforeAll, describe, expect, it, vi } from "vitest";
import type { SelectionIntelligenceBinding } from "../../src/manifold/selection/selectionIntelligenceResolver.ts";
import type { RexApi, RexExpansionProposal } from "../../src/rex/RexApi.ts";

const graph={nodes:[{id:"node-1",label:"Selected",type:"ENTITY"},{id:"node-2",label:"Other",type:"ENTITY"}],edges:[{id:"edge-1",source:"node-1",target:"node-2",relationship:"RELATED",weight:1,rationale:[]}]};
const investigation={id:"investigation-1",createdBy:"AUTHENTICATED_RESEARCHER",currentRevisionId:"revision-1",revisions:[{id:"revision-1",manifold:{graph}}]};

vi.mock("../../src/workspace/runtime/WorkspaceRuntimeContext.tsx",()=>({useWorkspaceRuntime:()=>({getActiveInvestigation:()=>investigation})}));
vi.mock("../../src/identity/runtime/OperatorIdentityRuntimeContext.tsx",()=>({useOperatorIdentity:()=>({identity:{kind:"ACCOUNT",operatorId:"principal-1"},persistence:"PERSISTENT"})}));

import { RexProposalControl } from "../../src/rex/RexExploreControl.tsx";

const binding=(targetId:string):SelectionIntelligenceBinding=>({investigationId:"investigation-1",manifoldRevisionId:"revision-1",selectionKind:"NODE",targetId,projectionFingerprint:`projection:${targetId}`});
const proposal=(targetId:string,revisionHash:string):RexExpansionProposal=>({proposalId:`proposal-${targetId}`,investigationId:"investigation-1",principalId:"principal-1",selectedObject:{kind:"NODE",id:targetId},revision:{id:"revision-1",hash:revisionHash},researcherQuestion:"What should be checked?",researcherNotes:null,plan:{plannerVersion:"rex-expansion-proposal-planner/v1",profile:{id:"GENERAL_NODE",version:"rex-general-selection-profile/v1"},objectivePacks:[{id:"GENERAL_EVIDENCE",version:"rex-general-evidence-objectives/v1"}],queryGuidance:[`Inspect ${targetId}`],governedContext:[`Selected node: ${targetId}`],limits:["Bounded"],stopRules:["Stop"]},proposedQueryPlan:[`Inspect ${targetId}`],limits:["Bounded"],stopRules:["Stop"],inspectionWork:["Inspect"],status:"PROPOSAL_ONLY",createdAt:"2026-09-26T00:00:00Z",costEnvelope:{status:"PLANNING_ONLY",providerComponent:"UNAVAILABLE",iseesMargin:"UNAVAILABLE",maximumCustomerPrice:"UNAVAILABLE",customerCharge:"$0.00 FOR PROPOSAL CREATION ONLY"},effects:{externalDispatch:"NONE"}});

function deferred<T>(){let resolve!:(value:T)=>void;const promise=new Promise<T>(done=>{resolve=done});return {promise,resolve}}
function api(createProposal:RexApi["createProposal"]):RexApi{return {createProposal,getProposal:vi.fn(),createAssignment:vi.fn(),prepare:vi.fn(),execute:vi.fn(),getReceipt:vi.fn(),getBundle:vi.fn(),listCompletedDiscoveries:vi.fn()}}

beforeAll(()=>Object.defineProperty(globalThis,"crypto",{value:webcrypto,configurable:true}));
afterEach(cleanup);

describe("REX proposal binding",()=>{
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
    expect(await screen.findByText(/Inspect proposal/)).toBeTruthy();
    view.rerender(<RexProposalControl api={rex} selectionBinding={binding("node-2")}/>);
    expect(screen.queryByText(/Inspect proposal/)).toBeNull();
    expect(screen.getByText("Selection or revision changed. Create a proposal for the current binding.")).toBeTruthy();
  });
});
