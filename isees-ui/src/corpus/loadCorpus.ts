// ============================================================
// Corpus Loader
// P24.2A
// ============================================================

import type { CorpusEvent } from "./corpusTypes";

import { SystemCanonAdapter } from "./adapters/systemCanonAdapter";

export async function loadCorpus(): Promise<CorpusEvent[]> {
  const adapters = [
    new SystemCanonAdapter(),
  ];

  const corpus: CorpusEvent[] = [];

  for (const adapter of adapters) {
    const events = await adapter.importEvents();

    corpus.push(...events);
  }

  return corpus;
}