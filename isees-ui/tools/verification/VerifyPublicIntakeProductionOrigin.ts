import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";

const root = process.cwd();
const intake = fs.readFileSync(path.join(root, "src/pages/PublicIntake.tsx"), "utf8");
const origin = fs.readFileSync(path.join(root, "src/api/ApiOrigin.ts"), "utf8");
const vite = fs.readFileSync(path.join(root, "vite.config.ts"), "utf8");

assert.match(intake, /import \{ API_BASE_URL \} from "\.\.\/api\/ApiOrigin"/);
assert.match(intake, /`\$\{API_BASE_URL\}\/report`/);
assert.doesNotMatch(intake, /(?:localhost|127\.0\.0\.1)/i);
assert.match(origin, /VITE_API_BASE_URL/);
assert.match(origin, /\?\? ""/);
assert.match(origin, /export const API_BASE_URL = resolveApiBaseUrl\(\)/);
assert.match(vite, /['"]\/report['"]:[\s\S]*request\.method === ['"]POST['"]/);

for (const client of [
  "src/account/AccountFrontDoorApi.ts",
  "src/evidence/candidates/CandidateEvidenceApi.ts",
  "src/research/ResearchSourceApi.ts",
  "src/studio/api/StudioApi.ts",
]) {
  assert.match(fs.readFileSync(path.join(root, client), "utf8"), /ApiOrigin/);
}

console.log("PublicIntake production origin verification passed (8 assertions).");
