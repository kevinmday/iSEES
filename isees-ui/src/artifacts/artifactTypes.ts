// ============================================================
// ARTIFACT DOMAIN MODEL
// P24.1 FOUNDATION
// ============================================================

export type ArtifactType =
  | "SOURCE"
  | "OCR"
  | "TRANSLATION"
  | "EXTRACTION"
  | "SUMMARY"
  | "ANNOTATION"
  | "OBSERVATION"
  | "FACILITY"
  | "CONTACT"
  | "POINTEL"
  | "HYPOTHESIS"
  | "NARRATIVE";

export type ArtifactRepository =
  | "LOCAL"
  | "ZENODO"
  | "SYSTEM_CANON"
  | "RESEARCH_CANON"
  | "WORKSPACE";

export type Artifact = {

  id: string;

  title: string;

  artifact_type:
    ArtifactType;

  repository:
    ArtifactRepository;

  description?:
    string;

  confidence?:
    number;

  doi?:
    string;

  url?:
    string;

  tags?:
    string[];

  derived_from:
    string[];

  created_at:
    string;
};