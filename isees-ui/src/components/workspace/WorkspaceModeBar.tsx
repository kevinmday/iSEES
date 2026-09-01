// ============================================================
// src/components/workspace/WorkspaceModeBar.tsx
// Canon v1
// P57-UI-A3
// OPERATOR WORKSPACE MODE BAR
//
// Persistent operator workspace selector.
//
// Presentation is governed by Canon v1 through the locally
// scoped WorkspaceModeBar stylesheet.
//
// Runtime ownership remains external.
//
// WorkspaceRuntime owns:
//   - active Workspace Mode
//   - mode transitions
//   - revision publication
//
// This component:
//   - owns no mode state
//   - performs no mode computation
//   - preserves canonical mode order
//   - projects semantic operator controls
//
// ============================================================

import {
  useWorkspaceRuntime,
} from "../../workspace/runtime/WorkspaceRuntimeContext";

import {
  WorkspaceMode,
} from "../../workspace/runtime/WorkspaceRuntimeTypes";

import {
  getWorkspaceModeLabel,
} from "../../workspace/presentation/WorkspaceModePresentation";

import "./WorkspaceModeBar.css";


// ============================================================
// MODES
// ============================================================

const MODES = [

  WorkspaceMode.OVERVIEW,

  WorkspaceMode.MANIFOLD,

  WorkspaceMode.COMPARE,

  WorkspaceMode.NARRATIVE,

  WorkspaceMode.EVIDENCE,

  WorkspaceMode.TIMELINE,

  WorkspaceMode.LAYERS,

  WorkspaceMode.INTENTION,

  WorkspaceMode.RESEARCH,

] as const;




// ============================================================
// COMPONENT
// ============================================================

export default function WorkspaceModeBar() {

  const runtime =
    useWorkspaceRuntime();

  const activeMode =
    runtime.getActiveMode();


  return (

    <nav

      className="isees-modebar"

      aria-label="Operator workspace modes"

    >

      {MODES.map((mode) => {

        const active =
          activeMode === mode;

        const availability =
          runtime.getModeAvailability(
            mode,
          );

        const className = active
          ? (
              "isees-modebar__button " +
              "isees-modebar__button--active"
            )
          : "isees-modebar__button";


        return (

          <button

            key={mode}

            type="button"

            className={className}

            aria-pressed={active}

            aria-disabled={
              !availability.available
            }

            disabled={
              !availability.available
            }

            title={
              availability.reason
            }

            onClick={() => {

              runtime.setActiveMode(
                mode,
              );

            }}

          >

            {getWorkspaceModeLabel(mode)}

          </button>

        );

      })}

    </nav>

  );

}