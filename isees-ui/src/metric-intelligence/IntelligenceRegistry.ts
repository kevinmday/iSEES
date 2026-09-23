import type { EquationDocumentation } from "./EquationDocumentationTypes";
import type { IntelligenceDefinition } from "./MetricIntelligenceTypes";
import type { MetricMathematicsRegistry, MetricMathematicsRegistryEntry } from "./MetricMathematicsRegistry.ts";

const SEMVER = /^(0|[1-9]\d*)\.(0|[1-9]\d*)\.(0|[1-9]\d*)(?:-[0-9A-Za-z.-]+)?$/;
const required = (value: string, name: string) => { if (!value?.trim()) throw new Error(`${name} is required.`); };

function validateEquation(equation: EquationDocumentation): void {
  required(equation.equationId, "Equation ID");
  if (!SEMVER.test(equation.semanticVersion)) throw new Error(`Invalid equation version: ${equation.semanticVersion}`);
  const documented = new Set(equation.symbols.map(item => item.symbol));
  if (documented.size !== equation.symbols.length) throw new Error(`Duplicate symbol documentation in ${equation.equationId}.`);
  for (const symbol of equation.referencedSymbols) if (!documented.has(symbol)) throw new Error(`Equation ${equation.equationId} lacks documentation for symbol ${symbol}.`);
  for (const symbol of equation.symbols) { required(symbol.symbol, "Equation symbol"); required(symbol.meaning, `Meaning for ${symbol.symbol}`); required(symbol.acceptedDomain, `Domain for ${symbol.symbol}`); required(symbol.unit, `Unit for ${symbol.symbol}`); }
}

export interface IntelligenceRegistry {
  readonly getDefinition: (definitionId: string) => IntelligenceDefinition | undefined;
  readonly getEquation: (equationId: string) => EquationDocumentation | undefined;
  readonly listDefinitions: () => readonly IntelligenceDefinition[];
  readonly listEquations: () => readonly EquationDocumentation[];
  readonly getMathematics: (identity: string) => MetricMathematicsRegistryEntry | undefined;
}

export function createIntelligenceRegistry(definitions: readonly IntelligenceDefinition[], mathematics?: MetricMathematicsRegistry): IntelligenceRegistry {
  const byDefinition = new Map<string, IntelligenceDefinition>();
  const byEquation = new Map<string, EquationDocumentation>();
  for (const definition of definitions) {
    required(definition.definitionId, "Definition ID");
    if (!SEMVER.test(definition.definitionVersion)) throw new Error(`Invalid definition version: ${definition.definitionVersion}`);
    if (byDefinition.has(definition.definitionId)) throw new Error(`Duplicate intelligence definition ID: ${definition.definitionId}`);
    if (definition.intelligenceKind === "METRIC") { required(definition.evaluatorLineage.implementationReference, "Metric evaluator implementation reference"); if (!SEMVER.test(definition.evaluatorLineage.version)) throw new Error(`Invalid evaluator version: ${definition.evaluatorLineage.version}`); }
    if (definition.canonEffect !== "NONE" || definition.operationalGraphEffect !== "NONE") throw new Error(`Unsupported mutation effect for ${definition.definitionId}.`);
    const equation = definition.mathematicalDocumentation;
    if (definition.mathematicalDocumentationStatus.status === "AVAILABLE" && !equation) throw new Error(`Available mathematical documentation is missing for ${definition.definitionId}.`);
    if (definition.mathematicalDocumentationStatus.status !== "AVAILABLE" && equation) throw new Error(`Unexpected mathematical documentation for ${definition.definitionId}.`);
    if (definition.mathematicalDocumentationStatus.status === "DEFERRED_UNAVAILABLE") required(definition.mathematicalDocumentationStatus.reason ?? "", "Deferred mathematical documentation reason");
    if (definition.mathematicsAuthorityIdentity && !mathematics?.get(definition.mathematicsAuthorityIdentity)) throw new Error(`Unknown mathematics authority identity for ${definition.definitionId}: ${definition.mathematicsAuthorityIdentity}.`);
    if (equation) { validateEquation(equation); if (byEquation.has(equation.equationId)) throw new Error(`Duplicate equation ID: ${equation.equationId}`); byEquation.set(equation.equationId, equation); }
    byDefinition.set(definition.definitionId, definition);
  }
  const orderedDefinitions = Object.freeze([...byDefinition.values()].sort((a,b) => a.definitionId.localeCompare(b.definitionId)));
  const orderedEquations = Object.freeze([...byEquation.values()].sort((a,b) => a.equationId.localeCompare(b.equationId)));
  return Object.freeze({ getDefinition: (id: string) => byDefinition.get(id), getEquation: (id: string) => byEquation.get(id), listDefinitions: () => orderedDefinitions, listEquations: () => orderedEquations, getMathematics: (identity: string) => mathematics?.get(identity) });
}
