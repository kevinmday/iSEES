export const METRIC_MATHEMATICS_AUTHORITY_SCHEMA_VERSION = "metric-mathematics-authority/v1" as const;

export const AuthorityClassification = Object.freeze({
  CANON_AUTHORIZED: "CANON_AUTHORIZED",
  EXECUTABLE_BUT_NOT_CANONIZED: "EXECUTABLE_BUT_NOT_CANONIZED",
  NOTATION_ONLY: "NOTATION_ONLY",
  ALGORITHMIC_PROCEDURE: "ALGORITHMIC_PROCEDURE",
  SOURCE_SUPPLIED: "SOURCE_SUPPLIED",
  DEFERRED_UNAVAILABLE: "DEFERRED_UNAVAILABLE",
  CONFLICTING: "CONFLICTING",
  OBSOLETE: "OBSOLETE",
} as const);
export type AuthorityClassification = typeof AuthorityClassification[keyof typeof AuthorityClassification];

export const EquationStatus = Object.freeze({
  AUTHORIZED_EQUATION: "AUTHORIZED_EQUATION",
  IMPLEMENTATION_EQUATION: "IMPLEMENTATION_EQUATION",
  PROCEDURE_ONLY: "PROCEDURE_ONLY",
  SOURCE_COPY: "SOURCE_COPY",
  UNAVAILABLE: "UNAVAILABLE",
} as const);
export type EquationStatus = typeof EquationStatus[keyof typeof EquationStatus];

export type MathematicsCharacteristic = "NOTATION_ONLY" | "ALGORITHMIC_PROCEDURE";

const allowedStatuses: Readonly<Record<AuthorityClassification, readonly EquationStatus[]>> = Object.freeze({
  CANON_AUTHORIZED: Object.freeze([EquationStatus.AUTHORIZED_EQUATION]),
  EXECUTABLE_BUT_NOT_CANONIZED: Object.freeze([EquationStatus.IMPLEMENTATION_EQUATION, EquationStatus.PROCEDURE_ONLY]),
  NOTATION_ONLY: Object.freeze([EquationStatus.AUTHORIZED_EQUATION, EquationStatus.PROCEDURE_ONLY]),
  ALGORITHMIC_PROCEDURE: Object.freeze([EquationStatus.PROCEDURE_ONLY]),
  SOURCE_SUPPLIED: Object.freeze([EquationStatus.SOURCE_COPY]),
  DEFERRED_UNAVAILABLE: Object.freeze([EquationStatus.UNAVAILABLE]),
  CONFLICTING: Object.freeze([EquationStatus.UNAVAILABLE]),
  OBSOLETE: Object.freeze([EquationStatus.UNAVAILABLE]),
});

export interface MathematicsAuthorityIdentity {
  readonly schemaVersion: typeof METRIC_MATHEMATICS_AUTHORITY_SCHEMA_VERSION;
  readonly authorityClassification: AuthorityClassification;
  readonly equationStatus: EquationStatus;
  readonly characteristics: readonly MathematicsCharacteristic[];
}

export function assertValidAuthorityStatus(authority: AuthorityClassification, status: EquationStatus): void {
  if (!allowedStatuses[authority].includes(status)) throw new Error(`Invalid mathematics authority/status combination: ${authority}/${status}.`);
}

export function createMathematicsAuthorityIdentity(value: MathematicsAuthorityIdentity): MathematicsAuthorityIdentity {
  if (value.schemaVersion !== METRIC_MATHEMATICS_AUTHORITY_SCHEMA_VERSION) throw new Error(`Unsupported mathematics authority schema: ${value.schemaVersion}.`);
  assertValidAuthorityStatus(value.authorityClassification, value.equationStatus);
  const characteristics = [...new Set(value.characteristics)].sort();
  if (value.authorityClassification === AuthorityClassification.CANON_AUTHORIZED && characteristics.includes("ALGORITHMIC_PROCEDURE")) throw new Error("Canon-authorized notation cannot imply an unauthorized executable algorithm.");
  return Object.freeze({ ...value, characteristics: Object.freeze(characteristics) });
}
