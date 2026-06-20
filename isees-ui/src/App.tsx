// ============================================================
// src/App.tsx — OPERATOR CONSOLE BRIDGE (V5 CORPUS INTEGRATED)
// P24.3 RESOLUTION SURFACE WIRED
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

import CorpusBrowser from "./corpus/components/CorpusBrowser";
import CorpusResolutionPanel from "./corpus/components/CorpusResolutionPanel";

// ============================================================
// OPERATOR UI
// ============================================================

function OperatorUI() {
  return (
    <CorpusProvider>

      <WorkspaceProvider>

        <EventProvider>

          <MainLayout
            left={
              <>
                <CorpusBrowser />
                <CorpusResolutionPanel />
                <EventRadar />
              </>
            }
            center={<InvestigationWorkspace />}
            right={<RightPanel />}
          />

        </EventProvider>

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

      {/* ========================================= */}
      {/* PUBLIC OBSERVER INTAKE                   */}
      {/* ========================================= */}

      <Route
        path="/report"
        element={<PublicIntake />}
      />

      {/* ========================================= */}
      {/* SYSTEM BRIEFING                          */}
      {/* ========================================= */}

      <Route
        path="/briefing"
        element={<SystemBriefing />}
      />

      {/* ========================================= */}
      {/* OPERATOR CONSOLE                         */}
      {/* ========================================= */}

      <Route
        path="/*"
        element={<OperatorUI />}
      />

    </Routes>
  );
}