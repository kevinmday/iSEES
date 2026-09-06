import { existsSync, readFileSync } from "node:fs";
import ts from "typescript";

const componentPath = new URL("../../src/identity/components/OperatorEntryScreen.tsx", import.meta.url);
const cssPath = new URL("../../src/identity/components/OperatorEntryScreen.css", import.meta.url);
const assetPath = new URL("../../public/images/isees-earth-stars-landing.png", import.meta.url);
const source = readFileSync(componentPath, "utf8");
const css = readFileSync(cssPath, "utf8");
const file = ts.createSourceFile("OperatorEntryScreen.tsx", source, ts.ScriptTarget.ESNext, true, ts.ScriptKind.TSX);

let passes = 0;
function assert(value: unknown, message: string): asserts value { if (!value) throw new Error(`VERIFY FAILED: ${message}`); }
function pass(message: string) { console.log(`PASS ${++passes} — ${message}`); }
function walk(node: ts.Node, predicate: (candidate: ts.Node) => boolean): ts.Node[] {
  const matches: ts.Node[] = [];
  const visit = (candidate: ts.Node) => { if (predicate(candidate)) matches.push(candidate); ts.forEachChild(candidate, visit); };
  visit(node);
  return matches;
}
function opening(node: ts.Node): ts.JsxOpeningLikeElement | undefined {
  return ts.isJsxElement(node) ? node.openingElement : ts.isJsxSelfClosingElement(node) ? node : undefined;
}
function attr(element: ts.JsxOpeningLikeElement, name: string): ts.JsxAttribute | undefined {
  return element.attributes.properties.find(item => ts.isJsxAttribute(item) && item.name.getText(file) === name) as ts.JsxAttribute | undefined;
}
function text(node: ts.Node): string { return node.getText(file).replace(/<[^>]+>/g, " ").replace(/[{}]/g, " ").replace(/\s+/g, " ").trim(); }

const imports = file.statements.filter(ts.isImportDeclaration).map(node => node.moduleSpecifier.getText(file));
assert(imports.length === 2 && imports.includes('"./OperatorEntryScreen.css"') && imports.includes('"../runtime/OperatorIdentityRuntimeContext"'), "component import boundary changed");
pass("production component imports only its CSS and existing identity runtime");

assert(existsSync(assetPath), "installed landing asset is missing");
assert(readFileSync(assetPath).subarray(0, 8).toString("hex") === "89504e470d0a1a0a", "landing asset is not a valid PNG");
assert(css.includes('url("/images/isees-earth-stars-landing.png")') && /\/ cover no-repeat/.test(css), "local background is not a viewport-cover image");
assert(!/data:image|base64/i.test(source + css) && !/url\(\s*["']?https?:\/\//i.test(css), "embedded or remote image detected");
pass("the valid local PNG is the non-stretched viewport background");

assert(!/isees-entry__(artwork|earth|moon|stars)/.test(source + css), "obsolete celestial structure remains");
assert(!/(radial-gradient|border-radius:\s*50%)/i.test(css), "CSS-generated celestial primitives remain");
assert(!/\.isees-entry::(before|after)/.test(css), "full-scene overlay pseudo-element introduced");
pass("Earth, Moon, and stars have no synthetic CSS or markup representation");

const visibleText = text(file);
for (const phrase of ["iSEES-UAP", "EMERGENCE DETECTION SYSTEM", "SEE THE RELATIONSHIPS OTHERS MISS.", "deterministic UAP research environment", "source-grounded evidence", "human-directed investigations"]) {
  assert(visibleText.includes(phrase), `required UAP identity absent: ${phrase}`);
}
assert(!/government|endorsed|scientific truth|AI-generated|integrated repositories/i.test(visibleText), "unsupported affiliation or capability claim present");
pass("production copy explicitly and accurately identifies UAP research purpose");

const guestCalls = walk(file, node => ts.isCallExpression(node) && node.expression.getText(file) === "runtime.continueAsGuest");
const handler = walk(file, node => ts.isFunctionDeclaration(node) && node.name?.text === "handleContinueAsGuest")[0];
assert(guestCalls.length === 1 && handler && guestCalls[0].pos >= handler.pos && guestCalls[0].end <= handler.end, "Guest runtime behavior changed");
pass("Guest entry remains the existing runtime call");

const buttons = walk(file, node => opening(node)?.tagName.getText(file) === "button").map(node => ({ node, element: opening(node)! }));
const enabled = buttons.filter(item => !attr(item.element, "disabled"));
assert(buttons.length === 3 && enabled.length === 1 && text(enabled[0].node).includes("Continue as Guest") && attr(enabled[0].element, "onClick"), "Guest is not the sole live action");
assert(buttons.every(item => attr(item.element, "type")?.initializer?.getText(file) === '"button"'), "access control lost semantic button type");
pass("Guest is the sole live semantic button");

for (const label of ["Log In", "Create Account"]) {
  const item = buttons.find(candidate => text(candidate.node).includes(label));
  assert(item && attr(item.element, "disabled"), `${label} is not natively disabled`);
  assert(!["onClick", "href", "formAction", "onSubmit"].some(name => attr(item.element, name)), `${label} falsely became operational`);
  const id = attr(item.element, "aria-describedby")?.initializer?.getText(file).replace(/"/g, "");
  assert(id && source.includes(`id="${id}"`), `${label} planned explanation is unassociated`);
}
assert((visibleText.match(/Planned/g) ?? []).length === 2, "account paths are not visibly planned");
pass("Log In and Create Account remain disabled, explained, and non-operational");

assert(visibleText.includes("complete research application") && visibleText.includes("current browser session"), "Guest promise incomplete");
assert(visibleText.includes("same research capabilities") && visibleText.includes("persistence and ownership are the distinction"), "access parity absent");
pass("Guest retains complete capability and browser-session retention");

assert(!/from\s+["'][^"']*(workspace|router|routing|persistence|storage|shell|overview|studio|mode)/i.test(source), "unrelated ownership imported");
assert(!/\b(fetch|XMLHttpRequest|localStorage|sessionStorage|navigate|location\.|history\.|createWorkspace|createOperator)\b/.test(source), "routing, identity, persistence, or network ownership introduced");
assert(!/<(a|form|input|canvas|video)\b/i.test(source), "unexpected operational or visualization element introduced");
pass("no routing, identity, persistence, shell, or application-mode ownership was introduced");

assert(/overflow-y:\s*auto\s*!important/.test(css) && /width:\s*clamp\(32rem,\s*40vw,\s*45rem\)/.test(css), "viewport or desktop panel contract absent");
assert(/@media\s*\(max-width:\s*620px\)/.test(css), "mobile layout absent");
assert(/@media\s*\(prefers-reduced-motion:\s*reduce\)/.test(css) && /transition:\s*none/.test(css), "reduced-motion protection absent");
assert(/:focus-visible/.test(css) && /outline:\s*3px/.test(css), "strong focus treatment absent");
pass("viewport, panel, responsive, focus, and reduced-motion invariants hold");

console.log(`\nAll ${passes} landing presentation boundary invariants passed.`);
