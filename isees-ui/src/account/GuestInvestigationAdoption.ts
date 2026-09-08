import type { GuestWorkspaceSessionSnapshot } from "../workspace/persistence/GuestWorkspaceSessionPersistenceTypes";
import { resolveApiBaseUrl } from "../api/ApiOrigin.ts";

export type AdoptionPhase = "IDLE" | "GUEST_CANDIDATE_CAPTURED" | "AUTHENTICATING" | "AWAITING_DECISION" | "PRESERVING" | "OWNED_ACTIVE" | "RECOVERABLE_ERROR" | "DISCARDED";

export interface GuestAdoptionCommand {
  readonly schemaVersion: "guest-investigation-adoption/v1";
  readonly idempotencyKey: string;
  readonly source: { readonly kind: "GUEST_SESSION"; readonly guestInvestigationId: string; readonly snapshotCreatedAt: string; readonly snapshotUpdatedAt: string };
  readonly title: string; readonly objective: string | null;
  readonly workspace: { readonly sourceWorkspaceId: string; readonly nodes: readonly unknown[]; readonly edges: readonly unknown[] };
  readonly researchInbox: readonly unknown[]; readonly artifacts: readonly unknown[];
  readonly viewState: { readonly activeMode: string; readonly focusedEventId: string | null; readonly activeLayers: readonly string[]; readonly temporalContext: string | null; readonly investigativeScale: string | null };
}

export interface FrozenGuestCandidate { readonly snapshot: GuestWorkspaceSessionSnapshot; readonly command: GuestAdoptionCommand }
export interface AdoptionReceipt { readonly investigationId: string; readonly aggregateRevision: number; readonly activation: unknown }

function text(value: unknown, field: string): string | null {
  if (value === undefined || value === null) return null;
  if (typeof value !== "string") throw new Error(`${field} cannot be preserved by this account transition.`);
  return value;
}

export function captureGuestAdoptionCandidate(snapshot: GuestWorkspaceSessionSnapshot, idempotencyKey = crypto.randomUUID()): FrozenGuestCandidate | null {
  const investigation = snapshot.workspace.investigation;
  if (!investigation) return null;
  const workspace = snapshot.workspace.workspace ?? investigation.workspace;
  const revision = investigation.revisions.find(item => item.id === investigation.currentRevisionId) ?? investigation.revisions.at(-1);
  const graphNodes = revision?.manifold.graph.nodes ?? [];
  const graphEdges = revision?.manifold.graph.edges ?? [];
  const canonicalIds = new Set(workspace.imported_events.map(item => item.event_id));
  const canonicalIdForNode = (nodeId: string): string | null => {
    if (canonicalIds.has(nodeId)) return nodeId;
    if (nodeId.startsWith("system:event:")) {
      const candidate = nodeId.slice("system:event:".length);
      if (canonicalIds.has(candidate)) return candidate;
    }
    return null;
  };
  const nodes = graphNodes.length > 0
    ? graphNodes.map(node => { const canonicalEventId = canonicalIdForNode(node.id); return ({ id: node.id, kind: canonicalEventId ? "CANONICAL_EVENT" : "NOTE", canonicalEventId, title: node.label }); })
    : workspace.imported_events.map(item => ({ id: item.event_id, kind: "CANONICAL_EVENT", canonicalEventId: item.event_id, title: item.event_id }));
  const representedCanonicalIds = new Set(nodes.flatMap(node => node.canonicalEventId ? [node.canonicalEventId] : []));
  if ([...canonicalIds].some(canonicalId => !representedCanonicalIds.has(canonicalId))) throw new Error("Some canonical investigation events cannot be preserved safely.");
  const nodeIds = new Set(nodes.map(node => node.id));
  const edges = graphEdges.map(edge => ({ id: edge.id, sourceId: edge.source, targetId: edge.target,
    kind: edge.relationship === "SUPPORTS" || edge.relationship === "CONTRADICTS" ? edge.relationship : "RELATED" }));
  if (edges.some(edge => !nodeIds.has(edge.sourceId) || !nodeIds.has(edge.targetId))) throw new Error("Some investigation graph relationships cannot be preserved safely.");
  const humanGraphTitle = (canonicalSourceId: string, persistedTitle: string): string => {
    const separator = canonicalSourceId.indexOf(":");
    const type = canonicalSourceId.slice(0, separator), id = canonicalSourceId.slice(separator + 1);
    const placeholder = !persistedTitle.trim() || persistedTitle.trim() === id || persistedTitle.trim() === canonicalSourceId;
    if (!placeholder || separator <= 0) return persistedTitle;
    if (type === "NODE") return nodes.find(node => node.id === id)?.title ?? persistedTitle;
    if (type === "EDGE") {
      const edge = edges.find(item => item.id === id);
      const source = edge && nodes.find(node => node.id === edge.sourceId), target = edge && nodes.find(node => node.id === edge.targetId);
      return edge && source && target ? `${source.title} ${edge.kind.toLocaleLowerCase()} ${target.title}` : persistedTitle;
    }
    return persistedTitle;
  };
  const researchInbox = snapshot.research.desk.entries.map(entry => ({ anchorId: entry.anchor.anchorId, order: entry.order,
    title: humanGraphTitle(entry.anchor.sourceIdentity, entry.anchor.display.title), canonicalSourceId: entry.anchor.sourceIdentity }));
  const artifacts = workspace.artifacts.map(item => ({ artifactId: item.id, kind: "NOTE", title: item.title,
    content: item.description ?? "", canonicalSourceIds: item.derived_from }));
  const document = snapshot.authoring.activeDocument;
  if (document) artifacts.push({ artifactId: document.identity.id, kind: "DOCUMENT", title: document.metadata.title,
    content: JSON.stringify(document), canonicalSourceIds: document.nodes.flatMap(node => node.type === "REFERENCE" ? [((node as unknown) as { targetId: string }).targetId] : []) });
  const command: GuestAdoptionCommand = Object.freeze({
    schemaVersion: "guest-investigation-adoption/v1", idempotencyKey,
    source: Object.freeze({ kind: "GUEST_SESSION", guestInvestigationId: investigation.id, snapshotCreatedAt: snapshot.createdAt, snapshotUpdatedAt: snapshot.updatedAt }),
    title: investigation.name, objective: investigation.description || null,
    workspace: Object.freeze({ sourceWorkspaceId: workspace.id, nodes: Object.freeze(nodes), edges: Object.freeze(edges) }),
    researchInbox: Object.freeze(researchInbox), artifacts: Object.freeze(artifacts),
    viewState: Object.freeze({ activeMode: snapshot.workspace.operator.activeMode, focusedEventId: workspace.focused_event_id,
      activeLayers: Object.freeze([...snapshot.workspace.computational.activeLayers]),
      temporalContext: text(snapshot.workspace.computational.temporalContext, "Temporal context"),
      investigativeScale: text(snapshot.workspace.computational.investigativeScale, "Investigative scale") }),
  });
  return Object.freeze({ snapshot, command });
}

