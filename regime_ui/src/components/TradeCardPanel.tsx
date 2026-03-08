import React, { useEffect, useState } from "react"

type TradeDecision = {
  symbol?: string
  decision?: string
  score?: number
  drift?: number
  reason?: string
  engine_time?: number
}

export default function TradeCardPanel() {

  const [trade, setTrade] = useState<TradeDecision | null>(null)

  const fetchDecision = async () => {

    try {

      const res = await fetch("/api/engine/last")

      if (!res.ok) return

      const data = await res.json()

      setTrade(data)

    } catch {
      // silent fail
    }

  }

  useEffect(() => {

    fetchDecision()

    const interval = setInterval(fetchDecision, 4000)

    return () => clearInterval(interval)

  }, [])

  const scoreColor = (score?: number) => {

    if (!score) return "text-gray-400"

    if (score >= 80) return "text-green-400"
    if (score >= 60) return "text-yellow-400"
    if (score >= 40) return "text-orange-400"

    return "text-red-400"

  }

  const decisionColor = (decision?: string) => {

    if (decision === "BUY") return "text-green-400"
    if (decision === "SELL") return "text-red-400"

    return "text-gray-400"

  }

  return (

    <div className="bg-gray-900 border border-gray-700 rounded-lg p-6 text-center shadow-xl min-w-[260px]">

      <div className="text-xs text-gray-400 tracking-widest mb-3">
        TRADE SIGNAL
      </div>

      {!trade && (
        <div className="text-gray-500 text-sm">
          awaiting alpha signal...
        </div>
      )}

      {trade && (

        <div className="space-y-4">

          <div className="text-4xl font-bold text-white">
            {trade.symbol ?? "--"}
          </div>

          <div className={`text-xl font-semibold ${decisionColor(trade.decision)}`}>
            {trade.decision ?? "WAIT"}
          </div>

          <div className="grid grid-cols-2 gap-6 text-sm pt-2">

            <div>

              <div className="text-gray-500 text-xs">
                SCORE
              </div>

              <div className={`text-lg ${scoreColor(trade.score)}`}>
                {trade.score ?? "--"}
              </div>

            </div>

            <div>

              <div className="text-gray-500 text-xs">
                DRIFT
              </div>

              <div className="text-lg text-white">
                {trade.drift ?? "--"}
              </div>

            </div>

          </div>

          <div className="text-xs text-gray-500 pt-2">
            engine time: {trade.engine_time ?? "--"}
          </div>

          {trade.reason && (

            <div className="text-gray-400 text-xs pt-3 border-t border-gray-700">
              {trade.reason}
            </div>

          )}

        </div>

      )}

    </div>

  )

}