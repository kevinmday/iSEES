import {
  GUIDE_DEFINITION_SCHEMA_ID,
  GUIDE_DEFINITION_SCHEMA_VERSION,
  GuideActionClassification,
  GuideEpistemicClassification,
  GuideLayersExperimentClassification,
  GuideResolveClassification,
  GuideSelectionClassification,
  type GuideAction,
  type GuideBriefing,
  type GuideContextSnapshot,
  type GuideDefinition,
} from "../contracts/index.ts";

export const LayersGuideTargetIds = {
  /** Compatibility identifier for prerequisite navigation; this does not execute Resolve. */
  RUN_RESOLVE: "layers.prerequisite.run-resolve",
  CHOOSE_COMPARISON: "layers.prerequisite.choose-comparison",
  RESOLVE_TOPOLOGY_STATE: "layers.layer.resolve-topology-state",
  RUN_EXPERIMENT: "layers.experiment.run",
} as const;

const boundary = { description: "System Canon and accepted investigation knowledge remain unchanged." } as const;
const action = (id: string, label: string, targetId?: string): GuideAction => ({
  id, label, targetId, classification: GuideActionClassification.RECOMMENDED,
  description: label, consequences: [], protectedBoundaries: [boundary],
});

function definition(id: string, briefing: Omit<GuideBriefing, "definitionId" | "stateReferences" | "visualSteps" | "purpose" | "startHere" | "steps" | "nextMode" | "nextModeReason">, snapshot: Readonly<GuideContextSnapshot>): GuideDefinition {
  const inboxCount = snapshot.researchInbox.newLeadCount + snapshot.researchInbox.incomingSourceCount + snapshot.researchInbox.collectedFindingCount;
  return Object.freeze({
    schemaId: GUIDE_DEFINITION_SCHEMA_ID,
    schemaVersion: GUIDE_DEFINITION_SCHEMA_VERSION,
    definitionId: id,
    briefing: Object.freeze({
      purpose: "Browse deterministic layers, prepare a valid experimental configuration, and inspect non-canonical results.",
      startHere: "Browse the layer catalog and check the readiness shown for each selected layer.",
      steps: Object.freeze([
        "Browse all available layers and review each readiness state.",
        "Select the layers relevant to the research question.",
        "Satisfy the displayed prerequisites for layers that are not READY.",
        "Use Run / Recompute experiment when the configuration is ready.",
        "Inspect the deterministic result and its contributions.",
        "Use Publish Experiment to Research for a useful qualified finding.",
      ]),
      nextMode: "INTENTION or STUDIO",
      nextModeReason: "Continue to INTENTION to inspect derived projections, or STUDIO after useful findings have been published to the Research Inbox.",
      ...briefing, situation: `${briefing.situation} Research Inbox: ${inboxCount} item${inboxCount === 1 ? "" : "s"}.`, definitionId: id, stateReferences: Object.freeze([]), visualSteps: Object.freeze([]),
    }),
  });
}

