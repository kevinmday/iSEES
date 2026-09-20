import assert from "node:assert/strict";
import { IdentityDossierInvalidError, resolveOperationalDossierProfile } from "../../src/intelligence/selection/profiles/OperationalDossierProfileRegistry.ts";

const bases = ["IDENTITY_SPECIFIC", "CANONICAL_SUBTYPE", "CANONICAL_SEMANTIC_TYPE", "COMPATIBILITY_PROJECTION_TYPE", "GENERIC_FALLBACK"];
const identity = resolveOperationalDossierProfile({ canonicalEntityId: "system:entity:uss-princeton", identityDossierState: "VALID", governedEntitySubtype: "NAVAL_VESSEL", canonicalKnowledgeType: "ENTITY", graphNodeType: "FACILITY" });
assert.equal(identity.profile.profileId, "NAVAL_VESSEL"); assert.equal(identity.basis, "IDENTITY_SPECIFIC"); assert.equal(identity.matchedKey, "system:entity:uss-princeton");
assert.deepEqual(identity.consideredCandidates.map(item => item.basis), bases);
assert.deepEqual(identity.consideredCandidates.map(item => item.resolvedProfileId), ["NAVAL_VESSEL", "NAVAL_VESSEL", "GENERIC_ENTITY", "GENERIC_ENTITY", "GENERIC_ENTITY"]);

const subtype = resolveOperationalDossierProfile({ canonicalEntityId: "missing", identityDossierState: "ABSENT", governedEntitySubtype: "NAVAL_VESSEL", canonicalKnowledgeType: "EVENT", graphNodeType: "PERSON" });
assert.equal(subtype.profile.profileId, "NAVAL_VESSEL"); assert.equal(subtype.basis, "CANONICAL_SUBTYPE"); assert.equal(subtype.matchedKey, "NAVAL_VESSEL");
const semantic = resolveOperationalDossierProfile({ identityDossierState: "ABSENT", governedEntitySubtype: "unknown", canonicalKnowledgeType: "EVENT", graphNodeType: "PERSON" });
assert.equal(semantic.profile.profileId, "EVENT"); assert.equal(semantic.basis, "CANONICAL_SEMANTIC_TYPE"); assert.equal(semantic.matchedKey, "EVENT");
const compatibility = resolveOperationalDossierProfile({ identityDossierState: "ABSENT", governedEntitySubtype: "unknown", canonicalKnowledgeType: "unknown", graphNodeType: "PERSON" });
assert.equal(compatibility.profile.profileId, "PERSON"); assert.equal(compatibility.basis, "COMPATIBILITY_PROJECTION_TYPE"); assert.equal(compatibility.matchedKey, "PERSON");
const generic = resolveOperationalDossierProfile({ identityDossierState: "ABSENT", governedEntitySubtype: "unknown", canonicalKnowledgeType: "unknown", graphNodeType: "unknown" });
assert.equal(generic.profile.profileId, "GENERIC_ENTITY"); assert.equal(generic.basis, "GENERIC_FALLBACK"); assert.equal(generic.matchedKey, "GENERIC_ENTITY");
assert.throws(() => resolveOperationalDossierProfile({ canonicalEntityId: "system:entity:uss-princeton", identityDossierState: "INVALID", governedEntitySubtype: "NAVAL_VESSEL", canonicalKnowledgeType: "EVENT", graphNodeType: "PERSON" }), (error: unknown) => error instanceof IdentityDossierInvalidError && error.code === "IDENTITY_DOSSIER_INVALID");
for (const result of [identity, subtype, semantic, compatibility, generic]) assert.equal(Object.isFrozen(result) && Object.isFrozen(result.consideredCandidates) && result.consideredCandidates.every(Object.isFrozen), true);

console.log("PASS VerifyGovernedDossierResolverPrecedence — all five levels, exact trace, downgrade mutations, and fail-closed invalid identity verified");
