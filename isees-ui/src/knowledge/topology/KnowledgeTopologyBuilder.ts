// ============================================================
// src/knowledge/topology/KnowledgeTopologyBuilder.ts
// P56A
// KNOWLEDGE TOPOLOGY BUILDER
//
// Deterministically constructs the base Investigation Topology
// from the runtime-owned Computational Knowledge Object
// population.
//
// Governing transformation:
//
//     K
//     ↓
//     B(K)
//     ↓
//     G₀
//
// where:
//
//     K  = canonical Knowledge Object population
//     B  = deterministic topology construction
//     G₀ = base Investigation Topology
//
// This builder owns semantic topology only.
//
// It does NOT:
//
//   • perform Resolve–Dissolve Computation
//   • infer unsupported relationships
//   • perform layout
//   • assign coordinates
//   • render UI
//   • perform persistence
//   • perform networking
//   • perform AI inference
//
// Deterministic invariants:
//
//   same K → same G₀
//
//   permutation(K) → same G₀
//
// ============================================================

import type {
  KnowledgeObject,
} from "../model/KnowledgeObject";

import type {
  KnowledgeRelationship,
} from "../model/KnowledgeObjectTypes";

import {
  KnowledgeTopologyDiagnosticType,

  type KnowledgeTopology,
  type KnowledgeTopologyBuildOptions,
  type KnowledgeTopologyDiagnostic,
  type KnowledgeTopologyEdge,
  type KnowledgeTopologyNode,
} from "./KnowledgeTopologyTypes";

// ============================================================
// CANONICAL STRING COMPARISON
// ============================================================
//
// localeCompare() is intentionally avoided here.
//
// Topology ordering should not depend upon host locale.
//
// ============================================================

function compareCanonicalStrings(
  a: string,
  b: string,
): number {

  if (
    a < b
  ) {

    return -1;

  }

  if (
    a > b
  ) {

    return 1;

  }

  return 0;

}

// ============================================================
// CANONICAL OBJECT ORDER
// ============================================================

function compareKnowledgeObjects(
  a: KnowledgeObject,
  b: KnowledgeObject,
): number {

  return compareCanonicalStrings(
    a.identity.id,
    b.identity.id,
  );

}

// ============================================================
// CANONICAL NODE ORDER
// ============================================================

function compareNodes(
  a: KnowledgeTopologyNode,
  b: KnowledgeTopologyNode,
): number {

  return compareCanonicalStrings(
    a.id,
    b.id,
  );

}

// ============================================================
// CANONICAL EDGE ORDER
// ============================================================

function compareEdges(
  a: KnowledgeTopologyEdge,
  b: KnowledgeTopologyEdge,
): number {

  const idComparison =
    compareCanonicalStrings(
      a.id,
      b.id,
    );

  if (
    idComparison !== 0
  ) {

    return idComparison;

  }

  const sourceComparison =
    compareCanonicalStrings(
      a.source,
      b.source,
    );

  if (
    sourceComparison !== 0
  ) {

    return sourceComparison;

  }

  return compareCanonicalStrings(
    a.target,
    b.target,
  );

}

// ============================================================
// CANONICAL DIAGNOSTIC ORDER
// ============================================================

function compareDiagnostics(
  a: KnowledgeTopologyDiagnostic,
  b: KnowledgeTopologyDiagnostic,
): number {

  const typeComparison =
    compareCanonicalStrings(
      a.type,
      b.type,
    );

  if (
    typeComparison !== 0
  ) {

    return typeComparison;

  }

  const objectComparison =
    compareCanonicalStrings(
      a.objectId ?? "",
      b.objectId ?? "",
    );

  if (
    objectComparison !== 0
  ) {

    return objectComparison;

  }

  const relationshipComparison =
    compareCanonicalStrings(
      a.relationshipId ?? "",
      b.relationshipId ?? "",
    );

  if (
    relationshipComparison !== 0
  ) {

    return relationshipComparison;

  }

  const targetComparison =
    compareCanonicalStrings(
      a.targetId ?? "",
      b.targetId ?? "",
    );

  if (
    targetComparison !== 0
  ) {

    return targetComparison;

  }

  return compareCanonicalStrings(
    a.message,
    b.message,
  );

}

// ============================================================
// PROJECTABILITY
// ============================================================

function isProjectable(
  object: KnowledgeObject,
  options: KnowledgeTopologyBuildOptions,
): boolean {

  if (
    options.includeNonProjectable ===
    true
  ) {

    return true;

  }

  return (
    object.capabilities.projectable ===
    true
  );

}

// ============================================================
// NODE PROJECTION
// ============================================================

function projectNode(
  object: KnowledgeObject,
): KnowledgeTopologyNode {

  return {

    id:
      object.identity.id,

    type:
      object.type,

    label:
      object.metadata.title,

    confidence:
      object.confidence.value,

    sourceType:
      object.provenance.sourceType,

    metadata: {

      description:
        object.metadata.description,

      author:
        object.metadata.author,

      version:
        object.metadata.version,

      status:
        object.status,

      lifecycleStatus:
        object.lifecycle.status,

      lifecycleRevision:
        object.lifecycle.revision,

      sourceId:
        object.provenance.sourceId,

      sourceRevision:
        object.provenance.sourceRevision,

      revision:
        object.revision.revision,

      tags:
        object.tags.map(
          tag => tag.label,
        ),

    },

  };

}

// ============================================================
// EDGE PROJECTION
// ============================================================

