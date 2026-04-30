// ============================================================
// src/App.tsx — STEP 27 (DYNAMIC ACTION PANEL — FIXED)
// ============================================================

import { useEffect, useState } from "react";
import MainLayout from "./layout/MainLayout";
import CaseList from "./components/CaseList";
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

  // 🔥 FIX: store FULL NODE (not just string)
  const [selectedNode, setSelectedNode] = useState<any>(null);

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
  }, []);

  // ============================================================
  // ANALYZE
  // ============================================================
  const handleAnalyze = async ({ location, description }: any) => {

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
  // NODE ACTION PANEL (🔥 FIXED)
  // ============================================================
  const renderNodeActions = () => {
    if (!selectedNode) return null;

    const actions = selectedNode?.actions;

    return (
      <div style={{ marginTop: 10 }}>
        <h4>Node: {selectedNode.label}</h4>

        {/* ✅ REAL BACKEND DATA */}
        {actions?.next_steps?.length > 0 && (
          <ul>
            {actions.next_steps.map((step: string, i: number) => (
              <li key={i}>{step}</li>
            ))}
          </ul>
        )}

        {/* ✅ CONTACTS */}
        {actions?.contacts?.length > 0 && (
          <ul>
            {actions.contacts.map((c: any, i: number) => (
              <li key={i}>
                {c.name} {c.email ? `- ${c.email}` : ""}
              </li>
            ))}
          </ul>
        )}

        {/* 🧠 SAFE FALLBACK (NO MEDFORD!) */}
        {!actions && (
          <ul>
            <li>Search local sources</li>
            <li>Check regional activity reports</li>
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
                  onNodeClick={(node: any) => setSelectedNode(node)}
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
          </div>
        }
      />
    </div>
  );
}