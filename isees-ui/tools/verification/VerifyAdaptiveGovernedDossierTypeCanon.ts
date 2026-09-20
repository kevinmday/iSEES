import assert from "node:assert/strict";
import { KnowledgeObjectType } from "../../src/knowledge/model/KnowledgeObjectTypes.ts";
import { OPERATIONAL_DOSSIER_PROFILE_REGISTRY } from "../../src/intelligence/selection/profiles/OperationalDossierProfileRegistry.ts";
import { CANONICAL_SEMANTIC_FAMILY_MAP, COMPATIBILITY_PROJECTION_FAMILY_MAP, EVENT_GOVERNED_DOSSIER_SECTION_ORDER, GOVERNED_DOSSIER_TYPE_CANON_REGISTRY, normalizeCanonicalSemanticFamily, normalizeCompatibilityProjectionFamily } from "../../src/knowledge/dossier/typeCanon/GovernedDossierTypeCanonRegistry.ts";
import { GOVERNED_DOSSIER_TYPE_CANON_VERSION } from "../../src/knowledge/dossier/typeCanon/GovernedDossierTypeCanonTypes.ts";

const semanticTypes = Object.values(KnowledgeObjectType);
assert.equal(semanticTypes.length, 18);
assert.deepEqual(Object.keys(CANONICAL_SEMANTIC_FAMILY_MAP).sort(), [...semanticTypes].sort());
for (const type of semanticTypes) assert.equal(normalizeCanonicalSemanticFamily(type), CANONICAL_SEMANTIC_FAMILY_MAP[type]);
assert.equal(normalizeCanonicalSemanticFamily("unknown"), undefined);

const compatibilityTypes = ["EVENT", "FACILITY", "ARTIFACT", "PERSON", "ORGANIZATION", "LOCATION", "NARRATIVE", "HYPOTHESIS"] as const;
assert.deepEqual(Object.keys(COMPATIBILITY_PROJECTION_FAMILY_MAP).sort(), [...compatibilityTypes].sort());
for (const type of compatibilityTypes) assert.equal(normalizeCompatibilityProjectionFamily(type), COMPATIBILITY_PROJECTION_FAMILY_MAP[type]);
assert.equal(normalizeCompatibilityProjectionFamily("unknown"), undefined);

const event = GOVERNED_DOSSIER_TYPE_CANON_REGISTRY.EVENT;
assert.equal(event.typeCanonVersion, GOVERNED_DOSSIER_TYPE_CANON_VERSION);
assert.equal(event.completeness, "COMPLETE");
assert.deepEqual(event.sectionOrder, EVENT_GOVERNED_DOSSIER_SECTION_ORDER);
assert.deepEqual(event.sectionOrder, ["IDENTITY", "OPERATIONAL_SUMMARY", "CHRONOLOGY", "LOCATION", "PARTICIPANTS", "SYSTEMS", "EVIDENCE", "CONFLICTS", "RELATIONSHIPS", "FACT_LINEAGE", "RESTRICTIONS", "INTELLIGENCE_GAPS", "GOVERNANCE"]);
assert.deepEqual(OPERATIONAL_DOSSIER_PROFILE_REGISTRY.EVENT.sectionOrder, event.sectionOrder);
assert.equal(event.confidencePolicy, "AUTHORITATIVELY_SUPPLIED_ONLY");
assert.equal(event.selectionBoundary, "SYNCHRONOUS_DETERMINISTIC_LOCAL_ZERO_COST");
assert.deepEqual(new Set(event.unavailableStates), new Set(["AVAILABLE", "UNAVAILABLE", "NOT_RESEARCHED", "NOT_ESTABLISHED", "NOT_APPLICABLE", "CONFLICTING", "STALE", "NO_LIMITATION_DOCUMENTED"]));
assert.equal(Object.isFrozen(event) && Object.isFrozen(event.fields) && Object.isFrozen(CANONICAL_SEMANTIC_FAMILY_MAP), true);

console.log("PASS VerifyAdaptiveGovernedDossierTypeCanon — 18 semantic types, 8 compatibility types, EVENT family, generic fallback, and truthful states verified");
