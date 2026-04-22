// ============================================================
// src/components/RightPanel.tsx — HYBRID (RAW + SEARCH OPS)
// FULL DROP-IN REPLACEMENT (WITH RUN TOP SEARCH)
// ============================================================

type Vector = {
  phrase: string;
  score: number;
};

type Report = {
  raw?: any;
  gap_type?: string;
  top_vectors?: Vector[];
};

export default function RightPanel({ report }: { report: Report | null }) {
  if (!report) return <div style={{ padding: 20 }}>No data</div>;

  // --------------------------------------------
  // COPY HELPER
  // --------------------------------------------
  const copy = (text: string) => {
    navigator.clipboard.writeText(text);
    console.log("COPIED:", text);
  };

  // --------------------------------------------
  // OPEN SEARCH (NEW - RESTORED)
  // --------------------------------------------
  const openSearch = (text: string) => {
    const url = `https://www.google.com/search?q=${encodeURIComponent(text)}`;
    window.open(url, "_blank");
  };

  // --------------------------------------------
  // RUN TOP SEARCH (CRITICAL FIX)
  // --------------------------------------------
  const runTopSearch = () => {
    if (report.top_vectors && report.top_vectors.length > 0) {
      openSearch(report.top_vectors[0].phrase);
    }
  };

  // --------------------------------------------
  // EXPAND SEARCH PHRASES
  // --------------------------------------------
  const expand = (phrase: string) => {
    const p = phrase.toLowerCase();

    if (p.includes("tic tac")) {
      return [
        "USS Princeton radar logs 2004",
        "AN/SPY-1 anomalous track data",
        "Nimitz strike group CEC records"
      ];
    }

    if (p.includes("omaha")) {
      return [
        "USS Omaha FLIR footage metadata",
        "Navy pyramid UAP video analysis",
        "CIC watch logs Omaha 2019"
      ];
    }

    return [
      phrase + " raw data",
      phrase + " logs",
      phrase + " analysis report"
    ];
  };

  // --------------------------------------------
  // DOMAIN ROUTING
  // --------------------------------------------
  const getDomains = () => {
    if (report.gap_type?.includes("Sensor Fusion")) {
      return ["Radar Systems", "EO/IR Systems", "Data Link (CEC)"];
    }

    if (report.gap_type?.includes("Classification")) {
      return ["Video Analysis", "Intel Reports", "Airspace Logs"];
    }

    return ["General OSINT", "Archives", "Unclassified Reports"];
  };

  return (
    <div style={{ padding: 20 }}>
      {/* ======================================== */}
      {/* RAW SIGNAL METRICS */}
      {/* ======================================== */}
      <h3>Signal Metrics</h3>

      <p>
        <b>Coherence:</b>{" "}
        {report.raw?.coherence_flow?.phase8 ?? "N/A"}
      </p>

      <p>
        <b>Entropy:</b>{" "}
        {report.raw?.entropy_flow?.adjusted ?? "N/A"}
      </p>

      <h4>Flags</h4>
      <pre
        style={{
          background: "#111",
          padding: 10,
          fontSize: 12,
          overflowX: "auto"
        }}
      >
        {JSON.stringify(report.raw?.flags ?? {}, null, 2)}
      </pre>

      {/* ======================================== */}
      {/* SEARCH OPERATIONS */}
      {/* ======================================== */}
      <div style={{ marginTop: 30 }}>
        <h3>Search Operations</h3>

        {/* ✅ RUN TOP SEARCH (RESTORED) */}
        <div style={{ marginBottom: 10 }}>
          <button onClick={runTopSearch}>
            Run Top Search
          </button>
        </div>

        {/* TOP VECTORS */}
        <h4>Top Vectors</h4>
        {report.top_vectors?.length ? (
          report.top_vectors.map((v, i) => (
            <div
              key={i}
              style={{
                padding: 8,
                marginBottom: 6,
                background: "#1a1a1a"
              }}
            >
              <div>{v.phrase} | {v.score}</div>

              <div style={{ marginTop: 5 }}>
                <button onClick={() => copy(v.phrase)}>Copy</button>
                <button
                  onClick={() => openSearch(v.phrase)}
                  style={{ marginLeft: 6 }}
                >
                  Open
                </button>
              </div>
            </div>
          ))
        ) : (
          <div>No vectors</div>
        )}

        {/* EXPANDED SEARCH */}
        <h4 style={{ marginTop: 20 }}>Expanded Search</h4>
        {report.top_vectors?.flatMap((v) =>
          expand(v.phrase).map((e, i) => (
            <div
              key={v.phrase + i}
              style={{
                padding: 6,
                marginBottom: 4,
                background: "#111"
              }}
            >
              <div>{e}</div>

              <div style={{ marginTop: 4 }}>
                <button onClick={() => copy(e)}>Copy</button>
                <button
                  onClick={() => openSearch(e)}
                  style={{ marginLeft: 6 }}
                >
                  Open
                </button>
              </div>
            </div>
          ))
        )}

        {/* DOMAINS */}
        <h4 style={{ marginTop: 20 }}>Priority Domains</h4>
        {getDomains().map((d, i) => (
          <div
            key={i}
            style={{
              padding: 6,
              marginBottom: 4,
              background: "#222"
            }}
          >
            {d}
          </div>
        ))}
      </div>
    </div>
  );
}