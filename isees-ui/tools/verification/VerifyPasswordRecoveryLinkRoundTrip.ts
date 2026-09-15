import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { JSDOM } from "jsdom";
import { captureResetCapability, RESET_PATH } from "../../src/account/ResetCapability.ts";

const backend = String.raw`
import base64
import json
from datetime import datetime, timedelta, timezone

from isees_uap.authentication.models import IssuedRecoveryCapability, RecoveryDeliveryRecord
from isees_uap.authentication.recovery_delivery import ResendRecoveryDelivery, build_reset_url

class CaptureTransport:
    def __init__(self):
        self.body = None

    def request(self, **call):
        self.body = call["body"]
        return 200, b'{"id":"synthetic-message"}'

raw_token = base64.urlsafe_b64encode(bytes(range(32))).rstrip(b"=").decode("ascii")
transport = CaptureTransport()
delivery = ResendRecoveryDelivery(
    api_key="synthetic-key", public_app_origin="https://app.example.test",
    from_email="sender@example.test", from_name="iSEES", token_ttl_seconds=1800,
    transport=transport,
)
issued = datetime(2026, 1, 1, tzinfo=timezone.utc)
delivery.deliver(RecoveryDeliveryRecord(
    account_id="acct_synthetic", destination="recipient@example.test",
    capability=IssuedRecoveryCapability(
        token_id="rtok_synthetic", account_id="acct_synthetic",
        raw_token=raw_token, expires_at=issued + timedelta(minutes=30),
    ),
))
payload = json.loads(transport.body)
print(json.dumps({"token": raw_token, "url": build_reset_url("https://app.example.test", raw_token), "html": payload["html"]}))
`;

const result = spawnSync("python", ["-c", backend], {
  cwd: new URL("../../../", import.meta.url),
  encoding: "utf8",
  env: { ...process.env, PYTHONIOENCODING: "utf-8" },
});
assert.equal(result.status, 0, "synthetic backend composition must succeed");
const composed = JSON.parse(result.stdout) as { token: string; url: string; html: string };
assert.match(composed.token, /^[A-Za-z0-9_-]{43}$/, "canonical 256-bit token shape");

const document = new JSDOM(composed.html).window.document;
const href = document.querySelector("a")?.getAttribute("href");
assert.ok(href, "real HTML body must contain an HTML-decoded anchor href");
assert.ok(href === composed.url, "HTML representation must preserve the real reset URL exactly");

const browserUrl = new URL(href);
let scrubbed = false;
const recovered = captureResetCapability(
  { pathname: browserUrl.pathname, hash: browserUrl.hash },
  () => {
    assert.equal(scrubbed, false, "scrub must occur exactly once");
    scrubbed = true;
    browserUrl.hash = "";
  },
);
assert.ok(recovered !== null, "valid fragment must be captured before scrubbing");
assert.ok(scrubbed && browserUrl.hash === "", "fragment must be scrubbed immediately after capture");
assert.ok(recovered === composed.token, "frontend must recover the original synthetic token exactly");

let wrongRouteScrubbed = false;
assert.equal(captureResetCapability({ pathname: "/", hash: browserUrl.hash }, () => { wrongRouteScrubbed = true; }), null);
assert.equal(wrongRouteScrubbed, false, "non-reset routes must remain untouched");
assert.equal(captureResetCapability({ pathname: RESET_PATH, hash: "#token=malformed" }, () => undefined), null);

console.log("PASS VerifyPasswordRecoveryLinkRoundTrip: synthetic backend builder, Resend HTML, browser parsing, frontend capture, validation, and post-capture scrubbing verified without exposing the token.");
