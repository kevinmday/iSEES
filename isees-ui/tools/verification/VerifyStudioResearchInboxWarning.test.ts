import { describe, expect, it } from "vitest";
import type { ResearchAnchor } from "../../src/research/researchBridgeTypes.ts";
import { warningFor } from "../../src/studio/components/StudioResearchInbox.tsx";

const anchor = (classification: "CANONICAL" | "UNDETERMINED",
                state: "INSERTABLE" | "INSPECTION_ONLY", reason: string): ResearchAnchor => ({
  schemaVersion:"research-anchor/v2", kind:"COMPARE_CANDIDATE", anchorId:"candidate", investigationId:"i",
  sourceWorkspace:"COMPARE", sourceIdentity:"candidate:left:right", collectedAt:new Date(0), createdAt:new Date(0),
  classification, display:{title:"Pair",summary:"Pair summary"}, insertability:{state,reason},
  capturedRepresentation:{schemaVersion:"compare/v1",mediaType:"application/json",value:{}}, pinned:false,
  candidate:{type:"CANDIDATE",candidateId:"c",evaluationId:"e",leftKnowledgeObjectId:"l",rightKnowledgeObjectId:"r",
    focusedEventId:"r",focusedEventKnowledgeObjectId:"r",comparisonEventId:"l",comparisonEventKnowledgeObjectId:"l",
    epistemicStatus:"POTENTIAL_RELATIONSHIP",aggregate:{} as never,dimensions:[],source:"COMPARE_PAIR_INSPECTION"},
} as ResearchAnchor);

describe("Research Inbox Compare warning precedence", () => {
  it("removes the candidate warning after canonical acceptance, including duplicate-blocked presentation", () => {
    expect(warningFor(anchor("CANONICAL","INSERTABLE","Accepted canonical relationship."))).toBeUndefined();
  });
  it("retains the unaccepted candidate warning", () => {
    expect(warningFor(anchor("UNDETERMINED","INSPECTION_ONLY","Candidate source."))).toContain("noncanonical");
  });
  it("retains governed conflict and unavailable reasons", () => {
    expect(warningFor(anchor("CANONICAL","INSPECTION_ONLY","Relationship conflict prevents insertion."))).toContain("conflict");
    expect(warningFor(anchor("UNDETERMINED","INSPECTION_ONLY","Candidate endpoints are unavailable."))).toContain("unavailable");
  });
});
