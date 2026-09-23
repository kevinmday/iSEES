import { WorkspaceMode } from "../../workspace/runtime/WorkspaceRuntimeTypes.ts";
import { getWorkspaceModeLabel } from "../../workspace/presentation/WorkspaceModePresentation.ts";
import {
  GUIDE_DEFINITION_SCHEMA_ID, GUIDE_DEFINITION_SCHEMA_VERSION,
  GuideIdentityClassification, GuideResolveClassification, type GuideBriefing,
  type GuideContextSnapshot, type GuideDefinition,
} from "../contracts/index.ts";

type Content = Readonly<{ purpose: string; startHere: string; steps: readonly string[]; nextMode: string; nextModeReason: string; boundary: string; authenticationNote?: string }>;

const CONTENT: Readonly<Record<WorkspaceMode, Content>> = {
  [WorkspaceMode.OVERVIEW]: {
    purpose: "Understand what iSEES is, why deterministic investigative research matters, and where to begin.", startHere: "Review the orientation, open System Briefing if useful, then enter LIBRARY for operational work.",
    steps: ["Review the product purpose and research philosophy.", "Use the guided orientation or System Briefing for more context.", "Enter LIBRARY to browse, preview, create, open, or resume an investigation."],
    nextMode: "LIBRARY", nextModeReason: "LIBRARY is the authoritative investigation-selection and case-management surface.", boundary: "OVERVIEW does not browse records, activate investigations, run computation, or mutate research state.",
  },
  [WorkspaceMode.LIBRARY]: {
    purpose: "Choose, preview, create, or resume an investigation without changing active investigative state.",
    startHere: "Browse or search existing work and records; selection is preview-only until you choose an explicit open, resume, or create action.",
    steps: ["Search or filter the available records.", "Select an item to preview its authority and available details without changing the workspace.", "Start or bring a new case, or explicitly open or resume qualified work.", "Keep empty saved investigations in LIBRARY and continue setup.", "Use MANIFOLD for deterministic relationship analysis after activation."],
    nextMode: "MANIFOLD after explicit qualified activation", nextModeReason: "MANIFOLD is the first deterministic analytical surface for a populated investigation.", boundary: "LIBRARY does not mutate protected Canon through selection, publish research, run Resolve, or compute relationships.",
    authenticationNote: "Guest work remains browser-session scoped; authenticated saved work uses the existing account ownership, authorization, and persistence authority.",
  },
  [WorkspaceMode.MANIFOLD]: {
    purpose: "Inspect the deterministic investigation topology and its canonical objects and relationships.", startHere: "Single-click a node or edge and review it in Selection Intelligence.",
    steps: ["Single-click a node or edge to inspect it in Selection Intelligence.", "Double-click a qualified node or edge to add it to the Research Inbox; open the collapsed Research Inbox to review collected items.", "Use COMPUTE RELATIONSHIPS to analyze the selected deterministic context when ready.", "Use CLEAR MANIFOLD RESULT only to clear the legacy manifold runtime result.", "Use VIEW controls, including COLLAPSE, only to change the presentation.", "Continue to COMPARE after a valid comparison context becomes available."],
    nextMode: "COMPARE when ready; otherwise remain in MANIFOLD", nextModeReason: "COMPARE requires a valid comparison context from the existing workflow.", boundary: "Guide does not run RESOLVE, change the graph, or add anything to the Research Inbox.",
  },
  [WorkspaceMode.COMPARE]: {
    purpose: "Inspect deterministic correspondence between the focused event and a comparison event.", startHere: "Choose a comparison event from CHANGE COMPARISON.",
    steps: ["Review the pair summary and dimension correspondence.", "Inspect available and unavailable dimensions.", "Confirm whether the relationship is already accepted.", "Use Send to Research when a qualified result has not already been published."],
    nextMode: "NARRATIVE or TIMELINE", nextModeReason: "Use NARRATIVE for the investigation's narrative projection, or TIMELINE for temporal ordering and correspondences.", boundary: "COMPARE does not accept or reject relationships; acceptance belongs to the existing MANIFOLD/Resolve workflow.",
  },
  [WorkspaceMode.NARRATIVE]: {
    purpose: "Inspect the narrative projection and its deterministic relationship to the investigation.", startHere: "Read the available narrative projection and compare it with the focused investigation context.",
    steps: ["Review the narrative projection currently presented.", "Trace the displayed material back to the investigation context.", "Note unavailable or incomplete narrative material as a current read-only limitation.", "Continue to EVIDENCE to inspect the governed supporting material."],
    nextMode: "EVIDENCE", nextModeReason: "Inspect the governed evidence that supports or limits the narrative projection.", boundary: "NARRATIVE is currently a limited inspection surface, not a complete claims-and-contradictions authoring workflow.",
  },
  [WorkspaceMode.EVIDENCE]: {
    purpose: "Inspect governed evidence and conduct researcher-directed Web Discovery.", startHere: "Review existing investigation evidence before opening Web Discovery or adding researcher-provided material.",
    steps: ["Review existing investigation evidence separately from Candidate Evidence.", "Use Web Discovery for a researcher-directed search; Tavily powers it when the provider is available.", "Use the visible intake controls for a Public URL, Researcher note, or Direct media upload.", "Treat discovery results and uploaded material as Candidate Evidence, not facts.", "Explicitly review and accept material through the governed researcher workflow when qualified.", "Publish qualified accepted material to the Research Inbox only through the available explicit control."],
    nextMode: "TIMELINE", nextModeReason: "After sufficient relevant evidence exists, inspect its temporal ordering and correspondences.", boundary: "Discovery results do not automatically enter the Manifold or Research Inbox, and acceptance requires explicit governed researcher action.",
    authenticationNote: "Guest Web Discovery is ephemeral or limited according to the availability and disabled reasons currently shown by the application.",
  },
  [WorkspaceMode.TIMELINE]: {
    purpose: "Inspect temporal ordering, event lanes, moments, and correspondences.", startHere: "Select a lane, temporal item, or correspondence.",
    steps: ["Review the inspector explanation and lineage.", "Use Add to Research Inbox for a qualified moment or correspondence.", "Treat temporal correspondence as an inspection result, not an automatically created canonical edge."],
    nextMode: "LAYERS or INTENTION", nextModeReason: "Use LAYERS to test deterministic contributions or INTENTION to inspect derived intention projections.", boundary: "A temporal correspondence does not automatically create a canonical edge.",
  },
  [WorkspaceMode.LAYERS]: { purpose: "", startHere: "", steps: [], nextMode: "", nextModeReason: "", boundary: "" },
  [WorkspaceMode.INTENTION]: {
    purpose: "Inspect deterministic intention projections, hypotheses, metrics, assumptions, and lineage.", startHere: "Inspect the available intention nodes, links, hypotheses, and derivations.",
    steps: ["Select a projection element to view its details.", "Review assumptions, source knowledge, relationship lineage, model, configuration, and execution identity.", "Use Add to Research Inbox for a qualified hypothesis or derivation."],
    nextMode: "STUDIO", nextModeReason: "Compose published qualified findings into a structured research document.", boundary: "INTENTION is an inspection projection, not a full H0/H1 construction editor; unavailable projections remain explicitly unavailable.",
  },
  [WorkspaceMode.RESEARCH]: {
    purpose: "Compose a structured .author research document from Research Inbox sources and researcher-authored material.", startHere: "Create or open a document, then select a qualified source in the Research Inbox.",
    steps: ["Create or open a document.", "Select a qualified source in the Research Inbox and choose its destination section.", "Use Insert into .author to preserve source-backed content and provenance.", "Add researcher-authored headings or paragraphs.", "Export the current draft as PDF or DOCX when available.", "Sign in only when durable save and session-to-session persistence are required."],
    nextMode: "Continue in STUDIO", nextModeReason: "Refine the document, export it, or sign in to save an authoritative revision.", boundary: "Studio-to-Manifold reconciliation is not currently a completed visible workflow.",
    authenticationNote: "Guests retain local working access and current-draft export. Authentication is required for durable authoritative revision saving, not basic Studio use.",
  },
};

