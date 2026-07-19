// ============================================================
// src/manifold/components/GraphStatistics.tsx
// P41B
// GRAPH STATISTICS
//
// Presentation-only component.
//
// Owns
// • Statistics display
//
// Does NOT own
// • Graph computation
// • Runtime
// • Selection
// • Layout
//
// ============================================================

interface GraphStatisticsProps {

  nodeCount: number;

  edgeCount: number;

  eventCount: number;

}

// ============================================================
// STAT CARD
// ============================================================

function StatCard({
  label,
  value,
}: {
  label: string;
  value: number;
}) {

  return (

    <div
      style={{
        textAlign: "center",
      }}
    >

      <div
        style={{
          color: "#6b7280",
          fontSize: 11,
          textTransform: "uppercase",
        }}
      >

        {label}

      </div>

      <div
        style={{
          color: "#f3f4f6",
          fontSize: 18,
          fontWeight: 700,
        }}
      >

        {value}

      </div>

    </div>

  );

}

// ============================================================
// COMPONENT
// ============================================================

export default function GraphStatistics({
  nodeCount,
  edgeCount,
  eventCount,
}: GraphStatisticsProps) {

  return (

    <div
      style={{
        display: "flex",
        gap: 16,
      }}
    >

      <StatCard
        label="Nodes"
        value={nodeCount}
      />

      <StatCard
        label="Edges"
        value={edgeCount}
      />

      <StatCard
        label="Events"
        value={eventCount}
      />

    </div>

  );

}