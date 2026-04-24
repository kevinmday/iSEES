// ============================================================
// src/components/CaseList.tsx — CORRECTED + STABLE VERSION
// ============================================================

type CaseItem = {
  id: number;
  name: string;
  status: string;
};

type Props = {
  cases: CaseItem[];
  selected: CaseItem | null;
  onSelect: (c: CaseItem) => void;
};

export default function CaseList({ cases, selected, onSelect }: Props) {
  // --------------------------------------------
  // SAFETY GUARD
  // --------------------------------------------
  if (!Array.isArray(cases) || cases.length === 0) {
    return <div style={{ opacity: 0.7 }}>No cases</div>;
  }

  return (
    <div>
      {/* HEADER */}
      <h3 style={{ marginBottom: 10 }}>Cases</h3>

      {/* CASE LIST */}
      {cases.map((c) => {
        const isSelected = selected ? selected.id === c.id : false;

        return (
          <div
            key={c.id}
            onClick={() => onSelect && onSelect(c)}
            style={{
              padding: 10,
              marginBottom: 6,
              cursor: "pointer",
              background: isSelected ? "#3a3a3a" : "#111",
              border: isSelected ? "1px solid #666" : "1px solid #222",
              borderRadius: 4
            }}
          >
            <div style={{ fontWeight: 500 }}>{c.name}</div>
            <div style={{ fontSize: 12, opacity: 0.6 }}>
              {c.status}
            </div>
          </div>
        );
      })}

      {/* SAVED (placeholder hook — won't break anything now) */}
      <div style={{ marginTop: 20 }}>
        <h4 style={{ marginBottom: 6 }}>Saved</h4>
        <div style={{ fontSize: 13, opacity: 0.7 }}>
          No saved cases
        </div>
      </div>
    </div>
  );
}