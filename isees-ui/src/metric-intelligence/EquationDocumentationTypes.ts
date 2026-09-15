export type EquationVerificationStatus = "VERIFIED" | "UNVERIFIED" | "DEFERRED_UNAVAILABLE";

export interface EquationSymbolDefinition {
  readonly symbol: string;
  readonly meaning: string;
  readonly acceptedDomain: string;
  readonly unit: string;
}

export interface EquationDocumentation {
  readonly equationId: string;
  readonly equationName: string;
  readonly semanticVersion: string;
  readonly governingSource: string;
  readonly notation: string;
  readonly plainText: string;
  readonly referencedSymbols: readonly string[];
  readonly symbols: readonly EquationSymbolDefinition[];
  readonly acceptedDomains: readonly string[];
  readonly units: readonly string[];
  readonly assumptions: readonly string[];
  readonly availabilityRules: readonly string[];
  readonly normalizationMethod: string;
  readonly thresholds: readonly string[];
  readonly evaluatorImplementationReference: string;
  readonly evaluatorVersion: string;
  readonly relatedEquationIds: readonly string[];
  readonly verificationStatus: EquationVerificationStatus;
  readonly citationText: string;
  readonly provenanceRequirements: readonly string[];
}

export interface EquationInputSubstitution {
  readonly order: number;
  readonly symbol: string;
  readonly exactValue: string;
  readonly formattedValue: string;
  readonly unit: string;
  readonly provenance: readonly string[];
}

export interface EvaluatedMathematicalSnapshot {
  readonly equationReference: Readonly<{ equationId: string; semanticVersion: string }>;
  readonly inputSubstitutions: readonly EquationInputSubstitution[];
  readonly formattedSubstitutedExpression: string;
  readonly exactEvaluatedValue: string;
  readonly formattedDisplayedValue: string;
  readonly activeInvestigationId: string;
  readonly operationalRevisionId?: string;
  readonly evaluationIdentity?: string;
  readonly calculationTimestamp?: string;
  readonly inputProvenance: readonly string[];
  readonly unavailableInputDisclosures: readonly string[];
  readonly assumptionsActuallyApplied: readonly string[];
}

export function createEvaluatedMathematicalSnapshot(snapshot: EvaluatedMathematicalSnapshot): EvaluatedMathematicalSnapshot {
  const substitutions = [...snapshot.inputSubstitutions].sort((a, b) => a.order - b.order || a.symbol.localeCompare(b.symbol));
  if (substitutions.some((item, index) => item.order !== index)) throw new Error("Equation substitutions must use contiguous zero-based ordering.");
  if (!snapshot.activeInvestigationId.trim()) throw new Error("An active investigation ID is required.");
  return Object.freeze({ ...snapshot, equationReference: Object.freeze({ ...snapshot.equationReference }), inputSubstitutions: Object.freeze(substitutions.map(item => Object.freeze({ ...item, provenance: Object.freeze([...item.provenance]) }))), inputProvenance: Object.freeze([...snapshot.inputProvenance].sort()), unavailableInputDisclosures: Object.freeze([...snapshot.unavailableInputDisclosures].sort()), assumptionsActuallyApplied: Object.freeze([...snapshot.assumptionsActuallyApplied].sort()) });
}