function situation(snapshot: Readonly<GuideContextSnapshot>): string {
  if (!snapshot.activeInvestigationId) return "No investigation is active. Choose or open an available investigation before using investigation-dependent controls.";
  const focused = snapshot.focusedEventId ? ` Focused event: ${snapshot.focusedEventId}.` : " No focused event is currently identified.";
  const count = snapshot.researchInbox.collectedFindingCount + snapshot.researchInbox.incomingSourceCount + snapshot.researchInbox.newLeadCount;
  return `An investigation is active.${focused} Research Inbox: ${count} item${count === 1 ? "" : "s"}.`;
}

export function resolveOperationalGuideDefinition(snapshot: Readonly<GuideContextSnapshot>): GuideDefinition {
  const content = CONTENT[snapshot.activeMode];
  const mode = getWorkspaceModeLabel(snapshot.activeMode);
  const manifoldBlocked = snapshot.activeMode === WorkspaceMode.MANIFOLD && snapshot.resolve.classification === GuideResolveClassification.UNAVAILABLE;
  const briefing: GuideBriefing = Object.freeze({
    definitionId: `mode.${snapshot.activeMode.toLowerCase()}.operational`, location: mode, purpose: content.purpose,
    startHere: content.startHere, steps: Object.freeze([...content.steps]), situation: situation(snapshot), significance: content.purpose,
    recommendedAction: undefined, alternatives: Object.freeze([]), consequences: Object.freeze([]),
    protectedBoundaries: Object.freeze([Object.freeze({ description: content.boundary })]),
    blockers: manifoldBlocked ? Object.freeze([{ code: "RESOLVE_UNAVAILABLE", missing: "Resolve readiness", reason: "Resolve is unavailable in the current computed application state.", remedy: "Use the disabled reason shown by the application before trying RESOLVE again.", changesCanonicalState: false }]) : Object.freeze([]),
    stateReferences: Object.freeze([]), visualSteps: Object.freeze([]), nextMode: content.nextMode, nextModeReason: content.nextModeReason,
    authenticationNote: content.authenticationNote ?? (snapshot.identity === GuideIdentityClassification.GUEST ? "You are using iSEES as a guest." : undefined),
  });
  return Object.freeze({ schemaId: GUIDE_DEFINITION_SCHEMA_ID, schemaVersion: GUIDE_DEFINITION_SCHEMA_VERSION, definitionId: briefing.definitionId, briefing });
}

export const OPERATIONAL_GUIDE_CONTENT = CONTENT;
