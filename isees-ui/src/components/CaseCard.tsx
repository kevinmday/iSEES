// ============================================================
// src/components/CaseCard.tsx — SAFE HYBRID VERSION
// ============================================================

type CaseItem = {
  id: number;
  name: string;
  status: string;
};

type Report = {
  event?: string;
  mode?: string;
  gap_type?: string;
  recommended_actions?: string[];
  top_vectors?: { phrase: string; score: number }[];
};

type Props = {
  caseItem?: CaseItem;
  report?: Report;
};

export default function CaseCard({ caseItem, report }: Props) {
  // ----------------------------------------------------------
  // NO DATA
  // ----------------------------------------------------------
  if (!caseItem && !report) {
    return <div>Select a case</div>;
  }

  // ----------------------------------------------------------
  // FALLBACK: USING caseItem (CURRENT STATE)
  // ----------------------------------------------------------
  if (!report && caseItem) {
    return (
      <div style={{ padding: "10px" }}>
        <h2>{caseItem.name}</h2>

        <div
          style={{
            background: "#333",
            padding: 10,
            marginBottom: 10
          }}
        >
          STATUS: {caseItem.status}
        </div>

        <div style={{ opacity: 0.6 }}>
          Case ID: {caseItem.id}
        </div>
      </div>
    );
  }

  // ----------------------------------------------------------
  // FULL REPORT MODE (FUTURE BACKEND)
  // ----------------------------------------------------------
  return (
    <div style={{ padding: "10px" }}>
      <h1>{report?.event || "Unknown Event"}</h1>

      <div
        style={{
          background: report?.mode === "RESOLVED" ? "green" : "darkred",
          padding: 10,
          marginBottom: 10
        }}
      >
        MODE: {report?.mode || "N/A"}
      </div>

      <div
        style={{
          background: "#665500",
          padding: 10,
          marginBottom: 20
        }}
      >
        GAP TYPE: {report?.gap_type || "N/A"}
      </div>

      <h3>Recommended Actions</h3>
      <ul>
        {report?.recommended_actions?.map((a, i) => (
          <li key={i}>{a}</li>
        )) || <li>No actions</li>}
      </ul>

      <h3>Top Search Vectors</h3>
      <ul>
        {report?.top_vectors?.map((v, i) => (
          <li key={i}>
            {v.phrase} | {v.score}
          </li>
        )) || <li>No vectors</li>}
      </ul>
    </div>
  );
}