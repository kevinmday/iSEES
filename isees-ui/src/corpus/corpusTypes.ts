import type {
CanonicalReplayEvent,
} from "../adapters/canonicalEventAdapter";

import type {
SimilarityResolution,
} from "./resolution/resolutionTypes";

export type CorpusSourceType =
| "SYSTEM_CANON"
| "RESEARCH_CANON"
| "ROR"
| "EOR"
| "SCU"
| "RADAR"
| "ARGUS"
| "MANUAL";

export interface CorpusSource {
id: string;

source_type: CorpusSourceType;

title: string;

description?: string;

url?: string;

created_at: string;
}

export interface ResolutionRecord {
source_id: string;

source_type: CorpusSourceType;

confidence: number;

imported_at: string;

imported_by?: string;
}

export interface CorpusEvent {
corpus_id: string;

canonical_event: CanonicalReplayEvent;

// Provenance / federation records
resolutions: ResolutionRecord[];

// Deterministic similarity analysis
similarity_resolutions?: SimilarityResolution[];

created_at: string;

updated_at: string;
}
