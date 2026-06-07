import SurfaceBlock from "./SurfaceBlock";

export default function ActionsSurface({
  event,
}: {
  event: any;
}) {
  return (
    <SurfaceBlock title="Recommended Actions">
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          gap: 12,
        }}
      >
        {(
          event.operational_intelligence
            ?.recommended_actions || []
        ).map(
          (action: string, idx: number) => (
            <div
              key={idx}
              style={{
                padding: 12,
                border: "1px solid #1f2937",
                borderRadius: 8,
                background: "#0b1220",
                color: "#cbd5e1",
                fontSize: 13,
              }}
            >
              {action}
            </div>
          )
        )}

        {(
          event.operational_intelligence
            ?.recommended_actions || []
        ).length === 0 && (
          <div
            style={{
              padding: 12,
              border: "1px solid #1f2937",
              borderRadius: 8,
              background: "#0b1220",
              color: "#64748b",
              fontSize: 13,
              fontStyle: "italic",
            }}
          >
            No recommended actions available
          </div>
        )}
      </div>
    </SurfaceBlock>
  );
}