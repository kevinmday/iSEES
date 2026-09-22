import assert from "node:assert/strict";

import { decodeSystemIdentity } from "../../src/system/SystemIdentity.ts";
import { loadSystemIdentity } from "../../src/system/SystemIdentityClient.ts";
import { resolveSystemCompatibility } from "../../src/system/SystemCompatibility.ts";

const wire = {
  schemaVersion: "isees-release-manifest/v1", productId: "isees", productName: "iSEES",
  expandedName: "Integrated Systems Epistemology & Evaluation System",
  descriptor: "Deterministic investigative research environment", version: "1.0.0",
  frontendContract: "isees-web/v1", backendContract: "isees-api/v1",
  releaseChannel: "LOCAL", runtimeEnvironment: "LOCAL",
  sourceRevision: null, deploymentRevision: null, builtAt: null,
} as const;

const decoded = decodeSystemIdentity(wire);
assert.equal(decoded.sourceRevision, null);
assert.equal(decoded.deploymentRevision, null);
assert.equal(decoded.builtAt, null);
assert.equal(resolveSystemCompatibility(decoded), "COMPATIBLE");
assert.equal(resolveSystemCompatibility({ ...decoded, backendContract: "isees-api/v2" }), "INCOMPATIBLE");
assert.equal(resolveSystemCompatibility(undefined), "UNKNOWN");
assert.equal(resolveSystemCompatibility({ ...decoded, backendContract: "malformed" }), "UNKNOWN");

let requested = "";
const loaded = await loadSystemIdentity({ fetch: async (input) => {
  requested = String(input);
  return new Response(JSON.stringify(wire), { status: 200, headers: { "Content-Type": "application/json" } });
} });
assert.equal(requested, "/api/v1/system/identity");
assert.deepEqual(loaded, decoded);
assert.throws(() => decodeSystemIdentity({ ...wire, sourceRevision: undefined }));
console.log("System Identity frontend verification passed.");
