import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const read = (path: string) => readFileSync(path, "utf8");
const layout = read("src/layout/MainLayout.tsx");
const surface = read("src/surfaces/WorkspaceSurface.tsx");
const shell = read("src/author/components/StudioShell.tsx");
const shellCss = read("src/author/components/StudioShell.css");
const inboxCss = read("src/studio/components/StudioResearchInbox.css");
const inspectorCss = read("src/studio/components/StudioArtifactInspector.css");
const toolbar = read("src/author/components/StudioToolbar.tsx");
const api = read("src/studio/api/StudioApi.ts");

assert.match(layout, /studioMode\s*=\s*workspaceMode === WorkspaceMode\.RESEARCH/);
assert.match(layout, /!studioMode && !workspaceExpanded && leftPanelCollapsed/);
assert.match(layout, /!studioMode && <div[\s\S]*?LEFT PANEL COLLAPSE CONTROL/);
assert.match(layout, /!studioMode && !workspaceExpanded && rightPanelCollapsed/);
assert.match(layout, /!studioMode && <aside[\s\S]*?selection-intelligence/);
assert.match(layout, /padding: studioMode \? "0" : "16px"/);
assert.ok(layout.includes("<WorkspaceModeBar />") && layout.includes("<ManifoldProjectionStatus />"), "mode bar and footer remain global");
assert.ok(surface.includes("<WorkspaceIdentityHeader />"), "workspace identity and focused context remain global");

assert.equal((shell.match(/<StudioResearchInbox/g) ?? []).length, 1);
assert.equal((shell.match(/<StudioArtifactInspector/g) ?? []).length, 1);
assert.match(shell, /if \(!investigation\)[\s\S]*No active Investigation[\s\S]*Return to OVERVIEW[\s\S]*setActiveMode\(WorkspaceMode\.OVERVIEW\)/);
assert.doesNotMatch(shell, /Case Intake|Investigation Library|importInvestigation/);
assert.doesNotMatch(surface.match(/const researchInboxVisible\s*=[\s\S]*?;/)?.[0] ?? "", /WorkspaceMode\.RESEARCH/);

assert.match(shellCss, /grid-template-columns:\s*clamp\(300px,[^;]*340px\) minmax\(0, 1fr\) clamp\(320px,[^;]*380px\)/);
assert.match(shellCss, /\.studio-shell__workspace[^}]*overflow:\s*hidden/);
assert.match(shellCss, /@media \(max-width: 1180px\)[\s\S]*overflow-x:\s*auto/);
assert.match(inboxCss, /\.studio-research-inbox[^}]*overflow:\s*hidden/);
assert.match(inboxCss, /\.studio-research-inbox__list[^}]*overflow:\s*auto/);
assert.match(inspectorCss, /\.studio-inspector[^}]*overflow-y:\s*auto/);
assert.match(inspectorCss, /nth-of-type\(4\) \{ order:3/);
assert.match(inspectorCss, /nth-of-type\(2\) \{ order:4/);
assert.match(toolbar, /flexWrap:\s*"wrap"/);
assert.match(api, /VITE_STUDIO_API_BASE_URL[\s\S]*VITE_API_BASE_URL[\s\S]*http:\/\/127\.0\.0\.1:8000/);

console.log("PASS VerifyStudioShellOwnership — STUDIO exclusively owns its three-column workspace, blocks without an Investigation, preserves global framing, scrolls intentionally, and defaults to API port 8000");
