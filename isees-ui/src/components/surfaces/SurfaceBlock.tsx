export default function SurfaceBlock({
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