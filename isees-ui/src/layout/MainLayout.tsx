// ============================================================
// src/layout/MainLayout.tsx — BALANCED PANELS (CENTERED FIX)
// FULL DROP-IN REPLACEMENT
// ============================================================

export default function MainLayout({ left, center, right }: any) {
  return (
    <div
      style={{
        display: "flex",
        height: "100%",
        background: "#0b0f1a",
        color: "white",
        overflow: "hidden"
      }}
    >
      {/* LEFT PANEL */}
      <div
        style={{
          width: 240,                 // 🔥 slightly wider (optical balance)
          borderRight: "1px solid #222",
          padding: 10,                // 🔥 normalized padding
          overflowY: "auto"
        }}
      >
        {left}
      </div>

      {/* CENTER PANEL */}
      <div
        style={{
          flex: 1,
          padding: 10,                // 🔥 MATCH LEFT/RIGHT (fixes drift)
          display: "flex",            // 🔥 enables true centering
          justifyContent: "center",   // 🔥 horizontal center
          alignItems: "flex-start",   // keep content top-aligned
          overflowY: "auto"
        }}
      >
        <div
          style={{
            width: "100%",
            maxWidth: 900,            // 🔥 constrains content for visual center
            textAlign: "center"       // 🔥 aligns Active Event block
          }}
        >
          {center}
        </div>
      </div>

      {/* RIGHT PANEL */}
      <div
        style={{
          width: 260,                 // 🔥 reduced from 300 (balances layout)
          borderLeft: "1px solid #222",
          padding: 10,                // 🔥 normalized
          overflowY: "auto"
        }}
      >
        {right}
      </div>
    </div>
  );
}