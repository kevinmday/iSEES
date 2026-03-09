import React, { useEffect, useState } from "react";

type PsiEntry = {
  symbol: string;
  score: number;
};

function PsiLeaderboardPanel() {

  const [leaders, setLeaders] = useState<PsiEntry[]>([]);

  useEffect(() => {

    const poll = async () => {

      try {

        const res = await fetch("http://127.0.0.1:8001/api/engine/last");
        const data = await res.json();

        const table = data?.decision_payload?.psiquant_table;

        if (!table) return;

        const entries = Object.entries(table)
          .map(([symbol, score]) => ({
            symbol,
            score: Number(score)
          }))
          .sort((a, b) => b.score - a.score)
          .slice(0, 8);

        setLeaders(entries);

      } catch (err) {
        console.log("Psi leaderboard fetch failed");
      }

    };

    poll();

    const interval = setInterval(poll, 2000);

    return () => clearInterval(interval);

  }, []);

  return (

    <div className="border-t border-gray-800 pt-4 mt-6 text-xs">

      <div className="text-gray-400 mb-2">
        PSIQUANTA LEADERBOARD
      </div>

      {leaders.length === 0 && (
        <div className="text-gray-500">
          Waiting for PsiQuanta signals...
        </div>
      )}

      {leaders.map((entry, index) => (

        <div
          key={index}
          className="flex justify-between text-gray-300"
        >

          <span>{entry.symbol}</span>

          <span className="text-green-400">
            {entry.score.toFixed(3)}
          </span>

        </div>

      ))}

    </div>

  );

}

export default PsiLeaderboardPanel;