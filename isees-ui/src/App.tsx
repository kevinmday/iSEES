// ============================================================
// src/App.tsx — STEP 4 (RIGHT PANEL WIRED)
// ============================================================

import { useEffect, useState } from "react";
import MainLayout from "./layout/MainLayout";
import CaseList from "./components/CaseList";
import CaseCard from "./components/CaseCard";
import RightPanel from "./components/RightPanel";

type CaseItem = {
  id: number;
  name: string;
  status: string;
};

export default function App() {
  const [cases, setCases] = useState<CaseItem[]>([]);
  const [selected, setSelected] = useState<CaseItem | null>(null);
  const [report, setReport] = useState<any>(null);

  useEffect(() => {
    const data: CaseItem[] = [
      { id: 1, name: "Tic Tac 2004", status: "HIGH_CONFIDENCE" },
      { id: 2, name: "Omaha 2019", status: "PARTIAL" },
      { id: 3, name: "Unknown", status: "NOISE" }
    ];

    setCases(data);
    setSelected(data[0]);
  }, []);

  // simulate report fetch (using your service if already wired)
  useEffect(() => {
    if (!selected) return;

    import("./services/reportService").then(({ getReport }) => {
      getReport(selected.id).then(setReport);
    });
  }, [selected]);

  return (
    <div style={{ height: "100vh", color: "white" }}>
      {/* HEADER */}
      <div style={{ padding: "10px", borderBottom: "1px solid gray" }}>
        <strong>LIVE REPORT MODE</strong> | selected:{" "}
        {selected ? selected.name : "none"}
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
            <CaseCard report={report} />
          </div>
        }
        right={
          <div>
            <h4>RIGHT PANEL</h4>
            <RightPanel report={report} />
          </div>
        }
      />
    </div>
  );
}