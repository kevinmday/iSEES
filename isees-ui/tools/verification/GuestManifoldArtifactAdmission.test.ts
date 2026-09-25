import { readFileSync } from "node:fs";
import { describe,expect,it } from "vitest";
import { createBlankNativeCaseDraftContent,restoreNativeCaseDraftContent,suppliedEnvelope } from "../../src/nativeCaseDraft/NativeCaseDraftFieldState.ts";
import { createGuestCandidateInvestigation } from "../../src/workspace/guestCase/GuestCaseIntake.ts";
import { WorkspaceRuntime } from "../../src/workspace/runtime/WorkspaceRuntime.ts";
import type { ManifoldArtifactManifest } from "../../src/studio/contracts/StudioV1Contract.ts";
import { manifoldArtifactOutputHash } from "../../src/studio/contracts/StudioCanonicalSerialization.ts";
import { CANONICAL_EVENTS } from "../../src/canonical/runtimeCorpus.ts";
import { SystemCanonAdapter } from "../../src/federation/adapters/SystemCanonAdapter.ts";
import { createCanonicalInvestigationFromCorpusEvent } from "../../src/federation/services/importInvestigation.ts";
import { adaptSystemCanonToKnowledge } from "../../src/knowledge/ingestion/SystemCanonKnowledgeAdapter.ts";
import { materializeInitialOperationalRevision } from "../../src/investigation/revision/OperationalGraphRevision.ts";

const at="2026-09-25T12:00:00.000Z",identity={status:"READY" as const,identity:{kind:"GUEST" as const,operatorId:"guest:admission",establishedAt:at},persistence:"SESSION" as const,revision:1};
function guest(session:string){const blank=restoreNativeCaseDraftContent(createBlankNativeCaseDraftContent()),created=createGuestCandidateInvestigation(Object.freeze({...blank,workingTitle:suppliedEnvelope("Guest admission"),observationNarrative:suppliedEnvelope("A local observation.")}),identity,at,session);if(created.status!=="CREATED")throw new Error("fixture");return created.investigation}
function manifest(investigationId:string,endpoint:string){const fixture=JSON.parse(readFileSync("../contracts/studio-v1/fixtures/studio-v1-contract-fixtures.json","utf8")).manifoldArtifactManifest as ManifoldArtifactManifest;return{...fixture,source:{...fixture.source,investigationId},declarations:[{...fixture.declarations.find(value=>value.declarationType==="PROPOSED_RELATIONSHIP")!,declarationId:"guest-edge",subject:{kind:"KNOWLEDGE_OBJECT" as const,identity:endpoint},predicate:"REFERENCES",object:{kind:"ARTIFACT" as const,identity:"$ADMITTED_ARTIFACT"}}]} as ManifoldArtifactManifest}

