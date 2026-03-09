import React, { useEffect, useState } from "react";
import RegimeIndicator from "./components/RegimeIndicator";
import FlattenFlagIndicator from "./components/FlattenFlagIndicator";
import EntryBlockIndicator from "./components/EntryBlockIndicator";
import PropagationPanel from "./components/PropagationPanel";
import NarrativeRadarPanel from "./components/NarrativeRadarPanel";
import TradeOperationsPanel from "./components/TradeOperationsPanel";
import TradeCardPanel from "./components/TradeCardPanel";
import EngineControlPanel from "./components/EngineControlPanel";
import PsiLeaderboardPanel from "./components/PsiLeaderboardPanel";
import { useRegimePolling } from "./hooks/useRegimePolling";

type TransitionEvent = {
  time: string;
  regime: string;
  flatten: boolean;
  block: boolean;
};

function App() {

  const { snapshot } = useRegimePolling();

  const regime = snapshot?.regime ?? "unknown";
  const flatten = snapshot?.flatten_triggered ?? false;
  const block = snapshot?.block_new_entries ?? false;

  // FIXED: correct timestamp source from backend
  const updated =
    snapshot?.last_cycle_timestamp
      ? new Date(snapshot.last_cycle_timestamp * 1000).toLocaleTimeString()
      : "--:--:--";

  const systemic = regime === "systemic";

  const [regimeStartTime, setRegimeStartTime] = useState<number | null>(null);
  const [previousRegime, setPreviousRegime] = useState<string | null>(null);
  const [, forceTick] = useState(0);

  useEffect(() => {
    if (!snapshot?.regime) return;

    if (snapshot.regime !== previousRegime) {
      setPreviousRegime(snapshot.regime);
      setRegimeStartTime(Date.now());
    }
  }, [snapshot?.regime]);

  useEffect(() => {
    const interval = setInterval(() => {
      forceTick((x) => x + 1);
    }, 1000);

    return () => clearInterval(interval);
  }, []);

  const getDuration = () => {

    if (!regimeStartTime) return "00:00:00";

    const seconds = Math.floor((Date.now() - regimeStartTime) / 1000);

    const hrs = String(Math.floor(seconds / 3600)).padStart(2, "0");
    const mins = String(Math.floor((seconds % 3600) / 60)).padStart(2, "0");
    const secs = String(seconds % 60).padStart(2, "0");

    return `${hrs}:${mins}:${secs}`;
  };

  const [transitionLog, setTransitionLog] = useState<TransitionEvent[]>([]);
  const [showDiagnostics, setShowDiagnostics] = useState(false);

  useEffect(() => {

    if (!snapshot) return;

    setTransitionLog((prev) => {

      const last = prev[0];

      if (
        last &&
        last.regime === regime &&
        last.flatten === flatten &&
        last.block === block
      ) {
        return prev;
      }

      const newEvent: TransitionEvent = {
        time: new Date().toLocaleTimeString(),
        regime,
        flatten,
        block,
      };

      return [newEvent, ...prev].slice(0, 20);

    });

  }, [regime, flatten, block]);

  const diagnostics = snapshot?.diagnostics;

  return (

    <div className="w-full min-h-screen text-white font-mono bg-black flex flex-col">

      {/* ================= CONTROL PLANE ================= */}

      <div className="border-b border-gray-800 px-6 py-3 flex justify-between items-center text-sm">

        <div className="flex items-center gap-6">

          <span className="text-green-400 font-semibold">
            MARKETMIND TERMINAL
          </span>

          <span>
            REGIME: {regime.toUpperCase()}
          </span>

          <span>
            FLATTEN: {flatten ? "YES" : "NO"}
          </span>

          <span>
            BLOCK: {block ? "YES" : "NO"}
          </span>

          <span className="text-gray-400">
            UPDATED: {updated}
          </span>

        </div>

        <EngineControlPanel />

      </div>

      {/* ================= ANALYSIS LAYER ================= */}

      <div className="grid grid-cols-2 border-b border-gray-800">

        <div className="p-6 border-r border-gray-800">
          <NarrativeRadarPanel />
        </div>

        <div className="p-6">
          <PropagationPanel snapshot={snapshot} />
        </div>

      </div>

      {/* ================= TRADE CARD CENTER ================= */}

      <div className="flex flex-1 items-center justify-center">

        <div className="w-[420px]">

          <TradeCardPanel />

          {/* ================= PSIQUANTA LEADERBOARD ================= */}

          <PsiLeaderboardPanel />

        </div>

      </div>

      {/* ================= OPERATIONS ================= */}

      <div className="border-t border-gray-800 p-6">

        <TradeOperationsPanel />

      </div>

      {/* ================= DIAGNOSTICS DRAWER ================= */}

      <div className="border-t border-gray-800">

        <div
          className="px-6 py-3 cursor-pointer text-gray-400 tracking-widest text-xs"
          onClick={() => setShowDiagnostics(!showDiagnostics)}
        >
          {showDiagnostics ? "▲ DIAGNOSTICS" : "▼ DIAGNOSTICS"}
        </div>

        {showDiagnostics && (

          <div className="px-6 pb-6 text-xs space-y-6">

            <div className="grid grid-cols-3 gap-6">

              <div className="space-y-4">

                <div className="text-gray-400">
                  ENGINE STATE
                </div>

                <div>
                  TIME IN STATE: {getDuration()}
                </div>

                <RegimeIndicator regime={regime} />
                <FlattenFlagIndicator flatten={flatten} />
                <EntryBlockIndicator block={block} />

              </div>

              <div className="space-y-4">

                <div className="text-gray-400">
                  SYSTEM METRICS
                </div>

                {diagnostics && (

                  <div className="space-y-1">

                    <div>
                      Composite Score:
                      {" "}
                      {diagnostics.composite_score?.toFixed?.(3) ?? "--"}
                    </div>

                    <div>
                      Risk Mode:
                      {" "}
                      {diagnostics.risk_mode ?? "--"}
                    </div>

                    <div>
                      Flatten All:
                      {" "}
                      {diagnostics.flatten_all ? "YES" : "NO"}
                    </div>

                    <div>
                      Block New Entries:
                      {" "}
                      {diagnostics.block_new_entries ? "YES" : "NO"}
                    </div>

                  </div>

                )}

              </div>

              <div className="space-y-4">

                <div className="text-gray-400">
                  REGIME TRANSITIONS
                </div>

                <div className="space-y-1 max-h-[200px] overflow-y-auto">

                  {transitionLog.map((entry, index) => (

                    <div
                      key={index}
                      className="flex justify-between text-gray-300"
                    >

                      <span>{entry.time}</span>
                      <span>{entry.regime.toUpperCase()}</span>
                      <span>F:{entry.flatten ? "1" : "0"}</span>
                      <span>B:{entry.block ? "1" : "0"}</span>

                    </div>

                  ))}

                </div>

              </div>

            </div>

          </div>

        )}

      </div>

    </div>

  );
}

export default App;