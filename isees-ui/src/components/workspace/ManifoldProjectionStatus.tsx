// ============================================================
// src/components/workspace/ManifoldProjectionStatus.tsx
//
// P57-UI-A5-I3
// SHARED DERIVED MANIFOLD PROJECTION STATUS
//
// Owns no computational state.
// Derives projection synchronization from WorkspaceRuntime
// and the latest ResolveRuntime execution record.
// ============================================================

import {
  useResolveRuntimeState,
} from "../../resolve/runtime/ResolveRuntimeContext";

import {
  ResolveRuntimeStatus,
} from "../../resolve/runtime/ResolveRuntimeTypes";

import {
  useWorkspaceRuntime,
} from "../../workspace/runtime/WorkspaceRuntimeContext";

// ============================================================
// STATUS CONTRACT
// ============================================================

export const ManifoldProjectionStatusValue = {
  UNRESOLVED: "UNRESOLVED",
  RESOLVING: "RESOLVING",
  SYNCHRONIZED: "SYNCHRONIZED",
  STALE: "STALE",
  ERROR: "ERROR",
} as const;

export type ManifoldProjectionStatusValue =
  (typeof ManifoldProjectionStatusValue)[
    keyof typeof ManifoldProjectionStatusValue
  ];

export interface ManifoldProjectionStatusSnapshot {
  readonly status:
    ManifoldProjectionStatusValue;

  readonly title:
    string;

  readonly selectedLayerCount:
    number;

  readonly resolvedLayerCount:
    number | undefined;

  readonly executionId:
    string | undefined;

  readonly candidateCount:
    number;

  readonly historyCount:
    number;
}

// ============================================================
// STRUCTURAL EQUALITY
// ============================================================
//
// T and S remain opaque. This function does not interpret them.
// Unsupported object classes conservatively compare unequal.
// ============================================================

function structurallyEqual(
  left: unknown,
  right: unknown,
): boolean {
  if (Object.is(left, right)) {
    return true;
  }

  if (
    left === null ||
    right === null ||
    typeof left !== "object" ||
    typeof right !== "object"
  ) {
    return false;
  }

  if (
    left instanceof Date ||
    right instanceof Date
  ) {
    return (
      left instanceof Date &&
      right instanceof Date &&
      left.getTime() === right.getTime()
    );
  }

  if (
    Array.isArray(left) ||
    Array.isArray(right)
  ) {
    if (
      !Array.isArray(left) ||
      !Array.isArray(right) ||
      left.length !== right.length
    ) {
      return false;
    }

    return left.every(
      (value, index) =>
        structurallyEqual(
          value,
          right[index],
        ),
    );
  }

  const leftPrototype =
    Object.getPrototypeOf(left);

  const rightPrototype =
    Object.getPrototypeOf(right);

  if (
    (
      leftPrototype !== Object.prototype &&
      leftPrototype !== null
    ) ||
    (
      rightPrototype !== Object.prototype &&
      rightPrototype !== null
    )
  ) {
    return false;
  }

  const leftRecord =
    left as Record<string, unknown>;

  const rightRecord =
    right as Record<string, unknown>;

  const leftKeys =
    Object.keys(leftRecord).sort();

  const rightKeys =
    Object.keys(rightRecord).sort();

  if (
    leftKeys.length !==
    rightKeys.length
  ) {
    return false;
  }

  return leftKeys.every(
    (key, index) =>
      key === rightKeys[index] &&
      structurallyEqual(
        leftRecord[key],
        rightRecord[key],
      ),
  );
}

function layersEqual(
  left: readonly string[],
  right: readonly string[],
): boolean {
  return (
    left.length === right.length &&
    left.every(
      (layer, index) =>
        layer === right[index],
    )
  );
}

// ============================================================
// PRESENTATION CONTRACT
// ============================================================

export const MANIFOLD_PROJECTION_STATUS_COLORS:
Readonly<
  Record<
    ManifoldProjectionStatusValue,
    string
  >
> = {
  UNRESOLVED: "#94a3b8",
  RESOLVING: "#7dd3fc",
  SYNCHRONIZED: "#86efac",
  STALE: "#fbbf24",
  ERROR: "#f87171",
};

const STATUS_TITLES:
Readonly<
  Record<
    ManifoldProjectionStatusValue,
    string
  >
> = {
  UNRESOLVED:
    "No completed Resolve execution exists for the current investigation.",
  RESOLVING:
    "Resolve is constructing a deterministic projection from the selected L, T, and S context.",
  SYNCHRONIZED:
    "The latest Resolve projection matches the currently selected L, T, and S context.",
  STALE:
    "The selected L, T, or S context differs from the latest completed Resolve projection.",
  ERROR:
    "The latest Resolve execution failed. The current projection is not synchronized.",
};

// ============================================================
// SHARED DERIVED STATUS HOOK
// ============================================================

export function useManifoldProjectionStatus():
ManifoldProjectionStatusSnapshot {
  const workspaceRuntime =
    useWorkspaceRuntime();

  const resolveState =
    useResolveRuntimeState();

  const selectedLayers =
    workspaceRuntime.getActiveLayers();

  const selectedTemporalContext =
    workspaceRuntime.getTemporalContext();

  const selectedInvestigativeScale =
    workspaceRuntime.getInvestigativeScale();

  const latestExecution =
    resolveState.currentExecution;

  let status:
    ManifoldProjectionStatusValue;

  if (
    resolveState.status ===
    ResolveRuntimeStatus.EXECUTING
  ) {
    status =
      ManifoldProjectionStatusValue.RESOLVING;
  } else if (
    resolveState.status ===
    ResolveRuntimeStatus.ERROR
  ) {
    status =
      ManifoldProjectionStatusValue.ERROR;
  } else if (
    latestExecution?.result === undefined
  ) {
    status =
      ManifoldProjectionStatusValue.UNRESOLVED;
  } else {
    const resolvedInput =
      latestExecution.input;

    const synchronized =
      layersEqual(
        selectedLayers,
        resolvedInput.activeLayers,
      ) &&
      structurallyEqual(
        selectedTemporalContext,
        resolvedInput.temporalContext,
      ) &&
      structurallyEqual(
        selectedInvestigativeScale,
        resolvedInput.investigativeScale,
      );

    status =
      synchronized
        ? ManifoldProjectionStatusValue.SYNCHRONIZED
        : ManifoldProjectionStatusValue.STALE;
  }

  return {
    status,

    title:
      STATUS_TITLES[status],

    selectedLayerCount:
      selectedLayers.length,

    resolvedLayerCount:
      latestExecution
        ?.input
        .activeLayers
        .length,

    executionId:
      latestExecution
        ?.executionId,

    candidateCount:
      latestExecution
        ?.result
        ?.candidateEvaluations
        .evaluations
        .length ?? 0,

    historyCount:
      resolveState.history.length,
  };
}

// ============================================================
// COMPACT SHELL PROJECTION
// ============================================================

export default function ManifoldProjectionStatus() {
  const snapshot =
    useManifoldProjectionStatus();

  return (
    <span
      aria-live="polite"
      title={snapshot.title}
      style={{
        color:
          MANIFOLD_PROJECTION_STATUS_COLORS[
            snapshot.status
          ],
      }}
    >
      EVENT MANIFOLD: {snapshot.status}
    </span>
  );
}