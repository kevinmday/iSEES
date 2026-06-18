// ============================================================
// System Canon Adapter
// P24.2A
// ============================================================

import type { CorpusAdapter } from "./corpusAdapter";
import type { CorpusEvent } from "../corpusTypes";

import { CANONICAL_EVENTS } from "../../canonical/runtimeCorpus";

export class SystemCanonAdapter implements CorpusAdapter {
  sourceName = "SYSTEM_CANON";

  async importEvents(): Promise<CorpusEvent[]> {
    return CANONICAL_EVENTS.map((event) => ({
      corpus_id: event.event_id,

      canonical_event: event,

      resolutions: [
        {
          source_id: event.event_id,
          source_type: "SYSTEM_CANON",
          confidence: 1.0,
          imported_at: new Date().toISOString(),
        },
      ],

      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    }));
  }
}