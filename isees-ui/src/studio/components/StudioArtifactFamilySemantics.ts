import type { ProjectionStatus, ProjectionStatusList } from "../v1/api/StudioV1AuthorApiTypes.ts";

export const STUDIO_CHILD_FORMATS = ["PDF", "DOCX", "HTML"] as const;
export type StudioChildFormat = typeof STUDIO_CHILD_FORMATS[number];
export type StudioChildDisplayState = "CURRENT" | "STALE" | "VALIDATING" | "QUEUED" | "FAILED" | "UNAVAILABLE";

export interface StudioChildGlyphState {
  readonly format: StudioChildFormat;
  readonly state: StudioChildDisplayState;
  readonly label: string;
  readonly parentRevisionId?: string;
  readonly projection?: ProjectionStatus;
}

const serverState = (projection: ProjectionStatus, headRevisionId: string): Pick<StudioChildGlyphState, "state" | "label"> => {
  if (projection.parentRevisionId !== headRevisionId) return { state: "STALE", label: "Stale · prior revision" };
  switch (projection.state) {
    case "CURRENT": return projection.outputHash ? { state: "CURRENT", label: "Current" } : { state: "UNAVAILABLE", label: "Unavailable · output unproven" };
    case "PUBLISHED": return projection.outputHash ? { state: "CURRENT", label: "Current · published" } : { state: "UNAVAILABLE", label: "Unavailable · output unproven" };
    case "STALE": case "SUPERSEDED": return { state: "STALE", label: projection.state === "STALE" ? "Stale" : "Superseded" };
    case "REBUILDING": return { state: "VALIDATING", label: "Validating / materializing" };
    case "QUEUED": return { state: "QUEUED", label: "Queued" };
    case "FAILED": return { state: "FAILED", label: "Failed" };
    default: return { state: "UNAVAILABLE", label: projection.state === "RETRACTED" ? "Unavailable · retracted" : "Unavailable" };
  }
};

export function projectStudioArtifactFamily(projections: ProjectionStatusList | undefined, headRevisionId: string | undefined): readonly StudioChildGlyphState[] {
  return STUDIO_CHILD_FORMATS.map(format => {
    if (!projections || !headRevisionId) return { format, state: "UNAVAILABLE", label: "Unavailable" };
    const candidates = projections.items.filter(item => item.format === format);
    const projection = candidates.find(item => item.parentRevisionId === headRevisionId) ?? candidates[0];
    if (!projection) return { format, state: "UNAVAILABLE", label: "Not generated" };
    return { format, parentRevisionId: projection.parentRevisionId, projection, ...serverState(projection, headRevisionId) };
  });
}
