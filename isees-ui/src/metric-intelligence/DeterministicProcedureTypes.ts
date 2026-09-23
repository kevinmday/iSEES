export const DETERMINISTIC_PROCEDURE_SCHEMA_VERSION = "deterministic-procedure/v1" as const;

export interface ProcedureValueDefinition {
  readonly identity: string;
  readonly name: string;
  readonly valueKind: "NUMBER" | "TEXT" | "BOOLEAN" | "COLLECTION" | "CATEGORICAL";
  readonly unit: string;
  readonly normalization: string;
  readonly provenanceRequired: boolean;
}

export interface ProcedureBranchCase {
  readonly caseIdentity: string;
  readonly condition: string;
  readonly outcome: string;
}

export interface DeterministicProcedureStep {
  readonly order: number;
  readonly stepIdentity: string;
  readonly operation: "SELECT" | "NORMALIZE" | "TRANSFORM" | "COMPARE" | "AGGREGATE" | "BRANCH" | "COPY_SOURCE" | "FORMAT_PRESENTATION";
  readonly description: string;
  readonly inputIdentities: readonly string[];
  readonly outputIdentities: readonly string[];
  readonly branchCases: readonly ProcedureBranchCase[];
}

export interface DeterministicProcedure {
  readonly schemaVersion: typeof DETERMINISTIC_PROCEDURE_SCHEMA_VERSION;
  readonly procedureIdentity: string;
  readonly procedureVersion: string;
  readonly evaluatorIdentity: string;
  readonly evaluatorVersion: string;
  readonly inputs: readonly ProcedureValueDefinition[];
  readonly outputs: readonly ProcedureValueDefinition[];
  readonly steps: readonly DeterministicProcedureStep[];
  readonly inclusionRules: readonly string[];
  readonly exclusionRules: readonly string[];
  readonly missingDataBehavior: readonly string[];
  readonly sourceCopyBehavior: readonly string[];
  readonly presentationFormatting: readonly string[];
  readonly provenanceReferences: readonly string[];
}

export function createDeterministicProcedure(value: DeterministicProcedure): DeterministicProcedure {
  if (value.schemaVersion !== DETERMINISTIC_PROCEDURE_SCHEMA_VERSION) throw new Error(`Unsupported deterministic procedure schema: ${value.schemaVersion}.`);
  if (!value.procedureIdentity.trim() || !value.evaluatorIdentity.trim()) throw new Error("Procedure and evaluator identities are required.");
  const steps = [...value.steps].sort((a, b) => a.order - b.order || a.stepIdentity.localeCompare(b.stepIdentity));
  if (steps.some((step, index) => step.order !== index)) throw new Error(`Procedure ${value.procedureIdentity} steps must use contiguous zero-based ordering.`);
  const identities = new Set(steps.map(step => step.stepIdentity));
  if (identities.size !== steps.length) throw new Error(`Procedure ${value.procedureIdentity} has duplicate step identities.`);
  return deepFreeze({ ...value, steps });
}

function deepFreeze<T>(value: T): T {
  if (value && typeof value === "object" && !Object.isFrozen(value)) {
    Object.values(value as Record<string, unknown>).forEach(deepFreeze);
    Object.freeze(value);
  }
  return value;
}
