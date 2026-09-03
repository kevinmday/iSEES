import type { Investigation } from "../../investigation/investigationTypes";
import { resolveCurrentOperationalRevision } from "../../investigation/revision/OperationalGraphRevision";
import type { KnowledgeObject } from "../../knowledge/model/KnowledgeObject";
import { KnowledgeObjectType } from "../../knowledge/model/KnowledgeObjectTypes";
import type { ResolveExecutionRecord } from "../../resolve/runtime/ResolveRuntimeTypes";
import {
  WorkspaceSelectionKind,
  type WorkspaceSelection,
} from "../../workspace/runtime/WorkspaceRuntimeTypes";
import { buildCanonicalInvestigationGraph } from "./CanonicalInvestigationGraph";

const SYSTEM_CANON_SOURCE_TYPE = "SYSTEM_CANON";

function focusedEventKnowledgeObjectId(
  investigation: Investigation,
  knowledgeObjects: readonly KnowledgeObject[],
): string | undefined {
  const focusedEventId = investigation.workspace.focused_event_id;
  if (!focusedEventId) return undefined;

  const imported = investigation.workspace.imported_events.some(
    reference => reference.event_id === focusedEventId,
  );
  if (!imported) return undefined;

  const matches = knowledgeObjects.filter(
    object =>
      object.type === KnowledgeObjectType.EVENT &&
      object.provenance.sourceType === SYSTEM_CANON_SOURCE_TYPE &&
      object.provenance.sourceId === focusedEventId,
  );

  return matches.length === 1 ? matches[0]!.identity.id : undefined;
}

/**
 * Returns an exact active-current-revision-owned NODE, an EDGE in the focused
 * EVENT's established graph component, or a Resolve candidate whose pair
 * contains that EVENT. NODE selection is independent of focused-EVENT
 * ownership.
 * Stale state is not repaired or mutated; it simply has no projection.
 */
export function resolveCoherentInvestigationSelection(
  investigation: Investigation | undefined,
  knowledgeObjects: readonly KnowledgeObject[],
  selection: WorkspaceSelection | undefined,
): WorkspaceSelection | undefined {
  if (!investigation || !selection || selection.kind === WorkspaceSelectionKind.NONE) {
    return undefined;
  }

  if (selection.kind === WorkspaceSelectionKind.NODE) {
    try {
      const revision = resolveCurrentOperationalRevision(investigation);
      const node = revision.manifold.graph.nodes.find(
        candidate => candidate.id === selection.nodeId,
      );
      if (!node) return undefined;
      return selection;
    } catch {
      return undefined;
    }
  }

  const focusedNodeId = focusedEventKnowledgeObjectId(investigation, knowledgeObjects);
  if (!focusedNodeId) return undefined;

  if (selection.kind === WorkspaceSelectionKind.CANDIDATE) {
    const involvesFocus =
      selection.leftKnowledgeObjectId === focusedNodeId ||
      selection.rightKnowledgeObjectId === focusedNodeId;
    return involvesFocus ? selection : undefined;
  }

  const graph = buildCanonicalInvestigationGraph(knowledgeObjects, focusedNodeId);
  const connected = new Set<string>([focusedNodeId]);
  let changed = true;
  while (changed) {
    changed = false;
    for (const edge of graph.edges) {
      if (connected.has(edge.source) && !connected.has(edge.target)) {
        connected.add(edge.target);
        changed = true;
      } else if (connected.has(edge.target) && !connected.has(edge.source)) {
        connected.add(edge.source);
        changed = true;
      }
    }
  }

  const edge = graph.edges.find(candidate => candidate.id === selection.edgeId);
  return edge && connected.has(edge.source) && connected.has(edge.target)
    ? selection
    : undefined;
}

export function resolveCurrentInvestigationExecution(
  investigation: Investigation | undefined,
  execution: ResolveExecutionRecord | undefined,
): ResolveExecutionRecord | undefined {
  return investigation && execution?.input.investigation.id === investigation.id
    ? execution
    : undefined;
}
