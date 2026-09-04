import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { existsSync, readFileSync } from "node:fs";
import { registerHooks } from "node:module";
import { extname, resolve } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

const verifierFlag = "--run-verifier";

function installTypeScriptResolutionCompatibility(): void {
  registerHooks({
    resolve(specifier, context, nextResolve) {
      if (
        (specifier.startsWith("./") || specifier.startsWith("../")) &&
        context.parentURL?.startsWith("file:")
      ) {
        const unresolved = fileURLToPath(new URL(specifier, context.parentURL));
        if (extname(unresolved) === "") {
          for (const suffix of [".ts", ".tsx", "/index.ts", "/index.tsx"]) {
            if (existsSync(`${unresolved}${suffix}`)) {
              return nextResolve(`${specifier}${suffix}`, context);
            }
          }
        }
      }

      return nextResolve(specifier, context);
    },
  });
}

installTypeScriptResolutionCompatibility();

if (process.argv[2] === verifierFlag) {
  const verifierPath = process.argv[3];
  assert.ok(verifierPath, "child verifier path is required");
  await import(pathToFileURL(resolve(verifierPath)).href);
} else {
  const verifiers = [
    {
      subsystem: "operational revision",
      filename: "VerifyOperationalGraphRevision.ts",
    },
    {
      subsystem: "investigation and selection coherence",
      filename: "VerifyFreshInvestigationIsolation.ts",
    },
    {
      subsystem: "selection intelligence",
      filename: "VerifyCanonicalSelectionIntelligence.ts",
    },
    {
      subsystem: "3D NODE Research publication",
      filename: "Verify3DNodeDoubleClickPublication.ts",
    },
    {
      subsystem: "3D EDGE Research publication",
      filename: "Verify3DEdgeDoubleClickPublication.ts",
    },
    {
      subsystem: "Research publication and idempotence",
      filename: "VerifyAcceptanceResearchPresentation.ts",
    },
    {
      subsystem: "workspace MODE availability",
      filename: "VerifyCanonicalModeAvailability.ts",
    },
  ] as const;

  for (const verifier of verifiers) {
    const verifierPath = resolve("tools", "verification", verifier.filename);
    console.log(`\nMANIFOLD GATE [${verifier.subsystem}] — ${verifier.filename}`);

    const result = spawnSync(
      process.execPath,
      [
        "--experimental-strip-types",
        fileURLToPath(import.meta.url),
        verifierFlag,
        verifierPath,
      ],
      { stdio: "inherit" },
    );

    const exitCode = result.status ?? -1;
    if (exitCode !== 0) {
      console.error(
        `MANIFOLD GATE FAILED [${verifier.subsystem}] — ${verifier.filename} — child exit code ${exitCode}`,
      );
      process.exit(exitCode === -1 ? 1 : exitCode);
    }
  }

  const graphNodes = readFileSync(
    "src/manifold/components/GraphNodes.tsx",
    "utf8",
  );
  const graphEdges = readFileSync(
    "src/manifold/components/GraphEdges.tsx",
    "utf8",
  );
  const graphHost = readFileSync(
    "src/manifold/components/InvestigationGraph.tsx",
    "utf8",
  );
  const graph3D = readFileSync(
    "src/manifold/components/InvestigationGraph3D.tsx",
    "utf8",
  );
  const toolbar = readFileSync(
    "src/manifold/components/ManifoldToolbar.tsx",
    "utf8",
  );
  const rightPanel = readFileSync("src/components/RightPanel.tsx", "utf8");

  let seamAssertions = 0;
  function sourceContract(condition: unknown, description: string): void {
    seamAssertions += 1;
    assert.ok(condition, `SOURCE-CONTRACT FAILED: ${description}`);
    console.log(`PASS SOURCE-CONTRACT ${seamAssertions} — ${description}`);
  }

  sourceContract(
    /onClick=\{\(\) => \{[\s\S]*?setSelection\(\{[\s\S]*?kind:\s*"NODE"[\s\S]*?nodeId:\s*node\.id/.test(
      graphNodes,
    ),
    "2D NODE single-click publishes the canonical NODE selection",
  );
  sourceContract(
    /onDoubleClick=\{\(\) => \{[\s\S]*?onCollectNode\?\.\([\s\S]*?node[\s\S]*?\)/.test(
      graphNodes,
    ),
    "2D NODE double-click delivers the unchanged node to collection",
  );
  sourceContract(
    /onClick=\{\(\) =>[\s\S]*?setSelection\(\{[\s\S]*?kind:\s*"EDGE"[\s\S]*?edgeId:\s*edge\.id/.test(
      graphEdges,
    ),
    "2D EDGE single-click publishes the canonical EDGE selection",
  );
  sourceContract(
    /onDoubleClick=\{\(\) =>[\s\S]*?onCollectEdge\?\.\([\s\S]*?edge[\s\S]*?\)/.test(
      graphEdges,
    ),
    "2D EDGE double-click delivers the unchanged edge to collection",
  );

  const graphNodesHost = graphHost.match(/<GraphNodes\b[\s\S]*?\/>/)?.[0] ?? "";
  const graphEdgesHost = graphHost.match(/<GraphEdges\b[\s\S]*?\/>/)?.[0] ?? "";
  const graph3DHost = graphHost.match(/<InvestigationGraph3D\b[\s\S]*?\/>/)?.[0] ?? "";
  sourceContract(
    graphNodesHost.includes("onCollectNode={") &&
      graphNodesHost.includes("handleCollectNode"),
    "host delivers the NODE collection callback to the 2D projection",
  );
  sourceContract(
    graphEdgesHost.includes("onCollectEdge={") &&
      graphEdgesHost.includes("handleCollectEdge"),
    "host delivers the EDGE collection callback to the 2D projection",
  );
  sourceContract(
    graph3DHost.includes("onCollectNode={handleCollectNode}") &&
      graph3DHost.includes("onCollectEdge={handleCollectEdge}"),
    "host delivers independent NODE and EDGE collection callbacks to the 3D projection",
  );
  sourceContract(
    graphHost.includes(".getActiveInvestigation()") &&
      /function handleCollectNode\([\s\S]*?if \(!activeInvestigation\)[\s\S]*?investigationId:\s*activeInvestigation\.id/.test(graphHost) &&
      /function handleCollectEdge\([\s\S]*?if \(!activeInvestigation\)[\s\S]*?investigationId:\s*activeInvestigation\.id/.test(graphHost),
    "NODE and EDGE publication fail closed and qualify anchors with the active Investigation",
  );
  sourceContract(
    !/investigationId:\s*focusedEventId/.test(graphHost),
    "focused EVENT identity is never used as Research investigation ownership",
  );
  sourceContract(
    toolbar.includes('action="VIEW_2D"') &&
      toolbar.includes('action="VIEW_3D"') &&
      graphHost.includes('action === "VIEW_2D"') &&
      graphHost.includes('setProjectionMode("2D")') &&
      graphHost.includes('action === "VIEW_3D"') &&
      graphHost.includes('setProjectionMode("3D")'),
    "both 2D and 3D projection controls remain available and handled",
  );
  sourceContract(
    /const workspaceSelection\s*=\s*resolveCoherentInvestigationSelection\([\s\S]*?workspaceRuntime\.getSelection\(\)[\s\S]*?\)/.test(
      rightPanel,
    ) &&
      /resolveCanonicalSelectionIntelligence\(\{[\s\S]*?selection:\s*workspaceSelection/.test(
        rightPanel,
      ),
    "RightPanel drives Selection Intelligence through coherent selection",
  );
  sourceContract(
    graph3D.includes("useRef<PendingNodeClick | null>(null)") &&
      graph3D.includes("useRef<PendingEdgeClick | null>(null)") &&
      graph3D.includes("recognizeNodeDoubleClick(") &&
      graph3D.includes("recognizeEdgeDoubleClick(") &&
      !graph3D.includes("PendingNodeOrEdgeClick"),
    "3D NODE and EDGE recognizers retain separate state and entry points",
  );

  const projectionSwitchStart = graphHost.indexOf(
    "function handleManifoldAction(",
  );
  const projectionSwitchEnd = graphHost.indexOf(
    "// FOCUSED NODE",
    projectionSwitchStart,
  );
  const projectionSwitchHandler =
    projectionSwitchStart >= 0 && projectionSwitchEnd > projectionSwitchStart
      ? graphHost.slice(projectionSwitchStart, projectionSwitchEnd)
      : "";
  sourceContract(
    projectionSwitchHandler.length > 0 &&
      !/activateInvestigation|setActiveInvestigation|materializeInitialOperationalRevision|prepareNextOperationalRevision|reconcileOperationalGraphRevision|createRevision/.test(
        projectionSwitchHandler,
      ),
    "projection-switch handlers perform no graph activation or revision mutation",
  );

  console.log(
    `\nPASS VerifyManifoldCrossModeRegressionGate — ${verifiers.length} focused verifiers and ${seamAssertions} source-contract assertions verified`,
  );
  console.log(
    "Source-contract assertions protect static component wiring; they do not constitute browser interaction coverage.",
  );
}
