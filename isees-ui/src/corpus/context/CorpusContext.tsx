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

  selectedCorpusEventId: string | null;

  setSelectedCorpusEventId: (
    corpusId: string | null
  ) => void;

  addCorpusEvent: (
    event: CorpusEvent
  ) => void;

  removeCorpusEvent: (
    corpusId: string
  ) => void;
}

const CorpusContext =
  createContext<
    CorpusContextValue | undefined
  >(undefined);

export function CorpusProvider({
  children,
}: {
  children: ReactNode;
}) {
  const [corpus, setCorpus] =
    useState<CorpusEvent[]>(
      DEFAULT_CORPUS
    );

  const [
    selectedCorpusEventId,
    setSelectedCorpusEventId,
  ] = useState<string | null>(
    null
  );

  useEffect(() => {
    let mounted = true;

    async function bootstrapCorpus() {
      const events =
        await loadCorpus();

      if (mounted) {
        events.forEach((event) => {
          console.log(
            "[SIM]",
            event.corpus_id,
            event
              .similarity_resolutions
              ?.length ?? 0
          );
        });

        setCorpus(events);

        if (
          events.length > 0 &&
          !selectedCorpusEventId
        ) {
          setSelectedCorpusEventId(
            events[0].corpus_id
          );
        }
      }
    }

    bootstrapCorpus();

    return () => {
      mounted = false;
    };
  }, []);

  function addCorpusEvent(
    event: CorpusEvent
  ) {
    setCorpus((prev) => [
      ...prev,
      event,
    ]);
  }

  function removeCorpusEvent(
    corpusId: string
  ) {
    setCorpus((prev) =>
      prev.filter(
        (event) =>
          event.corpus_id !== corpusId
      )
    );

    if (
      selectedCorpusEventId ===
      corpusId
    ) {
      setSelectedCorpusEventId(
        null
      );
    }
  }

  return (
    <CorpusContext.Provider
      value={{
        corpus,
        selectedCorpusEventId,
        setSelectedCorpusEventId,
        addCorpusEvent,
        removeCorpusEvent,
      }}
    >
      {children}
    </CorpusContext.Provider>
  );
}

export function useCorpus() {
  const context =
    useContext(CorpusContext);

  if (!context) {
    throw new Error(
      "useCorpus must be used within CorpusProvider"
    );
  }

  return context;
}