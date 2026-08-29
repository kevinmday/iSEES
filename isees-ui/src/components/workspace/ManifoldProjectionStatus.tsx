// ============================================================
// src/components/workspace/ManifoldProjectionStatus.tsx
//
// P57-UI-A5-I2
// DERIVED MANIFOLD PROJECTION SYNCHRONIZATION STATUS
//
// This component owns no computational state.
//
// It compares:
//
//   Cselected = (Lselected, Tselected, Sselected)
//
// against:
//
//   Cresolved = latest ResolveExecutionRecord.input
//
// Status is therefore derived from canonical runtime evidence.
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
// STATUS
// ============================================================

const ManifoldProjectionStatusValue = {
  UNRESOLVED: "UNRESOLVED",
  RESOLVING: "RESOLVING",
  SYNCHRONIZED: "SYNCHRONIZED",
  STALE: "STALE",
  ERROR: "ERROR",
} as const;

type ManifoldProjectionStatusValue =
  (typeof ManifoldProjectionStatusValue)[
    keyof typeof ManifoldProjectionStatusValue
  ];

// ============================================================
// DETERMINISTIC STRUCTURAL EQUALITY
// ============================================================
//
// T and S remain intentionally opaque. This comparator does not
// interpret them. It only determines whether their structural
// configuration is unchanged.
//
// Unsupported object classes conservatively compare as unequal.
// That prevents the UI from claiming synchronization without
// inspectable evidence.
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

// ============================================================
// LAYER EQUALITY
// ============================================================

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
// PRESENTATION
// ============================================================

const STATUS_COLORS:
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
    "The displayed manifold was resolved from the current L, T, and S context.",
  STALE:
    "The selected L, T, or S context differs from the latest completed Resolve projection.",
  ERROR:
    "The latest Resolve execution failed. The current projection is not synchronized.",
};

// ============================================================
// COMPONENT
// ============================================================

export default function ManifoldProjectionStatus() {
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

  let projectionStatus:
    ManifoldProjectionStatusValue;

  if (
    resolveState.status ===
    ResolveRuntimeStatus.EXECUTING
  ) {
    projectionStatus =
      ManifoldProjectionStatusValue.RESOLVING;
  } else if (
    resolveState.status ===
    ResolveRuntimeStatus.ERROR
  ) {
    projectionStatus =
      ManifoldProjectionStatusValue.ERROR;
  } else if (
    latestExecution?.result === undefined
  ) {
    projectionStatus =
      ManifoldProjectionStatusValue.UNRESOLVED;
  } else {
    const resolvedInput =
      latestExecution.input;

    const contextIsSynchronized =
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

    projectionStatus =
      contextIsSynchronized
        ? ManifoldProjectionStatusValue.SYNCHRONIZED
        : ManifoldProjectionStatusValue.STALE;
  }

  return (
    <span
      aria-live="polite"
      title={
        STATUS_TITLES[
          projectionStatus
        ]
      }
      style={{
        color:
          STATUS_COLORS[
            projectionStatus
          ],
      }}
    >
      EVENT MANIFOLD: {projectionStatus}
    </span>
  );
}