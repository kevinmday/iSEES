import assert from "node:assert/strict";
import { readFileSync, readdirSync, statSync } from "node:fs";
import { join } from "node:path";
import { resolveCaptureInstallConfiguration } from "../../src/companion/capture/IseesCaptureUrl.ts";

const read = (path: string) => readFileSync(path, "utf8");
function sourceFiles(root: string): string[] {
  return readdirSync(root).flatMap((name) => {
    const path = join(root, name);
    return statSync(path).isDirectory() ? sourceFiles(path) : /\.(?:ts|tsx|css)$/.test(name) ? [path] : [];
  });
}

const appSources = sourceFiles("src").map(read);
const allApplicationSource = appSources.join("\n");
const content = read("src/companion/capture/IseesCaptureContent.ts");
const globalLink = read("src/companion/capture/IseesCaptureGlobalLink.tsx");
const globalLinkCss = read("src/companion/capture/IseesCaptureGlobalLink.css");
const info = read("src/companion/capture/IseesCaptureInfo.tsx");
const infoCss = read("src/companion/capture/IseesCapture.css");
const config = read("src/companion/capture/IseesCaptureConfig.ts");
const app = read("src/App.tsx");
const mainLayout = read("src/layout/MainLayout.tsx");
const modeSources = Object.fromEntries([
  ["OVERVIEW", "src/workspace/surfaces/OverviewWorkspace.tsx"],
  ["EVIDENCE", "src/workspace/surfaces/EvidenceWorkspace.tsx"],
  ["NARRATIVE", "src/narrative/components/NarrativeWorkspace.tsx"],
  ["Research Inbox", "src/manifold/components/ResearchInboxInstrument.tsx"],
  ["WorkspaceSurface", "src/surfaces/WorkspaceSurface.tsx"],
  ["bottom mode bar", "src/components/workspace/WorkspaceModeBar.tsx"],
].map(([name, path]) => [name, read(path)]));

for (const value of [
  "Take iSEES research with you",
  "Add iSEES Capture to Microsoft Edge to preserve exact passages and source provenance while researching anywhere on the web. Captures remain local until you deliberately bring them into iSEES.",
  "Add iSEES Capture to Edge",
]) {
  assert.equal(appSources.reduce((count, source) => count + source.split(value).length - 1, 0), 1, `canonical copy must have one source owner: ${value}`);
  assert.ok(content.includes(value));
}

assert.equal(appSources.reduce((count, source) => count + source.split("<IseesCaptureGlobalLink />").length - 1, 0), 1, "exactly one global Capture affordance must be mounted");
assert.match(mainLayout, /<IseesCaptureGlobalLink \/>[\s\S]*SYSTEM BRIEFING/);
assert.match(globalLink, /isees-capture-extension\/icons\/isees-capture\.svg/);
assert.match(globalLink, /<Link[\s\S]*to="\/capture"/);
assert.match(globalLink, /aria-label="Learn about iSEES Capture"/);
assert.match(globalLink, /<span>Capture<\/span>/);
assert.doesNotMatch(globalLink, /ISEES_CAPTURE_INSTALL|microsoftedge\.microsoft\.com|href=/);
assert.match(globalLinkCss, /width:\s*30px/);
assert.match(globalLinkCss, /:focus-visible/);
assert.match(globalLinkCss, /@media \(max-width: 760px\)[\s\S]*\.capture-global-link span/);
assert.doesNotMatch(globalLinkCss, /animation|pulse/i);

