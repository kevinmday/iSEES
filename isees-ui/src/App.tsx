// ============================================================
// src/App.tsx — STEP 17 (RESTORE TOP SEARCH EXECUTION)
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

type SavedPack = {
  id: number;
  location: string;
  context: string;
  description: string;
  targets: string[];
  phrases: string[];
};

export default function App() {
  const [cases, setCases] = useState<CaseItem[]>([]);
  const [selected, setSelected] = useState<CaseItem | null>(null);
  const [report, setReport] = useState<any>(null);

  const [activeTab, setActiveTab] = useState<"cases" | "capture">("cases");
  const [targets, setTargets] = useState<string[]>([]);
  const [phrases, setPhrases] = useState<string[]>([]);

  const [lastInput, setLastInput] = useState<any>(null);
  const [library, setLibrary] = useState<SavedPack[]>([]);

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

    const saved = localStorage.getItem("isees_library");

    if (saved) {
      const parsed: SavedPack[] = JSON.parse(saved);
      setLibrary(parsed);

      if (parsed.length > 0) {
        const latest = parsed[0];

        setTargets(latest.targets);
        setPhrases(latest.phrases);
        setLastInput({
          location: latest.location,
          context: latest.context,
          description: latest.description
        });

        setActiveTab("capture");
      }
    }
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

  const openSearch = (q: string) =>
    window.open(`https://www.google.com/search?q=${encodeURIComponent(q)}`, "_blank");

  const copyToClipboard = (text: string) =>
    navigator.clipboard.writeText(text);

  const scorePhrase = (p: string) => {
    const l = p.toLowerCase();
    let score = 0;
    if (l.includes("faa")) score += 5;
    if (l.includes("airport")) score += 4;
    if (l.includes("radar")) score += 3;
    if (l.includes("news")) score += 1;
    if (l.includes("facebook")) score -= 1;
    return score;
  };

  // ============================================================
  // ANALYZE
  // ============================================================
  const handleAnalyze = ({ location, context, description }: any) => {
    setLastInput({ location, context, description });

    const clean = location.trim().toLowerCase();
    const event = description.toLowerCase().includes("light")
      ? "strange lights"
      : "unusual activity";

    const newTargets = [
      "Local Airport (Radar / ATC)",
      "FAA Incident Data",
      "Flight Tracking Logs"
    ];

    let newPhrases = [
      `${clean} FAA ${event}`,
      `${clean} ${event} airport`,
      `${clean} ${event} radar`,
      `${clean} ${event} news`,
      `site:news.google.com ${clean} ${event}`,
      `site:facebook.com ${clean} ${event}`
    ];

    newPhrases = Array.from(new Set(newPhrases));
    newPhrases.sort((a, b) => scorePhrase(b) - scorePhrase(a));

    setTargets(newTargets);
    setPhrases(newPhrases);
  };

  // ============================================================
  // SAVE
  // ============================================================
  const savePack = () => {
    if (!lastInput) return;

    const pack: SavedPack = {
      id: Date.now(),
      ...lastInput,
      targets,
      phrases
    };

    const updated = [pack, ...library];
    setLibrary(updated);
    localStorage.setItem("isees_library", JSON.stringify(updated));
  };

  // ============================================================
  // LOAD
  // ============================================================
  const loadPack = (p: SavedPack) => {
    setTargets(p.targets);
    setPhrases(p.phrases);
    setLastInput({
      location: p.location,
      context: p.context,
      description: p.description
    });
    setActiveTab("capture");
  };

  // ============================================================
  // EXECUTION HELPERS (NEW)
  // ============================================================
  const runBestSearch = () => {
    if (phrases.length > 0) openSearch(phrases[0]);
  };

  const runTopThree = () => {
    phrases.slice(0, 3).forEach((p) => openSearch(p));
  };

  // ============================================================
  // UI
  // ============================================================
  return (
    <div style={{ height: "100vh", color: "white" }}>
      {/* HEADER */}
      <div style={{ padding: 10, borderBottom: "1px solid gray" }}>
        <strong>
          {activeTab === "capture" ? "CAPTURE MODE" : "LIVE REPORT MODE"}
        </strong>{" "}
        |{" "}
        {activeTab === "capture"
          ? lastInput
            ? `${lastInput.location} | ${lastInput.context}`
            : "New Case"
          : `selected: ${selected?.name}`}

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
            <h4>Cases</h4>
            <CaseList cases={cases} selected={selected} onSelect={setSelected} />

            <h4 style={{ marginTop: 20 }}>Saved</h4>
            {library.length === 0 && <div>No saved cases</div>}
            {library.map((p) => (
              <div key={p.id} onClick={() => loadPack(p)} style={{ cursor: "pointer" }}>
                {p.location} — {p.description}
              </div>
            ))}
          </div>
        }

        center={
          activeTab === "capture"
            ? <CaptureTab onAnalyze={handleAnalyze} />
            : <CaseCard report={report} />
        }

        right={
          activeTab === "capture"
            ? (
              <div>
                <h4>Search Targets</h4>
                <ul>{targets.map((t, i) => <li key={i}>{t}</li>)}</ul>

                <h4>Search Phrases</h4>

                {/* 🔥 EXECUTION CONTROLS */}
                <div style={{ marginBottom: 10 }}>
                  <button onClick={runBestSearch}>Run Best Search</button>
                  <button onClick={runTopThree} style={{ marginLeft: 5 }}>
                    Run Top 3
                  </button>
                  <button onClick={savePack} style={{ marginLeft: 5 }}>
                    Save Pack
                  </button>
                </div>

                {phrases.map((p, i) => (
                  <div key={i} style={{ marginBottom: 8 }}>
                    <span
                      style={{ cursor: "pointer", color: "#7dd3fc" }}
                      onClick={() => openSearch(p)}
                    >
                      🔍 {toTitleCase(p)}
                    </span>

                    <div style={{ marginTop: 4 }}>
                      <button onClick={() => copyToClipboard(p)}>Copy</button>
                      <button onClick={() => openSearch(p)} style={{ marginLeft: 5 }}>
                        Open
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )
            : <RightPanel report={report} />
        }
      />
    </div>
  );
}