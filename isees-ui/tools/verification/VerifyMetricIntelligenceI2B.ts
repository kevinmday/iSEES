import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { METRIC_MATHEMATICS_REGISTRY, ISEES_EPISTEMIC_BOUNDARIES } from "../../src/metric-intelligence/MetricMathematicsRegistry.ts";
import { projectResolveAggregateTrace } from "../../src/metric-intelligence/MetricCalculationTrace.ts";
import type { ComparePairProjectionReady } from "../../src/compare/projection/ComparePairProjectionTypes.ts";

let count=0; const pass=(message:string)=>{count++;console.log(`PASS ${count} — ${message}`);};
const statuses=new Set(METRIC_MATHEMATICS_REGISTRY.list().map(x=>x.equationStatus));
for(const status of ["AUTHORIZED_EQUATION","IMPLEMENTATION_EQUATION","PROCEDURE_ONLY","SOURCE_COPY","UNAVAILABLE"]) assert(statuses.has(status as never));
pass("all five discriminated equation-status variants are registry backed");

const general=METRIC_MATHEMATICS_REGISTRY.get("manifold.event-space-construction")!;
const conditioned=METRIC_MATHEMATICS_REGISTRY.get("manifold.evidence-conditioned-instantiation")!;
assert.equal(general.authoritativeEquation?.notation,"M = g(L,T,S)");
assert.equal(conditioned.authoritativeEquation?.notation,"M_E = g(L_E,T_E,S_E)");
assert(!conditioned.authoritativeEquation?.notation.includes(",E)"));
assert(conditioned.authoritativeEquation?.plainText.includes("not a fourth argument"));
pass("general and evidence-conditioned manifold notation remain distinct and E is not a fourth argument");

const projection={aggregate:{aggregateSimilarity:.416326,participatingDimensionCount:2,totalDimensionCount:3,weightedNumerator:.208163,participatingWeight:.5,weightedContributions:[{dimension:"NARRATIVE",similarity:.076923,configuredWeight:.3,weightedContribution:.0230769},{dimension:"OBSERVABILITY",similarity:.9254305,configuredWeight:.2,weightedContribution:.1850861}]},dimensions:[{dimension:"NARRATIVE",status:"AVAILABLE",source:{availability:"AVAILABLE",dimension:"NARRATIVE",similarity:.076923,weight:.3}},{dimension:"OBSERVABILITY",status:"AVAILABLE",source:{availability:"AVAILABLE",dimension:"OBSERVABILITY",similarity:.9254305,weight:.2}},{dimension:"GEOGRAPHY",status:"UNAVAILABLE",source:{availability:"UNAVAILABLE",dimension:"GEOGRAPHY",reason:"Geography unavailable at both endpoints."}}]} as unknown as ComparePairProjectionReady;
const before=JSON.stringify(projection); const trace=projectResolveAggregateTrace(projection);
assert.equal(trace.numerator,"0.208163"); assert.equal(trace.denominator,"0.5"); assert.equal(trace.exactResult,"0.416326"); assert.equal(trace.displayedResult,"41.6%");
assert.equal(trace.dimensions[0]?.configuredWeight,"0.3"); assert.equal(trace.dimensions[0]?.weightedContribution,"0.0230769"); assert.equal(trace.dimensions[2]?.availability,"UNAVAILABLE");
assert.equal(JSON.stringify(projection),before); assert(Object.isFrozen(trace)&&Object.isFrozen(trace.dimensions));
pass("trace projects evaluator-owned weights, contributions, unavailable reasons, exact result, and display formatting without mutation or reverse calculation");

const ui=readFileSync("src/metric-intelligence/ContextualIntelligencePresentation.tsx","utf8");
for(const token of ["Authority and provenance","How iSEES mathematics works","Worked deterministic calculation","How the deterministic procedure works","trigger.current?.focus()","event.key===\"Tab\"","overflow-wrap:anywhere"]) assert(ui.includes(token)||readFileSync("src/metric-intelligence/MetricIntelligence.css","utf8").includes(token),token);
for(const boundary of ISEES_EPISTEMIC_BOUNDARIES) assert(boundary.length>0);
pass("visible explainer includes authority, trace, progressive procedure, philosophy, focus trap/return, and long-identifier handling");

const unavailable=METRIC_MATHEMATICS_REGISTRY.get("intention.theoretical-models-unavailable")!;
assert.equal(unavailable.equationStatus,"UNAVAILABLE"); assert(unavailable.documentationAvailability.reason);
assert.equal(METRIC_MATHEMATICS_REGISTRY.get("intention.source-residual-copy")?.equationStatus,"SOURCE_COPY");
pass("unavailable and source-copy mathematics remain explicit without invented equations");

const evaluator=readFileSync("src/resolve/similarity/CanonicalKnowledgeSimilarity.ts","utf8");
const adapter=readFileSync("src/metric-intelligence/MetricCalculationTrace.ts","utf8");
assert(evaluator.includes("weightedNumerator")&&evaluator.includes("weightedContributions"));
assert(!adapter.includes("reduce(")&&!adapter.includes("Math.round"));
for(const forbidden of ["fetch(","OpenAI","Math.random","acceptance","publication"]) assert(!adapter.includes(forbidden));
pass("authoritative intermediates belong to Resolve and the adapter adds no evaluator, AI, graph, Canon, acceptance, or publication behavior");

console.log(`PASS VerifyMetricIntelligenceI2B — ${count} groups verified`);
