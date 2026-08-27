// ============================================================
// src/investigationControl/InvestigationControl.tsx
// P57-UI-A4
// INVESTIGATION LIBRARY AND CASE INTAKE PANEL
//
// Responsibilities:
//
//   • Own operator mode (Explore / Compute)
//   • Identify the Investigation Library surface
//   • Route to the active operator panel
//
// Presentation and routing only.
// No computation or investigation data ownership.
// ============================================================

import { useState } from "react";

import {
  InvestigationMode,
} from "./InvestigationMode";

import ExplorePanel from "./ExplorePanel";
import ComputePanel from "./ComputePanel";

import "./InvestigationControl.css";

// ============================================================
// COMPONENT
// ============================================================

export default function InvestigationControl() {
  const [
    mode,
    setMode,
  ] = useState<InvestigationMode>(
    InvestigationMode.EXPLORE
  );

  return (
    <div className="investigation-library">

      {/* ===================================================== */}
      {/* PANEL IDENTITY */}
      {/* ===================================================== */}

      <header className="investigation-library__header">
        <div className="investigation-library__eyebrow">
          Case intake
        </div>

        <div className="investigation-library__title">
          Investigation Library
        </div>

        <div className="investigation-library__description">
          Browse, inspect, and bring cases into the active
          investigation.
        </div>
      </header>

      {/* ===================================================== */}
      {/* OPERATOR MODES */}
      {/* ===================================================== */}

      <div
        className="investigation-library__modes"
        role="group"
        aria-label="Investigation Library mode"
      >
        <ModeTab
          label="Explore"
          active={
            mode === InvestigationMode.EXPLORE
          }
          onClick={() =>
            setMode(
              InvestigationMode.EXPLORE
            )
          }
        />

        <ModeTab
          label="Compute"
          active={
            mode === InvestigationMode.COMPUTE
          }
          onClick={() =>
            setMode(
              InvestigationMode.COMPUTE
            )
          }
        />
      </div>

      {/* ===================================================== */}
      {/* ACTIVE PANEL */}
      {/* ===================================================== */}

      <div className="investigation-library__panel">
        {
          mode === InvestigationMode.EXPLORE
            ? <ExplorePanel />
            : <ComputePanel />
        }
      </div>

    </div>
  );
}

// ============================================================
// MODE TAB
// ============================================================

function ModeTab({
  label,
  active,
  onClick,
}: {
  label: string;
  active: boolean;
  onClick: () => void;
}) {
  const className = [
    "investigation-library__mode",
    active
      ? "investigation-library__mode--active"
      : "",
  ]
    .filter(Boolean)
    .join(" ");

  return (
    <button
      type="button"
      className={className}
      aria-pressed={active}
      onClick={onClick}
    >
      {label}
    </button>
  );
}