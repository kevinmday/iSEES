// ============================================================
// useSyntheticEvent.ts
// ============================================================

import { useEffect, useState } from "react";
import { SyntheticEventEngine } from "./synthetic_event_feed";

export function useSyntheticEvent(eventId?: string) {
  const [engine] = useState(() => new SyntheticEventEngine(eventId));
  const [state, setState] = useState(engine.getCurrentState());

  useEffect(() => {
    const interval = setInterval(() => {
      setState(engine.getCurrentState());
    }, 1000);

    return () => clearInterval(interval);
  }, [engine]);

  return {
    state,
    reset: (id?: string) => engine.reset(id)
  };
}