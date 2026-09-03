import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import type { CompareCandidateOption } from "../../compare/projection/CompareCandidateOptionProjection";
import { CompareCandidateOptionProjectionStatus, resolveCompareCandidateOptionProjection } from "../../compare/projection/CompareCandidateOptionProjection";
import { resolveCurrentInvestigationExecution } from "../../intelligence/selection/InvestigationSelectionCoherence";
import { useKnowledgeObjects } from "../../knowledge/runtime/KnowledgeObjectRuntimeContext";
import { resolveCandidateIntelligenceCollection } from "../../resolve/intelligence/ResolveCandidateIntelligenceResolver";
import { useResolveRuntimeState } from "../../resolve/runtime/ResolveRuntimeContext";
import { useWorkspaceRuntime } from "../../workspace/runtime/WorkspaceRuntimeContext";
import type { TimelineTemporalItem } from "../projection";
import { adaptEventTimelineSourceRecords } from "../projection/TimelineSourceRecordAdapter";
import { resolveTimelineEventTitle } from "../presentation/TimelineEventPresentation";

export type TimelineInspection =
  | Readonly<{ kind: "ITEM"; investigationId: string; focusedEventId: string; comparedEventId?: string; item: TimelineTemporalItem }>
  | Readonly<{ kind: "LANE"; investigationId: string; focusedEventId: string; comparedEventId?: string; eventId: string; role: "FOCUSED" | "COMPARED" }>
  | Readonly<{ kind: "CORRESPONDENCE"; investigationId: string; focusedEventId: string; comparedEventId: string; correspondenceId: string; explanation: string; status: string }>;

type TimelineContextValue = Readonly<{
  investigation: ReturnType<ReturnType<typeof useWorkspaceRuntime>["getActiveInvestigation"]>;
  knowledgeObjects: ReturnType<typeof useKnowledgeObjects>;
  focusedEventId: string | null;
  candidates: readonly CompareCandidateOption[];
  selectedCandidate?: CompareCandidateOption;
  effectiveCandidate?: CompareCandidateOption;
  candidateError?: string;
  overviewRequested: boolean;
  inspection?: TimelineInspection;
  eventName: (eventId: string) => string;
  recordsFor: (eventId: string) => ReturnType<typeof adaptEventTimelineSourceRecords>;
  inspect: (inspection?: TimelineInspection) => void;
  selectCandidate: (option: CompareCandidateOption) => void;
  backToOverview: () => void;
}>;

const TimelineContext = createContext<TimelineContextValue | undefined>(undefined);

export function TimelineInspectionProvider({ children }: { children: ReactNode }) {
  const runtime = useWorkspaceRuntime();
  const resolveState = useResolveRuntimeState();
  const knowledgeObjects = useKnowledgeObjects();
  const investigation = runtime.getActiveInvestigation();
  const focusedEventId = investigation?.workspace.focused_event_id ?? null;
  const selection = runtime.getSelection();
  const [inspection, setInspection] = useState<TimelineInspection>();
  const [overviewRequested, setOverviewRequested] = useState(true);

  const candidateProjection = useMemo(() => {
    try {
      const execution = resolveCurrentInvestigationExecution(investigation, resolveState.currentExecution);
      const evaluations = execution?.result?.candidateEvaluations.evaluations;
      const intelligence = evaluations ? resolveCandidateIntelligenceCollection(evaluations).intelligence : [];
      return { result: resolveCompareCandidateOptionProjection(focusedEventId, knowledgeObjects, intelligence, selection) };
    } catch (error) {
      return { error: error instanceof Error ? error.message : "Qualified comparison intelligence is unavailable." };
    }
  }, [focusedEventId, investigation, knowledgeObjects, resolveState.currentExecution, selection]);
  const ready = candidateProjection.result?.status === CompareCandidateOptionProjectionStatus.READY ? candidateProjection.result : undefined;
  const candidates = ready?.options ?? Object.freeze([]);
  const selectedCandidate = ready?.selectedOption;
  const effectiveCandidate = candidates.length === 1 ? candidates[0] : (!overviewRequested ? selectedCandidate : undefined);

  useEffect(() => { setInspection(undefined); setOverviewRequested(true); }, [investigation?.id, focusedEventId]);
  useEffect(() => {
    setInspection(current => current?.comparedEventId === effectiveCandidate?.comparisonEventId || (!current?.comparedEventId && !effectiveCandidate) ? current : undefined);
  }, [effectiveCandidate?.comparisonEventId]);

  const value = useMemo<TimelineContextValue>(() => Object.freeze({
    investigation, knowledgeObjects, focusedEventId, candidates, selectedCandidate, effectiveCandidate,
    candidateError: candidateProjection.error, overviewRequested, inspection,
    eventName: (eventId: string) => resolveTimelineEventTitle(eventId, knowledgeObjects),
    recordsFor: (eventId: string) => investigation ? adaptEventTimelineSourceRecords(investigation, eventId, knowledgeObjects) : Object.freeze([]),
    inspect: setInspection,
    selectCandidate: (option: CompareCandidateOption) => { runtime.setSelection(option.selection); setOverviewRequested(false); setInspection(undefined); },
    backToOverview: () => { setOverviewRequested(true); setInspection(undefined); },
  }), [candidateProjection.error, candidates, effectiveCandidate, focusedEventId, inspection, investigation, knowledgeObjects, overviewRequested, runtime, selectedCandidate]);
  return <TimelineContext.Provider value={value}>{children}</TimelineContext.Provider>;
}

export function useTimelineInspection() {
  const value = useContext(TimelineContext);
  if (!value) throw new Error("useTimelineInspection must be used inside TimelineInspectionProvider.");
  return value;
}
