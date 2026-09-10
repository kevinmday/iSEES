import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";

const root = fileURLToPath(new URL("../../", import.meta.url));
const read = (path: string): string => readFileSync(`${root}${path}`, "utf8");
const layout = read("src/layout/MainLayout.tsx");
const context = read("src/guide/presentation/GuidePresentationContext.tsx");
const host = read("src/guide/components/IseesGuideHost.tsx");
const affordance = read("src/guide/components/IseesGuideAffordance.tsx");
const panel = read("src/guide/components/IseesGuidePanel.tsx");
const css = read("src/guide/components/IseesGuide.css");
const registry = read("src/guide/registry/LayersGuideDefinitions.ts");
const guideSource = [context, host, affordance, panel, css].join("\n");
const modeTypes = read("src/workspace/runtime/WorkspaceRuntimeTypes.ts");
const modeBar = read("src/components/workspace/WorkspaceModeBar.tsx");

const occurrences = (source: string, token: string): number => source.split(token).length - 1;
assert.equal(occurrences(layout, "<IseesGuideHost />"), 1, "MainLayout must contain exactly one Guide host");
assert.equal(occurrences(host, "<IseesGuideAffordance />"), 1, "Guide host must contain exactly one affordance");
const capturePosition = layout.indexOf("<IseesCaptureGlobalLink />");
const guidePosition = layout.indexOf("<IseesGuideHost />");
const briefingPosition = layout.indexOf('to="/briefing"');
assert.ok(capturePosition < guidePosition && guidePosition < briefingPosition, "GUIDE must follow Capture and precede System Briefing");
assert.ok(layout.includes("<IseesCaptureGlobalLink />"), "Capture must remain present");
assert.equal(modeTypes.includes("GUIDE"), false, "Guide must not be a WorkspaceMode");
assert.equal(modeBar.includes("IseesGuide"), false, "Guide must not appear in the bottom mode bar");

assert.match(context, /useState<GuideShellPresentation>\(GuideShellPresentation\.CLOSED\)/, "initial state must be CLOSED");
assert.equal(/useEffect[\s\S]{0,300}setPresentation\(GuideShellPresentation\.OPEN\)/.test(context), false, "no effect may open Guide automatically");
assert.match(affordance, /<button[\s\S]*?type="button"/, "affordance must be a native button");
assert.match(affordance, /aria-label="Open iSEES Guide"/);
assert.match(affordance, /aria-expanded=\{isOpen\}/);
assert.match(affordance, /aria-controls=\{GUIDE_PANEL_ID\}/);
assert.match(context, /GUIDE_PANEL_ID = "isees-guide-panel"/);
assert.match(panel, /role="complementary"/);
assert.match(panel, /aria-labelledby=\{GUIDE_PANEL_HEADING_ID\}/);
assert.match(panel, /<h2[\s\S]*?>iSEES Guide<\/h2>/);
assert.match(panel, /aria-label="Close Guide"/);
assert.match(panel, /event\.key !== "Escape"/);
assert.match(context, /affordanceElement\?\.focus\(\)/, "closing must restore affordance focus");
assert.match(affordance, /ref=\{registerAffordance\}/, "affordance must register the focus-restoration target");
assert.equal(panel.includes('role="dialog"'), false, "normal Guide must not be a dialog");
assert.equal(panel.includes("aria-modal"), false, "normal Guide must not be modal");
assert.equal(css.includes("backdrop"), false, "normal Guide must not have a backdrop");
assert.match(css, /overflow-y:\s*auto/);
assert.match(css, /@media \(max-width: 760px\)[\s\S]*top:\s*auto[\s\S]*bottom:\s*8px[\s\S]*max-height:/, "narrow layout must be a contained bottom sheet");
assert.match(css, /@media \(prefers-reduced-motion: reduce\)/);
assert.match(css, /--isees-guide-layer:\s*1200/);
assert.equal(css.includes("9999"), false);

for (const forbidden of ["localStorage", "sessionStorage", "document.cookie", "fetch(", "axios", "backend", "WorkspaceRuntime", "setActiveMode", "activateInvestigation", "setSelection", "comparison", "experiment", "ResearchInbox", "navigate(", "useNavigate", "useLocation"]) {
  assert.equal(guideSource.includes(forbidden), false, `Guide presentation contains forbidden dependency or behavior: ${forbidden}`);
}
assert.equal(/\bpublish[A-Z]\w*\s*\(/.test(guideSource), false, "Guide presentation must not invoke publication mutation");
const importedModules = [...guideSource.matchAll(/from\s+["']([^"']+)["']/g)].map(match => match[1]);
assert.equal(importedModules.some(moduleName => /workspace|investigation|resolve|layers|research|federation|api/i.test(moduleName)), false, "Guide presentation imports a mode or service dependency");
assert.ok(panel.includes("Guide is advisory. It does not select controls, run computations, publish research, or modify System Canon."));
for (const heading of ["Where you are", "Current situation", "Why it matters", "Recommended next action", "Alternatives", "What will happen", "Protected boundaries", "Blockers"]) {
  assert.ok(panel.includes(heading), `operational briefing includes ${heading}`);
}
assert.ok(panel.includes("Show Me"), "contextual visual target control is available when defined");
assert.ok(registry.includes("Detailed contextual guidance for this mode has not yet been integrated."), "non-LAYERS fallback remains honest");
assert.ok(registry.includes("Opening MANIFOLD does not run Resolve."), "LAYERS guidance distinguishes navigation from execution");
assert.equal(panel.includes("Context briefing becomes available in the next Guide integration slice."), false, "retired I2 placeholder is absent");

const authorizedIntegrationFiles = [
  "src/layout/MainLayout.tsx",
  "src/guide/components/IseesGuideAffordance.tsx",
  "src/guide/components/IseesGuidePanel.tsx",
  "src/guide/components/IseesGuideHost.tsx",
  "src/guide/components/IseesGuide.css",
  "src/guide/presentation/GuidePresentationContext.tsx",
  "tools/verification/VerifyIseesGuidePresentation.ts",
];
assert.equal(new Set(authorizedIntegrationFiles).size, 7, "presentation integration paths remain unique");

console.log("VerifyIseesGuidePresentation: PASS (placement, accessibility, isolation, responsive containment, and presentation boundaries verified)");
