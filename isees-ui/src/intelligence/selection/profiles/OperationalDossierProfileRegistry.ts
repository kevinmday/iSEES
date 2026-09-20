import { EVENT_GOVERNED_DOSSIER_SECTION_ORDER, normalizeCanonicalSemanticFamily, normalizeCompatibilityProjectionFamily } from "../../../knowledge/dossier/typeCanon/GovernedDossierTypeCanonRegistry.ts";
import type { OperationalDossierProfileCandidate, OperationalDossierProfileDefinition, OperationalDossierProfileId, OperationalDossierProfileResolutionBasis, OperationalDossierSectionId } from "./OperationalDossierProfileTypes.ts";

const p = (profileId: OperationalDossierProfileId, sectionOrder: readonly OperationalDossierSectionId[]): OperationalDossierProfileDefinition => Object.freeze({ profileId, sectionOrder: Object.freeze([...sectionOrder]) });
const governance = ["FACT_LINEAGE", "INTELLIGENCE_GAPS", "GOVERNANCE"] as const;

export const OPERATIONAL_DOSSIER_PROFILE_REGISTRY: Readonly<Record<OperationalDossierProfileId, OperationalDossierProfileDefinition>> = Object.freeze({
  EVENT: p("EVENT", EVENT_GOVERNED_DOSSIER_SECTION_ORDER),
  PERSON: p("PERSON", ["IDENTITY", "OPERATIONAL_SUMMARY", "ORGANIZATION", "CHRONOLOGY", "EVENT_ROLE", "EVIDENCE", "CONFLICTS", ...governance]),
  ORGANIZATION: p("ORGANIZATION", ["IDENTITY", "OPERATIONAL_SUMMARY", "ORGANIZATION", "PERSONNEL", "CHRONOLOGY", "CAPABILITIES", "EVIDENCE", "CONFLICTS", ...governance]),
  NAVAL_VESSEL: p("NAVAL_VESSEL", ["IDENTITY", "OPERATIONAL_SUMMARY", "EVENT_ROLE", "CAPABILITIES", "LIMITATIONS", "SPECIFICATIONS", "SYSTEMS", "ORGANIZATION", "CHRONOLOGY", "EXTERNAL_REFERENCES", ...governance]),
  AIRCRAFT: p("AIRCRAFT", ["IDENTITY", "OPERATIONAL_SUMMARY", "EVENT_ROLE", "CAPABILITIES", "LIMITATIONS", "SPECIFICATIONS", "SYSTEMS", "ORGANIZATION", "CHRONOLOGY", "EXTERNAL_REFERENCES", ...governance]),
  SENSOR_SYSTEM: p("SENSOR_SYSTEM", ["IDENTITY", "OPERATIONAL_SUMMARY", "CAPABILITIES", "LIMITATIONS", "SPECIFICATIONS", "SYSTEMS", "EVENT_ROLE", "EVIDENCE", "CONFLICTS", ...governance]),
  LOCATION: p("LOCATION", ["IDENTITY", "OPERATIONAL_SUMMARY", "LOCATION", "CHRONOLOGY", "EVENT_ROLE", "EVIDENCE", "CONFLICTS", ...governance]),
  ARTIFACT: p("ARTIFACT", ["IDENTITY", "OPERATIONAL_SUMMARY", "CHRONOLOGY", "ORGANIZATION", "EVIDENCE", "CONFLICTS", "EXTERNAL_REFERENCES", ...governance]),
  DOCUMENT: p("DOCUMENT", ["IDENTITY", "OPERATIONAL_SUMMARY", "CHRONOLOGY", "ORGANIZATION", "EVIDENCE", "CONFLICTS", "EXTERNAL_REFERENCES", ...governance]),
  MEDIA: p("MEDIA", ["IDENTITY", "OPERATIONAL_SUMMARY", "CHRONOLOGY", "LOCATION", "EVIDENCE", "CONFLICTS", "EXTERNAL_REFERENCES", ...governance]),
  NARRATIVE: p("NARRATIVE", ["IDENTITY", "OPERATIONAL_SUMMARY", "CHRONOLOGY", "PARTICIPANTS", "EVIDENCE", "CONFLICTS", ...governance]),
  HYPOTHESIS: p("HYPOTHESIS", ["IDENTITY", "OPERATIONAL_SUMMARY", "EVIDENCE", "CONFLICTS", "EVENT_ROLE", ...governance]),
  GENERIC_ENTITY: p("GENERIC_ENTITY", ["IDENTITY", "OPERATIONAL_SUMMARY", "EVENT_ROLE", "ORGANIZATION", "CHRONOLOGY", "EVIDENCE", "CONFLICTS", "EXTERNAL_REFERENCES", ...governance]),
});

