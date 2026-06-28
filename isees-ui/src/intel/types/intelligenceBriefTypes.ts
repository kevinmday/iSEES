// ============================================================
// src/intel/types/intelligenceBriefTypes.ts
// P26.1
// INTELLIGENCE BRIEF FOUNDATION
// UNIVERSAL INSPECTION SURFACE
//
// Every selectable object in iSEES resolves to exactly one
// Intelligence Brief. The Brief is repository-agnostic and
// represents the intelligence available about an object,
// independent of where it originated.
//
// This is a VIEW MODEL.
//
// It intentionally does NOT mirror CorpusEvent,
// WorkspaceEvent, Artifact, or GraphNode.
//
// ============================================================

// ============================================================
// OBJECT TYPES
// ============================================================

export type IntelligenceObjectType =

  | "EVENT"

  | "ARTIFACT"

  | "PERSON"

  | "ORGANIZATION"

  | "FACILITY"

  | "LOCATION"

  | "NARRATIVE"

  | "HYPOTHESIS";


// ============================================================
// REPOSITORY SOURCES
// ============================================================

export type IntelligenceRepositorySource =

  | "SYSTEM_CANON"

  | "RESEARCH_CANON"

  | "SCU"

  | "AARO"

  | "ZENODO"

  | "ARGUS"

  | "WORKSPACE"

  | "MANUAL"

  | "UNKNOWN";


// ============================================================
// INTELLIGENCE BRIEF
// ============================================================

export interface IntelligenceBrief {

  // ==========================================================
  // OBJECT
  // ==========================================================

  objectType:

    IntelligenceObjectType;

  objectId:

    string;

  title:

    string;


  // ==========================================================
  // SOURCE
  // ==========================================================

  repositorySource:

    IntelligenceRepositorySource;

  repositoryId?:

    string;


  // ==========================================================
  // SUMMARY
  // ==========================================================

  summary?:

    string;


  // ==========================================================
  // FEDERATION
  // ==========================================================

  corpusEventId?:

    string;


  // ==========================================================
  // FUTURE
  // ==========================================================

  // These fields intentionally remain optional until
  // the Intelligence Composer begins populating them.

  metadata?:

    Record<string, unknown>;

  relationships?:

    unknown[];

  provenance?:

    unknown[];

}