import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { materializeOwnedActivation, parseOwnedActivationAggregate } from "../../src/investigation/continuity/OwnedInvestigationContinuity.ts";
import { createOperationalGraphFingerprint } from "../../src/investigation/revision/OperationalGraphRevision.ts";

const graph = { nodes: [{ id: "event-1", label: "Event", type: "EVENT", metadata: { sourceId: "event-1" } }], edges: [], statistics: { nodeCount: 1, edgeCount: 0, eventCount: 1, facilityCount: 0, artifactCount: 0, personCount: 0, organizationCount: 0, locationCount: 0, narrativeCount: 0, hypothesisCount: 0 } };
const durable = { investigationId: "owned-1", revisionId: "SERVER-REVISION-7", revisionNumber: 1, parentRevisionId: null, graph, fingerprint: createOperationalGraphFingerprint(graph as never), graphSchemaVersion: "investigation-operational-graph/v1", algorithmVersion: "KNOWLEDGE_TOPOLOGY_V1", actorAuthority: "AUTHENTICATED_RESEARCHER", recordedAt: "2026-09-25T00:00:00Z", mutationKind: "CANON_EVENT_IMPORT", sourceIdentity: "event-1" };
const wire = { activationSchemaVersion: "owned-investigation-activation/v1", investigationId: "owned-1", title: "Study", objective: null, lifecycle: "ACTIVE", createdAt: "2026-09-25T00:00:00Z", modifiedAt: "2026-09-25T00:00:00Z", version: 1, aggregateSchemaVersion: "investigation-aggregate/v1", aggregateState: "ADOPTED", aggregateRevision: 4, access: { kind: "RESEARCHER_OWNED" }, operationalState: { kind: "ADOPTED", workspaceId: "workspace:owned-1", schemaVersion: "canon-event-import/v1", source: { kind: "SYSTEM_CANON", eventId: "event-1", importedAt: "2026-09-25T00:00:00Z" }, title: "Study", objective: null, workspace: { sourceWorkspaceId: "workspace:owned-1", nodes: [{ id: "event-1", kind: "CANONICAL_EVENT", canonicalEventId: "event-1", title: "Event" }], edges: [] }, researchInbox: [], artifacts: [], viewState: { activeMode: "MANIFOLD", focusedEventId: "event-1", activeLayers: [], temporalContext: null, investigativeScale: null } }, freshnessToken: "1:4", operationalRevisionHead: durable, operationalRevisionLineage: [durable] };

const parsed = parseOwnedActivationAggregate(wire, "owned-1");
const materialized = materializeOwnedActivation(parsed);
assert.equal(materialized.investigation.currentRevisionId, "SERVER-REVISION-7", "reload consumes the authoritative head identity");
assert.deepEqual(materialized.investigation.revisions[0]!.manifold.graph, parsed.operationalRevisionHead!.graph, "runtime graph derives from the persisted snapshot");
assert.notEqual(materialized.investigation.currentRevisionId, "REV-0001", "reload does not fabricate REV-0001");
assert.equal(parsed.aggregateRevision, 4); assert.equal(parsed.operationalRevisionHead!.revisionNumber, 1, "aggregate concurrency remains distinct");
assert.throws(() => parseOwnedActivationAggregate({ ...wire, operationalRevisionHead: { ...durable, fingerprint: "wrong" }, operationalRevisionLineage: [{ ...durable, fingerprint: "wrong" }] }, "owned-1"), /invalid/);
const sources = ["../../src/investigation/continuity/OwnedInvestigationContinuity.ts", "../../../isees_uap/investigations/sqlite_repository.py", "../../../isees_uap/api/v1/investigations.py"].map(path => readFileSync(new URL(path, import.meta.url), "utf8")).join("\n");
assert.doesNotMatch(sources, /MANIFOLD_ARTIFACT|Tavily|CandidateEvidence|researchBridgeRuntime\.publish|rex\./i, "D1 authority has no excluded admission or research side effect");
console.log("PASS VerifyDurableOperationalRevisionAuthority");
