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
  | "ANNOTATION";

export type ArtifactRepository =
  | "LOCAL"
  | "ZENODO";

export type Artifact = {

  id: string;

  title: string;

  artifact_type:
    ArtifactType;

  repository:
    ArtifactRepository;

  doi?: string;

  url?: string;

  derived_from:
    string[];

  created_at:
    string;
};