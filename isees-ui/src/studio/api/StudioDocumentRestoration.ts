import type { ComputationalAuthorDocument } from "../../author/model/AuthorDocument";

/** Restores JSON transport dates before returning a backend version to the sole Author runtime owner. */
export function restoreStudioDocument(value: unknown): ComputationalAuthorDocument | undefined {
  if (!value || typeof value !== "object") return undefined;
  const document = structuredClone(value) as { identity: { id: string; createdAt: Date }; metadata: { modifiedAt: Date }; nodes: Array<Record<string, unknown>> };
  if (!document.identity?.id || !document.metadata || !Array.isArray(document.nodes)) return undefined;
  document.identity.createdAt = new Date(document.identity.createdAt);
  document.metadata.modifiedAt = new Date(document.metadata.modifiedAt);
  for (const node of document.nodes) {
    if ("insertedAt" in node) node.insertedAt = new Date(node.insertedAt as string);
    if ("createdAt" in node) node.createdAt = new Date(node.createdAt as string);
  }
  return Number.isNaN(document.identity.createdAt.getTime()) || Number.isNaN(document.metadata.modifiedAt.getTime()) ? undefined : document as unknown as ComputationalAuthorDocument;
}
