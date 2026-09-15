import { useEffect } from "react";
import { useOperatorIdentity } from "../identity/runtime/OperatorIdentityRuntimeContext.tsx";
import { useResearchBridge } from "../research/ResearchBridgeContext.tsx";
import { useWorkspaceRuntime } from "../workspace/runtime/WorkspaceRuntimeContext.tsx";
import { createRexApi, type RexApi } from "./RexApi.ts";
import { publishRexDiscoveriesAtomically } from "./RexResearchInboxProjection.ts";

const defaultRexApi=createRexApi();

export function RexResearchInboxHydrator({api=defaultRexApi}:{readonly api?:RexApi}) {
  const identity=useOperatorIdentity(), workspace=useWorkspaceRuntime(), research=useResearchBridge();
  const investigation=workspace.getActiveInvestigation();
  const accountOwned=identity.identity?.kind==="ACCOUNT"&&identity.persistence==="PERSISTENT"&&investigation?.createdBy==="AUTHENTICATED_RESEARCHER";
  const accountIdentity=identity.identity?.kind==="ACCOUNT"?identity.identity.operatorId:undefined;
  useEffect(()=>{
    if(!accountOwned||!investigation)return;
    const controller=new AbortController(), investigationId=investigation.id;
    void api.listCompletedDiscoveries(investigationId,controller.signal).then(discoveries=>{
      if(controller.signal.aborted||workspace.getActiveInvestigation()?.id!==investigationId)return;
      for(const discovery of discoveries) publishRexDiscoveriesAtomically(research,{investigationId,selectedSource:discovery.selectedSource,assignmentId:discovery.assignmentId,receipt:discovery.receipt,bundle:discovery.bundle});
    }).catch(()=>{ /* Owned read failures remain fail-closed and never execute REX. */ });
    return ()=>controller.abort();
  },[accountIdentity,accountOwned,api,investigation?.id,research,workspace]);
  return null;
}
