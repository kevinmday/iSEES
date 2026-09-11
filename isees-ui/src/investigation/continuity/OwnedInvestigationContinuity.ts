import type { Artifact } from "../../artifacts/artifactTypes.ts";
import type { ComputationalAuthorDocument } from "../../author/model/AuthorDocument.ts";
import type { ResearchDesk } from "../../research/researchBridgeTypes.ts";
import { restoreStudioDocument } from "../../studio/api/StudioDocumentRestoration.ts";
import type { WorkspaceMode } from "../../workspace/runtime/WorkspaceRuntimeTypes.ts";
import type { Investigation } from "../investigationTypes.ts";

export const OWNED_ACTIVATION_SCHEMA_VERSION = "owned-investigation-activation/v1";
const MODES = new Set(["OVERVIEW", "MANIFOLD", "COMPARE", "NARRATIVE", "EVIDENCE", "TIMELINE", "INTENTION", "RESEARCH", "LAYERS"]);
export type ContinuityStateCode = "SESSION_INITIALIZING" | "AUTHENTICATION_REQUIRED" | "SESSION_EXPIRED" | "OWNED_LIBRARY_EMPTY" | "NO_ACTIVE_INVESTIGATION" | "RESTORING_LAST_ACTIVE" | "ACTIVATION_READY" | "ACTIVATION_STALE" | "ACTIVATION_INVALID" | "INVESTIGATION_NOT_FOUND" | "LOGOUT_IN_PROGRESS" | "ACCOUNT_BOUNDARY_RESET";
export interface AccountSessionProjection { readonly researcherId: string; readonly email: string; readonly sessionExpiresAt: string; }
type Node = Readonly<{ id: string; kind: "CANONICAL_EVENT" | "NOTE" | "QUESTION"; canonicalEventId: string | null; title: string }>;
type Edge = Readonly<{ id: string; sourceId: string; targetId: string; kind: "RELATED" | "SUPPORTS" | "CONTRADICTS" }>;
type Inbox = Readonly<{ anchorId: string; order: number; title: string; canonicalSourceId: string }>;
type AdoptedArtifact = Readonly<{ artifactId: string; kind: "DOCUMENT" | "NOTE"; title: string; content: string; canonicalSourceIds: readonly string[] }>;
type View = Readonly<{ activeMode: WorkspaceMode; focusedEventId: string | null; activeLayers: readonly string[]; temporalContext: string | null; investigativeScale: string | null }>;
type EmptyOperational = Readonly<{ kind: "EMPTY"; workspaceId: string; focusedEventId: null; nodes: readonly never[]; edges: readonly never[] }>;
type AdoptedOperational = Readonly<{ kind: "ADOPTED"; workspaceId: string; schemaVersion: "guest-investigation-adoption/v1" | "canon-event-import/v1"; source: Readonly<Record<string, unknown>>; title: string; objective: string | null; workspace: Readonly<{ sourceWorkspaceId: string; nodes: readonly Node[]; edges: readonly Edge[] }>; researchInbox: readonly Inbox[]; artifacts: readonly AdoptedArtifact[]; viewState: View }>;
interface Base { readonly activationSchemaVersion: typeof OWNED_ACTIVATION_SCHEMA_VERSION; readonly investigationId: string; readonly title: string; readonly objective: string | null; readonly lifecycle: "ACTIVE"; readonly createdAt: string; readonly modifiedAt: string; readonly version: number; readonly aggregateSchemaVersion: "investigation-aggregate/v1"; readonly aggregateRevision: number; readonly access: Readonly<{ kind: "RESEARCHER_OWNED" }>; readonly freshnessToken: string; }
export type OwnedActivationAggregate = Base & ({ readonly aggregateState: "EMPTY"; readonly operationalState: EmptyOperational } | { readonly aggregateState: "ADOPTED"; readonly operationalState: AdoptedOperational });
export interface ActivationReceipt { readonly code: "ACTIVATION_READY"; readonly researcherId: string; readonly investigationId: string; readonly aggregateRevision: number; readonly requestGeneration: number; }
export interface MaterializedOwnedActivation { readonly investigation: Investigation; readonly activeMode: WorkspaceMode; readonly temporalContext?: string; readonly investigativeScale?: string; readonly researchDesk: ResearchDesk; readonly authorDocument?: ComputationalAuthorDocument; }
export class ContinuityError extends Error { readonly code: ContinuityStateCode | "NETWORK_FAILURE"; constructor(code: ContinuityStateCode | "NETWORK_FAILURE", message: string) { super(message); this.code = code; } }
function fail(): never { throw new ContinuityError("ACTIVATION_INVALID", "Owned activation aggregate is invalid."); }
function rec(v: unknown): Readonly<Record<string, unknown>> | null { return v !== null && typeof v === "object" && !Array.isArray(v) ? v as Readonly<Record<string, unknown>> : null; }
function exact(v: Readonly<Record<string, unknown>>, keys: readonly string[]): boolean { const a = Object.keys(v).sort(), e = [...keys].sort(); return a.length === e.length && a.every((k, i) => k === e[i]); }
function timestamp(v: unknown): v is string { return typeof v === "string" && v.trim() === v && Number.isFinite(Date.parse(v)); }
function text(v: unknown): v is string { return typeof v === "string" && v.trim() === v && v.length > 0; }
function nullable(v: unknown): v is string | null { return v === null || typeof v === "string"; }
function strings(v: unknown): v is readonly string[] { return Array.isArray(v) && v.every(text) && new Set(v).size === v.length; }

