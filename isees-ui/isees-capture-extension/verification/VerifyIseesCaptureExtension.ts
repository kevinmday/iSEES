import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { resolve } from "node:path";

const root = resolve(import.meta.dirname, "..");
const read = (path: string): Promise<string> => readFile(resolve(root, path), "utf8");
const [manifestText, html, popup, extraction, consent, readme, submission] = await Promise.all([read("manifest.json"), read("popup.html"), read("src/popup.ts"), read("src/extraction.ts"), read("src/consent.ts"), read("README.md"), read("EDGE_ADDONS_SUBMISSION.md")]);
const manifest = JSON.parse(manifestText) as Record<string, unknown>;
const documentation = `${readme}\n${submission}`;
const runtime = `${popup}\n${extraction}\n${consent}`;
const iconPaths = {
  "16": "icons/isees-capture-16.png",
  "32": "icons/isees-capture-32.png",
  "48": "icons/isees-capture-48.png",
  "128": "icons/isees-capture-128.png",
} as const;
const actionIconPaths = { "16": iconPaths["16"], "32": iconPaths["32"] };
const pngDimensions = (bytes: Buffer): readonly [number, number] => {
  assert.deepEqual([...bytes.subarray(0, 8)], [137, 80, 78, 71, 13, 10, 26, 10], "icon must be a PNG");
  assert.equal(bytes.subarray(12, 16).toString("ascii"), "IHDR", "PNG must begin with an IHDR chunk");
  return [bytes.readUInt32BE(16), bytes.readUInt32BE(20)];
};
assert.equal(manifest.manifest_version, 3);
assert.equal(manifest.name, "iSEES Capture");
assert.equal(manifest.description, "The iSEES external-source capture companion for Microsoft Edge; saves local Source Capsule JSON for later inspection.");
assert.deepEqual(manifest.permissions, ["activeTab", "scripting", "downloads", "storage"]);
assert.equal("host_permissions" in manifest, false);
assert.equal("background" in manifest, false);
assert.equal("content_scripts" in manifest, false);
assert.deepEqual(manifest.icons, iconPaths);
assert.deepEqual((manifest.action as { default_icon: unknown }).default_icon, actionIconPaths);
for (const [size, path] of Object.entries(iconPaths)) {
  const bytes = await readFile(resolve(root, path));
  assert.ok(bytes.byteLength > 100, `${path} must contain visible image data`);
  assert.deepEqual(pngDimensions(bytes), [Number(size), Number(size)], `${path} dimensions`);
}
const csp = (manifest.content_security_policy as { extension_pages: string }).extension_pages;
assert.match(csp, /script-src 'self'/); assert.match(csp, /connect-src 'none'/); assert.doesNotMatch(csp, /https?:|unsafe-eval|unsafe-inline/);
assert.match(html, /<title>iSEES Capture<\/title>/); assert.match(html, /<h1>iSEES Capture<\/h1>/); assert.match(html, /External Source Capture/); assert.match(html, /creates a source package for later inspection and import into iSEES/);
assert.match(html, /id="agreement-check" type="checkbox"/); assert.match(html, /id="agree-button"[^>]*disabled/); assert.match(html, /Agree and enable iSEES Capture/);
assert.match(html, /Withdraw agreement/); assert.match(html, /id="capture-check" type="checkbox"/); assert.match(html, /Create iSEES Source Capsule/);
assert.match(html, /aria-live="polite"/); assert.match(html, /for="rights"/); assert.match(html, /for="privacy"/); assert.match(html, /for="researcher-note"/);
assert.match(consent, /version: AGREEMENT_VERSION, agreedAt:/); assert.match(consent, /Object\.keys\(record\)\.length === 2/); assert.match(consent, /storage\.local\.remove/);
assert.ok(popup.indexOf("readAgreement()") < popup.indexOf("chrome.tabs.query"), "agreement gate precedes tab access");
assert.ok(popup.indexOf('addEventListener("click"') < popup.indexOf("chrome.scripting.executeScript"), "inspection is click-triggered");
assert.ok(popup.indexOf('addEventListener("submit"') < popup.indexOf('uuid("capsule")'), "confirmed submit path owns identity generation");
assert.ok(popup.indexOf("extractActiveSelection") < popup.indexOf("exportSourceCapsule(frozenAttempt)"), "preview precedes exporter");
assert.match(popup, /import \{ exportSourceCapsule \}/); assert.doesNotMatch(popup, /createSourceCapsuleV1|capsuleHashBasis/);
assert.match(popup, /const exportedBytes = artifact\.utf8Bytes\(\)/); assert.match(popup, /new Blob\(\[exactBuffer\]/); assert.match(popup, /filename: artifact\.filename/); assert.match(popup, /conflictAction: "uniquify"/); assert.match(popup, /finally \{ URL\.revokeObjectURL/);
assert.match(popup, /has not been imported into iSEES/); assert.doesNotMatch(runtime, /fetch\(|XMLHttpRequest|WebSocket|EventSource|sendBeacon|localStorage|sessionStorage|document\.cookie|chrome\.history|setInterval\(/);
assert.match(extraction, /getSelection\(\)/); assert.match(extraction, /selection\?\.toString\(\)/); assert.match(extraction, /EMPTY_SELECTION/); assert.doesNotMatch(extraction, /outerHTML|innerHTML|querySelectorAll|querySelector[^\n]*(?:input|form|password)|\.value\b/);
assert.ok(extraction.indexOf('meta[property="og:site_name"]') < extraction.indexOf('meta[name="application-name"]'));
assert.ok(extraction.indexOf('meta[name="author"]') < extraction.indexOf('meta[property="article:author"]'));
assert.ok(extraction.indexOf('meta[property="article:published_time"]') < extraction.indexOf('meta[itemprop="datePublished"]'));
assert.match(popup, /researcherNotes: note \?/); assert.doesNotMatch(consent, /exactText|passage|pageTitle|finalUrl|researcher|email|name/);
assert.match(documentation, /Microsoft Edge on Windows is the sole native and supported (?:browser|platform) for (?:iSEES Capture )?v1/);
for (const browser of ["Chrome", "Firefox", "Safari"]) assert.match(documentation, new RegExp(`${browser}[^.]*not supported`, "i"), `${browser} must not be advertised as supported`);
assert.match(documentation, /Internet Explorer is explicitly unsupported/);
assert.match(documentation, /edge:\/\/[^.]*restricted browser page/i);
assert.match(documentation, /ordinary (?:public )?HTTP\(S\)|ordinary HTTP or HTTPS webpage/i);
assert.match(readme, /Production installation contract/); assert.match(readme, /Install iSEES Capture for Microsoft Edge/);
assert.match(readme, /persists across normal Edge restarts and Windows reboots/); assert.match(readme, /Developer-mode loading is for local testing only/);
assert.match(documentation, /(?:Store|Add-ons) URL: \*\*PENDING/); assert.doesNotMatch(documentation, /https?:\/\//);
assert.match(submission, /Single purpose/); assert.match(submission, /Permissions justification/); assert.match(submission, /Privacy and informed agreement/);
assert.match(submission, new RegExp(`Version: \\*\\*${String(manifest.version).replaceAll(".", "\\.")}\\*\\*`));
for (const permission of ["activeTab", "scripting", "downloads", "storage"]) assert.ok(submission.includes(`\`${permission}\`:`), `${permission} justification must exist`);
assert.match(submission, /no `host_permissions`, background service worker, or content script/);
assert.match(submission, /does not directly import it into the Research Inbox/); assert.match(submission, /not Candidate Knowledge[^.]*System Canon/);
assert.match(readme, /browser acceptance/i); assert.match(readme, /screenshots, full-page capture/);
for (const forbidden of ["ResearchInbox", "CandidateKnowledge", "SystemCanon", "/api/", "http://", "https://"]) assert.equal(popup.includes(forbidden), false, `forbidden authority/network token: ${forbidden}`);
console.log("VerifyIseesCaptureExtension: PASS (Microsoft Edge v1 identity, icon assets, and 57 extension shell controls verified)");
