import type { ResearchGraphAnchor } from "../../research/researchBridgeTypes";

/**
 * Resolves the primary label for a graph entry without changing its graph
 * identity. The graph ID is a deterministic last resort for legacy records
 * that do not carry a usable display projection.
 */
export function researchInboxGraphEntryTitle(
  anchor: ResearchGraphAnchor,
): string {
  const displayTitle =
    typeof anchor.display?.title === "string"
      ? anchor.display.title.trim()
      : "";

  return displayTitle || `${anchor.graph.type} ${anchor.graph.id}`;
}
