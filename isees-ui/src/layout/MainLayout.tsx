// ============================================================
// src/layout/MainLayout.tsx — PER PANEL SCROLL FIX
// FULL DROP-IN REPLACEMENT
// ============================================================

export default function MainLayout({ left, center, right }: any) {
  return (
    <div
      style={{
        display: "flex",
        height: "100vh",
        background: "#0b0f1a",
        color: "white",
        overflow: "hidden" // prevents full-page scroll
      }}
    >
      {/* LEFT PANEL */}
      <div
        style={{
          width: 220,
          borderRight: "1px solid #222",
          padding: 10,
          overflowY: "auto" // independent scroll
        }}
      >
        {left}
      </div>

      {/* CENTER PANEL */}
      <div
        style={{
          flex: 1,
          padding: 20,
          overflowY: "auto" // independent scroll
        }}
      >
        {center}
      </div>

      {/* RIGHT PANEL */}
      <div
        style={{
          width: 300,
          borderLeft: "1px solid #222",
          padding: 10,
          overflowY: "auto" // independent scroll (critical fix)
        }}
      >
        {right}
      </div>
    </div>
  );
}