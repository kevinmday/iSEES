import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import { readFileSync } from "node:fs";

const read = (path: string) => readFileSync(path, "utf8");
const layout = read("src/layout/MainLayout.tsx");
const surface = read("src/surfaces/WorkspaceSurface.tsx");
const surfaceCss = read("src/surfaces/WorkspaceSurface.css");
const laboratory = read("src/layers/components/LayersLaboratoryWorkspace.tsx");
const laboratoryCss = read("src/layers/components/LayersLaboratoryWorkspace.css");
const chamber = read("src/layers/components/LayersWireManifoldChamber.tsx");
const compareCss = read("src/compare/components/CompareWorkspace.css");
const sideCss = read("src/layers/components/LayersSideInstruments.css");

assert((layout.match(/minWidth: 0/g) ?? []).length >= 3, "shell, center, and projection host permit flex shrinkage");
assert(surface.includes("minWidth: 0") && surfaceCss.includes("min-width: 0"), "workspace projection boundaries permit shrinkage");
assert(laboratoryCss.includes("width:100%;max-width:100%;min-width:0"), "laboratory root is bounded by its center container");
assert(!laboratoryCss.match(/\.layers-lab\{[^}]*min-width:(?!0)/), "laboratory root has no content-derived minimum width");
assert(laboratoryCss.includes("repeat(auto-fit,minmax(min(145px,100%),1fr))"), "layer rack uses deterministic responsive reflow");
assert(!laboratoryCss.includes("repeat(5,minmax(145px,1fr))"), "Infrastructure is not trapped in a forced five-column row");
assert(chamber.includes('viewBox="0 0 900 300"'), "deterministic SVG viewBox is unchanged");
assert(laboratoryCss.includes(".layers-wire{display:block;width:100%;max-width:100%"), "wire SVG scales to its available container");
assert(laboratoryCss.includes(".layers-lab__inspection-hooks") && laboratoryCss.includes("repeat(auto-fit,minmax(min(150px,100%),1fr))"), "inspection controls wrap responsively");
assert(laboratoryCss.includes("overflow-wrap:anywhere") && laboratoryCss.includes("word-break:break-word"), "header identities and technical IDs wrap safely");
assert(laboratoryCss.includes(".layers-lab__table-wrap{max-width:100%;overflow-x:auto"), "contribution ledger owns bounded horizontal overflow");
assert(laboratoryCss.includes(".layers-lab__canonical pre{max-width:100%") && laboratory.includes("<details>"), "collapsed canonical representation owns bounded wrapping and overflow");
assert(surfaceCss.includes("padding-bottom: var(--layers-inbox-collapsed-clearance)"), "collapsed Inbox reserves bottom clearance only");
assert(surfaceCss.includes("padding-right: var(--layers-inbox-expanded-clearance)") && !surfaceCss.includes("min-width: calc(760px"), "expanded Inbox has explicit side reservation without widening LAYERS");
assert(!surfaceCss.includes("overflow-x: hidden") && !laboratoryCss.includes("overflow-x:hidden"), "no global horizontal overflow mask hides content");
assert(surface.includes("activeMode === WorkspaceMode.MANIFOLD &&"), "MANIFOLD reservation remains intact");
assert(compareCss.includes(".compare-workspace") && !surfaceCss.includes("--compare"), "COMPARE layout remains intact and unmodified by LAYERS clearance");
assert(laboratoryCss.includes(":focus-visible") && laboratoryCss.includes("prefers-reduced-motion:reduce") && sideCss.includes("prefers-reduced-motion:reduce"), "focus-visible and reduced-motion contracts remain present");

const changed = execFileSync("git", ["diff", "--name-only"], { encoding: "utf8" }).trim().split(/\r?\n/).filter(Boolean);
const forbidden = changed.filter(path => /^src\/layers\/(runtime|projection|research|persistence)\//i.test(path));
assert.deepEqual(forbidden, [], `presentation change must not touch runtime, projection, Research, or persistence files: ${forbidden.join(", ")}`);
for (const path of ["src/manifold/layers/systemCanonLayers.ts", "src/resolve/engine/ResolveEngine.ts"]) assert(!changed.some(item => item.endsWith(path)), `${path} canonical semantics are unchanged`);

console.log("PASS VerifyLayersResponsiveWorkspace");
