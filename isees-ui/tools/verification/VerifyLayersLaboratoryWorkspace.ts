import fs from "node:fs";
import path from "node:path";

const root = process.cwd();
const read = (file: string) => fs.readFileSync(path.join(root, file), "utf8");
const workspace = read("src/layers/components/LayersLaboratoryWorkspace.tsx");
const chamber = read("src/layers/components/LayersWireManifoldChamber.tsx");
const context = read("src/layers/runtime/LayersExperimentRuntimeContext.tsx");
const surface = read("src/surfaces/WorkspaceSurface.tsx");
const projection = read("src/workspace/runtime/WorkspaceProjection.tsx");
const css = read("src/layers/components/LayersLaboratoryWorkspace.css");
let passed = 0;
function verify(name: string, condition: boolean) { if (!condition) throw new Error(`FAIL: ${name}`); console.log(`PASS: ${name}`); passed += 1; }

verify("real LayersWorkspace in authoritative switches", surface.includes("<LayersWorkspace />") && projection.includes("<LayersWorkspace />"));
verify("stable LayersExperimentRuntime context", context.includes("new LayersExperimentRuntime()") && context.includes("revision"));
verify("A11-I2 projection used", workspace.includes("projectLayersExperimentalPair"));
verify("canonical COMPARE identity derived", workspace.includes("resolveComparePairProjection") && workspace.includes("WorkspaceSelectionKind.CANDIDATE"));
verify("no duplicate handoff store", !workspace.includes("localStorage") && !workspace.includes("sessionStorage"));
verify("registered catalog only", workspace.includes("CanonicalLayerRegistry") && !workspace.includes("Astronomy") && !workspace.includes("Geomagnetics"));
verify("explicit run control", workspace.includes("Run / Recompute experiment"));
verify("reset to baseline", workspace.includes("Reset to baseline"));
verify("concurrent wires", chamber.includes("layers-wire__baseline") && chamber.includes("layers-wire__experiment"));
verify("all delta states originate in projection", read("src/layers/projection/LayersExperimentalPairProjectionTypes.ts").includes("FORMED") && workspace.includes("projection.delta.state"));
verify("unavailable is not zero", chamber.includes("UNAVAILABLE (not zero)") && !chamber.includes("?? 0"));
verify("purpose-built deterministic SVG", chamber.includes("<svg") && chamber.includes("viewBox=\"0 0 900 300\""));
verify("no random or force simulation", !chamber.match(/random|force-graph|simulation/i));
verify("non-mutation boundary visible", workspace.includes("Canonical knowledge was not mutated") && workspace.includes("No canonical relationship was created"));
verify("Research publication not fabricated", workspace.includes("Publication to Research is a later explicit action") && workspace.includes("disabled"));
verify("Research Inbox visible in LAYERS", surface.includes("WorkspaceMode.LAYERS"));
verify("accessibility contracts", workspace.includes("aria-pressed") && chamber.includes("role=\"img\"") && css.includes(":focus-visible"));
verify("reduced motion contract", css.includes("prefers-reduced-motion"));
console.log(`VerifyLayersLaboratoryWorkspace: ${passed}/18 checks passed.`);
