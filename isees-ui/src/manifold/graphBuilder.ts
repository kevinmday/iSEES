// ============================================================
// src/manifold/graphBuilder.ts
// P25.2A TOPOLOGY FOUNDATION
// DETERMINISTIC GRAPH BUILDER
// POSITIONED GRAPH GENERATION
// FULL DROP-IN FILE
// ============================================================

import type {
CorpusEvent,
} from "../corpus/corpusTypes";

import type {
Workspace,
} from "../workspace/workspaceTypes";

import type {
SimilarityResolution,
} from "../corpus/resolution/resolutionTypes";

import type {
GraphNode,
GraphEdge,
InvestigationGraph,
} from "./graphTypes";

// ============================================================
// HELPERS
// ============================================================

function edgeId(
source: string,
target: string
): string {

return [
source,
target,
]
.sort()
.join("::");
}

function safeWeight(
value: number | undefined
): number {

if (
value === undefined ||
Number.isNaN(value)
) {
return 0;
}

return Math.max(
0,
Math.min(
1,
value
)
);
}

// ============================================================
// BUILD GRAPH
// ============================================================

export function buildInvestigationGraph(
corpus: CorpusEvent[],
workspace: Workspace
): InvestigationGraph {

const nodeMap =
new Map<
string,
GraphNode
>();

const edgeMap =
new Map<
string,
GraphEdge
>();

// ==========================================================
// EVENT NODES
// ==========================================================

corpus.forEach(
(
corpusEvent
) => {


  const event =
    corpusEvent
      .canonical_event;

  const eventId =
    event.event_id;

  const inWorkspace =
    workspace
      .imported_events
      .some(
        reference =>
          reference.event_id ===
          eventId
      );

  nodeMap.set(
    eventId,
    {
      id:
        eventId,

      label:
        event.event_name,

      type:
        "EVENT",

      metadata: {

        source:
          corpusEvent
            .resolutions?.[0]
            ?.source_type ??
          "SYSTEM_CANON",

        inWorkspace,

        corpusId:
          corpusEvent
            .corpus_id,
      },
    }
  );
}


);

// ==========================================================
// SIMILARITY EDGES
// ==========================================================

corpus.forEach(
(
corpusEvent
) => {


  const sourceEvent =
    corpusEvent
      .canonical_event;

  const sourceId =
    sourceEvent
      .event_id;

  const resolutions =
    corpusEvent
      .similarity_resolutions ??
    [];

  resolutions.forEach(
    (
      resolution:
        SimilarityResolution
    ) => {

      const targetId =
        resolution
          .target_event_id;

      const id =
        edgeId(
          sourceId,
          targetId
        );

      if (
        edgeMap.has(id)
      ) {
        return;
      }

      edgeMap.set(
        id,
        {
          id,

          source:
            sourceId,

          target:
            targetId,

          weight:
            safeWeight(
              resolution
                .confidence
            ),

          relationship:
            "SIMILARITY",

          metrics: {

            confidence:
              resolution
                .confidence,

            narrative:
              resolution
                .narrative_similarity,

            observability:
              resolution
                .observability_similarity,

            infrastructure:
              resolution
                .infrastructure_similarity,

            topology:
              resolution
                .topology_similarity,

            geo:
              resolution
                .geo_similarity,
          },

          rationale:
            resolution
              .rationale ??
            [],
        }
      );
    }
  );
}


);

// ==========================================================
// FACILITY NODES
// ==========================================================

corpus.forEach(
(
  corpusEvent
) => {

  const event =
    corpusEvent
      .canonical_event;

  const eventId =
    event.event_id;

  const facilities =
    event.core_event
      ?.infrastructure_context
      ?.facilities ?? [];

  facilities.forEach(
    facility => {

      const facilityId =
        `facility:${facility.name}`;

      if (
        !nodeMap.has(
          facilityId
        )
      ) {

        nodeMap.set(
          facilityId,
          {
            id:
              facilityId,

            label:
              facility.name,

            type:
              "FACILITY",

            metadata: {

              facilityType:
                facility.type,

              distance:
                facility.distance,
            },
          }
        );
      }

      const relationshipId =
        edgeId(
          eventId,
          facilityId
        );

      if (
        !edgeMap.has(
          relationshipId
        )
      ) {

        edgeMap.set(
          relationshipId,
          {
            id:
              relationshipId,

            source:
              eventId,

            target:
              facilityId,

            weight:
              1,

            relationship:
              "OBSERVED_AT",

            metrics: {
              confidence: 1,
              narrative: 0,
              observability: 1,
              infrastructure: 1,
              topology: 0,
              geo: 0,
            },

            rationale: [
              `Facility relationship: ${facility.name}`,
            ],
          }
        );
      }

    }
  );

}
);

// ==========================================================
// ARTIFACT NODES
// ==========================================================

workspace.artifacts.forEach(
artifact => {


  const artifactId =
    `artifact:${artifact.id}`;

  nodeMap.set(
    artifactId,
    {
      id:
        artifactId,

      label:
        artifact.title,

      type:
        "ARTIFACT",

      metadata: {
        repository:
          artifact.repository,
      },
    }
  );
}


);

// ==========================================================
// FINAL GRAPH
// ==========================================================

const nodes =
Array.from(
nodeMap.values()
);

const edges =
Array.from(
edgeMap.values()
);


// ==========================================================
// P25.3
// DYNAMIC CENTER NODE
// INVESTIGATION-CENTRIC TOPOLOGY
// ==========================================================

const focusedNodeId =
  workspace.focused_event_id;

const centerRadius = 0;
const orbitRadius = 180;

// ==========================================================
// CENTER NODE
// ==========================================================

const centerNode =
  focusedNodeId
    ? nodes.find(
        node =>
          node.id ===
          focusedNodeId
      )
    : undefined;

if (centerNode) {

  centerNode.x =
    centerRadius;

  centerNode.y =
    centerRadius;
}

// ==========================================================
// ORBIT NODES
// ==========================================================

const orbitNodes =
  nodes.filter(
    node =>
      node.id !==
      focusedNodeId
  );

orbitNodes.forEach(
  (
    node,
    index
  ) => {

    const angle =
      (
        index /
        Math.max(
          orbitNodes.length,
          1
        )
      ) *
      Math.PI *
      2;

    node.x =
      Math.cos(angle) *
      orbitRadius;

    node.y =
      Math.sin(angle) *
      orbitRadius;
  }
);

// ==========================================================
// FALLBACK
// NO FOCUSED EVENT
// ==========================================================

if (!focusedNodeId) {

  nodes.forEach(
    (
      node,
      index
    ) => {

      const angle =
        (
          index /
          Math.max(
            nodes.length,
            1
          )
        ) *
        Math.PI *
        2;

      node.x =
        Math.cos(angle) *
        orbitRadius;

      node.y =
        Math.sin(angle) *
        orbitRadius;
    }
  );
}

// ==========================================================
// RETURN GRAPH
// ==========================================================

return {

  nodes,

  edges,

  centerNodeId:
    focusedNodeId ??
    undefined,

  statistics: {

  nodeCount:
    nodes.length,

  edgeCount:
    edges.length,

  eventCount:
    nodes.filter(
      node =>
        node.type === "EVENT"
    ).length,

  facilityCount:
    nodes.filter(
      node =>
        node.type === "FACILITY"
    ).length,

  artifactCount:
    nodes.filter(
      node =>
        node.type === "ARTIFACT"
    ).length,

  personCount:
    nodes.filter(
      node =>
        node.type === "PERSON"
    ).length,

  organizationCount:
    nodes.filter(
      node =>
        node.type === "ORGANIZATION"
    ).length,

  locationCount:
    nodes.filter(
      node =>
        node.type === "LOCATION"
    ).length,

  narrativeCount:
    nodes.filter(
      node =>
        node.type === "NARRATIVE"
    ).length,

  hypothesisCount:
    nodes.filter(
      node =>
        node.type === "HYPOTHESIS"
    ).length,
},
};
}

