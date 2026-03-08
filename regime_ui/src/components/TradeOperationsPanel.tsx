import React, { useEffect, useState } from "react";

type EngineDecision = {
  symbol?: string
  decision?: string
  score?: number
  drift?: number
  reason?: string
  engine_time?: number
}

export default function TradeOperationsPanel() {

  const [decision, setDecision] = useState<EngineDecision | null>(null)

  const fetchDecision = async () => {

    try {

      const res = await fetch("/api/engine/last")

      if (!res.ok) return

      const data = await res.json()

      setDecision(data)

    } catch {
      // silent fail
    }

  }

  useEffect(() => {

    fetchDecision()

    const interval = setInterval(fetchDecision, 4000)

    return () => clearInterval(interval)

  }, [])

  return (

    <div className="space-y-3 text-xs">

      <div className="text-gray-400 tracking-widest">
        TRADE OPERATIONS
      </div>

      {!decision && (
        <div className="text-gray-500">
          awaiting engine decision...
        </div>
      )}

      {decision && (

        <div className="space-y-2 text-gray-300">

          <div>
            Symbol: {decision.symbol || "--"}
          </div>

          <div>
            Decision: {decision.decision || "--"}
          </div>

          <div>
            Score: {decision.score ?? 0}
          </div>

          <div>
            Drift: {decision.drift ?? 0}
          </div>

          <div>
            Engine Time: {decision.engine_time ?? "--"}
          </div>

          <div className="text-gray-500">
            Reason: {decision.reason || "--"}
          </div>

        </div>

      )}

    </div>

  )
}