type GraphSource = Readonly<{ type: "NODE" | "EDGE"; id: string }>;
function graphSource(value: string, nodeIds: ReadonlySet<string>, edgeIds: ReadonlySet<string>): GraphSource | null {
  const separator = value.indexOf(":");
  if (separator > 0) {
    const type = value.slice(0, separator);
    const id = value.slice(separator + 1);
    if (type === "NODE") return text(id) && nodeIds.has(id) ? { type, id } : null;
    if (type === "EDGE") return text(id) && edgeIds.has(id) ? { type, id } : null;
    return null;
  }
  if (nodeIds.has(value) === edgeIds.has(value)) return null;
  if (nodeIds.has(value)) return { type: "NODE", id: value };
  if (edgeIds.has(value)) return { type: "EDGE", id: value };
  return null;
}

function adoptedGraphTitle(source: GraphSource, op: AdoptedOperational): string {
  if (source.type === "NODE") return op.workspace.nodes.find(node => node.id === source.id)!.title;
  const edge = op.workspace.edges.find(item => item.id === source.id)!;
  const sourceNode = op.workspace.nodes.find(node => node.id === edge.sourceId)!;
  const targetNode = op.workspace.nodes.find(node => node.id === edge.targetId)!;
  return `${sourceNode.title} ${edge.kind.toLocaleLowerCase()} ${targetNode.title}`;
}

function materializedInboxTitle(entry: Inbox, source: GraphSource, op: AdoptedOperational): string {
  const persisted = entry.title.trim();
  return !persisted || persisted === source.id || persisted === entry.canonicalSourceId
    ? adoptedGraphTitle(source, op)
    : entry.title;
}

function normalizeLegacyAdoption(value: unknown): unknown {
  const item = rec(value), op = rec(item?.operationalState), workspace = rec(op?.workspace);
  if (!item || item.aggregateState !== "ADOPTED" || op?.kind !== "ADOPTED" || op.schemaVersion !== "guest-investigation-adoption/v1" || !workspace || !Array.isArray(workspace.nodes) || !Array.isArray(workspace.edges)) return value;
  const nodes = workspace.nodes.map(rec);
  if (nodes.some(node => !node)) return value;
  const referenced = new Set<string>();
  for (const raw of workspace.edges) { const edge = rec(raw); if (typeof edge?.sourceId === "string") referenced.add(edge.sourceId); if (typeof edge?.targetId === "string") referenced.add(edge.targetId); }
  if (Array.isArray(op.researchInbox)) for (const raw of op.researchInbox) { const inbox = rec(raw); if (typeof inbox?.canonicalSourceId === "string") { const source = inbox.canonicalSourceId; referenced.add(source.startsWith("NODE:") || source.startsWith("EDGE:") ? source.slice(source.indexOf(":") + 1) : source); } }
  if (Array.isArray(op.artifacts)) for (const raw of op.artifacts) { const artifact = rec(raw); if (Array.isArray(artifact?.canonicalSourceIds)) for (const source of artifact.canonicalSourceIds) if (typeof source === "string") referenced.add(source); }
  const replacements = new Map<string, Readonly<Record<string, unknown>>>(), removals = new Set<string>();
  for (const alias of nodes) {
    if (alias!.kind !== "CANONICAL_EVENT" || !text(alias!.id) || !text(alias!.canonicalEventId) || alias!.id !== alias!.canonicalEventId) continue;
    const realId = `system:event:${alias!.canonicalEventId}`;
    const matches = nodes.filter(node => node!.id === realId);
    if (matches.length === 0) continue;
    if (matches.length !== 1 || referenced.has(alias!.id)) fail();
    const real = matches[0]!;
    if (real!.kind !== "NOTE" || real!.canonicalEventId !== null || !text(real!.title)) fail();
    if (replacements.has(realId)) fail();
    replacements.set(realId, Object.freeze({ ...real, kind: "CANONICAL_EVENT", canonicalEventId: alias!.canonicalEventId }));
    removals.add(alias!.id);
  }
  if (removals.size === 0) return value;
  const normalizedNodes = workspace.nodes.filter(raw => !removals.has((raw as { id?: string }).id ?? "")).map(raw => replacements.get((raw as { id?: string }).id ?? "") ?? raw);
  return { ...item, operationalState: { ...op, workspace: { ...workspace, nodes: normalizedNodes } } };
}

