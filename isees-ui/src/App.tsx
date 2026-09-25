// ============================================================
// src/App.tsx
// OPERATOR CONSOLE BRIDGE (V8)
// P35
// WORKSPACE RUNTIME INTEGRATION
//
// P56D-I1
// OPERATOR IDENTITY ENTRY INTEGRATION
//
// P56D-I1-G2
// GUEST WORKSPACE SESSION LIFECYCLE INTEGRATION
//
// Identity is established before the operational application
// mounts.
//
// NONE
//   -> Operator Entry Screen
//
// GUEST
//   -> Full operational iSEES
//   -> Guest workspace session lifecycle ACTIVE
//
// ACCOUNT
//   -> Full operational iSEES
//   -> Guest workspace session lifecycle STOPPED
//
// Account changes persistence, not capability.
//
// AuthorDocumentRuntimeProvider is operationally persistent.
// Studio is a projection of Author runtime state and therefore
// does not own the Author runtime provider.
//
// ============================================================

import {
  useEffect,
  useRef,
  type ReactNode,
} from "react";
import { AccountFrontDoor, type AccountNavigationGuard } from "./account/AccountFrontDoor";
import { GuestWorkspaceRestorationBoundary } from "./workspace/persistence/GuestWorkspaceRestorationBoundary";

import {
  Routes,
  Route,
} from "react-router-dom";

import MainLayout
  from "./layout/MainLayout";

import RightPanel
  from "./components/RightPanel";

import PrimarySurface
  from "./surfaces/PrimarySurface";

import {
  InvestigationControl,
} from "./investigationControl";

import { NativeCaseDraftWorkspace } from "./nativeCaseDraft/NativeCaseDraftWorkspace";

import SystemBriefing
  from "./pages/SystemBriefing";
import IseesCaptureInfo from "./companion/capture/IseesCaptureInfo";

import {

  OperatorIdentityRuntimeProvider,
  useOperatorIdentity,

} from "./identity/runtime/OperatorIdentityRuntimeContext";
import { OperatorEntryGate } from "./identity/components/OperatorEntryGate";

import {
  InvestigationLibraryRuntimeProvider,
} from "./investigation/library/InvestigationLibraryRuntimeContext";
import { OverviewSelectionProvider } from "./workspace/surfaces/overview/OverviewSelectionContext";
import { OverviewCanonicalActivationProvider } from "./workspace/surfaces/overview/OverviewCanonicalActivationContext";
import { LibraryNavigationProvider } from "./workspace/surfaces/LibraryWorkspace";
import { useLibraryNavigation } from "./workspace/surfaces/LibraryWorkspace";
import { consumePublicOverviewLaunchIntent, PUBLIC_OVERVIEW_NIMITZ_EVENT_ID } from "./account/PublicOverviewLaunchIntent";
import { projectHydratedOverviewEvents } from "./workspace/surfaces/overview/OverviewEndStateModel";
import { useOverviewSelection } from "./workspace/surfaces/overview/OverviewSelectionContext";

import {
  EventProvider,
} from "./context/EventContext";

import {
  WorkspaceProvider,
} from "./workspace/context/WorkspaceContext";

import {
  WorkspaceRuntimeProvider,
} from "./workspace/runtime";

import {

  OperatorSessionRuntimeProvider,

} from "./session/runtime/OperatorSessionRuntimeContext";

import {
  FederationProvider,
} from "./federation/context/FederationContext";

import {
  IntelligenceBriefProvider,
} from "./intel/context/IntelligenceBriefContext";

import {
  CorpusProvider,
} from "./corpus/context/CorpusContext";

import {
  GraphProvider,
} from "./manifold/context/GraphContext";

import {
  ResearchBridgeProvider,
} from "./research/ResearchBridgeContext";
import { RexResearchInboxHydrator } from "./rex/RexResearchInboxHydrator";

import {

  ResolveRuntimeProvider,

} from "./resolve/runtime/ResolveRuntimeContext";

import {

  KnowledgeObjectRuntimeProvider,

} from "./knowledge/runtime/KnowledgeObjectRuntimeContext";

import { LayersExperimentRuntimeProvider } from "./layers/runtime";
import { LayersPresentationSelectionProvider } from "./layers/components/LayersPresentationSelection";
import LayersLaboratoryNavigator from "./layers/components/LayersLaboratoryNavigator";
import LayersExperimentalIntelligence from "./layers/components/LayersExperimentalIntelligence";
import TimelineNavigator from "./timeline/components/TimelineNavigator";
import TimelineInspector from "./timeline/components/TimelineInspector";
import { TimelineInspectionProvider } from "./timeline/context/TimelineInspectionContext";
import { WorkspaceMode } from "./workspace/runtime/WorkspaceRuntimeTypes";
import { useWorkspaceMode } from "./workspace/runtime/WorkspaceRuntimeContext";
import { IntentionWorkspaceProvider } from "./intention/runtime/IntentionWorkspaceContext";
import IntentionNavigator from "./intention/components/IntentionNavigator";
import IntentionInspector from "./intention/components/IntentionInspector";

