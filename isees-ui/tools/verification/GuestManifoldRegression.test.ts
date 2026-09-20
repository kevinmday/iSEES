import { test } from "vitest";

const regressionVerifiers = [
  "VerifyOperationalGraphRevision.ts",
  "VerifySemanticNodeIconResolution.ts",
  "VerifyAdaptiveGovernedDossierTypeCanon.ts",
  "VerifyGovernedDossierResolverPrecedence.ts",
  "VerifyGovernedEntityDossierSelectionProjection.ts",
  "VerifyUssPrincetonOperationalDossier.ts",
  "VerifyNimitzTicTacEventGovernedDossier.ts",
  "VerifyFreshInvestigationIsolation.ts",
  "VerifyComparePairProjection.ts",
  "VerifyCompareStateCoherence.ts",
  "VerifyCompareWorkspaceProjection.ts",
  "VerifyManifoldCrossModeRegressionGate.ts",
  "VerifyResolveRuntimePublication.ts",
  "VerifyResolveDeterminism.ts",
  "VerifyResolveCanonicalSimilarityIntegration.ts",
  "VerifyResolveCandidateSelection.ts",
  "VerifyLayersExperimentalPairProjection.ts",
  "VerifyLayersExperimentRuntime.ts",
  "VerifyLayersLaboratoryWorkspace.ts",
  "VerifyLayersFinalAcceptance.ts",
  "VerifyCanonicalEmptyGuestWorkspace.ts",
  "VerifyGuestWorkspaceSessionLifecycle.ts",
] as const;

test.each(regressionVerifiers)("existing regression verifier: %s", async verifier => {
  await import(`./${verifier}`);
});
