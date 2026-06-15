import { useWorkspace }
  from "../workspace/context/WorkspaceContext";

export default function WorkspacePanel() {

  const {
    activeWorkspace,
  } = useWorkspace();

  return (

    <div className="panel">

      <h3>Workspace</h3>

      <p>
        {activeWorkspace.name}
      </p>

      <hr />

      <h4>Imported Events</h4>

      {activeWorkspace.imported_events.length === 0 ? (

        <p>No events imported.</p>

      ) : (

        <ul>

          {activeWorkspace.imported_events.map(
            event => (

              <li key={event.event_id}>
                {event.event_id}
              </li>

            )
          )}

        </ul>

      )}

      <hr />

      <h4>Active Layers</h4>

      <ul>

        {activeWorkspace.active_layers.map(
          layer => (

            <li key={layer}>
              {layer}
            </li>

          )
        )}

      </ul>

    </div>

  );
}