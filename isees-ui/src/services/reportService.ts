// ============================================================
// src/services/reportService.ts — LOCAL STUB (UI-COMPATIBLE)
// ============================================================

export async function getCases() {
  return [
    { id: 1, name: "Tic Tac 2004", status: "HIGH_CONFIDENCE" },
    { id: 2, name: "Omaha 2019", status: "PARTIAL" },
    { id: 3, name: "Unknown", status: "NOISE" }
  ];
}

export async function getReport(caseId: number) {
  // simulate async delay
  await new Promise((r) => setTimeout(r, 150));

  if (caseId === 1) {
    return {
      event: "Tic Tac 2004",
      mode: "RESOLVED",
      gap_type: "Sensor Fusion Gap",
      recommended_actions: [
        "Check radar logs",
        "Review pilot testimony",
        "Correlate with satellite data"
      ],
      top_vectors: [
        { phrase: "tic tac radar track", score: 0.92 },
        { phrase: "nimitz encounter logs", score: 0.88 }
      ]
    };
  }

  if (caseId === 2) {
    return {
      event: "Omaha 2019",
      mode: "UNRESOLVED",
      gap_type: "Classification Gap",
      recommended_actions: [
        "Analyze FLIR footage",
        "Cross-check ship logs"
      ],
      top_vectors: [
        { phrase: "omaha uap footage", score: 0.87 },
        { phrase: "navy pyramid video analysis", score: 0.83 }
      ]
    };
  }

  return {
    event: "Unknown Event",
    mode: "UNRESOLVED",
    gap_type: "Unknown",
    recommended_actions: [],
    top_vectors: []
  };
}