import type { Investigation } from "../../investigation/investigationTypes.ts";
import { commitRevision, createRevision } from "../../investigation/engine/revisionEngine.ts";
import { manifoldArtifactOutputHash, validateManifoldArtifactManifest } from "../contracts/StudioCanonicalSerialization.ts";
import type { ManifoldArtifactManifest } from "../contracts/StudioV1Contract.ts";
import type { GraphEdge, GraphRelationshipType, InvestigationGraph } from "../../manifold/graphTypes.ts";
import type { AdmissionEffects, ManifoldArtifactAdmissionReceipt } from "../v1/api/ManifoldArtifactAdmissionApi.ts";
import { validateOperationalRevisionInvestigation } from "../../investigation/revision/OperationalGraphRevision.ts";

const EFFECTS:AdmissionEffects=Object.freeze({canon:"NONE",manifold:"REVISION_APPENDED",rex:"NONE",tavily:"NONE",webDiscovery:"NONE",candidateEvidence:"NONE",researchInbox:"NONE",confidence:"NONE",billing:"NONE"});
const RELATIONSHIPS:readonly GraphRelationshipType[]=["SIMILARITY","OBSERVED_AT","ASSOCIATED_WITH","LOCATED_AT","SUPPORTS","CONTRADICTS","DERIVED_FROM","REFERENCES","INVESTIGATES"];
const lexical=(a:string,b:string)=>a<b?-1:a>b?1:0;
const freeze=<T>(value:T):T=>{if(value!==null&&typeof value==="object"&&!Object.isFrozen(value)){for(const child of Object.values(value as Record<string,unknown>))freeze(child);Object.freeze(value)}return value};
const statistics=(graph:InvestigationGraph)=>({nodeCount:graph.nodes.length,edgeCount:graph.edges.length,eventCount:graph.nodes.filter(x=>x.type==="EVENT").length,facilityCount:graph.nodes.filter(x=>x.type==="FACILITY").length,artifactCount:graph.nodes.filter(x=>x.type==="ARTIFACT").length,personCount:graph.nodes.filter(x=>x.type==="PERSON").length,organizationCount:graph.nodes.filter(x=>x.type==="ORGANIZATION").length,locationCount:graph.nodes.filter(x=>x.type==="LOCATION").length,narrativeCount:graph.nodes.filter(x=>x.type==="NARRATIVE").length,hypothesisCount:graph.nodes.filter(x=>x.type==="HYPOTHESIS").length});

export interface GuestAdmissionCommand { readonly investigationId:string;readonly projectionId:string;readonly expectedOperationalHeadId:string|null;readonly selectedRelationshipDeclarationIds:readonly string[];readonly idempotencyKey:string;readonly manifest:ManifoldArtifactManifest;readonly outputHash:string;readonly admittedAt:string }
export interface GuestAdmissionResult { readonly investigation:Investigation;readonly receipt:ManifoldArtifactAdmissionReceipt }

