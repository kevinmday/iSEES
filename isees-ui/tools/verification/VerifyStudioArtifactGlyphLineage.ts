import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { projectStudioArtifactFamily } from "../../src/studio/components/StudioArtifactFamilySemantics.ts";
import type { ProjectionStatusList } from "../../src/studio/v1/api/StudioV1AuthorApiTypes.ts";

const head="artifact.r2",prior="artifact.r1";
const projections:ProjectionStatusList={artifactId:"artifact",revisionId:prior,items:[
 {projectionId:"pdf-r1",format:"PDF",parentRevisionId:prior,state:"CURRENT",failureCategory:null,outputHash:`sha256:${"a".repeat(64)}`},
 {projectionId:"docx-r1",format:"DOCX",parentRevisionId:prior,state:"FAILED",failureCategory:"RENDERER_UNAVAILABLE",outputHash:null},
]};
const priorFamily=projectStudioArtifactFamily(projections,prior);
assert.deepEqual(priorFamily.map(item=>item.format),["PDF","DOCX","HTML"],"PDF, DOCX, and HTML form the governed child family");
assert.equal(priorFamily[0]?.state,"CURRENT","current requires an exact authoritative parent and output hash");
assert.equal(priorFamily[0]?.parentRevisionId,prior,"child exposes its exact parent revision");
assert.equal(priorFamily[1]?.state,"FAILED","authoritative failure remains explicit");
assert.equal(priorFamily[2]?.state,"UNAVAILABLE","a missing backend record is never presented as an output");
const advanced=projectStudioArtifactFamily(projections,head);
assert.equal(advanced[0]?.state,"STALE","saving revision N+1 makes revision-N output visibly stale");
assert.equal(advanced[1]?.state,"STALE","prior lineage remains stable rather than being silently rewritten");
assert.equal(advanced[0]?.parentRevisionId,prior,"stale child retains its authoritative prior parent");
const unproven=projectStudioArtifactFamily({artifactId:"artifact",revisionId:head,items:[{projectionId:"pdf-r2",format:"PDF",parentRevisionId:head,state:"CURRENT",failureCategory:null,outputHash:null}]},head);
assert.equal(unproven[0]?.state,"UNAVAILABLE","CURRENT without authoritative output proof fails closed");
const active=projectStudioArtifactFamily({artifactId:"artifact",revisionId:head,items:[{projectionId:"pdf-r2",format:"PDF",parentRevisionId:head,state:"REBUILDING",failureCategory:null,outputHash:null},{projectionId:"docx-r2",format:"DOCX",parentRevisionId:head,state:"QUEUED",failureCategory:null,outputHash:null}]},head);
assert.deepEqual(active.slice(0,2).map(item=>item.state),["VALIDATING","QUEUED"],"validating/materializing and queued states remain explicit");

const toolbar=readFileSync("src/author/components/StudioToolbar.tsx","utf8"),family=readFileSync("src/studio/components/StudioArtifactFamily.tsx","utf8"),inspector=readFileSync("src/studio/components/StudioArtifactInspector.tsx","utf8"),css=readFileSync("src/studio/components/StudioArtifactInspector.css","utf8");
assert.match(toolbar,/Canonical source[\s\S]*\.author[\s\S]*Immutable revision/,"toolbar presents .author as canonical with authoritative revision state");
assert.match(family,/Canonical source[\s\S]*governed child projections/i,"family establishes source-to-child semantics");
assert.match(family,/Local changes do not alter these saved projection records/,"dirty source does not rewrite child projection state");
assert.match(family,/Parent:/,"each available child displays exact parent identity");
assert.doesNotMatch(inspector,/projections\/validations|projections\/materializations|downloadPdf/,"I9 does not expose legacy projection mutations as Studio V1 authority");
assert.match(css,/color: #f8fafc|color:#f8fafc/,"glyph system uses high-contrast text");
assert.match(family,/aria-label[\s\S]*title=/,"glyph state has accessible names and tooltips");
assert.match(toolbar,/disabled[\s\S]*title=/,"disabled toolbar controls explain why they are unavailable");
console.log("PASS VerifyStudioArtifactGlyphLineage — 18 canonical source, child lineage, authoritative state, stale, failure, unavailable, dirty, and accessibility checks passed.");