function projectEdge(
  sourceObject: KnowledgeObject,
  relationship: KnowledgeRelationship,
): KnowledgeTopologyEdge {

  return {

    id:
      relationship.id,

    source:
      sourceObject.identity.id,

    target:
      relationship.targetId,

    relationshipType:
      relationship.type,

    confidence:
      sourceObject.confidence.value,

    metadata: {

      sourceType:
        sourceObject.provenance.sourceType,

      sourceRevision:
        sourceObject.provenance.sourceRevision,

      knowledgeRevision:
        sourceObject.revision.revision,

    },

  };

}

// ============================================================
// BUILD KNOWLEDGE TOPOLOGY
// ============================================================

export function buildKnowledgeTopology(
  objects: KnowledgeObject[],
  options: KnowledgeTopologyBuildOptions = {},
): KnowledgeTopology {

  // ----------------------------------------------------------
  // CANONICAL INPUT ORDER
  // ----------------------------------------------------------
  //
  // Never mutate caller-owned arrays.
  //
  // ----------------------------------------------------------

  const canonicalObjects =
    [...objects]
      .sort(
        compareKnowledgeObjects,
      );

  // ----------------------------------------------------------
  // OUTPUT COLLECTIONS
  // ----------------------------------------------------------

  const nodeMap =
    new Map<
      string,
      KnowledgeTopologyNode
    >();

  const edgeMap =
    new Map<
      string,
      KnowledgeTopologyEdge
    >();

  const diagnostics:
    KnowledgeTopologyDiagnostic[] = [];

  // ----------------------------------------------------------
  // NODE PASS
  // ----------------------------------------------------------
  //
  // Nodes are established before relationships are resolved.
  //
  // This makes dangling-target evaluation independent of input
  // ordering.
  //
  // ----------------------------------------------------------

  for (
    const object
    of canonicalObjects
  ) {

    if (
      !isProjectable(
        object,
        options,
      )
    ) {

      diagnostics.push({

        type:
          KnowledgeTopologyDiagnosticType
            .NON_PROJECTABLE_OBJECT,

        objectId:
          object.identity.id,

        message:
          `Knowledge Object ${object.identity.id} is not projectable.`,

      });

      continue;

    }

    if (
      nodeMap.has(
        object.identity.id,
      )
    ) {

      diagnostics.push({

        type:
          KnowledgeTopologyDiagnosticType
            .DUPLICATE_NODE,

        objectId:
          object.identity.id,

        message:
          `Duplicate Knowledge Object identity ${object.identity.id} omitted.`,

      });

      continue;

    }

    nodeMap.set(
      object.identity.id,
      projectNode(
        object,
      ),
    );

  }

  // ----------------------------------------------------------
  // EDGE PASS
  // ----------------------------------------------------------
  //
  // P56A projects explicit KnowledgeRelationship records only.
  //
  // No inferred relationships.
  //
  // No manufactured target nodes.
  //
  // ----------------------------------------------------------

  for (
    const object
    of canonicalObjects
  ) {

    // --------------------------------------------------------
    // A non-projectable source cannot emit a visible topology
    // edge unless explicitly included by build options.
    // --------------------------------------------------------

    if (
      !nodeMap.has(
        object.identity.id,
      )
    ) {

      continue;

    }

    const relationships =
      [...object.relationships]
        .sort(
          (
            a,
            b,
          ) => {

            const idComparison =
              compareCanonicalStrings(
                a.id,
                b.id,
              );

            if (
              idComparison !== 0
            ) {

              return idComparison;

            }

            const typeComparison =
              compareCanonicalStrings(
                a.type,
                b.type,
              );

            if (
              typeComparison !== 0
            ) {

              return typeComparison;

            }

            return compareCanonicalStrings(
              a.targetId,
              b.targetId,
            );

          },
        );

    for (
      const relationship
      of relationships
    ) {

      // ------------------------------------------------------
      // TARGET RESOLUTION
      // ------------------------------------------------------

      if (
        !nodeMap.has(
          relationship.targetId,
        )
      ) {

        diagnostics.push({

          type:
            KnowledgeTopologyDiagnosticType
              .DANGLING_RELATIONSHIP,

          objectId:
            object.identity.id,

          relationshipId:
            relationship.id,

          targetId:
            relationship.targetId,

          message:
            `Relationship ${relationship.id} from ${object.identity.id} references unavailable target ${relationship.targetId}.`,

        });

        continue;

      }

      // ------------------------------------------------------
      // EDGE DEDUPLICATION
      // ------------------------------------------------------
      //
      // Canonical relationship identity is authoritative.
      //
      // Duplicate relationship IDs do not create multiple
      // topology edges.
      //
      // ------------------------------------------------------

      if (
        edgeMap.has(
          relationship.id,
        )
      ) {

        diagnostics.push({

          type:
            KnowledgeTopologyDiagnosticType
              .DUPLICATE_EDGE,

          objectId:
            object.identity.id,

          relationshipId:
            relationship.id,

          targetId:
            relationship.targetId,

          message:
            `Duplicate Knowledge Relationship identity ${relationship.id} omitted.`,

        });

        continue;

      }

      edgeMap.set(
        relationship.id,
        projectEdge(
          object,
          relationship,
        ),
      );

    }

  }

  // ----------------------------------------------------------
  // CANONICAL OUTPUT ORDER
  // ----------------------------------------------------------

  const nodes =
    Array.from(
      nodeMap.values(),
    )
      .sort(
        compareNodes,
      );

  const edges =
    Array.from(
      edgeMap.values(),
    )
      .sort(
        compareEdges,
      );

  diagnostics.sort(
    compareDiagnostics,
  );

  // ----------------------------------------------------------
  // RESULT
  // ----------------------------------------------------------

  return {

    nodes,

    edges,

    diagnostics,

    statistics: {

      nodeCount:
        nodes.length,

      edgeCount:
        edges.length,

      diagnosticCount:
        diagnostics.length,

    },

  };

}

// ============================================================
// END
// ============================================================