/** Pure, deterministic guest revision computation. It performs no persistence or I/O. */
export function computeGuestManifoldArtifactAdmission(investigation:Investigation,command:GuestAdmissionCommand):GuestAdmissionResult{
 validateOperationalRevisionInvestigation(investigation);validateManifoldArtifactManifest(command.manifest);
 const workingCopy=investigation.workspace.guest_canonical_working_copy;
 if((!investigation.workspace.guest_candidate_event&&!workingCopy)||(investigation.status!=="DRAFT"&&workingCopy===undefined))throw new Error("Guest admission requires the active disposable guest investigation.");
 const sourceInvestigationId=workingCopy?.sourceInvestigationId??investigation.id;
 if(investigation.id!==command.investigationId||command.manifest.source.investigationId!==sourceInvestigationId)throw new Error("Guest admission investigation identity is ambiguous.");
 if(investigation.currentRevisionId!==command.expectedOperationalHeadId)throw new Error("The guest investigation changed. Review before confirming again.");
 if(manifoldArtifactOutputHash(command.manifest)!==command.outputHash)throw new Error("Guest artifact integrity validation failed.");
 if(!command.idempotencyKey.trim()||!command.projectionId.trim()||!Number.isFinite(Date.parse(command.admittedAt)))throw new Error("Guest admission command is malformed.");
 const selected=[...command.selectedRelationshipDeclarationIds].sort(lexical);if(new Set(selected).size!==selected.length)throw new Error("Guest admission selection contains duplicates.");
 const proposals=command.manifest.declarations.filter(value=>value.declarationType==="PROPOSED_RELATIONSHIP");
 const selectedProposals=selected.map(id=>{const matches=proposals.filter(value=>value.declarationId===id);if(matches.length!==1)throw new Error(`Selected relationship ${id} is invalid.`);return matches[0]!});
 const current=investigation.revisions.find(value=>value.id===investigation.currentRevisionId)!;
 const nodeId=`artifact:${command.outputHash.slice(7,23)}`;
 const existingNode=current.manifold.graph.nodes.find(value=>value.id===nodeId);if(existingNode)throw new Error("The artifact already exists outside this guest command replay.");
 const nodeIds=new Set(current.manifold.graph.nodes.map(value=>value.id));nodeIds.add(nodeId);
 const endpoint=(ref:{kind:string;identity:string})=>ref.kind==="ARTIFACT"&&ref.identity==="$ADMITTED_ARTIFACT"?nodeId:ref.identity;
 for(const value of proposals){const source=endpoint(value.subject),target=endpoint(value.object);if(!nodeIds.has(source)||!nodeIds.has(target)||source===target||!RELATIONSHIPS.includes(value.predicate as GraphRelationshipType))throw new Error(`Proposed relationship ${value.declarationId} is unresolved or invalid.`)}
 const existing=new Set(current.manifold.graph.edges.map(value=>`${value.source}\u0000${value.target}\u0000${value.relationship}`));
 const edges:GraphEdge[]=selectedProposals.map(value=>{const source=endpoint(value.subject),target=endpoint(value.object),key=`${source}\u0000${target}\u0000${value.predicate}`;if(existing.has(key))throw new Error(`Selected relationship ${value.declarationId} conflicts with the active graph.`);existing.add(key);return{id:`artifact-edge:${command.outputHash.slice(7,19)}:${value.declarationId}`,source,target,relationship:value.predicate as GraphRelationshipType,weight:1,rationale:[`Explicitly selected MANIFOLD_ARTIFACT declaration ${value.declarationId}.`]}});
 const prior=current.manifold.graph;if(edges.some(edge=>prior.edges.some(value=>value.id===edge.id)))throw new Error("Guest admission would duplicate an edge identity.");
 const graph=freeze({nodes:[...prior.nodes,{id:nodeId,label:command.manifest.source.artifactId,type:"ARTIFACT" as const,iconType:"DOCUMENT" as const,metadata:{projectionId:command.projectionId,outputHash:command.outputHash,source:{...command.manifest.source},frozenSourceAnchors:command.manifest.frozenSourceAnchors,declarations:command.manifest.declarations,normalizedProvenance:command.manifest.normalizedProvenance,sourceKnowledgeIdentities:command.manifest.sourceKnowledgeIdentities,evidenceReferences:command.manifest.evidenceReferences,acceptedRelationshipReferences:command.manifest.acceptedRelationshipReferences,projectionConfiguration:command.manifest.projectionConfiguration}}].sort((a,b)=>lexical(a.id,b.id)),edges:[...prior.edges,...edges].sort((a,b)=>lexical(a.id,b.id)),statistics:undefined as never});
 const finalGraph=freeze({...graph,statistics:statistics(graph)});const nextNumber=current.revisionNumber+1,revisionId=`REV-${nextNumber.toString().padStart(4,"0")}`;
 const revision=createRevision(investigation,freeze({id:`operational:${encodeURIComponent(investigation.id)}:${revisionId}`,timestamp:command.admittedAt,algorithmVersion:current.manifold.algorithmVersion,activeLayers:[...current.manifold.activeLayers],graph:finalGraph}),"GUEST_SESSION",`Admit MANIFOLD_ARTIFACT ${command.projectionId}`);
 const committed={...commitRevision(investigation,revision),revisions:Object.freeze([...investigation.revisions,revision]) as Investigation["revisions"]};validateOperationalRevisionInvestigation(committed);
 const receipt:ManifoldArtifactAdmissionReceipt=freeze({receiptId:`guest-admission:${command.outputHash.slice(7,23)}`,investigationId:investigation.id,projectionId:command.projectionId,verifiedOutputHash:command.outputHash,admittedArtifactNodeId:nodeId,selectedRelationshipDeclarationIds:selected,createdRelationshipIds:edges.map(value=>value.id),previousOperationalRevisionId:current.id,resultingOperationalRevisionId:revision.id,admittedAt:command.admittedAt,effects:EFFECTS});
 return freeze({investigation:committed,receipt});
}
