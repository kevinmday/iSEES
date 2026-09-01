import {
  useWorkspaceRuntime,
} from "../../workspace/runtime/WorkspaceRuntimeContext";

import {
  getWorkspaceModeLabel,
} from "../../workspace/presentation/WorkspaceModePresentation";

import "./WorkspaceIdentityHeader.css";

export default function WorkspaceIdentityHeader() {
  const runtime =
    useWorkspaceRuntime();

  const mode =
    runtime.getActiveMode();

  const investigation =
    runtime.getActiveInvestigation();

  const workspace =
    runtime.getWorkspace() ??
    investigation?.workspace;

  const focusedEventId =
    workspace?.focused_event_id ??
    null;

  const investigationName =
    investigation?.name ??
    "No Active Investigation";

  return (
    <header
      className="workspace-identity"
      aria-label="Active workspace identity"
    >
      <div className="workspace-identity__primary">
        <div className="workspace-identity__eyebrow">
          Active Workspace
        </div>

        <h1 className="workspace-identity__title">
          <span className="workspace-identity__mode">
            {getWorkspaceModeLabel(mode)}
          </span>

          <span
            className="workspace-identity__separator"
            aria-hidden="true"
          >
            —
          </span>

          <span className="workspace-identity__investigation">
            {investigationName}
          </span>
        </h1>
      </div>

      <div className="workspace-identity__focus">
        <span className="workspace-identity__focus-label">
          Focused EVENT
        </span>

        <span className="workspace-identity__focus-value">
          {focusedEventId ? investigationName : "None"}
        </span>

        {focusedEventId && (
          <span className="workspace-identity__focus-id">
            {focusedEventId}
          </span>
        )}
      </div>
    </header>
  );
}