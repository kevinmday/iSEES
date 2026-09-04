import { IntentionAvailability, type IntentionAvailability as Availability } from "./IntentionAvailability";

export interface IntentionEquationInputDefinition { readonly id: string; readonly symbol: string; readonly description: string; readonly units?: string; }
export interface IntentionEquationDefinition {
  readonly id: string; readonly symbol: string; readonly name: string; readonly displayExpression: string;
  readonly description: string; readonly units?: string; readonly inputs: readonly IntentionEquationInputDefinition[];
  readonly availability: Availability; readonly reason?: string; readonly executable: false;
}

const descriptor = (value: Omit<IntentionEquationDefinition, "executable">): IntentionEquationDefinition => deepFreeze({ ...value, executable: false });
function deepFreeze<T>(value: T): T { if (value && typeof value === "object" && !Object.isFrozen(value)) { Object.values(value as Record<string, unknown>).forEach(deepFreeze); Object.freeze(value); } return value; }

export const IntentionEquationId = Object.freeze({
  RESOLVE_AGGREGATE_SIMILARITY: "intention:descriptor:resolve-aggregate-similarity:v1",
  SOURCE_RESIDUAL_INSTABILITY: "intention:descriptor:source-residual-instability:v1",
  GOVERNING_MODEL: "intention:theory:governing-model:v1",
  ATTRACTOR_DETECTION: "intention:theory:attractor-detection:v1",
  INTENTION_VECTOR: "intention:theory:intention-vector:v1",
} as const);

const entries = [
  descriptor({ id: IntentionEquationId.RESOLVE_AGGREGATE_SIMILARITY, symbol: "Sᵣ", name: "Resolve aggregate similarity (source value)", displayExpression: "Sᵣ = Resolve.aggregateSimilarity", description: "Lossless descriptive publication of the authoritative Resolve aggregate; not intention probability.", units: "unitless [0,1]", inputs: [{ id: "resolveAggregateSimilarity", symbol: "Sᵣ", description: "Exact aggregateSimilarity from the selected Resolve candidate evaluation.", units: "unitless [0,1]" }], availability: IntentionAvailability.AVAILABLE }),
  descriptor({ id: IntentionEquationId.SOURCE_RESIDUAL_INSTABILITY, symbol: "Rᵢ(source)", name: "Corpus topology residual instability (source value)", displayExpression: "Rᵢ(source) = corpus.topology_state.residual_instability", description: "Lossless corpus topology field; explicitly not a residual of an INTENTION model.", units: "source-defined unitless value", inputs: [{ id: "sourceResidualInstability", symbol: "Rᵢ(source)", description: "Exact residual_instability field from canonical source material.", units: "source-defined unitless value" }], availability: IntentionAvailability.AVAILABLE }),
  descriptor({ id: IntentionEquationId.GOVERNING_MODEL, symbol: "M", name: "Complete INTENTION governing model", displayExpression: "M = g(L,T,S)", description: "Theoretical descriptor only; operational meanings and required inputs are incomplete.", inputs: [{ id: "L", symbol: "L", description: "Layer state." }, { id: "T", symbol: "T", description: "Temporal context (operational definition unavailable)." }, { id: "S", symbol: "S", description: "Scale (operational definition unavailable)." }], availability: IntentionAvailability.THEORETICAL, reason: "No repository-authoritative complete computable INTENTION model exists." }),
  descriptor({ id: IntentionEquationId.ATTRACTOR_DETECTION, symbol: "A", name: "Attractor detection", displayExpression: "A = theoretical", description: "No executable attractor definition, threshold, or authoritative test exists.", inputs: [], availability: IntentionAvailability.THEORETICAL, reason: "Attractor detection is not operationally defined." }),
  descriptor({ id: IntentionEquationId.INTENTION_VECTOR, symbol: "I⃗", name: "Intention vector", displayExpression: "I⃗ = theoretical", description: "No actor, objective, direction, or causal attribution is computed.", inputs: [], availability: IntentionAvailability.THEORETICAL, reason: "Intention vectors are not operationally defined." }),
] as const;

export const INTENTION_EQUATION_REGISTRY: readonly IntentionEquationDefinition[] = deepFreeze([...entries]);
export function resolveIntentionEquation(id: string): IntentionEquationDefinition { const match = INTENTION_EQUATION_REGISTRY.find(entry => entry.id === id); if (!match) throw new Error(`Unknown INTENTION equation ID: ${id}`); return match; }
