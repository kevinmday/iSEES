// ============================================================
// src/App.tsx
// OPERATOR CONSOLE BRIDGE (V5 GRAPH INTEGRATED)
// P26.2 GRAPH CONTEXT FOUNDATION
// GRAPH PROVIDER REGISTERED
// FULL DROP-IN REPLACEMENT
// ============================================================

import { Routes, Route } from "react-router-dom";

import MainLayout from "./layout/MainLayout";

import RightPanel from "./components/RightPanel";
import EventRadar from "./components/EventRadar";
import InvestigationWorkspace from "./components/InvestigationWorkspace";

import PublicIntake from "./pages/PublicIntake";
import SystemBriefing from "./pages/SystemBriefing";

import { EventProvider } from "./context/EventContext";

import {
  WorkspaceProvider,
} from "./workspace/context/WorkspaceContext";

import {
  CorpusProvider,
} from "./corpus/context/CorpusContext";

import {
  GraphProvider,
} from "./manifold/context/GraphContext";

import CorpusBrowser from "./corpus/components/CorpusBrowser";
import CorpusResolutionPanel from "./corpus/components/CorpusResolutionPanel";

import GraphDiagnostics from "./graph/GraphDiagnostics";
import GraphSurface from "./graph/GraphSurface";

// ============================================================
// OPERATOR UI
// ============================================================

function OperatorUI() {

  return (

    <CorpusProvider>

      <WorkspaceProvider>

        <GraphProvider>

          <EventProvider>

            <MainLayout
              left={
                <>
                  <CorpusBrowser />

                  <GraphDiagnostics />

                  <GraphSurface />

                  <CorpusResolutionPanel />

                  <EventRadar />
                </>
              }
              center={
                <InvestigationWorkspace />
              }
              right={
                <RightPanel />
              }
            />

          </EventProvider>

        </GraphProvider>

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