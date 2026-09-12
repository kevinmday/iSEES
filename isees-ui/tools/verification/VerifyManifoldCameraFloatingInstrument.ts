import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";

const root = fileURLToPath(new URL("../../", import.meta.url));
const read = (path: string): string => readFileSync(`${root}${path}`, "utf8");

const camera = read("src/manifold/components/ManifoldCameraInstrument.tsx");
const palette = read("src/manifold/components/ManifoldInstrumentPalette.tsx");
const toolbar = read("src/manifold/components/ManifoldToolbar.tsx");
const graph2D = read("src/manifold/components/InvestigationGraph.tsx");
const graph3D = read("src/manifold/components/InvestigationGraph3D.tsx");

assert.match(
  camera,
  /import ManifoldInstrumentPalette\s+from "\.\/ManifoldInstrumentPalette";/,
  "Camera imports the shared instrument palette",
);
assert.match(
  camera,
  /<ManifoldInstrumentPalette\s+instrumentId="camera"\s+title="Camera"\s+defaultPosition=\{\{\s*x: 166,\s*y: 12,\s*\}\}/,
  "Camera renders the shared palette with canonical identity and default position",
);

const cameraRender = camera.slice(camera.indexOf("export default function"));
assert.doesNotMatch(
  cameraRender,
  /position:\s*"absolute"|\btop:\s*12|\bleft:\s*166|zIndex:\s*100/,
  "Camera has no duplicated absolute outer frame",
);
assert.equal(
  (cameraRender.match(/>\s*Camera\s*</g) ?? []).length,
  0,
  "Camera has no duplicated heading",
);

for (const action of [
  "ZOOM_IN",
  "ZOOM_OUT",
  "PAN_UP",
  "PAN_DOWN",
  "PAN_LEFT",
  "PAN_RIGHT",
  "CENTER",
]) {
  assert.match(camera, new RegExp(`onAction\\(\\s*"${action}"\\s*\\)`), `${action} remains wired`);
}

assert.doesNotMatch(
  camera,
  /onPointer(?:Down|Move|Up|Cancel)|setPointerCapture|releasePointerCapture|pointerId|dragging|dragOffset/,
  "Camera defines no private pointer-drag implementation",
);
assert.match(palette, />\s*⠿\s*</, "shared palette provides the standard six-dot drag handle");
assert.match(palette, /setPointerCapture/, "shared palette owns pointer capture");
assert.match(palette, /clampInstrumentPosition/, "shared palette owns bounds clamping");
assert.match(palette, /localStorage\.setItem/, "shared palette owns position persistence");

assert.match(
  toolbar,
  /instrumentId="computation"\s+title="Computation"\s+defaultPosition=\{\{\s*x: 12,\s*y: 12,\s*\}\}/,
  "Computation registration remains unchanged",
);
assert.match(
  toolbar,
  /instrumentId="projection"\s+title="Projection"\s+defaultPosition=\{\{\s*x: 12,\s*y: 154,\s*\}\}/,
  "Projection registration remains unchanged",
);
assert.match(
  graph2D,
  /projectionMode === "2D"[\s\S]*?<ManifoldCameraInstrument\s+onAction=\{\s*handleCameraAction\s*\}/,
  "2D continues to compose Camera",
);
assert.match(
  graph3D,
  /<ManifoldCameraInstrument\s+onAction=\{\s*handleCameraAction\s*\}/,
  "3D continues to compose Camera",
);

console.log("PASS: MANIFOLD Camera uses the shared floating-instrument contract in 2D and 3D.");