const subtypeAliases: Readonly<Record<string, OperationalDossierProfileId>> = Object.freeze({ EVENT: "EVENT", PERSON: "PERSON", ORGANIZATION: "ORGANIZATION", NAVAL_VESSEL: "NAVAL_VESSEL", AIRCRAFT: "AIRCRAFT", SENSOR: "SENSOR_SYSTEM", SENSOR_SYSTEM: "SENSOR_SYSTEM", LOCATION: "LOCATION", ARTIFACT: "ARTIFACT", DOCUMENT: "DOCUMENT", MEDIA: "MEDIA", NARRATIVE: "NARRATIVE", HYPOTHESIS: "HYPOTHESIS" });
const identitySpecificProfiles: Readonly<Record<string, OperationalDossierProfileId>> = Object.freeze({ "system:entity:uss-princeton": "NAVAL_VESSEL", "system:event:E-TICTAC-2004": "EVENT" });

export class IdentityDossierInvalidError extends Error {
  public readonly code = "IDENTITY_DOSSIER_INVALID" as const;
  public constructor(identity: string | undefined) { super(`IDENTITY_DOSSIER_INVALID: ${identity ?? "UNSPECIFIED_IDENTITY"}`); }
}

export interface OperationalDossierProfileResolutionInput {
  readonly canonicalEntityId?: string;
  readonly identitySpecificProfile?: string;
  readonly identityDossierState?: "VALID" | "INVALID" | "ABSENT";
  readonly governedEntitySubtype?: string;
  readonly canonicalKnowledgeType?: string;
  readonly graphNodeType?: string;
}
export interface OperationalDossierProfileResolution {
  readonly profile: OperationalDossierProfileDefinition;
  readonly basis: OperationalDossierProfileResolutionBasis;
  readonly matchedKey: string;
  readonly consideredCandidates: readonly OperationalDossierProfileCandidate[];
}
const candidate = (basis: OperationalDossierProfileResolutionBasis, key: string | undefined, resolvedProfileId: OperationalDossierProfileId | undefined): OperationalDossierProfileCandidate => Object.freeze({ basis, ...(key === undefined ? {} : { key }), ...(resolvedProfileId === undefined ? {} : { resolvedProfileId }) });

export function resolveOperationalDossierProfile(input: OperationalDossierProfileResolutionInput): OperationalDossierProfileResolution {
  if (input.identityDossierState === "INVALID") throw new IdentityDossierInvalidError(input.canonicalEntityId);
  const identityProfile = input.identityDossierState === "ABSENT" ? undefined : (input.identitySpecificProfile === undefined ? identitySpecificProfiles[input.canonicalEntityId ?? ""] : subtypeAliases[input.identitySpecificProfile.trim().toUpperCase()]);
  const subtypeKey = input.governedEntitySubtype?.trim().toUpperCase();
  const subtypeProfile = subtypeKey === undefined ? undefined : subtypeAliases[subtypeKey];
  const semanticKey = input.canonicalKnowledgeType?.trim().toUpperCase();
  const semanticProfile = normalizeCanonicalSemanticFamily(semanticKey);
  const compatibilityKey = input.graphNodeType?.trim().toUpperCase();
  const compatibilityProfile = normalizeCompatibilityProjectionFamily(compatibilityKey);
  const consideredCandidates = Object.freeze([
    candidate("IDENTITY_SPECIFIC", input.canonicalEntityId, identityProfile),
    candidate("CANONICAL_SUBTYPE", subtypeKey, subtypeProfile),
    candidate("CANONICAL_SEMANTIC_TYPE", semanticKey, semanticProfile),
    candidate("COMPATIBILITY_PROJECTION_TYPE", compatibilityKey, compatibilityProfile),
    candidate("GENERIC_FALLBACK", "GENERIC_ENTITY", "GENERIC_ENTITY"),
  ]);
  const match = consideredCandidates.find(item => item.resolvedProfileId !== undefined)!;
  return Object.freeze({ profile: OPERATIONAL_DOSSIER_PROFILE_REGISTRY[match.resolvedProfileId!], basis: match.basis, matchedKey: match.key!, consideredCandidates });
}
