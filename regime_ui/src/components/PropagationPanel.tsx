import React, { useEffect, useState } from "react";

type Snapshot = {
  timestamp: number;

  structural: {
    bias: number;
    volatility: number;
    dispersion: number;
  };

  narrative: {
    bias: number;
    concentration: number;
    momentum: number;
  };

  capital: {
    exposure: number;
    unrealized_pct: number;
    alignment: number;
  };

  composite: {
    stress_score: number;
    alignment_score: number;
    regime_hint: string;
  };
};

function valueColor(value: number) {
  if (value > 0) return "text-emerald-400";
  if (value < 0) return "text-red-400";
  return "text-neutral-400";
}

export default function PropagationPanel() {
  const [snapshot, setSnapshot] = useState<Snapshot | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setError(null);

        const res = await fetch("/api/propagation_snapshot");

        if (!res.ok) {
          const txt = await res.text();
          throw new Error(`HTTP ${res.status}: ${txt}`);
        }

        const data = (await res.json()) as Snapshot;

        setSnapshot(data);

      } catch (err: any) {
        setError(err?.message ?? String(err));
      }
    };

    fetchData();

    const interval = setInterval(fetchData, 2000);

    return () => clearInterval(interval);
  }, []);

  if (error) {
    return (
      <div className="p-6 text-sm font-mono space-y-3">
        <div className="text-neutral-400 tracking-widest">
          PROPAGATION OBSERVATORY
        </div>

        <div className="text-red-400">FETCH ERROR</div>

        <pre className="text-xs text-neutral-200 whitespace-pre-wrap break-words border border-neutral-800 p-3 rounded">
          {error}
        </pre>
      </div>
    );
  }

  if (!snapshot) {
    return (
      <div className="p-6 text-neutral-400 text-sm font-mono">
        Loading propagation telemetry...
      </div>
    );
  }

  return (
    <div className="p-6 text-sm font-mono space-y-6">

      <div className="text-neutral-400 tracking-widest">
        PROPAGATION OBSERVATORY
      </div>

      <div className="space-y-2">

        <div>
          Structural Bias:
          <span className={valueColor(snapshot.structural.bias)}>
            {" "}{snapshot.structural.bias.toFixed(3)}
          </span>
        </div>

        <div>
          Structural Volatility:
          <span className="text-neutral-200">
            {" "}{snapshot.structural.volatility.toFixed(3)}
          </span>
        </div>

        <div>
          Structural Dispersion:
          <span className="text-neutral-200">
            {" "}{snapshot.structural.dispersion.toFixed(3)}
          </span>
        </div>

        <div>
          Narrative Momentum:
          <span className={valueColor(snapshot.narrative.momentum)}>
            {" "}{snapshot.narrative.momentum.toFixed(3)}
          </span>
        </div>

        <div>
          Narrative Concentration:
          <span className="text-neutral-200">
            {" "}{snapshot.narrative.concentration.toFixed(3)}
          </span>
        </div>

        <div>
          Capital Exposure:
          <span className={valueColor(snapshot.capital.exposure)}>
            {" "}{snapshot.capital.exposure.toFixed(3)}
          </span>
        </div>

        <div>
          Unrealized %:
          <span className={valueColor(snapshot.capital.unrealized_pct)}>
            {" "}{snapshot.capital.unrealized_pct.toFixed(3)}
          </span>
        </div>

        <div>
          Stress Score:
          <span className="text-neutral-200">
            {" "}{snapshot.composite.stress_score.toFixed(3)}
          </span>
        </div>

        <div>
          Alignment Score:
          <span className="text-neutral-200">
            {" "}{snapshot.composite.alignment_score.toFixed(3)}
          </span>
        </div>

        <div>
          Regime Hint:
          <span className="text-emerald-400">
            {" "}{snapshot.composite.regime_hint.toUpperCase()}
          </span>
        </div>

      </div>

    </div>
  );
}