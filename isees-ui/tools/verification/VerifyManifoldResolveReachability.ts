import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";

const root = fileURLToPath(new URL("../../", import.meta.url));
const read = (path: string): string => readFileSync(`${root}${path}`, "utf8");
const command = read("src/resolve/runtime/useResolveExecutionCommand.ts");
const runtime = read("src/resolve/runtime/ResolveRuntime.ts");
const navigator = read("src/investigationControl/ComputePanel.tsx");
const toolbar = read("src/manifold/components/ManifoldToolbar.tsx");
const primary = read("src/manifold/components/PrimaryInvestigationManifold.tsx");
const palette = read("src/manifold/components/ManifoldInstrumentPalette.tsx");
const layers = read("src/layers/components/LayersLaboratoryWorkspace.tsx");
const guide = read("src/guide/registry/LayersGuideDefinitions.ts");
const presentation = read("src/guide/presentation/GuidePresentationContext.tsx");

assert.match(runtime, /execute\(\s*input:\s*ResolveComputationInput/);
assert.equal((command.match(/resolveRuntime\.execute\(/g) ?? []).length, 1, "shared command has one canonical runtime call");
assert.equal(primary.includes("resolveRuntime.execute("), false, "legacy orchestration was removed from PrimaryInvestigationManifold");
assert.ok(navigator.includes("useResolveExecutionCommand()") && toolbar.includes("useResolveExecutionCommand()"), "both controls use the shared command");

assert.match(navigator, /data-guide-id="manifold\.resolve\.execute"/);
assert.match(navigator, />\s*RESOLVE\s*<\/button>/);
assert.match(navigator, /disabled=\{resolveCommand\.disabled\}/);
assert.match(command, /activeInvestigation === undefined \|\| executing/);
assert.match(command, /ResolveRuntimeStatus\.EXECUTING/);
assert.match(command, /no active investigation/);
assert.equal(/activeLayers\.length|minimum.*layer|at least one.*layer/i.test(command), false, "no minimum layer gate is invented");

assert.match(toolbar, /onAction=\{\(\) => resolveCommand\.execute\(\)\}/);
assert.match(toolbar, /disabled=\{resolveCommand\.disabled\}/);
assert.equal((`${navigator}\n${toolbar}`.match(/data-guide-id="manifold\.resolve\.execute"/g) ?? []).length, 1, "execution semantic ID is unique");

assert.match(layers, />Open MANIFOLD<\/button>/);
assert.match(layers, /setActiveMode\(WorkspaceMode\.MANIFOLD\)/);
assert.equal(layers.includes("resolveRuntime.execute(") || /\buseResolveRuntime\s*[,}]/.test(layers), false, "LAYERS navigation does not import or invoke the executable ResolveRuntime API");
assert.match(guide, /prerequisite navigation; this does not execute Resolve/);
assert.match(guide, /Open MANIFOLD to run Resolve/);
assert.match(guide, /Opening MANIFOLD does not run Resolve/);

assert.match(palette, /clampInstrumentPosition/);
assert.match(palette, /useLayoutEffect/);
assert.match(palette, /new ResizeObserver\(contain\)/);
assert.match(palette, /observer\.observe\(viewport\)/);
assert.match(palette, /if \(next\.x === current\.x && next\.y === current\.y\) return current/);
assert.equal(/localStorage\.clear|removeItem\(/.test(palette), false, "instrument preferences are not broadly cleared");

assert.equal(guide.includes('"Run Resolve", LayersGuideTargetIds.RUN_RESOLVE'), false, "Guide does not label navigation as execution");
assert.equal(/useEffect[\s\S]{0,300}(execute\(|setActiveMode)/.test(`${presentation}\n${command}`), false, "no automatic Guide or Resolve action exists");

console.log("VerifyManifoldResolveReachability: PASS (shared execution, truthful navigation, unique target, and viewport containment verified)");
