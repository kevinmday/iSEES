import { createContext, useCallback, useContext, useEffect, useRef, useState, type ReactNode } from "react";
import { useFederation } from "../../../federation/context/FederationContext";
import { useKnowledgeObjects } from "../../../knowledge/runtime/KnowledgeObjectRuntimeContext";
import { useWorkspaceRuntime } from "../../runtime/WorkspaceRuntimeContext";
import { executeOverviewCanonicalActivation, type OverviewCanonicalActivationOutcome } from "./OverviewCanonicalActivationCommand";
import { useOverviewSelection } from "./OverviewSelectionContext";
import { importCanonEventIntoOwnedInvestigation } from "../../../investigation/continuity/OwnedCanonEventImport";
import { researchBridgeRuntime } from "../../../research/ResearchBridgeRuntime";

type ActivationStatus = "IDLE" | "STARTING" | "SUCCEEDED" | "ERROR";
interface OverviewCanonicalActivationValue { readonly canActivate: boolean; readonly canImport: boolean; readonly importStatus: ActivationStatus; readonly importMessage:string|null; readonly destinationTitle:string|null; readonly status: ActivationStatus; readonly message: string | null; readonly activate: () => Promise<OverviewCanonicalActivationOutcome>; readonly importIntoActive:()=>Promise<void>; }
interface ActivationFeedback { readonly eventId: string; readonly status: Exclude<ActivationStatus, "IDLE">; readonly message: string; }
const OverviewCanonicalActivationContext = createContext<OverviewCanonicalActivationValue | undefined>(undefined);

export function OverviewCanonicalActivationProvider({ children }: { readonly children: ReactNode }) {
  const { selection } = useOverviewSelection();
  const federation = useFederation();
  const runtime = useWorkspaceRuntime();
  const knowledge = useKnowledgeObjects();
  const [feedback, setFeedback] = useState<ActivationFeedback>();
  const [importFeedback,setImportFeedback]=useState<ActivationFeedback>();
  const generation = useRef(0);
  const mounted = useRef(true);
  const pending = useRef<Promise<OverviewCanonicalActivationOutcome> | null>(null);
  const selectedEventId = selection.kind === "CANON_EVENT" ? selection.eventId : null;
  const systemCanon = federation.repositories.find(item => item.repository.id === "SYSTEM_CANON");
  const canActivate = selectedEventId !== null && systemCanon !== undefined
    && systemCanon.events.some(event => event.canonical_event.event_id === selectedEventId);
  const alreadyActive = selectedEventId !== null
    && runtime.getActiveInvestigation()?.workspace.focused_event_id === selectedEventId;
  const activeInvestigation=runtime.getActiveInvestigation();
  const canImport=canActivate&&activeInvestigation?.createdBy==="AUTHENTICATED_RESEARCHER";

  useEffect(() => {
    generation.current += 1;
    pending.current = null;
  }, [selectedEventId]);

  useEffect(() => {
    // React StrictMode replays setup -> cleanup -> setup in development.
    // Each setup must restore the live mount acknowledgement.
    mounted.current = true;
    return () => {
      mounted.current = false;
      generation.current += 1;
    };
  }, []);

  const activate = useCallback(() => {
    if (pending.current !== null) return pending.current;
    if (!canActivate || alreadyActive || selectedEventId === null || systemCanon === undefined) {
      return Promise.resolve(Object.freeze({ status: "ERROR" as const, error: new Error("This canonical event is not available for activation.") }));
    }
    const activationGeneration = generation.current;
    setFeedback({ eventId: selectedEventId, status: "STARTING", message: "Loading canonical event…" });
    const promise = executeOverviewCanonicalActivation({
      adapter: systemCanon.adapter,
      eventId: selectedEventId,
      runtime,
      admittedKnowledge: knowledge,
      activationStillCurrent: () => mounted.current && generation.current === activationGeneration,
    }).then(outcome => {
      if (mounted.current && generation.current === activationGeneration) {
        if (outcome.status === "SUCCEEDED") {
          setFeedback({ eventId: selectedEventId, status: "SUCCEEDED", message: `${outcome.result.investigation.name} is open in the current workspace. No account investigation was saved.` });
        } else {
          setFeedback({ eventId: selectedEventId, status: "ERROR", message: outcome.error.message });
        }
        pending.current = null;
      }
      return outcome;
    });
    pending.current = promise;
    return promise;
  }, [alreadyActive, canActivate, knowledge, runtime, selectedEventId, systemCanon]);

  const currentFeedback = feedback?.eventId === selectedEventId ? feedback : undefined;
  const currentImport=importFeedback?.eventId===selectedEventId?importFeedback:undefined;
  const importIntoActive=useCallback(async()=>{if(!canImport||!activeInvestigation||!selectedEventId||!systemCanon)return;setImportFeedback({eventId:selectedEventId,status:"STARTING",message:`Importing into ${activeInvestigation.name}…`});try{const preview=await systemCanon.adapter.preview(selectedEventId);const result=await importCanonEventIntoOwnedInvestigation({investigation:activeInvestigation,event:preview.event,repository:systemCanon.repository,knowledge,expectedAggregateRevision:activeInvestigation.revisions.length,idempotencyKey:`canon-import:${activeInvestigation.id}:${selectedEventId}`});runtime.activateAdoptedOwnedInvestigation(result.activation);researchBridgeRuntime.activateOwnedInvestigation(result.activation);setImportFeedback({eventId:selectedEventId,status:"SUCCEEDED",message:result.duplicate?`${selectedEventId} is already imported into ${activeInvestigation.name}.`:`Imported ${selectedEventId}. ${activeInvestigation.name} remains active.`})}catch(error){setImportFeedback({eventId:selectedEventId,status:"ERROR",message:error instanceof Error?error.message:"The Canon event could not be imported safely."})}},[activeInvestigation,canImport,knowledge,runtime,selectedEventId,systemCanon]);
  // Refs are read only when the registered activation callback is invoked.
  // eslint-disable-next-line react-hooks/refs
  const value: OverviewCanonicalActivationValue = Object.freeze({ canActivate, canImport, importStatus:currentImport?.status??"IDLE",importMessage:currentImport?.message??null,destinationTitle:activeInvestigation?.name??null,status: currentFeedback?.status ?? "IDLE", message: currentFeedback?.message ?? null, activate,importIntoActive });
  return <OverviewCanonicalActivationContext.Provider value={value}>{children}</OverviewCanonicalActivationContext.Provider>;
}

// The hook intentionally shares this module with its single provider boundary.
// eslint-disable-next-line react-refresh/only-export-components
export function useOverviewCanonicalActivation(): OverviewCanonicalActivationValue {
  const context = useContext(OverviewCanonicalActivationContext);
  if (context === undefined) throw new Error("useOverviewCanonicalActivation must be used inside OverviewCanonicalActivationProvider");
  return context;
}
