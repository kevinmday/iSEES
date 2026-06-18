// ============================================================
// Corpus Adapter Contract
// P24.2A
// ============================================================

import type { CorpusEvent } from "../corpusTypes";

export interface CorpusAdapter {
  sourceName: string;

  importEvents(): Promise<CorpusEvent[]>;
}