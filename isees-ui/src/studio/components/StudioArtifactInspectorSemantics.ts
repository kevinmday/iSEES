export const STUDIO_ARTIFACT_EMPTY_MESSAGE = "No Studio artifact has been saved yet.";
export const STUDIO_ARTIFACT_EMPTY_ACTION = "Save the active .author document to create its first Studio artifact version.";
export const STUDIO_PROJECTION_EMPTY_MESSAGE = "Save a Studio artifact version before validating, previewing, or materializing output.";

export function isExpectedUnsavedArtifact(error: unknown, hasValidActiveDocument: boolean): boolean {
  return hasValidActiveDocument
    && typeof error === "object"
    && error !== null
    && "code" in error
    && error.code === "STUDIO_ARTIFACT_NOT_FOUND";
}

export function hasDurableArtifactVersion(artifactId: string | undefined, currentVersionId: string | undefined, versionId: string | undefined): boolean {
  return Boolean(artifactId && currentVersionId && versionId && currentVersionId === versionId);
}
