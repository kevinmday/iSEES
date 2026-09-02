import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import { LayersExperimentRuntime } from "./LayersExperimentRuntime";
import type { LayersExperimentState } from "./LayersExperimentRuntimeTypes";

type Value = { runtime: LayersExperimentRuntime; revision: number };
const Context = createContext<Value | undefined>(undefined);

export function LayersExperimentRuntimeProvider({ children }: { children: ReactNode }) {
  const runtime = useMemo(() => new LayersExperimentRuntime(), []);
  const [revision, setRevision] = useState(() => runtime.getState().revision);
  useEffect(() => {
    const unsubscribe = runtime.subscribe(() => setRevision(runtime.getState().revision));
    setRevision(runtime.getState().revision);
    return () => { unsubscribe(); runtime.reset(); };
  }, [runtime]);
  return <Context.Provider value={{ runtime, revision }}>{children}</Context.Provider>;
}

export function useLayersExperimentRuntime(): LayersExperimentRuntime {
  const value = useContext(Context);
  if (!value) throw new Error("LayersExperimentRuntimeProvider missing.");
  return value.runtime;
}

export function useLayersExperimentState(): LayersExperimentState {
  const value = useContext(Context);
  if (!value) throw new Error("LayersExperimentRuntimeProvider missing.");
  return value.runtime.getState();
}

export function useLayersExperimentRevision(): number {
  const value = useContext(Context);
  if (!value) throw new Error("LayersExperimentRuntimeProvider missing.");
  return value.revision;
}