import {

  AuthorDocumentRuntimeProvider,

} from "./author/runtime/AuthorDocumentRuntimeContext";
import { StudioSaveActionProvider } from "./studio/runtime/StudioSaveActionProvider";

import {

  guestWorkspaceSessionLifecycle,

} from "./workspace/persistence/GuestWorkspaceSessionLifecycle";


// ============================================================
// GUEST WORKSPACE SESSION LIFECYCLE BRIDGE
// ============================================================
//
// React owns no Guest workspace persistence state.
//
// This component connects the reactive operator identity boundary
// to the deterministic Guest workspace lifecycle.
//
// GUEST
//   -> lifecycle.start()
//
// ACCOUNT / NONE
//   -> lifecycle.stop()
//
// Component teardown
//   -> lifecycle.stop()
//
// The lifecycle itself owns:
//
//   - persisted snapshot restoration
//   - Workspace subscription
//   - Research subscription
//   - Author subscription
//   - canonical capture
//   - sessionStorage persistence
//
// The lifecycle does NOT own any of those runtime states.
//
// ============================================================

function GuestWorkspaceSessionLifecycleBridge() {

  const identityState =
    useOperatorIdentity();


  useEffect(
    () => {

      const identity =
        identityState.identity;


      if (
        identityState.status === "READY" &&
        identity?.kind === "GUEST" &&
        identityState.persistence === "SESSION"
      ) {

        guestWorkspaceSessionLifecycle.start();

      } else {

        guestWorkspaceSessionLifecycle.stop();

      }


      return () => {

        guestWorkspaceSessionLifecycle.stop();

      };

    },
    [
      identityState.status,
      identityState.identity,
      identityState.persistence,
    ],
  );


  return null;

}

function OwnershipAwareWorkspaceRestorationBoundary({ children }: { children: ReactNode }) {
  const identityState = useOperatorIdentity();

  // Cookie-restored account identity and its server-authorized activation own
  // this tree. Stale Guest browser state must not classify it as Guest work.
  if (
    identityState.status === "READY" &&
    identityState.identity?.kind === "ACCOUNT" &&
    identityState.persistence === "PERSISTENT"
  ) {
    return children;
  }

  return (
    <GuestWorkspaceRestorationBoundary>
      {children}
    </GuestWorkspaceRestorationBoundary>
  );
}


// ============================================================
// OPERATOR UI
// ============================================================
//
// The operational provider tree is identical for Guest and
// Account operators.
//
// Author runtime ownership is permanent at this level.
//
// WorkspaceSurface / StudioShell therefore project Author state
// but do not manufacture an Author runtime boundary.
//
// ============================================================

function OperatorUI({ routeSurface }: { routeSurface?: ReactNode }) {

  return (

    <CorpusProvider>

      <WorkspaceProvider>

        <WorkspaceRuntimeProvider>

          <OperatorSessionRuntimeProvider>

            <ResolveRuntimeProvider>

              <KnowledgeObjectRuntimeProvider>

                <LayersExperimentRuntimeProvider>

                <ResearchBridgeProvider>

                  <RexResearchInboxHydrator />

                  <AuthorDocumentRuntimeProvider>

                    <GuestWorkspaceSessionLifecycleBridge />

                    <StudioSaveActionProvider>

                    <FederationProvider>

                      <IntelligenceBriefProvider>

                        <GraphProvider>

                          <EventProvider>

                            <LayersPresentationSelectionProvider>
                            <TimelineInspectionProvider>
                            <IntentionWorkspaceProvider>
                            {routeSurface ?? <ModeAwareOperatorLayout />}
                            </IntentionWorkspaceProvider>
                            </TimelineInspectionProvider>
                            </LayersPresentationSelectionProvider>

                          </EventProvider>

                        </GraphProvider>

                      </IntelligenceBriefProvider>

                    </FederationProvider>

                    </StudioSaveActionProvider>

                  </AuthorDocumentRuntimeProvider>

                </ResearchBridgeProvider>

                </LayersExperimentRuntimeProvider>

              </KnowledgeObjectRuntimeProvider>

            </ResolveRuntimeProvider>

          </OperatorSessionRuntimeProvider>

        </WorkspaceRuntimeProvider>

      </WorkspaceProvider>

    </CorpusProvider>

  );

}


// ============================================================
// OPERATOR APPLICATION
// ============================================================
//
// The identity runtime and gate exist outside the operational
// provider stack.
//
// NONE:
//
//   OperatorUI is not mounted.
//
// GUEST:
//
//   OperatorUI mounts.
//   GuestWorkspaceSessionLifecycleBridge observes Guest identity.
//   Guest session restoration/persistence becomes active.
//
// ACCOUNT:
//
//   The exact same OperatorUI mounts.
//   Guest workspace persistence remains stopped.
//
// There is no Guest-specific application tree.
//
// ============================================================