export async function submitGuestAdoption(command: GuestAdoptionCommand, csrf: string, signal?: AbortSignal, transport: typeof fetch = fetch): Promise<AdoptionReceipt> {
  const response = await transport(`${resolveApiBaseUrl()}/api/v1/investigations/adoptions`, { method: "POST", credentials: "include", signal,
    headers: { "Content-Type": "application/json", "X-ISEES-CSRF": csrf }, body: JSON.stringify(command) });
  const body = await response.json().catch(() => null) as Record<string, unknown> | null;
  if (!response.ok) throw new Error("ADOPTION_FAILED");
  if (!body || typeof body.investigationId !== "string" || !body.investigationId || !Number.isSafeInteger(body.aggregateRevision) || !body.activation)
    throw new Error("ADOPTION_INVALID");
  return Object.freeze({ investigationId: body.investigationId, aggregateRevision: body.aggregateRevision as number, activation: body.activation });
}

export class GuestPreservationCoordinator {
  #phase: AdoptionPhase = "IDLE"; #candidate: FrozenGuestCandidate | null = null; #epoch = 0; #pending = false;
  get phase(): AdoptionPhase { return this.#phase } get candidate(): FrozenGuestCandidate | null { return this.#candidate }
  capture(candidate: FrozenGuestCandidate | null): void { this.#epoch++; this.#candidate = candidate; this.#phase = candidate ? "GUEST_CANDIDATE_CAPTURED" : "IDLE"; }
  authenticating(): void { if (this.#candidate) this.#phase = "AUTHENTICATING"; }
  authenticated(): void { if (this.#candidate) this.#phase = "AWAITING_DECISION"; }
  discard(): void { this.#epoch++; this.#candidate = null; this.#pending = false; this.#phase = "DISCARDED"; }
  cancel(): void { this.#epoch++; this.#pending = false; this.#phase = this.#candidate ? "GUEST_CANDIDATE_CAPTURED" : "IDLE"; }
  async preserve(run: (candidate: FrozenGuestCandidate, signal: AbortSignal) => Promise<void>): Promise<void> {
    if (this.#pending || !this.#candidate) return; this.#pending = true; this.#phase = "PRESERVING";
    const epoch = this.#epoch; const candidate = this.#candidate; const controller = new AbortController();
    try { await run(candidate, controller.signal); if (epoch !== this.#epoch || candidate !== this.#candidate) return; this.#phase = "OWNED_ACTIVE"; }
    catch { if (epoch === this.#epoch && candidate === this.#candidate) this.#phase = "RECOVERABLE_ERROR"; }
    finally { if (epoch === this.#epoch) this.#pending = false; }
  }
}
