import { useLocation } from "react-router-dom";
import { useOperatorIdentity } from "../../identity/runtime/OperatorIdentityRuntimeContext.tsx";
import { useWorkspaceRuntime } from "../../workspace/runtime/WorkspaceRuntimeContext.tsx";
import { WorkspaceSelectionKind } from "../../workspace/runtime/WorkspaceRuntimeTypes.ts";
import { ResolveRuntimeStatus } from "../../resolve/runtime/ResolveRuntimeTypes.ts";
import { useResolveRuntimeState } from "../../resolve/runtime/ResolveRuntimeContext.tsx";
import { LayersExperimentStatus, useLayersExperimentState } from "../../layers/runtime/index.ts";
import { useResearchBridge, useResearchRevision } from "../../research/ResearchBridgeContext.tsx";
import {
  GUIDE_CONTEXT_SNAPSHOT_SCHEMA_ID, GUIDE_CONTEXT_SNAPSHOT_SCHEMA_VERSION,
  GuideComparisonClassification, GuideLayersExperimentClassification, GuidePresentationClassification,
  GuideResearchInboxClassification, GuideResolveClassification, GuideSelectionClassification,
  type GuideContextSnapshot,
} from "../contracts/index.ts";
import { useGuidePresentation } from "../presentation/GuidePresentationContext.tsx";
import { resolveGuideDefinition } from "../registry/GuideDefinitionRegistry.ts";
import IseesGuidePanel from "../components/IseesGuidePanel.tsx";
import { CanonicalLayerCatalog, CanonicalLayerReadiness } from "../../layers/catalog/index.ts";

const selectionClassification = (kind?: string) => kind === WorkspaceSelectionKind.NODE ? GuideSelectionClassification.NODE : kind === WorkspaceSelectionKind.EDGE ? GuideSelectionClassification.EDGE : kind === WorkspaceSelectionKind.CANDIDATE ? GuideSelectionClassification.CANDIDATE : GuideSelectionClassification.NONE;

export default function OperationalGuideContextAdapter() {
  const location = useLocation();
  const identity = useOperatorIdentity();
  const workspaceRuntime = useWorkspaceRuntime();
  const workspaceState = workspaceRuntime.getState();
  const workspace = workspaceRuntime.getWorkspace();
  const investigation = workspaceRuntime.getActiveInvestigation();
  const selection = workspaceRuntime.getSelection();
  const resolve = useResolveRuntimeState();
  const experiment = useLayersExperimentState();
  const research = useResearchBridge();
  void useResearchRevision();
  const { presentation } = useGuidePresentation();
  const inbox = research.projectInvestigation({ investigationId: investigation?.id });
  const currentResolve = resolve.currentExecution?.result;
  const resolveCurrent = Boolean(currentResolve && currentResolve.success && currentResolve.provenance.investigationId === investigation?.id);
  const selectionId = selection?.kind === WorkspaceSelectionKind.NODE ? selection.nodeId : selection?.kind === WorkspaceSelectionKind.EDGE ? selection.edgeId : selection?.kind === WorkspaceSelectionKind.CANDIDATE ? selection.candidateId : undefined;
  const experimentClass = experiment.status === LayersExperimentStatus.COMPLETE ? GuideLayersExperimentClassification.COMPLETE : experiment.status === LayersExperimentStatus.EXECUTING ? GuideLayersExperimentClassification.EXECUTING : experiment.status === LayersExperimentStatus.ERROR ? GuideLayersExperimentClassification.ERROR : experiment.status === LayersExperimentStatus.READY ? GuideLayersExperimentClassification.READY : GuideLayersExperimentClassification.EMPTY;
  const resolveClass = resolveCurrent ? GuideResolveClassification.RESOLVED : resolve.status === ResolveRuntimeStatus.EXECUTING ? GuideResolveClassification.EXECUTING : resolve.status === ResolveRuntimeStatus.ERROR ? GuideResolveClassification.FAILED : GuideResolveClassification.UNRESOLVED;

  const preparationIsCurrent = !experiment.scope && experiment.preparationInvestigationId === investigation?.id && experiment.preparationWorkspaceId === workspace?.id;
  const selectedLayerIds = Object.freeze([...(experiment.scope || preparationIsCurrent ? experiment.armedLayers.map(layer => layer.id) : workspace?.active_layers ?? [])]);
  const selectedDefinitions = CanonicalLayerCatalog.filter(layer => selectedLayerIds.includes(layer.id));
  const snapshot: GuideContextSnapshot = Object.freeze({
    schemaId: GUIDE_CONTEXT_SNAPSHOT_SCHEMA_ID, schemaVersion: GUIDE_CONTEXT_SNAPSHOT_SCHEMA_VERSION,
    route: location.pathname, identity: identity.identity?.kind ?? "NONE", workspaceStatus: workspaceState.status,
    activeMode: workspaceState.operator.activeMode, layout: workspaceState.operator.layoutMode,
    activeWorkspaceId: workspace?.id, activeInvestigationId: investigation?.id, focusedEventId: workspace?.focused_event_id ?? undefined,
    selection: Object.freeze({ classification: selectionClassification(selection?.kind), identifier: selectionId }),
    comparison: Object.freeze({ classification: selection?.kind === WorkspaceSelectionKind.CANDIDATE && workspace?.focused_event_id ? GuideComparisonClassification.READY : GuideComparisonClassification.NONE, focusedEventId: workspace?.focused_event_id ?? undefined, candidateId: selection?.kind === WorkspaceSelectionKind.CANDIDATE ? selection.candidateId : undefined }),
    resolve: Object.freeze({ classification: resolveClass, executionId: resolveCurrent ? currentResolve?.executionId : undefined }),
    activeLayerIds: selectedLayerIds,
    layerReadiness: Object.freeze({
      selectedReadyLayerIds: Object.freeze(selectedDefinitions.filter(layer => layer.readiness === CanonicalLayerReadiness.READY).map(layer => layer.id)),
      selectedUnresolvedLayers: Object.freeze(selectedDefinitions.filter(layer => layer.readiness !== CanonicalLayerReadiness.READY).map(layer => Object.freeze({ layerId: layer.id, label: layer.label, readiness: layer.readiness as "INPUT_NEEDED" | "METHOD_NEEDED" | "BLOCKED", missingRequirements: Object.freeze([...layer.requiredCanonicalInputs]) }))),
    }),
    layersExperiment: Object.freeze({ classification: experimentClass, executionId: experiment.currentExecution?.executionId }),
    researchInbox: Object.freeze({ classification: inbox.entries.length ? GuideResearchInboxClassification.HAS_COLLECTED_FINDINGS : inbox.status === "NO_ACTIVE_INVESTIGATION" ? GuideResearchInboxClassification.NO_ACTIVE_INVESTIGATION : GuideResearchInboxClassification.EMPTY, newLeadCount: 0, incomingSourceCount: 0, collectedFindingCount: inbox.entries.length }),
    guidePresentation: presentation === "OPEN" ? GuidePresentationClassification.OPEN : GuidePresentationClassification.CLOSED,
  });
  const resolution = resolveGuideDefinition(snapshot);
  return <IseesGuidePanel key={JSON.stringify(snapshot)} resolution={resolution} />;
}