function OperatorApplication({ nativeDraftRoute = false }: { nativeDraftRoute?: boolean }) {

  const navigationGuard = useRef<AccountNavigationGuard | null>(null);

  return (

    <OperatorIdentityRuntimeProvider>
      {/* <AccountFrontDoor> remains the single application composition authority;
          the optional ref only exposes the active /report discard guard to it. */}
      <AccountFrontDoor navigationGuard={nativeDraftRoute ? navigationGuard : undefined}>
        <OperatorEntryGate>
          <OwnershipAwareWorkspaceRestorationBoundary>
            <OperatorUI routeSurface={nativeDraftRoute ? <NativeCaseDraftWorkspace navigationGuard={navigationGuard} /> : undefined} />
          </OwnershipAwareWorkspaceRestorationBoundary>
        </OperatorEntryGate>
      </AccountFrontDoor>
    </OperatorIdentityRuntimeProvider>

  );

}


// ============================================================
// ROOT APPLICATION
// ============================================================

export default function App() {

  return (

    <Routes>

      <Route
        path="/report"
        element={
          <OperatorApplication nativeDraftRoute />
        }
      />

      <Route
        path="/briefing"
        element={
          <SystemBriefing />
        }
      />

      <Route
        path="/capture"
        element={
          <IseesCaptureInfo />
        }
      />

      <Route
        path="/*"
        element={
          <OperatorApplication />
        }
      />

    </Routes>

  );

}

function OperatorLayout() {
  return <MainLayout
    left={<ModeAwareLeftPanel />}
    center={
                                <ModeAwarePrimarySurface />
    }
    right={<ModeAwareRightPanel />}
  />;
}

function ModeAwarePrimarySurface() {
  return <PrimarySurface />;
}

function ModeAwareOperatorLayout() {
  return <LibraryNavigationProvider><ModeAwareOperatorLayoutContent /></LibraryNavigationProvider>;
}

function ModeAwareOperatorLayoutContent() {
  const mode = useWorkspaceMode();
  return mode === WorkspaceMode.OVERVIEW || mode === WorkspaceMode.LIBRARY
    ? (
      <InvestigationLibraryRuntimeProvider>
        <OverviewSelectionProvider>
          <OverviewCanonicalActivationProvider>
            <PublicOverviewLaunchBridge />
            <OperatorLayout />
          </OverviewCanonicalActivationProvider>
        </OverviewSelectionProvider>
      </InvestigationLibraryRuntimeProvider>
    )
    : <OperatorLayout />;
}

function PublicOverviewLaunchBridge() {
  const overview = useOverviewSelection();
  const library = useLibraryNavigation();
  useEffect(() => {
    const intent = consumePublicOverviewLaunchIntent();
    if (intent?.kind === "LIBRARY") { library.enter(false); return; }
    if (intent?.kind === "LIBRARY_INTAKE") { library.enter(true); return; }
    if (intent?.kind !== "LIBRARY_CANON_PREVIEW" || intent.eventId !== PUBLIC_OVERVIEW_NIMITZ_EVENT_ID) return;
    const event = projectHydratedOverviewEvents().find(candidate => candidate.eventId === intent.eventId);
    if (event === undefined) return;
    overview.selectCanonEvent(event);
    library.enter();
  }, [library, overview]);
  return null;
}

function ModeAwareLeftPanel() {
  const mode = useWorkspaceMode();
  return mode === WorkspaceMode.OVERVIEW
    ? <div className="overview-panel"><p className="overview-panel__eyebrow">Orientation</p><p>Learn the iSEES research flow, then enter LIBRARY to choose or create an investigation.</p></div>
    : mode === WorkspaceMode.LAYERS
    ? <LayersLaboratoryNavigator />
    : mode === WorkspaceMode.TIMELINE
      ? <TimelineNavigator />
    : mode === WorkspaceMode.INTENTION
      ? <IntentionNavigator />
    : <InvestigationControl />;
}

function ModeAwareRightPanel() {
  const mode = useWorkspaceMode();
  return mode === WorkspaceMode.OVERVIEW
    ? <div className="overview-panel"><p className="overview-panel__eyebrow">Operational boundary</p><p>Browsing, intake, previews, and investigation management are owned by LIBRARY.</p></div>
    : mode === WorkspaceMode.LAYERS
    ? <LayersExperimentalIntelligence />
    : mode === WorkspaceMode.TIMELINE
      ? <TimelineInspector />
    : mode === WorkspaceMode.INTENTION
      ? <IntentionInspector />
    : <RightPanel />;
}
