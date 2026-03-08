import React from "react";

export default function EngineControlPanel() {

  const startEngine = async () => {
    await fetch("/api/engine/start", { method: "POST" })
  }

  const runCycle = async () => {
    await fetch("/api/engine/run_cycle", { method: "POST" })
  }

  const stopEngine = async () => {
    await fetch("/api/engine/stop", { method: "POST" })
  }

  return (

    <div className="space-y-3 border border-gray-700 p-4 rounded text-sm">

      <div className="text-gray-400 tracking-widest">
        ENGINE CONTROL
      </div>

      <div className="flex gap-4 text-green-400 cursor-pointer">

        <div onClick={startEngine}>
          START ENGINE
        </div>

        <div onClick={runCycle}>
          RUN CYCLE
        </div>

        <div onClick={stopEngine} className="text-red-400">
          STOP ENGINE
        </div>

      </div>

    </div>

  )
}