assert.match(app, /path="\/capture"[\s\S]*<IseesCaptureInfo \/>/);
assert.match(info, /ISEES_CAPTURE_CONTENT\.headline/);
assert.match(info, /ISEES_CAPTURE_CONTENT\.action/);
assert.match(info, /ISEES_CAPTURE_INSTALL\.status === "READY"/);
assert.match(info, /target="_blank" rel="noopener noreferrer"/);
assert.match(infoCss, /text-wrap:balance/);
assert.match(infoCss, /font-size:clamp\(2rem,4vw,3\.25rem\)/);
assert.match(infoCss, /\.capture-info\{[^}]*height:100vh[^}]*overflow-x:hidden[^}]*overflow-y:auto/, "canonical Capture information surface owns viewport-bounded vertical scrolling and preserves horizontal overflow protection");
assert.match(infoCss, /\.capture-info\{[^}]*scrollbar-color:#67d2da #09131f[^}]*scrollbar-width:thin/, "Capture scroll owner exposes an iSEES dark/cyan scrollbar");
assert.match(infoCss, /\.capture-info::\-webkit-scrollbar-thumb\{[^}]*background:#67d2da/, "Capture scroll owner exposes its scrollbar in WebKit browsers");
assert.doesNotMatch(infoCss, /\.capture-info section\{[^}]*(?:overflow|height|max-height):/, "Capture information cards must not create competing scroll regions");

for (const [name, source] of Object.entries(modeSources)) {
  assert.doesNotMatch(source, /IseesCapture|capture-global|showCaptureAwareness|\/capture/i, `${name} must contain no Capture promotion or mode-conditioned awareness`);
}
for (const mode of ["MANIFOLD", "COMPARE", "TIMELINE", "LAYERS", "INTENTION", "RESEARCH"]) {
  assert.doesNotMatch(modeSources.WorkspaceSurface, new RegExp(`WorkspaceMode\\.${mode}[\\s\\S]{0,160}Capture`, "i"), `${mode} must remain free of Capture promotion`);
}

for (const prohibited of [
  /Download iSEES Capture/i, /Microsoft Store/i, /\bZIP\b/, /\bCRX\b/,
  /developer mode/i, /Load unpacked/i, /PowerShell/i, /package hashes?/i, /submission-package/i,
]) assert.doesNotMatch(allApplicationSource, prohibited, `normal application source contains prohibited copy: ${prohibited}`);

assert.match(config, /VITE_ISEES_CAPTURE_EDGE_ADDONS_URL/);
assert.equal(resolveCaptureInstallConfiguration(undefined).status, "PENDING");
assert.equal(resolveCaptureInstallConfiguration("").status, "PENDING");
const fixtureId = "a".repeat(32);
const verifiedFixture = `https://microsoftedge.microsoft.com/addons/detail/isees-capture/${fixtureId}`;
assert.deepEqual(resolveCaptureInstallConfiguration(verifiedFixture), { status: "READY", url: verifiedFixture });
for (const unsafe of [
  `http://microsoftedge.microsoft.com/addons/detail/isees-capture/${fixtureId}`,
  `https://example.com/addons/detail/isees-capture/${fixtureId}`,
  "https://microsoftedge.microsoft.com/addons/search/isees",
  "javascript:alert(1)", "data:text/plain,capture", "blob:https://example.com/id", "file:///capture", "https://localhost/capture",
  `${verifiedFixture}?source=isees`, `${verifiedFixture}#install`,
]) assert.equal(resolveCaptureInstallConfiguration(unsafe).status, "PENDING", `unsafe URL activated: ${unsafe}`);

assert.match(info, /<button[^>]*className="capture-info__primary"[^>]*type="button" disabled/);
assert.match(info, /Release pending/);
assert.doesNotMatch(`${globalLink}\n${info}`, /window\.open|chrome\.|browser\.|permissions\.|edge:\/\/extensions/);
assert.doesNotMatch(`${globalLink}\n${info}\n${modeSources.WorkspaceSurface}`, /importSourceCapsule|parseSourceCapsule|activateInvestigation|createEdge/);
assert.match(info, /not verified evidence, Candidate Knowledge, accepted knowledge, or System Canon/);
assert.match(info, /does not monitor browsing/);
assert.match(info, /withdraw that agreement/);
assert.match(info, /Restricted <code>edge:\/\/<\/code>/);
assert.match(info, /pin the Capture icon/);
assert.match(info, /does not perform an import/);

console.log("PASS VerifyIseesCaptureAwareness — one global internal affordance, canonical page ownership, URL safety, mode neutrality, and authority boundaries verified");
