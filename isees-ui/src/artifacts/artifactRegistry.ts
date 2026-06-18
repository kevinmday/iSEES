// ============================================================
// ARTIFACT REGISTRY
// P24.2 CANONICAL SEED ARTIFACTS
// ============================================================

import type {
  Artifact,
} from "./artifactTypes";

export const DEFAULT_ARTIFACTS:
  Artifact[] = [

  {
    id:
      "FAC-PRINCETON",

    title:
      "USS Princeton",

    artifact_type:
      "FACILITY",

    repository:
      "SYSTEM_CANON",

    description:
      "AEGIS cruiser participating in the Nimitz encounter.",

    derived_from: [
      "E-TICTAC-2004",
    ],

    created_at:
      new Date().toISOString(),
  },
];