export function parseOwnedActivationAggregate(value: unknown, expectedId: string): OwnedActivationAggregate {
  const item = rec(normalizeLegacyAdoption(value)), access = rec(item?.access), op = rec(item?.operationalState);
  const keys = ["activationSchemaVersion", "investigationId", "title", "objective", "lifecycle", "createdAt", "modifiedAt", "version", "aggregateSchemaVersion", "aggregateState", "aggregateRevision", "access", "operationalState", "freshnessToken"];
  if (!item || !exact(item, keys) || item.activationSchemaVersion !== OWNED_ACTIVATION_SCHEMA_VERSION || !text(expectedId) || item.investigationId !== expectedId || !text(item.title) || !nullable(item.objective) || item.lifecycle !== "ACTIVE" || !timestamp(item.createdAt) || !timestamp(item.modifiedAt) || !Number.isSafeInteger(item.version) || (item.version as number) < 0 || item.aggregateSchemaVersion !== "investigation-aggregate/v1" || !Number.isSafeInteger(item.aggregateRevision) || (item.aggregateRevision as number) < 0 || !access || !exact(access, ["kind"]) || access.kind !== "RESEARCHER_OWNED" || !op || item.freshnessToken !== `${item.version}:${item.aggregateRevision}`) fail();
  if (item.aggregateState === "EMPTY") {
    if (!exact(op, ["kind", "workspaceId", "focusedEventId", "nodes", "edges"]) || op.kind !== "EMPTY" || op.workspaceId !== `workspace:${expectedId}` || op.focusedEventId !== null || !Array.isArray(op.nodes) || op.nodes.length !== 0 || !Array.isArray(op.edges) || op.edges.length !== 0 || item.aggregateRevision !== 0) fail();
  } else if (item.aggregateState === "ADOPTED") validateAdopted(op, item, expectedId); else fail();
  return Object.freeze(item) as unknown as OwnedActivationAggregate;
}

