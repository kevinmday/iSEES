// ============================================================
// METRIC BOX
// ============================================================

export default function MetricBox({
  label,
  value,
}: {
  label: string;
  value: string | number;
}) {
  return (
    <div
      style={{
        border: "1px solid #1f2937",
        borderRadius: 8,
        padding: 14,
        background: "#08101f",
      }}
    >
      <div
        style={{
          fontSize: 10,
          color: "#6b7280",
          textTransform: "uppercase",
          letterSpacing: 1,
          marginBottom: 10,
        }}
      >
        {label}
      </div>

      <div
        style={{
          fontSize: 20,
          fontWeight: 700,
          color: "#d1d5db",
        }}
      >
        {value}
      </div>
    </div>
  );
}