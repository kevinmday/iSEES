// ============================================================
// src/components/CaseCard.tsx — STEP 22 (CONTRACT LOCKED)
// ============================================================

type CaseItem = {
  id: number;
  name: string;
  status: string;
};

type Report = {
  event?: string;

  // ----------------------------------------------------------
  // BACKEND TRUTH CONTRACT (LOCKED)
  // ----------------------------------------------------------
  gap_type?: string;
  data_complete?: boolean;
  actions_remaining?: boolean;

  // ----------------------------------------------------------
  // OUTPUTS
  // ----------------------------------------------------------
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
  // STATUS MODEL (CONTRACT-DRIVEN)
  // ----------------------------------------------------------
  const hasReport = !!report;

  // Fallback logic if backend not yet providing fields
  const fallbackHasGap = !!report?.gap_type;

  const actionsRemaining =
    report?.actions_remaining !== undefined
      ? report.actions_remaining
      : !fallbackHasGap;

  const dataComplete =
    report?.data_complete !== undefined
      ? report.data_complete
      : !fallbackHasGap;

  const caseStatus =
    !hasReport ? "ACTIVE"
    : actionsRemaining ? "ACTIVE"
    : "CLOSED";

  const dataStatus =
    dataComplete ? "COMPLETE" : "INCOMPLETE";

  const reopen =
    dataComplete ? "N/A" : "New data";

  const statusBlock = (
    <div
      style={{
        background: "#1f2937",
        padding: 12,
        marginBottom: 12,
        borderRadius: 6
      }}
    >
      <div><strong>CASE STATUS:</strong> {caseStatus}</div>

      <div>
        <strong>DATA STATUS:</strong> {dataStatus}
        {report?.gap_type ? ` (${report.gap_type})` : ""}
      </div>

      <div><strong>REOPENS ON:</strong> {reopen}</div>
    </div>
  );

  // ----------------------------------------------------------
  // FALLBACK (NO REPORT YET)
  // ----------------------------------------------------------
  if (!report && caseItem) {
    return (
      <div style={{ padding: "10px" }}>
        <h2>{caseItem.name}</h2>

        {statusBlock}

        <div style={{ opacity: 0.6 }}>
          Case ID: {caseItem.id}
        </div>
      </div>
    );
  }

  // ----------------------------------------------------------
  // FULL REPORT MODE
  // ----------------------------------------------------------
  return (
    <div style={{ padding: "10px" }}>
      <h1>{report?.event || caseItem?.name || "Unknown Event"}</h1>

      {statusBlock}

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
        {report?.recommended_actions?.length ? (
          report.recommended_actions.map((a, i) => (
            <li key={i}>{a}</li>
          ))
        ) : (
          <li>No actions</li>
        )}
      </ul>

      <h3>Top Search Vectors</h3>
      <ul>
        {report?.top_vectors?.length ? (
          report.top_vectors.map((v, i) => (
            <li key={i}>
              {v.phrase} | {v.score}
            </li>
          ))
        ) : (
          <li>No vectors</li>
        )}
      </ul>
    </div>
  );
}