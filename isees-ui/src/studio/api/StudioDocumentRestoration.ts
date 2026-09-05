import type { ComputationalAuthorDocument } from "../../author/model/AuthorDocument";

function restoreDate(value: unknown): Date | undefined {
  if (!(value instanceof Date) && typeof value !== "string") return undefined;
  const restored = new Date(value);
  return Number.isNaN(restored.getTime()) ? undefined : restored;
}

/** Restores JSON transport dates before returning a backend version to the sole Author runtime owner. */
export function restoreStudioDocument(value: unknown): ComputationalAuthorDocument | undefined {
  if (!value || typeof value !== "object") return undefined;
  const document = structuredClone(value) as { identity: { id: string; createdAt: unknown }; metadata: { modifiedAt: unknown }; nodes: Array<Record<string, unknown>> };
  if (!document.identity?.id || !document.metadata || !Array.isArray(document.nodes)) return undefined;
  const createdAt = restoreDate(document.identity.createdAt);
  const modifiedAt = restoreDate(document.metadata.modifiedAt);
  if (!createdAt || !modifiedAt) return undefined;
  document.identity.createdAt = createdAt;
  document.metadata.modifiedAt = modifiedAt;
  for (const node of document.nodes) {
    if ("insertedAt" in node) {
      const insertedAt = restoreDate(node.insertedAt);
      if (!insertedAt) return undefined;
      node.insertedAt = insertedAt;
    }
    if ("createdAt" in node) {
      const nodeCreatedAt = restoreDate(node.createdAt);
      if (!nodeCreatedAt) return undefined;
      node.createdAt = nodeCreatedAt;
    }
  }
  return document as unknown as ComputationalAuthorDocument;
}
