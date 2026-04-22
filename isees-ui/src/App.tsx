// ============================================================
// src/App.tsx — STEP 13 (RANKING + RUN TOP SEARCHES)
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

  const [activeTab, setActiveTab] = useState<"cases" | "capture">("cases");
  const [targets, setTargets] = useState<string[]>([]);
  const [phrases, setPhrases] = useState<string[]>([]);

  useEffect(() => {
    const data: CaseItem[] = [
      { id: 1, name: "Tic Tac 2004", status: "HIGH_CONFIDENCE" },
      { id: 2, name: "Omaha 2019", status: "PARTIAL" },
      { id: 3, name: "Unknown", status: "NOISE" }
    ];

    setCases(data);
    setSelected(data[0]);
  }, []);

  useEffect(() => {
    if (!selected) return;

    import("./services/reportService").then(({ getReport }) => {
      getReport(selected.id).then(setReport);
    });
  }, [selected]);

  // ============================================================
  // HELPERS
  // ============================================================
  const toTitleCase = (str: string) =>
    str.replace(/\w\S*/g, (w) => w.charAt(0).toUpperCase() + w.slice(1));

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
  };

  const openSearch = (query: string) => {
    const url = `https://www.google.com/search?q=${encodeURIComponent(query)}`;
    window.open(url, "_blank");
  };

  // ============================================================
  // RANKING ENGINE (simple + deterministic)
  // ============================================================
  const scorePhrase = (p: string) => {
    const l = p.toLowerCase();

    let score = 0;

    if (l.includes("faa")) score += 5;
    if (l.includes("airport")) score += 4;
    if (l.includes("radar")) score += 3;
    if (l.includes("anomaly")) score += 2;
    if (l.includes("news")) score += 1;
    if (l.includes("facebook") || l.includes("reddit")) score -= 1;

    return score;
  };

  // ============================================================
  // INTELLIGENCE ENGINE
  // ============================================================
  const handleAnalyze = ({ location, context, description }: any) => {
    let newTargets: string[] = [];
    let newPhrases: string[] = [];

    const loc = location.toLowerCase();
    const desc = description.toLowerCase();
    const cleanLocation = location.trim();

    let airport = "Local Airport";
    let news = "Local News";
    let social = "Local Social Groups";

    if (loc.includes("medford")) {
      airport = "Rogue Valley International–Medford Airport";
      news = "Mail Tribune (Medford)";
      social = "Rogue Valley Facebook Groups";
    }

    if (context === "aviation") {
      newTargets = [
        `${airport} (Radar / ATC)`,
        "FAA Incident Data",
        "Flight Tracking Logs",
      ];
    } else {
      newTargets = [airport, news, social];
    }

    let eventTerms: string[] = [];

    if (desc.includes("light")) eventTerms.push("strange lights");
    if (desc.includes("object")) eventTerms.push("unknown object");
    if (desc.includes("radar")) eventTerms.push("radar anomaly");

    if (eventTerms.length === 0) eventTerms.push("unusual activity");

    newTargets.forEach((target) => {
      const t = target.toLowerCase();

      eventTerms.forEach((event) => {
        if (t.includes("airport") || t.includes("faa")) {
          newPhrases.push(`${cleanLocation} ${event} airport`);
          newPhrases.push(`${cleanLocation} FAA ${event}`);
          newPhrases.push(`${cleanLocation} ${event} radar`);
        } else {
          newPhrases.push(`${cleanLocation} ${event}`);
        }
      });
    });

    // secondary
    eventTerms.forEach((event) => {
      newPhrases.push(`${cleanLocation} ${event} news`);
      newPhrases.push(`site:news.google.com ${cleanLocation} ${event}`);
      newPhrases.push(`site:facebook.com ${cleanLocation} ${event}`);
    });

    newPhrases = Array.from(new Set(newPhrases));

    // APPLY RANKING
    newPhrases.sort((a, b) => scorePhrase(b) - scorePhrase(a));

    setTargets(newTargets);
    setPhrases(newPhrases);
  };

  // ============================================================
  // RUN TOP SEARCHES
  // ============================================================
  const runTopSearches = () => {
    phrases.slice(0, 3).forEach((p, i) => {
      setTimeout(() => openSearch(p), i * 400);
    });
  };

  return (
    <div style={{ height: "100vh", color: "white" }}>
      
      {/* HEADER */}
      <div style={{ padding: "10px", borderBottom: "1px solid gray" }}>
        <strong>
          {activeTab === "capture" ? "CAPTURE MODE" : "LIVE REPORT MODE"}
        </strong>
        {" | "}
        {activeTab === "capture"
          ? "New Case"
          : `selected: ${selected ? selected.name : "none"}`}

        <div style={{ marginTop: 10 }}>
          <button onClick={() => setActiveTab("cases")}>Cases</button>
          <button onClick={() => setActiveTab("capture")} style={{ marginLeft: 10 }}>
            Capture
          </button>
        </div>
      </div>

      <MainLayout
        left={<CaseList cases={cases} selected={selected} onSelect={(c) => setSelected(c)} />}

        center={
          activeTab === "cases"
            ? <CaseCard report={report} />
            : <CaptureTab onAnalyze={handleAnalyze} />
        }

        right={
          activeTab === "cases" ? (
            <RightPanel report={report} />
          ) : (
            <div>
              <h4>Search Targets</h4>
              <ul>
                {targets.map((t, i) => <li key={i}>{t}</li>)}
              </ul>

              <h4 style={{ marginTop: 20 }}>Search Phrases</h4>

              <button onClick={runTopSearches}>
                Run Top Searches
              </button>

              {phrases.map((p, i) => (
                <div key={i} style={{ marginTop: 10 }}>
                  <div
                    style={{ cursor: "pointer", color: "#7dd3fc" }}
                    onClick={() => openSearch(p)}
                  >
                    🔍 {toTitleCase(p)}
                  </div>

                  <button onClick={() => copyToClipboard(p)}>Copy</button>
                  <button onClick={() => openSearch(p)} style={{ marginLeft: 6 }}>
                    Open
                  </button>
                </div>
              ))}
            </div>
          )
        }
      />
    </div>
  );
}