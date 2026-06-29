// ============================================================
// src/App.tsx
// OPERATOR CONSOLE BRIDGE (V6)
// P26.1 INTELLIGENCE BRIEF FOUNDATION
// FEDERATION + INTELLIGENCE PROVIDERS REGISTERED
// ============================================================

import { Routes, Route } from "react-router-dom";

import MainLayout from "./layout/MainLayout";

import RightPanel from "./components/RightPanel";
import EventRadar from "./components/EventRadar";
import PrimarySurface from "./surfaces/PrimarySurface";

import PublicIntake from "./pages/PublicIntake";
import SystemBriefing from "./pages/SystemBriefing";

import {
  EventProvider,
} from "./context/EventContext";

import {
  WorkspaceProvider,
} from "./workspace/context/WorkspaceContext";

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

import CorpusBrowser from "./corpus/components/CorpusBrowser";
import CorpusResolutionPanel from "./corpus/components/CorpusResolutionPanel";

import FederationPreviewPanel
  from "./federation/components/FederationPreviewPanel";

import GraphDiagnostics from "./graph/GraphDiagnostics";


// ============================================================
// OPERATOR UI
// ============================================================

function OperatorUI() {

  return (

    <CorpusProvider>

      <WorkspaceProvider>

        <FederationProvider>

          <IntelligenceBriefProvider>

            <GraphProvider>

              <EventProvider>

                <MainLayout

                  left={
                    <>

                      <CorpusBrowser />

                      <FederationPreviewPanel />

                      <GraphDiagnostics />

                      
                      <CorpusResolutionPanel />

                      <EventRadar />

                    </>
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

      </WorkspaceProvider>

    </CorpusProvider>

  );

}

// ============================================================
// ROOT APP
// ============================================================

export default function App() {

  return (

    <Routes>

      <Route
        path="/report"
        element={<PublicIntake />}
      />

      <Route
        path="/briefing"
        element={<SystemBriefing />}
      />

      <Route
        path="/*"
        element={<OperatorUI />}
      />

    </Routes>

  );

}