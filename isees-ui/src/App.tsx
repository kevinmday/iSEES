// ============================================================
// src/App.tsx
// OPERATOR CONSOLE BRIDGE (V7)
// P30.1 INVESTIGATION CONTROL FOUNDATION
// SYSTEM CANON ARCHITECTURE
//
// The left side of the operator console is now owned by
// Investigation Control.
//
// Explore Mode
//   Constructs investigations.
//
// Compute Mode
//   Defines the computational universe.
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

// ============================================================
// OPERATOR UI
// P30.1
// INVESTIGATION CONTROL FOUNDATION
//
// The left side of the operator console is now owned by
// Investigation Control.
//
// Explore Mode
//   Investigation construction.
//
// Compute Mode
//   Computational universe definition.
//
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