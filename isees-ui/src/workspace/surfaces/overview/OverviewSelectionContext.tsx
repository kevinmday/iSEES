import {
  createContext,
  useCallback,
  useContext,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";

import { useOperatorIdentity } from "../../../identity/runtime/OperatorIdentityRuntimeContext";
import {
  resolveInvestigationLibraryAuthority,
  useInvestigationLibraryRuntime,
  type InvestigationLibraryPublicState,
} from "../../../investigation/library/InvestigationLibraryRuntimeContext";
import { InvestigationLibraryStatus } from "../../../investigation/frontDoor/FrontDoorProjectionTypes";
import {
  commitOverviewSelection,
  overviewAuthorityEpoch,
  resolveOverviewSelection,
  type OverviewCanonCard,
  type OverviewRepository,
  type OverviewSelection,
  type OverviewSelectionEnvelope,
} from "./OverviewEndStateModel";

export type { OverviewSelection } from "./OverviewEndStateModel";

interface OverviewSelectionContextValue {
  readonly selection: OverviewSelection;
  readonly library: InvestigationLibraryPublicState;
  readonly accountAuthorityReady: boolean;
  readonly selectCanonEvent: (event: OverviewCanonCard) => void;
  readonly selectRepository: (repository: OverviewRepository) => void;
  readonly selectOwnedInvestigation: (summary: Readonly<{ investigationId: string; title: string }>) => void;
  readonly clearSelection: () => void;
}

const OverviewSelectionContext = createContext<OverviewSelectionContextValue | undefined>(undefined);

export function OverviewSelectionProvider({ children }: { readonly children: ReactNode }) {
  const identity = useOperatorIdentity();
  const { state: library } = useInvestigationLibraryRuntime();
  const authority = useMemo(() => resolveInvestigationLibraryAuthority(identity), [identity]);
  const epoch = overviewAuthorityEpoch(authority);
  const currentEpochRef = useRef(epoch);
  currentEpochRef.current = epoch;
  const [envelope, setEnvelope] = useState<OverviewSelectionEnvelope | null>(null);

  useLayoutEffect(() => {
    setEnvelope(current => current !== null && current.authorityEpoch !== epoch ? null : current);
  }, [epoch]);

  const guardedSet = useCallback((capturedEpoch: string | null, selection: OverviewSelection) => {
    if (capturedEpoch === null) return;
    setEnvelope(() => commitOverviewSelection(capturedEpoch, currentEpochRef.current, selection));
  }, []);

  const selectCanonEvent = useCallback((event: OverviewCanonCard) => {
    const capturedEpoch = epoch;
    guardedSet(capturedEpoch, Object.freeze({
      kind: "CANON_EVENT",
      eventId: event.eventId,
      title: event.title,
      year: event.year,
      location: event.location,
      classification: event.classification,
      vectors: Object.freeze([...event.vectors]),
    }));
  }, [epoch, guardedSet]);

  const selectRepository = useCallback((repository: OverviewRepository) => {
    const capturedEpoch = epoch;
    guardedSet(capturedEpoch, Object.freeze({
      kind: "EXTERNAL_REPOSITORY",
      name: repository.name,
      capability: repository.state,
      note: repository.note,
    }));
  }, [epoch, guardedSet]);

  const selectOwnedInvestigation = useCallback((summary: Readonly<{ investigationId: string; title: string }>) => {
    const capturedEpoch = epoch;
    if (
      authority?.kind !== "ACCOUNT"
      || library.status !== InvestigationLibraryStatus.READY
      || !library.summaries.some(item => item.investigationId === summary.investigationId)
    ) return;
    guardedSet(capturedEpoch, Object.freeze({
      kind: "OWNED_INVESTIGATION",
      investigationId: summary.investigationId,
      title: summary.title,
    }));
  }, [authority?.kind, epoch, guardedSet, library]);

  const clearSelection = useCallback(() => setEnvelope(null), []);
  const selection = resolveOverviewSelection(envelope, authority, library);
  const value = useMemo<OverviewSelectionContextValue>(() => Object.freeze({
    selection,
    library,
    accountAuthorityReady: authority?.kind === "ACCOUNT",
    selectCanonEvent,
    selectRepository,
    selectOwnedInvestigation,
    clearSelection,
  }), [selection, library, authority?.kind, selectCanonEvent, selectRepository, selectOwnedInvestigation, clearSelection]);

  return <OverviewSelectionContext.Provider value={value}>{children}</OverviewSelectionContext.Provider>;
}

export function useOverviewSelection(): OverviewSelectionContextValue {
  const context = useContext(OverviewSelectionContext);
  if (context === undefined) throw new Error("useOverviewSelection must be used inside OverviewSelectionProvider");
  return context;
}