export function resolveLayersGuideDefinition(snapshot: Readonly<GuideContextSnapshot>): GuideDefinition {
  if (snapshot.resolve.classification !== GuideResolveClassification.RESOLVED) {
    const recommended = action("layers.open-manifold", "Open MANIFOLD to run Resolve", LayersGuideTargetIds.RUN_RESOLVE);
    return definition("layers.no-current-resolve", {
      location: "LAYERS Laboratory",
      situation: "The current investigation does not have a completed Resolve execution.",
      significance: "LAYERS experiments require current deterministic Resolve output before a comparison can be tested.",
      recommendedAction: recommended,
      alternatives: [{ ...action("layers.review-manifold", "Return to MANIFOLD to review the investigation before running Resolve"), classification: GuideActionClassification.AVAILABLE }],
      consequences: [{ description: "Opening MANIFOLD does not run Resolve. Explicitly activate the authoritative RESOLVE control there.", consequential: true }],
      protectedBoundaries: [{ description: "Guide and Show Me do not execute Resolve, mutate the investigation, accept knowledge, or change System Canon." }],
      blockers: [{ code: "RESOLVE_REQUIRED", missing: "Current Resolve execution", reason: "LAYERS requires current deterministic Resolve output.", remedy: "Use Open MANIFOLD in the LAYERS prerequisite controls, then explicitly activate RESOLVE there.", changesCanonicalState: false }],
      showMeTargetId: LayersGuideTargetIds.RUN_RESOLVE,
    }, snapshot);
  }

  if (snapshot.comparison.classification !== "READY") {
    const recommended = action("layers.choose-comparison", "Choose Comparison", LayersGuideTargetIds.CHOOSE_COMPARISON);
    return definition("layers.no-comparison", {
      location: "LAYERS Laboratory",
      situation: "Resolve output is available, but no comparison event has been selected.",
      significance: "The laboratory requires Case A and Case B before it can evaluate experimental layer changes.",
      recommendedAction: recommended,
      alternatives: [{ ...action("layers.review-resolve", "Review the current Resolve result before selecting a comparison"), classification: GuideActionClassification.AVAILABLE }],
      consequences: [{ description: "Choosing a comparison prepares an experimental pair. It does not accept a relationship or modify System Canon.", consequential: false }],
      protectedBoundaries: [boundary],
      blockers: [{ code: "COMPARISON_REQUIRED", missing: "Comparison event", reason: "Case A and Case B are required.", remedy: "Use Choose Comparison in the LAYERS prerequisite controls.", changesCanonicalState: false }],
      showMeTargetId: LayersGuideTargetIds.CHOOSE_COMPARISON,
    }, snapshot);
  }

  const readiness = snapshot.layerReadiness;
  const firstUnresolved = readiness?.selectedUnresolvedLayers[0];
  if (readiness && snapshot.activeLayerIds.length > 0 && readiness.selectedReadyLayerIds.length === 0 && firstUnresolved) {
    return definition("layers.selected-preparation-needed", {
      location: "LAYERS Laboratory",
      situation: `${firstUnresolved.label} is selected as a research objective, but no selected layer is READY to compute.`,
      significance: "Selected incomplete layers remain explicit research objectives and never fabricate scores or enter deterministic computation.",
      recommendedAction: action("layers.satisfy-first-requirement", `Satisfy: ${firstUnresolved.missingRequirements[0] ?? "the declared preparation requirement"}`),
      alternatives: [{ ...action("layers.select-ready", "Select a READY layer while retaining unresolved research objectives"), classification: GuideActionClassification.AVAILABLE }],
      consequences: [{ description: "Preparation may make a governed layer READY; selection alone creates no input, evaluator, or score.", consequential: false }],
      protectedBoundaries: [boundary],
      blockers: [{ code: "NO_READY_SELECTED_LAYER", missing: firstUnresolved.missingRequirements[0] ?? "Ready deterministic layer", reason: `${firstUnresolved.readiness.replace("_", " ")}: ${firstUnresolved.label} cannot participate yet.`, remedy: "Provide the first declared canonical requirement or select a READY layer.", changesCanonicalState: false }],
    }, snapshot);
  }

  if (!snapshot.activeLayerIds.includes("TOPOLOGY")) {
    const recommended = action("layers.select-topology", "Select Resolve Topology State", LayersGuideTargetIds.RESOLVE_TOPOLOGY_STATE);
    return definition("layers.topology-unselected", {
      location: "LAYERS Laboratory",
      situation: "The comparison pair is ready, but Resolve Topology State is not selected for the experiment.",
      significance: "Selecting the layer allows the laboratory to test how the resolved topology contributes to the experimental relationship.",
      recommendedAction: recommended,
      alternatives: [{ ...action("layers.select-alternative", "Select another available layer to test a different deterministic contribution"), classification: GuideActionClassification.AVAILABLE }],
      consequences: [{ description: "Layer selection changes only the experimental configuration. It does not mutate the investigation manifold or System Canon.", consequential: false }],
      protectedBoundaries: [boundary], blockers: [], showMeTargetId: LayersGuideTargetIds.RESOLVE_TOPOLOGY_STATE,
    }, snapshot);
  }

  if (snapshot.layersExperiment.classification === GuideLayersExperimentClassification.COMPLETE) {
    return definition("layers.result-available", {
      location: "LAYERS Laboratory",
      situation: "A deterministic experimental result is available for inspection.",
      significance: "The result can be examined for deltas and contributions without treating it as accepted knowledge.",
      recommendedAction: action("layers.inspect-result", "Inspect the experiment result"),
      alternatives: [{ ...action("layers.recompute", "Change the layer configuration and recompute"), classification: GuideActionClassification.AVAILABLE }],
      consequences: [{ description: "Inspection does not publish the result, modify System Canon, or mutate the underlying investigation.", consequential: false }],
      protectedBoundaries: [boundary], blockers: [],
    }, snapshot);
  }

  return definition("layers.ready-to-run", {
    location: "LAYERS Laboratory",
    situation: "The required investigation state, comparison pair, and experimental layer configuration are ready.",
    significance: readiness?.selectedUnresolvedLayers.length ? `The laboratory can compute with ${readiness.selectedReadyLayerIds.length} READY selected layer(s); ${readiness.selectedUnresolvedLayers.map(layer => layer.label).join(", ")} remain selected but unresolved and will not participate.` : "The laboratory can now compute an immutable experimental result for inspection.",
    recommendedAction: action("layers.run-experiment", "Run experiment", LayersGuideTargetIds.RUN_EXPERIMENT),
    alternatives: [{ ...action("layers.review-layers", "Review or change the selected layers before running"), classification: GuideActionClassification.AVAILABLE }],
    consequences: [{ description: "The result remains experimental and non-canonical until deliberately handled through the authorized research workflow.", consequential: true }],
    protectedBoundaries: [{ description: "The result is experimental, not accepted knowledge, and System Canon remains unchanged." }], blockers: [], showMeTargetId: LayersGuideTargetIds.RUN_EXPERIMENT,
  }, snapshot);
}

export function isLayersSnapshot(snapshot: Readonly<GuideContextSnapshot>): boolean {
  return snapshot.activeMode === "LAYERS";
}

export const LAYERS_GUIDE_EPISTEMIC_BOUNDARIES = Object.freeze([
  GuideEpistemicClassification.EXPERIMENTAL,
  GuideEpistemicClassification.NON_CANONICAL,
  GuideEpistemicClassification.UNRESOLVED,
]);

export const LAYERS_GUIDE_SELECTION_INPUT = GuideSelectionClassification.CANDIDATE;
