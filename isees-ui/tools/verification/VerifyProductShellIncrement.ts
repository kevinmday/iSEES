import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import React, { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";

import type { SystemIdentity } from "../../src/system/SystemIdentity.ts";

Object.assign(globalThis, { React });
const { SystemIdentityFooterPresentation } = await import("../../src/system/SystemIdentityFooter.tsx");

const identity: SystemIdentity = {
  schemaVersion: "isees-release-manifest/v1", productId: "isees", productName: "iSEES",
  expandedName: "Integrated Systems Epistemology & Evaluation System", descriptor: "Research environment",
  version: "1.0.0", frontendContract: "isees-web/v1", backendContract: "isees-api/v1",
  releaseChannel: "CANDIDATE", runtimeEnvironment: "HUGGING_FACE",
  sourceRevision: "abc123456789", deploymentRevision: null, builtAt: null,
};

const render = (state: Parameters<typeof SystemIdentityFooterPresentation>[0]["state"]) =>
  renderToStaticMarkup(createElement(SystemIdentityFooterPresentation, { state }));

const ready = render({ status: "READY", identity, compatibility: "COMPATIBLE" });
assert.match(ready, /iSEES v1\.0\.0/);
assert.match(ready, /CANDIDATE/);
assert.match(ready, /HUGGING_FACE/);
assert.match(ready, /Source abc1234/);
assert.doesNotMatch(ready, /undefined|null|Compatibility warning/);

const noOptional = render({ status: "READY", identity: { ...identity, sourceRevision: null }, compatibility: "UNKNOWN" });
assert.doesNotMatch(noOptional, /Source|undefined|null|Compatibility warning/);
assert.match(noOptional, /data-compatibility="UNKNOWN"/);

const incompatible = render({ status: "READY", identity, compatibility: "INCOMPATIBLE" });
assert.match(incompatible, /Compatibility warning/);
const unavailable = render({ status: "UNAVAILABLE", identity: null, compatibility: "UNKNOWN" });
assert.match(unavailable, />iSEES</);
assert.doesNotMatch(unavailable, /v1\.0\.0|LOCAL|undefined|null/);

const layout = readFileSync("src/layout/MainLayout.tsx", "utf8");
const modeCss = readFileSync("src/components/workspace/WorkspaceModeBar.css", "utf8");
const rootCss = readFileSync("src/index.css", "utf8");
const accountCss = readFileSync("src/account/AccountFrontDoor.css", "utf8");
const accountFrontDoor = readFileSync("src/account/AccountFrontDoor.tsx", "utf8");
const footer = readFileSync("src/system/SystemIdentityFooter.tsx", "utf8");

assert.match(layout, /gridTemplateRows: "var\(--header-height\) minmax\(0, 1fr\) var\(--modebar-height\) 28px"/);
assert.equal((layout.match(/<WorkspaceModeBar \/>/g) ?? []).length, 1);
assert.match(layout, /data-guide-id="shell\.workspace-modes"[\s\S]*minHeight: 0/);
assert.doesNotMatch(layout, /VERSION:|v0\.9-operator-shell/);
assert.match(modeCss, /height: var\(--modebar-height\)/);
assert.match(modeCss, /overflow-y: visible/);
assert.match(modeCss, /box-sizing: border-box/);
assert.match(rootCss, /height: 100vh;[\s\S]*height: 100dvh;/);
assert.equal((rootCss.match(/height: 100vh;/g) ?? []).length, 1, "#root is the sole operational viewport-height owner");
assert.equal((rootCss.match(/height: 100dvh;/g) ?? []).length, 1, "#root owns the preferred dynamic viewport height");
assert.match(rootCss, /#root\s*\{[\s\S]*height: 100vh;[\s\S]*height: 100dvh;[\s\S]*min-height: 0;[\s\S]*overflow: hidden;/);
assert.match(accountFrontDoor, /identityState\.identity\?\.kind === "GUEST"[\s\S]*className="guest-session-shell"[\s\S]*<GuestBar[\s\S]*className="guest-session-shell__workspace">\{children\}/, "Guest banner and workspace share one bounded composition");
assert.match(accountFrontDoor, /className="account-authenticated-shell"[\s\S]*<AccountBar[\s\S]*className="account-authenticated-shell__workspace">\{children\}/, "Account chrome and workspace share one bounded composition");
assert.match(accountCss, /\.guest-session-shell\s*\{[^}]*height:100%;[^}]*min-height:0;[^}]*grid-template-rows:auto minmax\(0,1fr\);[^}]*overflow:hidden/);
assert.match(accountCss, /\.guest-session-shell__workspace\s*\{[^}]*min-width:0;[^}]*min-height:0;[^}]*overflow:hidden/);
assert.match(accountCss, /\.account-authenticated-shell\s*\{[^}]*height:100%;[^}]*min-height:0;[^}]*grid-template-rows:auto minmax\(0,1fr\);[^}]*overflow:hidden/);
assert.match(accountCss, /\.account-authenticated-shell__workspace\s*\{[^}]*min-width:0;[^}]*min-height:0;[^}]*overflow:hidden/);
assert.doesNotMatch(accountCss, /\.guest-session-shell\s*\{[^}]*(?:100vh|100dvh)/);
assert.doesNotMatch(accountCss, /\.account-authenticated-shell\s*\{[^}]*(?:100vh|100dvh)/);
assert.match(layout, /height: "100%"/);
assert.doesNotMatch(layout, /100d?vh/);
assert.equal((footer.match(/loadSystemIdentity\(\)/g) ?? []).length, 1, "one cached shell request owner");
assert.match(footer, /shellIdentityRequest \?\?=/, "request remains stable across mode navigation/remounts");
assert.match(footer, /resolveSystemCompatibility\(identity\)/);
assert.match(footer, /sourceRevision\?\.slice\(0, 7\)/);

console.log("PASS VerifyProductShellIncrement");
