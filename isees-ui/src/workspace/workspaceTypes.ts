// ============================================================
// WORKSPACE DOMAIN MODEL
// P24.1 ARTIFACT FOUNDATION
// ============================================================

import type {
  Artifact
} from "../artifacts/artifactTypes";
import type { NativeCaseDraftContent } from "../nativeCaseDraft/NativeCaseDraftTypes";

export type WorkspaceReferenceSource =
  | "SYSTEM_CANON"
  | "RESEARCH_CANON"
  | "LIVE_EVENT"
  | "RESEARCHER_SUPPLIED";

export type GuestCandidateEvent = Readonly<{
  candidateId: string;
  knowledgeClassification: "CANDIDATE_KNOWLEDGE";
  origin: "RESEARCHER_SUPPLIED";
  lifecycle: "DRAFT";
  objectType: "EVENT";
  operationalMaterialization: "NONE";
  systemCanonIdentity: null;
  title: string;
  content: NativeCaseDraftContent;
  canonicalSerialization: string;
}>;

export type WorkspaceReference = {

  event_id: string;

  source:
    WorkspaceReferenceSource;
};

export type WorkspaceInvestigation = {

  id: string;

  title: string;

  created_at: string;

  notes: string[];
};

export type Workspace = {

  id: string;

  name: string;

  description: string;

  imported_events:
    WorkspaceReference[];

  focused_event_id:
    string | null;

  guest_candidate_event?:
    GuestCandidateEvent;

  investigations:
    WorkspaceInvestigation[];

  artifacts:
    Artifact[];

  active_layers:
    string[];

  created_at: string;
};
