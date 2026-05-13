import type { PipelineTraceEntry } from "../types/pipeline";

export const pipelineTraceStub: PipelineTraceEntry[] = [
  {
    id: "trace-001",
    stage: "ingestion",
    timestamp: "2026-05-12T12:00:00Z",
    status: "complete",
    title: "Observation Packet Accepted",
    message: "ROR successfully entered into intake pipeline.",
  },

  {
    id: "trace-002",
    stage: "normalization",
    timestamp: "2026-05-12T12:00:04Z",
    status: "complete",
    title: "Normalization Complete",
    message: "Temporal and semantic harmonization stabilized.",
  },

  {
    id: "trace-003",
    stage: "geo_resolution",
    timestamp: "2026-05-12T12:00:08Z",
    status: "active",
    title: "Geo Resolution Active",
    message: "Infrastructure and environmental vectors resolving.",
  },
];