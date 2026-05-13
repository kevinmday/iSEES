export type PipelineMode = "live" | "replay";

export type PipelineStage =
  | "ingestion"
  | "normalization"
  | "geo_resolution"
  | "observability_geometry"
  | "ontology_extraction"
  | "signature_synthesis"
  | "entanglement"
  | "clustering"
  | "event_inference"
  | "contextual_intelligence";

export interface PipelineTraceEntry {
  id: string;
  stage: PipelineStage;
  timestamp: string;
  status: "pending" | "active" | "complete";
  title: string;
  message: string;
}

export interface PipelineTraceState {
  mode: PipelineMode;
  entries: PipelineTraceEntry[];
  activeStage?: PipelineStage;
  replayPosition?: number;
  liveConnected?: boolean;
}
