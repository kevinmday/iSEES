// ============================================================
// src/App.tsx — STEP 26 (GRAPH INTERACTIVE UI)
// ============================================================

import { useEffect, useState } from "react";
import MainLayout from "./layout/MainLayout";
import CaseList from "./components/CaseList";
import CaseCard from "./components/CaseCard";
import RightPanel from "./components/RightPanel";
import CaptureTab from "./components/CaptureTab";
import GraphView from "./components/GraphView";

type CaseItem = {
  id: number;
  name: string;
  status: string;
};

type FeedbackType = "useful" | "noise" | "partial" | null;

type ScoredPhrase = {
  phrase: string;
  score: number;
  why: string[];
  feedback: FeedbackType;
};

export default function App() {
  const [cases, setCases] = useState<CaseItem[]>([]);
  const [selected, setSelected] = useState<CaseItem | null>(null);

  const [targets, setTargets] = useState<string[]>([]);
  const [phrases, setPhrases] = useState<ScoredPhrase[]>([]);
  const [feedbackMap, setFeedbackMap] = useState<Record<string, FeedbackType>>({});

  const [graphData, setGraphData] = useState<any>(null);

  // 🔥 NEW
  const [selectedNode, setSelectedNode] = useState<string | null>(null);

  // ============================================================
  // INIT
  // ============================================================
  useEffect(() => {
    const data: CaseItem[] = [
      { id: 1, name: "Tic Tac 2004", status: "HIGH_CONFIDENCE" },
      { id: 2, name: "Omaha 2019", status: "PARTIAL" },
      { id: 3, name: "Unknown", status: "NOISE" }
    ];

    setCases(data);
    setSelected(data[0]);

    const storedFeedback = localStorage.getItem("isees_feedback");
    if (storedFeedback) {
      setFeedbackMap(JSON.parse(storedFeedback));
    }
  }, []);

  // ============================================================
  // HELPERS
  // ============================================================
  const toTitleCase = (str: string) =>
    str.replace(/\w\S*/g, (w) => w.charAt(0).toUpperCase() + w.slice(1));

  const openSearch = (q: string) =>
    window.open(`https://www.google.com/search?q=${encodeURIComponent(q)}`, "_blank");

  const getFeedbackMultiplier = (feedback: FeedbackType) => {
    if (feedback === "useful") return 1.6;
    if (feedback === "partial") return 1.2;
    if (feedback === "noise") return 0.6;
    return 1.0;
  };

  const scorePhrase = (p: string): ScoredPhrase => {
    const l = p.toLowerCase();

    let base = 0;
    const why: string[] = [];

    if (l.includes("faa")) { base += 5; why.push("FAA domain relevance"); }
    if (l.includes("airport")) { base += 4; why.push("Airport context"); }
    if (l.includes("radar")) { base += 3; why.push("Radar evidence vector"); }
    if (l.includes("news")) { base += 1; why.push("News coverage"); }

    if (why.length === 0) why.push("General relevance");

    const feedback = feedbackMap[p] || null;
    const score = Math.round(base * getFeedbackMultiplier(feedback));

    return { phrase: p, score, why, feedback };
  };

  // ============================================================
  // ANALYZE
  // ============================================================
  const handleAnalyze = async ({ location, description }: any) => {

    const clean = location.trim().toLowerCase();
    const event = description.toLowerCase().includes("light")
      ? "strange lights"
      : "unusual activity";

    let raw = [
      `${clean} FAA ${event}`,
      `${clean} ${event} airport`,
      `${clean} ${event} radar`,
      `${clean} ${event} news`
    ];

    const unique = Array.from(new Set(raw));
    const scored = unique.map(scorePhrase).sort((a, b) => b.score - a.score);

    setPhrases(scored);

    try {
      const res = await fetch(
        `http://127.0.0.1:8001/resolve/real?location=${encodeURIComponent(location)}`
      );

      const data = await res.json();

      setTargets(
        Array.isArray(data?.top_targets)
          ? data.top_targets.map((t: any) => t.name)
          : []
      );

      setGraphData(data?.vector_graph || null);

    } catch (err) {
      console.error("Graph fetch failed:", err);
      setGraphData(null);
    }
  };

  // ============================================================
  // FEEDBACK
  // ============================================================
  const setFeedback = (phrase: string, value: FeedbackType) => {
    const updated = { ...feedbackMap, [phrase]: value };
    setFeedbackMap(updated);
    localStorage.setItem("isees_feedback", JSON.stringify(updated));

    setPhrases(prev =>
      prev.map(p => scorePhrase(p.phrase))
        .sort((a, b) => b.score - a.score)
    );
  };

  // ============================================================
  // NODE ACTION PANEL
  // ============================================================
  const renderNodeActions = () => {
    if (!selectedNode) return null;

    return (
      <div style={{ marginTop: 10 }}>
        <h4>Node: {selectedNode}</h4>

        {selectedNode.includes("Airport") && (
          <ul>
            <li>Request FAA radar logs</li>
            <li>Check ADS-B flight data</li>
            <li>File FOIA request</li>
          </ul>
        )}

        {selectedNode.includes("Tower") && (
          <ul>
            <li>Review ATC communications</li>
            <li>Check LiveATC archives</li>
          </ul>
        )}

        {selectedNode === "Local News" && (
          <ul>
            <li>Search KOBI-TV archives</li>
            <li>Check Rogue Valley Times</li>
          </ul>
        )}

        {selectedNode === "radar" && (
          <ul>
            <li>Radar anomaly queries</li>
            <li>Signal verification</li>
          </ul>
        )}
      </div>
    );
  };

  // ============================================================
  // UI
  // ============================================================
  return (
    <div style={{ height: "100vh", color: "white" }}>
      <MainLayout
        left={<CaseList cases={cases} selected={selected} onSelect={setSelected} />}

        center={
          <div>
            <CaptureTab onAnalyze={handleAnalyze} />

            {graphData ? (
              <>
                <h3 style={{ marginTop: 20 }}>Vector Graph</h3>

                <GraphView
                  graph={graphData}
                  onNodeClick={setSelectedNode}
                />

                {renderNodeActions()}
              </>
            ) : (
              <div style={{ marginTop: 20, opacity: 0.5 }}>
                No graph data yet
              </div>
            )}
          </div>
        }

        right={
          <div>
            <h3>Search Targets</h3>
            <ul>
              {targets.map((t, i) => <li key={i}>{t}</li>)}
            </ul>

            <h3>Search Phrases</h3>

            {phrases.map((p, i) => (
              <div key={i} style={{ marginBottom: 12 }}>
                <div
                  onClick={() => openSearch(p.phrase)}
                  style={{ cursor: "pointer", color: "#7dd3fc" }}
                >
                  🔍 {toTitleCase(p.phrase)}
                </div>

                <div style={{ fontSize: 12 }}>
                  Score: {p.score}
                </div>

                <ul style={{ fontSize: 12 }}>
                  {p.why.map((w, idx) => <li key={idx}>{w}</li>)}
                </ul>

                <button onClick={() => setFeedback(p.phrase, "useful")}>Useful</button>
                <button onClick={() => setFeedback(p.phrase, "partial")}>Partial</button>
                <button onClick={() => setFeedback(p.phrase, "noise")}>Noise</button>
              </div>
            ))}
          </div>
        }
      />
    </div>
  );
}