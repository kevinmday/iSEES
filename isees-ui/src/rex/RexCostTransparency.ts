import type { RexReceipt } from "./RexApi.ts";

export const REX_BILLING_STATUS = "DISABLED" as const;
export const REX_FEE_POLICY = Object.freeze({ identity: "isees-governance-fee-planning", version: "planning-v1", state: "PLANNING_ONLY" as const });
export const ILLUSTRATIVE_TAVILY_MARKUP_BASIS_POINTS = 3_750 as const;

export interface IllustrativeRexReceiptProjection {
  readonly status: "ILLUSTRATIVE_NO_AUTHORIZATION_CREATED";
  readonly providerLabel: "Tavily provider charge";
  readonly providerChargeMicros: number;
  readonly marginLabel: "Disclosed iSEES margin";
  readonly marginMicros: number;
  readonly markupBasisPoints: typeof ILLUSTRATIVE_TAVILY_MARKUP_BASIS_POINTS;
  readonly maximumAuthorizedTotalMicros: number;
}

export interface RexCostComponents {
  readonly externalProviderCapMicros: number;
  readonly computeAndAiCapMicros: number;
  readonly iseesGovernanceFeeMicros: number;
  readonly contingencyReserveMicros: number;
}

export interface RexCostTransparencyProjection extends RexCostComponents {
  readonly maximumAuthorizedMicros: number;
  readonly finalChargeMicros: number;
  readonly releasedAuthorizationMicros: number;
  readonly billingStatus: typeof REX_BILLING_STATUS;
  readonly feePolicy: typeof REX_FEE_POLICY;
  readonly providerIdentity: string;
  readonly modelIdentity: string;
  readonly aiAssistanceStatus: RexReceipt["aiAssistanceStatus"];
}

const validMicros = (value: unknown, name: string): number => {
  if (typeof value !== "number" || !Number.isSafeInteger(value) || value < 0) throw new Error(`${name} must be a non-negative integer number of micros.`);
  return value;
};

const addMicros = (values: readonly number[]): number => {
  const total = values.reduce((sum, value) => sum + BigInt(value), 0n);
  if (total > BigInt(Number.MAX_SAFE_INTEGER)) throw new Error("The maximum authorization exceeds safe integer micros.");
  return Number(total);
};

export function createIllustrativeRexReceipt(providerChargeMicros: number): IllustrativeRexReceiptProjection {
  const provider = validMicros(providerChargeMicros, "Illustrative Tavily provider charge");
  const margin = Number((BigInt(provider) * BigInt(ILLUSTRATIVE_TAVILY_MARKUP_BASIS_POINTS)) / 10_000n);
  return Object.freeze({
    status: "ILLUSTRATIVE_NO_AUTHORIZATION_CREATED",
    providerLabel: "Tavily provider charge",
    providerChargeMicros: provider,
    marginLabel: "Disclosed iSEES margin",
    marginMicros: margin,
    markupBasisPoints: ILLUSTRATIVE_TAVILY_MARKUP_BASIS_POINTS,
    maximumAuthorizedTotalMicros: addMicros([provider, margin]),
  });
}

export const ILLUSTRATIVE_REX_RECEIPT = createIllustrativeRexReceipt(400_000);

export function formatUsdMicros(value: unknown): string {
  const micros = validMicros(value, "Cost");
  if (micros === 0) return "$0.00";
  const exactMicros = BigInt(micros);
  const dollars = exactMicros / 1_000_000n;
  const microsRemainder = String(exactMicros % 1_000_000n).padStart(6, "0");
  const fraction = microsRemainder.replace(/0+$/, "").padEnd(2, "0");
  const exact = `$${dollars.toLocaleString("en-US")}.${fraction}`;
  return micros < 10_000 ? `less than $0.01 (${exact} exact)` : exact;
}

export function formatOptionalUsdMicros(value: unknown): string {
  return value === undefined || value === null ? "unavailable" : formatUsdMicros(value);
}

export function createRexCostProjection(
  components: RexCostComponents,
  settlement: { readonly finalChargeMicros: number; readonly releasedAuthorizationMicros?: number; readonly expectedMaximumAuthorizedMicros?: number },
  identity: Pick<RexReceipt, "providerIdentity" | "modelIdentity" | "aiAssistanceStatus">,
): RexCostTransparencyProjection {
  const externalProviderCapMicros = validMicros(components.externalProviderCapMicros, "External provider cap");
  const computeAndAiCapMicros = validMicros(components.computeAndAiCapMicros, "Compute and AI cap");
  const iseesGovernanceFeeMicros = validMicros(components.iseesGovernanceFeeMicros, "iSEES governance fee");
  const contingencyReserveMicros = validMicros(components.contingencyReserveMicros, "Contingency reserve");
  const maximumAuthorizedMicros = addMicros([externalProviderCapMicros, computeAndAiCapMicros, iseesGovernanceFeeMicros, contingencyReserveMicros]);
  if (settlement.expectedMaximumAuthorizedMicros !== undefined && validMicros(settlement.expectedMaximumAuthorizedMicros, "Expected maximum authorization") !== maximumAuthorizedMicros) throw new Error("Maximum authorization does not reconcile to its visible components.");
  const finalChargeMicros = validMicros(settlement.finalChargeMicros, "Final charge");
  if (finalChargeMicros > maximumAuthorizedMicros) throw new Error("Final charge cannot exceed maximum authorization.");
  const releasedAuthorizationMicros = maximumAuthorizedMicros - finalChargeMicros;
  if (settlement.releasedAuthorizationMicros !== undefined && validMicros(settlement.releasedAuthorizationMicros, "Released authorization") !== releasedAuthorizationMicros) throw new Error("Released authorization does not reconcile to maximum authorization minus final charge.");
  return Object.freeze({externalProviderCapMicros,computeAndAiCapMicros,iseesGovernanceFeeMicros,contingencyReserveMicros,maximumAuthorizedMicros,finalChargeMicros,releasedAuthorizationMicros,billingStatus:REX_BILLING_STATUS,feePolicy:REX_FEE_POLICY,...identity});
}

export function projectFixtureRexCost(receipt: RexReceipt): RexCostTransparencyProjection {
  const estimatedMicros = validMicros(receipt.estimatedMicros, "Estimated cost");
  const reservedMicros = validMicros(receipt.reservedMicros, "Reserved cost");
  const actualMicros = validMicros(receipt.actualMicros, "Actual cost");
  const chargedMicros = validMicros(receipt.chargedMicros, "Charged cost");
  if (actualMicros !== chargedMicros) throw new Error("Fixture actual cost and final charge must reconcile.");
  if (reservedMicros < estimatedMicros) throw new Error("Reserved cost cannot be below estimated cost.");
  if (receipt.providerIdentity !== "NONE" || receipt.modelIdentity !== "NONE" || receipt.aiAssistanceStatus !== "NONE") throw new Error("The local fixture must not invoke a provider or AI model.");
  return createRexCostProjection(
    {externalProviderCapMicros:estimatedMicros,computeAndAiCapMicros:0,iseesGovernanceFeeMicros:0,contingencyReserveMicros:reservedMicros-estimatedMicros},
    {finalChargeMicros:chargedMicros,releasedAuthorizationMicros:receipt.releasedMicros,expectedMaximumAuthorizedMicros:reservedMicros},
    receipt,
  );
}
