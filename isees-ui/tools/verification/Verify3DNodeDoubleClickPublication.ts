import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import vm from "node:vm";
import ts from "typescript";

const productionPath =
  "src/manifold/components/InvestigationGraph3D.tsx";
const source = readFileSync(productionPath, "utf8");

let assertionCount = 0;

function verify(
  condition: unknown,
  message: string,
): asserts condition {
  assertionCount += 1;
  assert.ok(condition, message);
}

function extractNode(
  kind: ts.SyntaxKind,
  name: string,
): string {
  const file = ts.createSourceFile(
    productionPath,
    source,
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
  extractNode(
    ts.SyntaxKind.FirstStatement,
    "NODE_DOUBLE_CLICK_INTERVAL_MS",
  ),
  extractNode(
    ts.SyntaxKind.FunctionDeclaration,
    "recognizeNodeDoubleClick",
  ).replace(/^export /, ""),
  "globalThis.recognizeNodeDoubleClick = recognizeNodeDoubleClick;",
].join("\n");

const javascript = ts.transpileModule(executableSource, {
  compilerOptions: {
    module: ts.ModuleKind.None,
    target: ts.ScriptTarget.ES2022,
  },
}).outputText;

const sandbox: {
  recognizeNodeDoubleClick?: (
    pending: { nodeId: string; timestamp: number } | null,
    nodeId: string,
    timestamp: number,
  ) => {
    collect: boolean;
    pending: { nodeId: string; timestamp: number } | null;
  };
} = {};

vm.runInNewContext(javascript, sandbox);
const recognize = sandbox.recognizeNodeDoubleClick;
verify(typeof recognize === "function", "actual production recognizer is executable");

const first = recognize(null, "NODE-A", 1_000);
verify(first.collect === false, "first click does not collect");
verify(first.pending?.nodeId === "NODE-A", "first click records canonical node identity");
verify(first.pending?.timestamp === 1_000, "first click records callback timestamp");

const second = recognize(first.pending, "NODE-A", 1_350);
verify(second.collect === true, "same node at the 350 ms boundary collects");
verify(second.pending === null, "successful recognition resets pending state");

const afterReset = recognize(second.pending, "NODE-A", 1_400);
verify(afterReset.collect === false, "click after success begins a new sequence");

const different = recognize(first.pending, "NODE-B", 1_100);
verify(different.collect === false, "different node cannot complete the sequence");
verify(different.pending?.nodeId === "NODE-B", "different node begins its own sequence");

const expired = recognize(first.pending, "NODE-A", 1_351);
verify(expired.collect === false, "expired same-node sequence does not collect");
verify(expired.pending?.timestamp === 1_351, "expired click begins a new sequence");

const reverseTime = recognize(first.pending, "NODE-A", 999);
verify(reverseTime.collect === false, "non-monotonic timestamp cannot collect");

const nodeHandler = source.match(
  /onNodeClick=\{\(node, event\) => \{[\s\S]*?\n        \}\}/,
)?.[0];
verify(nodeHandler, "3D NODE click handler exists");
verify(
  nodeHandler.indexOf("setSelection({") <
    nodeHandler.indexOf("recognizeNodeDoubleClick("),
  "single-click selection remains immediate before recognition",
);
verify(
  nodeHandler.includes("projected.id") &&
    nodeHandler.includes("event.timeStamp") &&
    nodeHandler.includes("onCollectNode?.(projected)"),
  "NODE handler recognizes canonical identity and publishes the projected node",
);
verify(!nodeHandler.includes("event.detail"), "NODE handler does not use event.detail");

verify(
  source.includes("useRef<PendingNodeClick | null>(null)") &&
    source.includes("useRef<PendingEdgeClick | null>(null)") &&
    nodeHandler.includes("recognizeNodeDoubleClick(") &&
    nodeHandler.includes("pendingNodeClickRef.current") &&
    !nodeHandler.includes("recognizeEdgeDoubleClick(") &&
    !nodeHandler.includes("pendingEdgeClickRef.current"),
  "NODE and EDGE pending state remains separate and the NODE handler uses only NODE recognition",
);

console.log(
  `PASS Verify3DNodeDoubleClickPublication — ${assertionCount} assertions verified`,
);
