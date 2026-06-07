function SurfaceBlock({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div
      style={{
        border: "1px solid #1f2937",
        borderRadius: 10,
        padding: 18,
        background: "#08101f",
      }}
    >
      <div
        style={{
          fontSize: 13,
          fontWeight: 700,
          textTransform: "uppercase",
          letterSpacing: 1,
          marginBottom: 18,
        }}
      >
        {title}
      </div>

      {children}
    </div>
  );
}

export default function ResearchSurface({
  event,
}: {
  event: any;
}) {
  return (
    <SurfaceBlock title="Research Vectors">
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          gap: 12,
        }}
      >
        {(
          event.operational_intelligence
            ?.investigation_vectors || []
        ).map(
          (vector: string, idx: number) => (
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
              {vector}
            </div>
          )
        )}

        {(
          event.operational_intelligence
            ?.investigation_vectors || []
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
            No research vectors available
          </div>
        )}
      </div>
    </SurfaceBlock>
  );
}