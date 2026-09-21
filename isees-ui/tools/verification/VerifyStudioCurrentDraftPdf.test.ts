import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import type { ComputationalAuthorDocument } from "../../src/author/model/AuthorDocument.ts";
import { AuthorNodeTypes } from "../../src/author/model/AuthorNodeTypes.ts";
import { adaptCurrentDraftPdfRequest, StudioV1AdaptationError } from "../../src/studio/v1/runtime/StudioV1AuthorAdapter.ts";

const document = (text?:string):ComputationalAuthorDocument => ({
  identity:{id:"guest-document",createdAt:new Date("2026-09-21T17:00:00.000Z")},
  metadata:{title:"Guest draft",description:"",author:"",modifiedAt:new Date("2026-09-21T17:00:00.000Z"),version:1},
  type:"DOCUMENT",status:"MODIFIED",
  nodes:text?[{id:"paragraph",type:AuthorNodeTypes.PARAGRAPH,text,section:"Analysis"}]:[],
});

describe("current-draft PDF adaptation", () => {
  it("rejects an empty document and accepts exact dirty local content without authority identifiers", () => {
    expect(() => adaptCurrentDraftPdfRequest(document(),"guest-investigation",new Date().toISOString())).toThrow(StudioV1AdaptationError);
    const live=document("Unsaved exact guest content"),before=JSON.stringify(live);
    const request=adaptCurrentDraftPdfRequest(live,"guest-investigation","2026-09-21T18:00:00.000Z");
    expect(request.semanticContent.nodes[0]).toMatchObject({text:"Unsaved exact guest content"});
    expect(request.sourceKind).toBe("CURRENT_DRAFT");
    expect(request).not.toHaveProperty("artifactId");
    expect(request).not.toHaveProperty("revisionId");
    expect(request).not.toHaveProperty("revisionNumber");
    expect(JSON.stringify(live)).toBe(before);
    expect(adaptCurrentDraftPdfRequest(document("Unsaved exact guest content"),"guest-investigation","2026-09-21T18:01:00.000Z").sourceHash).toBe(request.sourceHash);
  });
  it("keeps current-draft availability independent of authentication and labels both export paths", () => {
    const toolbar=readFileSync("src/author/components/StudioToolbar.tsx","utf8");
    expect(toolbar).toContain("Export Current Draft PDF");
    expect(toolbar).toContain("Export Saved Revision PDF");
    expect(toolbar).toContain("Not an authority record");
    expect(toolbar).not.toMatch(/currentDraftUnavailable[^\n]*canDurablySave/);
  });
});
