import React, { useEffect, useState } from "react";

type DomainPressure = {
  domain: string;
  score: number;
};

type SymbolSignal = {
  symbol: string;
  mentions: number;
  momentum: number;
};

type RadarSnapshot = {
  domains: DomainPressure[];
  symbols: SymbolSignal[];
  updated: string;
};

export default function NarrativeRadarPanel() {

  const [snapshot, setSnapshot] = useState<RadarSnapshot | null>(null);
  const [selectedSymbol, setSelectedSymbol] = useState<string | null>(null);

  const fetchRadar = async () => {

    try {

      const res = await fetch("http://127.0.0.1:8001/api/rss_events");

      if (!res.ok) return;

      const data = await res.json();

      const events = data.events || [];

      const counts: Record<string, number> = {};

      for (const e of events) {

        if (e.symbol) {
          counts[e.symbol] = (counts[e.symbol] || 0) + 1;
        }

        if (Array.isArray(e.symbols)) {

          for (const s of e.symbols) {
            counts[s] = (counts[s] || 0) + 1;
          }

        }

      }

      const symbols: SymbolSignal[] = Object.entries(counts)
        .sort((a, b) => b[1] - a[1])
        .map(([symbol, mentions], i) => ({

          symbol: symbol,
          mentions: mentions,
          momentum: Math.max(1 - i * 0.05, 0.1)

        }));

      const radar: RadarSnapshot = {

        domains: [],
        symbols: symbols,
        updated: new Date().toISOString()

      };

      setSnapshot(radar);

    } catch {

      // silent fail

    }

  };

  useEffect(() => {

    fetchRadar();

    const interval = setInterval(fetchRadar, 5000);

    return () => clearInterval(interval);

  }, []);

  const domains = snapshot?.domains ?? [];
  const symbols = snapshot?.symbols ?? [];

  return (

    <div className="space-y-4">

      <div className="text-gray-400 tracking-widest text-xs">
        NARRATIVE RADAR
      </div>

      {!snapshot && (
        <div className="text-gray-500 text-xs">
          scanning narrative field...
        </div>
      )}

      {snapshot && (

        <>

          {/* DOMAIN PRESSURE */}

          <div className="text-xs">

            <div className="text-gray-400 mb-2">
              DOMAIN PRESSURE
            </div>

            {domains.length === 0 && (
              <div className="text-gray-500 text-xs">
                awaiting domain signals
              </div>
            )}

            <div className="space-y-1">

              {domains.map((d) => (

                <div
                  key={d.domain}
                  className="flex justify-between text-gray-300"
                >

                  <span>{d.domain}</span>

                  <span>
                    {Math.round(d.score)}
                  </span>

                </div>

              ))}

            </div>

          </div>

          {/* SYMBOL EMERGENCE */}

          <div className="text-xs mt-4">

            <div className="text-gray-400 mb-2">
              EMERGING SYMBOLS
            </div>

            {symbols.length === 0 && (
              <div className="text-gray-500 text-xs">
                scanning rss narrative field...
              </div>
            )}

            <div className="space-y-1">

              {symbols.map((s) => (

                <div
                  key={s.symbol}
                  onClick={() => setSelectedSymbol(s.symbol)}
                  className="flex justify-between text-gray-300 cursor-pointer hover:text-cyan-400 hover:bg-gray-800 px-1 rounded"
                >

                  <span className="font-mono">{s.symbol}</span>

                  <span>
                    mentions:{s.mentions}
                  </span>

                  <span>
                    momentum:{s.momentum.toFixed(2)}
                  </span>

                </div>

              ))}

            </div>

          </div>

          {/* SYMBOL DETAIL PANEL */}

          {selectedSymbol && (

            <div className="mt-4 p-3 border border-gray-700 rounded text-xs">

              <div className="text-gray-400 mb-2">
                SYMBOL INSPECTOR
              </div>

              <div className="text-cyan-400 font-mono text-sm">
                {selectedSymbol}
              </div>

              <div className="text-gray-400 mt-2">
                Narrative activity detected.
              </div>

              <div className="text-gray-500">
                Click again to close.
              </div>

              <div
                className="text-red-400 mt-2 cursor-pointer"
                onClick={() => setSelectedSymbol(null)}
              >
                close
              </div>

            </div>

          )}

        </>

      )}

    </div>

  );

}