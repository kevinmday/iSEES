import { createContext, useContext, useMemo, useState, type ReactNode } from "react";

export type LayersInspectionSelection =
  | { kind: "SUMMARY" }
  | { kind: "LAYER"; layerId: string }
  | { kind: "CASE_A" }
  | { kind: "CASE_B" }
  | { kind: "BASELINE_RELATIONSHIP" }
  | { kind: "EXPERIMENTAL_RELATIONSHIP" }
  | { kind: "DELTA" }
  | { kind: "CONTRIBUTION"; layerId: string };

interface Value {
  selection: LayersInspectionSelection;
  select: (selection: LayersInspectionSelection) => void;
}

const Context = createContext<Value | undefined>(undefined);

export function LayersPresentationSelectionProvider({ children }: { children: ReactNode }) {
  const [selection, select] = useState<LayersInspectionSelection>({ kind: "SUMMARY" });
  const value = useMemo(() => ({ selection, select }), [selection]);
  return <Context.Provider value={value}>{children}</Context.Provider>;
}

export function useLayersPresentationSelection(): Value {
  const value = useContext(Context);
  if (!value) throw new Error("LayersPresentationSelectionProvider missing.");
  return value;
}