function validateAdopted(op: Readonly<Record<string, unknown>>, item: Readonly<Record<string, unknown>>, id: string): void {
  if (!exact(op, ["kind", "workspaceId", "schemaVersion", "source", "title", "objective", "workspace", "researchInbox", "artifacts", "viewState"]) || op.kind !== "ADOPTED" || op.workspaceId !== `workspace:${id}` || !["guest-investigation-adoption/v1","canon-event-import/v1"].includes(String(op.schemaVersion)) || op.title !== item.title || op.objective !== item.objective || (item.aggregateRevision as number) <= 0) fail();
  const source = rec(op.source), workspace = rec(op.workspace), view = rec(op.viewState);
  const validSource = source && (op.schemaVersion === "guest-investigation-adoption/v1" ? exact(source, ["kind", "guestInvestigationId", "snapshotCreatedAt", "snapshotUpdatedAt"]) && source.kind === "GUEST_SESSION" && text(source.guestInvestigationId) && timestamp(source.snapshotCreatedAt) && timestamp(source.snapshotUpdatedAt) && Date.parse(source.snapshotUpdatedAt) >= Date.parse(source.snapshotCreatedAt) : exact(source, ["kind", "eventId", "importedAt"]) && source.kind === "SYSTEM_CANON" && text(source.eventId) && timestamp(source.importedAt));
  if (!validSource || !workspace || !exact(workspace, ["sourceWorkspaceId", "nodes", "edges"]) || !text(workspace.sourceWorkspaceId) || !view || !exact(view, ["activeMode", "focusedEventId", "activeLayers", "temporalContext", "investigativeScale"]) || typeof view.activeMode !== "string" || !MODES.has(view.activeMode) || !(view.focusedEventId === null || text(view.focusedEventId)) || !strings(view.activeLayers) || !nullable(view.temporalContext) || !nullable(view.investigativeScale) || !Array.isArray(workspace.nodes) || !Array.isArray(workspace.edges)) fail();
  const nodeIds = new Set<string>(), canonicalIds = new Set<string>();
  for (const raw of workspace.nodes) { const n = rec(raw); if (!n || !exact(n, ["id", "kind", "canonicalEventId", "title"]) || !text(n.id) || nodeIds.has(n.id) || !["CANONICAL_EVENT", "NOTE", "QUESTION"].includes(n.kind as string) || !text(n.title) || ((n.kind === "CANONICAL_EVENT") !== text(n.canonicalEventId)) || (n.kind !== "CANONICAL_EVENT" && n.canonicalEventId !== null)) fail(); nodeIds.add(n.id); if (typeof n.canonicalEventId === "string") canonicalIds.add(n.canonicalEventId); }
  const edgeIds = new Set<string>(); for (const raw of workspace.edges) { const e = rec(raw); if (!e || !exact(e, ["id", "sourceId", "targetId", "kind"]) || !text(e.id) || edgeIds.has(e.id) || !text(e.sourceId) || !text(e.targetId) || !nodeIds.has(e.sourceId) || !nodeIds.has(e.targetId) || !["RELATED", "SUPPORTS", "CONTRADICTS"].includes(e.kind as string)) fail(); edgeIds.add(e.id); }
  if (typeof view.focusedEventId === "string" && !canonicalIds.has(view.focusedEventId)) fail(); if (!Array.isArray(op.researchInbox) || !Array.isArray(op.artifacts)) fail();
  const anchors = new Set<string>(), orders = new Set<number>(); for (const raw of op.researchInbox) { const e = rec(raw); if (!e || !exact(e, ["anchorId", "order", "title", "canonicalSourceId"]) || !text(e.anchorId) || anchors.has(e.anchorId) || !Number.isSafeInteger(e.order) || (e.order as number) < 0 || orders.has(e.order as number) || typeof e.title !== "string" || !text(e.canonicalSourceId) || !graphSource(e.canonicalSourceId, nodeIds, edgeIds)) fail(); anchors.add(e.anchorId); orders.add(e.order as number); }
  if ([...orders].sort((a,b) => a-b).some((order, index) => order !== index)) fail(); const artifactIds = new Set<string>();
  for (const raw of op.artifacts) { const a = rec(raw); if (!a || !exact(a, ["artifactId", "kind", "title", "content", "canonicalSourceIds"]) || !text(a.artifactId) || artifactIds.has(a.artifactId) || !["DOCUMENT", "NOTE"].includes(a.kind as string) || !text(a.title) || typeof a.content !== "string" || !strings(a.canonicalSourceIds) || (a.canonicalSourceIds as readonly string[]).some(s => !nodeIds.has(s) && !edgeIds.has(s))) fail(); artifactIds.add(a.artifactId); if (a.kind === "DOCUMENT") { let decoded: unknown; try { decoded = JSON.parse(a.content as string); } catch { fail(); } const doc = restoreStudioDocument(decoded); if (!doc || doc.identity.id !== a.artifactId) fail(); } }
}

