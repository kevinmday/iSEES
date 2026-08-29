import { CanonicalLayerRegistry } from "../manifold/layers/systemCanonLayers";
import { useWorkspaceRuntime } from "../workspace/runtime/WorkspaceRuntimeContext";

export default function ManifoldLayerSelector() {
  const workspaceRuntime = useWorkspaceRuntime();
  const activeLayers = workspaceRuntime.getActiveLayers();

  const canonicalLayerIds = new Set(
    CanonicalLayerRegistry.map((layer) => layer.id),
  );

  const activeLayerIds = new Set(activeLayers);

  const canonicalActiveCount = CanonicalLayerRegistry.filter((layer) =>
    activeLayerIds.has(layer.id),
  ).length;

  const unregisteredActiveLayers = activeLayers.filter(
    (layerId) => !canonicalLayerIds.has(layerId),
  );

  const toggleLayer = (layerId: string) => {
    const nextActiveIds = new Set(activeLayers);

    if (nextActiveIds.has(layerId)) {
      nextActiveIds.delete(layerId);
    } else {
      nextActiveIds.add(layerId);
    }

    /*
     * Emit registered layers in canonical registry order.
     * Preserve any pre-existing unregistered identifiers so this UI
     * never silently destroys restored or legacy investigation state.
     */
    const nextCanonicalLayers = CanonicalLayerRegistry.filter((layer) =>
      nextActiveIds.has(layer.id),
    ).map((layer) => layer.id);

    const preservedUnregisteredLayers = activeLayers.filter(
      (activeLayerId) => !canonicalLayerIds.has(activeLayerId),
    );

    workspaceRuntime.setActiveLayers([
      ...nextCanonicalLayers,
      ...preservedUnregisteredLayers,
    ]);
  };

  return (
    <section
      aria-labelledby="manifold-layer-selector-title"
      style={{
        display: "flex",
        flexDirection: "column",
        gap: "12px",
      }}
    >
      <header>
        <h3
          id="manifold-layer-selector-title"
          style={{
            margin: 0,
            color: "#eef3ff",
            fontSize: "14px",
            letterSpacing: "0.08em",
            textTransform: "uppercase",
          }}
        >
          Active Manifold Layers
        </h3>

        <p
          style={{
            margin: "6px 0 0",
            color: "#8f9bb3",
            fontSize: "12px",
            lineHeight: 1.5,
          }}
        >
          Shared projection context for MANIFOLD, LAYERS, COMPARE, and
          downstream Resolve operations.
        </p>
      </header>

      <div
        role="group"
        aria-label="Canonical manifold layers"
        style={{
          display: "flex",
          flexDirection: "column",
          gap: "8px",
        }}
      >
        {CanonicalLayerRegistry.map((layer) => {
          const isActive = activeLayerIds.has(layer.id);

          return (
            <button
              key={layer.id}
              type="button"
              aria-pressed={isActive}
              aria-label={`${isActive ? "Deactivate" : "Activate"} ${
                layer.name
              } layer`}
              onClick={() => toggleLayer(layer.id)}
              style={{
                width: "100%",
                padding: "10px 12px",
                border: isActive
                  ? "1px solid #66b9ef"
                  : "1px solid #273249",
                borderRadius: "8px",
                background: isActive
                  ? "rgba(55, 143, 204, 0.16)"
                  : "rgba(15, 22, 37, 0.72)",
                color: isActive ? "#eef7ff" : "#9aa6bc",
                font: "inherit",
                textAlign: "left",
                cursor: "pointer",
              }}
            >
              <span
                aria-hidden="true"
                style={{
                  display: "inline-block",
                  width: "8px",
                  height: "8px",
                  marginRight: "9px",
                  borderRadius: "50%",
                  background: isActive ? "#76d6ff" : "#536078",
                  boxShadow: isActive
                    ? "0 0 8px rgba(118, 214, 255, 0.75)"
                    : "none",
                }}
              />

              <strong>{layer.name}</strong>
            </button>
          );
        })}
      </div>

      <footer
        style={{
          paddingTop: "10px",
          borderTop: "1px solid #222c40",
          color: "#8f9bb3",
          fontSize: "11px",
          lineHeight: 1.5,
        }}
      >
        <div>
          {canonicalActiveCount} / {CanonicalLayerRegistry.length} canonical
          layers active
        </div>

        {unregisteredActiveLayers.length > 0 && (
          <div style={{ color: "#d5ad68", marginTop: "4px" }}>
            {unregisteredActiveLayers.length} unregistered legacy layer
            {unregisteredActiveLayers.length === 1 ? "" : "s"} preserved
          </div>
        )}
      </footer>
    </section>
  );
}
