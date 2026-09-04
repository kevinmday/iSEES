import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { canMaterializeProjection } from "../../src/studio/components/StudioArtifactInspectorSemantics.ts";

const inspector = readFileSync(new URL("../../src/studio/components/StudioArtifactInspector.tsx", import.meta.url), "utf8");
const api = readFileSync(new URL("../../src/studio/api/StudioApi.ts", import.meta.url), "utf8");

const projection = { projectionId: "pdf:1", artifactVersionId: "v1", projectionFormat: "PDF" as const,
  readinessState: "READY" as const, validationWarnings: [], materializationState: "NOT_MATERIALIZED" as const,
  validatorVersion: "validator/v1", validatedAt: "2026-01-01T00:00:00Z" };
assert.equal(canMaterializeProjection({ durableVersionExists: true, synchronized: true, dirty: false,
  inFlight: false, owned: true, currentVersionId: "v1", format: "PDF", projection }), true);
assert.equal(canMaterializeProjection({ durableVersionExists: true, synchronized: true, dirty: true,
  inFlight: false, owned: true, currentVersionId: "v1", format: "PDF", projection }), false);
assert.match(inspector, /artifactVersionId[,}]/, "materialization sends the exact saved version identity");
assert.match(inspector, /projections\/materializations/, "eligible action calls the canonical backend route");
assert.match(inspector, /await studioApi\.downloadPdf/, "download waits for the binary API");
assert.match(inspector, /await refresh\(scope, document\)/, "mutations wait for canonical refresh");
assert.match(inspector, /latest\?\.materializationState === "MATERIALIZED"/, "download derives from canonical materialized state");
assert.match(inspector, /Download PDF/, "canonical PDF exposes a clear download action");
assert.match(inspector, /Browser-only content preview\. This is not an authoritative exported/, "preview remains non-authoritative");
assert.doesNotMatch(inspector, /No authoritative output materializer is configured/, "placeholder is removed");
assert.match(api, /response\.blob\(\)/, "download consumes actual binary bytes");
assert.match(api, /Content-Type.*application\/pdf/, "binary response is type checked");
assert.doesNotMatch(api, /outputLocation\?:/, "internal storage location is absent from the frontend contract");
assert.match(inspector, /\["PDF", "DOCX", "HTML"\]/, "format controls remain independent");

console.log("PASS VerifyStudioPdfMaterialization — authoritative materialize/refresh/download and fail-closed projection UI verified");
