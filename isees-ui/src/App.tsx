// ============================================================
// src/App.tsx
// OPERATOR CONSOLE BRIDGE (V8)
// P35
// WORKSPACE RUNTIME INTEGRATION
//
// P56D-I1
// OPERATOR IDENTITY ENTRY INTEGRATION
//
// Identity is established before the operational application
// mounts.
//
// NONE
//   -> Operator Entry Screen
//
// GUEST
//   -> Full operational iSEES
//
// ACCOUNT
//   -> Full operational iSEES
//
// Account changes persistence, not capability.
//
// ============================================================

import { Routes, Route } from "react-router-dom";

import MainLayout from "./layout/MainLayout";

import RightPanel from "./components/RightPanel";
import PrimarySurface from "./surfaces/PrimarySurface";

import {
  InvestigationControl,
} from "./investigationControl";

import PublicIntake from "./pages/PublicIntake";
import SystemBriefing from "./pages/SystemBriefing";

import {

  OperatorIdentityRuntimeProvider,

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


// ============================================================
// OPERATOR UI
// ============================================================

function OperatorUI() {

  return (

    <CorpusProvider>

      <WorkspaceProvider>

        <WorkspaceRuntimeProvider>

          <OperatorSessionRuntimeProvider>

            <ResolveRuntimeProvider>

              <KnowledgeObjectRuntimeProvider>

                <ResearchBridgeProvider>

                  <FederationProvider>

                    <IntelligenceBriefProvider>

                      <GraphProvider>

                        <EventProvider>

                          <MainLayout

                            left={
                              <InvestigationControl />
                            }

                            center={
                              <PrimarySurface />
                            }

                            right={
                              <RightPanel />
                            }

                          />

                        </EventProvider>

                      </GraphProvider>

                    </IntelligenceBriefProvider>

                  </FederationProvider>

                </ResearchBridgeProvider>

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
//   OperatorUI is not mounted.
//
// GUEST / ACCOUNT:
//   The exact same OperatorUI is mounted.
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