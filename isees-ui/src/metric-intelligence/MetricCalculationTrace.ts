import type { ComparePairProjectionReady } from "../compare/projection/ComparePairProjectionTypes";
import type { DeterministicCalculationTrace } from "./MetricExplanationContract";

const exact = (value: number) => String(value);

/** Lossless presentation projection. All arithmetic values originate in the Resolve evaluator. */
export function projectResolveAggregateTrace(projection: ComparePairProjectionReady): DeterministicCalculationTrace {
  const contributions = new Map(projection.aggregate.weightedContributions.map(value => [value.dimension, value]));
  const dimensions = projection.dimensions.map(item => {
    if (item.source.availability === "UNAVAILABLE") return Object.freeze({ dimension: item.dimension, availability: "UNAVAILABLE" as const, unavailableReason: item.source.reason });
    const authoritative = contributions.get(item.dimension);
    if (!authoritative) throw new Error(`Resolve aggregate trace lacks evaluator contribution for ${item.dimension}.`);
    return Object.freeze({ dimension: item.dimension, availability: "AVAILABLE" as const, similarity: exact(authoritative.similarity), configuredWeight: exact(authoritative.configuredWeight), weightedContribution: exact(authoritative.weightedContribution) });
  });
  const terms = projection.aggregate.weightedContributions.map(value => `(${exact(value.configuredWeight)} × ${exact(value.similarity)})`);
  return Object.freeze({
    kind: "DETERMINISTIC_CALCULATION_TRACE",
    dimensions: Object.freeze(dimensions),
    numerator: exact(projection.aggregate.weightedNumerator),
    denominator: exact(projection.aggregate.participatingWeight),
    exactResult: exact(projection.aggregate.aggregateSimilarity),
    displayedResult: `${(projection.aggregate.aggregateSimilarity * 100).toFixed(1)}%`,
    formattingRule: "Exact evaluator ratio × 100, rounded to one decimal place, percent suffix.",
    substitution: `S(A,B) = [${terms.join(" + ")}] / ${exact(projection.aggregate.participatingWeight)} = ${exact(projection.aggregate.aggregateSimilarity)} = ${(projection.aggregate.aggregateSimilarity * 100).toFixed(1)}%`,
  });
}
