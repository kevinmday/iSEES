import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { CANONICAL_EVENTS } from "../../src/canonical/runtimeCorpus.ts";
import { buildCanonicalOperationalGraph } from "../../src/investigation/revision/OperationalGraphRevision.ts";
import { adaptSystemCanonToKnowledge } from "../../src/knowledge/ingestion/SystemCanonKnowledgeAdapter.ts";
import type { GraphIconType } from "../../src/manifold/graphTypes.ts";
import { getGraphIcon, GRAPH_ICON_REGISTRY } from "../../src/manifold/iconology/iconRegistry.ts";
import { resolveSemanticNodeIconFamily } from "../../src/manifold/iconology/semanticNodeIconResolver.ts";

const resolved = resolveSemanticNodeIconFamily({
  canonicalIdentity: "system:entity:an-apg-79-aesa-radar",
  canonicalSubtypes: ["AIRBORNE SENSOR"],
  canonicalSemanticType: "ENTITY",
  compatibilityGraphNodeType: "FACILITY",
});
assert.deepEqual(resolved, { iconFamily: "RADAR", basis: "IDENTITY_SPECIFIC", matchedKey: "system:entity:an-apg-79-aesa-radar" });
assert.equal(Object.isFrozen(resolved), true);
assert.deepEqual(resolveSemanticNodeIconFamily({ canonicalIdentity: "unknown", canonicalSubtypes: "NAVAL_VESSEL", canonicalSemanticType: "ENTITY", compatibilityGraphNodeType: "FACILITY" }), { iconFamily: "SHIP", basis: "CANONICAL_SUBTYPE", matchedKey: "NAVAL_VESSEL" });
assert.deepEqual(resolveSemanticNodeIconFamily({ canonicalSubtypes: [null, "unknown"], canonicalSemanticType: "LOCATION", compatibilityGraphNodeType: "FACILITY" }), { iconFamily: "LOCATION", basis: "CANONICAL_SEMANTIC_TYPE", matchedKey: "LOCATION" });
assert.deepEqual(resolveSemanticNodeIconFamily({ canonicalSemanticType: "unknown", compatibilityGraphNodeType: "ORGANIZATION" }), { iconFamily: "ORGANIZATION", basis: "COMPATIBILITY_GRAPH_NODE_TYPE", matchedKey: "ORGANIZATION" });
assert.deepEqual(resolveSemanticNodeIconFamily({ canonicalIdentity: 1, canonicalSubtypes: {}, canonicalSemanticType: null, compatibilityGraphNodeType: "invalid" }), { iconFamily: "GENERIC", basis: "GENERIC_FALLBACK" });

const expected: Readonly<Record<string, GraphIconType>> = {
  "system:entity:an-apg-79-aesa-radar": "RADAR",
  "system:entity:atflir-sensor-systems": "SYSTEM",
  "system:entity:e2-hawkeye-sensor-grid": "SYSTEM",
  "system:entity:east-coast-training-range": "LOCATION",
  "system:entity:raf-bentwaters": "BUILDING",
  "system:entity:raf-woodbridge": "BUILDING",
  "system:entity:usaf-security-patrol-network": "BUILDING",
  "system:entity:uss-nimitz-carrier-group": "FLEET",
  "system:entity:uss-princeton": "SHIP",
  "system:entity:uss-theodore-roosevelt-carrier-group": "FLEET",
  "system:event:E-RENDLESHAM-1980": "EVENT",
  "system:event:E-ROOSEVELT-2015": "EVENT",
  "system:event:E-TICTAC-2004": "EVENT",
  "system:location:atlantic-ocean-virginia-training-areas-36-74": "LOCATION",
  "system:location:pacific-ocean-california-31-117": "LOCATION",
  "system:location:rendlesham-forest-suffolk-england-52-094-1-433": "LOCATION",
};
const graph = buildCanonicalOperationalGraph(adaptSystemCanonToKnowledge(CANONICAL_EVENTS));
assert.equal(graph.nodes.length, Object.keys(expected).length);
for (const node of graph.nodes) assert.equal(node.iconType, expected[node.id], node.id);

for (const family of Object.values(expected)) assert.equal(getGraphIcon(family), GRAPH_ICON_REGISTRY[family]);
assert.equal(GRAPH_ICON_REGISTRY.FLEET.icon, "⚓");
assert.equal(GRAPH_ICON_REGISTRY.SYSTEM.icon, "⚙️");
assert.equal(Object.values(expected).includes("NETWORK"), false);
assert.equal(getGraphIcon("EVENT"), GRAPH_ICON_REGISTRY.EVENT);
assert.equal(getGraphIcon("FACILITY"), GRAPH_ICON_REGISTRY.BUILDING);
assert.equal(getGraphIcon("ARTIFACT"), GRAPH_ICON_REGISTRY.DOCUMENT);
assert.equal(getGraphIcon("invalid" as GraphIconType), GRAPH_ICON_REGISTRY.GENERIC);

const resolverSource = readFileSync("src/manifold/iconology/semanticNodeIconResolver.ts", "utf8");
for (const forbidden of ["label", "description", "narrative", ".includes(", ".startsWith(", "Date", "Math.random", "fetch(", "invokeRex"]) assert.equal(resolverSource.includes(forbidden), false, forbidden);
const twoDimensionalSource = readFileSync("src/manifold/components/GraphNodeGlyph.tsx", "utf8");
const threeDimensionalSource = readFileSync("src/manifold/components/InvestigationGraph3D.tsx", "utf8");
for (const source of [twoDimensionalSource, threeDimensionalSource]) {
  assert(source.includes("node.iconType") || source.includes("iconType ?? type"));
  assert(source.includes("getGraphIcon"));
}

console.log("PASS VerifySemanticNodeIconResolution — five-level precedence, safe fallbacks, 16 fixture mappings, and shared 2D/3D registry consumption verified");
