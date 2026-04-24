// ============================================================
// src/App.tsx — STEP 24 (GEO-AWARE TARGETS + WEIGHTED MODEL)
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
  const [report, setReport] = useState<any>(null);

  const [activeTab, setActiveTab] = useState<"cases" | "capture">("cases");
  const [targets, setTargets] = useState<string[]>([]);
  const [phrases, setPhrases] = useState<ScoredPhrase[]>([]);
  const [feedbackMap, setFeedbackMap] = useState<Record<string, FeedbackType>>({});

  const [lastInput, setLastInput] = useState<any>(null);

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

  // ============================================================
  // GEO TARGETS (NEW)
  // ============================================================
  const buildGeoTargets = (location: string) => {
    const l = location.toLowerCase();

    if (l.includes("grants pass") || l.includes("medford")) {
      return [
        "FAA (Medford KMFR radar coverage)",
        "Airport (Grants Pass 3S8 AWOS)",
        "Airport (Medford KMFR ATC)",
        "Local News (KOBI-TV Medford)",
        "Newspaper (Rogue Valley Times)",
        "Radio (KMED / KCNA)"
      ];
    }

    if (l.includes("phoenix")) {
      return [
        "FAA (Phoenix KPHX radar)",
        "Airport (KPHX ATC)",
        "Local News (Fox 10 Phoenix)",
        "Newspaper (Arizona Republic)",
        "Police Dispatch (Phoenix PD)"
      ];
    }

    return [
      "FAA (regional radar)",
      "Local Airport (ATC / AWOS)",
      "Flight Tracking Logs",
      "Local News Coverage"
    ];
  };

  // ============================================================
  // WEIGHTED FEEDBACK MODEL
  // ============================================================
  const getFeedbackMultiplier = (feedback: FeedbackType) => {
    if (feedback === "useful") return 1.6;
    if (feedback === "partial") return 1.2;
    if (feedback === "noise") return 0.6;
    return 1.0;
  };

  // ============================================================
  // SCORING
  // ============================================================
  const scorePhrase = (p: string): ScoredPhrase => {
    const l = p.toLowerCase();

    let base = 0;
    const why: string[] = [];

    if (l.includes("faa")) {
      base += 5;
      why.push("FAA domain relevance");
    }

    if (l.includes("airport")) {
      base += 4;
      why.push("Airport context");
    }

    if (l.includes("radar")) {
      base += 3;
      why.push("Radar evidence vector");
    }

    if (l.includes("news")) {
      base += 1;
      why.push("News coverage");
    }

    if (l.includes("facebook")) {
      base -= 1;
      why.push("Low reliability source");
    }

    if (why.length === 0) {
      why.push("General relevance");
    }

    const feedback = feedbackMap[p] || null;
    const multiplier = getFeedbackMultiplier(feedback);

    const score = Math.round(base * multiplier);

    return {
      phrase: p,
      score,
      why,
      feedback
    };
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

    const geoTargets = buildGeoTargets(location);

    let raw = [
      `${clean} FAA ${event}`,
      `${clean} ${event} airport`,
      `${clean} ${event} radar`,
      `${clean} ${event} news`,
      `site:news.google.com ${clean} ${event}`,
      `site:facebook.com ${clean} ${event}`
    ];

    const unique = Array.from(new Set(raw));
    const scored = unique.map(scorePhrase);

    scored.sort((a, b) => b.score - a.score);

    setTargets(geoTargets);
    setPhrases(scored);
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
  // UI
  // ============================================================
  return (
    <div style={{ height: "100vh", color: "white" }}>
      <MainLayout
        left={<CaseList cases={cases} selected={selected} onSelect={setSelected} />}
        center={<CaptureTab onAnalyze={handleAnalyze} />}
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
                  Score: {p.score} {p.feedback && `(feedback: ${p.feedback})`}
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