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
} from "react";

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

import PublicIntake
  from "./pages/PublicIntake";

import SystemBriefing
  from "./pages/SystemBriefing";

import {

  OperatorIdentityRuntimeProvider,
  useOperatorIdentity,

} from "./identity/runtime/OperatorIdentityRuntimeContext";

import {

  OperatorEntryGate,

} from "./identity/components/OperatorEntryGate";

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

function OperatorUI() {

  return (

    <CorpusProvider>

      <WorkspaceProvider>

        <WorkspaceRuntimeProvider>

          <OperatorSessionRuntimeProvider>

            <ResolveRuntimeProvider>

              <KnowledgeObjectRuntimeProvider>

                <LayersExperimentRuntimeProvider>

                <ResearchBridgeProvider>

                  <AuthorDocumentRuntimeProvider>

                    <GuestWorkspaceSessionLifecycleBridge />

                    <FederationProvider>

                      <IntelligenceBriefProvider>

                        <GraphProvider>

                          <EventProvider>

                            <LayersPresentationSelectionProvider>
                            <TimelineInspectionProvider>
                            <IntentionWorkspaceProvider>
                            <MainLayout

                              left={
                                <ModeAwareLeftPanel />
                              }

                              center={
                                <PrimarySurface />
                              }

                              right={
                                <ModeAwareRightPanel />
                              }

                            />
                            </IntentionWorkspaceProvider>
                            </TimelineInspectionProvider>
                            </LayersPresentationSelectionProvider>

                          </EventProvider>

                        </GraphProvider>

                      </IntelligenceBriefProvider>

                    </FederationProvider>

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

function OperatorApplication() {

  return (

    <OperatorIdentityRuntimeProvider>

      <OperatorEntryGate>

        <OperatorUI />

      </OperatorEntryGate>

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
          <PublicIntake />
        }
      />

      <Route
        path="/briefing"
        element={
          <SystemBriefing />
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

function ModeAwareLeftPanel() {
  const mode = useWorkspaceMode();
  return mode === WorkspaceMode.LAYERS
    ? <LayersLaboratoryNavigator />
    : mode === WorkspaceMode.TIMELINE
      ? <TimelineNavigator />
    : mode === WorkspaceMode.INTENTION
      ? <IntentionNavigator />
    : <InvestigationControl />;
}

function ModeAwareRightPanel() {
  const mode = useWorkspaceMode();
  return mode === WorkspaceMode.LAYERS
    ? <LayersExperimentalIntelligence />
    : mode === WorkspaceMode.TIMELINE
      ? <TimelineInspector />
    : mode === WorkspaceMode.INTENTION
      ? <IntentionInspector />
    : <RightPanel />;
}
