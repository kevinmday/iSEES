// ============================================================
// src/components/CaseList.tsx — CORRECTED SAFE VERSION
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
  if (!Array.isArray(cases)) {
    return <div>No cases</div>;
  }

  return (
    <div>
      <h3>Cases</h3>

      {cases.map((c) => {
        const isSelected = selected ? selected.id === c.id : false;

        return (
          <div
            key={c.id}
            onClick={() => onSelect(c)}
            style={{
              padding: 8,
              marginBottom: 4,
              cursor: "pointer",
              background: isSelected ? "#333" : "transparent"
            }}
          >
            <div>{c.name}</div>
            <div style={{ fontSize: "12px", opacity: 0.6 }}>
              {c.status}
            </div>
          </div>
        );
      })}
    </div>
  );
}