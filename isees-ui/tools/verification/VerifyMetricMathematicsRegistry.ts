import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { resolveIntentionEquation, IntentionEquationId } from "../../src/intention/contracts/IntentionEquationRegistry.ts";
import { assertValidAuthorityStatus, AuthorityClassification, EquationStatus } from "../../src/metric-intelligence/MetricMathematicsAuthorityTypes.ts";
import { METRIC_MATHEMATICS_REGISTRY } from "../../src/metric-intelligence/MetricMathematicsRegistry.ts";
import { METRIC_INTELLIGENCE_REGISTRY, TOPOLOGY_SIMILARITY_DEFINITION } from "../../src/metric-intelligence/TopologySimilarityMetricIntelligence.ts";
import { EVENT_SPACE_MANIFOLD_CONSTRUCTION_NOTATION, EVIDENCE_CONDITIONED_MANIFOLD_INSTANTIATION_NOTATION } from "../../src/resolve/engine/ResolveEngineTypes.ts";

let count = 0;
const pass = (message: string) => { count += 1; console.log(`PASS ${count} — ${message}`); };
const entries = METRIC_MATHEMATICS_REGISTRY.list();

assert.equal(new Set(entries.map(entry => entry.identity)).size, entries.length);
for (const entry of entries) assert.doesNotThrow(() => assertValidAuthorityStatus(entry.authorityClassification, entry.equationStatus));
pass("registry identities are unique and every authority/status combination is valid");

const general = METRIC_MATHEMATICS_REGISTRY.get("manifold.event-space-construction");
const conditioned = METRIC_MATHEMATICS_REGISTRY.get("manifold.evidence-conditioned-instantiation");
assert(general?.authoritativeEquation && conditioned?.authoritativeEquation);
assert.equal(general.authoritativeEquation.notation, EVENT_SPACE_MANIFOLD_CONSTRUCTION_NOTATION);
assert.equal(conditioned.authoritativeEquation.notation, EVIDENCE_CONDITIONED_MANIFOLD_INSTANTIATION_NOTATION);
assert.deepEqual(general.authoritativeEquation.referencedSymbols, ["M", "g", "L", "T", "S"]);
assert.deepEqual(conditioned.authoritativeEquation.referencedSymbols, ["M_E", "g", "L_E", "T_E", "S_E", "E"]);
assert(conditioned.relatedMathematics.some(item => item.identity === general.identity));
assert.equal(general.authorityClassification, AuthorityClassification.CANON_AUTHORIZED);
assert.equal(conditioned.authorityClassification, AuthorityClassification.CANON_AUTHORIZED);
assert(general.characteristics.includes("NOTATION_ONLY") && conditioned.characteristics.includes("NOTATION_ONLY"));
pass("general construction and evidence-conditioned instantiation are separate related Canon notation-only entries");

const activeDefinitions = [general.authoritativeEquation, conditioned.authoritativeEquation].map(value => JSON.stringify(value)).join("\n");
assert(!activeDefinitions.includes("g(L,T,S,E)") && !activeDefinitions.includes("g(L, T, S, E)"));
assert(conditioned.authoritativeEquation.symbols.find(symbol => symbol.symbol === "E")?.meaning.includes("not a direct argument"));
for (const forbidden of ["similarity equation", "correspondence equation", "candidate score", "probability equation", "INTENTION governing model"]) {
  assert(!general.authoritativeEquation.equationName.includes(forbidden));
  assert(!conditioned.authoritativeEquation.equationName.includes(forbidden));
}
pass("E conditions instantiated terms and is never represented as a fourth projection-control argument or score");

const intentionModel = resolveIntentionEquation(IntentionEquationId.GOVERNING_MODEL);
assert.equal(intentionModel.displayExpression, "INTENTION governing model = unavailable");
assert.equal(intentionModel.inputs.length, 0);
assert.equal(METRIC_MATHEMATICS_REGISTRY.get("intention.theoretical-models-unavailable")?.equationStatus, EquationStatus.UNAVAILABLE);
pass("INTENTION governing mathematics remains explicitly unavailable");

const executable = entries.filter(entry => entry.identity.startsWith("resolve.") || entry.identity.startsWith("layers."));
assert(executable.length > 0);
assert(executable.every(entry => entry.authorityClassification === AuthorityClassification.EXECUTABLE_BUT_NOT_CANONIZED));
assert(executable.every(entry => entry.equationStatus === EquationStatus.IMPLEMENTATION_EQUATION || entry.equationStatus === EquationStatus.PROCEDURE_ONLY));
pass("executable Resolve and LAYERS procedures remain non-canonized");

const sourceSupplied = entries.filter(entry => entry.authorityClassification === AuthorityClassification.SOURCE_SUPPLIED);
assert(sourceSupplied.length > 0 && sourceSupplied.every(entry => entry.equationStatus === EquationStatus.SOURCE_COPY));
const unavailable = entries.filter(entry => entry.authorityClassification === AuthorityClassification.DEFERRED_UNAVAILABLE);
assert(unavailable.length > 0 && unavailable.every(entry => entry.documentationAvailability.status === "UNAVAILABLE"));
pass("source values remain source supplied and unavailable mathematics remains explicit");

assert.equal(METRIC_INTELLIGENCE_REGISTRY.getDefinition(TOPOLOGY_SIMILARITY_DEFINITION.definitionId), TOPOLOGY_SIMILARITY_DEFINITION);
assert.equal(METRIC_INTELLIGENCE_REGISTRY.getMathematics("resolve.dimension.topology-correspondence")?.identity, "resolve.dimension.topology-correspondence");
assert.equal(TOPOLOGY_SIMILARITY_DEFINITION.mathematicalDocumentationStatus.status, "DEFERRED_UNAVAILABLE");
pass("existing Metric Intelligence contracts adopt the authority registry without claiming an unavailable governing equation");

const evaluatorSources = [
  "src/resolve/similarity/CanonicalKnowledgeSimilarity.ts",
  "src/layers/projection/LayersExperimentalPairProjection.ts",
].map(path => readFileSync(path, "utf8")).join("\n");
assert(evaluatorSources.includes("computeAggregateSimilarity") && evaluatorSources.includes("weightedContribution"));
const changedEvaluatorDiffGuard = readFileSync("src/metric-intelligence/MetricMathematicsRegistry.ts", "utf8");
assert(!changedEvaluatorDiffGuard.includes("Math.random") && !changedEvaluatorDiffGuard.includes("fetch("));
pass("registry documentation consumes evaluator behavior without introducing computation or presentation logic");

console.log(`PASS VerifyMetricMathematicsRegistry — ${count} groups verified`);
