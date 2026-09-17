import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const contract = readFileSync(
  "../contracts/evidence/EVIDENCE-001_Researcher_Directed_Evidence_Intake_Runtime_Contract.md",
  "utf8",
);

const required = [
  "authenticated researcher who owns the active persisted Investigation",
  "Guest Web Discovery is not authorized in V1",
  "V1 is metadata-only",
  "MUST NOT fetch, open, crawl, scrape, archive, summarize, hash, classify, or verify any result webpage",
  "Search and capture are distinct commands",
  "Unselected results remain ephemeral",
  "bounded server-side search-session owner is the sole authority",
  "backend origin `DISCOVERY`, intake pathway `WEB_DISCOVERY`, and visible origin label `WEB_DISCOVERED`",
  "`aiAssistance: NONE`",
  "`rexExecution: NONE`",
  "Research Inbox effect `NONE`",
  "Candidate Knowledge effect `NONE`",
  "Canon effect `NONE`",
  "graph effect `NONE`",
  "Manifold effect `NONE`",
  "Resolve effect `NONE`",
  "expected Investigation aggregate revision",
  "stale Investigation aggregate revision",
  "expired session",
  "result/session mismatch",
  "idempotency-key conflict",
  "One shared authority MUST normalize URLs for both direct URL intake and Web Discovery capture",
  "search(request, cancellation) -> outcome",
  "Adapters MUST NOT receive Candidate Evidence repositories",
  "deterministic, offline, versioned fixture",
  "POST /api/v1/investigations/{investigation_id}/candidate-evidence/web-discovery/searches",
  "POST /api/v1/investigations/{investigation_id}/candidate-evidence/web-discovery/captures",
  "Production provider selection remains unresolved",
  "implements no route, service, repository, migration, provider client, UI behavior, webpage fetching, REX integration, or live search",
] as const;

for (const marker of required) {
  assert(contract.includes(marker), `Web Discovery contract marker is absent: ${marker}`);
}

for (const error of [
  "WEB_DISCOVERY_UNAVAILABLE",
  "WEB_DISCOVERY_RATE_LIMITED",
  "WEB_DISCOVERY_PROVIDER_FAILURE",
  "WEB_DISCOVERY_CANCELLED",
  "WEB_DISCOVERY_SESSION_EXPIRED",
  "WEB_DISCOVERY_RESULT_NOT_FOUND",
  "WEB_DISCOVERY_RESULT_MISMATCH",
] as const) {
  assert(contract.includes(`\`${error}\``), `stable Web Discovery error is absent: ${error}`);
}

assert.match(contract, /estimated provider cost `0`.*actual provider cost `0`.*final charge `0`/s);
assert.match(contract, /principal ID.*Investigation ID.*aggregate revision.*Manifold revision ID/s);
assert.match(contract, /Capture MUST NOT contact the provider.*mutate downstream owners/s);

console.log("PASS VerifyWebDiscoveryContract — authenticated metadata-only search/capture contract and zero-effect boundary verified");
