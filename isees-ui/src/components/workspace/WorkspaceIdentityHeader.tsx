import {
  useWorkspaceRuntime,
} from "../../workspace/runtime/WorkspaceRuntimeContext";

import {
  getWorkspaceModeLabel,
} from "../../workspace/presentation/WorkspaceModePresentation";
import { WorkspaceMode } from "../../workspace/runtime/WorkspaceRuntimeTypes";
import { useOverviewSelection } from "../../workspace/surfaces/overview/OverviewSelectionContext";

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

  if (mode === WorkspaceMode.LIBRARY) {
    return <LibraryWorkspaceIdentity />;
  }

  if (mode === WorkspaceMode.OVERVIEW) {
    return (
      <header className="workspace-identity workspace-identity--overview" aria-label="Overview workspace identity">
        <h1 className="workspace-identity__title">
          <span className="workspace-identity__mode">OVERVIEW</span>
          <span className="workspace-identity__separator" aria-hidden="true">—</span>
          <span className="workspace-identity__investigation">{investigationName}</span>
        </h1>
      </header>
    );
  }

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

function LibraryWorkspaceIdentity() {
  const runtime = useWorkspaceRuntime();
  const { selection } = useOverviewSelection();
  const investigation = runtime.getActiveInvestigation();
  const sessionLocal = investigation !== undefined && investigation.createdBy !== "AUTHENTICATED_RESEARCHER";
  const preview = selection.kind === "CANON_EVENT" ? `${selection.title} · ${selection.eventId}`
    : selection.kind === "EXTERNAL_REPOSITORY" ? selection.name
    : selection.kind === "OWNED_INVESTIGATION" ? selection.title
    : null;

  return <header className="workspace-identity workspace-identity--library" aria-label="Library workspace identity">
    <div className="workspace-identity__primary">
      <div className="workspace-identity__eyebrow">{investigation === undefined ? "No Active Investigation" : sessionLocal ? "Session-Local Investigation" : "Active Investigation"}</div>
      <h1 className="workspace-identity__title"><span className="workspace-identity__mode">LIBRARY</span><span className="workspace-identity__separator" aria-hidden="true">—</span><span className="workspace-identity__investigation">{investigation?.name ?? "Choose or create an investigation"}</span></h1>
    </div>
    <div className="workspace-identity__focus workspace-identity__preview">
      <span className="workspace-identity__focus-label">Previewing</span>
      <span className="workspace-identity__focus-value">{preview ?? "No record selected"}</span>
    </div>
  </header>;
}