describe("guest MANIFOLD_ARTIFACT admission authority",()=>{
 it("forks the exact active Nimitz canon revision once and mutates only the disposable copy",async()=>{
  const adapter=new SystemCanonAdapter(),event=(await adapter.preview("E-TICTAC-2004")).event,repository=adapter.repository;
  const canon=materializeInitialOperationalRevision(createCanonicalInvestigationFromCorpusEvent(repository,event),adaptSystemCanonToKnowledge(CANONICAL_EVENTS),{recordedAt:event.updated_at});
  const runtime=new WorkspaceRuntime(),canonBytes=JSON.stringify(canon),head=canon.currentRevisionId!,endpoint=canon.revisions.find(value=>value.id===head)!.manifold.graph.nodes[0]!.id,m=manifest(canon.id,endpoint),hash=manifoldArtifactOutputHash(m);
  runtime.activateInvestigation(canon);expect(runtime.canAdmitGuestManifoldArtifact(canon.id)).toBe(true);
  const command={investigationId:canon.id,projectionId:"nimitz-projection",expectedOperationalHeadId:head,selectedRelationshipDeclarationIds:["guest-edge"],idempotencyKey:"nimitz-command",manifest:m,outputHash:hash,admittedAt:at};
  const first=runtime.admitGuestManifoldArtifact(command),copy=runtime.getActiveInvestigation()!;
  expect(first.replayed).toBe(false);expect(copy).not.toBe(canon);expect(copy.name).toContain("Disposable guest working copy");expect(copy.workspace.guest_canonical_working_copy).toEqual({kind:"GUEST_CANONICAL_WORKING_COPY",sourceInvestigationId:canon.id,sourceWorkspaceId:canon.workspace.id,sourceRevisionId:head,sourceEventId:"E-TICTAC-2004"});expect(copy.revisions.at(-2)).toBe(canon.revisions.find(value=>value.id===head));expect(copy.revisions).toHaveLength(canon.revisions.length+1);expect(copy.revisions.at(-1)!.manifold.graph.nodes.filter(value=>value.type==="ARTIFACT")).toHaveLength(canon.revisions.at(-1)!.manifold.graph.nodes.filter(value=>value.type==="ARTIFACT").length+1);expect(first.receipt.createdRelationshipIds).toHaveLength(1);expect(JSON.stringify(canon)).toBe(canonBytes);
  expect(runtime.admitGuestManifoldArtifact(command).replayed).toBe(true);expect(runtime.getActiveInvestigation()).toBe(copy);expect(copy.revisions).toHaveLength(canon.revisions.length+1);
 });
 it("appends exactly one local artifact revision, selected edges, and replays idempotently",()=>{
  const runtime=new WorkspaceRuntime(),source=guest("one"),canonBytes=JSON.stringify(source),endpoint=source.revisions[0]!.manifold.graph.nodes[0]!.id,m=manifest(source.id,endpoint),hash=manifoldArtifactOutputHash(m);runtime.activateGuestCandidateInvestigation(source);
  const command={investigationId:source.id,projectionId:"guest-projection",expectedOperationalHeadId:"REV-0001",selectedRelationshipDeclarationIds:["guest-edge"],idempotencyKey:"guest-command",manifest:m,outputHash:hash,admittedAt:at};
  const first=runtime.admitGuestManifoldArtifact(command),active=runtime.getActiveInvestigation()!;
  expect(first.replayed).toBe(false);expect(active.revisions).toHaveLength(2);expect(active.revisions[1]!.manifold.graph.nodes.filter(node=>node.type==="ARTIFACT")).toHaveLength(source.revisions[0]!.manifold.graph.nodes.filter(node=>node.type==="ARTIFACT").length+1);expect(first.receipt.createdRelationshipIds).toHaveLength(1);expect(active.revisions[1]!.manifold.graph.edges).toHaveLength(source.revisions[0]!.manifold.graph.edges.length+1);expect(active.revisions[1]!.manifold.graph.nodes.find(node=>node.id===first.receipt.admittedArtifactNodeId)?.metadata).toMatchObject({outputHash:hash,source:m.source,declarations:m.declarations,normalizedProvenance:m.normalizedProvenance});expect(runtime.getSelection()).toEqual({kind:"NODE",nodeId:first.receipt.admittedArtifactNodeId});expect(runtime.admitGuestManifoldArtifact(command).replayed).toBe(true);expect(runtime.getActiveInvestigation()!.revisions).toHaveLength(2);expect(JSON.stringify(source)).toBe(canonBytes)
 });
 it("fails atomically for stale, wrong-investigation, invalid, and unresolved commands",()=>{
  const runtime=new WorkspaceRuntime(),source=guest("two"),before=JSON.stringify(source);runtime.activateGuestCandidateInvestigation(source);const m=manifest(source.id,"missing-node"),base={investigationId:source.id,projectionId:"guest-projection",expectedOperationalHeadId:"REV-0000",selectedRelationshipDeclarationIds:["guest-edge"],idempotencyKey:"bad",manifest:m,outputHash:manifoldArtifactOutputHash(m),admittedAt:at};expect(()=>runtime.admitGuestManifoldArtifact(base)).toThrow();expect(()=>runtime.admitGuestManifoldArtifact({...base,expectedOperationalHeadId:"REV-0001",investigationId:"other"})).toThrow();expect(()=>runtime.admitGuestManifoldArtifact({...base,expectedOperationalHeadId:"REV-0001"})).toThrow(/unresolved/);expect(runtime.getActiveInvestigation()).toBe(source);expect(JSON.stringify(source)).toBe(before)
 });
 it("discards admission state when the guest investigation session is replaced",()=>{
  const runtime=new WorkspaceRuntime(),source=guest("three"),endpoint=source.revisions[0]!.manifold.graph.nodes[0]!.id,m=manifest(source.id,endpoint);runtime.activateGuestCandidateInvestigation(source);runtime.admitGuestManifoldArtifact({investigationId:source.id,projectionId:"p",expectedOperationalHeadId:"REV-0001",selectedRelationshipDeclarationIds:[],idempotencyKey:"key",manifest:m,outputHash:manifoldArtifactOutputHash(m),admittedAt:at});const replacement=guest("replacement");runtime.activateGuestCandidateInvestigation(replacement);expect(runtime.getActiveInvestigation()).toBe(replacement);expect(replacement.revisions).toHaveLength(1)
 });
});
