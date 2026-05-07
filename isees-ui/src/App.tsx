// ============================================================
// src/App.tsx — OPERATOR CONSOLE BRIDGE (V3 CONTEXT WIRED)
// FULL DROP-IN REPLACEMENT
// ============================================================

import { Routes, Route } from "react-router-dom";

import MainLayout from "./layout/MainLayout";

import RightPanel from "./components/RightPanel";
import EventRadar from "./components/EventRadar";
import InvestigationWorkspace from "./components/InvestigationWorkspace";

import PublicIntake from "./pages/PublicIntake";

import { EventProvider } from "./context/EventContext";

// ============================================================
// OPERATOR UI
// ============================================================

function OperatorUI() {
  return (
    <EventProvider>
      <MainLayout
        left={<EventRadar />}

        center={<InvestigationWorkspace />}

        right={<RightPanel />}
      />
    </EventProvider>
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
        path="/*"
        element={<OperatorUI />}
      />
    </Routes>
  );
}