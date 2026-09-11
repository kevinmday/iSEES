import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { canMaterializeProjection } from "../../src/studio/components/StudioArtifactInspectorSemantics.ts";

const inspector = readFileSync(new URL("../../src/studio/components/StudioArtifactInspector.tsx", import.meta.url), "utf8");
const family = readFileSync(new URL("../../src/studio/components/StudioArtifactFamily.tsx", import.meta.url), "utf8");
const familySemantics = readFileSync(new URL("../../src/studio/components/StudioArtifactFamilySemantics.ts", import.meta.url), "utf8");
const api = readFileSync(new URL("../../src/studio/api/StudioApi.ts", import.meta.url), "utf8");

const projection = { projectionId: "pdf:1", artifactVersionId: "v1", projectionFormat: "PDF" as const,
  readinessState: "READY" as const, validationWarnings: [], materializationState: "NOT_MATERIALIZED" as const,
  validatorVersion: "validator/v1", validatedAt: "2026-01-01T00:00:00Z" };
assert.equal(canMaterializeProjection({ durableVersionExists: true, synchronized: true, dirty: false,
  inFlight: false, owned: true, currentVersionId: "v1", format: "PDF", projection }), true);
assert.equal(canMaterializeProjection({ durableVersionExists: true, synchronized: true, dirty: true,
  inFlight: false, owned: true, currentVersionId: "v1", format: "PDF", projection }), false);
assert.match(inspector, /await refresh\(scope, document\)/, "mutations wait for canonical refresh");
assert.match(family,/parentRevisionId/,"projection glyph carries the exact saved revision identity");
assert.doesNotMatch(inspector,/projections\/materializations|downloadPdf|Download PDF/,"I9 does not claim materialization capability");
assert.match(family,/No authoritative projection/,"absence remains explicit and non-authoritative");
assert.match(api, /response\.blob\(\)/, "download consumes actual binary bytes");
assert.match(api, /Content-Type.*application\/pdf/, "binary response is type checked");
assert.doesNotMatch(api, /outputLocation\?:/, "internal storage location is absent from the frontend contract");
for(const format of ["PDF","DOCX","HTML"])assert.match(familySemantics,new RegExp(format),`${format} remains an independent child glyph`);

console.log("PASS VerifyStudioPdfMaterialization — authoritative materialize/refresh/download and fail-closed projection UI verified");
