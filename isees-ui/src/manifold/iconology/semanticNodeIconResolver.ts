import type { GraphIconType, GraphNodeType } from "../graphTypes.ts";

export type SemanticNodeIconResolutionBasis = "IDENTITY_SPECIFIC" | "CANONICAL_SUBTYPE" | "CANONICAL_SEMANTIC_TYPE" | "COMPATIBILITY_GRAPH_NODE_TYPE" | "GENERIC_FALLBACK";

export interface SemanticNodeIconResolutionInput {
  readonly canonicalIdentity?: unknown;
  readonly canonicalSubtypes?: unknown;
  readonly canonicalSemanticType?: unknown;
  readonly compatibilityGraphNodeType?: unknown;
}

export interface SemanticNodeIconResolution {
  readonly iconFamily: GraphIconType;
  readonly basis: SemanticNodeIconResolutionBasis;
  readonly matchedKey?: string;
}

const IDENTITY_ICON_FAMILIES: Readonly<Record<string, GraphIconType>> = Object.freeze({
  "system:entity:uss-princeton": "SHIP",
  "system:entity:an-apg-79-aesa-radar": "RADAR",
  "system:entity:atflir-sensor-systems": "SYSTEM",
  "system:entity:e2-hawkeye-sensor-grid": "SYSTEM",
  "system:entity:usaf-security-patrol-network": "BUILDING",
});

const SUBTYPE_ICON_FAMILIES: Readonly<Record<string, GraphIconType>> = Object.freeze({
  NAVAL_VESSEL: "SHIP",
  "NAVAL STRIKE GROUP": "FLEET",
  "AEGIS RADAR": "RADAR",
  "AIRBORNE SENSOR": "SENSOR",
  "TARGETING POD": "SENSOR",
  "MILITARY AIR BASE": "BUILDING",
  "GROUND OBSERVATION": "BUILDING",
  "MILITARY AIRSPACE": "LOCATION",
  "TRAINING RANGE": "LOCATION",
});

const SEMANTIC_TYPE_ICON_FAMILIES: Readonly<Record<string, GraphIconType>> = Object.freeze({
  EVENT: "EVENT", OBSERVATION: "EVENT", EVIDENCE: "DOCUMENT", DOCUMENT: "DOCUMENT",
  REFERENCE: "DOCUMENT", DATASET: "DOCUMENT", MODEL: "DOCUMENT", ARTIFACT: "DOCUMENT",
  PERSON: "PERSON", ORGANIZATION: "ORGANIZATION", LOCATION: "LOCATION",
  NARRATIVE: "NARRATIVE", HYPOTHESIS: "HYPOTHESIS",
});

const COMPATIBILITY_ICON_FAMILIES: Readonly<Record<GraphNodeType, GraphIconType>> = Object.freeze({
  EVENT: "EVENT", FACILITY: "BUILDING", ARTIFACT: "DOCUMENT", PERSON: "PERSON",
  ORGANIZATION: "ORGANIZATION", LOCATION: "LOCATION", NARRATIVE: "NARRATIVE", HYPOTHESIS: "HYPOTHESIS",
});

function exactString(value: unknown): string | undefined {
  return typeof value === "string" && value.trim().length > 0 ? value.trim() : undefined;
}

function normalizedKey(value: unknown): string | undefined { return exactString(value)?.toUpperCase(); }

function subtypeKeys(value: unknown): readonly string[] {
  if (!Array.isArray(value)) {
    const key = normalizedKey(value);
    return key === undefined ? [] : [key];
  }
  return value.flatMap(item => { const key = normalizedKey(item); return key === undefined ? [] : [key]; });
}

export function resolveSemanticNodeIconFamily(input: SemanticNodeIconResolutionInput): SemanticNodeIconResolution {
  const identity = exactString(input.canonicalIdentity);
  const identityFamily = identity === undefined ? undefined : IDENTITY_ICON_FAMILIES[identity];
  if (identityFamily !== undefined) return Object.freeze({ iconFamily: identityFamily, basis: "IDENTITY_SPECIFIC", matchedKey: identity });

  for (const subtype of subtypeKeys(input.canonicalSubtypes)) {
    const subtypeFamily = SUBTYPE_ICON_FAMILIES[subtype];
    if (subtypeFamily !== undefined) return Object.freeze({ iconFamily: subtypeFamily, basis: "CANONICAL_SUBTYPE", matchedKey: subtype });
  }

  const semanticType = normalizedKey(input.canonicalSemanticType);
  const semanticFamily = semanticType === undefined ? undefined : SEMANTIC_TYPE_ICON_FAMILIES[semanticType];
  if (semanticFamily !== undefined) return Object.freeze({ iconFamily: semanticFamily, basis: "CANONICAL_SEMANTIC_TYPE", matchedKey: semanticType });

  const compatibilityType = normalizedKey(input.compatibilityGraphNodeType) as GraphNodeType | undefined;
  const compatibilityFamily = compatibilityType === undefined ? undefined : COMPATIBILITY_ICON_FAMILIES[compatibilityType];
  if (compatibilityFamily !== undefined) return Object.freeze({ iconFamily: compatibilityFamily, basis: "COMPATIBILITY_GRAPH_NODE_TYPE", matchedKey: compatibilityType });

  return Object.freeze({ iconFamily: "GENERIC", basis: "GENERIC_FALLBACK" });
}
