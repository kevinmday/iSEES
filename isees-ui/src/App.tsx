// ============================================================
// src/App.tsx
// OPERATOR CONSOLE BRIDGE (V8)
// P35
// WORKSPACE RUNTIME INTEGRATION
//
// The Workspace Runtime is now introduced as the deterministic
// Investigation Session owner.
//
// Ownership:
//
// Corpus
//      ↓
// Workspace
//      ↓
// Workspace Runtime
//      ↓
// Federation
//      ↓
// Intelligence
//      ↓
// Graph
//      ↓
// Event
//      ↓
// MainLayout
//
// The Workspace Runtime composes deterministic runtime
// subsystems while remaining independent of computation.
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
          <OperatorUI />
        }
      />

    </Routes>

  );

}