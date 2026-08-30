// ============================================================
// src/investigationControl/InvestigationControl.tsx
// P57-UI-A5-I4B
// MODE-AWARE LEFT-PANEL COMPOSITION
//
// OVERVIEW and non-specialized modes:
//   Investigation Library / Case Intake
//
// MANIFOLD:
//   Canonical MANIFOLD Navigator
//
// Presentation and routing only.
//
// WorkspaceRuntime remains the canonical owner of:
//   - active workspace mode
//   - investigation
//   - computational configuration C = (L,T,S)
//
// This component creates no duplicate computational state.
// ============================================================

import {
  useState,
} from "react";

import {
  useWorkspaceMode,
} from "../workspace/runtime/WorkspaceRuntimeContext";

import {
  WorkspaceMode,
} from "../workspace/runtime/WorkspaceRuntimeTypes";

import {
  InvestigationMode,
} from "./InvestigationMode";

import ExplorePanel
  from "./ExplorePanel";

import ComputePanel
  from "./ComputePanel";

import "./InvestigationControl.css";

// ============================================================
// COMPONENT
// ============================================================

export default function InvestigationControl() {

  const workspaceMode =
    useWorkspaceMode();

  const [
    investigationMode,
    setInvestigationMode,
  ] = useState<InvestigationMode>(
    InvestigationMode.EXPLORE
  );

  // ==========================================================
  // MANIFOLD NAVIGATOR
  // ==========================================================

  if (
    workspaceMode ===
      WorkspaceMode.MANIFOLD
  ) {

    return (
      <ManifoldNavigator />
    );

  }

  // ==========================================================
  // INVESTIGATION LIBRARY
  // ==========================================================
  //
  // OVERVIEW is the canonical home of Case Intake.
  //
  // Other modes retain the Investigation Library until their
  // specialized navigation contracts are introduced.
  // ==========================================================

  return (

    <div className="investigation-library">

      {/* ===================================================== */}
      {/* PANEL IDENTITY                                        */}
      {/* ===================================================== */}

      <header className="investigation-library__header">

        <div className="investigation-library__eyebrow">
          Case Intake
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
      {/* INVESTIGATION WORKFLOW                                */}
      {/* ===================================================== */}

      <div
        className="investigation-library__modes"
        role="group"
        aria-label="Investigation Library mode"
      >

        <ModeTab
          label="Explore"
          active={
            investigationMode ===
              InvestigationMode.EXPLORE
          }
          onClick={() =>
            setInvestigationMode(
              InvestigationMode.EXPLORE
            )
          }
        />

        <ModeTab
          label="Compute"
          active={
            investigationMode ===
              InvestigationMode.COMPUTE
          }
          onClick={() =>
            setInvestigationMode(
              InvestigationMode.COMPUTE
            )
          }
        />

      </div>

      {/* ===================================================== */}
      {/* ACTIVE LIBRARY PANEL                                  */}
      {/* ===================================================== */}

      <div className="investigation-library__panel">

        {
          investigationMode ===
            InvestigationMode.EXPLORE
              ? <ExplorePanel />
              : <ComputePanel />
        }

      </div>

    </div>

  );

}

// ============================================================
// MANIFOLD NAVIGATOR
// ============================================================

function ManifoldNavigator() {

  return (

    <div
      className={[
        "investigation-library",
        "investigation-library--manifold",
      ].join(" ")}
    >

      <header className="investigation-library__header">

        <div className="investigation-library__eyebrow">
          Projection Context
        </div>

        <div className="investigation-library__title">
          MANIFOLD Navigator
        </div>

        <div className="investigation-library__description">
          Inspect the deterministic configuration and lineage
          governing the active Investigation Manifold.
        </div>

      </header>

      <div className="investigation-library__panel">
        <ComputePanel />
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