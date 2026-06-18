import {
createContext,
useContext,
useState,
useEffect,
type ReactNode,
} from "react";

import type { CorpusEvent } from "../corpusTypes";
import { DEFAULT_CORPUS } from "../defaultCorpus";
import { loadCorpus } from "../loadCorpus";

interface CorpusContextValue {
corpus: CorpusEvent[];

addCorpusEvent: (event: CorpusEvent) => void;

removeCorpusEvent: (corpusId: string) => void;
}

const CorpusContext =
createContext<CorpusContextValue | undefined>(
undefined
);

export function CorpusProvider({
children,
}: {
children: ReactNode;
}) {
const [corpus, setCorpus] =
useState<CorpusEvent[]>(DEFAULT_CORPUS);

useEffect(() => {
let mounted = true;

async function bootstrapCorpus() {
  const events = await loadCorpus();

  if (mounted) {
    console.log(
      "[CORPUS]",
      events.length,
      events.map((e) => e.corpus_id)
    );

    setCorpus(events);
  }
}

bootstrapCorpus();

return () => {
  mounted = false;
};

}, []);

function addCorpusEvent(event: CorpusEvent) {
setCorpus((prev) => [...prev, event]);
}

function removeCorpusEvent(corpusId: string) {
setCorpus((prev) =>
prev.filter(
(event) => event.corpus_id !== corpusId
)
);
}

return (
<CorpusContext.Provider
value={{
corpus,
addCorpusEvent,
removeCorpusEvent,
}}
>
{children}
</CorpusContext.Provider>
);
}

export function useCorpus() {
const context = useContext(CorpusContext);

if (!context) {
throw new Error(
"useCorpus must be used within CorpusProvider"
);
}

return context;
}
