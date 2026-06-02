// ============================================================
// topologyStore.ts
// TOPOLOGY SNAPSHOT STATE CONTAINER
// ============================================================

import type {
  TopologySnapshot,
} from "../../types/topology";

let currentTopology: TopologySnapshot = {};

export function getTopology(): TopologySnapshot {
  return currentTopology;
}

export function setTopology(
  topology: TopologySnapshot
): void {
  currentTopology = topology;
}

export function clearTopology(): void {
  currentTopology = {};
}