function base(a: OwnedActivationAggregate, artifacts: Artifact[]): Investigation { return { id: a.investigationId, name: a.title, description: a.objective ?? "", createdAt: a.createdAt, updatedAt: a.modifiedAt, createdBy: "AUTHENTICATED_RESEARCHER", status: "ACTIVE", workspace: { id: a.operationalState.workspaceId, name: a.title, description: a.objective ?? "", imported_events: [], focused_event_id: null, investigations: [], artifacts, active_layers: [], created_at: a.createdAt }, revisions: [] }; }
export function materializeEmptyOwnedInvestigation(a: OwnedActivationAggregate & { aggregateState: "EMPTY" }): Investigation { const i = base(a, []); i.workspace = Object.freeze(i.workspace); i.revisions = Object.freeze([]) as unknown as []; return Object.freeze(i); }
export function materializeOwnedActivation(a: OwnedActivationAggregate): MaterializedOwnedActivation {
  if (a.aggregateState === "EMPTY") return Object.freeze({ investigation: materializeEmptyOwnedInvestigation(a), activeMode: "OVERVIEW", researchDesk: Object.freeze({ entries: Object.freeze([]) }) as unknown as ResearchDesk });
  const op = a.operationalState, canonical = op.workspace.nodes.filter(n => n.kind === "CANONICAL_EVENT").map(n => n.canonicalEventId!);
  const artifacts: Artifact[] = op.artifacts.filter(x => x.kind === "NOTE").map(x => ({ id: x.artifactId, title: x.title, artifact_type: "ANNOTATION", repository: "WORKSPACE", description: x.content, derived_from: [...x.canonicalSourceIds], created_at: a.modifiedAt }));
  const nodes = op.workspace.nodes.map(n => Object.freeze({ id: n.id, label: n.title, type: n.kind === "CANONICAL_EVENT" ? "EVENT" as const : n.kind === "QUESTION" ? "HYPOTHESIS" as const : "NARRATIVE" as const, metadata: Object.freeze(n.canonicalEventId ? { canonicalEventId: n.canonicalEventId } : { adoptedKind: n.kind }) }));
  const edges = op.workspace.edges.map(e => Object.freeze({ id: e.id, source: e.sourceId, target: e.targetId, relationship: e.kind === "RELATED" ? "ASSOCIATED_WITH" as const : e.kind, weight: 1, rationale: Object.freeze(["Preserved guest adoption."]) as unknown as string[] }));
  const graph = Object.freeze({ nodes: Object.freeze(nodes), edges: Object.freeze(edges), statistics: Object.freeze({ nodeCount: nodes.length, edgeCount: edges.length, eventCount: canonical.length, facilityCount: 0, artifactCount: 0, personCount: 0, organizationCount: 0, locationCount: 0, narrativeCount: op.workspace.nodes.filter(n => n.kind === "NOTE").length, hypothesisCount: op.workspace.nodes.filter(n => n.kind === "QUESTION").length }) });
  const i = base(a, artifacts), revisionId = "REV-0001"; i.workspace.imported_events = canonical.map(event_id => ({ event_id, source: "SYSTEM_CANON" })); i.workspace.focused_event_id = op.viewState.focusedEventId; i.workspace.active_layers = [...op.viewState.activeLayers]; i.workspace = Object.freeze(i.workspace);
  const revision = Object.freeze({ id: revisionId, revisionNumber: 1, timestamp: a.modifiedAt, operator: "AUTHENTICATED_RESEARCHER", branch: "MAIN" as const, message: "Authoritative adopted operational state", manifold: Object.freeze({ id: `operational:${encodeURIComponent(a.investigationId)}:${revisionId}`, timestamp: a.modifiedAt, algorithmVersion: "ADOPTED_OPERATIONAL_STATE_V1", activeLayers: Object.freeze([...op.viewState.activeLayers]) as unknown as [], graph }) }); i.currentRevisionId = revisionId; i.revisions = Object.freeze([revision]) as unknown as typeof i.revisions; const investigation = Object.freeze(i);
  const nodeIds = new Set(op.workspace.nodes.map(node => node.id)), edgeIds = new Set(op.workspace.edges.map(edge => edge.id));
  const entries = op.researchInbox.map(e => { const source = graphSource(e.canonicalSourceId, nodeIds, edgeIds)!; const title = materializedInboxTitle(e, source, op); return Object.freeze({ order: e.order, anchor: Object.freeze({ schemaVersion: "research-anchor/v2" as const, kind: "GRAPH" as const, anchorId: e.anchorId, investigationId: a.investigationId, sourceWorkspace: "MANIFOLD" as const, sourceIdentity: e.canonicalSourceId, collectedAt: new Date(a.modifiedAt), createdAt: new Date(a.createdAt), classification: "CANONICAL" as const, display: Object.freeze({ title, summary: title }), insertability: Object.freeze({ state: "INSERTABLE" as const, reason: "Preserved adopted graph reference." }), capturedRepresentation: Object.freeze({ schemaVersion: "guest-investigation-adoption/v1", mediaType: "application/json", value: Object.freeze({ canonicalSourceId: e.canonicalSourceId }) }), pinned: false, graph: Object.freeze(source), graphRevision: a.aggregateRevision }) }); });
  const researchDesk = Object.freeze({ entries: Object.freeze(entries) }) as unknown as ResearchDesk, document = op.artifacts.find(x => x.kind === "DOCUMENT"); const authorDocument = document ? restoreStudioDocument(JSON.parse(document.content)) : undefined;
  return Object.freeze({ investigation, activeMode: op.viewState.activeMode, ...(op.viewState.temporalContext !== null ? { temporalContext: op.viewState.temporalContext } : {}), ...(op.viewState.investigativeScale !== null ? { investigativeScale: op.viewState.investigativeScale } : {}), researchDesk, ...(authorDocument ? { authorDocument } : {}) });
}
