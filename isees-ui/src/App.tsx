// ============================================================
// src/App.tsx — STEP 7 (TARGETS + SEARCH PHRASE ENGINE INLINE)
// ============================================================

import { useEffect, useState } from "react";
import MainLayout from "./layout/MainLayout";
import CaseList from "./components/CaseList";
import CaseCard from "./components/CaseCard";
import RightPanel from "./components/RightPanel";
import CaptureTab from "./components/CaptureTab";

type CaseItem = {
  id: number;
  name: string;
  status: string;
};

export default function App() {
  const [cases, setCases] = useState<CaseItem[]>([]);
  const [selected, setSelected] = useState<CaseItem | null>(null);
  const [report, setReport] = useState<any>(null);

  // CAPTURE MODE STATE
  const [activeTab, setActiveTab] = useState<"cases" | "capture">("cases");
  const [targets, setTargets] = useState<string[]>([]);
  const [phrases, setPhrases] = useState<string[]>([]);

  // INITIAL CASE LOAD
  useEffect(() => {
    const data: CaseItem[] = [
      { id: 1, name: "Tic Tac 2004", status: "HIGH_CONFIDENCE" },
      { id: 2, name: "Omaha 2019", status: "PARTIAL" },
      { id: 3, name: "Unknown", status: "NOISE" }
    ];

    setCases(data);
    setSelected(data[0]);
  }, []);

  // REPORT FETCH
  useEffect(() => {
    if (!selected) return;

    import("./services/reportService").then(({ getReport }) => {
      getReport(selected.id).then(setReport);
    });
  }, [selected]);

  // ============================================================
  // INTELLIGENCE ENGINE (GEO + CONTEXT + PHRASES)
  // ============================================================
  const handleAnalyze = ({ location, context, description }: any) => {
    let newTargets: string[] = [];
    let newPhrases: string[] = [];

    const loc = location.toLowerCase();
    const desc = description.toLowerCase();

    // ------------------------------------------------------------
    // GEO RESOLUTION (v1 — extendable)
    // ------------------------------------------------------------
    let airport = "Local Airport";
    let news = "Local News";
    let social = "Local Social Groups";

    if (loc.includes("medford")) {
      airport = "Rogue Valley International–Medford Airport";
      news = "Mail Tribune (Medford)";
      social = "Rogue Valley Facebook Groups";
    }

    if (loc.includes("phoenix")) {
      airport = "Phoenix Sky Harbor International Airport";
      news = "AZ Central (Phoenix)";
      social = "Phoenix Community Groups";
    }

    if (loc.includes("san diego")) {
      airport = "San Diego International Airport";
      news = "San Diego Union-Tribune";
      social = "San Diego Community Groups";
    }

    // ------------------------------------------------------------
    // CONTEXT → TARGET ROUTING
    // ------------------------------------------------------------
    if (context === "aviation") {
      newTargets = [
        `${airport} (Radar / ATC)`,
        "FAA Incident Data",
        "Flight Tracking Logs",
      ];
    } else if (context === "witness") {
      newTargets = [
        news,
        social,
        "Police Scanner Logs",
      ];
    } else if (context === "military") {
      newTargets = [
        "Nearby Military Installations",
        "Radar Systems",
        "Training Logs",
      ];
    } else {
      newTargets = [
        airport,
        news,
        social,
      ];
    }

    // ------------------------------------------------------------
    // KEYWORD EXTRACTION (simple deterministic)
    // ------------------------------------------------------------
    let keywords: string[] = [];

    if (desc.includes("light")) keywords.push("strange light");
    if (desc.includes("object")) keywords.push("unknown object");
    if (desc.includes("radar")) keywords.push("radar anomaly");
    if (desc.includes("fast")) keywords.push("high speed object");

    // fallback
    if (keywords.length === 0) {
      keywords.push("unusual activity");
    }

    // ------------------------------------------------------------
    // TARGET → SEARCH PHRASES
    // ------------------------------------------------------------
    newTargets.forEach((target) => {
      keywords.forEach((k) => {
        newPhrases.push(`${target} ${k}`);
      });
    });

    // OPTIONAL: de-duplicate
    newPhrases = Array.from(new Set(newPhrases));

    setTargets(newTargets);
    setPhrases(newPhrases);
  };

  return (
    <div style={{ height: "100vh", color: "white" }}>
      {/* HEADER */}
      <div style={{ padding: "10px", borderBottom: "1px solid gray" }}>
        <strong>LIVE REPORT MODE</strong> | selected:{" "}
        {selected ? selected.name : "none"}

        <div style={{ marginTop: 10 }}>
          <button onClick={() => setActiveTab("cases")}>Cases</button>
          <button onClick={() => setActiveTab("capture")} style={{ marginLeft: 10 }}>
            Capture
          </button>
        </div>
      </div>

      <MainLayout
        left={
          <div>
            <h4>LEFT PANEL</h4>

            <CaseList
              cases={cases}
              selected={selected}
              onSelect={(c: CaseItem) => setSelected(c)}
            />
          </div>
        }

        center={
          <div>
            <h4>CENTER PANEL</h4>

            {activeTab === "cases" && <CaseCard report={report} />}

            {activeTab === "capture" && (
              <CaptureTab onAnalyze={handleAnalyze} />
            )}
          </div>
        }

        right={
          <div>
            <h4>RIGHT PANEL</h4>

            {activeTab === "cases" && <RightPanel report={report} />}

            {activeTab === "capture" && (
              <div>
                <h4>Search Targets</h4>

                {targets.length === 0 ? (
                  <p>No targets yet</p>
                ) : (
                  <ul>
                    {targets.map((t, i) => (
                      <li key={i}>{t}</li>
                    ))}
                  </ul>
                )}

                <h4 style={{ marginTop: "20px" }}>Search Phrases</h4>

                {phrases.length === 0 ? (
                  <p>No phrases yet</p>
                ) : (
                  <ul>
                    {phrases.map((p, i) => (
                      <li key={i}>{p}</li>
                    ))}
                  </ul>
                )}
              </div>
            )}
          </div>
        }
      />
    </div>
  );
}