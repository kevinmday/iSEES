// ============================================================
// src/manifold/layout/manifoldLayout.ts
// P45A-C2
// MANIFOLD LAYOUT ENGINE
//
// Deterministic spatial layout for Investigation Graphs.
//
// Owns:
// • Node positioning
// • Focus-centered topology geometry
// • Deterministic layout strategies
//
// Does NOT own:
// • Graph construction
// • Graph semantics
// • Selection
// • Viewport
// • Projection
// • Rendering
//
// ============================================================

import type {
  GraphEdge,
  GraphNode,
} from "../graphTypes";

// ============================================================
// TYPES
// ============================================================

export interface ManifoldLayoutOptions {

  centerNodeId?:
    string;

  orbitRadius?:
    number;

}

// ============================================================
// CIRCULAR LAYOUT
// ============================================================
//
// P45A-C2.1
//
// This initially preserves the existing deterministic circular
// layout behavior extracted from graphBuilder.ts.
//
// Future layout strategies may include:
//
// • Relationship-aware
// • Hierarchical
// • Timeline
// • Geographic
// • Constellation
// • Force-directed deterministic projection
//
// ============================================================

export function applyCircularManifoldLayout(
  nodes: GraphNode[],
  options: ManifoldLayoutOptions = {},
): GraphNode[] {

  const {
    centerNodeId,
    orbitRadius = 180,
  } = options;

  // ----------------------------------------------------------
  // COPY
  // ----------------------------------------------------------
  //
  // Layout operates on projected node copies rather than
  // mutating the canonical graph nodes supplied by the graph
  // builder.
  //
  // ----------------------------------------------------------

  const positionedNodes =
    nodes.map(
      node => ({
        ...node,
      })
    );

  // ==========================================================
  // CENTER NODE
  // ==========================================================

  const centerNode =
    centerNodeId
      ? positionedNodes.find(
          node =>
            node.id ===
            centerNodeId
        )
      : undefined;

  if (centerNode) {

    centerNode.x = 0;
    centerNode.y = 0;

  }

  // ==========================================================
  // ORBIT NODES
  // ==========================================================

  const orbitNodes =
    positionedNodes.filter(
      node =>
        node.id !==
        centerNodeId
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
  // NO CENTER NODE
  // ==========================================================

  if (!centerNodeId) {

    positionedNodes.forEach(
      (
        node,
        index
      ) => {

        const angle =
          (
            index /
            Math.max(
              positionedNodes.length,
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

  return positionedNodes;

}

// ============================================================
// RELATIONSHIP-AWARE LAYOUT
// ============================================================
//
// P45A-C3
//
// Projects semantic graph relationships into deterministic
// spatial geometry.
//
// Rules:
//
// • Focused EVENT occupies the origin.
// • Other EVENT nodes become secondary anchors.
// • Single-owner FACILITY nodes orbit their owning EVENT.
// • Multi-owner FACILITY nodes become bridge nodes positioned
//   between their connected EVENT anchors.
// • Remaining nodes receive deterministic peripheral placement.
//
// Layout reads graph topology but never modifies or invents it.
//
// ============================================================

export function applyRelationshipAwareManifoldLayout(
  nodes: GraphNode[],
  edges: GraphEdge[],
  options: ManifoldLayoutOptions = {},
): GraphNode[] {

  const {
    centerNodeId,
  } = options;

  const positionedNodes =
    nodes.map(
      node => ({
        ...node,
      })
    );

  const nodeById =
    new Map(
      positionedNodes.map(
        node => [
          node.id,
          node,
        ]
      )
    );

  // ==========================================================
  // EVENT ANCHORS
  // ==========================================================

  const eventNodes =
    positionedNodes.filter(
      node =>
        node.type === "EVENT"
    );

  const centerEvent =
    centerNodeId
      ? eventNodes.find(
          node =>
            node.id ===
            centerNodeId
        )
      : undefined;

  if (centerEvent) {

    centerEvent.x = 0;
    centerEvent.y = 0;

  }

  const secondaryEvents =
    eventNodes
      .filter(
        node =>
          node.id !==
          centerEvent?.id
      )
      .sort(
        (
          a,
          b
        ) =>
          a.id.localeCompare(
            b.id
          )
      );

   // ==========================================================
  // SECONDARY EVENT CONSTELLATION
  // ==========================================================
  //
  // Secondary events are arranged across a deterministic
  // upper arc rather than around a complete orbit.
  //
  // This preserves the focused event as the visual root of
  // the Investigation while giving related events distinct
  // spatial territories for their attached facilities.
  //
  // ==========================================================

  const eventArcRadius = 165;

  const eventArcStart =
    -Math.PI * 0.82;

  const eventArcEnd =
    -Math.PI * 0.18;

  secondaryEvents.forEach(
    (
      node,
      index
    ) => {

      const denominator =
        Math.max(
          secondaryEvents.length - 1,
          1
        );

      const progress =
        secondaryEvents.length === 1
          ? 0.5
          : index / denominator;

      const angle =
        eventArcStart +
        (
          eventArcEnd -
          eventArcStart
        ) *
        progress;

      node.x =
        Math.cos(angle) *
        eventArcRadius;

      node.y =
        Math.sin(angle) *
        eventArcRadius;

    }
  );

  // ==========================================================
  // FACILITY OWNERSHIP
  // ==========================================================

  const facilityNodes =
    positionedNodes.filter(
      node =>
        node.type === "FACILITY"
    );

  const facilityOwners =
    new Map<
      string,
      string[]
    >();

  facilityNodes.forEach(
    facility => {

      facilityOwners.set(
        facility.id,
        []
      );

    }
  );

  edges.forEach(
    edge => {

      if (
        edge.relationship !==
        "OBSERVED_AT"
      ) {
        return;
      }

      const sourceNode =
        nodeById.get(
          edge.source
        );

      const targetNode =
        nodeById.get(
          edge.target
        );

      if (
        sourceNode?.type === "EVENT" &&
        targetNode?.type === "FACILITY"
      ) {

        facilityOwners
          .get(targetNode.id)
          ?.push(sourceNode.id);

      } else if (
        sourceNode?.type === "FACILITY" &&
        targetNode?.type === "EVENT"
      ) {

        facilityOwners
          .get(sourceNode.id)
          ?.push(targetNode.id);

      }

    }
  );

  // ==========================================================
  // SINGLE-OWNER FACILITIES
  // ==========================================================

  eventNodes.forEach(
    eventNode => {

      if (
        eventNode.x === undefined ||
        eventNode.y === undefined
      ) {
        return;
      }

      const ownedFacilities =
        facilityNodes
          .filter(
            facility => {

              const owners =
                facilityOwners.get(
                  facility.id
                ) ?? [];

              return (
                owners.length === 1 &&
                owners[0] ===
                  eventNode.id
              );

            }
          )
          .sort(
            (
              a,
              b
            ) =>
              a.id.localeCompare(
                b.id
              )
          );

      if (
        ownedFacilities.length === 0
      ) {
        return;
      }

            // ------------------------------------------------------
      // OUTWARD FACILITY FAN
      // ------------------------------------------------------
      //
      // Facilities project away from the center of the
      // Investigation rather than orbiting completely around
      // their owning event.
      //
      // This gives each event a distinct visual territory and
      // reduces crossings through the focused investigation.
      //
      // The focused event uses a downward-facing fan.
      //
      // ------------------------------------------------------

      const facilityRadius = 82;

      const facilityFanWidth =
        Math.PI * 0.72;

      let outwardAngle: number;

      if (
        centerEvent &&
        eventNode.id === centerEvent.id
      ) {

        // Focused investigation:
        // project facilities downward.

        outwardAngle =
          Math.PI / 2;

      } else {

        // Secondary events:
        // project facilities away from manifold center.

        outwardAngle =
          Math.atan2(
            eventNode.y!,
            eventNode.x!
          );

      }

      ownedFacilities.forEach(
        (
          facility,
          index
        ) => {

          const denominator =
            Math.max(
              ownedFacilities.length - 1,
              1
            );

          const progress =
            ownedFacilities.length === 1
              ? 0.5
              : index / denominator;

          const angle =
            outwardAngle -
            facilityFanWidth / 2 +
            facilityFanWidth *
            progress;

          facility.x =
            eventNode.x! +
            Math.cos(angle) *
            facilityRadius;

          facility.y =
            eventNode.y! +
            Math.sin(angle) *
            facilityRadius;

        }
      );

    }
  );

  // ==========================================================
  // MULTI-OWNER / BRIDGE FACILITIES
  // ==========================================================

  facilityNodes.forEach(
    facility => {

      const owners =
        facilityOwners.get(
          facility.id
        ) ?? [];

      if (
        owners.length <= 1
      ) {
        return;
      }

      const ownerNodes =
        owners
          .map(
            ownerId =>
              nodeById.get(
                ownerId
              )
          )
          .filter(
            (
              node
            ): node is GraphNode =>
              node !== undefined &&
              node.x !== undefined &&
              node.y !== undefined
          );

      if (
        ownerNodes.length === 0
      ) {
        return;
      }

      const total =
        ownerNodes.reduce(
          (
            accumulator,
            owner
          ) => ({
            x:
              accumulator.x +
              owner.x!,
            y:
              accumulator.y +
              owner.y!,
          }),
          {
            x: 0,
            y: 0,
          }
        );

      facility.x =
        total.x /
        ownerNodes.length;

      facility.y =
        total.y /
        ownerNodes.length;

    }
  );

  // ==========================================================
  // FALLBACK NODES
  // ==========================================================

  const unpositionedNodes =
    positionedNodes
      .filter(
        node =>
          node.x === undefined ||
          node.y === undefined
      )
      .sort(
        (
          a,
          b
        ) =>
          a.id.localeCompare(
            b.id
          )
      );

  const fallbackRadius = 210;

  unpositionedNodes.forEach(
    (
      node,
      index
    ) => {

      const angle =
        (
          index /
          Math.max(
            unpositionedNodes.length,
            1
          )
        ) *
        Math.PI *
        2;

      node.x =
        Math.cos(angle) *
        fallbackRadius;

      node.y =
        Math.sin(angle) *
        fallbackRadius;

    }
  );

  return positionedNodes;

}