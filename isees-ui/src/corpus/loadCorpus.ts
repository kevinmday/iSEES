// ============================================================
// Corpus Loader
// P24.3
// SYSTEM CANON + SCU FEDERATION
// RESOLUTION ENGINE INTEGRATION
// FULL DROP-IN REPLACEMENT
// ============================================================

import type {
CorpusEvent,
} from "./corpusTypes";

import {
SystemCanonAdapter,
} from "./adapters/systemCanonAdapter";

import {
SCUAdapter,
} from "./adapters/scuAdapter";

import {
resolveAgainstCorpus,
} from "./resolution/resolutionEngine";

export async function loadCorpus(): Promise<CorpusEvent[]> {

const adapters = [


new SystemCanonAdapter(),

new SCUAdapter(),


];

const corpus: CorpusEvent[] = [];

for (const adapter of adapters) {


const events =
  await adapter.importEvents();

corpus.push(...events);


}

// ==========================================================
// DETERMINISTIC RESOLUTION PASS
// ==========================================================

for (const event of corpus) {


event.similarity_resolutions =
  resolveAgainstCorpus(
    event.canonical_event,
    corpus.filter(
      (candidate) =>
        candidate.corpus_id !==
        event.corpus_id
    )
  );


}

return corpus;
}
