import { immutable } from "./CandidateEvidenceLifecycle.ts";

export const CANDIDATE_QUERY_SCHEMA_VERSION = "candidate-evidence-query/v1" as const;
export type QueryEntityKind = "PERSON" | "ORGANIZATION" | "PLATFORM" | "SENSOR";
export interface QueryNamedValue { readonly canonicalIdentity: string; readonly value: string }
export interface QueryDateRange { readonly start: string; readonly end?: string }
export interface QueryRepositoryIdentifier { readonly repository: string; readonly identifier: string }
export interface CandidateQueryInput {
  readonly investigationId: string;
  readonly targetConnector: string;
  readonly eventNames?: readonly string[];
  readonly aliases?: readonly QueryNamedValue[];
  readonly dates?: readonly QueryDateRange[];
  readonly locations?: readonly string[];
  readonly entities?: readonly (QueryNamedValue & { readonly kind: QueryEntityKind })[];
  readonly citations?: readonly string[];
  readonly dois?: readonly string[];
  readonly repositoryIdentifiers?: readonly QueryRepositoryIdentifier[];
}
export interface QueryClause { readonly kind: "EVENT" | "ALIAS" | "DATE" | "LOCATION" | "ENTITY" | "CITATION" | "DOI" | "REPOSITORY_ID"; readonly encoded: string }
export interface QuerySpecification {
  readonly schemaVersion: typeof CANDIDATE_QUERY_SCHEMA_VERSION;
  readonly investigationId: string;
  readonly targetConnector: string;
  readonly query: string;
  readonly clauses: readonly QueryClause[];
  readonly lineage: CandidateQueryInput;
}
const ORDER: Readonly<Record<QueryClause["kind"], number>> = { EVENT: 0, ALIAS: 1, DATE: 2, LOCATION: 3, ENTITY: 4, CITATION: 5, DOI: 6, REPOSITORY_ID: 7 };
function q(value: string): string { return `"${value.trim().replaceAll("\\", "\\\\").replaceAll('"', '\\"').replace(/\s+/g, " ")}"`; }
function uniqueSorted(values: readonly string[]): readonly string[] { return [...new Set(values)].sort((a, b) => a.localeCompare(b, "en")); }
function exactStrings(values: readonly string[] | undefined): readonly string[] | undefined { return values ? uniqueSorted(values) : undefined; }
function exactObjects<T>(values: readonly T[] | undefined): readonly T[] | undefined {
  if (!values) return undefined;
  const encoded = uniqueSorted(values.map((value) => JSON.stringify(value)));
  return encoded.map((value) => JSON.parse(value) as T);
}
export function buildCandidateEvidenceQuery(input: CandidateQueryInput): QuerySpecification {
  if (!input.investigationId.trim() || !input.targetConnector.trim()) throw new Error("Investigation identity and explicitly selected connector are required");
  const clauses: QueryClause[] = [];
  for (const value of uniqueSorted((input.eventNames ?? []).map((v) => q(v)))) clauses.push({ kind: "EVENT", encoded: `event:${value}` });
  for (const value of uniqueSorted((input.aliases ?? []).map((v) => `${q(v.canonicalIdentity)}=${q(v.value)}`))) clauses.push({ kind: "ALIAS", encoded: `alias:${value}` });
  for (const value of uniqueSorted((input.dates ?? []).map((v) => `${q(v.start)}${v.end ? `..${q(v.end)}` : ""}`))) clauses.push({ kind: "DATE", encoded: `date:${value}` });
  for (const value of uniqueSorted((input.locations ?? []).map(q))) clauses.push({ kind: "LOCATION", encoded: `location:${value}` });
  for (const value of uniqueSorted((input.entities ?? []).map((v) => `${v.kind}:${q(v.canonicalIdentity)}=${q(v.value)}`))) clauses.push({ kind: "ENTITY", encoded: `entity:${value}` });
  for (const value of uniqueSorted((input.citations ?? []).map(q))) clauses.push({ kind: "CITATION", encoded: `citation:${value}` });
  for (const value of uniqueSorted((input.dois ?? []).map(q))) clauses.push({ kind: "DOI", encoded: `doi:${value}` });
  for (const value of uniqueSorted((input.repositoryIdentifiers ?? []).map((v) => `${q(v.repository)}:${q(v.identifier)}`))) clauses.push({ kind: "REPOSITORY_ID", encoded: `repository-id:${value}` });
  clauses.sort((a, b) => ORDER[a.kind] - ORDER[b.kind] || a.encoded.localeCompare(b.encoded, "en"));
  const lineage: CandidateQueryInput = { ...input, eventNames: exactStrings(input.eventNames), aliases: exactObjects(input.aliases), dates: exactObjects(input.dates), locations: exactStrings(input.locations), entities: exactObjects(input.entities), citations: exactStrings(input.citations), dois: exactStrings(input.dois), repositoryIdentifiers: exactObjects(input.repositoryIdentifiers) };
  return immutable({ schemaVersion: CANDIDATE_QUERY_SCHEMA_VERSION, investigationId: input.investigationId, targetConnector: input.targetConnector, query: clauses.map((v) => v.encoded).join(" "), clauses, lineage });
}
