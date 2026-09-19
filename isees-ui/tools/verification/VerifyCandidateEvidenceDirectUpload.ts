import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const workspace = readFileSync("src/workspace/surfaces/EvidenceWorkspace.tsx", "utf8");
const api = readFileSync("src/evidence/candidates/CandidateEvidenceApi.ts", "utf8");
const types = readFileSync("src/evidence/candidates/CandidateEvidenceTypes.ts", "utf8");

for (const marker of [
  "Direct media upload", "Create Candidate Evidence", "Maximum 25 MiB",
  "Server-side signature validation", "Research Inbox, Investigation Evidence, Curated Context, and the Manifold are unchanged",
  "Original filename", "Safe display filename", "Content hash", "Storage receipt", "Review-only Candidate Evidence",
]) assert(workspace.includes(marker), `governed direct-upload presentation is absent: ${marker}`);
for (const marker of ["FormData", '"/direct-uploads"', "candidate-evidence-upload/v1", "DIRECT_UPLOAD"]) {
  assert(api.includes(marker), `direct-upload API contract is absent: ${marker}`);
}
assert(api.includes("init?.body instanceof FormData"), "multipart requests would be mislabeled as JSON");
assert(types.includes('"DIRECT_UPLOAD"'), "shared Candidate Evidence pathway omits direct upload");
const directUploadStart = workspace.indexOf("async function submitCandidate");
const directUploadEnd = workspace.indexOf("const view =", directUploadStart);
const directUploadFlow = directUploadStart >= 0 && directUploadEnd > directUploadStart ? workspace.slice(directUploadStart, directUploadEnd) : "";
assert(directUploadFlow, "direct-upload submission boundary is absent");
for (const forbidden of ["publishRex", "createAnchorsAtomically", "fetch(submission", "OperationalGraphRevision"]) {
  assert(!directUploadFlow.includes(forbidden), `direct-upload UI contains forbidden side-effect owner: ${forbidden}`);
}

console.log("PASS VerifyCandidateEvidenceDirectUpload — deliberate multipart review-only intake and governed inspection verified");
