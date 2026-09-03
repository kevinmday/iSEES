import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import { readFileSync } from "node:fs";
import vm from "node:vm";
import ts from "typescript";

const productionPath =
  "src/manifold/components/InvestigationGraph3D.tsx";
const source = readFileSync(productionPath, "utf8");
const baseline = execFileSync(
  "git",
  ["show", `HEAD:isees-ui/${productionPath}`],
  { encoding: "utf8" },
);

let assertionCount = 0;

function verify(
  condition: unknown,
  message: string,
): asserts condition {
  assertionCount += 1;
  assert.ok(condition, message);
}

function extractNodeFrom(
  input: string,
  kind: ts.SyntaxKind,
  name: string,
): string {
  const file = ts.createSourceFile(
    productionPath,
    input,
    ts.ScriptTarget.Latest,
    true,
    ts.ScriptKind.TSX,
  );
  const node = file.statements.find(statement => {
    if (statement.kind !== kind) return false;
    if (ts.isFunctionDeclaration(statement)) {
      return statement.name?.text === name;
    }
    if (ts.isVariableStatement(statement)) {
      return statement.declarationList.declarations.some(
        declaration =>
          ts.isIdentifier(declaration.name) &&
          declaration.name.text === name,
      );
    }
    return false;
  });

  assert.ok(node, `production declaration ${name} exists`);
  return node.getText(file);
}

const executableSource = [
  extractNodeFrom(
    source,
    ts.SyntaxKind.FirstStatement,
    "EDGE_DOUBLE_CLICK_INTERVAL_MS",
  ),
  extractNodeFrom(
    source,
    ts.SyntaxKind.FunctionDeclaration,
    "recognizeEdgeDoubleClick",
  ).replace(/^export /, ""),
  "globalThis.recognizeEdgeDoubleClick = recognizeEdgeDoubleClick;",
].join("\n");

const javascript = ts.transpileModule(executableSource, {
  compilerOptions: {
    module: ts.ModuleKind.None,
    target: ts.ScriptTarget.ES2022,
  },
}).outputText;

const sandbox: {
  recognizeEdgeDoubleClick?: (
    pending: { edgeId: string; timestamp: number } | null,
    edgeId: string,
    timestamp: number,
  ) => {
    collect: boolean;
    pending: { edgeId: string; timestamp: number } | null;
  };
} = {};

vm.runInNewContext(javascript, sandbox);
const recognize = sandbox.recognizeEdgeDoubleClick;
verify(typeof recognize === "function", "actual production EDGE recognizer is executable");

const first = recognize(null, "EDGE-A", 1_000);
verify(first.collect === false, "first click does not collect");
verify(first.pending?.edgeId === "EDGE-A", "first click records canonical edge identity");
verify(first.pending?.timestamp === 1_000, "first click records callback timestamp");

const second = recognize(first.pending, "EDGE-A", 1_350);
verify(second.collect === true, "same edge at the 350 ms boundary collects exactly once");
verify(second.pending === null, "successful recognition resets pending EDGE state");

const afterReset = recognize(second.pending, "EDGE-A", 1_400);
verify(afterReset.collect === false, "click after success begins a new EDGE sequence");

const different = recognize(first.pending, "EDGE-B", 1_100);
verify(different.collect === false, "different edge IDs cannot complete a sequence");
verify(different.pending?.edgeId === "EDGE-B", "different edge begins a new sequence");

const expired = recognize(first.pending, "EDGE-A", 1_351);
verify(expired.collect === false, "expired same-edge sequence does not collect");
verify(expired.pending?.timestamp === 1_351, "expired click begins a new sequence");

const reverseTime = recognize(first.pending, "EDGE-A", 999);
verify(reverseTime.collect === false, "non-monotonic timestamp does not collect");
verify(reverseTime.pending?.timestamp === 999, "non-monotonic click begins a new sequence");

const edgePattern =
  /onLinkClick=\{\(link, event\) => \{[\s\S]*?\n        \}\}/;
const edgeHandler = source
  .replaceAll("\r\n", "\n")
  .match(edgePattern)?.[0];
verify(edgeHandler, "3D EDGE click handler exists");
verify(
  edgeHandler.indexOf("setSelection({") <
    edgeHandler.indexOf("recognizeEdgeDoubleClick("),
  "immediate EDGE selection remains before recognition and publication",
);
verify(!edgeHandler.includes("event.detail"), "EDGE handler does not use event.detail");
verify(
  edgeHandler.includes("projected.id") &&
    edgeHandler.includes("event.timeStamp") &&
    edgeHandler.includes("onCollectEdge?.(projected)"),
  "EDGE handler recognizes canonical identity and publishes the unchanged projected edge",
);

const nodeHandlerPattern =
  /onNodeClick=\{\(node, event\) => \{[\s\S]*?\n        \}\}/;
const currentNodeHandler = source
  .replaceAll("\r\n", "\n")
  .match(nodeHandlerPattern)?.[0];
const baselineNodeHandler = baseline
  .replaceAll("\r\n", "\n")
  .match(nodeHandlerPattern)?.[0];
verify(
  currentNodeHandler !== undefined &&
    currentNodeHandler === baselineNodeHandler,
  "3D NODE handler is byte-identical to HEAD",
);
verify(
  extractNodeFrom(source, ts.SyntaxKind.FunctionDeclaration, "recognizeNodeDoubleClick") ===
    extractNodeFrom(baseline, ts.SyntaxKind.FunctionDeclaration, "recognizeNodeDoubleClick"),
  "NODE recognizer is byte-identical to HEAD",
);
verify(
  source.includes("useRef<PendingNodeClick | null>(null)") &&
    source.includes("useRef<PendingEdgeClick | null>(null)") &&
    !source.includes("PendingNodeOrEdgeClick"),
  "NODE and EDGE recognition use separate component-local state",
);

console.log(
  `PASS Verify3DEdgeDoubleClickPublication — ${assertionCount} assertions verified`,
);
